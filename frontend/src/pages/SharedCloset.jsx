import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getSharedCloset } from "../api/client.js";

/** 다른 사람의 옷장을 읽기 전용으로 보여준다. 클릭해서 상세로 들어가거나 수정하는 기능은 없다. */
export default function SharedCloset() {
  const { email } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    getSharedCloset(email)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [email]);

  if (loading) return <p className="state-text">불러오는 중...</p>;
  if (error) return <p className="state-text state-error">{error}</p>;
  if (!data) return null;

  const topLevelCategories = data.categories.filter((c) => !c.parentId);

  function clothesFor(category) {
    const childIds = data.categories.filter((c) => c.parentId === category.id).map((c) => c.id);
    return data.clothes.filter((c) => c.categoryId === category.id || childIds.includes(c.categoryId));
  }

  return (
    <div className="shared-closet">
      <Link to="/settings" className="back-link">
        ← 설정으로
      </Link>
      <h1 className="page-title">{data.email}님의 옷장</h1>
      <p className="page-subtitle">열람 전용이에요 — 여기서는 수정하거나 삭제할 수 없습니다.</p>

      {topLevelCategories.map((category) => {
        const items = clothesFor(category);
        if (items.length === 0) return null;
        return (
          <section key={category.id} className="shared-closet-section">
            <h2 className="settings-section-title">{category.name}</h2>
            <div className="cloth-grid">
              {items.map((item) => (
                <div key={item.id} className="cloth-card shared-cloth-card">
                  <div className="cloth-card-image-wrap">
                    {item.image ? (
                      <img src={item.image} alt={item.store || "옷"} className="cloth-card-image" />
                    ) : (
                      <div className="cloth-card-image-placeholder">이미지 없음</div>
                    )}
                  </div>
                  <div className="cloth-card-info">
                    <p className="cloth-card-store">{item.store || "구매처 미입력"}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {data.outfits.length > 0 && (
        <section className="shared-closet-section">
          <h2 className="settings-section-title">코디</h2>
          <div className="cloth-grid">
            {data.outfits.map((outfit) => (
              <div key={outfit.id} className="cloth-card shared-cloth-card">
                <div className="cloth-card-image-wrap">
                  {outfit.image ? (
                    <img src={outfit.image} alt={outfit.name || "코디"} className="cloth-card-image" />
                  ) : (
                    <div className="cloth-card-image-placeholder">이미지 없음</div>
                  )}
                </div>
                <div className="cloth-card-info">
                  <p className="cloth-card-store">{outfit.name || "이름 없는 코디"}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {topLevelCategories.every((c) => clothesFor(c).length === 0) && data.outfits.length === 0 && (
        <p className="state-text">아직 등록된 옷이 없어요.</p>
      )}
    </div>
  );
}
