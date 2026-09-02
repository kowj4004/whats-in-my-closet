import ClothCard from "./ClothCard.jsx";

export default function ClothGrid({ clothes, categoryId }) {
  if (!clothes.length) {
    return (
      <div className="empty-state">
        <p>아직 등록된 옷이 없어요.</p>
        <p className="empty-state-sub">오른쪽 아래 + 버튼을 눌러 첫 옷을 등록해보세요.</p>
      </div>
    );
  }

  return (
    <div className="cloth-grid">
      {clothes.map((cloth) => (
        <ClothCard key={cloth.id} cloth={cloth} categoryId={categoryId} />
      ))}
    </div>
  );
}
