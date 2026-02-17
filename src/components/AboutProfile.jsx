const LINKS = [
  { label: "Portfolio", href: "https://martintomekvfx.github.io/" },
  { label: "GitHub", href: "https://github.com/martintomekvfx" },
  { label: "Itch.io", href: "https://jamiiethetrashman.itch.io/" },
  { label: "Email", href: "mailto:martin.tomek@famu.cz" },
];

export default function AboutProfile() {
  return (
    <div className="pt-10">
      <h1 className="text-xl font-semibold mb-4">Martin Tomek</h1>
      <p className="text-base leading-relaxed max-w-xl mb-4">
        I work on art, VFX compositing, tactical urbanism, and creative coding.
        I teach at FAMU in Prague and make interventions in public space.
      </p>
      <p className="text-base leading-relaxed max-w-xl mb-10">
        Currently a researcher at CAS (2025–2027), focusing on attention and the urban environment.
      </p>

      <ul className="space-y-1">
        {LINKS.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              target={link.href.startsWith("mailto") ? undefined : "_blank"}
              rel="noopener noreferrer"
              className="text-base hover:opacity-60 transition-opacity duration-150 underline underline-offset-4 decoration-black/30"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
