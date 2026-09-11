import { useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";

export default function Login() {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState("signin"); // "signin" | "signup" | "reset"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function switchMode(next) {
    setMode(next);
    setError("");
    setNotice("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    setSubmitting(true);
    try {
      if (mode === "signup") {
        await signUp(email, password);
        setNotice("가입 확인 이메일을 보냈어요. 메일함을 확인한 뒤 로그인해주세요.");
      } else if (mode === "reset") {
        await resetPassword(email);
        setNotice("비밀번호 재설정 메일을 보냈어요. 메일함을 확인해주세요.");
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      setError(err.message || "요청 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  const titles = { signin: "로그인", signup: "회원가입", reset: "비밀번호 재설정" };
  const subtitles = {
    signin: "등록하신 이메일과 비밀번호로 로그인하세요.",
    signup: "이메일과 비밀번호로 계정을 만들어 나만의 옷장을 시작하세요.",
    reset: "가입하신 이메일로 비밀번호 재설정 링크를 보내드려요.",
  };

  return (
    <div className="login-view">
      <h1 className="page-title">{titles[mode]}</h1>
      <p className="page-subtitle">{subtitles[mode]}</p>

      {mode !== "reset" && (
        <div className="tabs">
          <button
            type="button"
            className={`tab ${mode === "signin" ? "tab-active" : ""}`}
            onClick={() => switchMode("signin")}
          >
            로그인
          </button>
          <button
            type="button"
            className={`tab ${mode === "signup" ? "tab-active" : ""}`}
            onClick={() => switchMode("signup")}
          >
            회원가입
          </button>
        </div>
      )}

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

        {mode !== "reset" && (
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
        )}

        {mode === "signin" && (
          <button type="button" className="login-forgot-link" onClick={() => switchMode("reset")}>
            비밀번호를 잊으셨나요?
          </button>
        )}

        {notice && <p className="ai-notice">{notice}</p>}
        {error && <p className="state-text state-error">{error}</p>}

        <div className="form-actions">
          {mode === "reset" && (
            <button type="button" className="btn btn-ghost" onClick={() => switchMode("signin")}>
              취소
            </button>
          )}
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting
              ? "처리 중..."
              : mode === "signup"
                ? "회원가입"
                : mode === "reset"
                  ? "재설정 메일 보내기"
                  : "로그인"}
          </button>
        </div>
      </form>
    </div>
  );
}
