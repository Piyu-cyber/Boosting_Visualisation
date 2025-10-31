"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import Link from "next/link";
import { useDomain } from "@/components/DomainContext";

interface Algorithm {
  name: string;
  key: string;
  color: string;
  description: string;
  strengths: string[];
  use_cases: string[];
  characteristics: string;
}

const algorithms: Algorithm[] = [
  {
    name: "AdaBoost",
    key: "adaboost",
    color: "blue",
    description: "Adaptive Boosting focuses on hard-to-classify examples by adjusting sample weights.",
    strengths: [
      "Simple and intuitive",
      "Less prone to overfitting",
      "No need for feature scaling"
    ],
    use_cases: [
      "Binary classification tasks",
      "Face detection",
      "Simple datasets with clear decision boundaries"
    ],
    characteristics: "Assigns higher weights to misclassified samples, making subsequent models focus more on difficult cases."
  },
  {
    name: "Gradient Boost",
    key: "gradientboost",
    color: "green",
    description: "Builds strong predictive models by learning from residual errors of previous iterations.",
    strengths: [
      "High prediction accuracy",
      "Handles different loss functions",
      "Works well with continuous variables"
    ],
    use_cases: [
      "Regression problems",
      "Ranking tasks",
      "Complex datasets with non-linear relationships"
    ],
    characteristics: "Optimizes arbitrary differentiable loss functions by fitting new models to residual errors."
  },
  {
    name: "XGBoost",
    key: "xgboost",
    color: "purple",
    description: "eXtreme Gradient Boosting adds regularization and system optimizations to gradient boosting.",
    strengths: [
      "Superior performance",
      "Built-in regularization",
      "Handles missing values"
    ],
    use_cases: [
      "Large-scale machine learning",
      "Competition-level problems",
      "Production environments"
    ],
    characteristics: "Combines regularization with gradient boosting, offering speed and performance optimizations."
  }
];

interface FeatureCardProps {
  title: string;
  items: string[];
  color: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, items, color }) => (
  <div className={`bg-white rounded-lg shadow p-4 border-t-4 border-${color}-500 relative z-10 overflow-auto max-h-56`}>
    <h3 className={`text-lg font-semibold mb-4 text-${color}-600`}>{title}</h3>
  <ul className="space-y-2 max-h-40 overflow-auto pr-2">
      {items.map((item, idx) => (
        <motion.li
          key={idx}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="flex items-start space-x-2"
        >
          <span className={`text-${color}-500 mt-1`}>•</span>
          <span className="text-gray-700">{item}</span>
        </motion.li>
      ))}
    </ul>
  </div>
);

