import API from "./axios";

export type AISummary = {
  summary: string;
  themes: { theme: string; mentions: number }[];
  notableResponses: { label: string; answer: string; why: string }[];
};

export const analyzeForm = async (formId: string): Promise<AISummary> => {
  const { data } = await API.get("/ai/analyze", { params: { formId } });
  return data.result;
};
