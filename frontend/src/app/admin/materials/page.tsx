"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { PencilLineIcon, RefreshCwIcon, ShieldCheckIcon, Trash2Icon } from "lucide-react";
import { StatusBanner } from "@/components/status-banner";
import { Badge } from "@/components/ui/badge";
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
import { formatInteger, formatMoneyInputValue, parseMoney } from "@/lib/costing";
import {
  createMaterial,
  deleteMaterial,
  getCurrentUserRoleFromToken,
  listAdminMaterials,
  Material,
  reseedMaterials,
  updateMaterial,
} from "@/lib/recipe-api";


type MaterialFormState = {
  name: string;
  price: string;
  weight_g: string;
  coupang_link: string;
  source_keyword: string;
  product_id: string;
};

const EMPTY_FORM: MaterialFormState = {
  name: "",
  price: "",
  weight_g: "",
  coupang_link: "",
  source_keyword: "",
  product_id: "",
};


export default function AdminMaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<MaterialFormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"error" | "success" | "info">("info");
  const [reseedMessage, setReseedMessage] = useState("");
  const isAdmin = getCurrentUserRoleFromToken() === "admin";

  const load = async (nextQuery = query): Promise<void> => {
    setLoading(true);
    try {
      const data = await listAdminMaterials({
        q: nextQuery || undefined,
        limit: 5000,
      });
      setMaterials(data);
      setMessage("");
      setTone("info");
    } catch (loadError) {
      setTone("error");
      setMessage((loadError as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    void load("");
  }, [isAdmin]);

  const resetForm = (): void => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const payload = {
      name: form.name.trim(),
      price: parseMoney(form.price),
      weight_g: parseMoney(form.weight_g),
      coupang_link: form.coupang_link.trim() || undefined,
      source_keyword: form.source_keyword.trim() || undefined,
      product_id: form.product_id.trim() || undefined,
    };

    if (!payload.name || payload.price <= 0 || payload.weight_g <= 0) {
      setTone("error");
      setMessage("재료명, 구매가, 중량을 모두 입력하세요.");
      return;
    }

    try {
      if (editingId === null) {
        await createMaterial(payload);
        setTone("success");
        setMessage("재료를 추가했습니다.");
      } else {
        await updateMaterial(editingId, payload);
        setTone("success");
        setMessage("재료를 수정했습니다.");
      }
      resetForm();
      await load();
    } catch (submitError) {
      setTone("error");
      setMessage((submitError as Error).message);
    }
  };

  const onDelete = async (material: Material): Promise<void> => {
    if (!window.confirm(`"${material.name}" 재료를 삭제할까요?`)) {
      return;
    }
    try {
      await deleteMaterial(material.id);
      setTone("success");
      setMessage("재료를 삭제했습니다.");
      if (editingId === material.id) {
        resetForm();
      }
      await load();
    } catch (deleteError) {
      setTone("error");
      setMessage((deleteError as Error).message);
    }
  };

  const onReseed = async (): Promise<void> => {
    try {
      const report = await reseedMaterials();
      setReseedMessage(
        `processed ${report.processed}, created ${report.created}, updated ${report.updated}, skipped ${report.skipped}`,
      );
      setTone("success");
      setMessage("시드 데이터를 다시 반영했습니다.");
      await load();
    } catch (reseedError) {
      setTone("error");
      setMessage((reseedError as Error).message);
    }
  };

  const onEdit = (material: Material): void => {
    setEditingId(material.id);
    setForm({
      name: material.name,
      price: formatInteger(material.price),
      weight_g: String(material.weight_g),
      coupang_link: material.coupang_link ?? "",
      source_keyword: material.source_keyword ?? "",
      product_id: material.product_id ?? "",
    });
    setTone("info");
    setMessage(`"${material.name}" 편집 중`);
  };

  const manualCount = materials.filter((material) => material.is_manual).length;
  const seededCount = materials.length - manualCount;

  if (!isAdmin) {
    return (
      <section className="space-y-4">
        <StatusBanner message="관리자 권한이 필요합니다." tone="error" />
        <Button asChild variant="outline">
          <Link href="/">원가 계산기로 돌아가기</Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <Badge variant="secondary" className="w-fit rounded-full px-3">
            Admin
          </Badge>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">재료 DB 관리</h1>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              초기 데이터 시드를 다시 반영하고, 수동으로 재료를 추가하거나 수정할 수 있습니다.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={() => void onReseed()}>
            <RefreshCwIcon className="size-4" />
            시드 재반영
          </Button>
          <Button asChild variant="ghost">
            <Link href="/">원가 계산기로 이동</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-white/70 bg-white/82 shadow-lg shadow-orange-950/5 backdrop-blur">
          <CardContent className="space-y-2 px-6 py-5">
            <p className="text-sm font-medium text-muted-foreground">전체 재료</p>
            <p className="text-3xl font-semibold tracking-tight">{loading ? "--" : formatInteger(materials.length)}</p>
          </CardContent>
        </Card>
        <Card className="border-white/70 bg-white/82 shadow-lg shadow-orange-950/5 backdrop-blur">
          <CardContent className="space-y-2 px-6 py-5">
            <p className="text-sm font-medium text-muted-foreground">수동 등록/수정</p>
            <p className="text-3xl font-semibold tracking-tight">{loading ? "--" : formatInteger(manualCount)}</p>
          </CardContent>
        </Card>
        <Card className="border-white/70 bg-white/82 shadow-lg shadow-orange-950/5 backdrop-blur">
          <CardContent className="space-y-2 px-6 py-5">
            <p className="text-sm font-medium text-muted-foreground">시드 유지</p>
            <p className="text-3xl font-semibold tracking-tight">{loading ? "--" : formatInteger(seededCount)}</p>
          </CardContent>
        </Card>
      </div>

      <StatusBanner message={message || reseedMessage} tone={tone} />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-white/70 bg-white/88 shadow-2xl shadow-orange-950/5 backdrop-blur">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-xl tracking-tight">
              <ShieldCheckIcon className="size-5 text-primary" />
              {editingId === null ? "재료 추가" : "재료 수정"}
            </CardTitle>
            <CardDescription>수동 수정값은 이후 자동 시드에서도 보존됩니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">재료명</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="price">구매가</Label>
                  <Input
                    id="price"
                    inputMode="numeric"
                    value={form.price}
                    onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                    onBlur={(event) =>
                      setForm((current) => ({
                        ...current,
                        price: formatMoneyInputValue(event.target.value),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight_g">중량(g)</Label>
                  <Input
                    id="weight_g"
                    type="number"
                    min={1}
                    value={form.weight_g}
                    onChange={(event) => setForm((current) => ({ ...current, weight_g: event.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="coupang_link">구매 링크</Label>
                <Input
                  id="coupang_link"
                  value={form.coupang_link}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, coupang_link: event.target.value }))
                  }
                  placeholder="https://link.coupang.com/..."
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="source_keyword">분류 키워드</Label>
                  <Input
                    id="source_keyword"
                    value={form.source_keyword}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, source_keyword: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product_id">상품 ID</Label>
                  <Input
                    id="product_id"
                    value={form.product_id}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, product_id: event.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button type="submit">{editingId === null ? "재료 추가" : "변경 저장"}</Button>
                {editingId !== null ? (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    편집 취소
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-white/84 shadow-lg shadow-orange-950/5 backdrop-blur">
          <CardHeader className="space-y-3">
            <CardTitle className="text-xl tracking-tight">재료 목록</CardTitle>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void load();
              }}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="재료명, 키워드, 상품 ID 검색"
              />
              <Button type="submit" variant="outline">
                검색
              </Button>
            </form>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse">
                <thead>
                  <tr className="border-b border-border/80 text-left text-sm text-muted-foreground">
                    <th className="px-3 py-2">재료명</th>
                    <th className="px-3 py-2 text-right">구매가</th>
                    <th className="px-3 py-2 text-right">중량</th>
                    <th className="px-3 py-2 text-right">원/g</th>
                    <th className="px-3 py-2">키워드</th>
                    <th className="px-3 py-2">출처</th>
                    <th className="px-3 py-2">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map((material) => (
                    <tr key={material.id} className="border-b border-border/60">
                      <td className="px-3 py-2">
                        <div className="space-y-1">
                          <p className="font-medium">{material.name}</p>
                          {material.product_id ? (
                            <p className="text-xs text-muted-foreground">ID {material.product_id}</p>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right">{formatInteger(material.price)}원</td>
                      <td className="px-3 py-2 text-right">{formatInteger(material.weight_g)}g</td>
                      <td className="px-3 py-2 text-right">{material.price_per_g.toFixed(4)}</td>
                      <td className="px-3 py-2">{material.source_keyword ?? "-"}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant={material.is_manual ? "secondary" : "outline"}>
                            {material.is_manual ? "manual" : "seed"}
                          </Badge>
                          {material.seed_sources.slice(0, 2).map((source) => (
                            <Badge key={source} variant="outline" className="rounded-full px-2">
                              {source}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-2">
                          <Button type="button" size="sm" variant="outline" onClick={() => onEdit(material)}>
                            <PencilLineIcon className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => void onDelete(material)}
                          >
                            <Trash2Icon className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {loading ? (
              <p className="text-sm text-muted-foreground">재료 목록을 불러오는 중입니다.</p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
