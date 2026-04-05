import { useEffect, useRef } from 'react';

export function useBackButton(isOpen: boolean, onClose: () => void, modalId: string) {
  // To avoid cleanup popping when actually popped by hardware button
  const wasPoppedRef = useRef(false);
  const onCloseRef = useRef(onClose);

  // Always keep the latest callback
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    wasPoppedRef.current = false;

    // Push a unique state distinguishing this modal
    window.history.pushState({ modalId }, '');

    const handlePopState = (event: PopStateEvent) => {
      // Hardware back button was pressed. 
      wasPoppedRef.current = true;
      onCloseRef.current();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      // If the component is unmounting or isOpen changed to false programmatically
      // (not by pressing the hardware back button), we must pop the state we pushed.
      if (!wasPoppedRef.current) {
        window.history.back();
      }
    };
  }, [isOpen, modalId]);
}
