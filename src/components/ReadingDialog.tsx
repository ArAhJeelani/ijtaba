import {
  useEffect,
  useRef,
  type ReactNode,
  type KeyboardEventHandler,
} from "react";
export function ReadingDialog({
  children,
  onClose,
  onKeyDown,
}: {
  children: ReactNode;
  onClose: () => void;
  onKeyDown: KeyboardEventHandler<HTMLDialogElement>;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.showModal();
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="reading-overlay"
      aria-label="Dua reading mode"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onKeyDown={onKeyDown}
    >
      {children}
    </dialog>
  );
}
