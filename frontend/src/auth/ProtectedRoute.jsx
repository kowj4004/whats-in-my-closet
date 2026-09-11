import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <p className="state-text">불러오는 중...</p>;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}
