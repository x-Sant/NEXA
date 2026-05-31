import { useState, useEffect } from 'react';

export function useModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [tempIsOpen, setTempIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTempIsOpen(true);
      setIsClosing(false);
    } else if (tempIsOpen) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setTempIsOpen(false);
        setIsClosing(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, tempIsOpen]);

  return { isOpen, tempIsOpen, isClosing, open: () => setIsOpen(true), close: () => setIsOpen(false) };
}
