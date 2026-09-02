import { Link } from "react-router-dom";

function formatPrice(price) {
  if (price === null || price === undefined || price === "") return "가격 미입력";
  const n = Number(price);
  if (!Number.isFinite(n)) return "가격 미입력";
  return `${n.toLocaleString("ko-KR")}원`;
}

export default function ClothCard({ cloth, categoryId }) {
  return (
    <Link to={`/category/${categoryId}/cloth/${cloth.id}`} className="cloth-card">
      <div className="cloth-card-image-wrap">
        {cloth.image ? (
          <img src={cloth.image} alt={cloth.store || "등록된 옷"} className="cloth-card-image" />
        ) : (
          <div className="cloth-card-image-placeholder">이미지 없음</div>
        )}
      </div>
      <div className="cloth-card-info">
        <p className="cloth-card-store">{cloth.store || "구매처 미입력"}</p>
        <p className="cloth-card-meta">
          {cloth.size ? `${cloth.size} · ` : ""}
          {formatPrice(cloth.price)}
        </p>
      </div>
    </Link>
  );
}
