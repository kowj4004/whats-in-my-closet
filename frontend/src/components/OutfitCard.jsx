import { Link } from "react-router-dom";

export default function OutfitCard({ outfit }) {
  return (
    <Link to={`/outfits/${outfit.id}`} className="cloth-card">
      <div className="cloth-card-image-wrap">
        {outfit.image ? (
          <img src={outfit.image} alt={outfit.name || "코디"} className="cloth-card-image" />
        ) : (
          <div className="cloth-card-image-placeholder">이미지 없음</div>
        )}
      </div>
      <div className="cloth-card-info">
        <p className="cloth-card-store">{outfit.name || "이름 없는 코디"}</p>
        <p className="cloth-card-meta">옷 {outfit.items.length}개</p>
      </div>
    </Link>
  );
}
