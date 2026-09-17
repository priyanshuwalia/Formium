import API from "./axios";

export type UploadTarget = {
  uploadUrl: string;
  key: string;
};

export const requestUploadUrl = async (
  formId: string,
  filename: string,
  contentType: string,
): Promise<UploadTarget> => {
  const { data } = await API.post("/upload", { formId, filename, contentType });
  return data;
};

export const uploadFile = async (
  formId: string,
  file: File,
): Promise<string> => {
  const { uploadUrl, key } = await requestUploadUrl(
    formId,
    file.name,
    file.type || "application/octet-stream",
  );

  const res = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type || "application/octet-stream" },
  });

  if (!res.ok) throw new Error("Failed to upload file");
  return key;
};
