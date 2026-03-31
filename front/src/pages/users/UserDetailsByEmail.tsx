import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import {
  fetchUserByEmail,
  resetUserPassword,
  updateUser,
} from "../../services/users";
import { ManagedUser } from "../../types/types";

const formatRoleLabel = (role: string) =>
  role.charAt(0).toUpperCase() + role.slice(1);

const UserDetailsByEmail: React.FC = () => {
  const { email } = useParams<{ email: string }>();
  const resolvedEmail = decodeURIComponent(email || "");
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const { showError, showSuccess } = useToast();
  const { confirm } = useConfirmDialog();
  const [user, setUser] = useState<ManagedUser | null>(null);
  const [editForm, setEditForm] = useState<ManagedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const isAdmin = authUser?.role === "admin";
  const isOwnProfile = authUser?.email === user?.email;

  useEffect(() => {
    const loadUser = async () => {
      if (!resolvedEmail) return;

      try {
        const data = await fetchUserByEmail(resolvedEmail);
        setUser(data);
      } catch (error) {
        const message =
          error &&
          typeof error === "object" &&
          "response" in error &&
          error.response
            ? (
                error.response as {
                  data?: { error?: string; message?: string };
                }
              )?.data?.error ||
              (
                error.response as {
                  data?: { error?: string; message?: string };
                }
              )?.data?.message
            : "Failed to load user details.";
        showError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void loadUser();
  }, [resolvedEmail, showError]);

  const profileValidationErrors = useMemo(() => {
    if (!editForm) return [];

    const errors: string[] = [];
    if (!editForm.email.trim()) errors.push("Email is required.");
    if (!editForm.first_name.trim()) errors.push("First name is required.");
    if (!editForm.last_name.trim()) errors.push("Last name is required.");
    return errors;
  }, [editForm]);

  const passwordValidationErrors = useMemo(() => {
    const errors: string[] = [];

    if (!isAdmin && !passwordForm.currentPassword.trim()) {
      errors.push("Current password is required.");
    }
    if (passwordForm.newPassword.length < 8) {
      errors.push("New password must be at least 8 characters.");
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.push("Password confirmation does not match.");
    }

    return errors;
  }, [isAdmin, passwordForm]);

  const handleFieldChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = event.target;
    const nextValue =
      type === "checkbox" ? (event.target as HTMLInputElement).checked : value;

    setEditForm((prev) => (prev ? { ...prev, [name]: nextValue } : prev));
  };

  const handlePasswordFieldChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!user || !editForm) return;

    if (profileValidationErrors.length > 0) {
      await confirm({
        mode: "alert",
        variant: "danger",
        title: "Cannot Save User",
        message: profileValidationErrors.map((item) => `- ${item}`).join("\n"),
        confirmLabel: "Review",
      });
      return;
    }

    setIsSaving(true);
    try {
      const payload = isAdmin
        ? {
            email: editForm.email,
            first_name: editForm.first_name,
            last_name: editForm.last_name,
            role: editForm.role,
            is_active: editForm.is_active,
          }
        : {
            email: editForm.email,
            first_name: editForm.first_name,
            last_name: editForm.last_name,
          };

      const updated = await updateUser(user.id, payload);
      setUser(updated);
      setEditForm(updated);
      setIsEditing(false);
      showSuccess("User updated successfully.");

      if (updated.email !== resolvedEmail) {
        navigate(`/users/${updated.email}`, { replace: true });
      }
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
          : "Failed to update user.";
      showError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user) return;

    if (passwordValidationErrors.length > 0) {
      await confirm({
        mode: "alert",
        variant: "danger",
        title: "Cannot Reset Password",
        message: passwordValidationErrors.map((item) => `- ${item}`).join("\n"),
        confirmLabel: "Review",
      });
      return;
    }

    setIsResettingPassword(true);
    try {
      const response = await resetUserPassword(user.id, {
        current_password: isAdmin ? undefined : passwordForm.currentPassword,
        new_password: passwordForm.newPassword,
      });
      showSuccess(response.message);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
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
          : "Failed to reset password.";
      showError(message);
    } finally {
      setIsResettingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
          Loading user details...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-12 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
          User not found.
        </p>
      </div>
    );
  }

  const current = isEditing && editForm ? editForm : user;

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-500 pb-20 px-4 sm:px-6 lg:px-10">
      <header className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="flex items-start space-x-5">
          <button
            onClick={() => navigate("/users")}
            className="mt-1 rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 shadow-sm transition-all hover:bg-slate-50 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white md:text-3xl">
                {[user.first_name, user.last_name].filter(Boolean).join(" ") ||
                  user.email}
              </h1>
              <span className="rounded-md border border-sky-500/20 bg-sky-500/10 px-2 py-1 text-[8px] font-black uppercase tracking-[0.2em] text-sky-700 dark:text-sky-400">
                {formatRoleLabel(user.role)}
              </span>
            </div>
            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              {user.email}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {!isEditing && (
            <button
              onClick={() => {
                setEditForm(user);
                setIsEditing(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-xs font-black uppercase tracking-[0.2em] text-white shadow-xl transition-all hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              Edit
            </button>
          )}
          {isEditing && (
            <>
              <button
                onClick={() => {
                  setEditForm(user);
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
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
            Status
          </p>
          <p className="mt-3 text-xl font-black text-slate-900 dark:text-white">
            {user.is_active ? "Active" : "Inactive"}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
            Role
          </p>
          <p className="mt-3 text-xl font-black text-slate-900 dark:text-white">
            {formatRoleLabel(user.role)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
            Scope
          </p>
          <p className="mt-3 text-sm font-black text-slate-900 dark:text-white">
            {isAdmin
              ? "Admin controls this account"
              : isOwnProfile
                ? "Self-service profile"
                : "Restricted"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-8 text-sm font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">
            User Profile
          </h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                <UserRound className="h-3 w-3" />
                <span>First Name</span>
              </label>
              <input
                name="first_name"
                value={current.first_name}
                onChange={handleFieldChange}
                disabled={!isEditing}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-default disabled:opacity-80 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                <UserRound className="h-3 w-3" />
                <span>Last Name</span>
              </label>
              <input
                name="last_name"
                value={current.last_name}
                onChange={handleFieldChange}
                disabled={!isEditing}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-default disabled:opacity-80 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                <Mail className="h-3 w-3" />
                <span>Email</span>
              </label>
              <input
                name="email"
                value={current.email}
                onChange={handleFieldChange}
                disabled={!isEditing}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-default disabled:opacity-80 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                <Shield className="h-3 w-3" />
                <span>Role</span>
              </label>
              <select
                name="role"
                value={current.role}
                onChange={handleFieldChange}
                disabled={!isEditing || !isAdmin}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-default disabled:opacity-80 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              >
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="pharmacist">Pharmacist</option>
                <option value="cashier">Cashier</option>
              </select>
            </div>
            <div className="flex items-end md:col-span-2">
              <label
                className={`flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition-all dark:border-slate-800 dark:bg-slate-800 ${
                  isEditing && isAdmin
                    ? "cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                    : "cursor-default"
                }`}
              >
                <input
                  type="checkbox"
                  name="is_active"
                  checked={current.is_active}
                  onChange={handleFieldChange}
                  disabled={!isEditing || !isAdmin}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300">
                  Active account
                </span>
              </label>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-8 flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">
            <KeyRound className="h-4 w-4 text-emerald-500" />
            {isAdmin ? "Reset Password" : "Change Password"}
          </h3>
          <div className="space-y-5">
            {!isAdmin && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                  Current Password
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordFieldChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                New Password
              </label>
              <input
                type="password"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordFieldChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordFieldChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <button
              type="button"
              onClick={handlePasswordReset}
              disabled={isResettingPassword}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <KeyRound className="h-3.5 w-3.5" />
              {isResettingPassword
                ? "Saving..."
                : isAdmin
                  ? "Reset Password"
                  : "Change Password"}
            </button>
            <p className="text-[11px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">
              {isAdmin
                ? "Admins can reset passwords for any account without the current password."
                : "Non-admin users must provide their current password and cannot change their role."}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default UserDetailsByEmail;
