"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const MAX_STEPS = 5;

type Point = {
  id: number;
  x: number;
  y: number;
  trueLabel: number;
  weight?: number;
  predicted?: number;
};

// Sample data for demo
const generateSampleData = () => {
  const data = [];
  for (let i = 0; i < 80; i++) {
    const x = Math.random() * 100;
    // ensure balance is non-negative (real-world balance can't be negative for our demo)
    const rawY = Math.random() * 100 + (x > 50 ? 20 : -20);
    const y = Math.max(0, rawY);
    const label = x > 50 ? 1 : 0;
    const noise = Math.random() > 0.85;
    data.push({ age: x, balance: y, subscribed: noise ? 1 - label : label });
  }
  return data;
};

export default function AdaBoostPage() {
  const data = useMemo(() => generateSampleData(), []);
  const [step, setStep] = useState<number>(0);
  const [playing, setPlaying] = useState(false);
  const [prevCount, setPrevCount] = useState<number>(1);
  const [prevOpacity, setPrevOpacity] = useState<number>(0.35);
  const [prevRadius, setPrevRadius] = useState<number>(4);
  const [showStory, setShowStory] = useState(true);

  const { xKey, yKey, labelKey } = useMemo(() => {
    return { xKey: "age", yKey: "balance", labelKey: "subscribed" };
  }, []);

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
        weight: 1
      } as Point;
    });
  }, [data, xKey, yKey, labelKey]);

  const medianX = useMemo(() => {
    if (!points.length) return 0;
    const xs = points.map((p) => p.x).sort((a, b) => a - b);
    return xs[Math.floor(xs.length / 2)];
  }, [points]);

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
    // Clamp lower bounds to 0 so axes don't display negative ticks for features like age/balance
    const xLower = Math.max(0, Math.floor(xMin - xPad));
    const yLower = Math.max(0, Math.floor(yMin - yPad));
    const xUpper = Math.ceil(xMax + xPad);
    const yUpper = Math.ceil(yMax + yPad);
    return { x: [xLower, xUpper], y: [yLower, yUpper] };
  }, [points]);

  const hardPoints = useMemo(() => {
    return points.filter((p) => {
      const predicted = p.x >= medianX ? 1 : 0;
      return predicted !== p.trueLabel;
    });
  }, [points, medianX]);

  const states = useMemo(() => {
    const base = points.map((p) => ({ ...p }));
    if (!base.length) return [];
    const seq: Point[][] = [];
    // initialize predicted label based on the simple vertical boundary (medianX)
    const s0 = base.map((p) => ({
      ...p,
      weight: hardPoints.find((h) => h.id === p.id) ? 2.4 : 1,
      predicted: p.x >= medianX ? 1 : 0
    }));
    seq.push(s0);
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
        const idx = prev.findIndex((pp) => pp.id === hp.id);
        if (idx >= 0) {
          // simulate that the learner corrected this hard example at this step
          prev[idx].weight = 0.9;
          prev[idx].predicted = prev[idx].trueLabel; // now predicted correctly
          fixed.add(hp.id);
        }
      });
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
    }, 1200);
    return () => clearInterval(id);
  }, [playing, step]);

  // keep prevCount in a valid range whenever states change
  useEffect(() => {
    const maxPrev = Math.max(0, (states?.length ?? 0) - 1);
    if (prevCount > maxPrev) setPrevCount(maxPrev);
  }, [states, prevCount]);

  const reset = () => {
    setStep(0);
    setPlaying(false);
  };

  const displayData = (arr: Point[]) => {
    return arr.map((p) => ({
      x: Number(p.x) || 0,
      y: Number(p.y) || 0,
      trueLabel: Number(p.trueLabel) || 0,
      predicted: typeof p.predicted === 'number' ? Number(p.predicted) : (p.x >= medianX ? 1 : 0),
      correct: (typeof p.predicted === 'number' ? Number(p.predicted) : (p.x >= medianX ? 1 : 0)) === Number(p.trueLabel),
      r: Math.max(4, Math.round((p.weight ?? 1) * 4))
    }));
  };

  const storyContent = [
    {
      title: "The First Attempt",
      story: "Meet our first weak learner - a simple classifier that draws a vertical line. Like a student's first try at a difficult problem, it gets some answers right but makes several mistakes. Notice the larger points? Those are the ones our classifier got wrong.",
      emoji: "",
      color: "from-red-500/20 to-orange-500/20"
    },
    {
      title: "Learning from Mistakes",
      story: "AdaBoost is like a wise teacher who says, 'Let's focus more on what we got wrong.' The misclassified points grow larger - they're crying out for attention! Our next learner will pay special attention to these challenging cases.",
      emoji: "",
      color: "from-orange-500/20 to-yellow-500/20"
    },
    {
      title: "Getting Stronger",
      story: "Progress! Our ensemble is learning. Some of those difficult points are getting smaller - we're correctly classifying them now. But there are still a few stubborn cases that need more work. The algorithm adapts, giving even more weight to the remaining mistakes.",
      emoji: "",
      color: "from-yellow-500/20 to-green-500/20"
    },
    {
      title: "Refinement",
      story: "We're really getting the hang of this! Most of the previously misclassified points have shrunk back to normal size. Each new weak learner in our ensemble focuses on the remaining edge cases, like an artist adding fine details to a painting.",
      emoji: "",
      color: "from-green-500/20 to-cyan-500/20"
    },
    {
      title: "Ensemble Mastery",
      story: "Victory! By combining multiple weak learners, each focusing on different mistakes, we've created a powerful ensemble classifier. Nearly all points are correctly classified. This is the magic of AdaBoost - turning many weak learners into one strong predictor!",
      emoji: "",
      color: "from-cyan-500/20 to-blue-500/20"
    }
  ];

  const currentStory = storyContent[step];
  // compute error count from the state's predicted labels
  const errorCount = states[step]?.filter(p => {
    const predicted = typeof p.predicted === 'number' ? p.predicted : (p.x >= medianX ? 1 : 0);
    return predicted !== p.trueLabel;
  }).length || 0;

  const accuracy = ((points.length - errorCount) / points.length * 100).toFixed(1);

  const currentState = states[step] ?? [];
  const hasPositive = currentState.some((p) => Number(p.trueLabel) === 1);
  const hasNegative = currentState.some((p) => Number(p.trueLabel) === 0);
  const hasHighWeight = currentState.some((p) => (p.weight ?? 1) > 1.5);
  const hasNormalWeight = currentState.some((p) => (p.weight ?? 1) <= 1.5);

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-gray-100">
      <nav className="bg-black/30 backdrop-blur-lg border-b border-purple-500/20 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            AdaBoost Journey
          </h1>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-gray-300 hover:text-white">Intro</Link>
            <Link href="/gradientboost" className="text-sm text-gray-300 hover:text-white">GradientBoost</Link>
            <Link href="/xgboost" className="text-sm text-gray-300 hover:text-white">XGBoost</Link>
            <Link href="/summary" className="text-sm text-gray-300 hover:text-white">Summary</Link>
          </div>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto p-6 flex-grow w-full">
        <div className="mb-8 text-center">
          <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            The Art of Learning from Mistakes
          </h2>
          <p className="text-gray-400 text-lg max-w-3xl mx-auto">
            Watch as AdaBoost transforms weak learners into a powerful ensemble, one mistake at a time
          </p>
        </div>

        {/* Story Card */}
        {showStory && (
          <div className={`mb-6 relative overflow-hidden rounded-2xl bg-gradient-to-br ${currentStory.color} backdrop-blur-lg border border-white/10 shadow-2xl transition-all duration-500`}>
            <div className="absolute inset-0 bg-gradient-to-br from-black/40 to-transparent"></div>
            <div className="relative p-6">
              <div className="flex items-start gap-4">
                <div className="text-5xl animate-bounce">{currentStory.emoji}</div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2 text-white">{currentStory.title}</h3>
                  <p className="text-gray-200 text-lg leading-relaxed">{currentStory.story}</p>
                </div>
                <button 
                  onClick={() => setShowStory(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}

        {!showStory && (
          <button 
            onClick={() => setShowStory(true)}
            className="mb-4 px-4 py-2 bg-purple-600/30 hover:bg-purple-600/50 rounded-lg border border-purple-500/30 transition-all"
          >
            Show Story
          </button>
        )}

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Controls Panel */}
          <div className="lg:col-span-1 space-y-4">
            {/* Progress Indicator */}
            <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-purple-500/20">
              <div className="text-center mb-4">
                <div className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  {step + 1}/{MAX_STEPS}
                </div>
                <div className="text-gray-400 text-sm mt-1">Learning Step</div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Accuracy</span>
                  <span className="text-green-400 font-bold">{accuracy}%</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-400 to-cyan-400 transition-all duration-500"
                    style={{ width: `${accuracy}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between text-sm pt-2">
                  <span className="text-gray-400">Errors</span>
                  <span className="text-red-400 font-bold">{errorCount}</span>
                </div>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-purple-500/20">
              <h3 className="text-lg font-semibold mb-4 text-purple-300">Controls</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setStep((s) => Math.max(0, s - 1))}
                    disabled={step === 0}
                    className="px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 disabled:from-gray-700 disabled:to-gray-700 rounded-xl text-white font-medium transition-all shadow-lg disabled:cursor-not-allowed"
                  >
                    ⬅ Prev
                  </button>
                  <button 
                    onClick={() => setStep((s) => Math.min(MAX_STEPS - 1, s + 1))}
                    disabled={step === MAX_STEPS - 1}
                    className="px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 disabled:from-gray-700 disabled:to-gray-700 rounded-xl text-white font-medium transition-all shadow-lg disabled:cursor-not-allowed"
                  >
                    Next ➡
                  </button>
                </div>
                
                <button 
                  onClick={() => setPlaying(!playing)}
                  className="w-full px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl text-white font-medium transition-all shadow-lg"
                >
                  {playing ? "⏸ Pause" : "▶ Play"}
                </button>
                
                <button 
                  onClick={reset}
                  className="w-full px-4 py-3 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 rounded-xl text-white font-medium transition-all shadow-lg"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Legend */}
            <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-purple-500/20">
              <h3 className="text-lg font-semibold mb-4 text-purple-300">Legend</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  {/* Correct prediction - green filled circle */}
                  <div className="w-6 h-6 rounded-full bg-emerald-400 shadow-sm border-2 border-white/10" aria-hidden="true"></div>
                  <span className="text-gray-300">Correct Prediction</span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Incorrect prediction - red filled circle */}
                  <div className="w-6 h-6 rounded-full bg-red-500 shadow-sm border-2 border-white/10" aria-hidden="true"></div>
                  <span className="text-gray-300">Incorrect Prediction</span>
                </div>

                <div className="flex items-center gap-3">
                  {/* High weight focus - yellow ring to match large-point stroke */}
                  <div className="flex items-center justify-center w-8 h-8 rounded-full border-4 border-amber-400 animate-pulse" aria-hidden="true">
                    <div className="w-3 h-3 rounded-full bg-amber-300" />
                  </div>
                  <span className="text-gray-300">High Weight (Focus)</span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Normal weight - small muted circle */}
                  <div className="w-4 h-4 rounded-full bg-gray-500 shadow-sm" aria-hidden="true"></div>
                  <span className="text-gray-300">Normal Weight</span>
                </div>
              </div>
            </div>
          </div>

          {/* Visualization */}
          <div className="lg:col-span-3 bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-500/20 p-6">
            <div className="mb-4 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold text-purple-300">Decision Space</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Features: <span className="text-cyan-400">{xKey}</span> vs <span className="text-cyan-400">{yKey}</span>
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Decision Boundary</div>
                <div className="text-purple-400 font-mono">x = {medianX.toFixed(2)}</div>
              </div>
            </div>

            <div style={{ width: "100%", height: 520 }} className="bg-black/20 rounded-xl p-4">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 24, bottom: 48, left: 24 }}>
                  <defs>
                    <linearGradient id="gridGradient" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.1" />
                      <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.1" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#374151" strokeDasharray="3 3" vertical={true} horizontal={true} />
                  
                  <ReferenceLine 
                    x={medianX} 
                    stroke="#8B5CF6" 
                    strokeWidth={2} 
                    strokeDasharray="5 5"
                    label={{ value: "Decision Boundary", fill: "#A78BFA", fontSize: 12 }}
                  />
                  
                  <XAxis
                    dataKey="x"
                    name={xKey}
                    stroke="#9ca3af"
                    type="number"
                    domain={axisDomains.x}
                    tickFormatter={(v: any) => Number(v).toFixed(0)}
                    // place label below the axis and add space so it isn't clipped
                    label={{ value: xKey, position: "bottom", offset: 16, fill: "#06B6D4", fontWeight: "bold" }}
                  />
                  <YAxis
                    dataKey="y"
                    name={yKey}
                    stroke="#9ca3af"
                    type="number"
                    domain={axisDomains.y}
                    tickFormatter={(v: any) => Number(v).toFixed(0)}
                    label={{ value: yKey, angle: -90, position: "insideLeft", offset: 12, fill: "#06B6D4", fontWeight: "bold" }}
                  />
                  {/* Custom tooltip to show x, y, label and radius (weight) */}
                  {/** Tooltip content component */}
                  {/** Recharts passes payload as an array; we handle it safely */}
                  <Tooltip
                    content={({ active, payload, label }: any) => {
                      if (!active || !payload || !payload.length) return null;
                      const point = payload[0].payload || {};
                      return (
                        <div style={{ background: '#1f2937', color: '#fff', padding: 8, borderRadius: 8, border: '1px solid #8B5CF6' }}>
                          <div style={{ fontWeight: 700, marginBottom: 4 }}>{xKey}: {Number(point.x).toFixed(2)}</div>
                          <div>{yKey}: {Number(point.y).toFixed(2)}</div>
                          <div>True: {point.trueLabel}</div>
                          <div>Predicted: {point.predicted ?? (point.x >= medianX ? (1) : (0))}</div>
                          <div>Status: {point.correct ? '✓ Correct' : '✗ Incorrect'}</div>
                          {point.r != null && <div>Size: {point.r}</div>}
                        </div>
                      );
                    }}
                  />

                  {states.map((s, si) => {
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
                          if (cx == null || cy == null) return null;
                          return <circle cx={cx} cy={cy} r={prevRadius} fill="#9CA3AF" opacity={prevOpacity} stroke="#6B7280" strokeWidth={0.6} />;
                        }}
                      />
                    );
                  })}

                  <Scatter
                    name="points"
                    data={displayData(states[step] ?? [])}
                    fill="#8884d8"
                    shape={(props: any) => {
                      const { cx, cy, payload } = props;
                      if (cx == null || cy == null) return null;
                      const color = payload.correct ? "#10B981" : "#EF4444";
                      const r = payload.r ?? 6;
                      const isLarge = r > 8;
                      return (
                        <g>
                          {isLarge && (
                            // static halo for high-weight points (removed pulsing animation)
                            <circle 
                              cx={cx} 
                              cy={cy} 
                              r={r + 4} 
                              fill={color} 
                              opacity={0.18}
                            />
                          )}
                          <circle 
                            cx={cx} 
                            cy={cy} 
                            r={r} 
                            fill={color} 
                            opacity={0.9}
                            stroke={isLarge ? "#FCD34D" : "#fff"}
                            strokeWidth={isLarge ? 2 : 1}
                          />
                        </g>
                      );
                    }}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* History Controls */}
            <div className="mt-6 p-4 bg-black/30 rounded-xl border border-purple-500/20">
              <h4 className="text-sm font-semibold text-purple-300 mb-3">Previous Steps Visualization</h4>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-gray-400 mb-2 block">Steps to Show: {prevCount}</label>
                  <input 
                    type="range" 
                    min={0} 
                    max={Math.max(0, states.length - 1)} 
                    value={prevCount} 
                    onChange={(e) => setPrevCount(Number(e.target.value))} 
                    className="w-full accent-purple-500"
                  />
                </div>
                
                <div>
                  <label className="text-xs text-gray-400 mb-2 block">Opacity: {prevOpacity.toFixed(2)}</label>
                  <input 
                    type="range" 
                    min={0.05} 
                    max={0.8} 
                    step={0.05} 
                    value={prevOpacity} 
                    onChange={(e) => setPrevOpacity(Number(e.target.value))} 
                    className="w-full accent-purple-500"
                  />
                </div>
                
                <div>
                  <label className="text-xs text-gray-400 mb-2 block">Size: {prevRadius}</label>
                  <input 
                    type="range" 
                    min={2} 
                    max={10} 
                    step={1} 
                    value={prevRadius} 
                    onChange={(e) => setPrevRadius(Number(e.target.value))} 
                    className="w-full accent-purple-500"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-gradient-to-r from-purple-900/30 to-cyan-900/30 rounded-xl border border-purple-500/20">
              <p className="text-sm text-gray-300">
                <strong className="text-cyan-400">Key Insight:</strong> Point size represents sample weight. 
                Larger points indicate AdaBoost is focusing more attention on those difficult-to-classify samples. 
                Watch as the algorithm progressively learns from its mistakes!
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-black/30 backdrop-blur-lg border-t border-purple-500/20 px-6 py-4 text-center text-gray-400 text-sm">
        <p>AdaBoost: Adaptive Boosting - Where weak learners become strong together</p>
      </footer>
    </main>
  );
}