import API from "./axios";

export type AuthUser = {
  id: string;
  email: string;
  name?: string;
  bio?: string;
  profilePicture?: string;
  emailVerified?: boolean;
};

export type AuthResponse = {
  token: string;
  refreshToken?: string;
  user: AuthUser;
};

export const loginUser = (email: string, password: string) =>
  API.post("/auth/login", { email, password });

export const registerUser = (email: string, password: string) =>
  API.post("/auth/register", { email, password });

export const loginWithGoogle = (accessToken: string) =>
  API.post("/auth/google", { accessToken });

export const refreshSession = async (): Promise<AuthResponse> => {
  const { data } = await API.post("/auth/refresh");
  return data;
};

export const logoutUser = () => API.post("/auth/logout");

export const forgotPassword = (email: string) =>
  API.post("/auth/forgot-password", { email });

export const resetPassword = (token: string, password: string) =>
  API.post("/auth/reset-password", { token, password });

export const verifyEmail = (token: string) =>
  API.post("/auth/verify-email", { token });

export const resendVerification = (email: string) =>
  API.post("/auth/resend-verification", { email });
