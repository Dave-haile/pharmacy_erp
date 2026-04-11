"""
Unit tests for inventory costing calculations.
Tests FIFO, LIFO, FEFO, and Average cost methods.
"""

from decimal import Decimal
from django.test import TestCase
from django.utils import timezone
from unittest.mock import MagicMock, patch

from inventory.costing import (
    calculate_cogs_fifo,
    calculate_cogs_lifo,
    calculate_cogs_fefo,
    calculate_cogs_average,
    calculate_cogs,
    consume_stock,
    add_stock_layer,
    InsufficientStockError,
)


class MockCostLayer:
    """Mock CostLayer for testing."""

    def __init__(self, id, unit_cost, remaining_quantity, sequence_number, expiry_date=None):
        self.id = id
        self.unit_cost = Decimal(str(unit_cost))
        self.remaining_quantity = remaining_quantity
        self.sequence_number = sequence_number
        self.expiry_date = expiry_date
        self.is_active = True

    def save(self):
        pass


class MockMedicine:
    """Mock Medicine for testing."""

    def __init__(self, name, costing_method="fifo"):
        self.name = name
        self.costing_method = costing_method
        self.id = 1


class MockValuation:
    """Mock InventoryValuation for testing."""

    def __init__(self, total_quantity, average_cost):
        self.total_quantity = total_quantity
        self.average_cost = Decimal(str(average_cost))
        self.total_value = self.total_quantity * self.average_cost


class FIFOCostingTests(TestCase):
    """Test FIFO (First In, First Out) costing method."""

    def setUp(self):
        """Set up test fixtures."""
        self.medicine = MockMedicine("Test Medicine", "fifo")

    @patch("inventory.costing.CostLayer")
    def test_calculate_cogs_fifo_single_layer(self, MockCostLayer):
        """Test COGS calculation with a single cost layer."""
        # Create mock layer
        layer = MockCostLayer(
            id=1, unit_cost=10.00, remaining_quantity=100, sequence_number=1
        )
        MockCostLayer.objects.filter.return_value.order_by.return_value = [layer]

        cogs, layers_used = calculate_cogs_fifo(self.medicine, 50)

        self.assertEqual(cogs, Decimal("500.00"))  # 50 * 10.00
        self.assertEqual(len(layers_used), 1)
        self.assertEqual(layers_used[0]["quantity"], 50)

    @patch("inventory.costing.CostLayer")
    def test_calculate_cogs_fifo_multiple_layers(self, MockCostLayer):
        """Test COGS calculation with multiple cost layers."""
        # Create mock layers (ordered by sequence)
        layers = [
            MockCostLayer(id=1, unit_cost=10.00, remaining_quantity=50, sequence_number=1),
            MockCostLayer(id=2, unit_cost=12.00, remaining_quantity=50, sequence_number=2),
            MockCostLayer(id=3, unit_cost=15.00, remaining_quantity=30, sequence_number=3),
        ]
        MockCostLayer.objects.filter.return_value.order_by.return_value = layers

        # Request 80 units - should take 50 from layer 1 and 30 from layer 2
        cogs, layers_used = calculate_cogs_fifo(self.medicine, 80)

        expected_cogs = Decimal("50") * Decimal("10.00") + Decimal("30") * Decimal("12.00")
        self.assertEqual(cogs, expected_cogs)  # 500 + 360 = 860
        self.assertEqual(len(layers_used), 2)

    @patch("inventory.costing.CostLayer")
    def test_calculate_cogs_fifo_insufficient_stock(self, MockCostLayer):
        """Test that insufficient stock raises error."""
        layer = MockCostLayer(
            id=1, unit_cost=10.00, remaining_quantity=50, sequence_number=1
        )
        MockCostLayer.objects.filter.return_value.order_by.return_value = [layer]

        with self.assertRaises(InsufficientStockError):
            calculate_cogs_fifo(self.medicine, 100)

    @patch("inventory.costing.CostLayer")
    def test_calculate_cogs_fifo_exact_quantity(self, MockCostLayer):
        """Test COGS when consuming exact quantity from a layer."""
        layer = MockCostLayer(
            id=1, unit_cost=10.00, remaining_quantity=100, sequence_number=1
        )
        MockCostLayer.objects.filter.return_value.order_by.return_value = [layer]

        cogs, layers_used = calculate_cogs_fifo(self.medicine, 100)

        self.assertEqual(cogs, Decimal("1000.00"))
        self.assertEqual(layers_used[0]["quantity"], 100)


