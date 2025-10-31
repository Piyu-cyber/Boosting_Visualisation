import { useSpring, animated } from "@react-spring/web";

interface ExplanationCardProps {
  // short title for the card (e.g. "Step 1")
  step: string;
  // brief description text explaining what's happening
  description: string;
}

/**
 * Small animated card used across pages to explain the current step.
 * Using a typed props interface makes it easier for beginners to understand what to pass.
 */
export default function ExplanationCard({ step, description }: ExplanationCardProps) {
  const styles = useSpring({
    from: { opacity: 0, y: 30 },
    to: { opacity: 1, y: 0 },
    config: { tension: 200, friction: 18 },
  });

  return (
    <animated.div style={styles} className="bg-white rounded-xl p-4 shadow-md">
      <h3 className="text-lg font-semibold text-blue-600">{step}</h3>
      <p className="text-gray-700 mt-2">{description}</p>
    </animated.div>
  );
}