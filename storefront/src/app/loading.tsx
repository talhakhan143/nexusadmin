export default function Loading() {
  return (
    <div className="container-tight py-20">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-10">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-[4/5] bg-secondary animate-pulse" />
            <div className="h-4 bg-secondary animate-pulse w-3/4" />
            <div className="h-4 bg-secondary animate-pulse w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
