"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRoundIcon, MailIcon, ShieldCheckIcon, SparklesIcon } from "lucide-react";
import { StatusBanner } from "@/components/status-banner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AppApiError,
  clearAuthToken,
  getAuthToken,
  resetPassword,
  setAuthToken,
  signIn,
  signUp,
} from "@/lib/recipe-api";

type Mode = "signin" | "signup" | "reset";

const modeCopy = {
  signin: {
    title: "로그인",
    description: "이미 등록된 계정으로 작업실에 바로 진입합니다.",
    submitLabel: "로그인",
  },
  signup: {
    title: "회원가입",
    description: "새 계정을 만들고 즉시 개인 레시피 공간을 시작합니다.",
    submitLabel: "회원가입",
  },
  reset: {
    title: "비밀번호 재설정",
    description: "등록한 이메일로 재설정 안내를 발송합니다.",
    submitLabel: "재설정 메일 보내기",
  },
} as const;

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"error" | "success">("success");
  const [loading, setLoading] = useState(false);

  const redirectToWorkspace = useCallback(
    (path: string) => {
      if (typeof window !== "undefined") {
        window.location.assign(path);
        return;
      }
      router.replace(path);
    },
    [router],
  );

  useEffect(() => {
    if (getAuthToken()) {
      redirectToWorkspace("/recipes");
    }
  }, [redirectToWorkspace]);

  const getErrorMessage = (error: unknown) => {
    if (error instanceof AppApiError) {
      if (error.code === "INVALID_CREDENTIALS") {
        return "이메일 또는 비밀번호가 올바르지 않습니다.";
      }
      if (error.code === "EMAIL_EXISTS") {
        return "이미 사용 중인 이메일입니다. 바로 로그인해 보세요.";
      }
      return error.message;
    }

    if (error instanceof Error && error.message === "Failed to fetch") {
      return "API 서버에 연결할 수 없습니다. 백엔드가 실행 중인지 확인해 주세요.";
    }

    return error instanceof Error ? error.message : "요청 처리 중 알 수 없는 오류가 발생했습니다.";
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      if (mode === "signin") {
        clearAuthToken();
        const response = await signIn(email, password);
        setAuthToken(response.access_token);
        setMessageTone("success");
        setMessage("로그인되었습니다. 내 레시피 페이지로 이동합니다.");
        redirectToWorkspace("/recipes");
      } else if (mode === "signup") {
        clearAuthToken();
        const response = await signUp(email, password);
        setAuthToken(response.access_token);
        setMessageTone("success");
        setMessage("회원가입이 완료되었습니다. 자동으로 로그인하고 이동합니다.");
        redirectToWorkspace("/recipes");
      } else {
        await resetPassword(email);
        setMessageTone("success");
        setMessage("비밀번호 재설정 요청을 접수했습니다. 등록한 이메일을 확인해 주세요.");
      }
    } catch (error) {
      setMessageTone("error");
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const renderPanel = (value: Mode) => (
    <TabsContent value={value} className="mt-6 space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">{modeCopy[value].title}</h2>
        <p className="text-sm leading-6 text-muted-foreground">{modeCopy[value].description}</p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor={`email-${value}`}>이메일</Label>
          <div className="relative">
            <MailIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id={`email-${value}`}
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              className="pl-9"
            />
          </div>
        </div>
        {value !== "reset" ? (
          <div className="space-y-2">
            <Label htmlFor={`password-${value}`}>비밀번호</Label>
            <div className="relative">
              <KeyRoundIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id={`password-${value}`}
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={value === "signin" ? "current-password" : "new-password"}
                className="pl-9"
              />
            </div>
          </div>
        ) : null}
        <StatusBanner message={message} tone={messageTone} />
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "처리 중" : modeCopy[value].submitLabel}
        </Button>
      </form>
    </TabsContent>
  );

  return (
    <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <Card className="border-white/70 bg-white/82 shadow-2xl shadow-orange-950/5 backdrop-blur">
        <CardContent className="space-y-6 px-6 py-6 sm:px-8 sm:py-8">
          <div className="space-y-4">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <SparklesIcon className="size-4" />
              Account Access
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                레시피 작업실에 로그인해 초안과 공개 레시피를 함께 관리하세요.
              </h1>
              <p className="text-sm leading-7 text-muted-foreground sm:text-base">
                비공개 실험 레시피를 저장하고, 대표 이미지와 공개 상태를 검수한 뒤 바로 공개 페이지로
                전환할 수 있습니다.
              </p>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-2xl border border-orange-100 bg-orange-50/80 p-4">
              <p className="font-medium">개인 작업 공간</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                초안 저장, 수정, 삭제, 공개 전환을 계정 단위로 분리합니다.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
              <p className="flex items-center gap-2 font-medium">
                <ShieldCheckIcon className="size-4 text-emerald-700" />
                안전한 공개 전환
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                상세 페이지에서 대표 이미지와 공개 여부를 점검한 뒤 전환할 수 있습니다.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/70 bg-white/88 shadow-2xl shadow-orange-950/5 backdrop-blur">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl tracking-tight">계정 작업</CardTitle>
          <CardDescription>
            로그인, 회원가입, 비밀번호 재설정을 같은 화면에서 전환할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={mode} onValueChange={(value) => setMode(value as Mode)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="signin">로그인</TabsTrigger>
              <TabsTrigger value="signup">회원가입</TabsTrigger>
              <TabsTrigger value="reset">재설정</TabsTrigger>
            </TabsList>
            {renderPanel("signin")}
            {renderPanel("signup")}
            {renderPanel("reset")}
          </Tabs>
        </CardContent>
      </Card>
    </section>
  );
}
