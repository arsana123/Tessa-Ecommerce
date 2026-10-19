import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import { ProtectedRoute, AdminRoute } from "./components/common/ProtectedRoute";
import "./styles/global.css";

import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import OrdersPage from "./pages/OrdersPage";
import AdminPage from "./pages/AdminPage";
import LoginPage from "./pages/LoginPage";
import GoogleAuthSuccess from "./pages/GoogleAuthSuccess";
import NotFoundPage from "./pages/NotFoundPage";
import PrivacyPolicy       from "./pages/PrivacyPolicy";
import TermsAndConditions  from "./pages/TermsAndConditions";
import RefundPolicy        from "./pages/RefundPolicy";
import ContactUs           from "./pages/ContactUs";

/* Scroll to top on route change */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

/* Wrapper that hides footer on login and admin pages */
function Layout({ children }) {
  const { pathname } = useLocation();
  const hideFooter = pathname === "/login" || pathname.startsWith("/admin");
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        {children}
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: "#380d15",
                color: "#f4e8d0",
                border: "1px solid rgba(201,164,92,0.45)",
                borderRadius: "4px",
                boxShadow: "0 12px 30px rgba(0,0,0,0.5)",
                fontSize: "14px",
                fontFamily: "'Jost', sans-serif",
                fontWeight: "600",
                padding: "12px 16px",
                maxWidth: "380px",
              },
              success: {
                iconTheme: { primary: "#8fd3a8", secondary: "#380d15" },
                style: { borderLeft: "3px solid #8fd3a8" },
              },
              error: {
                iconTheme: { primary: "#ff8a80", secondary: "#380d15" },
                style: { borderLeft: "3px solid #ff8a80" },
              },
            }}
          />
          <ScrollToTop />
          <Layout>
            <Routes>
              <Route path="/"             element={<HomePage />} />
              <Route path="/login"        element={<LoginPage />} />
              <Route path="/products"     element={<ProductsPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />
              <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />
              <Route
                path="/cart"
                element={<ProtectedRoute><CartPage /></ProtectedRoute>}
              />
              <Route
                path="/orders"
                element={<ProtectedRoute><OrdersPage /></ProtectedRoute>}
              />
              <Route
                path="/admin"
                element={<AdminRoute><AdminPage /></AdminRoute>}
              />
              <Route path="*" element={<NotFoundPage />} />
              <Route path="/privacy"  element={<PrivacyPolicy />} />
              <Route path="/terms"    element={<TermsAndConditions />} />
              <Route path="/refund"   element={<RefundPolicy />} />
              <Route path="/contact"  element={<ContactUs />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}