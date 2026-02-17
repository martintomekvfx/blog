import { motion } from "framer-motion";

const item = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const PRACTICE = [
  { label: "Guerilla Art", desc: "Public-space interventions, temporary installations, attention markers." },
  { label: "Moving Image", desc: "VFX compositing, 16mm film, scanner experiments, VJ performance." },
  { label: "Creative Coding", desc: "Open tools, interactive work, game jams, experimental software." },
  { label: "Teaching", desc: "Workshops at FAMU, pedagogy of process, collaborative research." },
];

const LINKS = [
  { label: "Portfolio", href: "https://martintomekvfx.github.io/", display: "martintomekvfx.github.io" },
  { label: "GitHub", href: "https://github.com/martintomekvfx", display: "github.com/martintomekvfx" },
  { label: "Itch.io", href: "https://jamiiethetrashman.itch.io/", display: "jamiiethetrashman.itch.io" },
  { label: "Email", href: "mailto:martin.tomek@famu.cz", display: "martin.tomek@famu.cz" },
];

export default function AboutProfile() {
  return (
    <motion.div
      className="space-y-0"
      variants={container}
      initial="hidden"
      animate="visible"
    >
      <motion.header
        variants={item}
        className="pt-10 pb-12 border-b border-black/10"
      >
        <p className="text-[11px] uppercase tracking-[0.2em] opacity-35 mb-6">
          About
        </p>
        <h1 className="text-[clamp(3rem,7vw,5.5rem)] font-bold leading-[1.0] tracking-[-0.03em] mb-8">
          Martin<br />Tomek
        </h1>
        <p className="text-[11px] uppercase tracking-[0.18em] opacity-40 mb-6">
          Film · Installation · Guerilla Art · Research
        </p>
        <p className="max-w-xl text-base leading-relaxed opacity-60">
          I treat the city as a gallery. This blog is my public archive of process —
          where art, VFX, tactical urbanism, and code meet in one evolving body of work.
        </p>
        <p className="mt-3 max-w-xl text-sm leading-relaxed opacity-40">
          Currently: FAMU / CAS (2025–2027). Research and interventions around Palmovka, Prague 8.
        </p>
      </motion.header>

      <motion.section variants={item} className="py-12 border-b border-black/10">
        <p className="text-[11px] uppercase tracking-[0.18em] opacity-35 mb-8">Practice</p>
        <div className="grid gap-px bg-black/10 border border-black/10 sm:grid-cols-2">
          {PRACTICE.map((area) => (
            <div key={area.label} className="bg-white p-5">
              <p className="text-xs uppercase tracking-[0.14em] mb-2">{area.label}</p>
              <p className="text-sm opacity-55 leading-relaxed">{area.desc}</p>
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section variants={item} className="py-12 border-b border-black/10">
        <p className="text-[11px] uppercase tracking-[0.18em] opacity-35 mb-8">Statement</p>
        <div className="max-w-2xl space-y-5 text-base leading-relaxed">
          <p className="opacity-70">
            Zásadním východiskem mého uvažování je město jako otevřený výstavní prostor.
            Do opomíjených míst vkládám malé zásahy, které mají probudit pozornost
            a vrátit prostoru vztah.
          </p>
          <p className="opacity-50 text-sm">
            Vedle instalací pracuji s filmem, VFX a interaktivními formami. Vedu workshopy,
            publikuju open-source nástroje a propojuji praktickou tvorbu s akademickým výzkumem.
          </p>
        </div>
      </motion.section>

      <motion.section variants={item} className="py-12">
        <p className="text-[11px] uppercase tracking-[0.18em] opacity-35 mb-8">Contact & Links</p>
        <div className="space-y-0">
          {LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.href.startsWith("mailto") ? undefined : "_blank"}
              rel="noopener noreferrer"
              className="group flex items-baseline justify-between border-b border-black/10 py-4 hover:opacity-60 transition-opacity duration-150"
            >
              <span className="text-[11px] uppercase tracking-[0.14em] opacity-40 w-24 shrink-0">
                {link.label}
              </span>
              <span className="text-sm flex-1 text-right group-hover:underline underline-offset-4">
                {link.display}
              </span>
            </a>
          ))}
        </div>
      </motion.section>
    </motion.div>
  );
}
