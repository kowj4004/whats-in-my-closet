import { useEffect, useState } from "react";
import { getCategories, getClothes } from "../api/client.js";

/**
 * 이미 등록된 옷들을 카테고리별로 보여주고, 카테고리당 하나씩 골라 코디를 구성하는 모달.
 * 새 사진을 업로드하지 않고, 기존 옷 id들의 조합만 저장한다.
 */
export default function OutfitBuilder({ initialName = "", initialSelection = {}, submitLabel = "코디 만들기", onSubmit, onCancel }) {
  const [categories, setCategories] = useState([]);
  const [clothesByCategory, setClothesByCategory] = useState({});
  const [selection, setSelection] = useState(initialSelection); // { [categoryId]: clothId }
  const [name, setName] = useState(initialName);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [cats, clothes] = await Promise.all([getCategories(), getClothes()]);
        if (cancelled) return;
        const grouped = {};
        for (const cloth of clothes) {
          (grouped[cloth.categoryId] ||= []).push(cloth);
        }
        setCategories(cats);
        setClothesByCategory(grouped);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function toggle(categoryId, clothId) {
    setSelection((prev) => {
      const next = { ...prev };
      if (next[categoryId] === clothId) {
        delete next[categoryId];
      } else {
        next[categoryId] = clothId;
      }
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const itemIds = Object.values(selection).filter(Boolean);
    if (itemIds.length === 0) {
      setError("옷을 하나 이상 선택해주세요.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await onSubmit({ name, itemIds });
    } catch (err) {
      setError(err.message || "저장 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="state-text">불러오는 중...</p>;

  const hasAnyClothes = Object.values(clothesByCategory).some((list) => list.length > 0);

  return (
    <form className="outfit-builder" onSubmit={handleSubmit}>
      <label className="field">
        <span className="field-label">코디 이름</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 출근룩, 주말 데일리"
        />
      </label>

      {!hasAnyClothes && (
        <p className="state-text">
          아직 등록된 옷이 없어요. 상의/하의/악세사리/신발을 먼저 등록해주세요.
        </p>
      )}

      {categories.map((category) => {
        const items = clothesByCategory[category.id] || [];
        if (items.length === 0) return null;
        return (
          <div key={category.id} className="outfit-picker-section">
            <p className="outfit-picker-label">{category.name}</p>
            <div className="outfit-picker-row">
              {items.map((cloth) => {
                const selected = selection[category.id] === cloth.id;
                return (
                  <button
                    type="button"
                    key={cloth.id}
                    className={`outfit-picker-item ${selected ? "outfit-picker-item-selected" : ""}`}
                    onClick={() => toggle(category.id, cloth.id)}
                  >
                    {cloth.image ? (
                      <img src={cloth.image} alt={cloth.store || category.name} />
                    ) : (
                      <span className="outfit-picker-item-placeholder">이미지 없음</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {error && <p className="state-text state-error">{error}</p>}

      <div className="form-actions">
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={submitting}>
            취소
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "저장 중..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
