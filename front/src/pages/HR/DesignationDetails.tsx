import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Briefcase, Building2, PencilLine, Save, Text } from "lucide-react";

import ActionMenu from "../../components/ActionMenu";
import SearchableSelect from "../../components/SearchableSelect";
import { FormField, TextAreaInput, TextInput } from "../../components/ui/FormField";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";
import { useToast } from "../../hooks/useToast";
import {
  deleteDesignation,
  fetchDepartments,
  fetchDesignationById,
  updateDesignation,
} from "../../services/hr";
import { Designation, DesignationPayload } from "../../types/hr";

const toPayload = (designation: Designation): DesignationPayload => ({
  name: designation.name,
  department: designation.department || null,
  description: designation.description || "",
  is_active: designation.is_active,
});

const DesignationDetails: React.FC = () => {
  const { designationId } = useParams<{ designationId: string }>();
  const navigate = useNavigate();
  const { confirm } = useConfirmDialog();
  const { showError, showSuccess } = useToast();
  const [designation, setDesignation] = useState<Designation | null>(null);
  const [formData, setFormData] = useState<DesignationPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [departmentSearch, setDepartmentSearch] = useState("");

  const { data: departmentData } = useQuery({
    queryKey: ["designation-detail-departments", departmentSearch],
    queryFn: () => fetchDepartments(1, 50, { search: departmentSearch }),
    staleTime: 60 * 1000,
  });

  const departmentOptions = useMemo(
    () =>
      (departmentData?.results || []).map((department) => ({
        value: department.name,
        label: department.name,
        subtitle: department.manager_name || "Department",
      })),
    [departmentData?.results],
  );

  useEffect(() => {
    const loadDesignation = async () => {
      if (!designationId) return;

      try {
        const data = await fetchDesignationById(Number(designationId));
        setDesignation(data);
        setFormData(toPayload(data));
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
            : "Failed to load designation.";
        showError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void loadDesignation();
  }, [designationId, showError]);

  const validationErrors = useMemo(() => {
    if (!formData) return [];

    const errors: string[] = [];
    if (!formData.name.trim()) errors.push("Designation name is required.");
    if (formData.name.trim().length > 120) {
      errors.push("Designation name must be 120 characters or less.");
    }
    return errors;
  }, [formData]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = event.target;
    setFormData((prev) =>
      prev
        ? {
            ...prev,
            [name]:
              type === "checkbox"
                ? (event.target as HTMLInputElement).checked
                : value,
          }
        : prev,
    );
  };

  const handleSave = async () => {
    if (!designation || !formData) return;

    if (validationErrors.length > 0) {
      await confirm({
        mode: "alert",
        variant: "danger",
        title: "Cannot Save Designation",
        message: validationErrors.map((item) => `- ${item}`).join("\n"),
        confirmLabel: "Review",
      });
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateDesignation(designation.id, {
        ...formData,
        name: formData.name.trim(),
        description: formData.description.trim(),
      });
      setDesignation(updated);
      setFormData(toPayload(updated));
      setIsEditing(false);
      showSuccess("Designation updated successfully.");
    } catch (error) {
      const message =
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response
          ? (error.response as { data?: { error?: string; name?: string[] } })
              ?.data?.error ||
            (error.response as { data?: { error?: string; name?: string[] } })
              ?.data?.name?.[0]
          : "Failed to update designation.";
      showError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!designation) return;

    const result = await confirm({
      variant: "danger",
      title: "Delete Designation",
      message:
        "This will permanently delete the designation. Linked designations cannot be deleted.",
      confirmLabel: "Delete",
    });

    if (!result.confirmed) return;

    setIsDeleting(true);
    try {
      await deleteDesignation(designation.id);
      showSuccess("Designation deleted successfully.");
      navigate("/hr/designations");
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
          : "Failed to delete designation.";
      showError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Loading designation...
        </p>
      </div>
    );
  }

  if (!designation || !formData) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Designation not found.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate("/hr/designations")}
            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-500">
              HR Structure
            </p>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {designation.name}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {designation.employee_count ?? 0} employee
              {designation.employee_count === 1 ? "" : "s"} currently linked
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500"
            >
              <PencilLine className="h-3.5 w-3.5" />
              <span>Edit</span>
            </button>
          ) : null}
          <ActionMenu
            isOpen={isActionMenuOpen}
            onToggle={() => setIsActionMenuOpen((prev) => !prev)}
            onClose={() => setIsActionMenuOpen(false)}
            defaultActions={{
              onDelete: handleDelete,
              deleteLabel: isDeleting ? "Deleting..." : "Delete Designation",
            }}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              label="Designation Name"
              icon={<Briefcase className="h-3 w-3" />}
              required
            >
              <TextInput
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </FormField>
            <FormField
              label="Department"
              icon={<Building2 className="h-3 w-3" />}
            >
              <SearchableSelect
                options={departmentOptions}
                value={formData.department || ""}
                onChange={(value) =>
                  setFormData((prev) =>
                    prev ? { ...prev, department: value || null } : prev,
                  )
                }
                onSearch={setDepartmentSearch}
                placeholder="Optional department"
                disabled={!isEditing}
                triggerClassName="rounded-xl border-slate-200 bg-slate-50 py-3 text-sm font-bold dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </FormField>
            <FormField
              label="Description"
              icon={<Text className="h-3 w-3" />}
              className="md:col-span-2"
            >
              <TextAreaInput
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={6}
                disabled={!isEditing}
              />
            </FormField>
          </div>

          <label className="mt-6 inline-flex items-center gap-3 text-[11px] font-bold text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              disabled={!isEditing}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800"
            />
            Active designation
          </label>

          {isEditing ? (
            <div className="mt-8 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setFormData(toPayload(designation));
                  setIsEditing(false);
                }}
                className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel Edit
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{isSaving ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Department
              </p>
              <p className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                {designation.department || "All departments"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Linked Employees
              </p>
              <p className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                {designation.employee_count ?? 0}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Status
              </p>
              <p className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                {designation.is_active ? "Active" : "Inactive"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignationDetails;
