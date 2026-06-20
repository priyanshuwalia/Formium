import axios from "axios";
import { emitAuthLogout } from "../utils/authEvents";

const API = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api",
    withCredentials: true,
})

API.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config


})

API.interceptors.response.use(
    (response) => response,
    (error) => {
        const requestUrl = error.config?.url || "";
        const isConversationalResponse = requestUrl.includes("/response/conversational");

        if (error.response?.status === 401 && !isConversationalResponse) {
            emitAuthLogout();
        }

        return Promise.reject(error);
    },
);
export default API;
