import React, { useEffect, useState } from "react";
import { Loader2, Mail, Save, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { updateUserProfile } from "../api/user";

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setName(user?.name || "");
    setBio(user?.bio || "");
  }, [user]);

  const initials = (name || user?.email || "U").charAt(0).toUpperCase();

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const updated = await updateUserProfile({ name, bio });
      updateUser(updated);
      setMessage("Profile saved.");
      setTimeout(() => setMessage(""), 2500);
    } catch {
      setMessage("Could not save profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-[2rem] border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[2rem] bg-gradient-to-br from-indigo-500 to-purple-500 text-4xl font-extrabold text-white shadow-lg shadow-indigo-500/20">
              {initials}
            </div>
            <div className="min-w-0">
              <h1 className="text-3xl font-extrabold text-gray-950">
                {name || "Your profile"}
              </h1>
              <p className="mt-2 flex items-center gap-2 text-gray-500">
                <Mail size={16} />
                <span className="truncate">{user?.email}</span>
              </p>
            </div>
          </div>
        </div>

        <section className="mt-6 rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
          <div className="grid gap-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Full name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-12 pr-4 text-gray-950 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Bio</label>
              <textarea
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                rows={5}
                placeholder="A short note about you or your team..."
                className="w-full resize-none rounded-2xl border border-gray-200 bg-white p-4 text-gray-950 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              {message && <span className="text-sm font-medium text-gray-500">{message}</span>}
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                Save profile
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Profile;
