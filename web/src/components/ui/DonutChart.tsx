import { useI18n } from "../../i18n";
import { formatNumber } from "../../lib/formatters";

interface DonutSegment {
  value: number;
  colorClass: string;
  label: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
}

export function DonutChart({ segments, size = 120, thickness = 14 }: DonutChartProps) {
  const { locale } = useI18n();
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const r = (size - thickness) / 2;
  const circumference = 2 * Math.PI * r;
  const center = size / 2;
  let cumulative = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="chart">
      <g transform={`rotate(-90 ${center} ${center})`}>
        <circle cx={center} cy={center} r={r} fill="none" stroke="var(--color-paper-200)" strokeWidth={thickness} />
        {total > 0 &&
          segments
            .filter((s) => s.value > 0)
            .map((s, i) => {
              const length = (s.value / total) * circumference;
              const dashoffset = -cumulative;
              cumulative += length;
              return (
                <circle
                  key={i}
                  cx={center}
                  cy={center}
                  r={r}
                  fill="none"
                  strokeWidth={thickness}
                  strokeDasharray={`${length} ${circumference - length}`}
                  strokeDashoffset={dashoffset}
                  stroke="currentColor"
                  className={s.colorClass}
                />
              );
            })}
      </g>
      <text
        x={center}
        y={center}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-ink-900 font-bold"
        style={{ fontSize: size * 0.22 }}
      >
        {formatNumber(total, locale)}
      </text>
    </svg>
  );
}
