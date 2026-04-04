import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, Save, Text, UserRound } from "lucide-react";

import { FormField, TextAreaInput, TextInput } from "../../components/ui/FormField";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";
import { useToast } from "../../hooks/useToast";
import { createDepartment } from "../../services/hr";
import { DepartmentPayload } from "../../types/hr";

const initialForm: DepartmentPayload = {
  name: "",
  description: "",
  manager_name: "",
  is_active: true,
};

const DepartmentForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { confirm } = useConfirmDialog();
  const { showError, showSuccess } = useToast();
  const [formData, setFormData] = useState<DepartmentPayload>(
    () =>
      (
        location.state as {
          duplicateDepartment?: DepartmentPayload;
        } | null
      )?.duplicateDepartment || initialForm,
  );
  const [isSaving, setIsSaving] = useState(false);

  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (!formData.name.trim()) errors.push("Department name is required.");
    if (formData.name.trim().length > 120) {
      errors.push("Department name must be 120 characters or less.");
    }
    if (formData.manager_name.trim().length > 200) {
      errors.push("Manager name must be 200 characters or less.");
    }
    return errors;
  }, [formData]);

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (event.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (validationErrors.length > 0) {
      await confirm({
        mode: "alert",
        variant: "danger",
        title: "Cannot Create Department",
        message: validationErrors.map((item) => `- ${item}`).join("\n"),
        confirmLabel: "Review",
      });
      return;
    }

    setIsSaving(true);
    try {
      const created = await createDepartment({
        ...formData,
        name: formData.name.trim(),
        manager_name: formData.manager_name.trim(),
        description: formData.description.trim(),
      });
      showSuccess("Department created successfully.");
      navigate(`/hr/departments/${created.id}`);
    } catch (error) {
      const message =
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response
          ? (
              error.response as {
                data?: { error?: string; name?: string[]; manager_name?: string[] };
              }
            )?.data?.error ||
            (
              error.response as {
                data?: { error?: string; name?: string[]; manager_name?: string[] };
              }
            )?.data?.name?.[0] ||
            (
              error.response as {
                data?: { error?: string; name?: string[]; manager_name?: string[] };
              }
            )?.data?.manager_name?.[0]
          : "Failed to create department.";
      showError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <header className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate("/hr/departments")}
          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">
            HR Structure
          </p>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            New Department
          </h1>
        </div>
      </header>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <FormField
            label="Department Name"
            icon={<Building2 className="h-3 w-3" />}
            required
          >
            <TextInput
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Human Resources"
            />
          </FormField>
          <FormField
            label="Manager Name"
            icon={<UserRound className="h-3 w-3" />}
          >
            <TextInput
              name="manager_name"
              value={formData.manager_name}
              onChange={handleChange}
              placeholder="Optional"
            />
          </FormField>
          <FormField
            label="Description"
            icon={<Text className="h-3 w-3" />}
            className="lg:col-span-2"
          >
            <TextAreaInput
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the department's role and responsibilities..."
              rows={6}
            />
          </FormField>
        </div>

        <label className="mt-6 inline-flex items-center gap-3 text-[11px] font-bold text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            name="is_active"
            checked={formData.is_active}
            onChange={handleChange}
            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800"
          />
          Active department
        </label>

        <div className="mt-8 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/hr/departments")}
            className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{isSaving ? "Saving..." : "Create Department"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default DepartmentForm;
