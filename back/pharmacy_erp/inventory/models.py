from django.db import models

# class StockMovement(models.Model):
#     MOVEMENT_TYPES = [
#         ('IN', 'Stock In'),
#         ('OUT', 'Stock Out'),
#         ('ADJ', 'Adjustment'),
#     ]

#     medicine = models.ForeignKey(Medicine, on_delete=models.CASCADE)
#     movement_type = models.CharField(max_length=10, choices=MOVEMENT_TYPES)
#     quantity = models.IntegerField()
#     created_at = models.DateTimeField(auto_now_add=True)
#     reference = models.CharField(max_length=255, blank=True)
#     created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

#     class Meta:
#         indexes = [
#             models.Index(fields=['medicine']),
#             models.Index(fields=['created_at']),
#         ]
