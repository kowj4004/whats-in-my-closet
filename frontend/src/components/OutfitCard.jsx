import { Link } from "react-router-dom";

export default function OutfitCard({ outfit }) {
  const thumbs = outfit.items.slice(0, 4);

  return (
    <Link to={`/outfits/${outfit.id}`} className="outfit-card">
      <div className={`outfit-card-collage outfit-card-collage-${thumbs.length || 1}`}>
        {thumbs.length === 0 ? (
          <div className="cloth-card-image-placeholder">이미지 없음</div>
        ) : (
          thumbs.map((item) => (
            <div key={item.id} className="outfit-card-collage-cell">
              <img src={item.image} alt={item.store || "코디 아이템"} />
            </div>
          ))
        )}
      </div>
      <div className="cloth-card-info">
        <p className="cloth-card-store">{outfit.name || "이름 없는 코디"}</p>
        <p className="cloth-card-meta">옷 {outfit.items.length}개</p>
      </div>
    </Link>
  );
}
