import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || "http://localhost:5000";

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const getImageUrl = (url) => {
  if (!url) return "/placeholder.svg";
  if (url.startsWith('http')) return url;
  return `${BACKEND_URL}${url}`;
};

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("padhaiOn_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (config.data instanceof FormData) delete config.headers['Content-Type'];
    else if (!config.headers['Content-Type']) config.headers['Content-Type'] = 'application/json';
    return config;
  },
  (error) => Promise.reject(error)
);

// Public Routes (For Students/Visitors viewing Institutions)
export const institutionsAPI = {
  getAll: (params) => api.get("/institutions", { params }),
  getById: (id) => api.get(`/institutions/${id}`),
  create: (data) => api.post("/institutions", data),
  sendInquiry: (id, data) => api.post(`/institutions/${id}/inquiry`, data),
  // Public Reviews
  getReviews: (id) => api.get(`/institutions/${id}/reviews`),
  addReview: (id, data) => api.post(`/institutions/${id}/reviews`, data),
};

export const blogsAPI = {
  getAll: (params) => api.get("/blogs", { params }),
  getById: (id) => api.get(`/blogs/${id}`),
  create: (data) => api.post("/blogs", data),
};

export const coursesAPI = {
  getAll: () => api.get("/courses"),
  getById: (id) => api.get(`/courses/${id}`),
  create: (data) => api.post("/courses", data),
};

export const usersAPI = {
  register: (data) => api.post("/users/register", data),
  login: (data) => api.post("/users/login", data),
  getProfile: (id) => api.get(`/users/${id}`),
  updateProfile: (id, data) => api.put(`/users/${id}`, data),
  forgotPassword: (data) => api.post("/users/forgot-password", data),
  resetPassword: (data) => api.post("/users/reset-password", data),
};

export const consultationsAPI = {
  getAll: (params) => api.get("/consultations", { params }),
  create: (data) => api.post("/consultations", data),
  getById: (id) => api.get(`/consultations/${id}`),
};

export const contactAPI = {
  getAll: () => api.get("/contact"),
  create: (data) => api.post("/contact", data),
};

export const testimonialsAPI = {
  getAll: () => api.get("/testimonials"),
  create: (data) => api.post("/testimonials", data),
};

export const adminAPI = {
  getDashboardStats: () => api.get("/admin/dashboard/stats"),
  getStudents: (params) => api.get("/admin/students", { params }),
  getInstitutions: (params) => api.get("/admin/institutions", { params }),
  getInstitutionRequests: (params) => api.get("/admin/institution-requests", { params }),
  approveInstitutionRequest: (id) => api.post(`/admin/institution-requests/${id}/approve`),
  rejectInstitutionRequest: (id, data) => api.post(`/admin/institution-requests/${id}/reject`, data),
  getConsultations: (params) => api.get("/admin/consultations", { params }),
  approveConsultation: (id, data) => api.post(`/admin/consultations/${id}/approve`, data),
  rejectConsultation: (id, data) => api.post(`/admin/consultations/${id}/reject`, data),
  getReviews: () => api.get("/admin/reviews"),
  deleteReview: (id) => api.delete(`/admin/reviews/${id}`),
  sendNotification: (data) => api.post("/admin/notifications/send", data),
  bulkSendNotification: (data) => api.post("/admin/notifications/bulk-send", data),
  toggleUserStatus: (id) => api.patch(`/admin/users/${id}/toggle-status`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  deleteInstitution: (id) => api.delete(`/admin/institutions/${id}`),

  getBlogs: () => api.get("/admin/blogs"),
  createBlog: (data) => api.post("/admin/blogs", data),
  updateBlog: (id, data) => api.put(`/admin/blogs/${id}`, data),
  deleteBlog: (id) => api.delete(`/admin/blogs/${id}`),
};

// Private Routes (For Logged-in Institutions)
export const institutionAPI = {
  requestEnrollment: (data) => api.post("/institution/request-enrollment", data),
  getProfile: () => api.get("/institution/profile"),
  saveProfile: (data) => api.post("/institution/profile", data),
  getNotifications: () => api.get("/institution/notifications"),
  markNotificationRead: (id) => api.patch(`/institution/notifications/${id}/read`),
  markAllNotificationsRead: () => api.patch("/institution/notifications/read-all"),
  
  // --- ADDED: Missing methods for Dashboard Review/Inquiry/Password Logic ---
  getReviews: () => api.get("/institution/reviews"),
  getInquiries: () => api.get("/institution/inquiries"),
  replyToReview: (id, reply) => api.post(`/institution/reviews/${id}/reply`, { reply }),
  likeReview: (id) => api.patch(`/institution/reviews/${id}/like`),
  changePassword: (newPassword) => api.post("/institution/change-password", { newPassword }),
};

// Private Routes (For Logged-in Students)
export const studentAPI = {
  submitReview: (data) => api.post("/student/reviews", data),
  getReviews: () => api.get("/student/reviews"),
  submitInquiry: (data) => api.post("/student/inquiries", data),
  getNotifications: () => api.get("/student/notifications"),
  markNotificationRead: (id) => api.patch(`/student/notifications/${id}/read`),
  markAllNotificationsRead: () => api.patch("/student/notifications/read-all"),
};

export default api;