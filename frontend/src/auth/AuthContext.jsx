import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = 아직 확인 전, null = 로그아웃 상태
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function signUp(email, password) {
    setError("");
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
      throw error;
    }
  }

  async function signIn(email, password) {
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      throw error;
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  /** 비밀번호 재설정 메일을 보낸다. 메일 속 링크를 누르면 /reset-password로 돌아온다. */
  async function resetPassword(email) {
    setError("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      setError(error.message);
      throw error;
    }
  }

  /** 재설정 메일 링크를 눌러 들어온 상태(임시 세션)에서 새 비밀번호로 교체한다. */
  async function updatePassword(newPassword) {
    setError("");
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setError(error.message);
      throw error;
    }
  }

  const value = {
    session,
    user: session?.user ?? null,
    loading: session === undefined,
    error,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth는 AuthProvider 안에서만 사용할 수 있습니다.");
  return ctx;
}
