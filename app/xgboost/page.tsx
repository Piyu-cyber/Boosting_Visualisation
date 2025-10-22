"use client";

import React, { useMemo, useState, useEffect } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianAxis } from "recharts";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ExplanationCard from "@/components/ExplanationCard";
import { useDomain } from "@/components/DomainContext";

/**
 * XGBoost page
 * Visual explanation:
 * - Show that XGBoost is an optimized form of gradient boosting (regularization, shrinkage, tree complexity)
 * - Simulate contribution of small trees as additive contributions per sample
 * - Visualize feature importance (simulated) as bar chart
 */

const MAX_STEPS = 6;

type P = {
  id: number;
  x: number;
  y: number;
  target: number;
  contribs: number[]; // contributions from each tree/step
};

export default function XGBoostPage() {
  const { data, domain } = useDomain();
  const [step, setStep] = useState<number>(0);
  const [playing, setPlaying] = useState(false);

  // choose two features and compute simulated contributions
  const { xKey, yKey, labelKey, featureKeys } = useMemo(() => {
    const sample = data && data.length > 0 ? data[0] : {};
    const numeric = Object.keys(sample).filter((k) => typeof (sample as any)[k] === "number");
    const x = numeric.includes("temperature") ? "temperature" : numeric[0] ?? "x";
    const y = numeric.includes("pressure") ? "pressure" : numeric[1] ?? numeric[0] ?? "y";
    const label = numeric.includes("failure") ? "failure" : (numeric.includes("subscribed") ? "subscribed" : numeric[numeric.length - 1] ?? "label");
    return { xKey: x, yKey: y, labelKey: label, featureKeys: numeric.slice(0, 4) };
  }, [data]);

  // prepare points with per-step contributions
  const points: P[] = useMemo(() => {
    if (!data || data.length === 0) return [];
    // determine target binary
    const numericLabel = data.every((d) => typeof (d as any)[labelKey] === "number");
    let median = 0;
    if (numericLabel) {
      const arr = (data as any[]).map((d) => Number(d[labelKey])).sort((a, b) => a - b);
      median = arr[Math.floor(arr.length / 2)] ?? 0;
    }

    return (data as any[]).map((d, i) => {
      const t = typeof d[labelKey] === "number" ? (d[labelKey] > median ? 1 : 0) : (d[labelKey] ? 1 : 0);
      // create contributions per tree: small random offsets summing toward label
      const contribs = Array.from({ length: MAX_STEPS }, (_, s) => {
        // earlier trees smaller, later ones could be larger but shrinked by learning rate
        const sign = t === 1 ? 1 : -1;
        const base = (Math.random() * 0.2 + 0.05) * sign * Math.pow(0.8, s);
        return Number(base.toFixed(3));
      });
      return { id: i, x: Number(d[xKey]) || 0, y: Number(d[yKey]) || 0, target: t, contribs };
    });
  }, [data, xKey, yKey, labelKey]);

  // compute cumulative score at each step => simulate prediction
  const series = useMemo(() => {
    // series[step] = points with cumulative prediction after step
    const seq: { id: number; x: number; y: number; target: number; score: number }[][] = [];
    for (let s = 0; s < MAX_STEPS; s++) {
      const arr = points.map((p) => {
        const score = p.contribs.slice(0, s + 1).reduce((a, b) => a + b, 0);
        // convert score to probability-like via sigmoid-ish clamp
        const prob = 1 / (1 + Math.exp(-5 * score)); // steeper sigmoid to show separation
        return { id: p.id, x: p.x, y: p.y, target: p.target, score: Number(prob.toFixed(3)) };
      });
      seq.push(arr);
    }
    return seq;
  }, [points]);

  // simulate feature importance by aggregating absolute contributions across steps per feature (we don't have true features influence, so simulate)
  const featureImportance = useMemo(() => {
    const fk = featureKeys.length ? featureKeys : ["f1", "f2", "f3"];
    return fk.map((k, i) => ({ feature: k, importance: Math.round((Math.random() * 40 + 10) / (i + 1)) }));
  }, [featureKeys]);

  // play control
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

  // display data at current step with color by predicted label
  const display = (arr: any[]) =>
    arr.map((p) => {
      const predLabel = p.score >= 0.5 ? 1 : 0;
      return {
        x: p.x,
        y: p.y,
        prob: Number(p.score.toFixed(3)),
        pred: predLabel,
        target: p.target
      };
    });

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <section className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">XGBoost — Visual Explanation</h1>
        <p className="text-gray-600 mb-6">
          XGBoost builds on gradient boosting and adds optimizations: shrinkage (learning rate), regularization, and efficient tree construction. We visualize how many small trees add up to a final prediction.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-4">
            <ExplanationCard step={`Step ${step + 1}`} description={
              step === 0
                ? "XGBoost begins with tiny tree contributions (small additive effects)."
                : step < MAX_STEPS - 1
                ? "Each tree adds a small contribution; together they push probabilities toward the correct label."
                : "Final model aggregates many tree contributions; XGBoost adds optimizations to keep this generalizable."
            } />

            <div className="bg-white p-4 rounded shadow">
              <div className="flex gap-2 items-center">
                <button onClick={() => setStep((s) => Math.max(0, s - 1))} className="px-3 py-1 border rounded">Prev</button>
                <button onClick={() => setPlaying(true)} className="px-3 py-1 bg-indigo-600 text-white rounded">Play</button>
                <button onClick={() => setStep((s) => Math.min(MAX_STEPS - 1, s + 1))} className="px-3 py-1 border rounded">Next</button>
                <button onClick={reset} className="ml-auto px-3 py-1 border rounded">Reset</button>
              </div>

              <div className="mt-3 text-xs text-gray-500">
                <div>Domain: <strong>{domain}</strong></div>
                <div>Features: <strong>{xKey}</strong> vs <strong>{yKey}</strong></div>
              </div>
            </div>

            <div className="bg-white p-3 rounded shadow">
              <div className="text-sm font-medium text-gray-700 mb-2">Simulated Feature Importance</div>
              <div style={{ width: "100%", height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={featureImportance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="feature" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="importance" fill="#2563eb" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 bg-white rounded shadow p-4">
            <div style={{ width: "100%", height: 420 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid />
                  <XAxis dataKey="x" name={xKey} />
                  <YAxis dataKey="y" name={yKey} />
                  <Tooltip formatter={(val: any, name: any) => [val, name]} />
                  <Scatter
                    name="xg_predictions"
                    data={display(series[step] ?? [])}
                    shape={(props: any) => {
                      const { cx, cy, payload } = props;
                      const color = payload.pred ? "#065f46" : "#ef4444";
                      const r = 5 + (payload.prob - 0.5) * 6; // radius reflects confidence
                      const rad = Math.max(3, Math.min(10, Math.abs(r)));
                      return (
                        <svg x={cx - rad} y={cy - rad} width={rad * 2} height={rad * 2}>
                          <circle cx={rad} cy={rad} r={rad} fill={color} opacity={0.9} />
                        </svg>
                      );
                    }}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 text-sm text-gray-600">
              <div><strong>Visual cues:</strong></div>
              <ul className="list-disc ml-5">
                <li>Point color: predicted class (green = predicted positive, red = predicted negative)</li>
                <li>Point size ~ model confidence (bigger = more confident)</li>
                <li>Feature importance bar chart (simulated) shows how XGBoost balances contributions</li>
              </ul>
            </div>
          </div>

        </div>
      </section>
      <Footer />
    </main>
  );
}
