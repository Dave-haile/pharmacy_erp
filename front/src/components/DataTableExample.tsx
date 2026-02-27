import React from "react";
import DataTable, { Column } from "./DataTablecopy";

interface ExampleData {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive";
  joinDate: string;
}

const DataTableExample: React.FC = () => {
  const sampleData: ExampleData[] = [
    {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      role: "Admin",
      status: "active",
      joinDate: "2023-01-15",
    },
    {
      id: "2",
      name: "Jane Smith",
      email: "jane@example.com",
      role: "User",
      status: "active",
      joinDate: "2023-02-20",
    },
    {
      id: "3",
      name: "Bob Johnson",
      email: "bob@example.com",
      role: "Manager",
      status: "inactive",
      joinDate: "2023-03-10",
    },
  ];

  const columns: Column<ExampleData>[] = [
    {
      key: "name",
      title: "Name",
      render: (value: string, row: ExampleData) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {value}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {row.email}
          </span>
        </div>
      ),
    },
    {
      key: "role",
      title: "Role",
      render: (value: string) => (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          {value}
        </span>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (value: string) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            value === "active"
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
          }`}
        >
          {value}
        </span>
      ),
    },
    {
      key: "joinDate",
      title: "Join Date",
      render: (value: string) => (
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {new Date(value).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "action",
      title: "Actions",
      align: "right",
      render: (_: unknown, _row: ExampleData) => (
        <div className="flex space-x-2 justify-end">
          <button className="px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200">
            Edit
          </button>
          <button className="px-2 py-1 text-xs font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200">
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">DataTable Example</h2>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Basic Table</h3>
          <DataTable
            data={sampleData}
            columns={columns}
            responsive={true}
            hoverable={true}
            striped={true}
          />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Compact Table</h3>
          <DataTable
            data={sampleData}
            columns={columns}
            responsive={true}
            hoverable={true}
            striped={true}
            compact={true}
          />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Table with Pagination</h3>
          <DataTable
            data={sampleData}
            columns={columns}
            responsive={true}
            hoverable={true}
            striped={true}
            pagination={{
              currentPage: 1,
              pageSize: 10,
              total: sampleData.length,
              onPageChange: (page) => console.log("Page changed to:", page),
              onPageSizeChange: (size) =>
                console.log("Page size changed to:", size),
              pageSizeOptions: [5, 10, 20],
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default DataTableExample;
