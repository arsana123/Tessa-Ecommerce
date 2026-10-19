import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("fk_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (err) => Promise.reject(err)
);

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("fk_token");
      localStorage.removeItem("fk_user");
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    const message =
      err.response?.data?.message ||
      (err.code === "ECONNABORTED" ? "Request timed out. Please try again." : null) ||
      err.message ||
      "Something went wrong";
    return Promise.reject(new Error(message));
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const register   = (data)   => api.post("/auth/register", data);
export const loginUser  = (data)   => api.post("/auth/login",    data);
export const subscribeEmail = (email) =>api.post("/subscribe", { email });
export const adminLogin = (data)   => api.post("/auth/admin/login", data);
export const getMe      = ()       => api.get("/auth/me");
export const updateMe   = (data)   => api.patch("/auth/me", data);

// ── Products ──────────────────────────────────────────────────────────────────
export const getProducts      = (params)    => api.get("/products", { params });
export const getFeatured      = ()          => api.get("/products/featured");
export const getFlashSales    = ()          => api.get("/products/flash-sales");
export const getProduct       = (id)        => api.get(`/products/${id}`);
export const adminGetProducts = (params)    => api.get("/products/admin/all", { params });
export const createProduct    = (data)      => api.post("/products", data);
export const updateProduct    = (id, data)  => api.patch(`/products/${id}`, data);
export const deleteProduct    = (id)        => api.delete(`/products/${id}`);
export const setFlashSale     = (id, data)  => api.post(`/products/${id}/flash-sale`, data);
export const cancelFlashSale  = (id)        => api.delete(`/products/${id}/flash-sale`);

// ── Cart ──────────────────────────────────────────────────────────────────────
export const getCart        = ()           => api.get("/cart");
export const addToCart      = (data)       => api.post("/cart", data);
export const updateCartItem = (pid, qty)   => api.patch(`/cart/${pid}`, { quantity: qty });
export const removeFromCart = (pid)        => api.delete(`/cart/${pid}`);
export const clearCart      = ()           => api.delete("/cart");

// ── Orders ────────────────────────────────────────────────────────────────────
export const createOrder        = (data)   => api.post("/orders", data);
export const verifyPayment      = (data)   => api.post("/orders/verify-payment", data);
export const createFlashOrder   = (data)   => api.post("/orders/flash", data);
export const verifyFlashPayment = (data)   => api.post("/orders/flash/verify-payment", data);
export const getMyOrders        = (params) => api.get("/orders/my", { params });
export const getOrder           = (id)     => api.get(`/orders/${id}`);
export const adminGetOrders     = (params) => api.get("/orders/admin/all", { params });
export const updateOrderStatus  = (id, s)  => api.patch(`/orders/admin/${id}/status`, { status: s });

// ── Payment ───────────────────────────────────────────────────────────────────
export const createPaymentOrder    = (data)      => api.post("/payment/create-order", data);
export const verifyRazorpayPayment = (data)      => api.post("/payment/verify", data);
export const getPaymentStatus      = (orderId)   => api.get(`/payment/status/${orderId}`);
export const issueRefund           = (pid, data) => api.post(`/payment/refund/${pid}`, data);

export default api;