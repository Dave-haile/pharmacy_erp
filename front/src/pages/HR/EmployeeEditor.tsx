import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Briefcase,
  Building,
  Calendar,
  Clipboard,
  Mail,
  PencilLine,
  Phone,
  Save,
  Upload,
  UserRound,
} from "lucide-react";

import ActionMenu from "../../components/ActionMenu";
import SearchableSelect from "../../components/SearchableSelect";
import {
  FormField,
  SelectInput,
  TextAreaInput,
  TextInput,
} from "../../components/ui/FormField";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";
import { useToast } from "../../hooks/useToast";
import {
  createEmployee,
  fetchDepartments,
  deleteEmployee,
  fetchEmployeeByNamingSeries,
  fetchEmployeeFiltersMeta,
  updateEmployee,
} from "../../services/hr";
import { Employee, EmployeeFormPayload } from "../../types/hr";

const initialForm: EmployeeFormPayload = {
  first_name: "",
  middle_name: "",
  last_name: "",
  work_email: "",
  personal_email: "",
  phone: "",
  alternate_phone: "",
  department: "",
  designation: "",
  employment_type: "full_time",
  status: "active",
  gender: "male",
  date_of_birth: null,
  hire_date: new Date().toISOString().split("T")[0],
  confirmation_date: null,
  salary: "0.00",
  manager_name: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  address: "",
  notes: "",
  profile_photo: null,
  is_active: true,
};

const getEmployeeFormData = (employee: Employee): EmployeeFormPayload => ({
  first_name: employee.first_name,
  middle_name: employee.middle_name || "",
  last_name: employee.last_name,
  work_email: employee.work_email,
  personal_email: employee.personal_email || "",
  phone: employee.phone,
  alternate_phone: employee.alternate_phone || "",
  department: employee.department,
  designation: employee.designation,
  employment_type: employee.employment_type,
  status: employee.status,
  gender: employee.gender,
  date_of_birth: employee.date_of_birth,
  hire_date: employee.hire_date,
  confirmation_date: employee.confirmation_date,
  salary: employee.salary,
  manager_name: employee.manager_name || "",
  emergency_contact_name: employee.emergency_contact_name || "",
  emergency_contact_phone: employee.emergency_contact_phone || "",
  address: employee.address || "",
  notes: employee.notes || "",
  profile_photo: null,
  is_active: employee.is_active,
});

interface EmployeeEditorLocationState {
  duplicateFormData?: EmployeeFormPayload;
  duplicatePhotoPreviewUrl?: string;
}

