
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { analyzeBatchRisk } from '../services/geminiService';

const AIAnalysis: React.FC = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [batchId, setBatchId] = useState('B22410');
  const [itemData, setItemData] = useState<any>(null);

  useEffect(() => {
    // Check if we came from the Inventory page with data
    if (location.state && location.state.item) {
      const item = location.state.item;
      setItemData(item);
      setBatchId(item.batch || item.sku);
      runAnalysis(item);
    }
  }, [location.state]);

  const runAnalysis = async (passedItem?: any) => {
    setLoading(true);
    setResult(null);

    const dataToAnalyze = passedItem || itemData || {
      id: batchId,
      product: 'Paracetamol Syrup',
      purity: 92.5,
      temperatureStability: 'Slight deviation (+2C)',
      storageHumidity: '65%',
      expiryDate: '2025-10-12',
      lastTestResult: 'Borderline'
    };

    // Enrich with default values if specific keys are missing
    const batchData = {
      batchCode: dataToAnalyze.batch || dataToAnalyze.sku || batchId,
      productName: dataToAnalyze.name || dataToAnalyze.product || 'Unknown Product',
      quantity: dataToAnalyze.qty,
      unit: dataToAnalyze.unit,
      expiryDate: dataToAnalyze.expiry || dataToAnalyze.expiryDate,
      status: dataToAnalyze.status
    };

    const analysis = await analyzeBatchRisk(batchData);
    setResult(analysis);
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-in fade-in duration-500">
      <header className="text-center space-y-1.5">
        <div className="inline-block p-2.5 bg-emerald-100 rounded-xl mb-3">
          <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">AI Batch Risk Analyzer</h1>
        <p className="text-slate-500 text-sm">Predictive quality control powered by Google Gemini</p>
      </header>

      <div className="bg-white p-5 md:p-6 rounded-2xl shadow-xl border border-slate-100">
        <div className="flex flex-col md:flex-row items-end gap-3 mb-6">
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Analyzing Batch Information</label>
            <div className="flex items-center space-x-3">
              <input
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono"
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                placeholder="e.g. B-99812"
              />
              {itemData && (
                <div className="whitespace-nowrap bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-100">
                  {itemData.name}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => runAnalysis()}
            disabled={loading}
            className="bg-slate-900 text-white text-sm px-5 py-2.5 rounded-lg font-bold hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center space-x-2"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : null}
            <span>{loading ? 'Consulting Gemini...' : 'Run Analysis'}</span>
          </button>
        </div>

        {result ? (
          <div className="space-y-4 animate-in slide-in-from-bottom duration-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center flex flex-col justify-center">
                <p className="text-xs text-slate-500 font-semibold mb-0.5 uppercase tracking-wider">Risk Score</p>
                <div className={`text-3xl md:text-4xl font-black ${result.riskScore > 50 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {result.riskScore}
                </div>
                <p className={`text-xs font-bold mt-1 ${result.riskLevel?.toLowerCase() === 'high' ? 'text-red-500' : 'text-emerald-500'}`}>
                  {result.riskLevel} Risk
                </p>
              </div>
              <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500 font-semibold mb-1.5 uppercase tracking-wider">Neural Assessment</p>
                <p className="text-slate-700 italic leading-relaxed text-sm">"{result.analysis}"</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2">
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>Recommended Mitigation Steps</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {result.mitigationSteps?.map((step: string, i: number) => (
                  <div key={i} className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-xl text-emerald-900 text-xs font-medium shadow-sm">
                    <div className="bg-emerald-200 text-emerald-700 w-6 h-6 rounded-full flex items-center justify-center mb-2 text-[10px] font-bold">
                      {i + 1}
                    </div>
                    {step}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : !loading && (
          <div className="p-12 text-center text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-2xl">
            Select a batch or use manual entry to start AI processing.
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAnalysis;
