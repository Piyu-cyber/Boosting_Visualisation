"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianAxis,
  Legend
} from "recharts";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ExplanationCard from "@/components/ExplanationCard";
import { useDomain } from "@/components/DomainContext";

/**
 * Gradient Boost page
 * Visual explanation:
 * - Start with base predictions (simulated)
 * - Compute residuals per sample (simulated errors)
 * - Add learners that reduce residual magnitude iteratively
 * - Show a loss/ residual trend line decreasing
 */

const MAX_STEPS = 6;

type GPoint = {
  id: number;
  x: number;
  y: number;
  target: number; // binary
  pred: number; // simulated prediction between 0..1
};

export default function GradientBoostPage() {
  const { data, domain } = useDomain();
  const [step, setStep] = useState<number>(0);
  const [playing, setPlaying] = useState(false);

  // pick features
  const { xKey, yKey, labelKey } = useMemo(() => {
    const sample = data && data.length > 0 ? data[0] : {};
    const numeric = Object.keys(sample).filter((k) => typeof (sample as any)[k] === "number");
    const x = numeric.includes("age") ? "age" : numeric[0] ?? "x";
    const y = numeric.includes("balance") ? "balance" : numeric[1] ?? numeric[0] ?? "y";
    const label = numeric.includes("failure") ? "failure" : (numeric.includes("subscribed") ? "subscribed" : numeric[numeric.length - 1] ?? "label");
    return { xKey: x, yKey: y, labelKey: label };
  }, [data]);

  // build initial points with a simulated base prediction and residual
  const basePoints = useMemo(() => {
    if (!data || data.length === 0) return [];
    // compute median threshold for numeric targets
    const numericLabel = data.every((d) => typeof (d as any)[labelKey] === "number");
    let median = 0;
    if (numericLabel) {
      const arr = (data as any[]).map((d) => Number(d[labelKey])).sort((a, b) => a - b);
      median = arr[Math.floor(arr.length / 2)] ?? 0;
    }
    return (data as any[]).map((d, i) => {
      const target = typeof d[labelKey] === "number" ? (d[labelKey] > median ? 1 : 0) : (d[labelKey] ? 1 : 0);
      // create a rough base prediction: correlate with x normalized
      const xVal = Number(d[xKey]) || 0;
      const xnorm = xVal / (Math.max(...(data as any[]).map((z) => Number(z[xKey] || 1))) || 1);
      // base prediction is noisy around xnorm
      const basePred = Math.min(0.95, Math.max(0.05, xnorm * 0.7 + (Math.random() - 0.5) * 0.2));
      return { id: i, x: Number(d[xKey]) || 0, y: Number(d[yKey]) || 0, target, pred: basePred } as GPoint;
    });
  }, [data, xKey, yKey, labelKey]);

  // build sequence of predictions where each step reduces residuals (we simulate learning)
  const states = useMemo(() => {
    if (!basePoints.length) return { series: [], losses: [] as { step: number; loss: number }[] };

    const seq: GPoint[][] = [];
    const losses: { step: number; loss: number }[] = [];

    // initial predictions
    let current = basePoints.map((p) => ({ ...p }));
    for (let s = 0; s < MAX_STEPS; s++) {
      // compute residuals and loss as mean absolute error
      const residuals = current.map((p) => Math.abs(p.target - p.pred));
      const loss = residuals.reduce((a, b) => a + b, 0) / residuals.length;
      losses.push({ step: s + 1, loss: Number(loss.toFixed(3)) });
      seq.push(current.map((p) => ({ ...p })));

      // next step: simulate a learner that reduces residuals by a factor
      current = current.map((p) => {
        const res = p.target - p.pred;
        // learning rate / correction factor
        const lr = 0.45 * Math.pow(0.7, s); // decreasing corrections over steps
        // new prediction nudged towards target
        const newPred = Math.min(0.99, Math.max(0.01, p.pred + res * lr + (Math.random() - 0.5) * 0.02));
        return { ...p, pred: newPred };
      });
    }

    return { series: seq, losses };
  }, [basePoints]);

  useEffect(() => {
    if (!playing) return;
    let idx = step;
    const id = setInterval(() => {
      idx = Math.min(MAX_STEPS - 1, idx + 1);
      setStep(idx);
      if (idx >= MAX_STEPS - 1) {
        setPlaying(false);
        clearInterval(id);
      }
    }, 900);
    return () => clearInterval(id);
  }, [playing]);

  const reset = () => {
    setStep(0);
    setPlaying(false);
  };

  // prepare scatter display: color by whether prediction (rounded) equals target
  const display = (arr: GPoint[]) =>
    arr.map((p) => {
      const predLabel = p.pred >= 0.5 ? 1 : 0;
      return {
        x: p.x,
        y: p.y,
        target: p.target,
        pred: Number(p.pred.toFixed(3)),
        correct: predLabel === p.target
      };
    });

  const lossSeries = states.losses || [];

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <section className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gradient Boosting — Visual Explanation</h1>
        <p className="text-gray-600 mb-6">
          Gradient Boosting sequentially fits models to the residuals (errors) of previous models. We show predictions, residuals and loss decreasing over iterations.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-4">
            <ExplanationCard step={`Step ${step + 1}`} description={
              step === 0
                ? "Base learner provides initial predictions; residuals (errors) are large."
                : step < MAX_STEPS - 1
                ? "Each added learner fits the residuals and nudges predictions closer to true values."
                : "Final model has much smaller residuals and lower loss."
            } />

            <div className="bg-white p-4 rounded shadow">
              <div className="flex gap-2 items-center">
                <button onClick={() => setStep((s) => Math.max(0, s - 1))} className="px-3 py-1 border rounded">Prev</button>
                <button onClick={() => setPlaying(true)} className="px-3 py-1 bg-green-600 text-white rounded">Play</button>
                <button onClick={() => setStep((s) => Math.min(MAX_STEPS - 1, s + 1))} className="px-3 py-1 border rounded">Next</button>
                <button onClick={reset} className="ml-auto px-3 py-1 border rounded">Reset</button>
              </div>

              <div className="mt-3 text-xs text-gray-500">
                <div>Domain: <strong>{domain}</strong></div>
                <div>Features: <strong>{xKey}</strong> vs <strong>{yKey}</strong></div>
                <div className="mt-2">Loss (MAE) at step {step + 1}: <strong>{lossSeries[step]?.loss ?? "-"}</strong></div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 bg-white rounded shadow p-4">
            <div style={{ width: "100%", height: 360 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid />
                  <XAxis dataKey="x" name={xKey} />
                  <YAxis dataKey="y" name={yKey} />
                  <Tooltip formatter={(val: any, name: any) => [val, name]} />
                  <Scatter
                    name="predictions"
                    data={display(states.series?.[step] ?? [])}
                    shape={(props: any) => {
                      const { cx, cy, payload } = props;
                      const color = payload.correct ? "#10B981" : "#EF4444";
                      const r = payload.correct ? 5 : 6.5;
                      return (
                        <svg x={cx - r} y={cy - r} width={r * 2} height={r * 2}>
                          <circle cx={r} cy={r} r={r} fill={color} opacity={0.9} />
                        </svg>
                      );
                    }}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Residual (Loss) trend</h4>
              <div style={{ width: "100%", height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lossSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="step" />
                    <YAxis domain={[0, 'dataMax + 0.05']} />
                    <Tooltip />
                    <Line type="monotone" dataKey="loss" stroke="#16a34a" strokeWidth={3} dot />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}