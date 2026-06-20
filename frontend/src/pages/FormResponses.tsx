import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getFormResponses } from '../api/forms';
import API from '../api/axios';
import { ChevronLeft, Calendar, FileSpreadsheet } from 'lucide-react';
import { type FormBlock } from '../types/form';

const FormResponses: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [responses, setResponses] = useState<any[]>([]);
    const [formTitle, setFormTitle] = useState("");
    const [formBlocks, setFormBlocks] = useState<FormBlock[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {

                const formRes = await API.get(`/forms/${slug}`);
                const form = formRes.data;
                setFormTitle(form.title);
                setFormBlocks(form.blocks || []);

                const res = await getFormResponses(form.id);
                setResponses(res);
            } catch (err) {
                console.error(err);
                setError("Failed to load responses");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [slug]);

    const handleExportForSheets = () => {
        const answerBlocks = formBlocks
            .filter((block) => !["DIVIDER", "H3"].includes(block.type || ""))
            .sort((a, b) => a.order - b.order);
        const headers = ["Submitted At", ...answerBlocks.map((block) => block.label || "Untitled question")];
        const rows = responses.map((response) => {
            const valuesByBlockId = new Map(
                response.items.map((item: any) => [item.blockId, item.value || ""]),
            );

            return [
                new Date(response.createdAt).toISOString(),
                ...answerBlocks.map((block) => String(valuesByBlockId.get(block.id) || "")),
            ];
        });
        const csv = [headers, ...rows].map((row) => row.map(toCsvCell).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `${slug || "form"}-responses-google-sheets.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="flex-1 p-4 lg:p-8 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="flex-1 p-4 lg:p-8 overflow-y-auto w-full">
            <header className="mb-8 mt-12 lg:mt-0 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <Link to="/forms" className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex items-center gap-1 mb-2 text-sm">
                        <ChevronLeft size={16} /> Back to Forms
                    </Link>
                    <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-white">{formTitle} <span className="text-gray-400 dark:text-gray-500 font-medium text-xl">Responses</span></h1>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {responses.length} total {responses.length === 1 ? "response" : "responses"}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={handleExportForSheets}
                    disabled={responses.length === 0}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                >
                    <FileSpreadsheet size={18} />
                    Export for Google Sheets
                </button>
            </header>

            {error ? (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">{error}</div>
            ) : responses.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 p-12 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 text-center">
                    <div className="text-gray-400 dark:text-gray-600 mb-2">No responses yet</div>
                    <p className="text-sm text-gray-500 dark:text-gray-500">Share your form link to start collecting data.</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden w-full">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                            <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                                <tr>
                                    <th className="p-4 whitespace-nowrap">Submitted At</th>
                                    <th className="p-4">Response Summary</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {responses.map((r) => (
                                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                                        <td className="p-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-gray-400" />
                                            {new Date(r.createdAt).toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-2">
                                                {r.items.slice(0, 3).map((item: any) => (
                                                    <span key={item.id} className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 px-2 py-1 rounded text-xs border border-indigo-100 dark:border-indigo-900/30">
                                                        {truncate(item.value, 30)}
                                                    </span>
                                                ))}
                                                {r.items.length > 3 && <span className="text-gray-400 text-xs">+{r.items.length - 3} more</span>}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <Link
                                                to={`/forms/${slug}/responses/${r.id}`}
                                                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium text-sm hover:underline"
                                            >
                                                View Details
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

const truncate = (str: string, n: number) => {
    return (str.length > n) ? str.substr(0, n - 1) + '...' : str;
};

const toCsvCell = (value: string) => {
    const safeValue = /^[=+\-@]/.test(value) ? `'${value}` : value;
    return `"${safeValue.replace(/"/g, '""')}"`;
};

export default FormResponses;
