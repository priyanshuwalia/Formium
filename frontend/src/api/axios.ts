import axios from "axios";
import { emitAuthLogout } from "../utils/authEvents";

const API = axios.create({
    baseURL: "https://form-buddy-ux2b.vercel.app/api",
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
        if (error.response?.status === 401) {
            emitAuthLogout();
        }

        return Promise.reject(error);
    },
);
export default API;
