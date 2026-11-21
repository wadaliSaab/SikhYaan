
export default function Avatar({
  name,
  src,
  size = "md",
}: {
  name: string;
  src?: string;
  size?: "sm" | "md";
}) {
  const sizeClass = size === "sm" ? "h-9 w-9 text-base" : "h-14 w-14 text-xl";

  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary font-semibold text-premium ${sizeClass}`}
    >
      {src ? <img src={src} alt={name} className="h-full w-full object-cover" /> : name[0]}
    </span>
  );
}