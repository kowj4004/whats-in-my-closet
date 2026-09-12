import { useState } from "react";
import { createCloth } from "../api/client.js";
import ManualEntryForm from "./ManualEntryForm.jsx";
import CaptureOcrEntry from "./CaptureOcrEntry.jsx";

export default function AddClothModal({ categoryId, categoryChoices = [], onClose, onCreated }) {
  const [mode, setMode] = useState("manual"); // "manual" | "capture"

  async function handleCreate(fields) {
    const result = await createCloth(fields);
    onCreated(result.item);
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>새 옷 등록</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </div>

        <div className="tabs">
          <button
            type="button"
            className={`tab ${mode === "manual" ? "tab-active" : ""}`}
            onClick={() => setMode("manual")}
          >
            직접 입력
          </button>
          <button
            type="button"
            className={`tab ${mode === "capture" ? "tab-active" : ""}`}
            onClick={() => setMode("capture")}
          >
            이미지로 자동 입력
          </button>
        </div>

        <div className="modal-body">
          {mode === "manual" ? (
            <ManualEntryForm
              requireImage
              submitLabel="등록하기"
              categoryId={categoryId}
              categoryChoices={categoryChoices}
              onSubmit={handleCreate}
              onCancel={onClose}
            />
          ) : (
            <CaptureOcrEntry
              categoryId={categoryId}
              categoryChoices={categoryChoices}
              onSubmit={handleCreate}
              onCancel={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}
