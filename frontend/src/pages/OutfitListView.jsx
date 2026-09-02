import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getOutfits, createOutfit } from "../api/client.js";
import OutfitGrid from "../components/OutfitGrid.jsx";
import OutfitModal from "../components/OutfitModal.jsx";

export default function OutfitListView() {
  const [outfits, setOutfits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setOutfits(await getOutfits());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(fields) {
    const outfit = await createOutfit(fields);
    setOutfits((prev) => [outfit, ...prev]);
    setShowModal(false);
  }

  return (
    <div className="category-view">
      <div className="category-view-header">
        <Link to="/" className="back-link">
          ← 카테고리
        </Link>
        <h1 className="page-title">코디</h1>
      </div>

      {loading && <p className="state-text">불러오는 중...</p>}
      {error && <p className="state-text state-error">{error}</p>}

      {!loading && !error && <OutfitGrid outfits={outfits} />}

      <button
        type="button"
        className="fab"
        onClick={() => setShowModal(true)}
        aria-label="새 코디 만들기"
      >
        +
      </button>

      {showModal && <OutfitModal onClose={() => setShowModal(false)} onSubmit={handleCreate} />}
    </div>
  );
}
