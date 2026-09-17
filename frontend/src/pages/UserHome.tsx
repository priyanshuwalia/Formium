import React, { useEffect, useState } from "react";
import { Plus, Clock, FileText, ArrowRight, Star, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getUserForms } from "../api/forms";
import { type Form, type FormBlock } from "../types/form";
import { v4 as uuid } from "uuid";

const UserHome: React.FC = () => {
    const { user } = useAuth();
    const [recentForms, setRecentForms] = useState<Form[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchForms = async () => {
            try {
                const forms = await getUserForms();
                
                if (Array.isArray(forms)) {
                    setRecentForms(forms.slice(0, 3));
                }
            } catch (error) {
                console.error("Failed to fetch recent forms", error);
            } finally {
                setLoading(false);
            }
        };
        fetchForms();
    }, []);

    interface Template {
        title: string;
        color: string;
        blocks: FormBlock[];
    }

    const templates: Template[] = [
        {
            title: "Contact Form",
            color: "bg-blue-500",
            blocks: [
                { id: uuid(), type: 'SHORT_ANS', label: 'Full Name', value: '', required: true, order: 0 },
                { id: uuid(), type: 'EMAIL', label: 'Email Address', value: '', required: true, order: 1 },
                { id: uuid(), type: 'LONG_ANS', label: 'Message', value: '', required: true, order: 2 },
            ]
        },
        {
            title: "Event Register",
            color: "bg-purple-500",
            blocks: [
                { id: uuid(), type: 'SHORT_ANS', label: 'Name', value: '', required: true, order: 0 },
                { id: uuid(), type: 'EMAIL', label: 'Email', value: '', required: true, order: 1 },
                { id: uuid(), type: 'NUM', label: 'Number of Guests', value: '', required: false, order: 2 },
                { id: uuid(), type: 'DROPDOWN', label: 'Meal Preference', value: '', required: true, options: ['Vegetarian', 'Vegan', 'Meat'], order: 3 },
            ]
        },
        {
            title: "Feedback",
            color: "bg-green-500",
            blocks: [
                { id: uuid(), type: 'RATING', label: 'Rate your experience', value: '', required: true, order: 0 },
                { id: uuid(), type: 'LONG_ANS', label: 'What can we improve?', value: '', required: false, order: 1 },
                { id: uuid(), type: 'EMAIL', label: 'Contact Email (Optional)', value: '', required: false, order: 2 },
            ]
        },
    ];

    const handleTemplateClick = (blocks: FormBlock[]) => {
        navigate('/create-form', { state: { blocks } });
    };

    const displayName = user?.name || user?.email?.split('@')[0] || 'User';

    return (
        <div className="flex-1 p-4 lg:p-8 overflow-y-auto w-full">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900">
                    Welcome back, <span className="text-indigo-600">{displayName}</span>
                </h1>
                <p className="text-sm lg:text-base text-gray-500 mt-2">Here's what's happening with your forms today.</p>
              </div>
              <Link
                to="/create-form"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:-translate-y-0.5 hover:bg-indigo-700"
              >
                <Plus size={20} />
                Create new form
              </Link>
            </div>


            {}
            <section className="mb-10 mt-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-800">Quick Start</h2>
                    <Link to="/create-form" className="text-sm text-indigo-600 font-medium hover:underline flex items-center gap-1">
                        View all templates <ArrowRight size={16} />
                    </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Link to="/create-form" className="relative flex h-36 flex-col justify-between overflow-hidden rounded-3xl border border-indigo-200 bg-indigo-600 p-5 text-white shadow-xl shadow-indigo-500/20 transition hover:-translate-y-1 hover:bg-indigo-700 group">
                        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/15" />
                        <div className="flex items-center justify-between">
                          <div className="w-11 h-11 bg-white/15 rounded-2xl flex items-center justify-center text-white group-hover:scale-110 transition">
                              <Plus size={24} />
                          </div>
                          <Sparkles size={20} className="text-indigo-100" />
                        </div>
                        <div>
                          <span className="block text-lg font-extrabold">Create new form</span>
                          <span className="mt-1 block text-sm text-indigo-100">Start from a blank canvas</span>
                        </div>
                    </Link>
                    {templates.map((t, i) => (
                        <div
                            key={i}
                            onClick={() => handleTemplateClick(t.blocks)}
                            className="relative h-36 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition cursor-pointer group"
                        >
                            <div className={`h-2 w-full ${t.color}`}></div>
                            <div className="p-4">
                                <div className="font-semibold text-gray-800">{t.title}</div>
                                <div className="text-xs text-gray-500 mt-1">Template</div>
                            </div>
                            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="p-1.5 bg-gray-100 rounded-lg hover:bg-gray-200">
                                    <Plus size={16} className="text-gray-600" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Clock size={20} className="text-gray-400" />
                        Recent Activity
                    </h3>
                    <div className="space-y-4">
                        {loading ? (
                            <div className="flex justify-center p-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
                        ) : recentForms.length > 0 ? (
                            recentForms.map((form, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => navigate(`/forms/${form.slug}`)}
                                    className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition cursor-pointer group"
                                >
                                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-100 transition">
                                        <FileText size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900">{form.title}</div>
                                        <div className="text-xs text-gray-500">
                                            Created {new Date(form.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="text-sm font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                                        {form._count?.responses || 0} responses
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-500 py-4">
                                No forms yet. Create your first one!
                            </div>
                        )}
                    </div>
                </div>

                {}
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-2xl shadow-lg text-white">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <Star size={24} className="text-yellow-300 fill-yellow-300" />
                        </div>
                        <button className="text-xs font-medium bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full backdrop-blur-sm transition">
                            Dismiss
                        </button>
                    </div>
                    <h3 className="text-xl font-bold mb-2">Pro Tip: Logic Jumps</h3>
                    <p className="text-indigo-100 mb-6 leading-relaxed">
                        Did you know you can show or hide questions based on previous answers?
                        Try adding logic jumps to your next form to increase completion rates.
                    </p>
                    <button className="w-full py-2.5 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition shadow-sm">
                        Learn How
                    </button>
                </div>
            </section>
        </div>
    );
};

export default UserHome;
