import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

const EmbedForm = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const publicUrl = `${origin}/forms/${slug}`;
  const embedCode = `<iframe src="${publicUrl}?embed=1" width="100%" height="600" style="border:0" title="Formium form"></iframe>`;

  const handleCopy = () => {
    navigator.clipboard
      .writeText(embedCode)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => alert("Failed to copy embed code."));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black font-inter flex items-center justify-center p-6">
      <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-gray-900 p-8 shadow-xl border border-gray-100 dark:border-gray-800">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
              Embed form
            </h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Add this form to any website with an iframe.
            </p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Back
          </button>
        </div>

        <label className="mt-6 block text-sm font-semibold text-gray-700 dark:text-gray-300">
          Embed code
        </label>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100 whitespace-pre-wrap font-mono">
          {embedCode}
        </pre>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={handleCopy}
            className="rounded-lg bg-[#0075DE] px-4 py-2 text-sm font-semibold text-white hover:bg-[#006ACD] transition-colors"
          >
            {copied ? "Copied!" : "Copy embed code"}
          </button>
          <Link
            to={`/forms/${slug}/published`}
            className="rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Back to publish page
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EmbedForm;
