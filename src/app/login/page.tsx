"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setMessage(error.message);
      } else {
        router.push("/recipes");
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        setMessage(error.message);
      } else {
        setMessage("가입 요청이 접수되었습니다. 이메일 인증 링크가 필요하면 확인해 주세요.");
      }
    }
    setLoading(false);
  };

  return (
    <section>
      <h1>로그인 / 회원가입</h1>
      <form onSubmit={onSubmit} style={{ maxWidth: 420 }}>
        <div style={{ display: "grid", gap: 8 }}>
          <label>
            이메일
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              style={{ width: "100%" }}
            />
          </label>
          <label>
            비밀번호
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              style={{ width: "100%" }}
            />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? "처리 중" : mode === "signin" ? "로그인" : "회원가입"}
          </button>
        </div>
      </form>
      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <button type="button" onClick={() => setMode("signin")}>
          로그인
        </button>
        <button type="button" onClick={() => setMode("signup")}>
          회원가입
        </button>
      </div>
      {message && <p>{message}</p>}
    </section>
  );
}
