import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function SummaryPage() {
  return (
    <main className="min-h-screen flex flex-col items-center text-center p-10 bg-gradient-to-b from-white to-blue-50">
      <Navbar />
      <section className="max-w-3xl">
        <h1 className="text-3xl font-bold text-blue-600 mb-6">Boosting Recap</h1>
        <p className="text-gray-600 mb-4">
          Boosting is about combining multiple weak learners to form a powerful
          model. Each algorithm improves on its predecessor by handling errors
          differently.
        </p>
        <table className="table-auto w-full mt-8 border-collapse border border-gray-300">
          <thead className="bg-blue-100">
            <tr>
              <th className="border p-2">Algorithm</th>
              <th className="border p-2">Core Idea</th>
              <th className="border p-2">Strength</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border p-2">AdaBoost</td>
              <td className="border p-2">Reweights hard examples</td>
              <td className="border p-2">Simple and interpretable</td>
            </tr>
            <tr>
              <td className="border p-2">Gradient Boost</td>
              <td className="border p-2">Learns residual errors iteratively</td>
              <td className="border p-2">Stable performance</td>
            </tr>
            <tr>
              <td className="border p-2">XGBoost</td>
              <td className="border p-2">Optimized Gradient Boosting</td>
              <td className="border p-2">High accuracy and speed</td>
            </tr>
          </tbody>
        </table>
        <div className="mt-8">
          <p className="text-gray-700 font-medium mb-4">
            Real-world use cases:
          </p>
          <ul className="list-disc text-left ml-6 text-gray-600">
            <li>🏦 Banking — Customer churn prediction</li>
            <li>⚙️ Automation — Predictive maintenance</li>
          </ul>
        </div>
      </section>
      <Footer />
    </main>
  );
}