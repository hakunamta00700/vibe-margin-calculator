import type { Material } from "@/lib/recipe-api";


export type CalculatorRow = {
  id: string;
  materialId: number | null;
  materialName: string;
  customPrice: string;
  customWeightG: string;
  usedG: string;
};

export type CalculatorDraft = {
  productName: string;
  qty: string;
  sellPrice: string;
  etcCost: string;
  targetProfit: string;
  recipeName: string;
  selectedRecipeKey: string;
  rows: CalculatorRow[];
};

export type ComputedCalculatorRow = CalculatorRow & {
  material: Material | null;
  dbUnitCost: number;
  customUnitCost: number;
  appliedUnitCost: number;
  subCost: number;
  coupangLink: string | null;
};

export type CostSummary = {
  rows: ComputedCalculatorRow[];
  qty: number;
  sellPrice: number;
  etcCost: number;
  targetProfit: number;
  materialTotal: number;
  totalCost: number;
  unitCost: number;
  unitProfit: number;
  margin: number;
  profitRate: number;
  breakevenQty: number | null;
  targetPrice: number;
};

function createRowId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `row-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createEmptyCalculatorRow(): CalculatorRow {
  return {
    id: createRowId(),
    materialId: null,
    materialName: "",
    customPrice: "",
    customWeightG: "",
    usedG: "0",
  };
}

export function createDefaultCalculatorDraft(): CalculatorDraft {
  return {
    productName: "시그니처 소금빵",
    qty: "200",
    sellPrice: "2,500",
    etcCost: "130,000",
    targetProfit: "100,000",
    recipeName: "",
    selectedRecipeKey: "",
    rows: [createEmptyCalculatorRow()],
  };
}

export function parseMoney(value: string | number | null | undefined): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  const text = String(value ?? "")
    .replace(/,/g, "")
    .replace(/[^0-9.-]/g, "");
  if (!text) {
    return 0;
  }
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parseDecimal(value: string | number | null | undefined): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  const text = String(value ?? "")
    .replace(/,/g, "")
    .replace(/[^0-9.-]/g, "");
  if (!text) {
    return 0;
  }
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatInteger(value: number): string {
  return new Intl.NumberFormat("ko-KR").format(Math.round(value || 0));
}

export function formatMoneyInputValue(value: string): string {
  const amount = parseMoney(value);
  return amount > 0 ? formatInteger(amount) : "";
}

export function formatPercent(value: number): string {
  return Number.isFinite(value) ? `${(value * 100).toFixed(1)}%` : "0%";
}

function findMaterial(materials: Material[], row: CalculatorRow): Material | null {
  if (row.materialId !== null) {
    const byId = materials.find((material) => material.id === row.materialId);
    if (byId) {
      return byId;
    }
  }
  return materials.find((material) => material.name === row.materialName.trim()) ?? null;
}

export function calculateCostSummary(
  draft: Pick<CalculatorDraft, "qty" | "sellPrice" | "etcCost" | "targetProfit" | "rows">,
  materials: Material[],
): CostSummary {
  let materialTotal = 0;

  const rows = draft.rows.map((row) => {
    const material = findMaterial(materials, row);
    const dbUnitCost = material?.price_per_g ?? 0;
    const customPrice = parseMoney(row.customPrice);
    const customWeightG = parseDecimal(row.customWeightG);
    const customUnitCost = customPrice > 0 && customWeightG > 0 ? customPrice / customWeightG : 0;
    const appliedUnitCost = customUnitCost > 0 ? customUnitCost : dbUnitCost;
    const usedG = parseDecimal(row.usedG);
    const subCost = appliedUnitCost * usedG;
    materialTotal += subCost;

    return {
      ...row,
      material,
      dbUnitCost,
      customUnitCost,
      appliedUnitCost,
      subCost,
      coupangLink: material?.coupang_link ?? null,
    };
  });

  const qty = Math.max(parseMoney(draft.qty), 1);
  const sellPrice = parseMoney(draft.sellPrice);
  const etcCost = parseMoney(draft.etcCost);
  const targetProfit = parseMoney(draft.targetProfit);
  const totalCost = materialTotal + etcCost;
  const unitCost = totalCost / qty;
  const unitProfit = sellPrice - unitCost;
  const margin = unitCost > 0 ? unitProfit / unitCost : 0;
  const profitRate = sellPrice > 0 ? unitProfit / sellPrice : 0;
  const variablePerUnit = materialTotal / qty;
  const contribution = sellPrice - variablePerUnit;
  const breakevenQty = contribution > 0 ? Math.ceil(etcCost / contribution) : null;
  const targetPrice = (totalCost + targetProfit) / qty;

  return {
    rows,
    qty,
    sellPrice,
    etcCost,
    targetProfit,
    materialTotal,
    totalCost,
    unitCost,
    unitProfit,
    margin,
    profitRate,
    breakevenQty,
    targetPrice,
  };
}
