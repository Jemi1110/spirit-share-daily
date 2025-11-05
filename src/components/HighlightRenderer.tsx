import React, { useEffect, useCallback, useRef } from 'react';

interface Highlight {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  color: string;
  chapterNumber: number;
  textRange: {
    startOffset: number;
    endOffset: number;
    startContainer: string;
    endContainer: string;
  };
  position: { x: number; y: number };
  comments: any[];
  createdAt: string;
  updatedAt: string;
}

interface HighlightRendererProps {
  highlights: Highlight[];
  onHighlightClick: (highlight: Highlight, event: MouseEvent) => void;
  currentChapter: number;
}

export const HighlightRenderer: React.FC<HighlightRendererProps> = ({
  highlights,
  onHighlightClick,
  currentChapter
}) => {
  const renderedHighlightsRef = useRef<Set<string>>(new Set());

  const createHighlightSpan = useCallback((highlight: Highlight): HTMLSpanElement => {
    const span = document.createElement('span');
    span.className = `glose-highlight glose-highlight-${highlight.color}`;
    span.dataset.highlightId = highlight.id;
    span.dataset.userId = highlight.userId;
    span.dataset.userName = highlight.userName;
    span.dataset.chapterNumber = highlight.chapterNumber.toString();
    span.title = `Highlight by ${highlight.userName}`;
    
    // Let CSS handle the styling, but add some fallback inline styles for visibility
    span.style.cursor = 'pointer';
    span.style.position = 'relative';
    span.style.zIndex = '1';
    
    // Add click handler
    span.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      onHighlightClick(highlight, event as any);
    });

    // Add hover effects
    span.addEventListener('mouseenter', () => {
      span.style.opacity = '0.8';
    });

    span.addEventListener('mouseleave', () => {
      span.style.opacity = '1';
    });

    return span;
  }, [onHighlightClick]);

  const findTextNodeAndOffset = useCallback((container: Element, offset: number): { node: Text; offset: number } | null => {
    let currentOffset = 0;
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      null
    );

    let node = walker.nextNode() as Text;
    while (node) {
      const nodeLength = node.textContent?.length || 0;
      if (currentOffset + nodeLength >= offset) {
        return {
          node,
          offset: offset - currentOffset
        };
      }
      currentOffset += nodeLength;
      node = walker.nextNode() as Text;
    }

    return null;
  }, []);

  const recreateRangeFromHighlight = useCallback((highlight: Highlight, chapterElement: Element): Range | null => {
    try {
      // Simple approach: try to find the text directly in the chapter
      const chapterText = chapterElement.textContent || '';
      const textIndex = chapterText.indexOf(highlight.text);
      
      if (textIndex === -1) {
        return null;
      }

      // Find the text node and offset using the simple approach
      return findTextInChapter(chapterElement, highlight.text);
    } catch (error) {
      return null;
    }
  }, []);

  const findTextInChapter = useCallback((chapterElement: Element, text: string): Range | null => {
    // Use TreeWalker to find text nodes
    const walker = document.createTreeWalker(
      chapterElement,
      NodeFilter.SHOW_TEXT,
      null
    );

    let currentNode = walker.nextNode() as Text;
    let accumulatedText = '';
    let startNode: Text | null = null;
    let startOffset = 0;
    let endNode: Text | null = null;
    let endOffset = 0;

    while (currentNode) {
      const nodeText = currentNode.textContent || '';
      const beforeLength = accumulatedText.length;
      accumulatedText += nodeText;

      // Check if our target text starts in this node
      const targetIndex = accumulatedText.indexOf(text);
      if (targetIndex !== -1 && targetIndex >= beforeLength) {
        // Text starts in this node
        startNode = currentNode;
        startOffset = targetIndex - beforeLength;
        
        // Check if text also ends in this node
        if (targetIndex + text.length <= accumulatedText.length) {
          endNode = currentNode;
          endOffset = startOffset + text.length;
          break;
        }
      }
      
      // Check if we found the start and now need to find the end
      if (startNode && targetIndex !== -1 && targetIndex + text.length <= accumulatedText.length) {
        endNode = currentNode;
        endOffset = (targetIndex + text.length) - beforeLength;
        break;
      }

      currentNode = walker.nextNode() as Text;
    }

    if (!startNode || !endNode) {
      return null;
    }

    const range = document.createRange();
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);

    return range;
  }, []);

  const renderHighlight = useCallback((highlight: Highlight) => {
    // Skip if already rendered
    if (renderedHighlightsRef.current.has(highlight.id)) {
      return;
    }

    // Find the chapter element for this highlight
    const chapterElement = document.querySelector(`[data-chapter="${highlight.chapterNumber}"]`);
    if (!chapterElement) {
      return;
    }

    const range = recreateRangeFromHighlight(highlight, chapterElement);
    if (!range) {
      return;
    }

    try {
      const span = createHighlightSpan(highlight);
      
      // Handle simple case where range doesn't cross element boundaries
      if (range.startContainer === range.endContainer) {
        range.surroundContents(span);
      } else {
        // Handle complex case where range crosses multiple elements
        const contents = range.extractContents();
        span.appendChild(contents);
        range.insertNode(span);
      }

      renderedHighlightsRef.current.add(highlight.id);
    } catch (error) {
      // Fallback: try to find and highlight the text manually
      try {
        const fallbackRange = findTextInChapter(chapterElement, highlight.text);
        if (fallbackRange) {
          const span = createHighlightSpan(highlight);
          fallbackRange.surroundContents(span);
          renderedHighlightsRef.current.add(highlight.id);
        }
      } catch (fallbackError) {
        // Silent fail
      }
    }
  }, [currentChapter, createHighlightSpan, recreateRangeFromHighlight, findTextInChapter]);

  const clearRenderedHighlights = useCallback(() => {
    // Remove all existing highlight spans
    const existingHighlights = document.querySelectorAll('.glose-highlight');
    existingHighlights.forEach(span => {
      const parent = span.parentNode;
      if (parent) {
        // Move the text content back to the parent and remove the span
        while (span.firstChild) {
          parent.insertBefore(span.firstChild, span);
        }
        parent.removeChild(span);
      }
    });

    renderedHighlightsRef.current.clear();
  }, []);

  // Render highlights when they change or chapter changes
  useEffect(() => {
    // Clear existing highlights
    clearRenderedHighlights();

    // Small delay to ensure DOM is ready
    setTimeout(() => {
      highlights.forEach(highlight => {
        renderHighlight(highlight);
      });
    }, 100);
  }, [highlights, currentChapter, renderHighlight, clearRenderedHighlights]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearRenderedHighlights();
    };
  }, [clearRenderedHighlights]);

  // This component doesn't render anything visible, it manipulates the DOM directly
  return null;
};