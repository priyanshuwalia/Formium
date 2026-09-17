import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { analyzeForm, type AISummary } from "../api/ai";

const AIInsights = ({ formId }: { formId: string }) => {
  const [insights, setInsights] = useState<AISummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    setLoading(true);
    setError("");
    try {
      setInsights(await analyzeForm(formId));
    } catch (err) {
      setError(
        err instanceof Error
          ? "AI analysis is unavailable right now."
          : "Analysis failed.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-8 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-indigo-600" />
          <h3 className="font-bold text-gray-900">AI Insights</h3>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : null}
          {insights ? "Re-analyze" : "Analyze responses"}
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

      {insights && (
        <div className="mt-4 space-y-6">
          <p className="text-sm text-gray-700">
            {insights.summary}
          </p>

          {insights.themes?.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Themes
              </h4>
              <div className="flex flex-wrap gap-2">
                {insights.themes.map((t, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-white border border-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700"
                  >
                    {t.theme} · {t.mentions}
                  </span>
                ))}
              </div>
            </div>
          )}

          {insights.notableResponses?.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Notable responses
              </h4>
              <div className="space-y-3">
                {insights.notableResponses.map((n, i) => (
                  <div
                    key={i}
                    className="rounded-lg bg-white border border-gray-100 p-4"
                  >
                    <div className="text-xs font-semibold text-gray-500">
                      {n.label}
                    </div>
                    <div className="mt-1 text-sm text-gray-800">
                      {n.answer}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
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
