import { useRef, useState } from "react";

/**
 * 카테고리/세부카테고리를 만들거나 수정하는 모달. 최상위 카테고리든 세부카테고리든
 * 데이터 구조가 같아서(부모가 있냐 없냐 차이) 폼 하나로 같이 쓴다.
 */
export default function CategoryFormModal({
  title,
  initialName = "",
  initialImagePreviewUrl = "",
  onClose,
  onSubmit,
}) {
  const [name, setName] = useState(initialName);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(initialImagePreviewUrl);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError("이름을 입력해주세요.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), imageFile });
      onClose();
    } catch (err) {
      setError(err.message || "저장 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </div>

        <form className="cloth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span className="field-label">이름</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 운동화, 아우터"
              autoFocus
            />
          </label>

          <label className="field">
            <span className="field-label">사진 (선택)</span>
            <div
              className="image-picker category-image-picker"
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
            >
              {imagePreviewUrl ? (
                <img src={imagePreviewUrl} alt="카테고리 사진 미리보기" className="image-picker-preview" />
              ) : (
                <div className="image-picker-placeholder">
                  <span>+ 사진 추가</span>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} hidden />
            </div>
          </label>

          {error && <p className="state-text state-error">{error}</p>}

          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>
              취소
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
