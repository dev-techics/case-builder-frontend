import { type ClassValue, clsx } from 'clsx';
import { useEffect } from 'react';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
// return the selected text in the browser window
// utils/GetSelectedText.ts
export function useTextSelection() {
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      console.log('🟡 Selected text:', selection.toString());
      console.log('📏 Position:', rect);
    };

    document.addEventListener('mouseup', handleSelection);
    return () => document.removeEventListener('mouseup', handleSelection);
  }, []);
}
