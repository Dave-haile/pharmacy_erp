import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft,
  Edit2,
  FolderTree,
  GitBranch,
  Package,
  Save,
  Text,
  X,
} from "lucide-react";

import DocumentActivityLog from "../../components/common/DocumentActivityLog";
import SearchableSelect from "../../components/SearchableSelect";
import { GetErrorMessage } from "../../components/ShowErrorToast";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";
import { useToast } from "../../hooks/useToast";
import {
  fetchCategoryByNamingSeries,
  fetchCategoryLogs,
  updateCategory,
} from "../../services/categories";
import { useCategories } from "../../services/common";
import { Category, CreateCategory, Log } from "../../types/types";

const CategoryDetails: React.FC = () => {
  const { naming_series } = useParams<{ naming_series: string }>();
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const { confirm } = useConfirmDialog();
  const [parentSearch, setParentSearch] = useState("");
  const [category, setCategory] = useState<Category | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [editForm, setEditForm] = useState<CreateCategory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLogsLoading, setIsLogsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { itemGroups } = useCategories(parentSearch);

  useEffect(() => {
    const loadCategory = async () => {
      if (!naming_series) return;

      try {
        const data = await fetchCategoryByNamingSeries(naming_series);
        setCategory(data);
      } catch (error: unknown) {
        showError(GetErrorMessage(error, "category", "load"));
      } finally {
        setIsLoading(false);
      }
    };

    void loadCategory();
  }, [naming_series, showError]);

  useEffect(() => {
    const loadLogs = async () => {
      if (!category?.id) return;

      setIsLogsLoading(true);
      try {
        const data = await fetchCategoryLogs(category.id);
        setLogs(data);
      } catch (error) {
        console.error("Category logs load error", error);
      } finally {
        setIsLogsLoading(false);
      }
    };

    void loadLogs();
  }, [category?.id]);

  const validationErrors = useMemo(() => {
    if (!editForm) return [];

    const errors: string[] = [];
    const name = editForm.name.trim();
    const alias = editForm.category_name.trim();

    if (!name) {
      errors.push("Category name is required.");
    } else if (name.length > 150) {
      errors.push("Category name must be 150 characters or less.");
    }

    if (alias.length > 150) {
      errors.push("Alternative category name must be 150 characters or less.");
    }

    if (category && editForm.parent_category_id === category.id) {
      errors.push("Category cannot be its own parent.");
    }

    return errors;
  }, [category, editForm]);

  const current = isEditing && editForm ? editForm : null;

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setEditForm((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  const handleSave = async () => {
    if (!category || !editForm) return;

    if (validationErrors.length > 0) {
      await confirm({
        mode: "alert",
        variant: "danger",
        title: "Cannot Save Category",
        message: validationErrors.map((item) => `- ${item}`).join("\n"),
        confirmLabel: "Review",
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await updateCategory(category.id, editForm);
      const updated = response.category ?? response;
      setCategory(updated);
      setEditForm({
        name: updated.name || "",
        category_name: updated.category_name || "",
        description: updated.description || "",
        parent_category_id: updated.parent_category_id ?? null,
      });
      setIsEditing(false);
      showSuccess(response.message || "Category updated successfully.");
    } catch (error: unknown) {
      showError(GetErrorMessage(error, "category", "update"));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
          Loading category details...
        </p>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="p-12 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
          Category not found.
        </p>
        <button
          onClick={() => navigate("/inventory/categories")}
          className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-emerald-600 hover:underline"
        >
          Back to registry
        </button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-500 pb-20 px-4 sm:px-6 lg:px-10">
      <header className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="flex items-start space-x-5">
          <button
            onClick={() => navigate("/inventory/categories")}
            className="mt-1 rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 shadow-sm transition-all hover:bg-slate-50 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white md:text-3xl">
                {category.name}
              </h1>
              <span className="rounded-md border border-sky-500/20 bg-sky-500/10 px-2 py-1 text-[8px] font-black uppercase tracking-[0.2em] text-sky-600 dark:text-sky-400">
                Category
              </span>
            </div>
            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              Category ID #{category.id} | Registered on{" "}
              {new Date(category.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {!isEditing ? (
            <button
              onClick={() => {
                setEditForm({
                  name: category.name || "",
                  category_name: category.category_name || "",
                  description: category.description || "",
                  parent_category_id: category.parent_category_id ?? null,
                });
                setIsEditing(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-xs font-black uppercase tracking-[0.2em] text-white shadow-xl transition-all hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  setEditForm(null);
                  setIsEditing(false);
                }}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-slate-600 transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
                Discard
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-xs font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-emerald-600/20 transition-all hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        <div className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
              Linked Medicines
            </p>
            <Package className="h-4 w-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white">
            {category.medicine_count ?? 0}
          </p>
        </div>
        <div className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
              Subcategories
            </p>
            <GitBranch className="h-4 w-4 text-slate-300 group-hover:text-sky-500 transition-colors" />
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white">
            {category.child_count ?? 0}
          </p>
        </div>
        <div className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
              Parent
            </p>
            <FolderTree className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
          </div>
          <p className="text-sm font-black text-slate-900 dark:text-white">
            {category.parent_category_name || "Root Category"}
          </p>
        </div>
        <div className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
              Alias
            </p>
            <Text className="h-4 w-4 text-slate-300 group-hover:text-amber-500 transition-colors" />
          </div>
          <p className="text-sm font-black text-slate-900 dark:text-white">
            {category.category_name || "Not set"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-8">
          <section className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-8 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">
                <FolderTree className="h-4 w-4 text-emerald-500" />
                Category Master Data
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                  <FolderTree className="h-3 w-3" />
                  Category Name
                </label>
                <input
                  name="name"
                  value={current ? current.name : category.name}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-default disabled:opacity-80 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                  <Text className="h-3 w-3" />
                  Alternative Name
                </label>
                <input
                  name="category_name"
                  value={
                    current
                      ? current.category_name
                      : category.category_name || ""
                  }
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-default disabled:opacity-80 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
            <div className="mt-6 space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                <GitBranch className="h-3 w-3" />
                Parent Category
              </label>
              {isEditing ? (
                <SearchableSelect
                  options={itemGroups.filter(
                    (option) => String(option.value) !== String(category.id),
                  )}
                  value={
                    current?.parent_category_id != null
                      ? String(current.parent_category_id)
                      : ""
                  }
                  onChange={(value) =>
                    setEditForm((prev) =>
                      prev
                        ? {
                            ...prev,
                            parent_category_id: value ? Number(value) : null,
                          }
                        : prev,
                    )
                  }
                  onSearch={setParentSearch}
                  placeholder="Select Parent Category"
                  className="w-full"
                  triggerClassName="bg-slate-50 dark:bg-[#1a1d21] border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white font-bold py-2"
                />
              ) : (
                <input
                  value={category.parent_category_name || "Root Category"}
                  disabled
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600 outline-none disabled:cursor-default disabled:opacity-80 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
              )}
            </div>
            <div className="mt-6 space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                <Text className="h-3 w-3" />
                Description
              </label>
              <textarea
                name="description"
                value={
                  current ? current.description : category.description || ""
                }
                onChange={handleChange}
                disabled={!isEditing}
                rows={5}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-default disabled:opacity-80 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-slate-100 bg-emerald-600/5 p-6 dark:border-emerald-900/20 dark:bg-emerald-950/20">
            <h3 className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-emerald-900 dark:text-emerald-300">
              Category Insights
            </h3>
            <p className="text-[11px] font-medium leading-relaxed text-emerald-700/70 dark:text-emerald-400/60">
              This category currently groups {category.medicine_count ?? 0}{" "}
              medicines and contains {category.child_count ?? 0} direct
              subcategories.
            </p>
          </div>
        </aside>
      </div>

      <DocumentActivityLog
        logs={logs}
        isLoading={isLogsLoading}
        onViewAll={() => navigate("/audit-logs")}
        title="Audit Trail"
        description="Recent changes made only to this category."
      />
    </div>
  );
};

export default CategoryDetails;
