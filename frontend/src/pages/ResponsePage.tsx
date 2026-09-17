import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import API from "../api/axios";
import { type FormBlock } from "../types/form";
import MadeWithFormium from "../components/MadeWithFormBuddy";
import { uploadFile } from "../api/upload";

interface FullForm {
  id: string;
  title: string;
  slug: string;
  description?: string;
  successText?: string;
  blocks: FormBlock[];
}

type ResponsesState = Record<string, string | string[] | number | null>;

const ResponsePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const isEmbed = searchParams.get("embed") === "1";

  const [form, setForm] = useState<FullForm | null>(null);
  const [responses, setResponses] = useState<ResponsesState>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [uploadingBlockId, setUploadingBlockId] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setError("No form identifier provided.");
      setLoading(false);
      return;
    }

    const fetchForm = async () => {
      try {
        setLoading(true);

        const response = await API.get(`/forms/${slug}`);
        setForm(response.data);

        const initialResponses: ResponsesState = {};
        response.data.blocks.forEach((block: FormBlock) => {
          initialResponses[block.id] = block.type === "CHECKBOXES" ? [] : "";
        });
        setResponses(initialResponses);
      } catch (err) {
        console.error("Failed to fetch form:", err);
        setError("Form not found or an error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [slug]);

  const handleInputChange = (blockId: string, value: string | string[]) => {
    setResponses((prev) => ({
      ...prev,
      [blockId]: value,
    }));
  };

  const shouldShowBlock = (
    block: FormBlock,
    currentResponses: ResponsesState,
  ): boolean => {
    if (!block.logic || block.logic.length === 0) return true;
    const showRules = block.logic.filter((rule) => !rule.jumpToBlockId);
    if (showRules.length === 0) return true;
    return showRules.some((rule) => {
      const answer = currentResponses[rule.triggerBlockId];
      const values = Array.isArray(answer) ? answer : [String(answer || "")];
      return values.some((value) => value.toLowerCase() === rule.triggerValue.toLowerCase());
    });
  };

  const answerMatches = (
    answer: ResponsesState[string],
    triggerValue: string,
  ) => {
    const values = Array.isArray(answer) ? answer : [String(answer || "")];
    return values.some((value) => value.toLowerCase() === triggerValue.toLowerCase());
  };

  const getVisibleBlocks = (blocks: FormBlock[]) => {
    const visibleByCondition = blocks.filter((block) =>
      shouldShowBlock(block, responses),
    );
    const visibleIds = new Set(visibleByCondition.map((block) => block.id));
    const output: FormBlock[] = [];
    let skippingTo: string | null = null;

    for (const block of visibleByCondition) {
      if (skippingTo && block.id !== skippingTo) continue;
      if (skippingTo === block.id) skippingTo = null;

      output.push(block);

      const jumpRule = (block.logic || []).find(
        (rule) =>
          rule.jumpToBlockId &&
          visibleIds.has(rule.jumpToBlockId) &&
          answerMatches(responses[block.id], rule.triggerValue),
      );

      if (jumpRule?.jumpToBlockId) {
        skippingTo = jumpRule.jumpToBlockId;
      }
    }

    return output;
  };

  const handleFileChange = async (
    blockId: string,
    file: File | undefined,
  ) => {
    if (!file) {
      handleInputChange(blockId, "");
      return;
    }

    setUploadingBlockId(blockId);
    setError(null);
    try {
      const key = await uploadFile(form!.id, file);
      handleInputChange(blockId, key);
    } catch (err) {
      console.error("Upload failed:", err);
      setError("Failed to upload file. Please try again.");
    } finally {
      setUploadingBlockId(null);
    }
  };

  const handleCheckboxChange = (
    blockId: string,
    option: string,
    checked: boolean,
  ) => {
    const currentValues = (responses[blockId] as string[]) || [];
    const newValues = checked
      ? [...currentValues, option]
      : currentValues.filter((item) => item !== option);
    handleInputChange(blockId, newValues);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const visibleBlocks = getVisibleBlocks(form?.blocks || []);

    const payload = {
      formId: form?.id,
      items: visibleBlocks.map((block) => ({
        blockId: block.id,
        value: Array.isArray(responses[block.id])
          ? (responses[block.id] as string[]).join(", ")
          : String(responses[block.id] || ""),
      })),
    };

    try {
      await API.post("/response", payload);
      setSubmitted(true);
    } catch (err) {
      console.error("Failed to submit responses:", err);
      setError("There was an error submitting your form. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-600 mx-auto mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {form?.successText || "Response submitted!"}
          </h1>
          <p className="text-gray-500">
            Thank you for your response.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading form...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        {error}
      </div>
    );
  }

  if (!form) {
    return null;
  }

  return (
    <div className="bg-gray-50 min-h-screen font-inter flex flex-col items-center py-12 px-4 sm:px-6 transition-colors duration-300">
      <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Form Card */}
        <div className="bg-white rounded-[2.25rem] shadow-xl shadow-gray-200/60 border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gray-50/80 p-8 sm:p-12 border-b border-gray-100">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">
              {form.title}
            </h1>
            {form.description && (
              <p className="text-lg text-gray-500 leading-relaxed">
                {form.description}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-8 sm:p-12 space-y-8">
            {getVisibleBlocks(form.blocks)
              .map((block) => {
              const { id, type, label, placeholder, required, options } = block;
              const inputId = `block-${id}`;

              const fieldWrapper = (content: React.ReactNode) => (
                <div key={id} className="group">
                  <label
                    htmlFor={inputId}
                    className="block text-lg font-medium text-gray-900 mb-2.5 transition-colors group-hover:text-indigo-600"
                  >
                    {label}
                    {required && (
                      <span className="text-red-500 ml-1" title="Required">
                        *
                      </span>
                    )}
                  </label>
                  {content}
                </div>
              );

              const inputClasses =
                "w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 shadow-sm";

              switch (type) {
                case "SHORT_ANS":
                case "EMAIL":
                case "NUM":
                case "PHONE_NUM":
                case "LINK":
                case "DATE": {
                  const inputType = {
                    SHORT_ANS: "text",
                    EMAIL: "email",
                    NUM: "number",
                    PHONE_NUM: "tel",
                    LINK: "url",
                    DATE: "date",
                  }[type];
                  return fieldWrapper(
                    <input
                      id={inputId}
                      type={inputType}
                      value={(responses[id] as string) || ""}
                      onChange={(e) => handleInputChange(id, e.target.value)}
                      placeholder={placeholder || "Your answer..."}
                      required={required}
                      className={inputClasses}
                    />,
                  );
                }

                case "LONG_ANS":
                  return fieldWrapper(
                    <textarea
                      id={inputId}
                      value={(responses[id] as string) || ""}
                      onChange={(e) => handleInputChange(id, e.target.value)}
                      placeholder={placeholder || "Your answer..."}
                      required={required}
                      rows={4}
                      className={inputClasses}
                    />,
                  );

                case "MULT_CHOICE":
                  return fieldWrapper(
                    <div className="space-y-3">
                      {options?.map((opt) => (
                        <label
                          key={opt}
                          className="flex items-center gap-3 p-3 rounded-2xl border border-transparent hover:bg-gray-50 hover:border-indigo-100 cursor-pointer transition-all"
                        >
                          <input
                            type="radio"
                            id={`${inputId}-${opt}`}
                            name={inputId}
                            value={opt}
                            checked={responses[id] === opt}
                            onChange={(e) =>
                              handleInputChange(id, e.target.value)
                            }
                            required={required}
                            className="w-5 h-5 accent-indigo-600 border-gray-300 focus:ring-indigo-500"
                          />
                          <span className="text-gray-700">
                            {opt}
                          </span>
                        </label>
                      ))}
                    </div>,
                  );

                case "CHECKBOXES":
                  return fieldWrapper(
                    <div className="space-y-3">
                      {options?.map((opt) => (
                        <label
                          key={opt}
                          className="flex items-center gap-3 p-3 rounded-2xl border border-transparent hover:bg-gray-50 hover:border-indigo-100 cursor-pointer transition-all"
                        >
                          <input
                            type="checkbox"
                            id={`${inputId}-${opt}`}
                            value={opt}
                            checked={(responses[id] as string[])?.includes(opt)}
                            onChange={(e) =>
                              handleCheckboxChange(id, opt, e.target.checked)
                            }
                            className="w-5 h-5 accent-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                          />
                          <span className="text-gray-700">
                            {opt}
                          </span>
                        </label>
                      ))}
                    </div>,
                  );

                case "DROPDOWN":
                  return fieldWrapper(
                    <div className="relative">
                      <select
                        id={inputId}
                        value={(responses[id] as string) || ""}
                        onChange={(e) => handleInputChange(id, e.target.value)}
                        required={required}
                        className={`${inputClasses} appearance-none cursor-pointer`}
                      >
                        <option value="" disabled>
                          Select an option...
                        </option>
                        {options?.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                        <svg
                          className="w-4 h-4 fill-current"
                          viewBox="0 0 20 20"
                        >
                          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                        </svg>
                      </div>
                    </div>,
                  );

                case "RATING":
                  return fieldWrapper(
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => handleInputChange(id, star.toString())}
                          className="group/star p-1 focus:outline-none transition-transform active:scale-95"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="32"
                            height="32"
                            viewBox="0 0 24 24"
                            fill={
                              (responses[id] as number) >= star
                                ? "#fbbf24"
                                : "none"
                            } // amber-400
                            stroke={
                              (responses[id] as number) >= star
                                ? "#fbbf24"
                                : "currentColor"
                            }
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={`transition-colors ${(responses[id] as number) >= star ? "" : "text-gray-300 hover:text-gray-400"}`}
                          >
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        </button>
                      ))}
                    </div>,
                  );

                case "H3":
                  return (
                    <h3
                      key={id}
                      className="text-2xl font-bold text-gray-900 pt-6 pb-2 border-b-2 border-gray-100"
                    >
                      {label}
                    </h3>
                  );

                case "DIVIDER":
                  return (
                    <hr
                      key={id}
                      className="my-8 border-t border-gray-100"
                    />
                  );

                case "FILE_UPLOAD":
                  return fieldWrapper(
                    <div className="relative border-2 border-dashed border-gray-300 rounded-3xl p-8 text-center hover:bg-gray-50 transition-colors">
                      <input
                        id={inputId}
                        type="file"
                        onChange={(e) =>
                          handleFileChange(id, e.target.files?.[0])
                        }
                        required={required && !responses[id]}
                        disabled={uploadingBlockId === id}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-wait"
                      />
                      <div className="pointer-events-none">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="mx-auto h-10 w-10 text-gray-400 mb-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        <p className="text-sm text-gray-500">
                          {uploadingBlockId === id ? (
                            <span className="text-indigo-600 font-medium">
                              Uploading...
                            </span>
                          ) : responses[id] ? (
                            <span className="text-indigo-600 font-medium">
                              Uploaded
                            </span>
                          ) : (
                            <span>Click to upload or drag and drop</span>
                          )}
                        </p>
                      </div>
                    </div>,
                  );

                default:
                  return null;
              }
            })}

            <div className="pt-8">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 px-8 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-500/20 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  "Submit Response"
                )}
              </button>
            </div>
          </form>
        </div>

        {!isEmbed && (
          <div className="mt-8 mb-12">
            <MadeWithFormium />
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponsePage;
