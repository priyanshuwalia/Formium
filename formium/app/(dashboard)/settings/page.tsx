"use client";
import React, { useState, useEffect } from "react";
import { User, Shield, Save, Loader2, Trash2, Sparkles, CreditCard } from "lucide-react";
import { useAuth } from "@/context/auth/authContext";
import { apiFetch } from "@/services/api";
import { useRouter } from "next/navigation";

const Settings: React.FC = () => {
  const { user, refreshUser, logout } = useAuth();
  const router = useRouter();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
  const [planInfo, setPlanInfo] = useState<{
    plan: string;
    planStatus: string;
    planRenewsAt: string | null;
    limits: { forms: number; responsesPerMonth: number; fileUploads: boolean };
    usage: { forms: number };
  } | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setBio(user.bio || "");
    }
  }, [user]);

  useEffect(() => {
    apiFetch<typeof planInfo>("/billing/status")
      .then((res) => setPlanInfo(res))
      .catch(() => setPlanInfo(null));
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setSuccessMsg("");
    try {
      await apiFetch("/user", {
        method: "PUT",
        body: JSON.stringify({ name, bio }),
      });
      await refreshUser();
      setSuccessMsg("Profile updated successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (error) {
      console.error(error);
      alert("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    setBillingLoading(true);
    try {
      const { url } = await apiFetch<{ url: string }>("/billing/checkout", {
        method: "POST",
      });
      window.location.href = url;
    } catch (error) {
      console.error(error);
      alert(
        "Billing is not configured yet. Please set up Stripe keys in the environment.",
      );
      setBillingLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setBillingLoading(true);
    try {
      const { url } = await apiFetch<{ url: string }>("/billing/portal", {
        method: "POST",
      });
      window.location.href = url;
    } catch (error) {
      console.error(error);
      alert("Failed to open billing portal.");
      setBillingLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete your account? This action cannot be undone.",
      )
    )
      return;

    setDeleteLoading(true);
    try {
      await apiFetch("/user", { method: "DELETE" });
      await logout();
      router.push("/");
    } catch (error) {
      console.error(error);
      alert("Failed to delete account.");
      setDeleteLoading(false);
    }
  };

  return (
    <div className="flex-1 p-4 lg:p-8 overflow-y-auto w-full">
      { }
      <header className="mb-8 mt-12 lg:mt-0"> { }
        <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm lg:text-base text-gray-500 dark:text-gray-400 mt-2">
          Manage your account preferences and workspace settings.
        </p>
      </header>

      <div className="max-w-4xl">
        { }
        <div className="flex items-center gap-6 border-b border-gray-200 dark:border-gray-800 mb-8 overflow-x-auto">
          <button className="pb-4 border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 font-medium whitespace-nowrap">
            Profile
          </button>
        </div>

        { }
        <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 mb-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {name
                ? name.charAt(0).toUpperCase()
                : email
                  ? email.charAt(0).toUpperCase()
                  : "U"}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Profile Picture
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Upload not implemented yet (using Gravatar/Initials)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={name}
                  placeholder="Your Name"
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-3 top-2.5 text-gray-400 w-5 h-5">
                  @
                </div>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 outline-none cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Bio
            </label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full p-4 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Tell us a little about yourself..."
            ></textarea>
          </div>

          <div className="mt-8 flex items-center justify-end gap-4">
            {successMsg && (
              <span className="text-green-600 dark:text-green-400 text-sm font-medium">
                {successMsg}
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-black px-6 py-2.5 rounded-lg font-semibold transition shadow-lg shadow-indigo-500/30 disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Save size={18} />
              )}
              Save Changes
            </button>
          </div>
        </section>

        <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Sparkles className="text-indigo-500 w-6 h-6" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Plan & Billing
            </h2>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="text-2xl font-extrabold text-gray-900 dark:text-white">
                {planInfo?.plan === "PRO" ? "Pro" : "Free"} plan
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {planInfo
                  ? planInfo.plan === "PRO"
                    ? planInfo.planStatus === "active"
                      ? planInfo.planRenewsAt
                        ? `Renews on ${new Date(planInfo.planRenewsAt).toLocaleDateString()}`
                        : "Active subscription"
                      : `Status: ${planInfo.planStatus}`
                    : `${planInfo.usage.forms}/${planInfo.limits.forms} forms · ${
                        planInfo.limits.fileUploads ? "File uploads enabled" : "No file uploads (Pro only)"
                      }`
                  : "Loading plan information..."}
              </div>
            </div>

            {planInfo?.plan === "PRO" ? (
              <button
                onClick={handleManageBilling}
                disabled={billingLoading}
                className="flex items-center gap-2 whitespace-nowrap px-5 py-2.5 rounded-lg font-semibold border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-70"
              >
                {billingLoading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <CreditCard size={18} />
                )}
                Manage Billing
              </button>
            ) : (
              <button
                onClick={handleUpgrade}
                disabled={billingLoading}
                className="flex items-center gap-2 whitespace-nowrap bg-indigo-600 hover:bg-indigo-700 text-black px-5 py-2.5 rounded-lg font-semibold transition shadow-lg shadow-indigo-500/30 disabled:opacity-70"
              >
                {billingLoading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Sparkles size={18} />
                )}
                Upgrade to Pro
              </button>
            )}
          </div>

          {planInfo?.plan === "FREE" && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {planInfo.usage.forms}/{planInfo.limits.forms}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Forms used
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {planInfo.limits.responsesPerMonth === Infinity
                    ? "∞"
                    : planInfo.limits.responsesPerMonth}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Responses / month
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
                <div
                  className={`text-2xl font-bold ${
                    planInfo.limits.fileUploads
                      ? "text-green-600 dark:text-green-400"
                      : "text-gray-400"
                  }`}
                >
                  {planInfo.limits.fileUploads ? "✓" : "—"}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  File uploads
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="mt-8 border-t border-gray-200 dark:border-gray-800 pt-8">
          <h3 className="text-lg font-bold text-red-600 dark:text-red-500 mb-2 flex items-center gap-2">
            <Shield size={20} />
            Danger Zone
          </h3>
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <div className="font-medium text-red-900 dark:text-red-400">Delete Account</div>
              <div className="text-sm text-red-700 dark:text-red-300/80">
                Once you delete your account, there is no going back. Please
                be certain.
              </div>
            </div>
            <button
              onClick={handleDelete}
              disabled={deleteLoading}
              className="flex items-center gap-2 whitespace-nowrap px-4 py-2 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition"
            >
              {deleteLoading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Trash2 size={16} />
              )}
              Delete Account
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;
