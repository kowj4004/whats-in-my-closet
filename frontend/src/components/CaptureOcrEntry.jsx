import { useEffect, useRef, useState } from "react";
import { extractClothInfo } from "../api/client.js";
import ManualEntryForm from "./ManualEntryForm.jsx";

/**
 * 이미지 캡처 → AI/OCR 분석 → 결과 확인/수정 → 저장 흐름.
 * 1단계: 이미지를 선택하고 "분석하기"를 누르면 서버에 분석을 요청한다.
 * 2단계: 분석 결과(구매처/사이즈/가격/메모)를 ManualEntryForm에 프리필하여
 *        사용자가 확인/수정한 뒤에만 실제로 저장한다 (AI 결과를 바로 확정하지 않음).
 */
export default function CaptureOcrEntry({ categoryId, categoryChoices, onSubmit, onCancel }) {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState(null); // { fields, available, message }
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setAnalysis(null);
      setError("");
    }
  }

  async function handleAnalyze() {
    if (!imageFile) {
      setError("먼저 분석할 이미지를 선택해주세요.");
      return;
    }
    setAnalyzing(true);
    setError("");
    try {
      const result = await extractClothInfo(imageFile);
      setAnalysis(result);
    } catch (err) {
      setError(err.message || "이미지 분석 중 오류가 발생했습니다.");
    } finally {
      setAnalyzing(false);
    }
  }

  if (analysis) {
    return (
      <ManualEntryForm
        initialValues={analysis.fields}
        initialImageFile={imageFile}
        requireImage
        aiNotice={analysis.message}
        submitLabel="확인하고 등록하기"
        categoryId={categoryId}
        categoryChoices={categoryChoices}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    );
  }

  return (
    <div className="capture-entry">
      <p className="capture-guide">
        옷 사진이나 구매 내역/쇼핑몰 화면 캡처를 업로드하면 AI가 구매처, 사이즈, 가격 등을
        자동으로 읽어와요. 분석 결과는 저장 전에 직접 확인하고 수정할 수 있어요.
      </p>

      <div
        className="image-picker"
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        {imagePreviewUrl ? (
          <img src={imagePreviewUrl} alt="캡처 이미지 미리보기" className="image-picker-preview" />
        ) : (
          <div className="image-picker-placeholder">
            <span>+ 이미지 선택</span>
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} hidden />
      </div>

      {error && <p className="state-text state-error">{error}</p>}

      <div className="form-actions">
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={analyzing}>
            취소
          </button>
        )}
        <button type="button" className="btn btn-primary" onClick={handleAnalyze} disabled={analyzing}>
          {analyzing ? "분석 중..." : "분석하기"}
        </button>
      </div>
    </div>
  );
}
