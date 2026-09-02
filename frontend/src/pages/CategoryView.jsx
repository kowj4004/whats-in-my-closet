import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getCategories, getClothes } from "../api/client.js";
import ClothGrid from "../components/ClothGrid.jsx";
import AddClothModal from "../components/AddClothModal.jsx";

export default function CategoryView() {
  const { categoryId } = useParams();
  const [category, setCategory] = useState(null);
  const [clothes, setClothes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [categories, clothesList] = await Promise.all([
        getCategories(),
        getClothes(categoryId),
      ]);
      setCategory(categories.find((c) => c.id === categoryId) || null);
      setClothes(clothesList);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  useEffect(() => {
    load();
  }, [load]);

  function handleCreated(item) {
    setClothes((prev) => [item, ...prev]);
  }

  return (
    <div className="category-view">
      <div className="category-view-header">
        <Link to="/" className="back-link">
          ← 카테고리
        </Link>
        <h1 className="page-title">{category ? category.name : categoryId}</h1>
      </div>

      {loading && <p className="state-text">불러오는 중...</p>}
      {error && <p className="state-text state-error">{error}</p>}

      {!loading && !error && <ClothGrid clothes={clothes} categoryId={categoryId} />}

      <button
        type="button"
        className="fab"
        onClick={() => setShowAddModal(true)}
        aria-label="새 옷 등록"
      >
        +
      </button>

      {showAddModal && (
        <AddClothModal
          categoryId={categoryId}
          onClose={() => setShowAddModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
