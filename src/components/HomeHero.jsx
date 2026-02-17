import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut", staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function HomeHero() {
  return (
    <motion.section
      className="relative mb-8 overflow-hidden border-y border-black/20 py-8 sm:py-10"
      variants={container}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        className="pointer-events-none absolute right-4 top-4 h-16 w-16 border border-black/30 sm:h-20 sm:w-20"
        animate={{ y: [0, -10, 0], rotate: [0, 3, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.p
        variants={item}
        className="mb-3 text-[11px] uppercase tracking-[0.16em] opacity-60"
      >
        Art · VFX · Research · Teaching
      </motion.p>

      <motion.h1
        variants={item}
        className="max-w-2xl text-4xl font-bold leading-tight text-balance sm:text-5xl"
      >
        Martin Tomek — field notes, process logs, and open tools.
      </motion.h1>

      <motion.p variants={item} className="mt-4 max-w-2xl text-sm opacity-75 sm:text-base">
        A working journal on tactical urbanism, moving image, creative coding, and
        experimental production.
      </motion.p>
    </motion.section>
  );
}
