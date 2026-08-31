import { useEffect } from "react";

interface CompletionSealProps {
  show: boolean;
  onDone: () => void;
}

/** Absolutely-positioned burst; render inside a `relative` parent. */
export function CompletionSeal({ show, onDone }: CompletionSealProps) {
  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(onDone, 650);
    return () => clearTimeout(timer);
  }, [show, onDone]);

  if (!show) return null;

  return (
    <svg
      viewBox="0 0 48 48"
      className="pointer-events-none absolute inset-0 z-10 m-auto h-14 w-14 animate-seal"
      aria-hidden="true"
    >
      <g stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" className="text-saffron-500">
        <line x1="24" y1="10" x2="24" y2="2" />
        <line x1="32.5" y1="13.5" x2="38.2" y2="7.8" />
        <line x1="38" y1="24" x2="46" y2="24" />
        <line x1="32.5" y1="34.5" x2="38.2" y2="40.2" />
        <line x1="24" y1="38" x2="24" y2="46" />
        <line x1="15.5" y1="34.5" x2="9.8" y2="40.2" />
        <line x1="10" y1="24" x2="2" y2="24" />
        <line x1="15.5" y1="13.5" x2="9.8" y2="7.8" />
      </g>
      <circle cx="24" cy="24" r="9" className="fill-saffron-400" />
      <path
        d="M18.5 24l3.8 3.8L30 19.5"
        className="stroke-white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
