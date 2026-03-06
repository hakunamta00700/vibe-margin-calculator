"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { clearAuthToken, resetPassword, setAuthToken, signIn, signUp } from "@/lib/recipe-api";

type Mode = "signin" | "signup" | "reset";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setLoading(true);
    clearAuthToken();

    try {
      if (mode === "signin") {
        const response = await signIn(email, password);
        setAuthToken(response.access_token);
        router.push("/recipes");
      } else if (mode === "signup") {
        const response = await signUp(email, password);
        setAuthToken(response.access_token);
        setMessage("회원가입이 완료되어 로그인되었습니다.");
        router.push("/recipes");
      } else {
        await resetPassword(email);
        setMessage("재설정 요청이 접수되었습니다.");
      }
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <h1>로그인 / 회원가입 / 비밀번호 재설정</h1>
      <div className="card toolbar" style={{ gridTemplateColumns: "auto auto" }}>
        <button
          type="button"
          onClick={() => setMode("signin")}
          style={{ background: mode === "signin" ? "#0f172a" : "#64748b" }}
        >
          로그인
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          style={{ background: mode === "signup" ? "#0f172a" : "#64748b" }}
        >
          회원가입
        </button>
        <button
          type="button"
          onClick={() => setMode("reset")}
          style={{ background: mode === "reset" ? "#0f172a" : "#64748b" }}
        >
          비밀번호 재설정
        </button>
      </div>
      <form className="card" onSubmit={handleSubmit}>
        <div className="toolbar">
          <label>
            이메일
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
          </label>
          {mode !== "reset" && (
            <label>
              비밀번호
              <input
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />
            </label>
          )}
          <button type="submit" disabled={loading}>
            {loading ? "요청 중" : mode === "signin" ? "로그인" : mode === "signup" ? "회원가입" : "재설정"}
          </button>
        </div>
      </form>
      {message && <p>{message}</p>}
    </section>
  );
}