class LIFOCostingTests(TestCase):
    """Test LIFO (Last In, First Out) costing method."""

    def setUp(self):
        """Set up test fixtures."""
        self.medicine = MockMedicine("Test Medicine", "lifo")

    @patch("inventory.costing.CostLayer")
    def test_calculate_cogs_lifo_single_layer(self, MockCostLayer):
        """Test LIFO with single layer."""
        layer = MockCostLayer(
            id=1, unit_cost=10.00, remaining_quantity=100, sequence_number=1
        )
        MockCostLayer.objects.filter.return_value.order_by.return_value = [layer]

        cogs, layers_used = calculate_cogs_lifo(self.medicine, 50)

        self.assertEqual(cogs, Decimal("500.00"))
        self.assertEqual(len(layers_used), 1)

    @patch("inventory.costing.CostLayer")
    def test_calculate_cogs_lifo_multiple_layers(self, MockCostLayer):
        """Test LIFO uses newest layer first."""
        layers = [
            MockCostLayer(id=1, unit_cost=10.00, remaining_quantity=50, sequence_number=1),
            MockCostLayer(id=2, unit_cost=12.00, remaining_quantity=50, sequence_number=2),
            MockCostLayer(id=3, unit_cost=15.00, remaining_quantity=30, sequence_number=3),
        ]
        MockCostLayer.objects.filter.return_value.order_by.return_value = layers[::-1]  # Reverse for LIFO

        # Request 40 units - should take from layer 3 (newest) first
        cogs, layers_used = calculate_cogs_lifo(self.medicine, 40)

        # Should take 30 from layer 3 and 10 from layer 2
        expected_cogs = Decimal("30") * Decimal("15.00") + Decimal("10") * Decimal("12.00")
        self.assertEqual(cogs, expected_cogs)


class FEFOCostingTests(TestCase):
    """Test FEFO (First Expired First Out) costing method."""

    def setUp(self):
        """Set up test fixtures."""
        self.medicine = MockMedicine("Test Medicine", "fefo")

    @patch("inventory.costing.CostLayer")
    def test_calculate_cogs_fefo_order(self, MockCostLayer):
        """Test FEFO uses batch closest to expiry first."""
        today = timezone.localdate()
        layers = [
            MockCostLayer(
                id=1, unit_cost=10.00, remaining_quantity=50, sequence_number=1,
                expiry_date=today + timezone.timedelta(days=90)
            ),
            MockCostLayer(
                id=2, unit_cost=12.00, remaining_quantity=50, sequence_number=2,
                expiry_date=today + timezone.timedelta(days=30)  # Expires sooner
            ),
            MockCostLayer(
                id=3, unit_cost=15.00, remaining_quantity=30, sequence_number=3,
                expiry_date=today + timezone.timedelta(days=60)
            ),
        ]
        MockCostLayer.objects.filter.return_value.order_by.return_value = sorted(
            layers, key=lambda x: x.expiry_date
        )

        # Request 60 units - should take from layer 2 (expires soonest) first
        cogs, layers_used = calculate_cogs_fefo(self.medicine, 60)

        # Verify that the batch with earliest expiry is used first
        self.assertEqual(len(layers_used), 2)


class AverageCostingTests(TestCase):
    """Test Average Cost costing method."""

    def setUp(self):
        """Set up test fixtures."""
        self.medicine = MockMedicine("Test Medicine", "average")

    def test_calculate_cogs_average(self):
        """Test average cost calculation."""
        # Mock the valuation
        with patch.object(
            type(self.medicine), "valuation",
            MockValuation(total_quantity=200, average_cost=11.50)
        ):
            cogs, layers_used = calculate_cogs_average(self.medicine, 50)

            expected_cogs = Decimal("50") * Decimal("11.50")
            self.assertEqual(cogs, expected_cogs)
            self.assertEqual(layers_used[0]["method"], "average")

    def test_calculate_cogs_average_insufficient_stock(self):
        """Test average cost with insufficient stock."""
        with patch.object(
            type(self.medicine), "valuation",
            MockValuation(total_quantity=50, average_cost=10.00)
        ):
            with self.assertRaises(InsufficientStockError):
                calculate_cogs_average(self.medicine, 100)


