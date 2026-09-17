import API from "./axios";

export type BillingStatus = {
  plan: "FREE" | "PRO";
  planStatus: string;
  planRenewsAt: string | null;
  limits: {
    forms: number | null;
    responsesPerMonth: number | null;
    fileUploads: boolean;
  };
  usage: { forms: number };
};

export const getBillingStatus = async (): Promise<BillingStatus> => {
  const { data } = await API.get("/billing/status");
  return data;
};

export const startCheckout = async (): Promise<string> => {
  const { data } = await API.post("/billing/checkout");
  return data.url;
};

export const openBillingPortal = async (): Promise<string> => {
  const { data } = await API.post("/billing/portal");
  return data.url;
};
