"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle, Copy, ArrowLeft, ExternalLink, Code2 } from "lucide-react";

interface EmbedPageProps {
  params: Promise<{ slug: string }>;
}

const EmbedPage: React.FC<EmbedPageProps> = ({ params }) => {
  const { slug } = React.use(params);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const publicUrl = `${origin}/forms/${slug}`;
  const embedSrc = `${publicUrl}?embed=1`;
  const embedCode = `<iframe src="${publicUrl}" width="100%" height="600" frameborder="0"></iframe>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      alert("Failed to copy embed code.");
    });
  };

  return (
    <div className="flex items-center justify-center w-full min-h-screen bg-gray-50 font-inter">
      <div className="w-full max-w-4xl p-8 bg-white rounded-2xl shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3">
              <Code2 className="w-8 h-8 text-[#0668bd]" />
              <h1 className="text-2xl font-extrabold text-[#37352f]">Embed Form</h1>
            </div>
            <p className="text-gray-600 mt-2">
              Add this form to any website with an iframe.
            </p>
          </div>
          <Link
            href={`/forms/${slug}/published`}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </Link>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-[#37352f] mb-2">
            Embed code
          </label>
          <pre className="p-4 bg-gray-900 text-gray-100 text-sm rounded-lg overflow-x-auto font-mono whitespace-pre-wrap">
            {embedCode}
          </pre>
          <button
            onClick={handleCopy}
            className="mt-3 flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0668bd] rounded-lg hover:bg-[#005BAB] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0668bd]"
          >
            {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
            {copied ? "Copied!" : "Copy to clipboard"}
          </button>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#37352f]">Preview</h2>
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm font-medium text-[#0668bd] hover:underline"
          >
            Open form in new tab
            <ExternalLink size={14} />
          </a>
        </div>

        <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
          <iframe
            src={embedSrc}
            width="100%"
            height="600"
            frameBorder="0"
            className="w-full bg-white"
            title="Form preview"
          />
        </div>
      </div>
    </div>
  );
};

export default EmbedPage;