import axios from "axios";

const api = axios.create({
  baseURL:
    process.env.REACT_APP_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:4000",
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      typeof window !== "undefined" &&
      error?.response?.status === 401
    ) {
      // Avoid redirect loop if already on an auth page
      const currentPath = window.location.pathname || "";
      if (!currentPath.startsWith("/auth")) {
        window.location.href = "/auth/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;

