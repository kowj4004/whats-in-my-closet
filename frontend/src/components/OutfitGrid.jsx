import OutfitCard from "./OutfitCard.jsx";

export default function OutfitGrid({ outfits }) {
  if (!outfits.length) {
    return (
      <div className="empty-state">
        <p>아직 만든 코디가 없어요.</p>
        <p className="empty-state-sub">오른쪽 아래 + 버튼을 눌러 등록된 옷으로 첫 코디를 만들어보세요.</p>
      </div>
    );
  }

  return (
    <div className="cloth-grid">
      {outfits.map((outfit) => (
        <OutfitCard key={outfit.id} outfit={outfit} />
      ))}
    </div>
  );
}
