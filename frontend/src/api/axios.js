import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_URL || "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

// Attach JWT token to every request automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("nasha_admin_token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 globally — clear stored credentials and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("nasha_admin_token");
      localStorage.removeItem("nasha_admin_user");
      localStorage.removeItem("nasha_admin_authed");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
