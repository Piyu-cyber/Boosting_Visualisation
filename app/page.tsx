"use client";

import React, { useState, useEffect } from "react";
import { Users, Target, TrendingUp, Zap, BarChart3, Cpu, Database, Building2, Cog } from "lucide-react";

// Mock components - replace with your actual imports
const Navbar = () => (
  <nav className="bg-white shadow-md px-6 py-4">
    <h1 className="text-2xl font-bold text-gray-800">Boosting Academy</h1>
  </nav>
);

const Footer = () => (
  <footer className="bg-white mt-16 py-6 text-center text-gray-600 border-t">
    <p>Learn Machine Learning Visually | Boosting Academy 2024</p>
  </footer>
);

const DatasetSelector = () => {
  const [selectedDataset, setSelectedDataset] = useState("banking");
  const [showPreview, setShowPreview] = useState(false);

  const bankingData = [
    { "age": 24, "balance": 300, "duration": 120, "subscribed": 0 },
    { "age": 28, "balance": 520, "duration": 160, "subscribed": 0 },
    { "age": 32, "balance": 700, "duration": 150, "subscribed": 0 },
    { "age": 35, "balance": 900, "duration": 165, "subscribed": 0 },
    { "age": 38, "balance": 800, "duration": 180, "subscribed": 0 },
    { "age": 30, "balance": 650, "duration": 195, "subscribed": 0 },
    { "age": 33, "balance": 950, "duration": 200, "subscribed": 0 },
    { "age": 34, "balance": 700, "duration": 210, "subscribed": 0 },
    { "age": 29, "balance": 1200, "duration": 170, "subscribed": 0 },
    { "age": 27, "balance": 1400, "duration": 205, "subscribed": 1 },
    { "age": 40, "balance": 1150, "duration": 180, "subscribed": 0 },
    { "age": 42, "balance": 1500, "duration": 200, "subscribed": 1 },
    { "age": 45, "balance": 900, "duration": 150, "subscribed": 0 },
    { "age": 46, "balance": 1200, "duration": 160, "subscribed": 1 },
    { "age": 47, "balance": 700, "duration": 185, "subscribed": 0 },
    { "age": 48, "balance": 1300, "duration": 210, "subscribed": 1 },
    { "age": 50, "balance": 650, "duration": 170, "subscribed": 1 },
    { "age": 52, "balance": 780, "duration": 160, "subscribed": 1 },
    { "age": 55, "balance": 1800, "duration": 220, "subscribed": 1 },
    { "age": 58, "balance": 500, "duration": 200, "subscribed": 1 },
    { "age": 60, "balance": 900, "duration": 150, "subscribed": 0 },
    { "age": 44, "balance": 1700, "duration": 210, "subscribed": 1 },
    { "age": 43, "balance": 700, "duration": 195, "subscribed": 0 },
    { "age": 37, "balance": 1200, "duration": 140, "subscribed": 0 },
    { "age": 36, "balance": 800, "duration": 200, "subscribed": 1 },
    { "age": 31, "balance": 700, "duration": 210, "subscribed": 0 },
    { "age": 39, "balance": 940, "duration": 210, "subscribed": 0 },
    { "age": 22, "balance": 1300, "duration": 195, "subscribed": 1 },
    { "age": 26, "balance": 1150, "duration": 130, "subscribed": 0 },
    { "age": 41, "balance": 1120, "duration": 200, "subscribed": 1 },
    { "age": 49, "balance": 1500, "duration": 175, "subscribed": 1 },
    { "age": 53, "balance": 700, "duration": 180, "subscribed": 1 },
    { "age": 51, "balance": 900, "duration": 195, "subscribed": 1 },
    { "age": 55, "balance": 850, "duration": 185, "subscribed": 1 },
    { "age": 28, "balance": 600, "duration": 220, "subscribed": 0 },
    { "age": 47, "balance": 500, "duration": 205, "subscribed": 1 },
    { "age": 32, "balance": 1000, "duration": 200, "subscribed": 0 },
    { "age": 33, "balance": 660, "duration": 100, "subscribed": 0 },
    { "age": 45, "balance": 1050, "duration": 195, "subscribed": 1 },
    { "age": 40, "balance": 1300, "duration": 210, "subscribed": 1 },
    { "age": 24, "balance": 1500, "duration": 180, "subscribed": 1 },
    { "age": 58, "balance": 760, "duration": 190, "subscribed": 1 },
    { "age": 54, "balance": 500, "duration": 175, "subscribed": 1 },
    { "age": 52, "balance": 1400, "duration": 150, "subscribed": 1 },
    { "age": 29, "balance": 1120, "duration": 195, "subscribed": 1 },
    { "age": 35, "balance": 920, "duration": 210, "subscribed": 0 },
    { "age": 31, "balance": 800, "duration": 190, "subscribed": 0 },
    { "age": 48, "balance": 1100, "duration": 160, "subscribed": 1 },
    { "age": 27, "balance": 400, "duration": 210, "subscribed": 0 },
    { "age": 50, "balance": 1200, "duration": 220, "subscribed": 1 }
  ];

  const automationData = [
    { "temperature": 80, "pressure": 20, "failure": 0 },
    { "temperature": 85, "pressure": 25, "failure": 0 },
    { "temperature": 78, "pressure": 18, "failure": 0 },
    { "temperature": 88, "pressure": 28, "failure": 0 },
    { "temperature": 90, "pressure": 22, "failure": 0 },
    { "temperature": 84, "pressure": 19, "failure": 0 },
    { "temperature": 82, "pressure": 24, "failure": 0 },
    { "temperature": 89, "pressure": 27, "failure": 0 },
    { "temperature": 86, "pressure": 21, "failure": 0 },
    { "temperature": 92, "pressure": 29, "failure": 0 },
    { "temperature": 95, "pressure": 25, "failure": 1 },
    { "temperature": 97, "pressure": 28, "failure": 1 },
    { "temperature": 99, "pressure": 22, "failure": 1 },
    { "temperature": 100, "pressure": 30, "failure": 1 },
    { "temperature": 102, "pressure": 26, "failure": 1 },
    { "temperature": 105, "pressure": 27, "failure": 1 },
    { "temperature": 98, "pressure": 20, "failure": 1 },
    { "temperature": 101, "pressure": 24, "failure": 1 },
    { "temperature": 96, "pressure": 32, "failure": 1 },
    { "temperature": 103, "pressure": 33, "failure": 1 },
    { "temperature": 90, "pressure": 35, "failure": 1 },
    { "temperature": 92, "pressure": 38, "failure": 1 },
    { "temperature": 85, "pressure": 40, "failure": 1 },
    { "temperature": 88, "pressure": 36, "failure": 1 },
    { "temperature": 93, "pressure": 37, "failure": 1 },
    { "temperature": 80, "pressure": 42, "failure": 1 },
    { "temperature": 87, "pressure": 45, "failure": 1 },
    { "temperature": 91, "pressure": 39, "failure": 1 },
    { "temperature": 83, "pressure": 41, "failure": 1 },
    { "temperature": 89, "pressure": 37, "failure": 1 },
    { "temperature": 100, "pressure": 25, "failure": 1 },
    { "temperature": 104, "pressure": 22, "failure": 1 },
    { "temperature": 107, "pressure": 18, "failure": 1 },
    { "temperature": 99, "pressure": 29, "failure": 1 },
    { "temperature": 95, "pressure": 34, "failure": 0 },
    { "temperature": 88, "pressure": 36, "failure": 0 },
    { "temperature": 94, "pressure": 34, "failure": 0 },
    { "temperature": 97, "pressure": 35, "failure": 1 },
    { "temperature": 93, "pressure": 34, "failure": 0 },
    { "temperature": 85, "pressure": 33, "failure": 0 },
    { "temperature": 98, "pressure": 31, "failure": 1 },
    { "temperature": 86, "pressure": 36, "failure": 1 },
    { "temperature": 100, "pressure": 28, "failure": 1 },
    { "temperature": 82, "pressure": 38, "failure": 1 },
    { "temperature": 91, "pressure": 35, "failure": 1 },
    { "temperature": 92, "pressure": 30, "failure": 0 },
    { "temperature": 89, "pressure": 34, "failure": 0 },
    { "temperature": 96, "pressure": 27, "failure": 1 },
    { "temperature": 84, "pressure": 29, "failure": 0 },
    { "temperature": 105, "pressure": 31, "failure": 1 }
  ];

  const datasets = [
    {
      id: "banking",
      name: "Banking Dataset",
      icon: Building2,
      description: "Customer subscription prediction",
      color: "blue",
      features: ["Age", "Balance", "Duration", "Subscribed"],
      data: bankingData,
      stats: {
        total: bankingData.length,
        positive: bankingData.filter(d => d.subscribed === 1).length,
        negative: bankingData.filter(d => d.subscribed === 0).length
      }
    },
    {
      id: "automation",
      name: "Automation Dataset", 
      icon: Cog,
      description: "Manufacturing failure prediction",
      color: "orange",
      features: ["Temperature", "Pressure", "Failure"],
      data: automationData,
      stats: {
        total: automationData.length,
        positive: automationData.filter(d => d.failure === 1).length,
        negative: automationData.filter(d => d.failure === 0).length
      }
    }
  ];

  const currentDataset = datasets.find(d => d.id === selectedDataset);

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 mb-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Database className="w-8 h-8 text-gray-700" />
          <h3 className="text-2xl font-bold text-gray-800">Choose Your Dataset</h3>
        </div>
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition"
        >
          {showPreview ? "Hide Preview" : "Show Preview"}
        </button>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {datasets.map((dataset) => {
          const Icon = dataset.icon;
          const isSelected = selectedDataset === dataset.id;
          
          return (
            <div
              key={dataset.id}
              onClick={() => setSelectedDataset(dataset.id)}
              className={`cursor-pointer rounded-xl p-6 transition-all duration-300 hover:scale-105 ${
                isSelected 
                  ? `bg-${dataset.color}-50 ring-4 ring-${dataset.color}-400 shadow-xl` 
                  : 'bg-gray-50 hover:shadow-lg'
              }`}
            >
              <div className={`w-16 h-16 bg-${dataset.color}-100 rounded-full flex items-center justify-center mb-4`}>
                <Icon className={`w-8 h-8 text-${dataset.color}-600`} />
              </div>
              
              <h4 className={`text-xl font-bold mb-2 ${isSelected ? `text-${dataset.color}-700` : 'text-gray-800'}`}>
                {dataset.name}
              </h4>
              
              <p className="text-gray-600 text-sm mb-4">{dataset.description}</p>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Features:</p>
                  <div className="flex flex-wrap gap-2">
                    {dataset.features.map((feature, idx) => (
                      <span 
                        key={idx}
                        className={`text-xs px-3 py-1 rounded-full ${
                          isSelected 
                            ? `bg-${dataset.color}-100 text-${dataset.color}-700` 
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Dataset Info:</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-lg font-bold text-gray-800">{dataset.stats.total}</div>
                      <div className="text-xs text-gray-500">Total</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-600">{dataset.stats.positive}</div>
                      <div className="text-xs text-gray-500">Positive</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-red-600">{dataset.stats.negative}</div>
                      <div className="text-xs text-gray-500">Negative</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {isSelected && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-green-600 font-semibold text-sm">
                    <span className="text-xl">✓</span>
                    <span>Selected</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showPreview && currentDataset && (
        <div className="bg-gray-50 rounded-lg p-6 animate-fadeIn">
          <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Data Preview - {currentDataset.name}
          </h4>
          
          {/* Scatter plot visualization */}
          <div className="bg-white rounded-lg p-4 mb-4">
            <div className="relative h-64">
              <svg width="100%" height="100%" viewBox="0 0 400 250" className="overflow-visible">
                {/* Axes */}
                <line x1="40" y1="210" x2="380" y2="210" stroke="#ccc" strokeWidth="2" />
                <line x1="40" y1="210" x2="40" y2="30" stroke="#ccc" strokeWidth="2" />
                
                {/* Axis labels */}
                <text x="210" y="240" textAnchor="middle" className="text-xs fill-gray-600">
                  {currentDataset.id === 'banking' ? 'Age' : 'Temperature'}
                </text>
                <text x="15" y="120" textAnchor="middle" className="text-xs fill-gray-600" transform="rotate(-90 15 120)">
                  {currentDataset.id === 'banking' ? 'Balance' : 'Pressure'}
                </text>
                
                {/* Data points */}
                {currentDataset.data.slice(0, 40).map((point, idx) => {
                  const x = currentDataset.id === 'banking' 
                    ? 40 + (point.age - 20) * 7
                    : 40 + (point.temperature - 75) * 10;
                  const y = currentDataset.id === 'banking'
                    ? 210 - (point.balance / 10)
                    : 210 - (point.pressure * 4);
                  const isPositive = currentDataset.id === 'banking' ? point.subscribed : point.failure;
                  
                  return (
                    <circle
                      key={idx}
                      cx={x}
                      cy={y}
                      r="4"
                      fill={isPositive ? "#ef4444" : "#3b82f6"}
                      opacity="0.7"
                      className="hover:opacity-100 transition-opacity"
                    />
                  );
                })}
                
                {/* Legend */}
                <circle cx="300" cy="30" r="4" fill="#3b82f6" />
                <text x="310" y="34" className="text-xs fill-gray-600">Negative</text>
                <circle cx="300" cy="50" r="4" fill="#ef4444" />
                <text x="310" y="54" className="text-xs fill-gray-600">Positive</text>
              </svg>
            </div>
          </div>
          
          {/* Sample data table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  {Object.keys(currentDataset.data[0]).map((key) => (
                    <th key={key} className="text-left py-2 px-3 font-semibold text-gray-700 capitalize">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentDataset.data.slice(0, 5).map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-100">
                    {Object.values(row).map((value, vidx) => (
                      <td key={vidx} className="py-2 px-3 text-gray-600">
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Showing 5 of {currentDataset.stats.total} rows
            </p>
          </div>
        </div>
      )}
      
      <div className="mt-6 text-center text-sm text-gray-500">
        Your selected dataset will be used in all algorithm demonstrations
      </div>
    </div>
  );
};

export default function IntroPage() {
  const [visualMode, setVisualMode] = useState(false);
  const [activeAlgorithm, setActiveAlgorithm] = useState(null);
  const [animationStep, setAnimationStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isAnimating) {
      const interval = setInterval(() => {
        setAnimationStep((prev) => (prev + 1) % 4);
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [isAnimating]);

  const BoostingAnimation = () => {
    const models = [
      { id: 1, accuracy: 55, color: "bg-red-400" },
      { id: 2, accuracy: 65, color: "bg-orange-400" },
      { id: 3, accuracy: 75, color: "bg-yellow-400" },
      { id: 4, accuracy: 85, color: "bg-green-400" },
    ];

    return (
      <div className="bg-white rounded-xl shadow-lg p-8 mb-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-center gap-4 mb-6">
          <h3 className="text-2xl font-bold text-gray-800">How Boosting Works</h3>
          <button
            onClick={() => setIsAnimating(!isAnimating)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            {isAnimating ? "⏸ Pause" : "▶ Play"}
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          {models.map((model, idx) => (
            <div
              key={model.id}
              className={`flex flex-col items-center p-4 rounded-lg transition-all duration-500 ${
                animationStep >= idx ? "opacity-100 scale-100" : "opacity-30 scale-90"
              }`}
            >
              <div className={`w-16 h-16 ${model.color} rounded-full flex items-center justify-center text-white font-bold text-lg mb-2 transition-transform ${
                animationStep === idx ? "scale-110 ring-4 ring-blue-300" : ""
              }`}>
                M{model.id}
              </div>
              <div className="text-sm text-gray-600 mb-2">Model {model.id}</div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`${model.color} h-3 rounded-full transition-all duration-1000`}
                  style={{ width: animationStep >= idx ? `${model.accuracy}%` : "0%" }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">{model.accuracy}% accurate</div>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-6 h-6 text-blue-600" />
            <span className="font-semibold text-gray-800">Combined Team Result:</span>
            <span className="text-3xl font-bold text-green-600">92%</span>
          </div>
          <p className="text-gray-600 text-sm">
            Each model learns from previous mistakes, creating a powerful ensemble!
          </p>
        </div>
      </div>
    );
  };

  const AlgorithmCard = ({ name, icon: Icon, color, description, strengths, onClick, isActive }) => (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl shadow-lg p-6 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-105 ${
        isActive ? `ring-4 ring-${color}-400 scale-105` : ""
      }`}
    >
      <div className={`w-16 h-16 bg-${color}-100 rounded-full flex items-center justify-center mb-4 mx-auto`}>
        <Icon className={`w-8 h-8 text-${color}-600`} />
      </div>
      <h3 className={`text-2xl font-bold text-${color}-600 mb-3 text-center`}>{name}</h3>
      <p className="text-gray-600 mb-4 text-center">{description}</p>
      
      {isActive && (
        <div className="mt-6 pt-6 border-t border-gray-200 animate-fadeIn">
          <h4 className="font-semibold text-gray-800 mb-3">Key Strengths:</h4>
          <ul className="space-y-2">
            {strengths.map((strength, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                <span className={`text-${color}-500 font-bold`}>✓</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const algorithms = [
    {
      name: "AdaBoost",
      icon: Users,
      color: "blue",
      description: "Focuses on hard examples by giving them more weight",
      strengths: [
        "Simple and easy to understand",
        "Weights misclassified examples more heavily",
        "Great for binary classification",
        "Reduces bias effectively"
      ],
      analogy: "Like a dedicated tutor, it focuses over the hardest questions, making the next model focus on what the team got wrong"
    },
    {
      name: "Gradient Boost",
      icon: TrendingUp,
      color: "green",
      description: "Builds trees to predict and fix residual errors",
      strengths: [
        "Fits residuals (errors) directly",
        "Highly flexible and powerful",
        "Works well for regression and classification",
        "Can capture complex patterns"
      ],
      analogy: "A team of mechanics: Each new model's entire job is to predict and fix the mistakes left by the one before it"
    },
    {
      name: "XGBoost",
      icon: Zap,
      color: "purple",
      description: "Super-fast Gradient Boost with smart optimizations",
      strengths: [
        "Extremely fast and efficient",
        "Built-in regularization prevents overfitting",
        "Handles missing data automatically",
        "Parallel processing for speed"
      ],
      analogy: "The champion racecar: It takes the Gradient Boost strategy and adds high speed and smart optimizations to win"
    }
  ];

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Navbar />

      <section className="flex-1 px-6 py-12">
        {/* Hero Section with Video */}
        <div className="text-center mb-12 max-w-5xl mx-auto">
          {/*}
          <video
            autoPlay
            muted
            loop
            className="rounded-2xl shadow-lg mb-8 max-w-xl mx-auto"
          >
            <source src="/videos/intro_boosting.mp4" type="video/mp4" />
          </video>
          */}
          
          <div className="inline-block animate-bounce mb-4">
            <BarChart3 className="w-16 h-16 text-blue-600 mx-auto" />
          </div>
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Boosting — When Weak Learners Team Up
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Boosting is like teamwork for machines. Each weak model corrects the mistakes of the previous one.
          </p>

          <div className="flex items-center justify-center gap-3 mb-8">
            <button
              onClick={() => setVisualMode(!visualMode)}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                visualMode ? "bg-indigo-600 text-white shadow-lg" : "bg-white text-gray-700 border-2 border-gray-300"
              }`}
            >
              {visualMode ? "🎨 Visual Mode: ON" : "📝 Text Mode: ON"}
            </button>
          </div>
        </div>

        {/* Interactive Animation */}
        <BoostingAnimation />

        {/* Beginner-friendly introduction section */}
        {!visualMode ? (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-12 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <Cpu className="w-8 h-8 text-blue-600" />
              New to boosting? Start here
            </h2>
            <p className="text-gray-700 mb-4 text-lg">This app shows interactive visualizations, but first — a plain-English introduction:</p>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p className="text-lg">
                <strong className="text-blue-600">Imagine a team of learners:</strong> Instead of one perfect model, 
                boosting builds many weak models (they're only slightly better than random) and combines 
                them to make a strong team.
              </p>
              <p className="text-lg">
                <strong className="text-green-600">How they learn together:</strong> Each new model focuses on the 
                mistakes made so far, trying to correct them. Over several rounds, the combined model gets better.
              </p>
              <p className="text-lg">
                <strong className="text-purple-600">Why it's useful:</strong> Boosting often gives very accurate 
                predictions for classification and regression tasks, even with simple base learners.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-12 max-w-4xl mx-auto">
            <div className="grid grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-12 h-12 text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-800 mb-2">Team</h3>
                <p className="text-sm text-gray-600">Many weak models work together</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Target className="w-12 h-12 text-green-600" />
                </div>
                <h3 className="font-bold text-gray-800 mb-2">Focus</h3>
                <p className="text-sm text-gray-600">Each model fixes past mistakes</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <TrendingUp className="w-12 h-12 text-purple-600" />
                </div>
                <h3 className="font-bold text-gray-800 mb-2">Improve</h3>
                <p className="text-sm text-gray-600">Together they become accurate</p>
              </div>
            </div>
          </div>
        )}

        {/* Dataset Selector */}
        <DatasetSelector />

        {/* Algorithm Cards */}
        <div className="max-w-6xl mx-auto mb-12">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-8">
            Meet the Three Champions
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {algorithms.map((algo, idx) => (
              <AlgorithmCard
                key={idx}
                {...algo}
                onClick={() => setActiveAlgorithm(activeAlgorithm === idx ? null : idx)}
                isActive={activeAlgorithm === idx}
              />
            ))}
          </div>
        </div>

        {/* Real World Analogy */}
        {activeAlgorithm !== null && (
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-3xl mx-auto mb-12 animate-fadeIn">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Real-World Analogy</h3>
            <p className="text-lg text-gray-700">
              <span className="font-semibold text-blue-600">{algorithms[activeAlgorithm].name}</span> is{" "}
              {algorithms[activeAlgorithm].analogy}
            </p>
          </div>
        )}

        {/* Call to Action */}
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Ready to Explore?</h2>
          <p className="text-gray-600 mb-8">Try each algorithm with interactive visualizations</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="/adaboost"
              className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-all hover:scale-105 shadow-lg font-semibold"
            >
              Try AdaBoost →
            </a>
            <a
              href="/gradientboost"
              className="bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700 transition-all hover:scale-105 shadow-lg font-semibold"
            >
              Try Gradient Boost →
            </a>
            <a
              href="/xgboost"
              className="bg-purple-600 text-white px-8 py-4 rounded-lg hover:bg-purple-700 transition-all hover:scale-105 shadow-lg font-semibold"
            >
              Try XGBoost →
            </a>
            <a
              href="/summary"
              className="bg-gray-700 text-white px-8 py-4 rounded-lg hover:bg-gray-800 transition-all hover:scale-105 shadow-lg font-semibold"
            >
              Summary →
            </a>
          </div>
        </div>
      </section>

      <Footer />

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </main>
  );
}