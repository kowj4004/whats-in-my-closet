import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home.jsx";
import CategoryView from "./pages/CategoryView.jsx";
import ClothDetail from "./pages/ClothDetail.jsx";
import OutfitListView from "./pages/OutfitListView.jsx";
import OutfitDetail from "./pages/OutfitDetail.jsx";

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <Link to="/" className="app-logo">
          What's in My Closet
        </Link>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/category/:categoryId" element={<CategoryView />} />
          <Route path="/category/:categoryId/cloth/:clothId" element={<ClothDetail />} />
          <Route path="/outfits" element={<OutfitListView />} />
          <Route path="/outfits/:outfitId" element={<OutfitDetail />} />
        </Routes>
      </main>
    </div>
  );
}
