"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useState } from "react";
import {
  CalculatorIcon,
  ClipboardCopyIcon,
  DatabaseIcon,
  PlusIcon,
  TargetIcon,
  Trash2Icon,
} from "lucide-react";
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
import {
  calculateCostSummary,
  CalculatorDraft,
  createDefaultCalculatorDraft,
  createEmptyCalculatorRow,
  formatInteger,
  formatMoneyInputValue,
  formatPercent,
  parseDecimal,
} from "@/lib/costing";
import { getCurrentUserRoleFromToken, listMaterials, Material } from "@/lib/recipe-api";


const LOCAL_RECIPE_STORAGE_KEY = "vibe_margin_calculator_recipes_v1";

type SavedCalculatorRecipeMap = Record<
  string,
  {
    productName: string;
    qty: string;
    sellPrice: string;
    etcCost: string;
    targetProfit: string;
    rows: CalculatorDraft["rows"];
  }
>;


function readSavedRecipes(): SavedCalculatorRecipeMap {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(LOCAL_RECIPE_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as SavedCalculatorRecipeMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}


function writeSavedRecipes(recipes: SavedCalculatorRecipeMap): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(LOCAL_RECIPE_STORAGE_KEY, JSON.stringify(recipes));
}


async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}


function formatCurrency(value: number): string {
  return `${formatInteger(value)}원`;
}


function formatUnitCost(value: number): string {
  return value > 0 ? value.toFixed(2) : "0.00";
}


