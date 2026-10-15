"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoney } from "@/lib/money";

export interface MonthlyPoint {
  month: string
  income: number
  expense: number
}

export interface CategoryPoint {
  name: string
  color: string
  value: number
}

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid #e4e4e7",
  fontSize: 12,
};

export function MonthlyChart({ data }: { data: MonthlyPoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <BarChart data={data} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis
            tick={{ fontSize: 10 }}
            tickFormatter={(v: number) =>
              v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${Math.round(v / 1000)}k`
            }
            width={44}
          />
          <Tooltip
            formatter={(value) => [formatMoney(Number(value)), ""]}
            contentStyle={tooltipStyle}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="income" name="Ingresos" fill="#16a34a" radius={[6, 6, 0, 0]} />
          <Bar dataKey="expense" name="Gastos" fill="#ef4444" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryPie({ data }: { data: CategoryPoint[] }) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-xs text-zinc-400">Sin gastos este mes.</p>;
  }
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={2}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [formatMoney(Number(value)), ""]}
            contentStyle={tooltipStyle}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MemberBar({ data }: { data: { name: string; value: number; color: string }[] }) {
  if (data.length === 0) {
    return (
      <p className="py-10 text-center text-xs text-zinc-400">
        Sin gastos por miembro este mes. Usá el alcance «🎯 Miembros» al cargar un gasto.
      </p>
    );
  }
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
          <XAxis
            type="number"
            tick={{ fontSize: 10 }}
            tickFormatter={(v: number) =>
              v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${Math.round(v / 1000)}k`
            }
          />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
          <Tooltip
            formatter={(value) => [formatMoney(Number(value)), ""]}
            contentStyle={tooltipStyle}
          />
          <Bar dataKey="value" radius={[0, 6, 6, 0]}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
