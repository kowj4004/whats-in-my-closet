import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

/**
 * 비밀번호 재설정 메일의 링크를 누르면 이 페이지로 돌아온다.
 * 그 시점에 Supabase가 임시(recovery) 세션을 이미 만들어준 상태이므로,
 * 새 비밀번호만 입력받아 updateUser로 교체하면 된다.
 */
export default function ResetPassword() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await updatePassword(password);
      setDone(true);
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      setError(err.message || "비밀번호 변경 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-view">
      <h1 className="page-title">새 비밀번호 설정</h1>
      <p className="page-subtitle">새로 사용할 비밀번호를 입력해주세요.</p>

      {done ? (
        <p className="ai-notice">비밀번호가 변경됐어요. 잠시 후 옷장으로 이동합니다.</p>
      ) : (
        <form className="cloth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span className="field-label">새 비밀번호</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6자 이상"
            />
          </label>

          {error && <p className="state-text state-error">{error}</p>}

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "변경 중..." : "비밀번호 변경"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
