import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getCategories, getClothes, createCategory, updateCategory, deleteCategory } from "../api/client.js";
import ClothGrid from "../components/ClothGrid.jsx";
import AddClothModal from "../components/AddClothModal.jsx";
import CategoryFormModal from "../components/CategoryFormModal.jsx";

export default function CategoryView() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedSub, setSelectedSub] = useState("");
  const [clothes, setClothes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddSub, setShowAddSub] = useState(false);
  const [showEditCategory, setShowEditCategory] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setSelectedSub("");
    try {
      const [categories, clothesList] = await Promise.all([getCategories(), getClothes(categoryId)]);
      setCategory(categories.find((c) => c.id === categoryId) || null);
      setSubcategories(categories.filter((c) => c.parentId === categoryId));
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

  async function handleAddSub(fields) {
    const created = await createCategory({ ...fields, parentId: categoryId });
    setSubcategories((prev) => [...prev, created]);
  }

  async function handleEditCategory(fields) {
    const updated = await updateCategory(categoryId, fields);
    setCategory(updated);
  }

  async function handleDeleteCategory() {
    const confirmed = window.confirm(`"${category.name}" 카테고리를 삭제할까요?`);
    if (!confirmed) return;
    try {
      await deleteCategory(categoryId);
      navigate("/");
    } catch (err) {
      alert(err.message);
    }
  }

  const visibleClothes = selectedSub ? clothes.filter((c) => c.categoryId === selectedSub) : clothes;
  const targetCategoryId = selectedSub || categoryId;
  const categoryChoices = category
    ? [{ id: category.id, name: category.name }, ...subcategories.map((s) => ({ id: s.id, name: s.name }))]
    : [];

  return (
    <div className="category-view">
      <div className="category-view-header">
        <Link to="/" className="back-link">
          ← 카테고리
        </Link>
        <div className="category-view-title-row">
          <h1 className="page-title">{category ? category.name : categoryId}</h1>
          {category && (
            <div className="category-view-title-actions">
              <button type="button" onClick={() => setShowEditCategory(true)} aria-label="카테고리 수정">
                ✎
              </button>
              <button type="button" onClick={handleDeleteCategory} aria-label="카테고리 삭제">
                ×
              </button>
            </div>
          )}
        </div>
      </div>

      {loading && <p className="state-text">불러오는 중...</p>}
      {error && <p className="state-text state-error">{error}</p>}

      {!loading && !error && (
        <>
          <div className="subcategory-row">
            {subcategories.length > 0 && (
              <>
                <button
                  type="button"
                  className={`subcategory-chip ${selectedSub === "" ? "subcategory-chip-active" : ""}`}
                  onClick={() => setSelectedSub("")}
                >
                  전체
                </button>
                {subcategories.map((sub) => (
                  <button
                    type="button"
                    key={sub.id}
                    className={`subcategory-chip ${selectedSub === sub.id ? "subcategory-chip-active" : ""}`}
                    onClick={() => setSelectedSub(sub.id)}
                  >
                    {sub.name}
                  </button>
                ))}
              </>
            )}
            <button type="button" className="subcategory-chip subcategory-chip-add" onClick={() => setShowAddSub(true)}>
              + 세부카테고리
            </button>
          </div>

          <ClothGrid clothes={visibleClothes} categoryId={categoryId} />
        </>
      )}

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
          categoryId={targetCategoryId}
          categoryChoices={categoryChoices}
          onClose={() => setShowAddModal(false)}
          onCreated={handleCreated}
        />
      )}

      {showAddSub && (
        <CategoryFormModal title="세부카테고리 추가" onClose={() => setShowAddSub(false)} onSubmit={handleAddSub} />
      )}

      {showEditCategory && category && (
        <CategoryFormModal
          title="카테고리 수정"
          initialName={category.name}
          initialImagePreviewUrl={category.image}
          onClose={() => setShowEditCategory(false)}
          onSubmit={handleEditCategory}
        />
      )}
    </div>
  );
}
