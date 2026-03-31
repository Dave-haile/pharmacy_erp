import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  KeyRound,
  Mail,
  Save,
  Shield,
  UserRound,
  X,
} from "lucide-react";

import { useAuth } from "../../auth/AuthContext";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";
import { useToast } from "../../hooks/useToast";
import { createUser } from "../../services/users";
import { CreateManagedUserPayload } from "../../types/types";

const initialForm: CreateManagedUserPayload = {
  email: "",
  first_name: "",
  last_name: "",
  role: "pharmacist",
  password: "",
  is_active: true,
};

const UserCreate: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();
  const { confirm } = useConfirmDialog();
  const [formData, setFormData] =
    useState<CreateManagedUserPayload>(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const isAdmin = user?.role === "admin";

  const validationErrors = useMemo(() => {
    const errors: string[] = [];

    if (!formData.email.trim()) {
      errors.push("Email is required.");
    }

    if (!formData.first_name.trim()) {
      errors.push("First name is required.");
    }

    if (!formData.last_name.trim()) {
      errors.push("Last name is required.");
    }

    if (formData.password.length < 8) {
      errors.push("Password must be at least 8 characters.");
    }

    return errors;
  }, [formData]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
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
        title: "Cannot Create User",
        message: validationErrors.map((item) => `- ${item}`).join("\n"),
        confirmLabel: "Review",
      });
      return;
    }

    setIsSaving(true);
    try {
      const created = await createUser(formData);
      showSuccess("User created successfully.");
      navigate(`/users/${created.email}`);
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
          : "Failed to create user.";
      showError(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-lg font-black text-slate-900 dark:text-white">
          Admin Access Required
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Only admins can create new users.
        </p>
        <button
          type="button"
          onClick={() => navigate("/users")}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white"
        >
          Back to Users
        </button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-center space-x-3">
        <button
          onClick={() => navigate("/users")}
          className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
            New User
          </h1>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Create an account and assign access
          </p>
        </div>
      </header>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              <UserRound className="h-3 w-3" />
              <span>First Name</span>
            </label>
            <input
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              placeholder="Amina"
            />
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              <UserRound className="h-3 w-3" />
              <span>Last Name</span>
            </label>
            <input
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              placeholder="Tesfaye"
            />
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              <Mail className="h-3 w-3" />
              <span>Email</span>
            </label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              placeholder="user@pharmaflow.com"
            />
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              <Shield className="h-3 w-3" />
              <span>Role</span>
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
            >
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="pharmacist">Pharmacist</option>
              <option value="cashier">Cashier</option>
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              <KeyRound className="h-3 w-3" />
              <span>Temporary Password</span>
            </label>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              placeholder="Minimum 8 characters"
            />
          </div>
          <div className="flex items-end">
            <label className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition-all hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 cursor-pointer">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300">
                Active account
              </span>
            </label>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/users")}
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
            <Save className="h-3.5 w-3.5" />
            {isSaving ? "Saving..." : "Create User"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserCreate;
