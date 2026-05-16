import { cn } from "@/lib/cn";

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "space-y-3",
        align === "center" && "text-center [&_.section-eyebrow]:justify-center",
        className
      )}
    >
      {eyebrow && <p className="section-eyebrow">{eyebrow}</p>}
      <h2 className="font-serif text-3xl md:text-5xl tracking-tight">{title}</h2>
      {subtitle && (
        <p className="text-muted-foreground max-w-xl text-base md:text-lg leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
