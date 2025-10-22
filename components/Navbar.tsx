"use client";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="flex justify-between items-center px-6 py-4 bg-white shadow-md">
      <h1 className="text-2xl font-bold text-blue-600">Boosting Visualizer</h1>
      <div className="flex gap-6 text-gray-700">
        <Link href="/">Intro</Link>
        <Link href="/adaboost">AdaBoost</Link>
        <Link href="/gradientboost">GradientBoost</Link>
        <Link href="/xgboost">XGBoost</Link>
        <Link href="/summary">Summary</Link>
      </div>
    </nav>
  );
}