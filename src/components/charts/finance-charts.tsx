"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#b84878", "#d4a574", "#9a3a64", "#e88ab3", "#7d3154", "#f2b5d0"];

type Monthly = { label: string; income: number; expense: number; profit: number };
type Procedure = { name: string; count: number; revenue: number };
type ExpenseCat = { name: string; value: number };
type InvoiceStatus = { status: string; label: string; count: number; total: number };

export function MonthlyFinanceChart({ data }: { data: Monthly[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f9d9e8" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#7d3154" }} />
        <YAxis tick={{ fontSize: 11, fill: "#7d3154" }} tickFormatter={(v) => `${v}€`} />
        <Tooltip
          formatter={(v: number) => [`${v.toFixed(2)} €`, ""]}
          contentStyle={{ borderRadius: 12, border: "1px solid #f9d9e8" }}
        />
        <Legend />
        <Bar dataKey="income" name="Ingresos" fill="#b84878" radius={[6, 6, 0, 0]} />
        <Bar dataKey="expense" name="Gastos" fill="#d4a574" radius={[6, 6, 0, 0]} />
        <Bar dataKey="profit" name="Beneficio" fill="#9a3a64" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ProceduresChart({ data }: { data: Procedure[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f9d9e8" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: "#7d3154" }} />
        <YAxis
          type="category"
          dataKey="name"
          width={120}
          tick={{ fontSize: 11, fill: "#7d3154" }}
        />
        <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #f9d9e8" }} />
        <Bar dataKey="count" name="Sesiones" fill="#e88ab3" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ExpensePieChart({ data }: { data: ExpenseCat[] }) {
  if (data.length === 0) {
    return <p className="py-12 text-center text-sm text-iaf-500">Sin gastos registrados</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={3}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v: number) => `${v.toFixed(2)} €`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function InvoiceStatusChart({ data }: { data: InvoiceStatus[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f9d9e8" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#7d3154" }} />
        <YAxis tick={{ fontSize: 11, fill: "#7d3154" }} />
        <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #f9d9e8" }} />
        <Bar dataKey="count" name="Facturas" fill="#b84878" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
