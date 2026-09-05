import type { ReactNode } from "react";
import {
  useFloating,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
  useListNavigation,
  autoUpdate,
  offset,
  flip,
  shift,
  size,
  FloatingPortal,
  FloatingFocusManager,
} from "@floating-ui/react";
import { useRef, useState } from "react";
import { cn } from "../../lib/cn";

interface MenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  danger?: boolean;
}

interface MenuProps {
  trigger: ReactNode;
  items: MenuItem[];
  align?: "start" | "end";
}

export function Menu({ trigger, items, align = "end" }: MenuProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const listRef = useRef<Array<HTMLButtonElement | null>>([]);

  // useFloating computes position relative to the viewport (not the
  // nearest scroll/overflow ancestor), so an overflow-hidden Card can
  // no longer clip the menu. flip/shift keep it on-screen near
  // viewport edges, and autoUpdate keeps it aligned on scroll/resize.
  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: align === "end" ? "bottom-end" : "bottom-start",
    strategy: "fixed",
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(6),
      flip({ fallbackPlacements: ["top-end", "top-start"] }),
      shift({ padding: 8 }),
      size({
        apply({ availableHeight, elements }) {
          Object.assign(elements.floating.style, {
            maxHeight: `${Math.max(120, availableHeight)}px`,
          });
        },
        padding: 8,
      }),
    ],
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "menu" });
  const listNav = useListNavigation(context, {
    listRef,
    activeIndex,
    onNavigate: setActiveIndex,
    loop: true,
  });

  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([
    click,
    dismiss,
    role,
    listNav,
  ]);

  return (
    <>
      <div ref={refs.setReference} {...getReferenceProps()}>
        {trigger}
      </div>
      {open && (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false} initialFocus={-1}>
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              className="z-50 min-w-[180px] animate-fade-up overflow-y-auto rounded-lg border border-paper-200 bg-white py-1.5 shadow-lg"
              {...getFloatingProps()}
            >
              {items.map((item, i) => (
                <button
                  key={i}
                  ref={(node) => {
                    listRef.current[i] = node;
                  }}
                  {...getItemProps({
                    onClick: () => {
                      setOpen(false);
                      item.onClick();
                    },
                  })}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3.5 py-2 text-start text-sm transition-colors",
                    item.danger ? "text-cinnabar-600 hover:bg-cinnabar-50" : "text-ink-700 hover:bg-paper-100",
                    activeIndex === i && (item.danger ? "bg-cinnabar-50" : "bg-paper-100"),
                  )}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </>
  );
}
