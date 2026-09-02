import OutfitBuilder from "./OutfitBuilder.jsx";

export default function OutfitModal({ title = "새 코디 만들기", onClose, ...builderProps }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </div>
        <div className="modal-body">
          <OutfitBuilder onCancel={onClose} {...builderProps} />
        </div>
      </div>
    </div>
  );
}