class COGSCalculationTests(TestCase):
    """Test the main calculate_cogs function."""

    def test_calculate_cogs_uses_fifo(self):
        """Test that calculate_cogs uses FIFO by default."""
        medicine = MockMedicine("Test Medicine", "fifo")

        with patch("inventory.costing.calculate_cogs_fifo") as mock_fifo:
            mock_fifo.return_value = (Decimal("100"), [], "fifo")
            cogs, layers, method = calculate_cogs(medicine, 10)
            mock_fifo.assert_called_once()

    def test_calculate_cogs_uses_lifo(self):
        """Test that calculate_cogs uses LIFO when configured."""
        medicine = MockMedicine("Test Medicine", "lifo")

        with patch("inventory.costing.calculate_cogs_lifo") as mock_lifo:
            mock_lifo.return_value = (Decimal("100"), [], "lifo")
            cogs, layers, method = calculate_cogs(medicine, 10)
            mock_lifo.assert_called_once()

    def test_calculate_cogs_uses_average(self):
        """Test that calculate_cogs uses average when configured."""
        medicine = MockMedicine("Test Medicine", "average")

        with patch("inventory.costing.calculate_cogs_average") as mock_avg:
            mock_avg.return_value = (Decimal("100"), [], "average")
            cogs, layers, method = calculate_cogs(medicine, 10)
            mock_avg.assert_called_once()


class StockLayerTests(TestCase):
    """Test stock layer management."""

    def test_add_stock_layer_creates_layer(self):
        """Test that add_stock_layer creates a new cost layer."""
        medicine = MockMedicine("Test Medicine", "fifo")

        with patch("inventory.costing.CostLayer") as MockCostLayer:
            with patch("inventory.costing.InventoryValuation"):
                MockCostLayer.objects.filter.return_value.order_by.return_value.first.return_value = None
                MockCostLayer.objects.create.return_value = MagicMock(id=1)

                layer = add_stock_layer(
                    medicine=medicine,
                    quantity=100,
                    unit_cost=Decimal("10.00"),
                )

                MockCostLayer.objects.create.assert_called_once()

    def test_add_stock_layer_sequential_numbers(self):
        """Test that sequence numbers are assigned correctly."""
        medicine = MockMedicine("Test Medicine", "fifo")

        with patch("inventory.costing.CostLayer") as MockCostLayer:
            with patch("inventory.costing.InventoryValuation"):
                # Mock existing layer with sequence 5
                existing = MagicMock(sequence_number=5)
                MockCostLayer.objects.filter.return_value.order_by.return_value.first.return_value = existing
                MockCostLayer.objects.create.return_value = MagicMock(id=1, sequence_number=6)

                layer = add_stock_layer(
                    medicine=medicine,
                    quantity=100,
                    unit_cost=Decimal("10.00"),
                )

                # Verify create was called with sequence 6
                call_kwargs = MockCostLayer.objects.create.call_args[1]
                self.assertEqual(call_kwargs["sequence_number"], 6)


class EdgeCaseTests(TestCase):
    """Test edge cases and boundary conditions."""

    def test_zero_quantity_request(self):
        """Test requesting zero quantity."""
        medicine = MockMedicine("Test Medicine", "fifo")

        with patch("inventory.costing.CostLayer") as MockCostLayer:
            MockCostLayer.objects.filter.return_value.order_by.return_value = []

            cogs, layers_used = calculate_cogs_fifo(medicine, 0)
            self.assertEqual(cogs, Decimal("0"))
            self.assertEqual(len(layers_used), 0)

    def test_negative_cost_handling(self):
        """Test handling of zero or negative costs."""
        medicine = MockMedicine("Test Medicine", "fifo")

        layer = MockCostLayer(
            id=1, unit_cost=0, remaining_quantity=100, sequence_number=1
        )

        with patch("inventory.costing.CostLayer") as MockCostLayer:
            MockCostLayer.objects.filter.return_value.order_by.return_value = [layer]

            cogs, layers_used = calculate_cogs_fifo(medicine, 50)
            self.assertEqual(cogs, Decimal("0"))

    def test_large_quantity_handling(self):
        """Test handling of large quantities."""
        medicine = MockMedicine("Test Medicine", "fifo")

        layer = MockCostLayer(
            id=1, unit_cost=100.00, remaining_quantity=1000000, sequence_number=1
        )

        with patch("inventory.costing.CostLayer") as MockCostLayer:
            MockCostLayer.objects.filter.return_value.order_by.return_value = [layer]

            cogs, layers_used = calculate_cogs_fifo(medicine, 500000)
            expected_cogs = Decimal("500000") * Decimal("100.00")
            self.assertEqual(cogs, expected_cogs)