import { useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";

export default function Login() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    setSubmitting(true);
    try {
      if (mode === "signup") {
        await signUp(email, password);
        setNotice("가입 확인 이메일을 보냈어요. 메일함을 확인한 뒤 로그인해주세요.");
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      setError(err.message || "요청 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-view">
      <h1 className="page-title">{mode === "signup" ? "회원가입" : "로그인"}</h1>
      <p className="page-subtitle">
        {mode === "signup"
          ? "이메일과 비밀번호로 계정을 만들어 나만의 옷장을 시작하세요."
          : "등록하신 이메일과 비밀번호로 로그인하세요."}
      </p>

      <div className="tabs">
        <button
          type="button"
          className={`tab ${mode === "signin" ? "tab-active" : ""}`}
          onClick={() => setMode("signin")}
        >
          로그인
        </button>
        <button
          type="button"
          className={`tab ${mode === "signup" ? "tab-active" : ""}`}
          onClick={() => setMode("signup")}
        >
          회원가입
        </button>
      </div>

      <form className="cloth-form" onSubmit={handleSubmit}>
        <label className="field">
          <span className="field-label">이메일</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </label>

        <label className="field">
          <span className="field-label">비밀번호</span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="6자 이상"
          />
        </label>

        {notice && <p className="ai-notice">{notice}</p>}
        {error && <p className="state-text state-error">{error}</p>}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "처리 중..." : mode === "signup" ? "회원가입" : "로그인"}
          </button>
        </div>
      </form>
    </div>
  );
}
