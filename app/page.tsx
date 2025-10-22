"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import DatasetSelector from "@/components/DatasetSelector";

export default function IntroPage() {
  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white">
      <Navbar />
      <section className="flex flex-col items-center justify-center flex-1 text-center px-6">
        <video
          autoPlay
          muted
          loop
          className="rounded-2xl shadow-lg mb-8 max-w-xl"
        >
          <source src="/videos/intro_boosting.mp4" type="video/mp4" />
        </video>
        <h1 className="text-4xl font-bold text-blue-600 mb-4">
          Boosting — When Weak Learners Team Up
        </h1>
        <p className="text-gray-600 max-w-xl mb-6">
          Boosting is like teamwork for machines. Each weak model corrects the
          mistakes of the previous one. Explore how AdaBoost, Gradient Boost,
          and XGBoost learn step-by-step.
        </p>
        
        <DatasetSelector />
        
        <div className="flex gap-4 flex-wrap justify-center">
          <Link
            href="/adaboost"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Try AdaBoost →
          </Link>
          <Link
            href="/gradientboost"
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
          >
            Try Gradient Boost →
          </Link>
          <Link
            href="/xgboost"
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
          >
            Try XGBoost →
          </Link>
        </div>
      </section>
      <Footer />
    </main>
  );
}