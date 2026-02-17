import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const TICKER_ITEMS = [
  "Tactical Urbanism",
  "VFX Compositing",
  "Moving Image",
  "Creative Coding",
  "Open Tools",
  "Research Notes",
  "Field Work",
  "Process Logs",
];

function Ticker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="overflow-hidden border-y border-black/10 py-2 my-6">
      <motion.div
        className="flex gap-8 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
      >
        {items.map((label, i) => (
          <span
            key={i}
            className="text-[11px] uppercase tracking-[0.18em] opacity-40 shrink-0"
          >
            {label} <span className="opacity-50 mx-2">·</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

export default function HomeHero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const ySquare = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const opacitySquare = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section ref={ref} className="relative mb-2 pt-10 pb-2">
      <motion.div
        className="pointer-events-none absolute right-0 top-8 border border-black/20"
        style={{ y: ySquare, opacity: opacitySquare, width: 88, height: 88 }}
      >
        <motion.div
          className="absolute inset-0 border border-black/15"
          animate={{ scale: [1, 0.82, 1] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute inset-[35%] bg-black/10"
          animate={{ rotate: [0, 90, 180, 270, 360] }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>

      <motion.p
        className="text-[11px] uppercase tracking-[0.2em] opacity-40 mb-5"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 0.4, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        Art · VFX · Research · Teaching
      </motion.p>

      <motion.h1
        className="text-[clamp(2.4rem,6vw,4.5rem)] font-bold leading-[1.05] tracking-[-0.03em] max-w-3xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        Field notes,
        <br />
        process logs,
        <br />
        <span className="opacity-40">and open tools.</span>
      </motion.h1>

      <motion.p
        className="mt-6 max-w-lg text-base opacity-55 leading-relaxed"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 0.55, y: 0 }}
        transition={{ duration: 0.5, delay: 0.18, ease: "easeOut" }}
      >
        Martin Tomek — a working journal on tactical urbanism, moving image,
        creative coding, and experimental production.
      </motion.p>

      <Ticker />
    </section>
  );
}
