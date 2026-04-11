import React, { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus, ArrowLeft, Save, X } from "lucide-react";
import {
  FormField,
  TextAreaInput,
  TextInput,
} from "../../../components/ui/FormField";
import { createLeaveType } from "../../../services/hr";
import { LeaveTypePayload } from "../../../types/hr";

const initialForm: LeaveTypePayload = {
  name: "",
  code: "",
  description: "",
  default_days: 1,
  is_active: true,
};

const LeaveTypeForm: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<LeaveTypePayload>(initialForm);

  const errors = useMemo(() => {
    const e: string[] = [];
    if (!form.name.trim()) e.push("Name is required.");
    if (!form.code.trim()) e.push("Code is required.");
    if (form.default_days < 1) e.push("Default days must be at least 1.");
    return e;
  }, [form]);

  const mutation = useMutation({
    mutationFn: createLeaveType,
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ["leave-types-registry"] });
      navigate(`/hr/leave-types/${created.code}`);
    },
  });

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500 pb-12">
      <header className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate("/hr/leave-types")}
            className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-500 dark:text-slate-400 shadow-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
          <div>
            <h1 className="text-lg md:text-xl font-black text-slate-800 dark:text-white tracking-tight">New Leave Type</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-[10px] uppercase tracking-widest">Configure Absence Category</p>
          </div>
        </div>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-10 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Leave Type Name" required>
                <TextInput
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Annual Leave, Sick Leave"
                />
              </FormField>
              <FormField label="System Code" required>
                <TextInput
                  value={form.code}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))
                  }
                  placeholder="e.g. ANNUAL, SICK"
                />
              </FormField>
            </div>

            <FormField label="Description & Internal Guidance">
              <TextAreaInput
                rows={6}
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Provide details about eligibility and usage rules for this leave type..."
              />
            </FormField>
          </div>

          <div className="space-y-6">
            <div className="p-6 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-6">
              <FormField label="Default Annual Allowance (Days)">
                <TextInput
                  type="number"
                  min="1"
                  value={String(form.default_days)}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      default_days: Math.max(1, Number(e.target.value || 1)),
                    }))
                  }
                />
              </FormField>

              <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Active in Registry
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, is_active: e.target.checked }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600 transition-all"></div>
                </label>
              </div>
            </div>

            {errors.length > 0 && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 flex items-start space-x-3">
                <Plus className="w-4 h-4 text-amber-500 rotate-45 shrink-0 mt-0.5" />
                <div className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-widest leading-relaxed">
                  {errors.join(" • ")}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => navigate("/hr/leave-types")}
            className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center space-x-2"
          >
            <X className="w-3.5 h-3.5" />
            <span>Discard</span>
          </button>
          <button
            onClick={() => mutation.mutate(form)}
            disabled={mutation.isPending || errors.length > 0}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-2.5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 transition-all"
          >
            {mutation.isPending ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            <span>{mutation.isPending ? "Configuring..." : "Register Leave Type"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaveTypeForm;
