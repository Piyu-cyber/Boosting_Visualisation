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
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import { TrendingUp, Zap, Target, Brain, Layers, AlertCircle } from "lucide-react";
import Link from "next/link";
const MAX_STEPS = 6;

export default function XGBoostInteractive() {
  // Generate sample data
  const data = useMemo(() => {
    const points = [];
    for (let i = 0; i < 100; i++) {
      const temp = 20 + Math.random() * 60;
      const pressure = 100 + Math.random() * 150;
      const noise = (Math.random() - 0.5) * 20;
      const failure = temp > 50 && pressure > 175 + noise ? 1 : 0;
      points.push({ temperature: temp, pressure, failure });
    }
    return points;
  }, []);

  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [learningRate, setLearningRate] = useState(0.3);
  const [maxDepth, setMaxDepth] = useState(3);
  const [showResiduals, setShowResiduals] = useState(false);
  const [showDecisionBoundary, setShowDecisionBoundary] = useState(true);
  const [highlightedPoint, setHighlightedPoint] = useState<number | null>(null);
  const [animateTree, setAnimateTree] = useState(false);

  // Build points with progressive learning
  const points = useMemo(() => {
    const xs = data.map(d => d.temperature);
    const ys = data.map(d => d.pressure);
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    const yMin = Math.min(...ys);
    const yMax = Math.max(...ys);

    return data.map((d, i) => {
      const xNorm = (d.temperature - xMin) / (xMax - xMin + 1e-9);
      const yNorm = (d.pressure - yMin) / (yMax - yMin + 1e-9);
      const influence = (xNorm * 2 - 1) + (yNorm * 2 - 1);
      const sign = d.failure === 1 ? 1 : -1;

      const contribs = Array.from({ length: MAX_STEPS }, (_, s) => {
        const lr = learningRate * Math.pow(0.85, s);
        const residual = influence * (1 - Math.exp(-0.4 * (s + 1)));
        return Number((lr * residual * sign * (s + 1)).toFixed(3));
      });

      return {
        id: i,
        x: d.temperature,
        y: d.pressure,
        target: d.failure,
        contribs,
      };
    });
  }, [data, learningRate]);

  // Generate predictions for each step
  const series = useMemo(() => {
    const seq = [];
    for (let s = 0; s < MAX_STEPS; s++) {
      const arr = points.map((p) => {
        const score = p.contribs.slice(0, s + 1).reduce((a, b) => a + b, 0);
        const prob = 1 / (1 + Math.exp(-2 * score));
        const residual = p.target - prob;
        return {
          id: p.id,
          x: p.x,
          y: p.y,
          target: p.target,
          score: Number(prob.toFixed(3)),
          residual: Number(residual.toFixed(3)),
        };
      });
      seq.push(arr);
    }
    return seq;
  }, [points]);

  // Calculate metrics
  const metrics = useMemo(() => {
    return series.map((s, idx) => {
      const correct = s.filter((p) => (p.score >= 0.5 ? 1 : 0) === p.target).length;
      const accuracy = (correct / s.length) * 100;
      
      const loss = s.reduce((sum, p) => {
        const l = p.target * Math.log(p.score + 1e-9) + (1 - p.target) * Math.log(1 - p.score + 1e-9);
        return sum - l;
      }, 0) / s.length;

      const tp = s.filter(p => p.score >= 0.5 && p.target === 1).length;
      const fp = s.filter(p => p.score >= 0.5 && p.target === 0).length;
      const fn = s.filter(p => p.score < 0.5 && p.target === 1).length;
      
      const precision = tp / (tp + fp) || 0;
      const recall = tp / (tp + fn) || 0;
      const f1 = 2 * (precision * recall) / (precision + recall) || 0;

      return {
        step: idx + 1,
        accuracy: Number(accuracy.toFixed(1)),
        loss: Number(loss.toFixed(3)),
        precision: Number((precision * 100).toFixed(1)),
        recall: Number((recall * 100).toFixed(1)),
        f1: Number((f1 * 100).toFixed(1)),
      };
    });
  }, [series]);

  // Story content for each step
  const storyContent = [
    {
      title: "Base Learner",
      description: "We start with a weak learner making simple predictions. Notice how many points are misclassified.",
      insight: "Base accuracy is often around 50-60%. The model is essentially guessing based on basic feature thresholds.",
      math: "F₀(x) = log(p/(1-p)) where p = Σyᵢ/n",
    },
    {
      title: "Learning from Mistakes",
      description: "The second tree focuses on points the first tree got wrong. Watch the residuals shrink!",
      insight: "Gradient boosting computes gradients of the loss function to determine where to improve.",
      math: "F₁(x) = F₀(x) + η·h₁(x) where h₁ learns -∂L/∂F₀",
    },
    {
      title: "Iterative Refinement",
      description: "Each new tree corrects the ensemble's mistakes. The decision boundary becomes more sophisticated.",
      insight: "The learning rate η controls how much we trust each tree. Lower η = more stable, slower learning.",
      math: "Fₘ(x) = Fₘ₋₁(x) + η·hₘ(x)",
    },
    {
      title: "Capturing Complexity",
      description: "Non-linear patterns emerge as trees capture feature interactions that simple models miss.",
      insight: "Tree depth controls complexity. Deeper trees = more interactions but higher overfitting risk.",
      math: "Split gain: Gain = ½[GL²/(HL+λ) + GR²/(HR+λ) - (GL+GR)²/(HL+HR+λ)] - γ",
    },
    {
      title: "Regularization in Action",
      description: "XGBoost applies L1/L2 penalties to prevent overfitting. Notice how confidence stabilizes.",
      insight: "Regularization terms (γ, λ) penalize complex trees, trading some training accuracy for better generalization.",
      math: "Obj = Σᵢ L(yᵢ, ŷᵢ) + Σₖ Ω(fₖ) where Ω(f) = γT + ½λ||w||²",
    },
    {
      title: "Ensemble Complete",
      description: "The final model combines all trees. High-confidence predictions show as larger circles.",
      insight: "The ensemble leverages wisdom of crowds - each tree contributes its specialized knowledge.",
      math: "Final: ŷ = σ(Σₘ ηₘ·hₘ(x)) where σ is sigmoid",
    },
  ];

  // Auto-play animation
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      setStep((prev) => {
        const next = (prev + 1) % MAX_STEPS;
        if (next === 0) setPlaying(false);
        return next;
      });
    }, 2500);
    return () => clearInterval(timer);
  }, [playing]);

  // Tree animation
  useEffect(() => {
    if (animateTree) {
      const timer = setTimeout(() => setAnimateTree(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [animateTree]);

  const currentData = series[step] || [];
  const currentMetric = metrics[step] || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="text-center mb-6">
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 mb-3">
            XGBoost: The Story of Gradient Boosting
          </h1>
          <p className="text-gray-400 text-lg max-w-3xl mx-auto">
            Watch how extreme gradient boosting learns step by step, correcting mistakes and building confidence through ensemble learning
          </p>
        </div>

        {/* Progress Bar with Labels */}
        <div className="relative mb-8">
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 transition-all duration-500 ease-out"
              style={{ width: `${((step + 1) / MAX_STEPS) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            {Array.from({ length: MAX_STEPS }, (_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`transition-colors ${
                  i === step ? "text-cyan-400 font-bold" : "hover:text-gray-300"
                }`}
              >
                Tree {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-6">
        {/* Left Panel - Story & Controls */}
        <div className="space-y-4">
          {/* Story Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 border border-cyan-500/20 shadow-2xl shadow-cyan-500/10">
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-xl font-bold text-cyan-400">
                {storyContent[step].title}
              </h3>
            </div>
            <p className="text-gray-300 mb-4 leading-relaxed">
              {storyContent[step].description}
            </p>
            <div className="bg-indigo-900/30 rounded-lg p-4 border border-indigo-500/30">
              <div className="flex items-start gap-2 mb-2">
                <Brain className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-indigo-200">{storyContent[step].insight}</p>
              </div>
            </div>
            <div className="mt-4 bg-slate-950/50 rounded-lg p-4 border border-purple-500/20">
              <div className="text-xs text-purple-300 mb-2 font-semibold">Mathematical Formula:</div>
              <code className="text-xs text-purple-200 font-mono">{storyContent[step].math}</code>
            </div>
          </div>

          {/* Control Panel */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 border border-cyan-500/20">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Training Controls
            </h3>
            
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setStep(Math.max(0, step - 1))}
                disabled={step === 0}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-gray-600 rounded-lg transition-all"
              >
                ← Prev
              </button>
              <button
                onClick={() => {
                  setPlaying(!playing);
                  setAnimateTree(true);
                }}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg font-semibold transition-all"
              >
                {playing ? "⏸ Pause" : "▶ Play"}
              </button>
              <button
                onClick={() => setStep(Math.min(MAX_STEPS - 1, step + 1))}
                disabled={step === MAX_STEPS - 1}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-gray-600 rounded-lg transition-all"
              >
                Next →
              </button>
            </div>

            <button
              onClick={() => {
                setStep(0);
                setPlaying(false);
              }}
              className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg font-semibold transition-all mb-4"
            >
              Reset Training
            </button>

            {/* Hyperparameters */}
            <div className="space-y-4 pt-4 border-t border-gray-700">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-300">Learning Rate (η)</label>
                  <span className="text-cyan-400 font-mono text-sm">{learningRate.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={0.5}
                  step={0.05}
                  value={learningRate}
                  onChange={(e) => setLearningRate(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
                <p className="text-xs text-gray-400 mt-1">Lower = more stable, higher = faster learning</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-300">Max Tree Depth</label>
                  <span className="text-cyan-400 font-mono text-sm">{maxDepth}</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={6}
                  step={1}
                  value={maxDepth}
                  onChange={(e) => setMaxDepth(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
                <p className="text-xs text-gray-400 mt-1">Controls model complexity and overfitting</p>
              </div>
            </div>

            {/* Toggle Options */}
            <div className="space-y-2 pt-4 border-t border-gray-700">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={showResiduals}
                  onChange={(e) => setShowResiduals(e.target.checked)}
                  className="w-4 h-4 accent-cyan-500"
                />
                <span className="text-sm group-hover:text-cyan-400 transition-colors">Show Residuals</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={showDecisionBoundary}
                  onChange={(e) => setShowDecisionBoundary(e.target.checked)}
                  className="w-4 h-4 accent-cyan-500"
                />
                <span className="text-sm group-hover:text-cyan-400 transition-colors">Decision Boundary</span>
              </label>
            </div>
          </div>

          {/* Live Metrics */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 border border-cyan-500/20">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-green-400" />
              Live Metrics
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950/50 rounded-lg p-3 border border-green-500/20">
                <div className="text-xs text-gray-400 mb-1">Accuracy</div>
                <div className="text-2xl font-bold text-green-400">{currentMetric.accuracy}%</div>
              </div>
              <div className="bg-slate-950/50 rounded-lg p-3 border border-blue-500/20">
                <div className="text-xs text-gray-400 mb-1">F1 Score</div>
                <div className="text-2xl font-bold text-blue-400">{currentMetric.f1}%</div>
              </div>
              <div className="bg-slate-950/50 rounded-lg p-3 border border-purple-500/20">
                <div className="text-xs text-gray-400 mb-1">Precision</div>
                <div className="text-2xl font-bold text-purple-400">{currentMetric.precision}%</div>
              </div>
              <div className="bg-slate-950/50 rounded-lg p-3 border border-pink-500/20">
                <div className="text-xs text-gray-400 mb-1">Loss</div>
                <div className="text-2xl font-bold text-pink-400">{currentMetric.loss}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Center/Right - Visualizations */}
        <div className="lg:col-span-2 space-y-4">
          {/* Main Scatter Plot */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 border border-cyan-500/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-400" />
                Feature Space (Step {step + 1}/{MAX_STEPS})
              </h3>
              {highlightedPoint !== null && (
                <div className="text-sm text-cyan-400">Point #{highlightedPoint} selected</div>
              )}
            </div>

            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart margin={{ top: 10, right: 30, bottom: 60, left: 60 }}>
                <defs>
                  <radialGradient id="correctGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#16a34a" stopOpacity="0.6" />
                  </radialGradient>
                  <radialGradient id="wrongGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#dc2626" stopOpacity="0.6" />
                  </radialGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.3} />
                <XAxis
                  dataKey="x"
                  type="number"
                  domain={[15, 85]}
                  stroke="#94a3b8"
                  label={{ value: "Temperature (°C)", position: "bottom", offset: 40, fill: "#94a3b8" }}
                />
                <YAxis
                  dataKey="y"
                  type="number"
                  domain={[90, 260]}
                  stroke="#94a3b8"
                  label={{ value: "Pressure (kPa)", angle: -90, position: "insideLeft", offset: 10, fill: "#94a3b8" }}
                />
                <Tooltip
                  content={({ payload }) => {
                    if (!payload?.[0]) return null;
                    const p = payload[0].payload;
                    return (
                      <div className="bg-slate-950 border border-cyan-500/30 rounded-lg p-4 shadow-2xl">
                        <div className="text-cyan-400 font-bold mb-2">Point #{p.id}</div>
                        <div className="space-y-1 text-sm">
                          <div>Temperature: <span className="text-white font-semibold">{p.x.toFixed(1)}°C</span></div>
                          <div>Pressure: <span className="text-white font-semibold">{p.y.toFixed(1)} kPa</span></div>
                          <div>Confidence: <span className="text-white font-semibold">{(p.score * 100).toFixed(1)}%</span></div>
                          <div className={p.pred === p.target ? "text-green-400" : "text-red-400"}>
                            {p.pred === p.target ? "✓ Correct" : "✗ Incorrect"}
                          </div>
                          {showResiduals && (
                            <div className="text-purple-400">Residual: {p.residual.toFixed(3)}</div>
                          )}
                        </div>
                      </div>
                    );
                  }}
                />
                <Scatter
                  data={currentData.map(p => ({
                    ...p,
                    pred: p.score >= 0.5 ? 1 : 0,
                  }))}
                  shape={({ cx, cy, payload }) => {
                    const isCorrect = (payload.score >= 0.5 ? 1 : 0) === payload.target;
                    const size = 4 + Math.abs(payload.score - 0.5) * 16;
                    const isHighlighted = highlightedPoint === payload.id;
                    
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isHighlighted ? size * 1.5 : size}
                        fill={isCorrect ? "url(#correctGrad)" : "url(#wrongGrad)"}
                        stroke={isHighlighted ? "#fbbf24" : isCorrect ? "#86efac" : "#fca5a5"}
                        strokeWidth={isHighlighted ? 3 : 1.5}
                        opacity={isHighlighted ? 1 : 0.85}
                        style={{ 
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                        }}
                        onMouseEnter={() => setHighlightedPoint(payload.id)}
                        onMouseLeave={() => setHighlightedPoint(null)}
                      />
                    );
                  }}
                />
              </ScatterChart>
            </ResponsiveContainer>

            <div className="flex items-center justify-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500"></div>
                <span>Correct Prediction</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500"></div>
                <span>Incorrect Prediction</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-cyan-400" />
                <span>Size = Confidence</span>
              </div>
            </div>
          </div>

          {/* Learning Curves */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 border border-cyan-500/20">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                Accuracy Progress
              </h3>
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={metrics.slice(0, step + 1)}>
                  <defs>
                    <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.3} />
                  <XAxis dataKey="step" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #06b6d4" }} />
                  <Area type="monotone" dataKey="accuracy" stroke="#22c55e" fillOpacity={1} fill="url(#accGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 border border-cyan-500/20">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-pink-400" />
                Loss Reduction
              </h3>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={metrics.slice(0, step + 1)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.3} />
                  <XAxis dataKey="step" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #ec4899" }} />
                  <Line type="monotone" dataKey="loss" stroke="#ec4899" strokeWidth={2} dot={{ fill: "#ec4899", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tree Visualization */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 border border-cyan-500/20">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className={animateTree ? "animate-bounce" : ""}></span>
              Decision Tree Structure (Depth: {maxDepth})
            </h3>
            <div className="bg-slate-950/50 rounded-lg p-6 font-mono text-xs overflow-x-auto">
              <div className="text-cyan-400 mb-4 text-center">Tree #{step + 1} - Learning Rate: {learningRate}</div>
              <pre className="text-gray-300 leading-relaxed whitespace-pre">
{`                     Root
                      |
          Temperature <= 50.0?
          /                    \\
        Yes                    No
         |                      |
   Pressure <= 175?      Pressure <= 200?
    /          \\            /          \\
  Yes          No         Yes          No
   |            |          |            |
Weight:     Weight:    Weight:     Weight:
${(-0.3 * learningRate * (step + 1)).toFixed(2)}      ${(-0.1 * learningRate * (step + 1)).toFixed(2)}     ${(0.1 * learningRate * (step + 1)).toFixed(2)}      ${(0.4 * learningRate * (step + 1)).toFixed(2)}
(Negative)  (Negative) (Positive)  (Positive)`}
              </pre>
            </div>
            <p className="text-xs text-gray-400 mt-3 text-center">
              Each leaf outputs a weight that gets added to the ensemble prediction
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}