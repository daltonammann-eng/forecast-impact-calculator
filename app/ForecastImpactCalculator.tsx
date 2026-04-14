"use client";

import React, { useState } from "react";

/* ---------- helpers ---------- */

function safeNum(v: string | number) {
  const n = parseFloat(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function formatCurrency(n: number) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/* ---------- money input (fixes decimal typing issue) ---------- */

function MoneyInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const [display, setDisplay] = useState("");

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 14 }}>{label}</div>
      <input
        type="text"
        value={display}
        placeholder="0.00"
        onChange={(e) => {
          const raw = e.target.value.replace(/[^0-9.]/g, "");
          setDisplay(raw);
          onChange(safeNum(raw));
        }}
        onBlur={() => {
          setDisplay(formatCurrency(value));
        }}
        onFocus={() => {
          setDisplay(value ? String(value) : "");
        }}
        style={{
          width: "100%",
          padding: 8,
          border: "1px solid #ccc",
          borderRadius: 6,
        }}
      />
    </div>
  );
}

/* ---------- main component ---------- */

export default function ForecastImpactCalculator() {
  const [projectNumber, setProjectNumber] = useState("05626");
  const [projectName, setProjectName] = useState("");

  const [contract, setContract] = useState(0);
  const [costToDate, setCostToDate] = useState(0);
  const [forecastCost, setForecastCost] = useState(0);
  const [updatedForecastCost, setUpdatedForecastCost] = useState(0);
  const [forecastCostThisMonth, setForecastCostThisMonth] = useState(0);

  /* ---------- calculations ---------- */

  const percentComplete =
    forecastCost > 0 ? costToDate / forecastCost : 0;

  const revenueToDate = contract * percentComplete;

  const updatedCostToDate = costToDate + forecastCostThisMonth;

  const updatedPercentComplete =
    updatedForecastCost > 0
      ? updatedCostToDate / updatedForecastCost
      : 0;

  const updatedRevenueToDate =
    contract * updatedPercentComplete;

  const revenueThisMonth =
    updatedRevenueToDate - revenueToDate;

  const grossProfit =
    contract - updatedForecastCost;

  const grossMargin =
    contract > 0
      ? (grossProfit / contract) * 100
      : 0;

  /* ---------- UI ---------- */

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: 20,
        fontFamily: "Arial",
      }}
    >
      <h1>Forecast Impact Calculator</h1>

      {/* Project Info */}
      <div style={{ marginBottom: 20 }}>
        <h3>Project</h3>

        <input
          placeholder="Project Number"
          value={projectNumber}
          onChange={(e) => setProjectNumber(e.target.value)}
          style={{ marginRight: 10, padding: 6 }}
        />

        <input
          placeholder="Project Name"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          style={{ padding: 6 }}
        />
      </div>

      {/* Inputs */}
      <div style={{ marginBottom: 20 }}>
        <h3>Inputs</h3>

        <MoneyInput
          label="Contract Value"
          value={contract}
          onChange={setContract}
        />

        <MoneyInput
          label="Cost to Date"
          value={costToDate}
          onChange={setCostToDate}
        />

        <MoneyInput
          label="Forecast Cost"
          value={forecastCost}
          onChange={setForecastCost}
        />

        <MoneyInput
          label="Updated Forecast Cost"
          value={updatedForecastCost}
          onChange={setUpdatedForecastCost}
        />

        <MoneyInput
          label="Forecast Cost This Month"
          value={forecastCostThisMonth}
          onChange={setForecastCostThisMonth}
        />
      </div>

      {/* Results */}
      <div>
        <h3>Results</h3>

        <p>Percent Complete: {(percentComplete * 100).toFixed(2)}%</p>
        <p>Revenue to Date: ${formatCurrency(revenueToDate)}</p>
        <p>Updated Revenue to Date: ${formatCurrency(updatedRevenueToDate)}</p>
        <p>Revenue This Month: ${formatCurrency(revenueThisMonth)}</p>
        <p>Gross Profit: ${formatCurrency(grossProfit)}</p>
        <p>Gross Margin: {grossMargin.toFixed(2)}%</p>
      </div>
    </div>
  );
}