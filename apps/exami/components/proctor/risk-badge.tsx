import { Badge } from "@/components/ui/badge";
import type { RiskBucket } from "@/lib/types";

export function RiskBadge({
  bucket,
  score,
}: {
  bucket: RiskBucket;
  score?: number;
}) {
  const tone =
    bucket === "HIGH" ? "danger" : bucket === "MEDIUM" ? "warning" : "success";
  return (
    <Badge tone={tone}>
      {bucket}
      {typeof score === "number" && (
        <span className="opacity-70">· {(score * 100).toFixed(0)}%</span>
      )}
    </Badge>
  );
}
