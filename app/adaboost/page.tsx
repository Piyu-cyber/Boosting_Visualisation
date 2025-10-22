"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ExplanationCard from "@/components/ExplanationCard";
import { useDomain } from "@/components/DomainContext";

/**
 * AdaBoost page
 * Visualizes AdaBoost conceptually:
 * - Step 0: weak learner (naive boundary)
 * - Steps 1..N-1: reweighting highlights (misclassified points increase size)
 * - Step N: combined ensemble boundary (visual)
 *
 * Visualization technique:
 * - Pick two numeric features automatically
 * - Create a naive split (median X) as weak learner
 * - Mark "hard" points (on wrong side) and progressively "fix" them visually
 * - Use point radius to show weight from AdaBoost perspective
 */

const MAX_STEPS = 5;

type Point = {
  id: number;
  x: number;
  y: number;
  trueLabel: number; // 0 or 1
  weight?: number; // visual weight
};

export default function AdaBoostPage() {
  const { data, domain } = useDomain();
  const [step, setStep] = useState<number>(0);
  const [playing, setPlaying] = useState(false);

  // auto pick two numeric features and target
  const { xKey, yKey, labelKey } = useMemo(() => {
    const sample = data && data.length > 0 ? data[0] : {};
    const numeric = Object.keys(sample).filter((k) => typeof (sample as any)[k] === "number");
    // choose reasonable defaults
    const x = numeric.includes("age") ? "age" : numeric[0] ?? "x";
    const y = numeric.includes("balance") ? "balance" : numeric[1] ?? numeric[0] ?? "y";
    const label = numeric.includes("subscribed") ? "subscribed" : (numeric.includes("failure") ? "failure" : numeric[numeric.length - 1] ?? "label");
    return { xKey: x, yKey: y, labelKey: label };
  }, [data]);

  // prepare points, convert regression targets to binary by median if needed
  const points: Point[] = useMemo(() => {
    if (!data || data.length === 0) return [];

    const numericalLabel = data.every((d) => typeof (d as any)[labelKey] === "number");
    let median = 0;
    if (numericalLabel) {
      const arr = (data as any[]).map((d) => Number(d[labelKey])).sort((a, b) => a - b);
      median = arr[Math.floor(arr.length / 2)] ?? 0;
    }

    return (data as any[]).map((d, i) => {
      const rawLabel = d[labelKey];
      const label = typeof rawLabel === "number" ? (rawLabel > median ? 1 : 0) : (rawLabel ? 1 : 0);
      return {
        id: i,
        x: Number(d[xKey]) || 0,
        y: Number(d[yKey]) || 0,
        trueLabel: label,
        weight: 1 // start equal
      } as Point;
    });
  }, [data, xKey, yKey, labelKey]);

  // compute naive weak learner: median x split
  const medianX = useMemo(() => {
    if (!points.length) return 0;
    const xs = points.map((p) => p.x).sort((a, b) => a - b);
    return xs[Math.floor(xs.length / 2)];
  }, [points]);

  // determine "hard" points incorrectly classified by naive split
  const hardPoints = useMemo(() => {
    return points.filter((p) => {
      const predicted = p.x >= medianX ? 1 : 0;
      return predicted !== p.trueLabel;
    });
  }, [points, medianX]);

  // prepare sequence of visual states (weights) for MAX_STEPS
  const states = useMemo(() => {
    // copy base points
    const base = points.map((p) => ({ ...p }));
    if (!base.length) return [];

    // Step 0: naive classifier misclassifies hardPoints, we simulate their visual weight increased
    // We'll produce MAX_STEPS states: each subsequent state fixes a portion of hard points.
    const seq: Point[][] = [];
    // initial: all weights 1, but misclassified will appear larger in step 0 to show failure
    const s0 = base.map((p) => ({ ...p, weight: hardPoints.find((h) => h.id === p.id) ? 2.4 : 1 }));
    seq.push(s0);

    // compute fix order (sort hard points by distance from median to simulate difficulty)
    const orderedHard = [...hardPoints].sort((a, b) => {
      return Math.abs(a.x - medianX) - Math.abs(b.x - medianX);
    });

    const fixesPerStep = Math.max(1, Math.ceil(orderedHard.length / (MAX_STEPS - 1)));
    let fixed = new Set<number>();

    for (let s = 1; s < MAX_STEPS; s++) {
      const prev = seq[seq.length - 1].map((p) => ({ ...p }));
      const start = (s - 1) * fixesPerStep;
      const slice = orderedHard.slice(start, start + fixesPerStep);
      slice.forEach((hp) => {
        // visually fix it: reduce weight to 0.9 and consider it "classified"
        const idx = prev.findIndex((pp) => pp.id === hp.id);
        if (idx >= 0) {
          prev[idx].weight = 0.9;
          fixed.add(hp.id);
        }
      });
      // for any remaining hard points that are not fixed, keep weight high
      prev.forEach((p) => {
        if (!fixed.has(p.id) && hardPoints.find((h) => h.id === p.id)) {
          p.weight = 2.2;
        } else if (!hardPoints.find((h) => h.id === p.id)) {
          p.weight = 1;
        }
      });
      seq.push(prev);
    }

    return seq;
  }, [points, hardPoints, medianX]);

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

  // helper: transform state points to recharts data format
  const displayData = (arr: Point[]) => {
    return arr.map((p) => ({
      x: p.x,
      y: p.y,
      label: p.trueLabel,
      r: Math.max(4, (p.weight ?? 1) * 4) // radius
    }));
  };

  // draw a simulated ensemble boundary as a smooth curve (simple polyline) — here we just render a vertical band near medianX
  const boundaryLeft = medianX - (medianX * 0.02 || 1);
  const boundaryRight = medianX + (medianX * 0.02 || 1);

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <section className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AdaBoost — Visual Explanation</h1>
        <p className="text-gray-600 mb-6">
          AdaBoost increases the importance of samples that were previously misclassified. We visualize weights as point sizes.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-4">
            <ExplanationCard step={`Step ${step + 1}`} description={
              step === 0
                ? "Weak learner (naive split) misclassifies several points — misclassified points are highlighted."
                : step < MAX_STEPS - 1
                ? "Subsequent learners focus more on previously misclassified points (they shrink as they become corrected)."
                : "Final ensemble combines learners and reduces errors (visualized as most points returning to normal size)."
            } />

            <div className="bg-white p-4 rounded shadow">
              <div className="flex gap-2 items-center">
                <button onClick={() => setStep((s) => Math.max(0, s - 1))} className="px-3 py-1 border rounded">Prev</button>
                <button onClick={() => setPlaying(true)} className="px-3 py-1 bg-indigo-600 text-white rounded">Play</button>
                <button onClick={() => setStep((s) => Math.min(MAX_STEPS - 1, s + 1))} className="px-3 py-1 border rounded">Next</button>
                <button onClick={reset} className="ml-auto px-3 py-1 border rounded">Reset</button>
              </div>

              <div className="mt-3 text-sm text-gray-500">
                <div>Domain: <strong>{domain}</strong></div>
                <div>Features: <strong>{xKey}</strong> vs <strong>{yKey}</strong></div>
                <div className="mt-2">Naive split at x = {medianX.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 bg-white rounded shadow p-4">
            <div style={{ width: "100%", height: 480 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid />
                  <XAxis dataKey="x" name={xKey} />
                  <YAxis dataKey="y" name={yKey} />
                  <Tooltip formatter={(value: any, name: any, props: any) => {
                    if (name === "x") return [`${value}`,'x'];
                    if (name === "y") return [`${value}`,'y'];
                    return value;
                  }} />
                  <Scatter
                    name="points"
                    data={displayData(states[step] ?? [])}
                    fill="#8884d8"
                    shape={(props: any) => {
                      // custom SVG circle with variable radius and color based on true label
                      const { cx, cy, payload } = props;
                      const color = payload.label ? "#10B981" : "#EF4444";
                      const r = payload.r ?? 6;
                      return (
                        <svg x={cx - r} y={cy - r} width={r * 2} height={r * 2}>
                          <circle cx={r} cy={r} r={r} fill={color} opacity={0.85} />
                        </svg>
                      );
                    }}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* Visual boundary overlay explanation */}
            <div className="mt-3 text-sm text-gray-600">
              <div><strong>Visual cue:</strong> point size ≈ sample weight. Larger points indicate AdaBoost is focusing more on them.</div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}