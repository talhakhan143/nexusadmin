import { MapPin } from "lucide-react";

interface AddressCardProps {
  title: string;
  address?: {
    firstName?: string | null;
    lastName?: string | null;
    company?: string | null;
    line1: string;
    line2?: string | null;
    city: string;
    state?: string | null;
    country: string;
    postalCode: string;
    phone?: string | null;
  } | null;
}

export function AddressCard({ title, address }: AddressCardProps) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
        <MapPin className="h-3 w-3" /> {title}
      </p>
      {address ? (
        <address className="not-italic text-sm leading-6">
          <p className="font-medium">
            {[address.firstName, address.lastName].filter(Boolean).join(" ") || "—"}
          </p>
          {address.company && <p className="text-muted-foreground">{address.company}</p>}
          <p>{address.line1}</p>
          {address.line2 && <p>{address.line2}</p>}
          <p>
            {address.city}, {address.state ? `${address.state} ` : ""}
            {address.postalCode}
          </p>
          <p>{address.country}</p>
          {address.phone && <p className="text-muted-foreground mt-1">{address.phone}</p>}
        </address>
      ) : (
        <p className="text-sm text-muted-foreground italic">Not provided.</p>
      )}
    </div>
  );
}
