import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Trash2, Calendar, Database, Clock, ShieldCheck, CheckCircle2, Edit3, Save, X } from "lucide-react";
import { TextAreaInput, TextInput } from "../../../components/ui/FormField";
import {
  fetchLeaveTypes,
  deleteLeaveType,
  updateLeaveType,
} from "../../../services/hr";
import { LeaveType } from "../../../types/hr";

const LeaveTypeDetails: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    code: "",
    description: "",
    default_days: 1,
    is_active: true,
  });
  const { data, isLoading } = useQuery({
    queryKey: ["leave-types-detail"],
    queryFn: () => fetchLeaveTypes(true),
    staleTime: 30 * 1000,
  });
  const leaveType: LeaveType | undefined = useMemo(
    () => {
      const leaveTypes = data?.results || [];
      return leaveTypes.find((t) => String(t.code) === String(code));
    },
    [data?.results, code],
  );

  useEffect(() => {
    if (!leaveType) return;
    if (!isEditing) {
      setEditForm({
        name: leaveType.name,
        code: leaveType.code,
        description: leaveType.description,
        default_days: leaveType.default_days,
        is_active: leaveType.is_active,
      });
    }
  }, [isEditing, leaveType]);

  const update = useMutation({
    mutationFn: async () => {
      if (!leaveType) throw new Error("Leave type not loaded");
      return updateLeaveType(leaveType.id, {
        name: editForm.name,
        code: editForm.code,
        description: editForm.description,
        default_days: editForm.default_days,
        is_active: editForm.is_active,
      });
    },
    onSuccess: async (updated) => {
      await queryClient.invalidateQueries({ queryKey: ["leave-types-registry"] });
      await queryClient.invalidateQueries({ queryKey: ["leave-types-detail"] });
      setIsEditing(false);
      if (updated.code && String(updated.code) !== String(code)) {
        navigate(`/hr/leave-types/${updated.code}`, { replace: true });
      }
    },
  });

  const toggleActive = useMutation({
    mutationFn: (next: boolean) => {
      if (!leaveType) return Promise.reject(new Error("Leave type not loaded"));
      return updateLeaveType(leaveType.id, { is_active: next });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["leave-types-registry"],
      });
      await queryClient.invalidateQueries({ queryKey: ["leave-types-detail"] });
    },
  });

  const remove = useMutation({
    mutationFn: () => {
      if (!leaveType) return Promise.reject(new Error("Leave type not loaded"));
      return deleteLeaveType(leaveType.id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["leave-types-registry"],
      });
      navigate("/hr/leave-types");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Loading Configuration...
          </p>
        </div>
      </div>
    );
  }

  if (!leaveType) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">
        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <Database className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest">Type Not Found</h2>
        <button
          onClick={() => navigate("/hr/leave-types")}
          className="mt-4 inline-flex items-center space-x-2 text-blue-600 font-bold text-xs uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Registry</span>
        </button>
      </div>
    );
  }

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
            <h1 className="text-lg md:text-xl font-black text-slate-800 dark:text-white tracking-tight">{leaveType.name}</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-[10px] uppercase tracking-widest">{leaveType.code}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <>
              <button
                onClick={() => update.mutate()}
                disabled={update.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{update.isPending ? "Saving..." : "Save"}</span>
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  if (leaveType) {
                    setEditForm({
                      name: leaveType.name,
                      code: leaveType.code,
                      description: leaveType.description,
                      default_days: leaveType.default_days,
                      is_active: leaveType.is_active,
                    });
                  }
                }}
                disabled={update.isPending}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X className="h-3.5 w-3.5" />
                <span>Cancel</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Edit</span>
            </button>
          )}
          <button
            onClick={() => remove.mutate()}
            disabled={isEditing || remove.isPending}
            className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-50 transition-all shadow-sm"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete Type</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center space-x-2 mb-8">
              <ShieldCheck className="w-4 h-4 text-blue-500" />
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">General Configuration</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Leave Type Name</p>
                {isEditing ? (
                  <TextInput
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, name: e.target.value }))
                    }
                  />
                ) : (
                  <p className="text-base font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/50 px-4 py-3 rounded-xl border border-slate-100 dark:border-slate-800">{leaveType.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">System Code</p>
                {isEditing ? (
                  <TextInput
                    value={editForm.code}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, code: e.target.value }))
                    }
                  />
                ) : (
                  <p className="text-base font-mono font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/50 px-4 py-3 rounded-xl border border-slate-100 dark:border-slate-800">{leaveType.code}</p>
                )}
              </div>
              <div className="md:col-span-2 space-y-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Description & Guidance</p>
                {isEditing ? (
                  <TextAreaInput
                    rows={5}
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, description: e.target.value }))
                    }
                  />
                ) : (
                  <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/50 px-4 py-4 rounded-xl border border-slate-100 dark:border-slate-800 min-h-[120px]">
                    {leaveType.description || "No description provided for this leave type."}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center space-x-2 mb-8">
              <Clock className="w-4 h-4 text-emerald-500" />
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">Audit & System Status</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-sm">
                    <Calendar className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Last Modified</p>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      {new Date(leaveType.updated_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-5 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-2xl border border-emerald-500/10 dark:border-emerald-500/20">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Verification</p>
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">System Verified</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center space-x-2 mb-8">
              <Calendar className="w-4 h-4 text-purple-500" />
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">Allowance</h2>
            </div>
            <div className="text-center py-10 bg-slate-50 dark:bg-slate-950/50 rounded-3xl border border-slate-100 dark:border-slate-800 mb-8">
              {isEditing ? (
                <div className="max-w-[160px] mx-auto">
                  <TextInput
                    type="number"
                    min="1"
                    value={String(editForm.default_days)}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        default_days: Math.max(1, Number(e.target.value || 1)),
                      }))
                    }
                    className="text-center"
                  />
                </div>
              ) : (
                <p className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter">{leaveType.default_days}</p>
              )}
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Days Per Year</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Registry Status
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isEditing ? editForm.is_active : leaveType.is_active}
                    onChange={(e) =>
                      isEditing
                        ? setEditForm((p) => ({ ...p, is_active: e.target.checked }))
                        : toggleActive.mutate(e.target.checked)
                    }
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600 transition-all"></div>
                </label>
              </div>
              <p className="text-[9px] text-slate-400 text-center font-medium leading-relaxed">
                When inactive, this leave type will not be available for new applications.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default LeaveTypeDetails;
