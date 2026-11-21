import Link from "next/link";
import AppText from "@/components/ui/AppText";

const gurus = [
  {
    name: "Shri Guru Nanak Dev Ji",
    src: "/guru-nanak-dev-ji.png",
    href: "/SGNDJ-UNPD", 
    height: "clamp(100px, 18vw, 160px)",
    className: "hidden sm:flex",
    variant: "label",
  },
  {
    name: "Shri Guru Granth Sahib Ji",
    src: "/guru-granth-sahib-ji.png",
    href: "/SGGSJ-S4CC", 
    height: "clamp(160px, 36vw, 220px)",
    className: "flex",
    variant: "label2",
  },
  {
    name: "Guru Gobind Singh Ji",
    src: "/guru-gobind-singh-ji.png",
    href: "/SGGSJ-PAM4", 
    height: "clamp(100px, 18vw, 160px)",
    className: "hidden sm:flex",
    variant: "label",
  },
] as const;

export default function TopGurus() {
  return (
    <section className="flex w-full items-start justify-center gap-4 sm:gap-8 md:gap-20 lg:max-w-7xl">
      {gurus.map((guru) => (
        <figure key={guru.name} className={`${guru.className} flex-col items-center`}>
          <Link
            href={guru.href}
            title={guru.name}
            className="group flex select-none flex-col items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            <img
              src={guru.src}
              // SGGSJ-S4CC
              alt={guru.name}
              style={{ height: guru.height }}
              decoding="async"
              draggable={false}
              className="w-auto object-contain drop-shadow-lg drop-shadow-shadow transition duration-300 group-hover:scale-105"
            />
            <AppText
              as="figcaption"
              variant={guru.variant}
              className={`text-center font-semibold ${
                guru.variant === "label" ? "text-accent" : "text-text-primary"
              }`}
            >
              {guru.name}
            </AppText>
          </Link>
        </figure>
      ))}
    </section>
  );
}