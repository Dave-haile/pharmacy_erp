import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createSupplier } from "../../services/suppler";
import { Supplier } from "../../types/types";
import { useToast } from "../../hooks/useToast";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";
import {
  FormField,
  TextAreaInput,
  TextInput,
} from "../../components/ui/FormField";
import {
  ChevronLeft,
  Save,
  X,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";

const initialForm: Supplier = {
  name: "",
  contact_person: "",
  phone: "",
  email: "",
  address: "",
  status: "Draft",
  is_active: true,
};

const SupplierForm: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const { confirm } = useConfirmDialog();
  const duplicateSupplier = (
    location.state as { duplicateSupplier?: Supplier } | null
  )?.duplicateSupplier;
  const [formData, setFormData] = useState<Supplier>(() =>
    duplicateSupplier
      ? {
          ...initialForm,
          name: duplicateSupplier.name || "",
          contact_person: duplicateSupplier.contact_person || "",
          phone: duplicateSupplier.phone || "",
          email: duplicateSupplier.email || "",
          address: duplicateSupplier.address || "",
          is_active: duplicateSupplier.is_active ?? true,
        }
      : initialForm,
  );
  const [isSaving, setIsSaving] = useState(false);

  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    const trimmedName = (formData.name || "").trim();

    if (!trimmedName) {
      errors.push("Supplier name is required.");
    } else if (trimmedName.length > 200) {
      errors.push("Supplier name must be 200 characters or less.");
    }

    if ((formData.contact_person || "").trim().length > 150) {
      errors.push("Contact person must be 150 characters or less.");
    }

    if ((formData.phone || "").trim().length > 20) {
      errors.push("Phone number must be 20 characters or less.");
    }

    return errors;
  }, [formData]);

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = event.target;
    const nextValue =
      type === "checkbox" ? (event.target as HTMLInputElement).checked : value;

    setFormData((prev) => ({ ...prev, [name]: nextValue }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (validationErrors.length > 0) {
      await confirm({
        mode: "alert",
        variant: "danger",
        title: "Cannot Create Supplier",
        message: validationErrors.map((item) => `• ${item}`).join("\n"),
        confirmLabel: "Review",
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await createSupplier(formData);
      const created = response.supplier ?? response;
      showSuccess(response.message || "Supplier created successfully");
      navigate(`/inventory/suppliers/${created.naming_series ?? created.id}`);
    } catch (error) {
      const message =
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response
          ? (error.response as { data?: { error?: string; message?: string } })
              ?.data?.error ||
            (error.response as { data?: { error?: string; message?: string } })
              ?.data?.message
          : "Failed to create supplier.";
      showError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate("/inventory/suppliers")}
            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              New Supplier
            </h1>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Register supplier master data
            </p>
          </div>
        </div>
      </header>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <FormField
            label="Supplier Name"
            icon={<Building2 className="h-3 w-3" />}
            required
          >
            <TextInput
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Addis Pharma Trading"
            />
          </FormField>
          <FormField label="Contact Person" icon={<User className="h-3 w-3" />}>
            <TextInput
              name="contact_person"
              value={formData.contact_person}
              onChange={handleChange}
              placeholder="Primary contact name"
            />
          </FormField>
          <FormField label="Phone" icon={<Phone className="h-3 w-3" />}>
            <TextInput
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+251..."
            />
          </FormField>
          <FormField label="Email" icon={<Mail className="h-3 w-3" />}>
            <TextInput
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="supplier@example.com"
            />
          </FormField>
          <div className="flex items-end">
            <label className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition-all hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 cursor-pointer">
              <input
                type="checkbox"
                name="is_active"
                checked={!!formData.is_active}
                onChange={handleChange}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300">
                Active supplier
              </span>
            </label>
          </div>
        </div>
        <FormField
          label="Address"
          icon={<MapPin className="h-3 w-3" />}
          className="mt-6"
        >
          <TextAreaInput
            name="address"
            value={formData.address}
            onChange={handleChange}
            rows={4}
            placeholder="Supplier office address, city, country..."
          />
        </FormField>
        <div className="mt-8 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/inventory/suppliers")}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <X className="h-3.5 w-3.5" />
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {isSaving ? "Saving..." : "Create Supplier"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SupplierForm;
