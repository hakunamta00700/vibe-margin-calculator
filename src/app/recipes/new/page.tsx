"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function NewRecipePage() {
  const supabase = createBrowserSupabaseClient();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      setMessage("로그인이 필요합니다.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("recipes").insert([
      {
        user_id: authData.user.id,
        title,
        description,
        ingredients: [],
        steps: [],
        is_public: isPublic,
      },
    ]);

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setTitle("");
    setDescription("");
    setMessage("저장되었습니다.");
    setLoading(false);
    router.refresh();
  };

  return (
    <section>
      <h1>레시피 등록</h1>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 8, maxWidth: 600 }}>
        <label>
          제목
          <input value={title} onChange={(event) => setTitle(event.target.value)} required />
        </label>
        <label>
          설명
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>
        <label>
          <input type="checkbox" checked={isPublic} onChange={(event) => setIsPublic(event.target.checked)} />
          공개 레시피
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "저장 중" : "저장"}
        </button>
      </form>
      {message && <p>{message}</p>}
    </section>
  );
}
