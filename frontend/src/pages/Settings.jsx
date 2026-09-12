import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getSettings, updateSettings } from "../api/client.js";

export default function Settings() {
  const navigate = useNavigate();
  const [sharingEnabled, setSharingEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [friendEmail, setFriendEmail] = useState("");

  useEffect(() => {
    getSettings()
      .then((s) => setSharingEnabled(s.sharingEnabled))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleToggle() {
    setSaving(true);
    setError("");
    try {
      const updated = await updateSettings({ sharingEnabled: !sharingEnabled });
      setSharingEnabled(updated.sharingEnabled);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleViewFriend(e) {
    e.preventDefault();
    if (friendEmail.trim()) navigate(`/shared/${encodeURIComponent(friendEmail.trim())}`);
  }

  return (
    <div className="settings-view">
      <Link to="/" className="back-link">
        ← 카테고리
      </Link>
      <h1 className="page-title">설정</h1>

      {loading && <p className="state-text">불러오는 중...</p>}

      {!loading && (
        <section className="settings-section">
          <h2 className="settings-section-title">내 옷장 공유</h2>
          <p className="page-subtitle">
            켜두면 내 이메일을 아는 사람이 내 옷장을 열람할 수 있어요. 상대방은 보기만 가능하고
            수정하거나 삭제할 수는 없습니다.
          </p>
          <label className="settings-toggle">
            <input type="checkbox" checked={sharingEnabled} onChange={handleToggle} disabled={saving} />
            <span>{sharingEnabled ? "공유 켜짐" : "공유 꺼짐"}</span>
          </label>
        </section>
      )}

      <section className="settings-section">
        <h2 className="settings-section-title">다른 사람 옷장 보기</h2>
        <p className="page-subtitle">상대방이 공유를 켜뒀다면 이메일로 옷장을 볼 수 있어요.</p>
        <form className="settings-friend-form" onSubmit={handleViewFriend}>
          <input
            type="email"
            value={friendEmail}
            onChange={(e) => setFriendEmail(e.target.value)}
            placeholder="상대방 이메일"
          />
          <button type="submit" className="btn btn-primary">
            보기
          </button>
        </form>
      </section>

      {error && <p className="state-text state-error">{error}</p>}
    </div>
  );
}
