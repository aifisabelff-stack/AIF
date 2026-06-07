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

const COLORS = ["#b84878", "#d4a574", "#22c55e", "#ef4444", "#9a3a64", "#f59e0b", "#6366f1"];

type StatusRow = { label: string; count: number };
type TherapyRow = { name: string; count: number };
type MonthlyRow = {
  label: string;
  total: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  pending: number;
};

export function AppointmentStatusPieChart({ data }: { data: StatusRow[] }) {
  if (data.length === 0) {
    return <p className="py-12 text-center text-sm text-iaf-500">Sin citas este mes</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="label"
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={85}
          paddingAngle={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function TherapyDemandChart({ data }: { data: TherapyRow[] }) {
  if (data.length === 0) {
    return <p className="py-12 text-center text-sm text-iaf-500">Sin datos de terapias</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 36)}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f9d9e8" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: "#7d3154" }} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="name"
          width={130}
          tick={{ fontSize: 10, fill: "#7d3154" }}
        />
        <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #f9d9e8" }} />
        <Bar dataKey="count" name="Citas" fill="#b84878" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MonthlyAppointmentsChart({ data }: { data: MonthlyRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f9d9e8" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#7d3154" }} />
        <YAxis tick={{ fontSize: 11, fill: "#7d3154" }} allowDecimals={false} />
        <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #f9d9e8" }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="total" name="Total" fill="#9a3a64" radius={[4, 4, 0, 0]} />
        <Bar dataKey="confirmed" name="Confirmadas" fill="#22c55e" radius={[4, 4, 0, 0]} />
        <Bar dataKey="completed" name="Completadas" fill="#d4a574" radius={[4, 4, 0, 0]} />
        <Bar dataKey="cancelled" name="Anuladas" fill="#ef4444" radius={[4, 4, 0, 0]} />
        <Bar dataKey="pending" name="Pendientes" fill="#f59e0b" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
