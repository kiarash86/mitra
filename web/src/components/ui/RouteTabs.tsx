import { NavLink } from "react-router-dom";
import { cn } from "../../lib/cn";

interface RouteTab {
  label: string;
  to: string;
  end?: boolean;
}

export function RouteTabs({ tabs }: { tabs: RouteTab[] }) {
  return (
    <div className="mb-6 flex gap-1 border-b border-paper-200">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            cn(
              "border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "border-saffron-500 text-ink-900"
                : "border-transparent text-ink-500 hover:text-ink-800",
            )
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  );
}
