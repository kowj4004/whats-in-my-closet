import { Routes, Route, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext.jsx";
import ProtectedRoute from "./auth/ProtectedRoute.jsx";
import Home from "./pages/Home.jsx";
import CategoryView from "./pages/CategoryView.jsx";
import ClothDetail from "./pages/ClothDetail.jsx";
import OutfitListView from "./pages/OutfitListView.jsx";
import OutfitDetail from "./pages/OutfitDetail.jsx";
import Login from "./pages/Login.jsx";

function HeaderAuth() {
  const { user, signOut } = useAuth();
  if (!user) return null;
  return (
    <div className="header-auth">
      <span className="header-auth-email">{user.email}</span>
      <button type="button" className="header-auth-logout" onClick={signOut}>
        로그아웃
      </button>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <div className="app">
        <header className="app-header">
          <Link to="/" className="app-logo">
            What's in My Closet
          </Link>
          <HeaderAuth />
        </header>
        <main className="app-main">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path="/category/:categoryId"
              element={
                <ProtectedRoute>
                  <CategoryView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/category/:categoryId/cloth/:clothId"
              element={
                <ProtectedRoute>
                  <ClothDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/outfits"
              element={
                <ProtectedRoute>
                  <OutfitListView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/outfits/:outfitId"
              element={
                <ProtectedRoute>
                  <OutfitDetail />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}
