import { useEffect, RefObject } from "react";

export function useModal(
  isOpen: boolean,
  onClose: () => void,
  modalRef: RefObject<HTMLElement | null>
) {
  useEffect(() => {
    if (!isOpen) return;

    // 1. Close on Escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // 2. Outside click close
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    // Delay slightly to prevent the click that triggers the modal from immediately closing it
    const clickTimer = setTimeout(() => {
      document.addEventListener("mousedown", handleOutsideClick);
    }, 10);

    // 3. Focus trapping
    const focusableSelectors =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    
    let handleTabKey: ((e: KeyboardEvent) => void) | null = null;

    const focusTimer = setTimeout(() => {
      if (!modalRef.current) return;
      
      const focusableElements = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(focusableSelectors)
      );

      if (focusableElements.length > 0) {
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        // Auto-focus first element
        firstElement.focus();

        handleTabKey = (e: KeyboardEvent) => {
          if (e.key !== "Tab") return;

          if (e.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstElement) {
              lastElement.focus();
              e.preventDefault();
            }
          } else {
            // Tab
            if (document.activeElement === lastElement) {
              firstElement.focus();
              e.preventDefault();
            }
          }
        };

        modalRef.current.addEventListener("keydown", handleTabKey);
      }
    }, 50);

    return () => {
      clearTimeout(clickTimer);
      clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleOutsideClick);
      if (modalRef.current && handleTabKey) {
        modalRef.current.removeEventListener("keydown", handleTabKey);
      }
    };
  }, [isOpen, onClose, modalRef]);
}
