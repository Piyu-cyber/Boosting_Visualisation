"use client";

import { useDomain } from "./DomainContext";

export default function DatasetSelector() {
  const { domain, setDomain } = useDomain();

  // Small, accessible dataset selector. Beginners can add more buttons here
  // for additional JSON files placed in `data/`.
  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8 max-w-xl w-full">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Select Dataset</h2>
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setDomain("banking")}
          aria-pressed={domain === "banking"}
          className={`p-4 rounded-lg border-2 transition-all ${
            domain === "banking"
              ? "border-blue-600 bg-blue-50"
              : "border-gray-200 hover:border-blue-300"
          }`}
        >
          <h3 className="font-medium text-lg mb-2">Banking Dataset</h3>
          <p className="text-sm text-gray-600">
            Customer subscription prediction data with age, balance, and duration features
          </p>
        </button>
        <button
          onClick={() => setDomain("automation")}
          aria-pressed={domain === "automation"}
          className={`p-4 rounded-lg border-2 transition-all ${
            domain === "automation"
              ? "border-blue-600 bg-blue-50"
              : "border-gray-200 hover:border-blue-300"
          }`}
        >
          <h3 className="font-medium text-lg mb-2">Automation Dataset</h3>
          <p className="text-sm text-gray-600">
            Industrial automation metrics with process parameters and outcomes
          </p>
        </button>
      </div>
    </div>
  );
}