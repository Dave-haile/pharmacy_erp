import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, FolderTree, Save, Text, X } from "lucide-react";

import SearchableSelect from "../../components/SearchableSelect";
import { useToast } from "../../hooks/useToast";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";
import { createCategory } from "../../services/categories";
import { useCategories } from "../../services/common";
import { CreateCategory } from "../../types/types";

const initialForm: CreateCategory = {
  name: "",
  category_name: "",
  description: "",
  parent_category_id: null,
};

const CategoryForm: React.FC = () => {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const { confirm } = useConfirmDialog();
  const [parentSearch, setParentSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<CreateCategory>(initialForm);
  const { itemGroups } = useCategories(parentSearch);

  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    const name = formData.name.trim();
    const alias = formData.category_name.trim();

    if (!name) {
      errors.push("Category name is required.");
    } else if (name.length > 150) {
      errors.push("Category name must be 150 characters or less.");
    }

    if (alias.length > 150) {
      errors.push("Alternative category name must be 150 characters or less.");
    }

    return errors;
  }, [formData]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (validationErrors.length > 0) {
      await confirm({
        mode: "alert",
        variant: "danger",
        title: "Cannot Create Category",
        message: validationErrors.map((item) => `- ${item}`).join("\n"),
        confirmLabel: "Review",
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await createCategory(formData);
      const created = response.category ?? response;
      showSuccess(response.message || "Category created successfully");
      navigate(`/inventory/categories/${created.naming_series || created.id}`);
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
          : "Failed to create category.";
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
            onClick={() => navigate("/inventory/categories")}
            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              New Category
            </h1>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Register inventory category master data
            </p>
          </div>
        </div>
      </header>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              <FolderTree className="h-3 w-3" />
              <span>Category Name</span>
            </label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              placeholder="e.g. Antibiotics"
            />
          </div>
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              <Text className="h-3 w-3" />
              <span>Alternative Name</span>
            </label>
            <input
              name="category_name"
              value={formData.category_name}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              placeholder="Optional display alias"
            />
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <label className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            <FolderTree className="h-3 w-3" />
            <span>Parent Category</span>
          </label>
          <SearchableSelect
            options={itemGroups}
            value={
              formData.parent_category_id != null
                ? String(formData.parent_category_id)
                : ""
            }
            onChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                parent_category_id: value ? Number(value) : null,
              }))
            }
            onSearch={setParentSearch}
            placeholder="Select Parent Category"
            className="w-full"
            triggerClassName="bg-slate-50 dark:bg-[#1a1d21] border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white font-bold py-2"
          />
        </div>

        <div className="mt-6 space-y-2">
          <label className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            <Text className="h-3 w-3" />
            <span>Description</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={5}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
            placeholder="Category purpose, included items, and notes..."
          />
        </div>

        <div className="mt-8 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/inventory/categories")}
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
            {isSaving ? "Saving..." : "Create Category"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CategoryForm;