const EmployeeEditor: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { naming_series } = useParams();
  const isEdit = Boolean(naming_series);
  const { showError, showSuccess } = useToast();
  const { confirm } = useConfirmDialog();

  const [formData, setFormData] = useState<EmployeeFormPayload>(initialForm);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");
  const [selectedPhotoName, setSelectedPhotoName] = useState("");
  const [isEditing, setIsEditing] = useState(!isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [departmentSearch, setDepartmentSearch] = useState("");

  const isReadOnly = isEdit && !isEditing;
  const locationState = location.state as EmployeeEditorLocationState | null;

  const { data: meta } = useQuery({
    queryKey: ["employee-form-meta"],
    queryFn: fetchEmployeeFiltersMeta,
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: employee,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["employee", naming_series],
    queryFn: () => fetchEmployeeByNamingSeries(naming_series as string),
    enabled: isEdit,
    staleTime: 60 * 1000,
  });

  const { data: departmentData } = useQuery({
    queryKey: ["department-options", departmentSearch],
    queryFn: () =>
      fetchDepartments(1, 50, {
        search: departmentSearch,
      }),
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (!employee) return;

    setFormData(getEmployeeFormData(employee));
    setPhotoPreviewUrl(employee.profile_photo_url || "");
    setSelectedPhotoName("");
    setIsEditing(false);
  }, [employee]);

  useEffect(() => {
    if (isEdit || !locationState?.duplicateFormData) return;

    if (photoPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreviewUrl);
    }

    setFormData(locationState.duplicateFormData);
    setPhotoPreviewUrl(locationState.duplicatePhotoPreviewUrl || "");
    setSelectedPhotoName("");

    navigate(location.pathname, { replace: true, state: null });
    showSuccess("Employee details copied. Update unique fields before saving.");
  }, [
    isEdit,
    location.pathname,
    locationState,
    navigate,
    photoPreviewUrl,
    showSuccess,
  ]);

  useEffect(() => {
    if (!error) return;

    const errorMessage =
      error &&
      typeof error === "object" &&
      "response" in error &&
      error.response
        ? (error.response as { data?: { error?: string; message?: string } })
            ?.data?.error ||
          (error.response as { data?: { error?: string; message?: string } })
            ?.data?.message
        : "Failed to load employee.";

    showError(errorMessage);
  }, [error, showError]);

  useEffect(() => {
    return () => {
      if (photoPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(photoPreviewUrl);
      }
    };
  }, [photoPreviewUrl]);

  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (!formData.first_name.trim()) errors.push("First name is required.");
    if (!formData.last_name.trim()) errors.push("Last name is required.");
    if (!formData.work_email.trim()) errors.push("Work email is required.");
    if (!formData.phone.trim()) errors.push("Phone is required.");
    if (!formData.department.trim()) errors.push("Department is required.");
    if (!formData.designation.trim()) errors.push("Designation is required.");
    if (!formData.hire_date) errors.push("Hire date is required.");
    if (Number(formData.salary) < 0) errors.push("Salary cannot be negative.");
    return errors;
  }, [formData]);

  const departmentOptions = useMemo(
    () => {
      const options = (departmentData?.results || []).map((department) => ({
        value: department.name,
        label: department.name,
        subtitle: department.manager_name || "Department",
      }));

      if (
        formData.department &&
        !options.some((option) => option.value === formData.department)
      ) {
        options.unshift({
          value: formData.department,
          label: formData.department,
          subtitle: "Selected department",
        });
      }

      return options;
    },
    [departmentData?.results, formData.department],
  );

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = event.target;
    const nextValue =
      type === "checkbox" ? (event.target as HTMLInputElement).checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "date_of_birth" || name === "confirmation_date"
          ? nextValue || null
          : nextValue,
    }));
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;

    if (photoPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreviewUrl);
    }

    setFormData((prev) => ({
      ...prev,
      profile_photo: file,
    }));
    setSelectedPhotoName(file?.name || "");
    setPhotoPreviewUrl(
      file ? URL.createObjectURL(file) : employee?.profile_photo_url || "",
    );
  };

  const resetToEmployee = () => {
    if (!employee) return;

    if (photoPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreviewUrl);
    }

    setFormData(getEmployeeFormData(employee));
    setPhotoPreviewUrl(employee.profile_photo_url || "");
    setSelectedPhotoName("");
  };

  const handleCancelEdit = () => {
    if (!isEdit) {
      navigate("/hr/employees");
      return;
    }

    resetToEmployee();
    setIsEditing(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (isReadOnly) return;

    if (validationErrors.length > 0) {
      await confirm({
        mode: "alert",
        variant: "danger",
        title: "Cannot Save Employee",
        message: validationErrors.map((item) => `- ${item}`).join("\n"),
        confirmLabel: "Review",
      });
      return;
    }

    setIsSaving(true);
    try {
      const saved =
        isEdit && employee
          ? await updateEmployee(employee.id, formData)
          : await createEmployee(formData);

      showSuccess(
        isEdit
          ? "Employee updated successfully."
          : "Employee created successfully.",
      );
      if (isEdit) {
        setFormData(getEmployeeFormData(saved));
        setPhotoPreviewUrl(saved.profile_photo_url || "");
        setSelectedPhotoName("");
        setIsEditing(false);
      }
      navigate(`/hr/employees/${saved.naming_series}`);
    } catch (submitError) {
      const message =
        submitError &&
        typeof submitError === "object" &&
        "response" in submitError &&
        submitError.response
          ? (
              submitError.response as {
                data?: { error?: string; message?: string };
              }
            )?.data?.error ||
            (
              submitError.response as {
                data?: { error?: string; message?: string };
              }
            )?.data?.message
          : "Failed to save employee.";
      showError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!employee) return;

    const result = await confirm({
      variant: "danger",
      title: "Delete Employee",
      message:
        "This will permanently remove the employee record. Continue only if you are sure.",
      confirmLabel: "Delete",
    });

    if (!result.confirmed) return;

    setIsDeleting(true);
    try {
      await deleteEmployee(employee.id);
      showSuccess("Employee deleted successfully.");
      navigate("/hr/employees");
    } catch (deleteError) {
      const message =
        deleteError &&
        typeof deleteError === "object" &&
        "response" in deleteError &&
        deleteError.response
          ? (
              deleteError.response as {
                data?: { error?: string; message?: string };
              }
            )?.data?.error ||
            (
              deleteError.response as {
                data?: { error?: string; message?: string };
              }
            )?.data?.message
          : "Failed to delete employee.";
      showError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyRecordCode = async () => {
    if (!employee?.naming_series) return;

    try {
      await navigator.clipboard.writeText(employee.naming_series);
      showSuccess("Employee code copied.");
    } catch {
      showError("Failed to copy employee code.");
    }
  };

  const handleDuplicateEmployee = () => {
    if (!employee) return;

    navigate("/hr/employees/new", {
      state: {
        duplicateFormData: {
          ...getEmployeeFormData(employee),
          work_email: "",
          personal_email: "",
          profile_photo: null,
        },
        duplicatePhotoPreviewUrl: employee.profile_photo_url || "",
      } satisfies EmployeeEditorLocationState,
    });
  };

  const handleCopyToClipboard = async () => {
    if (!employee) return;

    const clipboardText = [
      `Employee: ${employee.full_name}`,
      `Code: ${employee.naming_series}`,
      `Department: ${employee.department}`,
      `Designation: ${employee.designation}`,
      `Status: ${employee.status_label}`,
      `Work Email: ${employee.work_email}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(clipboardText);
      showSuccess("Employee details copied to clipboard.");
    } catch {
      showError("Failed to copy employee details.");
    }
  };

  const handlePrintProfile = () => {
    if (!employee) return;

    navigate(`/print/employee/${employee.naming_series}`, {
      state: {
        documentData: employee,
        documentTitle: employee.full_name,
        documentSubtitle: "Employee profile print preview.",
        documentMeta: [
          { label: "Department", value: employee.department },
          { label: "Designation", value: employee.designation },
          { label: "Status", value: employee.status_label },
          { label: "Active", value: employee.is_active },
        ],
      },
    });
  };

  const handleShareRecord = async () => {
    if (!employee) return;

    const shareData = {
      title: `${employee.full_name} Employee Record`,
      text: `${employee.full_name} - ${employee.naming_series}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(window.location.href);
      showSuccess("Employee record link copied to clipboard.");
    } catch {
      showError("Failed to share employee record.");
    }
  };

  const handleExportEmployee = () => {
    if (!employee) return;

    const exportPayload = {
      naming_series: employee.naming_series,
      full_name: employee.full_name,
      work_email: employee.work_email,
      phone: employee.phone,
      department: employee.department,
      designation: employee.designation,
      employment_type: employee.employment_type_label,
      status: employee.status_label,
      gender: employee.gender_label,
      hire_date: employee.hire_date,
      salary: employee.salary,
      manager_name: employee.manager_name,
      emergency_contact_name: employee.emergency_contact_name,
      emergency_contact_phone: employee.emergency_contact_phone,
      address: employee.address,
      notes: employee.notes,
      exported_at: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: "application/json",
    });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `${employee.naming_series || "employee-record"}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(downloadUrl);
    showSuccess("Employee record exported.");
  };

  if (isEdit && isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Loading employee profile...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              {isEdit ? "Employee Profile" : "New Employee"}
            </h1>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              {isEdit
                ? employee?.naming_series || "Employee detail"
                : "Register a new employee"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isEdit && isReadOnly ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500"
            >
              <PencilLine className="h-3.5 w-3.5" />
              <span>Edit</span>
            </button>
          ) : (
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {isEdit ? "Cancel" : "Cancel"}
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-3.5 w-3.5" />
                <span>
                  {isSaving ? "Saving..." : isEdit ? "Save" : "Create Employee"}
                </span>
              </button>
            </div>
          )}
          {isEdit ? (
            <ActionMenu
              isOpen={isActionMenuOpen}
              onToggle={() => setIsActionMenuOpen((prev) => !prev)}
              onClose={() => setIsActionMenuOpen(false)}
              defaultActions={{
                onDuplicate: handleDuplicateEmployee,
                onCopyToClipboard: handleCopyToClipboard,
                onPrint: handlePrintProfile,
                onShareRecord: handleShareRecord,
                onExport: handleExportEmployee,
                onDelete: handleDelete,
                deleteLabel: isDeleting ? "Deleting..." : "Delete Employee",
              }}
              items={[
                {
                  key: "copy-code",
                  label: "Copy Employee Code",
                  icon: <Clipboard className="h-4 w-4" />,
                  onClick: handleCopyRecordCode,
                },
              ]}
            />
          ) : null}
        </div>
      </header>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="mb-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/40">
          <div className="flex flex-col gap-5 md:flex-row md:items-center">
            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              {photoPreviewUrl ? (
                <img
                  src={photoPreviewUrl}
                  alt={formData.first_name || "Employee"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-3xl font-black text-slate-300 dark:text-slate-700">
                  {(formData.first_name?.[0] || "E").toUpperCase()}
                </span>
              )}
            </div>

            <div className="flex-1 space-y-3">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  {isEdit
                    ? employee?.full_name || "Employee"
                    : "Employee photo"}
                </h2>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Upload a profile image for employee detail and directory
                  views.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                    isReadOnly
                      ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-500"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  }`}
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>
                    {photoPreviewUrl ? "Change Image" : "Upload Image"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    disabled={isReadOnly}
                    className="hidden"
                  />
                </label>

                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedPhotoName ||
                    (employee?.profile_photo_url
                      ? "Current image attached"
                      : "No image selected")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <section className="space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
              <UserRound className="h-4 w-4 text-emerald-500" />
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-700 dark:text-slate-200">
                Personal
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <FormField
                label="First Name"
                icon={<UserRound className="h-3 w-3" />}
                required
              >
                <TextInput
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="Amina"
                  disabled={isReadOnly}
                />
              </FormField>
              <FormField
                label="Middle Name"
                icon={<UserRound className="h-3 w-3" />}
              >
                <TextInput
                  name="middle_name"
                  value={formData.middle_name}
                  onChange={handleChange}
                  placeholder="Optional"
                  disabled={isReadOnly}
                />
              </FormField>
              <FormField
                label="Last Name"
                icon={<UserRound className="h-3 w-3" />}
                required
              >
                <TextInput
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Tesfaye"
                  disabled={isReadOnly}
                />
              </FormField>
              <FormField
                label="Gender"
                icon={<UserRound className="h-3 w-3" />}
              >
                <SelectInput
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  disabled={isReadOnly}
                >
                  {meta?.genders.map((gender) => (
                    <option key={gender.value} value={gender.value}>
                      {gender.label}
                    </option>
                  ))}
                </SelectInput>
              </FormField>
              <FormField
                label="Work Email"
                icon={<Mail className="h-3 w-3" />}
                required
              >
                <TextInput
                  name="work_email"
                  type="email"
                  value={formData.work_email}
                  onChange={handleChange}
                  placeholder="employee@company.com"
                  disabled={isReadOnly}
                />
              </FormField>
              <FormField
                label="Personal Email"
                icon={<Mail className="h-3 w-3" />}
              >
                <TextInput
                  name="personal_email"
                  type="email"
                  value={formData.personal_email}
                  onChange={handleChange}
                  placeholder="Optional"
                  disabled={isReadOnly}
                />
              </FormField>
              <FormField
                label="Phone"
                icon={<Phone className="h-3 w-3" />}
                required
              >
                <TextInput
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+251..."
                  disabled={isReadOnly}
                />
              </FormField>
              <FormField
                label="Alternate Phone"
                icon={<Phone className="h-3 w-3" />}
              >
                <TextInput
                  name="alternate_phone"
                  value={formData.alternate_phone}
                  onChange={handleChange}
                  placeholder="Optional"
                  disabled={isReadOnly}
                />
              </FormField>
              <FormField
                label="Date of Birth"
                icon={<Calendar className="h-3 w-3" />}
              >
                <TextInput
                  name="date_of_birth"
                  type="date"
                  value={formData.date_of_birth || ""}
                  onChange={handleChange}
                  disabled={isReadOnly}
                />
              </FormField>
            </div>
          </section>

          <section className="space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
              <Briefcase className="h-4 w-4 text-blue-500" />
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-700 dark:text-slate-200">
                Employment
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <FormField
                label="Department"
                icon={<Building className="h-3 w-3" />}
                required
              >
                <SearchableSelect
                  options={departmentOptions}
                  value={formData.department}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, department: value }))
                  }
                  onSearch={setDepartmentSearch}
                  placeholder="Select Department"
                  disabled={isReadOnly}
                  onCreateNew={() => navigate("/hr/departments/new")}
                  createNewText="Add Department"
                  triggerClassName="rounded-xl border-slate-200 bg-slate-50 py-3 text-sm font-bold dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
              </FormField>
              <FormField
                label="Designation"
                icon={<Briefcase className="h-3 w-3" />}
                required
              >
                <TextInput
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  list="designation-options"
                  placeholder="HR Officer"
                  disabled={isReadOnly}
                />
              </FormField>
              <FormField
                label="Employment Type"
                icon={<Briefcase className="h-3 w-3" />}
                required
              >
                <SelectInput
                  name="employment_type"
                  value={formData.employment_type}
                  onChange={handleChange}
                  disabled={isReadOnly}
                >
                  {meta?.employment_types.map((employmentType) => (
                    <option
                      key={employmentType.value}
                      value={employmentType.value}
                    >
                      {employmentType.label}
                    </option>
                  ))}
                </SelectInput>
              </FormField>
              <FormField
                label="Status"
                icon={<Briefcase className="h-3 w-3" />}
                required
              >
                <SelectInput
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={isReadOnly}
                >
                  {meta?.statuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </SelectInput>
              </FormField>
              <FormField
                label="Hire Date"
                icon={<Calendar className="h-3 w-3" />}
                required
              >
                <TextInput
                  name="hire_date"
                  type="date"
                  value={formData.hire_date}
                  onChange={handleChange}
                  disabled={isReadOnly}
                />
              </FormField>
              <FormField
                label="Confirmation Date"
                icon={<Calendar className="h-3 w-3" />}
              >
                <TextInput
                  name="confirmation_date"
                  type="date"
                  value={formData.confirmation_date || ""}
                  onChange={handleChange}
                  disabled={isReadOnly}
                />
              </FormField>
              <FormField
                label="Salary"
                icon={<Briefcase className="h-3 w-3" />}
              >
                <TextInput
                  name="salary"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.salary}
                  onChange={handleChange}
                  disabled={isReadOnly}
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
                  placeholder="Reports to"
                  disabled={isReadOnly}
                />
              </FormField>
              <FormField
                label="Emergency Contact"
                icon={<Phone className="h-3 w-3" />}
              >
                <TextInput
                  name="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={handleChange}
                  placeholder="Contact person"
                  disabled={isReadOnly}
                />
              </FormField>
              <FormField
                label="Emergency Phone"
                icon={<Phone className="h-3 w-3" />}
              >
                <TextInput
                  name="emergency_contact_phone"
                  value={formData.emergency_contact_phone}
                  onChange={handleChange}
                  placeholder="+251..."
                  disabled={isReadOnly}
                />
              </FormField>
            </div>
          </section>
        </div>

        <section className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <FormField label="Address">
            <TextAreaInput
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={4}
              placeholder="Employee address"
              disabled={isReadOnly}
            />
          </FormField>
          <FormField label="Notes">
            <TextAreaInput
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              placeholder="Internal notes"
              disabled={isReadOnly}
            />
          </FormField>
        </section>

        <div className="mt-6 flex items-center">
          <label
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
              isReadOnly
                ? "cursor-not-allowed border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800"
                : "cursor-pointer border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700"
            }`}
          >
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              disabled={isReadOnly}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300">
              Active employee
            </span>
          </label>
        </div>

        {!isReadOnly ? (
          <div className="mt-8 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {isEdit ? "Cancel Edit" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-3.5 w-3.5" />
              <span>
                {isSaving
                  ? "Saving..."
                  : isEdit
                    ? "Save Changes"
                    : "Create Employee"}
              </span>
            </button>
          </div>
        ) : null}

        <datalist id="designation-options">
          {meta?.designations.map((designation) => (
            <option key={designation} value={designation} />
          ))}
        </datalist>
      </form>
    </div>
  );
};

export default EmployeeEditor;
