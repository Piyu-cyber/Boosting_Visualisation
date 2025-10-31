"use client";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

interface DataPoint {
  x: number;
  y: number;
  label?: number;
}

interface Props {
  data: DataPoint[];
  title: string;
}

export default function VisualizationPanel({ data, title }: Props) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md w-full md:w-3/4">
      <h2 className="text-xl font-semibold text-gray-700 mb-3 text-center">{title}</h2>
      <ScatterChart width={500} height={350}>
        <CartesianGrid />
        <XAxis type="number" dataKey="x" name="Feature 1" />
        <YAxis type="number" dataKey="y" name="Feature 2" />
        <Tooltip cursor={{ strokeDasharray: "3 3" }} />
        <Scatter data={data} fill="#2563eb" />
      </ScatterChart>
    </div>
  );
}