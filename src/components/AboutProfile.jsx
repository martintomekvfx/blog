import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.35, staggerChildren: 0.12 },
  },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const focusAreas = [
  "Guerilla art / tactical urbanism",
  "VFX compositing + moving image",
  "Creative coding and open tools",
  "Teaching and workshop design",
  "Research on attention ecology",
];

const tracks = [
  {
    title: "Guerilla",
    summary: "Palmovka interventions, temporary installations, and public-space activation.",
  },
  {
    title: "Analog",
    summary: "VJ sets, scanner experiments, 35mm photography, and material-based image research.",
  },
  {
    title: "Game Jam",
    summary: "Rapid prototyping projects connecting visual language, gameplay, and social context.",
  },
  {
    title: "Collective",
    summary: "Festival and team collaborations across animation, print, and 16mm workflows.",
  },
];

export default function AboutProfile() {
  return (
    <motion.section
      className="space-y-10"
      variants={container}
      initial="hidden"
      animate="visible"
    >
      <motion.header variants={item} className="border-y border-black/20 py-8">
        <p className="text-xs uppercase tracking-[0.16em] opacity-60">About</p>
        <h1 className="mt-3 text-4xl font-bold leading-tight text-balance sm:text-5xl">
          Martin Tomek
        </h1>
        <p className="mt-3 text-sm uppercase tracking-[0.12em] opacity-70">
          Film / Installation / Guerilla Art
        </p>
        <p className="mt-5 max-w-2xl text-pretty opacity-80">
          I treat the city as a gallery. This blog is my public archive of process — where art,
          VFX, tactical urbanism, and code meet in one evolving body of work.
        </p>
      </motion.header>

      <motion.div variants={item} className="grid gap-8 md:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4 text-pretty opacity-85">
          <p>
            Zásadním východiskem mého uvažování je město jako otevřený výstavní prostor. Do
            opomíjených míst vkládám malé zásahy, které mají probudit pozornost a vrátit prostoru
            vztah.
          </p>
          <p>
            Vedle instalací pracuji s filmem, VFX a interaktivními formami. Vedu workshopy,
            publikuju open-source nástroje a propojuji praktickou tvorbu s akademickým výzkumem.
          </p>
          <p>
            Current context: FAMU / CAS (2025–2027), research and interventions around Palmovka,
            Prague 8.
          </p>
        </div>

        <div className="border border-black p-4">
          <h2 className="text-sm uppercase tracking-[0.12em] mb-3">Focus areas</h2>
          <ul className="space-y-2 text-sm">
            {focusAreas.map((area) => (
              <li key={area} className="border-t border-black/15 pt-2 first:border-t-0 first:pt-0">
                {area}
              </li>
            ))}
          </ul>
        </div>
      </motion.div>

      <motion.section variants={item}>
        <h2 className="text-lg font-bold uppercase tracking-[0.08em] mb-3">Selected tracks</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {tracks.map((track) => (
            <article key={track.title} className="border border-black p-4">
              <h3 className="text-sm uppercase tracking-[0.12em] mb-2">{track.title}</h3>
              <p className="text-sm opacity-80">{track.summary}</p>
            </article>
          ))}
        </div>
      </motion.section>

      <motion.section variants={item} className="border border-black p-4 sm:p-5">
        <h2 className="text-sm uppercase tracking-[0.12em] mb-3">Links</h2>
        <ul className="space-y-2 text-sm">
          <li>
            Portfolio: <a className="underline underline-offset-4" href="https://martintomekvfx.github.io/">martintomekvfx.github.io</a>
          </li>
          <li>
            GitHub: <a className="underline underline-offset-4" href="https://github.com/martintomekvfx">github.com/martintomekvfx</a>
          </li>
          <li>
            Itch.io: <a className="underline underline-offset-4" href="https://jamiiethetrashman.itch.io/">jamiiethetrashman.itch.io</a>
          </li>
          <li>
            Email: <a className="underline underline-offset-4" href="mailto:martin.tomek@famu.cz">martin.tomek@famu.cz</a>
          </li>
        </ul>
      </motion.section>
    </motion.section>
  );
}
