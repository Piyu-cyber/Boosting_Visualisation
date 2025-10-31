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
  Legend,
  Area,
  AreaChart,
  BarChart,
  Bar
} from "recharts";

const MAX_STEPS = 8;

type GPoint = {
  id: number;
  x: number;
  y: number;
  target: number;
  pred: number;
  residual?: number;
};

// Sample data generator
const generateSampleData = () => {
  const data = [];
  for (let i = 0; i < 50; i++) {
    const age = 20 + Math.random() * 60;
    const balance = Math.random() * 5000;
    const failure = age > 40 && balance < 2500 ? (Math.random() > 0.3 ? 1 : 0) : (Math.random() > 0.7 ? 1 : 0);
    data.push({ age, balance, failure });
  }
  return data;
};

export default function GradientBoostPage() {
  const [data] = useState(generateSampleData());
  const [step, setStep] = useState<number>(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1200);
  const [learningRate, setLearningRate] = useState(0.3);
  const [showResiduals, setShowResiduals] = useState(true);
  const [showDecisionBoundary, setShowDecisionBoundary] = useState(true);
  const [highlightedPoint, setHighlightedPoint] = useState<number | null>(null);
  const [autoRotate, setAutoRotate] = useState(false);

  const { xKey, yKey, labelKey } = useMemo(() => {
    return { xKey: "age", yKey: "balance", labelKey: "failure" };
  }, []);

  const basePoints = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((d, i) => {
      const target = d[labelKey] ? 1 : 0;
      const xVal = d[xKey];
      const maxX = Math.max(...data.map((z) => z[xKey]));
      const xnorm = xVal / maxX;
      const basePred = Math.min(0.9, Math.max(0.1, xnorm * 0.6 + (Math.random() - 0.5) * 0.1));
      return { 
        id: i, 
        x: d[xKey], 
        y: d[yKey], 
        target, 
        pred: basePred,
        residual: target - basePred
      } as GPoint;
    });
  }, [data, xKey, yKey, labelKey]);

  const axisDomains = useMemo(() => {
    if (!basePoints || basePoints.length === 0) return { x: [0, 100], y: [0, 5000] };
    const xs = basePoints.map((p) => p.x);
    const ys = basePoints.map((p) => p.y);
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    const yMin = Math.min(...ys);
    const yMax = Math.max(...ys);
    const xPad = (xMax - xMin) * 0.1 || 5;
    const yPad = (yMax - yMin) * 0.1 || 100;
    // Clamp Y lower bound to 0 so features like Balance don't display negative ticks
    const xLower = Math.floor(xMin - xPad);
    const xUpper = Math.ceil(xMax + xPad);
    const yLower = Math.max(0, Math.floor(yMin - yPad));
    const yUpper = Math.ceil(yMax + yPad);
    return {
      x: [xLower, xUpper],
      y: [yLower, yUpper]
    };
  }, [basePoints]);

  const states = useMemo(() => {
    if (!basePoints.length) return { 
      series: [] as GPoint[][], 
      losses: [] as any[],
      residualDist: [] as any[],
      treeContributions: [] as any[]
    };

    const seq: GPoint[][] = [];
    const losses: any[] = [];
    const residualDist: any[] = [];
    const treeContributions: any[] = [];

    let current = basePoints.map((p) => ({ ...p }));
    
    for (let s = 0; s < MAX_STEPS; s++) {
      const residuals = current.map((p) => p.target - p.pred);
      const absResiduals = residuals.map(Math.abs);
      const mae = absResiduals.reduce((a, b) => a + b, 0) / absResiduals.length;
      const mse = residuals.map(r => r * r).reduce((a, b) => a + b, 0) / residuals.length;
      const rmse = Math.sqrt(mse);
      
      const correct = current.filter((p) => (p.pred >= 0.5 ? 1 : 0) === p.target).length;
      const accuracy = (correct / current.length) * 100;
      
      const tp = current.filter(p => p.pred >= 0.5 && p.target === 1).length;
      const fp = current.filter(p => p.pred >= 0.5 && p.target === 0).length;
      const tn = current.filter(p => p.pred < 0.5 && p.target === 0).length;
      const fn = current.filter(p => p.pred < 0.5 && p.target === 1).length;
      
      const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
      const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
      const f1 = precision + recall > 0 ? 2 * (precision * recall) / (precision + recall) : 0;

      losses.push({ 
        step: s + 1, 
        mae: Number(mae.toFixed(4)),
        rmse: Number(rmse.toFixed(4)),
        accuracy: Number(accuracy.toFixed(1)),
        precision: Number((precision * 100).toFixed(1)),
        recall: Number((recall * 100).toFixed(1)),
        f1: Number((f1 * 100).toFixed(1))
      });

      // Residual distribution
      const bins = [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1];
      const hist = bins.slice(0, -1).map((binStart, i) => {
        const binEnd = bins[i + 1];
        const count = residuals.filter(r => r >= binStart && r < binEnd).length;
        return { range: `${binStart.toFixed(2)}`, count };
      });
      residualDist.push({ step: s + 1, distribution: hist });

      // Tree contribution (simulated)
      const avgContribution = absResiduals.reduce((a, b) => a + b, 0) / absResiduals.length;
      treeContributions.push({ 
        step: s + 1, 
        contribution: Number((avgContribution * learningRate).toFixed(4)) 
      });

      current = current.map((p) => ({ ...p, residual: p.target - p.pred }));
      seq.push(current.map((p) => ({ ...p })));

      // Update predictions
      current = current.map((p) => {
        const res = p.target - p.pred;
        const decay = Math.pow(0.8, s);
        const correction = learningRate * res * decay;
        const jitter = (Math.random() - 0.5) * 0.005;
        const newPred = Math.min(0.99, Math.max(0.01, p.pred + correction + jitter));
        return { ...p, pred: newPred };
      });
    }

    return { series: seq, losses, residualDist, treeContributions };
  }, [basePoints, learningRate]);

  useEffect(() => {
    if (!playing) return;
    let idx = step;
    const id = setInterval(() => {
      idx = idx + 1;
      if (idx >= states.series.length) {
        idx = 0;
        if (!autoRotate) {
          setPlaying(false);
          clearInterval(id);
          return;
        }
      }
      setStep(idx);
    }, speed);
    return () => clearInterval(id);
  }, [playing, states.series.length, speed, autoRotate, step]);

  const reset = () => {
    setStep(0);
    setPlaying(false);
  };

  const currentPoints = states.series[step] || [];
  const prevPoints = step > 0 ? states.series[step - 1] : currentPoints;
  
  const displayCurrent = currentPoints.map((p, i) => {
    const prev = prevPoints.find(pp => pp.id === p.id) || p;
    return {
      ...p,
      correct: (p.pred >= 0.5 ? 1 : 0) === p.target,
      predChange: p.pred - prev.pred,
      absResidual: Math.abs(p.residual || 0)
    };
  });

  const metrics = states.losses[step] || {};
  const prevMetrics = step > 0 ? states.losses[step - 1] : null;

  // Story text based on step
  const getStoryText = (s: number) => {
    const stories = [
      "Base Model: We start with a simple initial prediction. Notice how many points are misclassified (red). The model is naive and makes large errors.",
      "First Boost: The first weak learner identifies the biggest errors and corrects them. Watch as arrows show prediction adjustments.",
      "Building Momentum: Each new tree focuses on the remaining mistakes. The model is learning patterns it initially missed.",
      "Pattern Recognition: Notice how corrections become more refined. The model is discovering subtle decision boundaries.",
      "Fine-Tuning: Errors are shrinking! The learning rate ensures we don't overcorrect and maintain stability.",
      "Convergence: Most predictions are now accurate. The residuals (errors) are becoming very small.",
      "Near Optimal: The ensemble has learned complex patterns. Watch the decision boundary sharpen.",
      "Final Model: Maximum accuracy achieved! The residual distribution shows most errors near zero."
    ];
    return stories[Math.min(s, stories.length - 1)];
  };

  const CustomPointShape = (props: any) => {
    const { cx, cy, payload } = props;
    const isHighlighted = highlightedPoint === payload.id;
    const color = payload.correct ? "#10B981" : "#EF4444";
    const r = isHighlighted ? 8 : (payload.correct ? 5 : 6);
    const strokeWidth = isHighlighted ? 3 : 1;
    
    const residualSize = Math.abs(payload.absResidual || 0);
    const glowRadius = isHighlighted ? 20 : (residualSize * 15);

    return (
      <g>
        {showResiduals && residualSize > 0.1 && (
          <circle 
            cx={cx} 
            cy={cy} 
            r={glowRadius} 
            fill={color} 
            opacity={0.1}
            className="animate-pulse"
          />
        )}
        <circle 
          cx={cx} 
          cy={cy} 
          r={r} 
          fill={color} 
          stroke={isHighlighted ? "#FCD34D" : "#1F2937"}
          strokeWidth={strokeWidth}
          opacity={0.9}
          style={{ cursor: 'pointer', transition: 'all 0.3s' }}
        />
        {Math.abs(payload.predChange || 0) > 0.01 && (
          <line
            x1={cx}
            y1={cy + 15}
            x2={cx}
            y2={cy + 5}
            stroke={color}
            strokeWidth={2}
            markerEnd="url(#arrowhead)"
            opacity={0.7}
          />
        )}
      </g>
    );
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-3">
            Gradient Boosting Journey
          </h1>
          <p className="text-gray-400 text-lg max-w-3xl mx-auto">
            Watch how sequential weak learners combine to create a powerful ensemble model
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Panel - Controls & Metrics */}
          <div className="lg:col-span-4 space-y-4">
            {/* Story Card */}
            <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 backdrop-blur-sm border border-indigo-500/30 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-start gap-3 mb-4">
                <div className="text-4xl">{step === 0 ? '🌱' : step < 3 ? '🌿' : step < 5 ? '🌳' : '✨'}</div>
                <div>
                  <h3 className="text-xl font-bold text-cyan-300">Step {step + 1} of {MAX_STEPS}</h3>
                  <p className="text-sm text-gray-400 mt-1">{getStoryText(step)}</p>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="absolute h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${((step + 1) / MAX_STEPS) * 100}%` }}
                />
              </div>
            </div>

            {/* Playback Controls */}
            <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-5 shadow-xl">
              <h4 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                <span></span> Playback Controls
              </h4>
              
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  onClick={() => setStep(s => Math.max(0, s - 1))}
                  disabled={step === 0}
                  className="px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg text-white font-medium disabled:opacity-40 hover:from-gray-600 hover:to-gray-700 transition-all"
                >
                  ⬅ Prev
                </button>
                <button
                  onClick={() => setStep(s => Math.min(states.series.length - 1, s + 1))}
                  disabled={step >= states.series.length - 1}
                  className="px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg text-white font-medium disabled:opacity-40 hover:from-gray-600 hover:to-gray-700 transition-all"
                >
                  Next ➡
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  onClick={() => setPlaying(p => !p)}
                  className={`px-4 py-3 rounded-lg text-white font-medium transition-all ${
                    playing 
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400' 
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500'
                  }`}
                >
                  {playing ? '⏸ Pause' : '▶ Play'}
                </button>
                <button
                  onClick={reset}
                  className="px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg text-white font-medium hover:from-blue-500 hover:to-cyan-500 transition-all"
                >
                   Reset
                </button>
              </div>

              {/* Speed Control */}
              <div className="mb-4">
                <label className="text-xs text-gray-400 mb-2 block">Animation Speed</label>
                <input
                  type="range"
                  min={400}
                  max={2000}
                  step={100}
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Fast</span>
                  <span>{(speed / 1000).toFixed(1)}s</span>
                  <span>Slow</span>
                </div>
              </div>

              {/* Learning Rate */}
              <div className="mb-4">
                <label className="text-xs text-gray-400 mb-2 block">Learning Rate (η)</label>
                <input
                  type="range"
                  min={0.1}
                  max={0.9}
                  step={0.1}
                  value={learningRate}
                  onChange={(e) => {
                    setLearningRate(Number(e.target.value));
                    setStep(0);
                  }}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="text-center text-sm text-cyan-400 font-mono mt-1">{learningRate.toFixed(1)}</div>
              </div>

              {/* Toggle Controls */}
              <div className="space-y-2 pt-3 border-t border-gray-700">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={showResiduals}
                    onChange={(e) => setShowResiduals(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-300 group-hover:text-cyan-400 transition-colors">Show Residual Halos</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={autoRotate}
                    onChange={(e) => setAutoRotate(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-300 group-hover:text-cyan-400 transition-colors">Auto-Loop Animation</span>
                </label>
              </div>
            </div>

            {/* Metrics Card */}
            <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-5 shadow-xl">
              <h4 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                <span></span> Performance Metrics
              </h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-lg p-3 border border-green-500/20">
                  <div className="text-xs text-gray-400 mb-1">Accuracy</div>
                  <div className="text-2xl font-bold text-green-400">{metrics.accuracy}%</div>
                  {prevMetrics && (
                    <div className="text-xs text-green-300 mt-1">
                      +{(metrics.accuracy - prevMetrics.accuracy).toFixed(1)}%
                    </div>
                  )}
                </div>
                
                <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-lg p-3 border border-blue-500/20">
                  <div className="text-xs text-gray-400 mb-1">MAE Loss</div>
                  <div className="text-2xl font-bold text-blue-400">{metrics.mae}</div>
                  {prevMetrics && (
                    <div className="text-xs text-blue-300 mt-1">
                      {(metrics.mae - prevMetrics.mae).toFixed(4)}
                    </div>
                  )}
                </div>

                <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-lg p-3 border border-purple-500/20">
                  <div className="text-xs text-gray-400 mb-1">Precision</div>
                  <div className="text-xl font-bold text-purple-400">{metrics.precision}%</div>
                </div>

                <div className="bg-gradient-to-br from-orange-900/30 to-yellow-900/30 rounded-lg p-3 border border-orange-500/20">
                  <div className="text-xs text-gray-400 mb-1">Recall</div>
                  <div className="text-xl font-bold text-orange-400">{metrics.recall}%</div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-700">
                <div className="text-xs text-gray-400">F1 Score</div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
                      style={{ width: `${metrics.f1}%` }}
                    />
                  </div>
                  <span className="text-sm font-mono text-cyan-400">{metrics.f1}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Visualizations */}
          <div className="lg:col-span-8 space-y-4">
            {/* Main Scatter Plot */}
            <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-xl">
              <h4 className="text-lg font-semibold text-gray-200 mb-4">Feature Space Visualization</h4>
              <ResponsiveContainer width="100%" height={450}>
                {/* increased bottom margin so legend and axis labels don't overlap */}
                <ScatterChart margin={{ top: 20, right: 30, bottom: 140, left: 40 }}>
                  <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                      <polygon points="0 0, 10 3, 0 6" fill="#10B981" />
                    </marker>
                  </defs>
                  <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="x"
                    name="Age"
                    stroke="#9ca3af"
                    type="number"
                    domain={axisDomains.x}
                    // place label below the chart to avoid overlapping the legend
                    label={{ value: 'Age', position: 'bottom', offset: 36, fill: '#9ca3af' }}
                    // ensure tick labels are high-contrast and readable on dark background
                    tick={{ fill: '#e6eef8', fontSize: 12 }}
                  />
                  <YAxis
                    dataKey="y"
                    name="Balance"
                    stroke="#9ca3af"
                    type="number"
                    domain={axisDomains.y}
                    label={{ value: 'Balance', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
                    tick={{ fill: '#e6eef8', fontSize: 12 }}
                  />
                  <Tooltip
                    content={({ payload }) => {
                      if (!payload || !payload[0]) return null;
                      const p = payload[0].payload;
                      return (
                        <div style={{ background: '#0f1724', border: '1px solid #263244', padding: 12, borderRadius: 8, minWidth: 140 }}>
                          <div style={{ color: '#06b6d4', fontWeight: 700, marginBottom: 6 }}>Point #{p.id}</div>
                          <div style={{ color: '#e6eef8', fontSize: 13 }}>Age: <span style={{ color: '#ffffff', fontWeight: 600 }}>{p.x.toFixed(0)}</span></div>
                          <div style={{ color: '#e6eef8', fontSize: 13 }}>Balance: <span style={{ color: '#ffffff', fontWeight: 600 }}>${p.y.toFixed(0)}</span></div>
                          <div style={{ color: '#e6eef8', fontSize: 13 }}>Prediction: <span style={{ color: '#ffffff', fontWeight: 600 }}>{(p.pred * 100).toFixed(1)}%</span></div>
                          <div style={{ color: '#e6eef8', fontSize: 13 }}>Target: <span style={{ color: '#ffffff', fontWeight: 600 }}>{p.target}</span></div>
                          <div style={{ color: p.residual > 0 ? '#fb7185' : '#34d399', marginTop: 6, fontWeight: 600 }}>{p.residual?.toFixed(3)}</div>
                        </div>
                      );
                    }}
                  />
                  {/* place legend at the bottom and ensure it sits below the axis label area */}
                  <Legend verticalAlign="bottom" align="center" iconSize={12} wrapperStyle={{ marginTop: 8, paddingTop: 6 }} />
                  
                  <Scatter
                    name="Correct Predictions"
                    data={displayCurrent.filter(p => p.correct)}
                    fill="#10B981"
                    shape={(props) => <CustomPointShape {...props} />}
                    onClick={(data) => setHighlightedPoint(data.id)}
                  />
                  <Scatter
                    name="Incorrect Predictions"
                    data={displayCurrent.filter(p => !p.correct)}
                    fill="#EF4444"
                    shape={(props) => <CustomPointShape {...props} />}
                    onClick={(data) => setHighlightedPoint(data.id)}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* Bottom Charts Row */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Loss Evolution */}
              <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-5 shadow-xl">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Loss Evolution (MAE & RMSE)</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={states.losses.slice(0, step + 1)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="step" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" domain={[0, 'auto']} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="mae" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} name="MAE" />
                    <Line type="monotone" dataKey="rmse" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4 }} name="RMSE" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Residual Distribution */}
              <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-5 shadow-xl">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Residual Distribution</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={states.residualDist[step]?.distribution || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="range" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem' }}
                    />
                    <Bar dataKey="count" fill="url(#colorGradient)" />
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#EC4899" stopOpacity={0.3}/>
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Mathematical Formula Section */}
        <div className="mt-6 bg-gradient-to-r from-indigo-900/30 to-purple-900/30 backdrop-blur-sm border border-indigo-500/30 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-cyan-300 mb-4"> The Mathematics Behind Gradient Boosting</h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-300">
            <div>
              <h4 className="font-semibold text-purple-400 mb-2">Core Algorithm:</h4>
              <div className="bg-gray-900/50 rounded-lg p-4 font-mono text-xs space-y-2">
                <div>F₀(x) = argmin<sub>γ</sub> Σ L(yᵢ, γ)</div>
                <div className="text-cyan-400">For m = 1 to M:</div>
                <div className="pl-4">
                  <div>• Compute residuals: rᵢₘ = -∂L(yᵢ, F(xᵢ))/∂F(xᵢ)</div>
                  <div>• Fit weak learner hₘ(x) to residuals</div>
                  <div>• Update: Fₘ(x) = Fₘ₋₁(x) + η·hₘ(x)</div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-purple-400 mb-2">Current Step Values:</h4>
              <div className="bg-gray-900/50 rounded-lg p-4 space-y-2 text-xs">
                <div>Learning Rate (η): <span className="text-cyan-400 font-bold">{learningRate.toFixed(2)}</span></div>
                <div>Iteration (m): <span className="text-cyan-400 font-bold">{step + 1}</span></div>
                <div>Loss Function: <span className="text-cyan-400">Mean Absolute Error</span></div>
                <div>Current MAE: <span className="text-green-400 font-bold">{metrics.mae || 'N/A'}</span></div>
                <div className="pt-2 border-t border-gray-700">
                  <div className="text-gray-400">Ensemble Prediction:</div>
                  <div className="text-cyan-400">F(x) = F₀(x) + Σ η·hₘ(x)</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-xs text-gray-400 bg-gray-900/30 rounded-lg p-4">
            <strong className="text-cyan-400">Key Insight:</strong> Each boosting iteration fits a new model to the 
            <strong className="text-purple-400"> pseudo-residuals</strong> (negative gradients), 
            gradually reducing prediction errors. The learning rate η controls how much each new tree contributes, 
            preventing overfitting and ensuring smooth convergence.
          </div>
        </div>
      </div>
    </main>
  );
}