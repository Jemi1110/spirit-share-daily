import React, { useEffect, useCallback, useRef } from 'react';

interface TextSelectionHandlerProps {
  onTextSelected: (selection: {
    selectedText: string;
    range: Range;
    boundingRect: DOMRect;
    chapterNumber: number;
  }) => void;
  onSelectionCleared: () => void;
  isEnabled: boolean;
  currentChapter: number;
}

export const TextSelectionHandler: React.FC<TextSelectionHandlerProps> = ({
  onTextSelected,
  onSelectionCleared,
  isEnabled,
  currentChapter
}) => {
  const selectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getCurrentChapterFromRange = useCallback((range: Range): number => {
    // Find the chapter element that contains this range
    let element = range.commonAncestorContainer;
    
    // If it's a text node, get its parent element
    if (element.nodeType === Node.TEXT_NODE) {
      element = element.parentElement!;
    }
    
    // Walk up the DOM to find the chapter container
    while (element && element !== document.body) {
      const chapterAttr = (element as Element).getAttribute?.('data-chapter');
      if (chapterAttr) {
        return parseInt(chapterAttr, 10);
      }
      element = element.parentElement!;
    }
    
    // Fallback to current chapter
    return currentChapter;
  }, [currentChapter]);

  const isValidSelection = useCallback((range: Range): boolean => {
    // Check if selection is within readable content
    const container = range.commonAncestorContainer;
    let element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container as Element;
    
    // Walk up to find if we're inside the reading content
    while (element && element !== document.body) {
      // Check if we're inside the Glose reader container
      if (element.hasAttribute?.('data-glose-container')) {
        return true;
      }
      
      // Exclude UI elements, navigation, etc.
      const classList = element.classList;
      if (classList?.contains('navigation') || 
          classList?.contains('comments-panel') ||
          classList?.contains('table-of-contents') ||
          classList?.contains('toolbar') ||
          element.tagName === 'BUTTON' ||
          element.tagName === 'INPUT') {
        return false;
      }
      
      element = element.parentElement;
    }
    
    return false;
  }, []);

  const handleSelectionChange = useCallback(() => {
    console.log('🎯 SELECTION: handleSelectionChange called, isEnabled:', isEnabled);
    
    if (!isEnabled) {
      console.log('🎯 SELECTION: Selection handling disabled');
      return;
    }

    // Clear any existing timeout
    if (selectionTimeoutRef.current) {
      clearTimeout(selectionTimeoutRef.current);
    }

    // Debounce selection changes
    selectionTimeoutRef.current = setTimeout(() => {
      const selection = window.getSelection();
      
      if (!selection || selection.rangeCount === 0) {
        onSelectionCleared();
        return;
      }

      const selectedText = selection.toString().trim();
      
      if (selectedText.length === 0) {
        onSelectionCleared();
        return;
      }

      // Minimum selection length to avoid accidental selections
      if (selectedText.length < 3) {
        return;
      }

      const range = selection.getRangeAt(0);
      
      // Validate that this is a legitimate content selection
      if (!isValidSelection(range)) {
        onSelectionCleared();
        return;
      }

      const rect = range.getBoundingClientRect();
      
      // Make sure the selection has a valid bounding rectangle
      if (rect.width === 0 || rect.height === 0) {
        return;
      }

      const chapterNumber = getCurrentChapterFromRange(range);

      console.log('🎯 SELECTION: Text selected:', {
        text: selectedText.substring(0, 50) + (selectedText.length > 50 ? '...' : ''),
        chapter: chapterNumber,
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        isEnabled,
        rangeValid: isValidSelection(range)
      });

      onTextSelected({
        selectedText,
        range: range.cloneRange(), // Clone to avoid issues with changing selections
        boundingRect: rect,
        chapterNumber
      });
    }, 150); // 150ms debounce
  }, [isEnabled, onTextSelected, onSelectionCleared, isValidSelection, getCurrentChapterFromRange]);

  const handleMouseUp = useCallback((event: MouseEvent) => {
    // Only handle left mouse button
    if (event.button !== 0) return;
    
    // Small delay to let the selection settle
    setTimeout(handleSelectionChange, 10);
  }, [handleSelectionChange]);

  const handleTouchEnd = useCallback(() => {
    // Handle touch selections on mobile
    setTimeout(handleSelectionChange, 100);
  }, [handleSelectionChange]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    // Handle keyboard selections (Shift + arrows, etc.)
    if (event.shiftKey || event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      setTimeout(handleSelectionChange, 10);
    }
    
    // Clear selection on Escape
    if (event.key === 'Escape') {
      window.getSelection()?.removeAllRanges();
      onSelectionCleared();
    }
  }, [handleSelectionChange, onSelectionCleared]);

  useEffect(() => {
    if (!isEnabled) {
      // Clear any existing selection when disabled
      window.getSelection()?.removeAllRanges();
      onSelectionCleared();
      return;
    }

    // Add event listeners
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      // Cleanup
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('selectionchange', handleSelectionChange);
      
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
      }
    };
  }, [isEnabled, handleMouseUp, handleTouchEnd, handleKeyUp, handleSelectionChange, onSelectionCleared]);

  // This component doesn't render anything, it just handles events
  return null;
};