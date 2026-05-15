import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ComingSoonProps {
  phase: string;
  bullets?: string[];
}

export function ComingSoon({ phase, bullets }: ComingSoonProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="py-12 flex flex-col items-center text-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="h-5 w-5" />
        </span>
        <Badge variant="secondary" className="uppercase tracking-wider text-[10px]">
          {phase}
        </Badge>
        <h3 className="text-lg font-semibold">Module scaffolded — full UI in next phase</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Foundation, data model and routing are in place. Build out below in the next phase using the
          shared <code className="text-xs px-1 py-0.5 rounded bg-muted">DataTable</code>,
          {" "}<code className="text-xs px-1 py-0.5 rounded bg-muted">Server Actions</code> and Zod schemas.
        </p>
        {bullets && bullets.length > 0 && (
          <ul className="text-sm text-muted-foreground space-y-1 mt-2 text-left">
            {bullets.map((b) => (
              <li key={b}>· {b}</li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
