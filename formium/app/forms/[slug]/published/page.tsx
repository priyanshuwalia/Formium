"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle, Copy, ArrowRight, Home, Code2 } from 'lucide-react';

interface PublishSuccessPageProps {
    params: Promise<{ slug: string }>;
}

const PublishSuccessPage: React.FC<PublishSuccessPageProps> = ({ params }) => {
  const { slug } = React.use(params);
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const formUrl = `${origin}/forms/${slug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(formUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      alert('Failed to copy link.');
    });
  };

  return (
    <div className="flex items-center justify-center w-full min-h-screen bg-gray-50 font-inter">
      <div className="w-full max-w-lg p-8 space-y-6 bg-white rounded-2xl shadow-lg text-center">

        {}
        <div className="flex flex-col items-center">
          <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
          <h1 className="text-3xl font-extrabold text-[#37352f]">Form Published!</h1>
          <p className="text-gray-600 mt-2">Your form is live and ready to collect responses.</p>
        </div>

        {}
        <div className="p-4 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-between gap-4">
          <p className="text-sm text-gray-700 truncate font-mono">{formUrl}</p>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0668bd] rounded-lg hover:bg-[#005BAB] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0668bd] disabled:bg-green-500"
            disabled={copied}
          >
            <Copy size={16} />
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>

        {}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href={`/forms/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 font-semibold text-white bg-gray-800 rounded-lg hover:bg-gray-900 transition-colors"
          >
            View Form <ArrowRight size={18} />
          </Link>
          <Link
            href={`/forms/${slug}/embed`}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 font-semibold text-white bg-[#0668bd] rounded-lg hover:bg-[#005BAB] transition-colors"
          >
            <Code2 size={18} />
            Embed
          </Link>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Home size={18} />
            Go to Dashboard
          </button>
        </div>

      </div>
    </div>
  );
};

export default PublishSuccessPage;
