import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getCloth, updateCloth, deleteCloth } from "../api/client.js";
import ManualEntryForm from "../components/ManualEntryForm.jsx";

function formatPrice(price) {
  if (price === null || price === undefined || price === "") return "가격 미입력";
  const n = Number(price);
  if (!Number.isFinite(n)) return "가격 미입력";
  return `${n.toLocaleString("ko-KR")}원`;
}

export default function ClothDetail() {
  const { categoryId, clothId } = useParams();
  const navigate = useNavigate();
  const [cloth, setCloth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setLoading(true);
    getCloth(clothId)
      .then(setCloth)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [clothId]);

  async function handleUpdate(fields) {
    const result = await updateCloth(clothId, fields);
    setCloth(result.item);
    setEditing(false);
  }

  async function handleDelete() {
    const confirmed = window.confirm("이 옷을 삭제할까요? 삭제 후에는 되돌릴 수 없습니다.");
    if (!confirmed) return;
    setDeleting(true);
    try {
      await deleteCloth(clothId);
      navigate(`/category/${categoryId}`);
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  }

  if (loading) return <p className="state-text">불러오는 중...</p>;
  if (error) return <p className="state-text state-error">{error}</p>;
  if (!cloth) return <p className="state-text">옷 정보를 찾을 수 없습니다.</p>;

  return (
    <div className="cloth-detail">
      <Link to={`/category/${categoryId}`} className="back-link">
        ← 목록으로
      </Link>

      {editing ? (
        <ManualEntryForm
          initialValues={{ store: cloth.store, size: cloth.size, price: cloth.price, memo: cloth.memo }}
          initialImagePreviewUrl={cloth.image}
          requireImage={false}
          submitLabel="수정 완료"
          onSubmit={handleUpdate}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <div className="detail-card">
          <div className="detail-image-wrap">
            {cloth.image ? (
              <img src={cloth.image} alt={cloth.store || "옷 사진"} className="detail-image" />
            ) : (
              <div className="cloth-card-image-placeholder">이미지 없음</div>
            )}
          </div>
          <div className="detail-info">
            <dl>
              <dt>구매처</dt>
              <dd>{cloth.store || "미입력"}</dd>
              <dt>사이즈</dt>
              <dd>{cloth.size || "미입력"}</dd>
              <dt>가격</dt>
              <dd>{formatPrice(cloth.price)}</dd>
              <dt>메모</dt>
              <dd>{cloth.memo || "-"}</dd>
            </dl>
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(true)}>
                수정
              </button>
              <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
