import { type ReactNode, useRef } from "react";

/** Inputs whose edits start on the first keystroke rather than on pointer down. */
const TYPED =
  "input:not([type=range]):not([type=color]):not([type=checkbox]), textarea, select";

const isTyped = (target: EventTarget) =>
  !!(target as HTMLElement).closest?.(TYPED);

/**
 * Right-hand panel; records one undo step per gesture: on pointer down (buttons, sliders,
 * colours), on the first change of a typed field, or on each keyboard change of a slider,
 * colour or checkbox. Focus alone records nothing (R2).
 */
export function Panel({
  checkpoint,
  locked = false,
  children,
}: {
  checkpoint: () => void;
  /** Shown disabled and not editable: the agent's turn in joint mode (050/D6). */
  locked?: boolean;
  children: ReactNode;
}) {
  // set while a typed field has focus and has not changed yet
  const armed = useRef(false);
  // set from pointer down to pointer up: the press already recorded its step
  const pressing = useRef(false);
  const onChange = (target: EventTarget) => {
    if (isTyped(target) ? !armed.current : pressing.current) return;
    armed.current = false;
    checkpoint();
  };
  return (
    <aside
      className={locked ? "panel locked" : "panel"}
      aria-disabled={locked}
      onPointerDownCapture={(e) => {
        const typed = isTyped(e.target);
        // a typed field records on its first change; anything else, now
        armed.current = typed;
        if (typed) return;
        checkpoint();
        pressing.current = true;
        window.addEventListener(
          "pointerup",
          () => {
            pressing.current = false;
          },
          { once: true },
        );
      }}
      onFocusCapture={(e) => {
        armed.current = isTyped(e.target);
      }}
      onChangeCapture={(e) => onChange(e.target)}
    >
      {children}
    </aside>
  );
}
