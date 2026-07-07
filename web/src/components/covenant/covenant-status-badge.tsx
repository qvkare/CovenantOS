import type { FacilityStatus } from "@covenantos/shared";

import { Badge } from "@/components/ui/badge";

export function CovenantStatusBadge({
  status,
}: {
  status: FacilityStatus | "OK" | "WARNING" | "BREACH";
}) {
  switch (status) {
    case "active":
    case "OK":
      return <Badge variant="success">OK</Badge>;
    case "paused":
    case "WARNING":
      return <Badge variant="warning">Warning</Badge>;
    case "breach":
    case "BREACH":
      return <Badge variant="danger">Breach</Badge>;
    case "closed":
      return <Badge variant="secondary">Closed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
