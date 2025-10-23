"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ExplanationCard from "@/components/ExplanationCard";
import { useDomain } from "@/components/DomainContext";

const MAX_STEPS = 6;

type P = {
  id: number;
  x: number;
  y: number;
  target: number;
  contribs: number[];
};

export default function XGBoostPage() {
  const { data, domain } = useDomain();
  const [step, setStep] = useState<number>(0);
  const [playing, setPlaying] = useState(false);
  const [accuracyHistory, setAccuracyHistory] = useState<number[]>([]);
  const [prevCount, setPrevCount] = useState<number>(1);
  const [prevOpacity, setPrevOpacity] = useState<number>(0.35);
  const [prevRadius, setPrevRadius] = useState<number>(4);

  // === Choose 2 numeric features ===
  const { xKey, yKey, labelKey, featureKeys } = useMemo(() => {
    const sample = data && data.length > 0 ? data[0] : {};
    const numeric = Object.keys(sample).filter((k) => typeof (sample as any)[k] === "number");
    const x = numeric.includes("temperature") ? "temperature" : numeric[0] ?? "x";
    const y = numeric.includes("pressure") ? "pressure" : numeric[1] ?? numeric[0] ?? "y";
    const label =
      numeric.includes("failure")
        ? "failure"
        : numeric.includes("subscribed")
        ? "subscribed"
        : numeric[numeric.length - 1] ?? "label";
    return { xKey: x, yKey: y, labelKey: label, featureKeys: numeric.slice(0, 4) };
  }, [data]);

  // === Create points with feature-based simulated contributions ===
  const points: P[] = useMemo(() => {
    if (!data || data.length === 0) return [];

    const numericLabel = data.every((d) => typeof (d as any)[labelKey] === "number");
    let median = 0;
    if (numericLabel) {
      const arr = (data as any[]).map((d) => Number(d[labelKey])).sort((a, b) => a - b);
      median = arr[Math.floor(arr.length / 2)] ?? 0;
    }

    const xs = data.map((d: any) => Number(d[xKey]) || 0);
    const ys = data.map((d: any) => Number(d[yKey]) || 0);
    const xMin = Math.min(...xs),
      xMax = Math.max(...xs);
    const yMin = Math.min(...ys),
      yMax = Math.max(...ys);

    return (data as any[]).map((d, i) => {
      const t = typeof d[labelKey] === "number" ? (d[labelKey] > median ? 1 : 0) : (d[labelKey] ? 1 : 0);

      const xNorm = (Number(d[xKey]) - xMin) / (xMax - xMin + 1e-9);
      const yNorm = (Number(d[yKey]) - yMin) / (yMax - yMin + 1e-9);
      const influence = (xNorm * 2 - 1) + (yNorm * 2 - 1);
      const sign = t === 1 ? 1 : -1;

      // ✨ Smooth progressive learning
      const contribs = Array.from({ length: MAX_STEPS }, (_, s) => {
        const lr = 0.3 * Math.pow(0.8, s);
        const residual = influence * (1 - Math.exp(-0.4 * (s + 1)));
        return Number((lr * residual * sign * (s + 1)).toFixed(3));
      });

      return {
        id: i,
        x: Number(d[xKey]) || 0,
        y: Number(d[yKey]) || 0,
        target: t,
        contribs,
      };
    });
  }, [data, xKey, yKey, labelKey]);

  // compute axis domains (with small padding) so XAxis/YAxis render numeric ticks correctly
  const axisDomains = useMemo(() => {
    if (!points || points.length === 0) return { x: [0, 1], y: [0, 1] };
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    const yMin = Math.min(...ys);
    const yMax = Math.max(...ys);
    const xPad = (xMax - xMin) * 0.06 || 1;
    const yPad = (yMax - yMin) * 0.06 || 1;
    return { x: [Math.floor(xMin - xPad), Math.ceil(xMax + xPad)], y: [Math.floor(yMin - yPad), Math.ceil(yMax + yPad)] };
  }, [points]);

  // === Compute cumulative scores per step ===
  const series = useMemo(() => {
    const seq: { id: number; x: number; y: number; target: number; score: number }[][] = [];
    for (let s = 0; s < MAX_STEPS; s++) {
      const arr = points.map((p) => {
        const score = p.contribs.slice(0, s + 1).reduce((a, b) => a + b, 0);
        const prob = 1 / (1 + Math.exp(-2 * score));
        return { id: p.id, x: p.x, y: p.y, target: p.target, score: Number(prob.toFixed(3)) };
      });
      seq.push(arr);
    }
    return seq;
  }, [points]);

  // === Compute accuracy for each step ===
  useEffect(() => {
    if (series.length === 0) return;
    const accs = series.map((s) => {
      const correct = s.filter((p) => (p.score >= 0.5 ? 1 : 0) === p.target).length;
      return Number(((correct / s.length) * 100).toFixed(1));
    });
    setAccuracyHistory(accs);
  }, [series]);

  // === Step animation control ===
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setStep((prev) => {
        if (prev >= MAX_STEPS - 1) {
          clearInterval(id);
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1300);
    return () => clearInterval(id);
  }, [playing]);

  const reset = () => {
    setStep(0);
    setPlaying(false);
  };

  const display = (arr: any[]) =>
    arr.map((p) => ({
      x: p.x,
      y: p.y,
      prob: Number(p.score.toFixed(3)),
      pred: p.score >= 0.5 ? 1 : 0,
      target: p.target,
    }));

  const featureImportance = useMemo(() => {
    const fk = featureKeys.length ? featureKeys : ["f1", "f2", "f3"];
    return fk.map((k, i) => ({
      feature: k,
      importance: Math.round((Math.random() * 40 + 20) / (i + 1)),
    }));
  }, [featureKeys]);

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900 text-gray-100">
      <Navbar />

      <section className="max-w-7xl mx-auto p-8 flex-grow">
        <h1 className="text-4xl font-bold text-cyan-400 mb-2 text-center">
          XGBoost Step-by-Step Visualization
        </h1>
        <p className="text-center text-gray-400 mb-8">
          Each step adds a new tree correcting previous errors — watch accuracy and predictions evolve.
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-gray-800 rounded-full h-3 mb-8 overflow-hidden">
          <motion.div
            className="h-3 bg-gradient-to-r from-indigo-500 to-cyan-400"
            animate={{ width: `${((step + 1) / MAX_STEPS) * 100}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* LEFT PANEL */}
          <div className="space-y-4">
            <ExplanationCard
              step={`Step ${step + 1} / ${MAX_STEPS}`}
              description={
                step === 0
                  ? "We start with a weak model — predictions are noisy."
                  : step < MAX_STEPS - 1
                  ? "Each new tree reduces residual errors — predictions become sharper."
                  : "Boosting complete — the model achieves high accuracy!"
              }
            />

            <div className="bg-gray-900 p-4 rounded-xl shadow-lg border border-gray-700">
              <div className="flex gap-2 items-center mb-3">
                <button onClick={() => setStep((s) => Math.max(0, s - 1))} className="px-3 py-1 bg-gray-700 rounded">
                  ⬅ Prev
                </button>
                <button
                  onClick={() => setPlaying((p) => !p)}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 rounded text-white"
                >
                  {playing ? "⏸ Pause" : "▶ Play"}
                </button>
                <button onClick={() => setStep((s) => Math.min(MAX_STEPS - 1, s + 1))} className="px-3 py-1 bg-gray-700 rounded">
                  Next ➡
                </button>
                <button onClick={reset} className="ml-auto px-3 py-1 bg-gray-700 rounded">
                  🔄 Reset
                </button>
              </div>

              <div className="text-xs text-gray-400">
                <div>Domain: <strong>{domain}</strong></div>
                <div>Features: <strong>{xKey}</strong> vs <strong>{yKey}</strong></div>
                <div>Accuracy: <strong>{accuracyHistory[step] ?? 0}%</strong></div>
              </div>
            </div>

            {/* Feature Importance */}
            <div className="bg-gray-900 p-4 rounded-xl shadow-lg border border-gray-700">
              <div className="text-sm font-semibold mb-2 text-gray-300">Simulated Feature Importance</div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={featureImportance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="feature" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", color: "#fff" }} />
                  <Bar dataKey="importance" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="md:col-span-2 bg-gray-900 p-4 rounded-xl shadow-lg border border-gray-700">
            <ResponsiveContainer width="100%" height={420}>
              <ScatterChart>
                <CartesianGrid stroke="#374151" />
                <XAxis
                  dataKey="x"
                  name={xKey}
                  stroke="#9ca3af"
                  type="number"
                  domain={axisDomains.x}
                  tickFormatter={(v: any) => Number(v).toFixed(0)}
                  label={{ value: xKey, position: "insideBottom", offset: -8, fill: "#9ca3af" }}
                />
                <YAxis
                  dataKey="y"
                  name={yKey}
                  stroke="#9ca3af"
                  type="number"
                  domain={axisDomains.y}
                  tickFormatter={(v: any) => Number(v).toFixed(0)}
                  label={{ value: yKey, angle: -90, position: "insideLeft", offset: 0, fill: "#9ca3af" }}
                />
                <Tooltip
                  formatter={(val, name, props: any) => [
                    `Prob: ${props.payload.prob}`,
                    `Pred: ${props.payload.pred}`,
                  ]}
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "none",
                    color: "#fff",
                  }}
                />
                {/* previous steps (faint) */}
                {series.map((s, si) => {
                  if (si >= step) return null;
                  const startIndex = Math.max(0, step - prevCount);
                  if (si < startIndex) return null;
                  return (
                    <Scatter
                      key={`prev-${si}`}
                      name={`step ${si + 1} (prev)`}
                      data={s.map((p) => ({ ...p, x: p.x, y: p.y }))}
                      fill="#9CA3AF"
                      opacity={prevOpacity}
                      shape={(props: any) => {
                        const { cx, cy } = props;
                        return <circle cx={cx} cy={cy} r={prevRadius} fill="#9CA3AF" opacity={prevOpacity} stroke="#6B7280" strokeWidth={0.6} />;
                      }}
                    />
                  );
                })}
                <Scatter
                  name="Predictions"
                  data={display(series[step] ?? [])}
                  shape={(props: any) => {
                    const { cx, cy, payload } = props;
                    const color = payload.pred ? "#f97316" : "#3b82f6";
                    const rad = 5 + (payload.prob - 0.5) * 10;
                    return (
                      <motion.circle
                        cx={cx}
                        cy={cy}
                        r={Math.max(3, Math.min(10, rad))}
                        fill={color}
                        opacity={0.9}
                        whileHover={{ scale: 1.3 }}
                        transition={{ duration: 0.2 }}
                      />
                    );
                  }}
                />
              </ScatterChart>
            </ResponsiveContainer>

            <div className="mt-4 border-t border-gray-700 pt-3">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Previous steps display</h4>
              <div className="text-xs text-gray-400 mb-2">Number of previous steps to show (0 = none)</div>
              <input type="range" min={0} max={Math.max(0, series.length - 1)} value={prevCount} onChange={(e) => setPrevCount(Number(e.target.value))} className="w-full" />
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                <div className="flex-1">
                  <div>Opacity</div>
                  <input type="range" min={0.05} max={0.8} step={0.05} value={prevOpacity} onChange={(e) => setPrevOpacity(Number(e.target.value))} className="w-full" />
                </div>
                <div className="w-24">
                  <div>Size</div>
                  <input type="range" min={2} max={10} step={1} value={prevRadius} onChange={(e) => setPrevRadius(Number(e.target.value))} className="w-full" />
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-400">Showing last <strong className="text-gray-200">{prevCount}</strong> previous steps with opacity <strong className="text-gray-200">{prevOpacity}</strong> and radius <strong className="text-gray-200">{prevRadius}</strong>.</div>
            </div>

            <div className="mt-4 text-sm text-gray-400">
              <ul className="list-disc ml-5 space-y-1">
                <li><span className="text-orange-400 font-semibold">Orange</span> = Predicted Positive</li>
                <li><span className="text-blue-400 font-semibold">Blue</span> = Predicted Negative</li>
                <li>Circle size = Confidence (larger → more confident)</li>
                <li>Step {step + 1} adds a new tree improving accuracy.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
