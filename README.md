# Boosting Visualizer

An interactive visualization tool for understanding boosting algorithms in machine learning. This project provides visual explanations for different boosting techniques including Gradient Boost, AdaBoost, and XGBoost.

## Features

- Interactive visualization of boosting algorithms
- Real-time step-by-step explanation of the boosting process
- Support for multiple domains (banking, automation)
- Responsive design with Tailwind CSS
- Dynamic data visualization using Recharts
- Smooth animations with Framer Motion

## Technologies Used

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Recharts
- Framer Motion
- React Spring

## Getting Started

### Prerequisites

# Boosting Visualizer

An interactive, beginner-friendly tool for learning how boosting algorithms work. The app shows step-by-step visualizations for AdaBoost, Gradient Boost, and XGBoost using small example datasets.

If you're new to the project, the quick start below gets you running locally. Later sections explain how the visualizations are structured and how to add your own dataset.

## Quick Start (for beginners)

1. Install Node.js 18+ and npm.
2. Clone the repo and install dependencies:

```powershell
git clone <repository-url>
cd "DHV Project\DHV Project"
npm install
```

3. Start the dev server and open the app:

```powershell
npm run dev
# then open http://localhost:3000
```

## What you'll see

- Landing page with dataset selector (banking or automation).
- Three dedicated pages that demonstrate AdaBoost, Gradient Boost, and XGBoost step-by-step.
- A summary page that compares algorithms and gives dataset-specific recommendations.

## Project overview (files you care about)

- `app/` – pages for each algorithm and the summary page.
- `components/` – small reusable UI pieces (Navbar, ExplanationCard, DatasetSelector, DomainContext).
- `data/` – JSON datasets used by the app (banking.json, automation.json).

## How visualizations work (short explanation)

- Each visualization picks two numeric features from the selected dataset and simulates a sequence of model updates (steps).
- The chart shows per-sample predictions for each step. You can play the steps or step through manually.
- Gradient Boost and XGBoost show how predictions change over iterations. AdaBoost visualizes sample weights.

## Adding your own dataset (beginner-friendly)

1. Create a new JSON file in `data/`, e.g. `mydata.json`.
2. Use an array of objects. Each object should contain numeric feature keys and a target key (boolean or numeric). Example:

```json
[
	{ "age": 30, "balance": 1200, "duration": 300, "subscribed": 1 },
	{ "age": 45, "balance": 500, "duration": 120, "subscribed": 0 }
]
```

3. Update the `DatasetSelector` component if you want a button to switch to your dataset, or change the default domain in `components/DomainContext.tsx`.

## Suggestions for beginners (learning path)

1. Open `app/gradientboost/page.tsx` and find the `states` generation logic — it shows how predictions are updated each step.
2. Inspect `components/DomainContext.tsx` to see how datasets are loaded dynamically.
3. Tweak small parameters (learning rate, number of steps) to see how visualizations react.

## Contributing

Contributions are welcome. If you add features, please include a short README entry and keep the UI accessible.

## License

This project is licensed under the MIT License.
