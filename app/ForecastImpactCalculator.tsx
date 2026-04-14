"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Briefcase, DollarSign, Calculator, BarChart3 } from "lucide-react";

const currency = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);

const percent = (n: number) => `${(Number.isFinite(n) ? n : 0).toFixed(1)}%`;

function safeNum(v: string | number) {
  const n = parseFloat(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

function pctComplete(costToDate: number, forecastCost: number) {
  if (forecastCost <= 0) return 0;
  return clamp((costToDate / forecastCost) * 100, 0, 999);
}

function earnedRevenue(contract: number, costToDate: number, forecastCost: number) {
  return (pctComplete(costToDate, forecastCost) / 100) * contract;
}

function monthMarginPercent(revenueThisMonth: number, costThisMonth: number) {
  if (revenueThisMonth <= 0) return 0;
  return ((revenueThisMonth - costThisMonth) / revenueThisMonth) * 100;
}

function semanticDelta(
  delta: number,
  trend: "higher_is_better" | "lower_is_better" | "neutral" = "higher_is_better",
) {
  if (delta === 0 || trend === "neutral") {
    return {
      text: "text-slate-700",
      pill: "bg-slate-100 text-slate-600",
      card: "border-slate-200",
      icon: <Minus className="h-4 w-4" />,
    };
  }

  const favorable = trend === "higher_is_better" ? delta > 0 : delta < 0;

  if (favorable) {
    return {
      text: "text-green-700",
      pill: "bg-green-50 text-green-700",
      card: "border-green-200",
      icon: delta > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />,
    };
  }

  return {
    text: "text-red-700",
    pill: "bg-red-50 text-red-700",
    card: "border-red-200",
    icon: delta > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />,
  };
}

function formatInputCurrency(v: string | number) {
  const n = safeNum(v);
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: n % 1 !== 0 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(n);
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input type="text" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function MoneyField({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const [displayValue, setDisplayValue] = useState(value === 0 ? "" : String(value));
  const [isFocused, setIsFocused] = useState(false);

  React.useEffect(() => {
    if (!isFocused) {
      setDisplayValue(value === 0 ? "" : formatInputCurrency(value));
    }
  }, [value, isFocused]);

  function handleChange(raw: string) {
    const cleaned = raw.replace(/[^0-9.]/g, "");
    const firstDot = cleaned.indexOf(".");
    const normalized =
      firstDot === -1
        ? cleaned
        : `${cleaned.slice(0, firstDot + 1)}${cleaned.slice(firstDot + 1).replace(/\./g, "")}`;

    setDisplayValue(normalized);

    if (normalized === "" || normalized === ".") {
      onChange(0);
      return;
    }

    onChange(safeNum(normalized));
  }

  function handleFocus() {
    setIsFocused(true);
    setDisplayValue(value === 0 ? "" : String(value));
  }

  function handleBlur() {
    setIsFocused(false);
    if (displayValue === "" || displayValue === ".") {
      setDisplayValue("");
      onChange(0);
      return;
    }

    const parsed = safeNum(displayValue);
    onChange(parsed);
    setDisplayValue(formatInputCurrency(parsed));
  }

  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">$</div>
        <Input
          type="text"
          inputMode="decimal"
          className="pl-7"
          value={displayValue}
          disabled={disabled}
          onFocus={handleFocus}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          placeholder="0.00"
        />
      </div>
    </div>
  );
}

function DeltaPill({
  delta,
  isPercent = false,
  trend = "higher_is_better",
}: {
  delta: number;
  isPercent?: boolean;
  trend?: "higher_is_better" | "lower_is_better" | "neutral";
}) {
  const value = isPercent ? percent(delta) : currency(delta);
  const style = semanticDelta(delta, trend);
  return (
    <div className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${style.pill}`}>
      {style.icon}
      <span>{value}</span>
    </div>
  );
}

function Stat({
  label,
  current,
  updated,
  isPercent = false,
  trend = "higher_is_better",
}: {
  label: string;
  current: number;
  updated: number;
  isPercent?: boolean;
  trend?: "higher_is_better" | "lower_is_better" | "neutral";
}) {
  const delta = updated - current;
  const fmt = isPercent ? percent : currency;
  const style = semanticDelta(delta, trend);
  return (
    <div className={`rounded-2xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${style.card}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-slate-500">{label}</div>
          <div className={`mt-1 text-2xl font-semibold tracking-tight ${style.text}`}>{fmt(updated)}</div>
        </div>
        <DeltaPill delta={delta} isPercent={isPercent} trend={trend} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-xs text-slate-400">Current</div>
          <div className="mt-1 font-semibold">{fmt(current)}</div>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-xs text-slate-400">Updated</div>
          <div className="mt-1 font-semibold">{fmt(updated)}</div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sublabel,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  sublabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "good" | "bad" | "neutral";
}) {
  const toneClasses =
    tone === "good"
      ? "border-green-200 bg-green-50/40"
      : tone === "bad"
        ? "border-red-200 bg-red-50/40"
        : "border-slate-200 bg-white";

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${toneClasses}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-slate-500">{label}</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
          {sublabel ? <div className="mt-1 text-xs text-slate-400">{sublabel}</div> : null}
        </div>
        <div className="rounded-xl bg-slate-50 p-2 text-slate-600">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function ForecastImpactCalculator() {
  const [project, setProject] = useState({
    projectNumber: "05626",
    projectName: "",
    coStatus: "approved",
  });

  const [inputs, setInputs] = useState({
    currentContract: 0,
    costToDate: 0,
    forecastCost: 0,
    updatedForecastCost: 0,
    forecastCostThisMonth: 0,
    coAmount: 0,
    coCost: 0,
    coCostIncurred: 0,
  });

  const hasChangeOrders = project.coStatus !== "none";

  const current = useMemo(() => {
    const contract = safeNum(inputs.currentContract);
    const costToDate = safeNum(inputs.costToDate);
    const forecastCost = safeNum(inputs.forecastCost);
    const forecastCostThisMonth = safeNum(inputs.forecastCostThisMonth);

    const pct = pctComplete(costToDate, forecastCost);
    const revenueToDate = earnedRevenue(contract, costToDate, forecastCost);
    const priorCostToDate = Math.max(costToDate - forecastCostThisMonth, 0);
    const revenuePriorMonth = earnedRevenue(contract, priorCostToDate, forecastCost);
    const revenueThisMonth = revenueToDate - revenuePriorMonth;
    const grossProfit = contract - forecastCost;
    const grossMargin = contract > 0 ? (grossProfit / contract) * 100 : 0;
    const grossMarginThisMonth = monthMarginPercent(revenueThisMonth, forecastCostThisMonth);

    return {
      contract,
      costToDate,
      forecastCost,
      forecastCostThisMonth,
      pct,
      revenueToDate,
      revenueThisMonth,
      grossProfit,
      grossMargin,
      grossMarginThisMonth,
    };
  }, [inputs]);

  const updated = useMemo(() => {
    const baseContract = safeNum(inputs.currentContract);
    const baseCostToDate = safeNum(inputs.costToDate);
    const updatedForecastCostInput = safeNum(inputs.updatedForecastCost);
    const forecastCostThisMonth = safeNum(inputs.forecastCostThisMonth);
    const coAmount = safeNum(inputs.coAmount);
    const coCost = safeNum(inputs.coCost);
    const coCostIncurred = clamp(safeNum(inputs.coCostIncurred), 0, coCost);

    const costToDate = baseCostToDate + forecastCostThisMonth;
    const contract = hasChangeOrders && project.coStatus === "approved" ? baseContract + coAmount : baseContract;
    const forecastCost = hasChangeOrders ? updatedForecastCostInput + coCost : updatedForecastCostInput;
    const pct = pctComplete(costToDate, forecastCost);

    let revenueToDate = earnedRevenue(contract, costToDate, forecastCost);
    let catchUpRevenueThisMonth = 0;
    let inferredTiming = "no change orders";

    if (!hasChangeOrders) {
      inferredTiming = "no change orders";
    } else if (project.coStatus === "pending") {
      inferredTiming = "pending";
    } else if (coCostIncurred <= 0) {
      inferredTiming = "no cost incurred yet";
    } else if (coCost > 0) {
      inferredTiming = "cost already incurred";
      const ratio = coCostIncurred / coCost;
      catchUpRevenueThisMonth = coAmount * ratio;
      revenueToDate += catchUpRevenueThisMonth;
    }

    const revenueThisMonth = revenueToDate - current.revenueToDate;
    const grossProfit = contract - forecastCost;
    const grossMargin = contract > 0 ? (grossProfit / contract) * 100 : 0;
    const grossMarginThisMonth = monthMarginPercent(revenueThisMonth, forecastCostThisMonth);
    const coMargin = hasChangeOrders ? coAmount - coCost : 0;
    const coMarginPct = hasChangeOrders && coAmount > 0 ? (coMargin / coAmount) * 100 : 0;

    return {
      contract,
      costToDate,
      forecastCost,
      forecastCostThisMonth,
      pct,
      revenueToDate,
      revenueThisMonth,
      grossProfit,
      grossMargin,
      grossMarginThisMonth,
      catchUpRevenueThisMonth,
      costAlreadyIncurred: hasChangeOrders ? coCostIncurred : 0,
      remainingCOCost: hasChangeOrders ? Math.max(coCost - coCostIncurred, 0) : 0,
      coMargin,
      coMarginPct,
      inferredTiming,
      hasChangeOrders,
    };
  }, [inputs, project, current.revenueToDate, hasChangeOrders]);

  const explanation = useMemo(() => {
    const parts: string[] = [];
    const contractDelta = updated.contract - current.contract;
    const revenueDelta = updated.revenueToDate - current.revenueToDate;
    const monthRevenueDelta = updated.revenueThisMonth - current.revenueThisMonth;

    parts.push(
      `Updated forecast cost is ${currency(updated.forecastCost)} versus current forecast cost of ${currency(current.forecastCost)}, and contract changed by ${currency(contractDelta)}.`,
    );
    parts.push(`Cost to date moved from ${currency(current.costToDate)} to ${currency(updated.costToDate)}.`);
    parts.push(`Percent complete moved from ${percent(current.pct)} to ${percent(updated.pct)}.`);
    parts.push(`Revenue to date changed by ${currency(revenueDelta)} and revenue this month changed by ${currency(monthRevenueDelta)}.`);
    parts.push(`Forecast gross margin moved from ${percent(current.grossMargin)} to ${percent(updated.grossMargin)}.`);
    parts.push(`Gross margin % this month moved from ${percent(current.grossMarginThisMonth)} to ${percent(updated.grossMarginThisMonth)}.`);

    if (!updated.hasChangeOrders) {
      parts.push("This project is set to No Pending Change Orders, so there is no change order impact in the updated view.");
    } else if (project.coStatus === "pending") {
      parts.push("The change order is marked Pending, so it is excluded from revenue and margin in this simplified version.");
    } else if (updated.inferredTiming === "no cost incurred yet") {
      parts.push("The change order is approved, but no related cost has been incurred yet, so the benefit is mostly in future periods rather than this month.");
    } else if (updated.inferredTiming === "cost already incurred") {
      parts.push(
        `Because ${currency(updated.costAlreadyIncurred)} of the change order cost was already incurred, the tool shows catch-up revenue of ${currency(updated.catchUpRevenueThisMonth)} in the current month.`,
      );
    }

    return parts.join(" ");
  }, [current, updated, project.coStatus]);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                <BarChart3 className="h-3.5 w-3.5" />
                Forecast and Revenue Impact
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Forecast Impact Calculator</h1>
              <p className="max-w-4xl text-slate-600">
                Simplified cost-only calculator showing how forecast cost, forecast cost this month, and change-order status affect revenue to date,
                revenue this month, gross profit, and gross margin under a cost-to-cost model.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <KpiCard
                label="Project"
                value={project.projectNumber || "—"}
                sublabel={project.projectName || "No project name"}
                icon={Briefcase}
                tone="neutral"
              />
            </div>
          </div>
        </div>

        <Tabs defaultValue="inputs" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 rounded-2xl border bg-white p-1 shadow-sm">
            <TabsTrigger value="inputs">Inputs</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="explanation">Explanation</TabsTrigger>
          </TabsList>

          <TabsContent value="inputs" className="space-y-6">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle>Project Setup</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <TextField label="Project Number" value={project.projectNumber} onChange={(v) => setProject({ ...project, projectNumber: v })} />
                <TextField label="Project Name" value={project.projectName} onChange={(v) => setProject({ ...project, projectName: v })} />
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle>Core Inputs</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <MoneyField label="Current Contract" value={inputs.currentContract} onChange={(v) => setInputs({ ...inputs, currentContract: v })} />
                  <MoneyField label="Current Forecast Cost" value={inputs.forecastCost} onChange={(v) => setInputs({ ...inputs, forecastCost: v })} />
                  <MoneyField label="Current Cost to Date" value={inputs.costToDate} onChange={(v) => setInputs({ ...inputs, costToDate: v })} />
                  <div className="grid gap-4 md:col-span-2 md:grid-cols-2">
                    <MoneyField label="Updated Forecast Cost" value={inputs.updatedForecastCost} onChange={(v) => setInputs({ ...inputs, updatedForecastCost: v })} />
                    <MoneyField
                      label="Current Forecast Cost This Month"
                      value={inputs.forecastCostThisMonth}
                      onChange={(v) => setInputs({ ...inputs, forecastCostThisMonth: v })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle>Change Order Inputs</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1 md:col-span-2">
                    <Label>Change Order Status</Label>
                    <Select value={project.coStatus} onValueChange={(v) => setProject({ ...project, coStatus: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Pending Change Orders</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {!hasChangeOrders && (
                    <div className="md:col-span-2 rounded-2xl border border-dashed bg-slate-50 p-3 text-sm text-slate-500">
                      Change order inputs are disabled because the project is set to No Pending Change Orders.
                    </div>
                  )}
                  <MoneyField
                    label="Current Change Order Amount"
                    value={inputs.coAmount}
                    onChange={(v) => setInputs({ ...inputs, coAmount: v })}
                    disabled={!hasChangeOrders}
                  />
                  <MoneyField
                    label="Current Change Order Estimated Cost"
                    value={inputs.coCost}
                    onChange={(v) => setInputs({ ...inputs, coCost: v })}
                    disabled={!hasChangeOrders}
                  />
                  <MoneyField
                    label="Current Change Order Cost Already Incurred"
                    value={inputs.coCostIncurred}
                    onChange={(v) => setInputs({ ...inputs, coCostIncurred: v })}
                    disabled={!hasChangeOrders}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            <div className="grid gap-4 xl:grid-cols-4">
              <div className="rounded-2xl border bg-white p-4 shadow-sm xl:col-span-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="text-sm text-slate-500">Summary</div>
                    <div className="mt-1 text-lg font-semibold">Current vs updated project impact</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="rounded-full">CO Status: {project.coStatus}</Badge>
                    <Badge variant="secondary" className="rounded-full">Updated Forecast Cost {currency(updated.forecastCost)}</Badge>
                    <Badge variant="secondary" className="rounded-full">Revenue To Date {currency(updated.revenueToDate)}</Badge>
                  </div>
                </div>
              </div>
            </div>

            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle>Revenue Impact</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Stat label="Contract Value" current={current.contract} updated={updated.contract} trend="higher_is_better" />
                <Stat label="Percent Complete" current={current.pct} updated={updated.pct} isPercent trend="higher_is_better" />
                <Stat label="Revenue Earned to Date" current={current.revenueToDate} updated={updated.revenueToDate} trend="higher_is_better" />
                <Stat label="Revenue This Month" current={current.revenueThisMonth} updated={updated.revenueThisMonth} trend="higher_is_better" />
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle>Margin Impact</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Stat label="Forecast Gross Profit" current={current.grossProfit} updated={updated.grossProfit} trend="higher_is_better" />
                <Stat label="Forecast Gross Margin" current={current.grossMargin} updated={updated.grossMargin} isPercent trend="higher_is_better" />
                <Stat
                  label="Gross Margin % This Month"
                  current={current.grossMarginThisMonth}
                  updated={updated.grossMarginThisMonth}
                  isPercent
                  trend="higher_is_better"
                />
                <Stat
                  label="Forecast Cost This Month"
                  current={current.forecastCostThisMonth}
                  updated={updated.forecastCostThisMonth}
                  trend="lower_is_better"
                />
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <CardTitle>Change Order Breakdown</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="rounded-full">{project.coStatus}</Badge>
                    <Badge variant="secondary" className="rounded-full">{updated.inferredTiming}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-2xl border p-3">
                  <div className="text-sm text-slate-500">CO Amount</div>
                  <div className="text-xl font-semibold">{currency(hasChangeOrders ? inputs.coAmount : 0)}</div>
                </div>
                <div className="rounded-2xl border p-3">
                  <div className="text-sm text-slate-500">CO Estimated Cost</div>
                  <div className="text-xl font-semibold">{currency(hasChangeOrders ? inputs.coCost : 0)}</div>
                </div>
                <div className="rounded-2xl border p-3">
                  <div className="text-sm text-slate-500">Cost Already Incurred</div>
                  <div className="text-xl font-semibold">{currency(updated.costAlreadyIncurred)}</div>
                </div>
                <div className="rounded-2xl border p-3">
                  <div className="text-sm text-slate-500">Remaining CO Cost</div>
                  <div className="text-xl font-semibold">{currency(updated.remainingCOCost)}</div>
                </div>
                <div className="rounded-2xl border p-3">
                  <div className="text-sm text-slate-500">CO Margin ($ / %)</div>
                  <div className={`text-xl font-semibold ${semanticDelta(updated.coMargin, "higher_is_better").text}`}>
                    {currency(updated.coMargin)} / {percent(updated.coMarginPct)}
                  </div>
                </div>
                <div className="rounded-2xl border p-3 md:col-span-5">
                  <div className="text-sm text-slate-500">CO Status / Inferred Effect</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="secondary" className="rounded-full">Catch-up Revenue {currency(updated.catchUpRevenueThisMonth)}</Badge>
                    <Badge variant="secondary" className="rounded-full">Remaining CO Cost {currency(updated.remainingCOCost)}</Badge>
                    <Badge variant="secondary" className="rounded-full">CO Margin {currency(updated.coMargin)}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="explanation" className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-4">
              <KpiCard
                label="Revenue To Date"
                value={currency(updated.revenueToDate - current.revenueToDate)}
                sublabel={`${currency(current.revenueToDate)} → ${currency(updated.revenueToDate)}`}
                icon={DollarSign}
                tone={updated.revenueToDate - current.revenueToDate >= 0 ? "good" : "bad"}
              />
              <KpiCard
                label="Revenue This Month"
                value={currency(updated.revenueThisMonth)}
                sublabel={`${currency(current.revenueThisMonth)} → ${currency(updated.revenueThisMonth)}`}
                icon={TrendingUp}
                tone={updated.revenueThisMonth - current.revenueThisMonth >= 0 ? "good" : "bad"}
              />
              <KpiCard
                label="Gross Margin"
                value={percent(updated.grossMargin)}
                sublabel={`${percent(current.grossMargin)} → ${percent(updated.grossMargin)}`}
                icon={Calculator}
                tone={updated.grossMargin - current.grossMargin >= 0 ? "good" : "bad"}
              />
              <KpiCard
                label="Deviation"
                value={currency(updated.forecastCost - current.forecastCost)}
                sublabel="Change in total forecast cost"
                icon={BarChart3}
                tone={updated.forecastCost - current.forecastCost <= 0 ? "good" : "bad"}
              />
            </div>

            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle>Plain-English Explanation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border bg-white p-4 leading-7 text-slate-700">{explanation}</div>
                <Separator />
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border p-4">
                    <div className="font-semibold">Current</div>
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex justify-between"><span>Contract</span><span>{currency(current.contract)}</span></div>
                      <div className="flex justify-between"><span>Cost to Date</span><span>{currency(current.costToDate)}</span></div>
                      <div className="flex justify-between"><span>Forecast Cost</span><span>{currency(current.forecastCost)}</span></div>
                      <div className="flex justify-between"><span>Percent Complete</span><span>{percent(current.pct)}</span></div>
                      <div className="flex justify-between"><span>Revenue to Date</span><span>{currency(current.revenueToDate)}</span></div>
                      <div className="flex justify-between"><span>Gross Margin</span><span>{percent(current.grossMargin)}</span></div>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-3 text-sm">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <div className="text-xs text-slate-500">Forecast Cost This Month</div>
                        <div className="mt-1 font-semibold">{currency(current.forecastCostThisMonth)}</div>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <div className="text-xs text-slate-500">Revenue This Month</div>
                        <div className="mt-1 font-semibold">{currency(current.revenueThisMonth)}</div>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <div className="text-xs text-slate-500">Gross Margin % This Month</div>
                        <div className="mt-1 font-semibold">{percent(current.grossMarginThisMonth)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border p-4">
                    <div className="font-semibold">Updated</div>
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex justify-between"><span>Contract</span><span>{currency(updated.contract)}</span></div>
                      <div className="flex justify-between"><span>Cost to Date</span><span>{currency(updated.costToDate)}</span></div>
                      <div className="flex justify-between"><span>Forecast Cost</span><span>{currency(updated.forecastCost)}</span></div>
                      <div className="flex justify-between"><span>Percent Complete</span><span>{percent(updated.pct)}</span></div>
                      <div className="flex justify-between"><span>Revenue to Date</span><span>{currency(updated.revenueToDate)}</span></div>
                      <div className="flex justify-between"><span>Gross Margin</span><span>{percent(updated.grossMargin)}</span></div>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-3 text-sm">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <div className="text-xs text-slate-500">Forecast Cost This Month</div>
                        <div className="mt-1 font-semibold">{currency(updated.forecastCostThisMonth)}</div>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <div className="text-xs text-slate-500">Revenue This Month</div>
                        <div className="mt-1 font-semibold">{currency(updated.revenueThisMonth)}</div>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <div className="text-xs text-slate-500">Gross Margin % This Month</div>
                        <div className="mt-1 font-semibold">{percent(updated.grossMarginThisMonth)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}