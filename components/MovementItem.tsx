import Link from "next/link";
import type { Movement } from "@/lib/queries";
import { formatDateTime } from "@/lib/format";
import { ColorDot, MovementBadge } from "@/components/ui";

export function MovementItem({
  m,
  showProduct = true,
}: {
  m: Movement;
  showProduct?: boolean;
}) {
  const sign = m.qty > 0 ? "+" : "−";
  return (
    <li className="flex items-center gap-3 px-5 py-3">
      <div className="min-w-0 flex-1">
        {showProduct && (
          <Link
            href={`/inventario/${m.product_id}`}
            className="block truncate font-medium hover:text-cobalt"
          >
            {m.name}
          </Link>
        )}
        <p className="flex items-center gap-1.5 text-sm text-muted">
          <ColorDot color={m.color} />
          <span className="truncate">
            {m.color} · {m.size}
            {m.user_name ? ` · ${m.user_name}` : ""}
            {m.note ? ` · ${m.note}` : ""}
          </span>
        </p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-2">
          <MovementBadge type={m.type} />
          <span className="w-9 text-right font-display text-xl font-semibold tabular-nums">
            {sign}
            {Math.abs(m.qty)}
          </span>
        </div>
        <span className="text-xs text-muted">{formatDateTime(m.created_at)}</span>
      </div>
    </li>
  );
}
