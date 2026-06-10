import { Badge } from "@/components/ui/badge";
import { STATUS_BADGE_CLASSES, STATUS_LABELS } from "@/lib/constants";
import type { DemandStatus } from "@prisma/client";

export function StatusBadge({ status }: { status: DemandStatus }) {
  return (
    <Badge variant="outline" className={STATUS_BADGE_CLASSES[status]}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
