"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { formatCurrency } from "@/lib/utils";

export interface AnalyticsPoint {
  date: string;
  generates: number;
  total: number;
}

export function AnalyticsChart({ data }: { data: AnalyticsPoint[] }) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ left: 0, right: 0, top: 12, bottom: 0 }}>
          <defs>
            <linearGradient id="colorGenerates" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#0e9f6e" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#0e9f6e" stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(79,101,93,0.12)" strokeDasharray="4 6" vertical={false} />
          <XAxis dataKey="date" minTickGap={24} stroke="rgba(79,101,93,0.6)" tickLine={false} />
          <YAxis allowDecimals={false} stroke="rgba(79,101,93,0.6)" tickLine={false} width={36} />
          <Tooltip
            contentStyle={{
              borderRadius: 18,
              border: "1px solid rgba(79,101,93,0.15)",
              background: "rgba(255,250,241,0.96)",
              color: "#10211b",
            }}
            formatter={(value, name) =>
              name === "total"
                ? [formatCurrency(Number(value ?? 0)), "Nominal"]
                : [Number(value ?? 0), "Generate"]
            }
          />
          <Area dataKey="generates" fill="url(#colorGenerates)" stroke="#0e9f6e" strokeWidth={3} type="monotone" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
