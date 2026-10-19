import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export const ProtectedRoute = ({ children }) => {
  const { isLoggedIn, loading } = useAuth();
  const location = useLocation();

  if (loading) return (
    <div className="page-loader">
      <div className="spinner" />
    </div>
  );

  if (!isLoggedIn) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return children;
};

export const AdminRoute = ({ children }) => {
  const { isLoggedIn, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) return (
    <div className="page-loader">
      <div className="spinner" />
    </div>
  );

  if (!isLoggedIn) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
};