export default function SummaryPage() {
  const { domain, data } = useDomain();

  // compute simple dataset stats depending on domain
  const datasetSummary = React.useMemo(() => {
    if (!data || data.length === 0) return { count: 0 };
    const count = data.length;
    if (domain === "banking") {
      const ages = (data as any[]).map((d) => d.age || 0);
      const balances = (data as any[]).map((d) => d.balance || 0);
      const durations = (data as any[]).map((d) => d.duration || 0);
      const subscribed = (data as any[]).filter((d) => d.subscribed).length;
      const avg = (arr: number[]) => Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10;
      return {
        count,
        avgAge: avg(ages),
        avgBalance: avg(balances),
        avgDuration: avg(durations),
        subscribedRate: Math.round((subscribed / count) * 1000) / 10 // percent one decimal
      };
    }

    if (domain === "automation") {
      const temps = (data as any[]).map((d) => d.temperature || 0);
      const pressures = (data as any[]).map((d) => d.pressure || 0);
      const failures = (data as any[]).filter((d) => d.failure).length;
      const avg = (arr: number[]) => Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10;
      return {
        count,
        avgTemp: avg(temps),
        avgPressure: avg(pressures),
        failureRate: Math.round((failures / count) * 1000) / 10
      };
    }

    return { count };
  }, [domain, data]);

  // simple recommendations per domain
  const recommendedForDomain = React.useMemo(() => {
    if (domain === "banking") return ["XGBoost", "Gradient Boost"];
    if (domain === "automation") return ["Gradient Boost", "XGBoost"];
    return [];
  }, [domain]);

  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1 max-w-5xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Understanding Boosting Algorithms
          </h1>
          <p className="text-gray-600 max-w-3xl mx-auto">
            Explore the unique characteristics and strengths of different boosting algorithms.
            Learn when to use each one for optimal results.
          </p>
        </motion.div>

        {/* Dataset summary panel (shows banking or automation stats) */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Current Dataset: <span className="capitalize text-blue-600">{domain}</span></h3>
              {domain === "banking" ? (
                <div className="text-sm text-gray-600 mt-2">
                  <div>Rows: {datasetSummary.count}</div>
                  <div>Avg age: {datasetSummary.avgAge} years</div>
                  <div>Avg balance: {datasetSummary.avgBalance}</div>
                  <div>Avg call duration: {datasetSummary.avgDuration} sec</div>
                  <div>Subscription rate: {datasetSummary.subscribedRate}%</div>
                </div>
              ) : (
                <div className="text-sm text-gray-600 mt-2">
                  <div>Rows: {datasetSummary.count}</div>
                  <div>Avg temperature: {datasetSummary.avgTemp}</div>
                  <div>Avg pressure: {datasetSummary.avgPressure}</div>
                  <div>Failure rate: {datasetSummary.failureRate}%</div>
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Recommended for this dataset</div>
              <div className="mt-2 flex gap-2 justify-end">
                {recommendedForDomain.map((r) => (
                  <span key={r} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">{r}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

  <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-6 mb-20">
          {algorithms.map((algo) => (
            <motion.div
              key={algo.key}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col relative z-0"
            >
              <div className={`bg-${algo.color}-50 rounded-lg shadow p-4 border-t-4 border-${algo.color}-500 relative overflow-hidden`}>
                {recommendedForDomain.includes(algo.name) && (
                  <div className="absolute top-3 right-3 bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded">Recommended</div>
                )}
                <h2 className={`text-2xl font-bold text-${algo.color}-600 mb-4`}>{algo.name}</h2>
                <p className="text-gray-600 mb-6">{algo.description}</p>
                <FeatureCard title="Key Strengths" items={algo.strengths} color={algo.color} />
                <div className="mt-6">
                  <FeatureCard title="Best Use Cases" items={algo.use_cases} color={algo.color} />
                </div>
                <div className="mt-6 text-center">
                  <Link
                    href={`/${algo.key}`}
                    className={`inline-block bg-${algo.color}-600 text-white px-6 py-3 rounded-lg hover:bg-${algo.color}-700 transition`}
                  >
                    Try {algo.name} →
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="bg-white rounded-lg shadow p-6 mb-6"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Feature Comparison</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-gray-700">Feature</th>
                  <th className="px-6 py-3 text-center text-blue-700">AdaBoost</th>
                  <th className="px-6 py-3 text-center text-green-700">Gradient Boost</th>
                  <th className="px-6 py-3 text-center text-purple-700">XGBoost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 font-medium">Learning Type</td>
                  <td className="px-6 py-4 text-center">Weight-based</td>
                  <td className="px-6 py-4 text-center">Gradient-based</td>
                  <td className="px-6 py-4 text-center">Gradient-based + Regularization</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">Speed</td>
                  <td className="px-6 py-4 text-center">Fast</td>
                  <td className="px-6 py-4 text-center">Moderate</td>
                  <td className="px-6 py-4 text-center">Very Fast</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">Accuracy</td>
                  <td className="px-6 py-4 text-center">Good</td>
                  <td className="px-6 py-4 text-center">Better</td>
                  <td className="px-6 py-4 text-center">Best</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">Overfitting Risk</td>
                  <td className="px-6 py-4 text-center">Low</td>
                  <td className="px-6 py-4 text-center">Moderate</td>
                  <td className="px-6 py-4 text-center">Low (with regularization)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="bg-white rounded-lg shadow p-6 mb-6"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Making the Right Choice</h2>
          <div className="space-y-4 text-gray-600">
            <p>
              <span className="font-semibold text-blue-600">Choose AdaBoost</span> when you have a binary 
              classification problem and want a simple, effective solution that's less prone to overfitting.
              It's particularly good for problems where identifying hard-to-classify cases is important.
            </p>
            <p>
              <span className="font-semibold text-green-600">Choose Gradient Boost</span> when you need 
              flexibility in the loss function and are dealing with complex regression or multi-class 
              classification problems. It's excellent for cases where you need to capture non-linear relationships.
            </p>
            <p>
              <span className="font-semibold text-purple-600">Choose XGBoost</span> when you need the best 
              possible performance, are working with large datasets, or need production-ready implementation.
              It's the go-to choice for many machine learning competitions and real-world applications.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Real-world Applications</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-6 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 text-blue-600">Banking</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Customer churn prediction</li>
                <li>• Credit risk assessment</li>
                <li>• Fraud detection</li>
              </ul>
            </div>
            <div className="p-6 bg-green-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 text-green-600">Automation</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Predictive maintenance</li>
                <li>• Quality control</li>
                <li>• Process optimization</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
      <Footer />
    </main>
  );
}