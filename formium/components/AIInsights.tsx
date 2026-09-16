"use client";
import React, { useState } from "react";
import { Sparkles, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { apiFetch } from "@/services/api";

type AISummary = {
  summary: string;
  themes: { theme: string; mentions: number }[];
  notableResponses: { label: string; answer: string; why: string }[];
};

interface AIInsightsProps {
  formId: string;
}

const AIInsights: React.FC<AIInsightsProps> = ({ formId }) => {
  const [result, setResult] = useState<AISummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ result: AISummary }>(
        `/ai/analyze?formId=${formId}`,
      );
      setResult(res.result);
    } catch (err: any) {
      setError(err.message || "Analysis failed");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl p-6 mb-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Sparkles className="text-indigo-500 w-5 h-5" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            AI Response Intelligence
          </h2>
        </div>
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition shadow-lg shadow-indigo-500/30 disabled:opacity-70"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={16} />
          ) : result ? (
            <RefreshCw size={16} />
          ) : (
            <Sparkles size={16} />
          )}
          {result ? "Re-analyze" : "Analyze responses"}
        </button>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 rounded-lg p-3">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {loading && (
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Claude is reading your responses. This may take ~10 seconds...
        </p>
      )}

      {result && (
        <div className="mt-4 space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 mb-1">
              Summary
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {result.summary}
            </p>
          </div>

          {result.themes.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 mb-2">
                Common Themes
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.themes.map((t) => (
                  <span
                    key={t.theme}
                    className="bg-white dark:bg-gray-900 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300 px-3 py-1 rounded-full text-xs font-medium"
                  >
                    {t.theme} · {t.mentions}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.notableResponses.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 mb-2">
                Notable Responses
              </h3>
              <div className="space-y-2">
                {result.notableResponses.map((n, i) => (
                  <div
                    key={i}
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3"
                  >
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      {n.label}
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      {n.answer}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {n.why}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIInsights;