import { motion } from "framer-motion";

export default function SquarePulse({
  title = "Square signal",
  caption = "An attention marker for interventions in public space.",
  size = 128,
}) {
  return (
    <figure className="my-6 border border-black p-4">
      <div className="flex items-center gap-4">
        <div
          className="relative shrink-0 border border-black"
          style={{ width: size, height: size }}
          aria-hidden="true"
        >
          <motion.div
            className="absolute inset-0 border border-black"
            animate={{ scale: [1, 0.78, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute inset-3 border border-black"
            animate={{ scale: [0.9, 1.08, 0.9], opacity: [0.45, 0.95, 0.45] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute inset-[38%] bg-black"
            animate={{ scale: [0.8, 1.16, 0.8], rotate: [0, 90, 180] }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          />
        </div>
        <figcaption className="min-w-0">
          <p className="text-xs uppercase tracking-[0.12em] opacity-60">{title}</p>
          <p className="mt-2 text-sm opacity-80">{caption}</p>
        </figcaption>
      </div>
    </figure>
  );
}
