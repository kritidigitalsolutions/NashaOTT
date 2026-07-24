import API from "../../api/axios";

export const fetchAdminCategories = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.search) query.append("search", params.search);
  if (params.isActive !== undefined) query.append("isActive", params.isActive);
  if (params.page) query.append("page", params.page);
  if (params.limit) query.append("limit", params.limit);

  const res = await API.get(`/admin/categories?${query.toString()}`);
  return res.data;
};

export const createCategory = async (data) => {
  const res = await API.post("/admin/categories", data);
  return res.data;
};

export const updateCategory = async (id, data) => {
  const res = await API.put(`/admin/categories/${id}`, data);
  return res.data;
};

export const deleteCategory = async (id) => {
  const res = await API.delete(`/admin/categories/${id}`);
  return res.data;
};

// User-facing (no auth needed)
export const fetchActiveCategories = async () => {
  const res = await API.get("/categories");
  return res.data;
};
