"use client";
import { formatCurrency } from "@/lib/money";
import type { Currency } from "@/types/saas";
import React from "react";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import type { TimeSeriesPoint } from "@/types/saas";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const base = (h: number): ApexOptions["chart"] => ({
  fontFamily: "Outfit, sans-serif",
  height: h,
  toolbar: { show: false },
  zoom: { enabled: false },
});

export function AreaSeriesChart({
  data,
  name,
  height = 280,
  color = "#465fff",
  currency,
}: {
  data: TimeSeriesPoint[];
  name: string;
  height?: number;
  color?: string;
  /** true for USD, or a currency code */
  currency?: boolean | Currency;
}) {
  const code: Currency | null = currency ? (currency === true ? "USD" : currency) : null;
  const options: ApexOptions = {
    colors: [color],
    chart: { ...base(height), type: "area" },
    stroke: { curve: "smooth", width: 2 },
    fill: { type: "gradient", gradient: { opacityFrom: 0.45, opacityTo: 0 } },
    dataLabels: { enabled: false },
    markers: { size: 0 },
    grid: { yaxis: { lines: { show: true } }, xaxis: { lines: { show: false } }, borderColor: "#e4e7ec" },
    xaxis: {
      categories: data.map((d) => d.label),
      axisBorder: { show: false },
      axisTicks: { show: false },
      tickAmount: Math.min(8, data.length),
      labels: { rotate: 0, style: { colors: "#667085" } },
    },
    yaxis: {
      labels: {
        style: { colors: ["#667085"] },
        formatter: (v) => (code ? formatCurrency(Math.round(v), code) : String(Math.round(v))),
      },
    },
    tooltip: { y: { formatter: (v) => (code ? formatCurrency(v, code) : String(v)) } },
  };
  return <ReactApexChart options={options} series={[{ name, data: data.map((d) => d.value) }]} type="area" height={height} />;
}

export function BarSeriesChart({
  data,
  name,
  height = 260,
  color = "#465fff",
}: {
  data: TimeSeriesPoint[];
  name: string;
  height?: number;
  color?: string;
}) {
  const options: ApexOptions = {
    colors: [color],
    chart: { ...base(height), type: "bar" },
    plotOptions: { bar: { columnWidth: "45%", borderRadius: 5, borderRadiusApplication: "end" } },
    dataLabels: { enabled: false },
    grid: { yaxis: { lines: { show: true } }, borderColor: "#e4e7ec" },
    xaxis: {
      categories: data.map((d) => d.label),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: "#667085" } },
    },
    yaxis: { labels: { style: { colors: ["#667085"] } } },
  };
  return <ReactApexChart options={options} series={[{ name, data: data.map((d) => d.value) }]} type="bar" height={height} />;
}

export function DonutChart({
  labels,
  values,
  height = 260,
  colors = ["#465fff", "#12b76a", "#f79009", "#f04438", "#7a5af8", "#98a2b3"],
}: {
  labels: string[];
  values: number[];
  height?: number;
  colors?: string[];
}) {
  const options: ApexOptions = {
    colors,
    labels,
    chart: { ...base(height), type: "donut" },
    legend: { position: "bottom", fontFamily: "Outfit, sans-serif", labels: { colors: "#667085" } },
    dataLabels: { enabled: false },
    stroke: { width: 2, colors: ["transparent"] },
    plotOptions: { pie: { donut: { size: "70%" } } },
  };
  return <ReactApexChart options={options} series={values} type="donut" height={height} />;
}

/** Two overlapping areas (e.g. visitors and page views) sharing one time axis. */
export function TrafficChart({
  labels,
  series,
  height = 300,
}: {
  labels: string[];
  series: { name: string; data: number[]; color: string }[];
  height?: number;
}) {
  const options: ApexOptions = {
    colors: series.map((s) => s.color),
    chart: { ...base(height), type: "area" },
    stroke: { curve: "smooth", width: 2 },
    fill: { type: "gradient", gradient: { opacityFrom: 0.3, opacityTo: 0 } },
    dataLabels: { enabled: false },
    markers: { size: 0 },
    legend: { position: "top", horizontalAlign: "right", fontFamily: "Outfit, sans-serif", labels: { colors: "#667085" } },
    grid: { yaxis: { lines: { show: true } }, xaxis: { lines: { show: false } }, borderColor: "#e4e7ec" },
    xaxis: { categories: labels, axisBorder: { show: false }, axisTicks: { show: false }, tickAmount: Math.min(8, labels.length), labels: { rotate: 0, style: { colors: "#667085" } } },
    yaxis: { labels: { style: { colors: ["#667085"] }, formatter: (v) => String(Math.round(v)) } },
  };
  return <ReactApexChart options={options} series={series.map((s) => ({ name: s.name, data: s.data }))} type="area" height={height} />;
}
