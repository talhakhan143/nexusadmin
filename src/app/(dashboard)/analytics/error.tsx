"use client";
import { RouteError } from "@/components/modules/route-error";

export default function Error(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError module="Analytics" {...props} />;
}
