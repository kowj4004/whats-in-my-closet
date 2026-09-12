import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCategories, createCategory, updateCategory, deleteCategory } from "../api/client.js";
import CategoryFormModal from "../components/CategoryFormModal.jsx";

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null); // 수정 중인 category 객체
  const [busyId, setBusyId] = useState(null);

  function load() {
    setLoading(true);
    getCategories()
      .then((all) => setCategories(all.filter((c) => !c.parentId)))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleCreate(fields) {
    const created = await createCategory(fields);
    setCategories((prev) => [...prev, created]);
  }

  async function handleEditSubmit(fields) {
    const updated = await updateCategory(editing.id, fields);
    setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }

  async function handleDelete(category) {
    const confirmed = window.confirm(`"${category.name}" 카테고리를 삭제할까요?`);
    if (!confirmed) return;
    setBusyId(category.id);
    try {
      await deleteCategory(category.id);
      setCategories((prev) => prev.filter((c) => c.id !== category.id));
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="home">
      <h1 className="page-title">카테고리를 선택하세요</h1>
      <p className="page-subtitle">내 옷장에 등록된 옷을 카테고리별로 확인하고 관리할 수 있어요.</p>

      {loading && <p className="state-text">불러오는 중...</p>}
      {error && <p className="state-text state-error">{error}</p>}

      <div className="category-grid">
        <Link to="/outfits" className="category-card">
          <span className="category-card-name">코디</span>
        </Link>
        {categories.map((category) => (
          <div key={category.id} className="category-card-wrap">
            <Link
              to={`/category/${category.id}`}
              className="category-card"
              style={category.image ? { backgroundImage: `url(${category.image})` } : undefined}
            >
              <span className="category-card-name">{category.name}</span>
            </Link>
            <div className="category-card-actions">
              <button type="button" onClick={() => setEditing(category)} aria-label="카테고리 수정">
                ✎
              </button>
              <button
                type="button"
                onClick={() => handleDelete(category)}
                disabled={busyId === category.id}
                aria-label="카테고리 삭제"
              >
                ×
              </button>
            </div>
          </div>
        ))}
        <button type="button" className="category-card category-card-add" onClick={() => setShowAdd(true)}>
          <span className="category-card-name">+ 카테고리 추가</span>
        </button>
      </div>

      {showAdd && (
        <CategoryFormModal title="새 카테고리" onClose={() => setShowAdd(false)} onSubmit={handleCreate} />
      )}

      {editing && (
        <CategoryFormModal
          title="카테고리 수정"
          initialName={editing.name}
          initialImagePreviewUrl={editing.image}
          onClose={() => setEditing(null)}
          onSubmit={handleEditSubmit}
        />
      )}
    </div>
  );
}
