import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";

const ItemDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const foundItem2 = [
    {
      id: "p1",
      name: "Aspirin Active Pharmaceutical Ingredient",
      sku: "RAW-ASP-001",
      group: "Raw Materials",
      unit: "kg",
      valuation: "$120.00",
    },
    {
      id: "p2",
      name: "Metformin Hydrochloride Pure",
      sku: "RAW-MET-500",
      group: "Raw Materials",
      unit: "kg",
      valuation: "$450.00",
    },
    {
      id: "p3",
      name: "Pharma-Grade Gelatin Shells",
      sku: "CAP-000-0",
      group: "Packaging & Excipients",
      unit: "k-units",
      valuation: "$85.00",
    },
    {
      id: "p4",
      name: "Industrial Ethanol 99%",
      sku: "SOL-ETH-99",
      group: "Solvents",
      unit: "liters",
      valuation: "$12.50",
    },
    {
      id: "p5",
      name: "Saline Solution Buffer",
      sku: "RAW-SAL-100",
      group: "Raw Materials",
      unit: "kg",
      valuation: "$5.20",
    },
    {
      id: "p6",
      name: "Amoxicillin Trihydrate",
      sku: "RAW-AMX-250",
      group: "Raw Materials",
      unit: "kg",
      valuation: "$310.00",
    },
    {
      id: "p7",
      name: "Ibuprofen USP Grade",
      sku: "RAW-IBU-400",
      group: "Raw Materials",
      unit: "kg",
      valuation: "$180.00",
    },
    {
      id: "p8",
      name: "Paracetamol Micronized",
      sku: "RAW-PAR-500",
      group: "Raw Materials",
      unit: "kg",
      valuation: "$95.00",
    },
    {
      id: "p9",
      name: "Omeprazole Pellets 8.5%",
      sku: "RAW-OME-020",
      group: "Raw Materials",
      unit: "kg",
      valuation: "$520.00",
    },
    {
      id: "p10",
      name: "Atorvastatin Calcium",
      sku: "RAW-ATO-010",
      group: "Raw Materials",
      unit: "kg",
      valuation: "$1250.00",
    },
    {
      id: "p11",
      name: "Lisinopril Dihydrate",
      sku: "RAW-LIS-005",
      group: "Raw Materials",
      unit: "kg",
      valuation: "$890.00",
    },
    {
      id: "p12",
      name: "Azithromycin Dihydrate",
      sku: "RAW-AZI-250",
      group: "Raw Materials",
      unit: "kg",
      valuation: "$640.00",
    },
    {
      id: "p13",
      name: "Sertraline Hydrochloride",
      sku: "RAW-SER-050",
      group: "Raw Materials",
      unit: "kg",
      valuation: "$720.00",
    },
    {
      id: "p14",
      name: "Amlodipine Besylate",
      sku: "RAW-AML-005",
      group: "Raw Materials",
      unit: "kg",
      valuation: "$410.00",
    },
    {
      id: "p15",
      name: "Hydrochlorothiazide",
      sku: "RAW-HCT-025",
      group: "Raw Materials",
      unit: "kg",
      valuation: "$230.00",
    },
  ];
  useEffect(() => {
    const fetchItem = async () => {
      try {
        // const response = await api.get("/api/item-master");

        const foundItem = foundItem2.find((i: any) => i.id === id);
        setItem(foundItem);
      } catch (err) {
        console.error("Item Detail Load Error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  if (isLoading)
    return (
      <div className="p-12 text-center">
        <div className="animate-spin h-6 w-6 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3"></div>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[8px]">
          Accessing Registry...
        </p>
      </div>
    );

  if (!item)
    return (
      <div className="p-12 text-center">
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[8px]">
          Item not found.
        </p>
        <button
          onClick={() => navigate("/items")}
          className="mt-4 text-emerald-600 font-bold text-xs uppercase tracking-wider"
        >
          Back to Registry
        </button>
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      <header className="flex items-center space-x-3">
        <button
          onClick={() => navigate("/items")}
          className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-500 dark:text-slate-400 shadow-sm"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </button>
        <div>
          <h1 className="text-lg md:text-xl font-black text-slate-800 dark:text-white tracking-tight">
            {item.name}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-[10px]">
            Product Specification Profile:{" "}
            <span className="font-mono text-emerald-600 dark:text-emerald-400 uppercase">
              {item.sku}
            </span>
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-800/50 px-5 py-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Master Specification
              </h3>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Item Group
                </label>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {item.group}
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Base Unit (UOM)
                </label>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {item.unit}
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Standard Valuation
                </label>
                <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                  {item.valuation}
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Registry ID
                </label>
                <p className="text-sm font-mono text-slate-500 dark:text-slate-400">
                  {item.id}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
            <h3 className="text-sm font-black text-slate-800 dark:text-white mb-4 flex items-center space-x-2">
              <svg
                className="w-4 h-4 text-emerald-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span>Technical Documentation</span>
            </h3>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed italic">
                {item.description ||
                  "No technical description provided for this specification. Please update the master registry with chemical properties and storage requirements."}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 rounded-xl shadow-xl p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[40px] rounded-full -translate-y-1/2 translate-x-1/2" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 relative z-10">
              Registry Actions
            </h3>
            <div className="space-y-3 relative z-10">
              <button className="w-full bg-white text-slate-900 py-2 rounded-lg font-black text-[10px] uppercase tracking-wider hover:bg-slate-100 transition-all shadow-lg">
                Edit Specification
              </button>
              <button className="w-full bg-slate-800 text-slate-300 py-2 rounded-lg font-black text-[10px] uppercase tracking-wider hover:bg-slate-700 transition-all border border-slate-700">
                Clone Item
              </button>
              <button className="w-full bg-red-900/20 text-red-400 py-2 rounded-lg font-black text-[10px] uppercase tracking-wider hover:bg-red-900/30 transition-all border border-red-900/30">
                Deactivate
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
              Compliance Status
            </h3>
            <div className="flex items-center space-x-3 p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg border border-emerald-100 dark:border-emerald-900/20">
              <div className="bg-emerald-500 p-1.5 rounded-md text-white">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-black text-emerald-800 dark:text-emerald-400 uppercase">
                  Verified Spec
                </p>
                <p className="text-[8px] text-emerald-600 dark:text-emerald-500">
                  GMP Compliant
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
              Registry Activity Logs
            </h3>
            <div className="space-y-4">
              <div className="flex space-x-3">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                  <div className="w-px h-full bg-slate-100 dark:bg-slate-800 mt-1"></div>
                </div>
                <div className="pb-4">
                  <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200">
                    Specification Verified
                  </p>
                  <p className="text-[8px] text-slate-500 dark:text-slate-400">
                    Quality Assurance Team • 2 days ago
                  </p>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 leading-tight">
                    All technical parameters confirmed against BP/USP standards.
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                  <div className="w-px h-full bg-slate-100 dark:bg-slate-800 mt-1"></div>
                </div>
                <div className="pb-4">
                  <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200">
                    Valuation Updated
                  </p>
                  <p className="text-[8px] text-slate-500 dark:text-slate-400">
                    Finance Dept • 1 week ago
                  </p>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 leading-tight">
                    Standard cost adjusted based on latest procurement cycles.
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200">
                    Item Registered
                  </p>
                  <p className="text-[8px] text-slate-500 dark:text-slate-400">
                    System Admin • Oct 12, 2023
                  </p>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 leading-tight">
                    Initial master record creation in PharmaFlow Registry.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetails;
