import api from "./axios";

// ── Admin Auth ─────────────────────────────────────────────────────
export const loginAdmin = (email, password) =>
  api.post("/admin/auth/login", { email, password });

export const getAdminProfile = () =>
  api.get("/admin/auth/profile");

// ── Users ──────────────────────────────────────────────────────────
export const getAllUsers = (page = 1, limit = 20) =>
  api.get("/admin/users", { params: { page, limit } });

export const searchUsers = (q) =>
  api.get("/admin/users/search", { params: { q } });

export const banUser = (id) =>
  api.patch(`/admin/users/${id}/ban`);

export const activateUser = (id) =>
  api.patch(`/admin/users/${id}/activate`);

export const deleteUser = (id) =>
  api.delete(`/admin/users/${id}`);

// ── Dashboard Stats ────────────────────────────────────────────────
export const getDashboardStats = () =>
  api.get("/admin/users/stats");

// ── Movies ────────────────────────────────────────────────────────
export const getAllMovies = (page = 1, limit = 20) =>
  api.get("/admin/movies", { params: { page, limit } });

export const searchMovies = (q) =>
  api.get("/admin/movies/search", { params: { q } });

export const deleteMovie = (id) =>
  api.delete(`/admin/movies/${id}`);

export const addMovie = (formData, onProgress) =>
  api.post("/admin/movies/add", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: onProgress,
  });

// ── Series ────────────────────────────────────────────────────────
export const getAllSeries = (page = 1, limit = 20) =>
  api.get("/admin/series", { params: { page, limit } });

export const searchSeries = (q) =>
  api.get("/admin/series/search", { params: { q } });

export const deleteSeries = (id) =>
  api.delete(`/admin/series/${id}`);

export const addSeries = (formData, onProgress) =>
  api.post("/admin/series/add", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: onProgress,
  });

export const addEpisode = (formData, onProgress) =>
  api.post("/admin/episodes/add", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: onProgress,
  });

// ── Short Dramas ──────────────────────────────────────────────────
export const getAllShortDramas = (page = 1, limit = 20) =>
  api.get("/admin/shortdramas", { params: { page, limit } });

export const addShortDrama = (formData, onProgress) =>
  api.post("/admin/shortdramas/add", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: onProgress,
  });

export const addDramaEpisode = (shortDramaId, formData, onProgress) =>
  api.post(`/admin/drama-episodes/${shortDramaId}/add`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: onProgress,
  });

export const updateShortDrama = (id, formData, onProgress) =>
  api.patch(`/admin/shortdramas/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: onProgress,
  });

export const deleteShortDrama = (id) =>
  api.delete(`/admin/shortdramas/${id}`);

export const getShortDramaById = (id) =>
  api.get(`/admin/shortdramas/${id}`);

// ── Update existing content ────────────────────────────────────────
export const updateMovie = (id, formData, onProgress) =>
  api.patch(`/admin/movies/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: onProgress,
  });

export const getMovieById = (id) =>
  api.get(`/admin/movies/${id}`);

export const updateSeries = (id, formData, onProgress) =>
  api.patch(`/admin/series/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: onProgress,
  });

export const getSeriesById = (id) =>
  api.get(`/admin/series/${id}`);

// ── Combined Content ──────────────────────────────────────────────
export const getAllContent = () =>
  api.get("/admin/content/all");

export const getContentStats = () =>
  api.get("/admin/content/stats");

// ── Notifications ─────────────────────────────────────────────────
export const getNotifications = (page = 1, limit = 20) =>
  api.get("/admin/notifications", { params: { page, limit } });

export const sendNotification = (data) =>
  api.post("/admin/notifications/send", data);

export const deleteNotification = (id) =>
  api.delete(`/admin/notifications/${id}`);

// ── Subscriptions ─────────────────────────────────────────────────
export const getSubscriptionStats = () =>
  api.get("/admin/subscription/stats");
