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
  Legend
} from "recharts";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ExplanationCard from "@/components/ExplanationCard";
import { useDomain } from "@/components/DomainContext";

/**
 * Gradient Boost page (improved step-by-step explanation)
 *
 * - Shows previous-step predictions faintly behind current-step predictions
 * - Draws lines from previous prediction -> current prediction for each sample
 * - Shows MAE (loss), delta loss and accuracy for the current step
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
      const maxX = Math.max(...(data as any[]).map((z) => Number(z[xKey] || 1)));
      const xnorm = xVal / (maxX || 1);
      // base prediction is noisy around xnorm
      const basePred = Math.min(0.95, Math.max(0.05, xnorm * 0.7 + (Math.random() - 0.5) * 0.2));
      return { id: i, x: Number(d[xKey]) || 0, y: Number(d[yKey]) || 0, target, pred: basePred } as GPoint;
    });
  }, [data, xKey, yKey, labelKey]);

  // build sequence of predictions where each step reduces residuals (we simulate learning)
  // states.series: array of arrays of GPoint (snapshots for step 0..MAX_STEPS-1)
  // states.losses: { step, loss, accuracy }
  const states = useMemo(() => {
    if (!basePoints.length) return { series: [] as GPoint[][], losses: [] as { step: number; loss: number; accuracy: number }[] };

    const seq: GPoint[][] = [];
    const losses: { step: number; loss: number; accuracy: number }[] = [];

    // initial predictions
    let current = basePoints.map((p) => ({ ...p }));
    for (let s = 0; s < MAX_STEPS; s++) {
      // compute residuals and loss as mean absolute error
      const residuals = current.map((p) => Math.abs(p.target - p.pred));
      const loss = residuals.reduce((a, b) => a + b, 0) / residuals.length;
      const correct = current.filter((p) => (p.pred >= 0.5 ? 1 : 0) === p.target).length;
      const accuracy = Number(((correct / current.length) * 100).toFixed(1));
      losses.push({ step: s + 1, loss: Number(loss.toFixed(4)), accuracy });
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

  // Play control
  useEffect(() => {
    if (!playing) return;
    let idx = step;
    const id = setInterval(() => {
      idx = Math.min(states.series.length - 1, idx + 1);
      setStep(idx);
      if (idx >= (states.series.length - 1)) {
        setPlaying(false);
        clearInterval(id);
      }
    }, 900);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, states.series.length]);

  const reset = () => {
    setStep(0);
    setPlaying(false);
  };

  // prepare scatter display: include prev coords inside payload so custom shape can draw arrows
  const prepareDisplayWithPrev = (series: GPoint[][], idx: number) => {
    if (!series || series.length === 0) return { current: [], prev: [] as any[] };
    const current = series[idx] ?? [];
    const prev = idx > 0 ? series[idx - 1] : series[0];

    // map prev by id for quick lookup
    const prevById = new Map<number, GPoint>();
    prev.forEach((p) => prevById.set(p.id, p));

    const currentWithPrev = current.map((p) => {
      const prevP = prevById.get(p.id);
      return {
        id: p.id,
        x: p.x,
        y: p.y,
        pred: Number(p.pred.toFixed(4)),
        target: p.target,
        correct: (p.pred >= 0.5 ? 1 : 0) === p.target,
        // include previous predicted normalized coordinates so the custom shape can draw a line
        prevPred: prevP ? Number(prevP.pred.toFixed(4)) : p.pred,
        // we also include prev point's (x,y) so x,y are consistent for plotting (they're feature coords),
        // but predictions are not plotted on axes — we will reuse x,y; the difference in prediction will be shown via color/size and arrow.
        prevX: prevP ? prevP.x : p.x,
        prevY: prevP ? prevP.y : p.y
      };
    });

    // a faint version of previous points for background (used for context)
    const prevBackground = prev.map((p) => ({
      id: p.id,
      x: p.x,
      y: p.y,
      pred: Number(p.pred.toFixed(4)),
      target: p.target,
      correct: (p.pred >= 0.5 ? 1 : 0) === p.target
    }));

    return { current: currentWithPrev, prev: prevBackground };
  };

  const { current: displayCurrent, prev: displayPrev } = prepareDisplayWithPrev(states.series, step);

  const lossSeries = states.losses || [];

  // compute delta loss (change from prev step)
  const lossNow = lossSeries[step]?.loss ?? null;
  const lossPrev = step > 0 ? lossSeries[step - 1]?.loss ?? null : null;
  const lossDelta = lossNow != null && lossPrev != null ? Number((lossPrev - lossNow).toFixed(4)) : null;
  const accNow = lossSeries[step]?.accuracy ?? null;

  // custom shape for current points: draw arrow from prev position -> current position and show circle
  const PointWithArrow = (props: any) => {
    const { cx, cy, payload } = props;
    // We cannot get prev screen coords directly, but payload.prevX/prevY are feature coords.
    // Recharts gives us cx/cy for the current point; to draw a visible directional line
    // we'll render a short line pointing in vertical/horizontal direction between hypothetical prev and current.
    // For simplicity and clarity, we'll draw a small line with arrow from (cx,cy - 10) to (cx,cy) if payload shows improvement, else from (cx,cy+10) to (cx,cy).
    // But better: use payload._prevCx/_prevCy if available (not available). So we'll draw an arrow in the same point showing movement via small radial line.
    // To actually reflect movement, we'll compute a simple visual offset based on pred difference:
    const pred = payload.pred;
    const prevPred = payload.prevPred ?? pred;
    const diff = pred - prevPred; // positive => moved toward 1
    const moved = Math.abs(diff);

    // arrow length scaled by pred difference
    const arrowLen = Math.min(20, Math.max(4, moved * 100));

    // choose color by correctness
    const color = payload.correct ? "#10B981" : "#EF4444";
    const r = payload.correct ? 5 : 7;

    // direction: if pred increased, arrow points upward; if decreased, arrow points downward
    const dir = diff >= 0 ? -1 : 1;

    // compute small arrow end coords
    const x1 = cx;
    const y1 = cy + dir * arrowLen; // start
    const x2 = cx;
    const y2 = cy; // end at point

    // arrow head
    const headSize = 4;

    return (
      <g>
        {/* arrow line */}
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={1.6} strokeOpacity={0.9} />
        {/* head (simple) */}
        <polygon
          points={`${x2},${y2} ${x2 - headSize},${y2 + dir * headSize} ${x2 + headSize},${y2 + dir * headSize}`}
          fill={color}
          opacity={0.9}
        />
        {/* circle for current */}
        <circle cx={x2} cy={y2} r={r} fill={color} opacity={0.95} />
      </g>
    );
  };

  // Tooltip formatter for scatter - show pred, target, correctness
  const scatterTooltipFormatter = (value: any, name: any, props: any) => {
    // value will be x or y; we rely on payload
    const pl = props && props.payload;
    if (!pl) return [value, name];
    return [
      `pred=${pl.pred} | target=${pl.target} | ${pl.correct ? "correct" : "wrong"}`,
      ""
    ];
  };

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <section className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gradient Boosting — Visual Explanation (step-by-step)</h1>
        <p className="text-gray-600 mb-6">
          Gradient Boosting sequentially fits models to remaining residuals. Use the controls to step through iterations — previous predictions are shown faintly; arrows show how each prediction moved.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-4">
            <ExplanationCard
              step={`Step ${step + 1}`}
              description={
                step === 0
                  ? "Base learner provides initial predictions; residuals (errors) are large."
                  : step < MAX_STEPS - 1
                    ? "Each added learner fits the residuals and nudges predictions — arrows show direction and magnitude of change."
                    : "Final model has much smaller residuals and higher accuracy."
              }
            />

            <div className="bg-white p-4 rounded shadow">
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  className="px-3 py-1 border rounded"
                  disabled={step === 0}
                >
                  Prev
                </button>

                <button
                  onClick={() => setPlaying((p) => !p)}
                  className={`px-3 py-1 text-white rounded ${playing ? "bg-yellow-500" : "bg-green-600"}`}
                >
                  {playing ? "Pause" : "Play"}
                </button>

                <button
                  onClick={() => setStep((s) => Math.min((states.series?.length ?? MAX_STEPS) - 1, s + 1))}
                  className="px-3 py-1 border rounded"
                  disabled={step >= (states.series?.length ?? MAX_STEPS) - 1}
                >
                  Next
                </button>

                <button onClick={reset} className="ml-auto px-3 py-1 border rounded">Reset</button>
              </div>

              <div className="mt-3 text-xs text-gray-500">
                <div>Domain: <strong>{domain}</strong></div>
                <div>Features: <strong>{xKey}</strong> vs <strong>{yKey}</strong></div>
                <div className="mt-2">Loss (MAE) at step {step + 1}: <strong>{lossNow ?? "-"}</strong></div>
                <div>Δ Loss: <strong>{lossDelta != null ? `-${lossDelta}` : "-"}</strong></div>
                <div>Accuracy: <strong>{accNow != null ? `${accNow}%` : "-"}</strong></div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 bg-white rounded shadow p-4">
            <div style={{ width: "100%", height: 420 }}>
              <ResponsiveContainer width="100%" height="60%">
                <ScatterChart>
                  <CartesianGrid />
                  <XAxis dataKey="x" name={xKey} />
                  <YAxis dataKey="y" name={yKey} />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    formatter={(val: any, name: any, props: any) => scatterTooltipFormatter(val, name, props)}
                  />
                  <Legend />
                  {/* faint previous points for context */}
                  <Scatter
                    name="previous (faint)"
                    data={displayPrev}
                    fill="#9CA3AF"
                    opacity={0.25}
                    shape={(props: any) => {
                      const { cx, cy, payload } = props;
                      // faint background circle
                      return <circle cx={cx} cy={cy} r={4} fill="#9CA3AF" opacity={0.25} />;
                    }}
                  />

                  {/* current points with arrows */}
                  <Scatter
                    name="current"
                    data={displayCurrent}
                    shape={PointWithArrow}
                  />
                </ScatterChart>
              </ResponsiveContainer>

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
        </div>
      </section>
      <Footer />
    </main>
  );
}
