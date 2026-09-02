import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getOutfit, updateOutfit, deleteOutfit } from "../api/client.js";
import OutfitModal from "../components/OutfitModal.jsx";

export default function OutfitDetail() {
  const { outfitId } = useParams();
  const navigate = useNavigate();
  const [outfit, setOutfit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setLoading(true);
    getOutfit(outfitId)
      .then(setOutfit)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [outfitId]);

  async function handleUpdate(fields) {
    const updated = await updateOutfit(outfitId, fields);
    setOutfit(updated);
    setEditing(false);
  }

  async function handleDelete() {
    const confirmed = window.confirm("이 코디를 삭제할까요? 삭제 후에는 되돌릴 수 없습니다.");
    if (!confirmed) return;
    setDeleting(true);
    try {
      await deleteOutfit(outfitId);
      navigate("/outfits");
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  }

  if (loading) return <p className="state-text">불러오는 중...</p>;
  if (error) return <p className="state-text state-error">{error}</p>;
  if (!outfit) return <p className="state-text">코디를 찾을 수 없습니다.</p>;

  const initialSelection = Object.fromEntries(outfit.items.map((item) => [item.category, item.id]));

  return (
    <div className="cloth-detail">
      <Link to="/outfits" className="back-link">
        ← 코디 목록으로
      </Link>

      {editing ? (
        <OutfitModal
          title="코디 수정"
          initialName={outfit.name}
          initialSelection={initialSelection}
          submitLabel="수정 완료"
          onClose={() => setEditing(false)}
          onSubmit={handleUpdate}
        />
      ) : (
        <div className="outfit-detail-card">
          <h1 className="page-title">{outfit.name || "이름 없는 코디"}</h1>

          <div className="outfit-detail-items">
            {outfit.items.map((item) => (
              <Link
                key={item.id}
                to={`/category/${item.category}/cloth/${item.id}`}
                className="cloth-card"
              >
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
              </Link>
            ))}
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setEditing(true)}>
              수정
            </button>
            <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? "삭제 중..." : "삭제"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