export function CostCalculator() {
  const [draft, setDraft] = useState<CalculatorDraft>(createDefaultCalculatorDraft());
  const [materials, setMaterials] = useState<Material[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<SavedCalculatorRecipeMap>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"error" | "success" | "info">("info");
  const [isAdmin, setIsAdmin] = useState(false);

  const summary = calculateCostSummary(draft, materials);
  const savedRecipeNames = Object.keys(savedRecipes).sort((left, right) => left.localeCompare(right));

  useEffect(() => {
    const load = async (): Promise<void> => {
      setLoading(true);
      setSavedRecipes(readSavedRecipes());
      setIsAdmin(getCurrentUserRoleFromToken() === "admin");

      try {
        const nextMaterials = await listMaterials({ limit: 5000 });
        setMaterials(nextMaterials);
        setTone("info");
        setMessage("");
      } catch (loadError) {
        setTone("error");
        setMessage((loadError as Error).message);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const updateField = (field: keyof CalculatorDraft, value: string): void => {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const formatMoneyField = (field: "sellPrice" | "etcCost" | "targetProfit"): void => {
    setDraft((current) => ({
      ...current,
      [field]: formatMoneyInputValue(current[field]),
    }));
  };

  const updateRow = (
    rowId: string,
    field: "materialName" | "customPrice" | "customWeightG" | "usedG",
    value: string,
  ): void => {
    setDraft((current) => ({
      ...current,
      rows: current.rows.map((row) => {
        if (row.id !== rowId) {
          return row;
        }

        if (field === "materialName") {
          const matchedMaterial = materials.find((material) => material.name === value.trim()) ?? null;
          return {
            ...row,
            materialName: value,
            materialId: matchedMaterial?.id ?? null,
          };
        }

        return {
          ...row,
          [field]: value,
        };
      }),
    }));
  };

  const deleteRow = (rowId: string): void => {
    setDraft((current) => {
      const nextRows = current.rows.filter((row) => row.id !== rowId);
      return {
        ...current,
        rows: nextRows.length > 0 ? nextRows : [createEmptyCalculatorRow()],
      };
    });
  };

  const addRow = (): void => {
    setDraft((current) => ({
      ...current,
      rows: [...current.rows, createEmptyCalculatorRow()],
    }));
  };

  const saveRecipe = (): void => {
    const name = draft.recipeName.trim() || draft.selectedRecipeKey.trim();
    if (!name) {
      setTone("error");
      setMessage("저장할 레시피 이름을 입력하세요.");
      return;
    }

    const nextRecipes = {
      ...savedRecipes,
      [name]: {
        productName: draft.productName,
        qty: draft.qty,
        sellPrice: draft.sellPrice,
        etcCost: draft.etcCost,
        targetProfit: draft.targetProfit,
        rows: draft.rows,
      },
    };

    writeSavedRecipes(nextRecipes);
    setSavedRecipes(nextRecipes);
    setDraft((current) => ({
      ...current,
      recipeName: name,
      selectedRecipeKey: name,
    }));
    setTone("success");
    setMessage("계산 레시피를 저장했습니다.");
  };

  const loadRecipe = (): void => {
    const key = draft.selectedRecipeKey.trim();
    if (!key) {
      setTone("error");
      setMessage("불러올 계산 레시피를 선택하세요.");
      return;
    }

    const saved = savedRecipes[key];
    if (!saved) {
      setTone("error");
      setMessage("선택한 계산 레시피를 찾을 수 없습니다.");
      return;
    }

    setDraft({
      productName: saved.productName,
      qty: saved.qty,
      sellPrice: saved.sellPrice,
      etcCost: saved.etcCost,
      targetProfit: saved.targetProfit,
      recipeName: key,
      selectedRecipeKey: key,
      rows: saved.rows.length > 0 ? saved.rows : [createEmptyCalculatorRow()],
    });
    setTone("success");
    setMessage("계산 레시피를 불러왔습니다.");
  };

  const deleteRecipe = (): void => {
    const key = draft.selectedRecipeKey.trim();
    if (!key) {
      setTone("error");
      setMessage("삭제할 계산 레시피를 선택하세요.");
      return;
    }

    const nextRecipes = { ...savedRecipes };
    delete nextRecipes[key];
    writeSavedRecipes(nextRecipes);
    setSavedRecipes(nextRecipes);
    setDraft((current) => ({
      ...current,
      recipeName: "",
      selectedRecipeKey: "",
    }));
    setTone("success");
    setMessage("계산 레시피를 삭제했습니다.");
  };

  const applyTargetPrice = (): void => {
    setDraft((current) => ({
      ...current,
      sellPrice: formatInteger(summary.targetPrice),
    }));
    setTone("success");
    setMessage("목표 이익 기준 판매가를 적용했습니다.");
  };

  const copySummary = async (): Promise<void> => {
    try {
      await copyToClipboard(
        [
          `상품명: ${draft.productName || "-"}`,
          `재료비 합계: ${formatCurrency(summary.materialTotal)}`,
          `총원가: ${formatCurrency(summary.totalCost)}`,
          `개당 원가: ${formatCurrency(summary.unitCost)}`,
          `개당 이익: ${formatCurrency(summary.unitProfit)}`,
          `마진율(원가 기준): ${formatPercent(summary.margin)}`,
          `이익률(매출 기준): ${formatPercent(summary.profitRate)}`,
          `손익분기 수량: ${summary.breakevenQty !== null ? `${formatInteger(summary.breakevenQty)}개` : "계산 불가"}`,
          `목표 이익 달성 판매가: ${formatCurrency(summary.targetPrice)}`,
        ].join("\n"),
      );
      setTone("success");
      setMessage("요약을 클립보드에 복사했습니다.");
    } catch {
      setTone("error");
      setMessage("요약 복사에 실패했습니다.");
    }
  };

  const copyRows = async (): Promise<void> => {
    try {
      const header = "재료명,사용량(g),DB단가(원/g),직접단가(원/g),적용단가(원/g),소계,구매링크";
      const rows = summary.rows.map((row) => {
        const link = row.coupangLink ?? "";
        return [
          row.materialName.replaceAll(",", " "),
          parseDecimal(row.usedG).toString(),
          formatUnitCost(row.dbUnitCost),
          formatUnitCost(row.customUnitCost),
          formatUnitCost(row.appliedUnitCost),
          formatInteger(row.subCost),
          link,
        ].join(",");
      });
      await copyToClipboard([header, ...rows].join("\n"));
      setTone("success");
      setMessage("재료 CSV를 클립보드에 복사했습니다.");
    } catch {
      setTone("error");
      setMessage("CSV 복사에 실패했습니다.");
    }
  };

  const onRecipeSelectChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    const nextKey = event.currentTarget.value;
    setDraft((current) => ({
      ...current,
      selectedRecipeKey: nextKey,
      recipeName: nextKey || current.recipeName,
    }));
  };

  return (
    <section className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-white/70 bg-white/88 shadow-2xl shadow-orange-950/5 backdrop-blur">
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full px-3">
                Legacy Calculator
              </Badge>
              <Badge variant="outline" className="rounded-full px-3">
                재료 {loading ? "--" : `${formatInteger(materials.length)}개`}
              </Badge>
            </div>
            <CardTitle className="text-2xl tracking-tight">원가 계산기</CardTitle>
            <CardDescription className="leading-6">
              초기 커밋의 계산 흐름을 현재 앱 구조로 옮겼습니다. 재료 DB는 백엔드에서 불러오고,
              계산 레시피는 브라우저에 저장합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <StatusBanner message={message} tone={tone} />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="productName">상품명</Label>
                <Input
                  id="productName"
                  value={draft.productName}
                  onChange={(event) => updateField("productName", event.target.value)}
                  placeholder="예: 시그니처 소금빵"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qty">생산 수량(개)</Label>
                <Input
                  id="qty"
                  type="number"
                  min={1}
                  value={draft.qty}
                  onChange={(event) => updateField("qty", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sellPrice">판매가(개당)</Label>
                <Input
                  id="sellPrice"
                  inputMode="numeric"
                  value={draft.sellPrice}
                  onChange={(event) => updateField("sellPrice", event.target.value)}
                  onBlur={() => formatMoneyField("sellPrice")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="etcCost">기타 비용</Label>
                <Input
                  id="etcCost"
                  inputMode="numeric"
                  value={draft.etcCost}
                  onChange={(event) => updateField("etcCost", event.target.value)}
                  onBlur={() => formatMoneyField("etcCost")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetProfit">목표 이익</Label>
                <Input
                  id="targetProfit"
                  inputMode="numeric"
                  value={draft.targetProfit}
                  onChange={(event) => updateField("targetProfit", event.target.value)}
                  onBlur={() => formatMoneyField("targetProfit")}
                />
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto_auto_auto]">
              <div className="space-y-2">
                <Label htmlFor="recipeName">저장 이름</Label>
                <Input
                  id="recipeName"
                  value={draft.recipeName}
                  onChange={(event) => updateField("recipeName", event.target.value)}
                  placeholder="예: 기본 소금빵"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="savedRecipe">저장 레시피</Label>
                <select
                  id="savedRecipe"
                  value={draft.selectedRecipeKey}
                  onChange={onRecipeSelectChange}
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                >
                  <option value="">선택</option>
                  {savedRecipeNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button type="button" variant="outline" onClick={saveRecipe} className="w-full">
                  저장
                </Button>
              </div>
              <div className="flex items-end">
                <Button type="button" variant="outline" onClick={loadRecipe} className="w-full">
                  불러오기
                </Button>
              </div>
              <div className="flex items-end">
                <Button type="button" variant="destructive" onClick={deleteRecipe} className="w-full">
                  삭제
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={addRow}>
                <PlusIcon className="size-4" />
                재료 행 추가
              </Button>
              <Button type="button" variant="outline" onClick={applyTargetPrice}>
                <TargetIcon className="size-4" />
                목표가 적용
              </Button>
              <Button type="button" variant="outline" onClick={() => void copySummary()}>
                <ClipboardCopyIcon className="size-4" />
                요약 복사
              </Button>
              <Button type="button" variant="outline" onClick={() => void copyRows()}>
                <ClipboardCopyIcon className="size-4" />
                CSV 복사
              </Button>
              {isAdmin ? (
                <Button asChild type="button" variant="ghost">
                  <Link href="/admin/materials">
                    <DatabaseIcon className="size-4" />
                    관리자 재료 관리
                  </Link>
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-white/82 shadow-lg shadow-orange-950/5 backdrop-blur">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-xl tracking-tight">
              <CalculatorIcon className="size-5 text-primary" />
              계산 결과
            </CardTitle>
            <CardDescription>초기 계산기에서 보이던 핵심 KPI를 현재 화면에서 바로 확인합니다.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {[
              ["재료비 합계", formatCurrency(summary.materialTotal)],
              ["총원가", formatCurrency(summary.totalCost)],
              ["개당 원가", formatCurrency(summary.unitCost)],
              ["개당 이익", formatCurrency(summary.unitProfit)],
              ["마진율(원가 기준)", formatPercent(summary.margin)],
              ["이익률(매출 기준)", formatPercent(summary.profitRate)],
              [
                "손익분기 수량",
                summary.breakevenQty !== null ? `${formatInteger(summary.breakevenQty)}개` : "계산 불가",
              ],
              ["목표 이익", formatCurrency(summary.targetProfit)],
              ["목표 판매가", formatCurrency(summary.targetPrice)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-border/70 bg-orange-50/60 p-4">
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/70 bg-white/84 shadow-lg shadow-orange-950/5 backdrop-blur">
        <CardHeader className="space-y-2">
          <CardTitle className="text-xl tracking-tight">재료 입력</CardTitle>
          <CardDescription>
            DB 단가를 기본으로 쓰고, 필요하면 직접 구매가/중량을 넣어 임시 단가를 덮어쓸 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <datalist id="material-list">
            {materials.map((material) => (
              <option key={material.id} value={material.name} />
            ))}
          </datalist>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] border-collapse">
              <thead>
                <tr className="border-b border-border/80 text-left text-sm text-muted-foreground">
                  <th className="px-3 py-2">재료 선택</th>
                  <th className="px-3 py-2">직접 구매가</th>
                  <th className="px-3 py-2">직접 중량(g)</th>
                  <th className="px-3 py-2 text-right">DB 단가</th>
                  <th className="px-3 py-2 text-right">직접 단가</th>
                  <th className="px-3 py-2 text-right">적용 단가</th>
                  <th className="px-3 py-2">사용량(g)</th>
                  <th className="px-3 py-2 text-right">소계</th>
                  <th className="px-3 py-2">구매 링크</th>
                  <th className="px-3 py-2">삭제</th>
                </tr>
              </thead>
              <tbody>
                {summary.rows.map((row) => (
                  <tr key={row.id} className="border-b border-border/60">
                    <td className="px-3 py-2">
                      <Input
                        list="material-list"
                        value={row.materialName}
                        onChange={(event) => updateRow(row.id, "materialName", event.target.value)}
                        placeholder="재료명 검색"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        inputMode="numeric"
                        value={row.customPrice}
                        onChange={(event) => updateRow(row.id, "customPrice", event.target.value)}
                        onBlur={(event) =>
                          updateRow(row.id, "customPrice", formatMoneyInputValue(event.target.value))
                        }
                        placeholder="예: 13,500"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={row.customWeightG}
                        onChange={(event) => updateRow(row.id, "customWeightG", event.target.value)}
                        placeholder="예: 450"
                      />
                    </td>
                    <td className="px-3 py-2 text-right text-sm text-muted-foreground">
                      {formatUnitCost(row.dbUnitCost)}
                    </td>
                    <td className="px-3 py-2 text-right text-sm text-muted-foreground">
                      {formatUnitCost(row.customUnitCost)}
                    </td>
                    <td className="px-3 py-2 text-right text-sm font-medium">
                      {formatUnitCost(row.appliedUnitCost)}
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={row.usedG}
                        onChange={(event) => updateRow(row.id, "usedG", event.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2 text-right text-sm font-medium">
                      {formatCurrency(row.subCost)}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      {row.coupangLink ? (
                        <a
                          href={row.coupangLink}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          링크 열기
                        </a>
                      ) : (
                        <span className="text-muted-foreground">없음</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <Button type="button" variant="ghost" size="sm" onClick={() => deleteRow(row.id)}>
                        <Trash2Icon className="size-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">재료 데이터를 불러오는 중입니다.</p>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
