import API from "./axios";
import type { FormBlock } from "../types/form";

export const getFormBlocks = async (formId: string): Promise<FormBlock[]> => {
  const { data } = await API.get(`/form-blocks/${formId}`);
  return data;
};

export const createFormBlock = (block: {
  formId: string;
  type: FormBlock["type"];
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  logic?: FormBlock["logic"];
  order: number;
}) => API.post("/form-blocks", block);

export const updateFormBlock = (
  id: string,
  update: Partial<Omit<FormBlock, "id">>,
) => API.put(`/form-blocks/${id}`, update);

export const deleteFormBlock = (id: string) =>
  API.delete(`/form-blocks/${id}`);

export const reorderFormBlocks = (blocks: { id: string; order: number }[]) =>
  Promise.all(
    blocks.map((block) => API.put(`/form-blocks/${block.id}`, { order: block.order })),
  );
