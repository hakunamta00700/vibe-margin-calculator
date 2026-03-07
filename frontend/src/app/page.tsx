"use client";

import { CalculatorIcon, FolderKanbanIcon } from "lucide-react";
import { CostCalculator } from "@/components/cost-calculator";
import { PublicRecipeBrowser } from "@/components/public-recipe-browser";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


export default function HomePage() {
  return (
    <section className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-white/70 bg-white/86 shadow-2xl shadow-orange-950/5 backdrop-blur">
          <CardContent className="flex h-full flex-col justify-between gap-6 px-6 py-6 sm:px-8 sm:py-8">
            <div className="space-y-4">
              <Badge variant="secondary" className="w-fit rounded-full px-3">
                Bakery Margin
              </Badge>
              <div className="space-y-3">
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  초기 커밋의 원가 계산 흐름을 현재 백엔드와 관리자 구조로 다시 연결했습니다.
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                  기본 재료 DB는 서버에서 자동 시드되고, 계산 레시피는 브라우저에 빠르게 저장됩니다.
                  공개 레시피 탐색은 그대로 유지해 메뉴 참고와 원가 계산을 한 화면에서 오갈 수 있게
                  정리했습니다.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <Card className="border-white/70 bg-white/80 shadow-lg shadow-orange-950/5 backdrop-blur">
            <CardContent className="space-y-3 px-6 py-5">
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                <CalculatorIcon className="size-4" />
                계산기
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                재료별 단가, 기타 비용, 목표 이익을 기준으로 개당 원가와 목표 판매가를 즉시 계산합니다.
              </p>
            </CardContent>
          </Card>
          <Card className="border-white/70 bg-white/80 shadow-lg shadow-orange-950/5 backdrop-blur">
            <CardContent className="space-y-3 px-6 py-5">
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-900">
                <FolderKanbanIcon className="size-4" />
                공개 아카이브
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                기존 공개 레시피 탐색과 개인 작업실 흐름도 그대로 함께 둘 수 있습니다.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="calculator" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calculator">원가 계산</TabsTrigger>
          <TabsTrigger value="archive">공개 레시피</TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="space-y-6">
          <CostCalculator />
        </TabsContent>

        <TabsContent value="archive" className="space-y-6">
          <PublicRecipeBrowser />
        </TabsContent>
      </Tabs>
    </section>
  );
}
