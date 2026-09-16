export type BlockType =
  | "SHORT_ANS"
  | "LONG_ANS"
  | "MULT_CHOICE"
  | "CHECKBOXES"
  | "DROPDOWN"
  | "MULTI_SELE"
  | "NUM"
  | "EMAIL"
  | "PHONE_NUM"
  | "LINK"
  | "FILE_UPLOAD"
  | "DATE"
  | "RATING"
  | "DIVIDER"
  | "H3";

export type User = {
  id: string;
  email: string;
  name?: string;
  bio?: string;
  profilePicture?: string;
  forms: Form[];
};

export type Form = {
  id: string;
  title: string;
  description?: string;
  slug: string;
  responses: Response[];
  User?: User;
  userId?: string;
  createdAt: string;
  blocks: FormBlock[];
  isPublished: boolean;
  theme?: string;
  successText?: string;
  coverColor?: string;
  _count?: { responses: number };
};

export type FormBlock = {
  id: string;
  order: number;
  value?: string;
  type?: BlockType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  coverColor?: string;
  logic?: { triggerBlockId: string; triggerValue: string }[] | null;
};

export type Response = {
  id: string;
  formId: string;
  createdAt: string;
  items: ResponseItem[];
};

export type ResponseItem = {
  id: string;
  responseId: string;
  blockId: string;
  value: string;
};