import { useEffect, useRef, useState } from "react";

/**
 * 옷 등록/수정에 공통으로 쓰이는 입력 폼.
 * - 수기 입력, OCR 결과 확인/수정, 상세 화면의 수정 모두 이 컴포넌트를 재사용한다.
 */
export default function ManualEntryForm({
  initialValues = {},
  initialImageFile = null,
  initialImagePreviewUrl = "",
  requireImage = true,
  aiNotice = "",
  submitLabel = "저장",
  onSubmit,
  onCancel,
}) {
  const [store, setStore] = useState(initialValues.store || "");
  const [size, setSize] = useState(initialValues.size || "");
  const [price, setPrice] = useState(
    initialValues.price === null || initialValues.price === undefined ? "" : String(initialValues.price)
  );
  const [memo, setMemo] = useState(initialValues.memo || "");
  const [imageFile, setImageFile] = useState(initialImageFile);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(initialImagePreviewUrl);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!imageFile) return;
    const url = URL.createObjectURL(imageFile);
    setImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (file) setImageFile(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (requireImage && !imageFile && !imagePreviewUrl) {
      setError("옷 사진을 등록해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        store,
        size,
        price: price === "" ? "" : Number(price),
        memo,
        imageFile,
      });
    } catch (err) {
      setError(err.message || "저장 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="cloth-form" onSubmit={handleSubmit}>
      {aiNotice && <div className="ai-notice">{aiNotice}</div>}

      <div
        className="image-picker"
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        {imagePreviewUrl ? (
          <img src={imagePreviewUrl} alt="옷 사진 미리보기" className="image-picker-preview" />
        ) : (
          <div className="image-picker-placeholder">
            <span>+ 옷 사진 추가</span>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          hidden
        />
      </div>

      <label className="field">
        <span className="field-label">구매처</span>
        <input
          type="text"
          value={store}
          onChange={(e) => setStore(e.target.value)}
          placeholder="예: 무신사, 나이키 홍대점"
        />
      </label>

      <label className="field">
        <span className="field-label">사이즈</span>
        <input
          type="text"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          placeholder="예: M, 95, 270"
        />
      </label>

      <label className="field">
        <span className="field-label">가격</span>
        <input
          type="number"
          min="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="예: 59000"
        />
      </label>

      <label className="field">
        <span className="field-label">메모</span>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="색상, 소재, 코디 아이디어 등 자유롭게 메모하세요."
          rows={3}
        />
      </label>

      {error && <p className="state-text state-error">{error}</p>}

      <div className="form-actions">
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={submitting}>
            취소
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "저장 중..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
