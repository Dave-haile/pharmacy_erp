import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  PencilLine,
  Save,
  Text,
  UserRound,
} from "lucide-react";

import ActionMenu from "../../components/ActionMenu";
import { FormField, TextAreaInput, TextInput } from "../../components/ui/FormField";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";
import { useToast } from "../../hooks/useToast";
import {
  deleteDepartment,
  fetchDepartmentById,
  updateDepartment,
} from "../../services/hr";
import { Department, DepartmentPayload } from "../../types/hr";

const toPayload = (department: Department): DepartmentPayload => ({
  name: department.name,
  description: department.description || "",
  manager_name: department.manager_name || "",
  is_active: department.is_active,
});

const DepartmentDetails: React.FC = () => {
  const { departmentId } = useParams<{ departmentId: string }>();
  const navigate = useNavigate();
  const { confirm } = useConfirmDialog();
  const { showError, showSuccess } = useToast();
  const [department, setDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState<DepartmentPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);

  useEffect(() => {
    const loadDepartment = async () => {
      if (!departmentId) return;

      try {
        const data = await fetchDepartmentById(Number(departmentId));
        setDepartment(data);
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
            : "Failed to load department.";
        showError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void loadDepartment();
  }, [departmentId, showError]);

  const validationErrors = useMemo(() => {
    if (!formData) return [];

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
    if (!department || !formData) return;

    if (validationErrors.length > 0) {
      await confirm({
        mode: "alert",
        variant: "danger",
        title: "Cannot Save Department",
        message: validationErrors.map((item) => `- ${item}`).join("\n"),
        confirmLabel: "Review",
      });
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateDepartment(department.id, {
        ...formData,
        name: formData.name.trim(),
        manager_name: formData.manager_name.trim(),
        description: formData.description.trim(),
      });
      setDepartment(updated);
      setFormData(toPayload(updated));
      setIsEditing(false);
      showSuccess("Department updated successfully.");
    } catch (error) {
      const message =
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response
          ? (
              error.response as {
                data?: { error?: string; name?: string[] };
              }
            )?.data?.error ||
            (
              error.response as {
                data?: { error?: string; name?: string[] };
              }
            )?.data?.name?.[0]
          : "Failed to update department.";
      showError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!department) return;

    const result = await confirm({
      variant: "danger",
      title: "Delete Department",
      message:
        "This will permanently delete the department. Departments with linked employees cannot be deleted.",
      confirmLabel: "Delete",
    });

    if (!result.confirmed) return;

    setIsDeleting(true);
    try {
      await deleteDepartment(department.id);
      showSuccess("Department deleted successfully.");
      navigate("/hr/departments");
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
          : "Failed to delete department.";
      showError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicate = () => {
    if (!formData) return;

    navigate("/hr/departments/new", {
      state: {
        duplicateDepartment: {
          ...formData,
          name: "",
        },
      },
    });
  };

  const handleCopy = async () => {
    if (!department) return;

    try {
      await navigator.clipboard.writeText(
        [
          `Department: ${department.name}`,
          `Manager: ${department.manager_name || "-"}`,
          `Employees: ${department.employee_count ?? 0}`,
          `Status: ${department.is_active ? "Active" : "Inactive"}`,
        ].join("\n"),
      );
      showSuccess("Department details copied to clipboard.");
    } catch {
      showError("Failed to copy department details.");
    }
  };

  const handleShareRecord = async () => {
    if (!department) return;

    const shareData = {
      title: `${department.name} Department`,
      text: `${department.name} department record`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(window.location.href);
      showSuccess("Department record link copied to clipboard.");
    } catch {
      showError("Failed to share department record.");
    }
  };

  const handleExport = () => {
    if (!department) return;

    const exportPayload = {
      id: department.id,
      name: department.name,
      manager_name: department.manager_name,
      description: department.description,
      is_active: department.is_active,
      employee_count: department.employee_count,
      created_at: department.created_at,
      updated_at: department.updated_at,
      exported_at: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: "application/json",
    });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `${department.name || "department"}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(downloadUrl);
    showSuccess("Department record exported.");
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Loading department...
        </p>
      </div>
    );
  }

  if (!department || !formData) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Department not found.
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
            onClick={() => navigate("/hr/departments")}
            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-500">
              HR Structure
            </p>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {department.name}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {department.employee_count ?? 0} employee{department.employee_count === 1 ? "" : "s"} currently linked
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
              onDuplicate: handleDuplicate,
              onCopyToClipboard: handleCopy,
              onPrint: () => window.print(),
              onShareRecord: handleShareRecord,
              onExport: handleExport,
              onDelete: handleDelete,
              deleteLabel: isDeleting ? "Deleting..." : "Delete Department",
            }}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              label="Department Name"
              icon={<Building2 className="h-3 w-3" />}
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
              label="Manager Name"
              icon={<UserRound className="h-3 w-3" />}
            >
              <TextInput
                name="manager_name"
                value={formData.manager_name}
                onChange={handleChange}
                disabled={!isEditing}
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
                disabled={!isEditing}
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
              disabled={!isEditing}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800"
            />
            Active department
          </label>

          {isEditing ? (
            <div className="mt-8 flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setFormData(toPayload(department));
                  setIsEditing(false);
                }}
                className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
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

        <aside className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Department Summary
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400">
                  Status
                </p>
                <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">
                  {department.is_active ? "Active" : "Inactive"}
                </p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400">
                  Employee Count
                </p>
                <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">
                  {department.employee_count ?? 0}
                </p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400">
                  Created
                </p>
                <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">
                  {new Date(department.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400">
                  Last Updated
                </p>
                <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">
                  {new Date(department.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default DepartmentDetails;
