import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://127.0.0.1:8000", // ✅ Django backend API
  headers: { "Content-Type": "application/json" },
});

// ✅ Attach token before each request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Automatically refresh token if expired
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) {
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const res = await axios.post("http://127.0.0.1:8000/api/accounts/token/refresh/", {
          refresh: refreshToken,
        });
        localStorage.setItem("access_token", res.data.access);
        axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${res.data.access}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
