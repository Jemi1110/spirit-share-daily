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
    
    console.log(`🎨 Created highlight span with classes: ${span.className}`);
    
    // Add inline styles as fallback to ensure visibility
    span.style.backgroundColor = 'rgba(255, 235, 59, 0.6)';
    span.style.borderBottom = '2px solid #f57f17';
    span.style.padding = '2px 4px';
    span.style.borderRadius = '3px';
    span.style.cursor = 'pointer';
    
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

  const recreateRangeFromHighlight = useCallback((highlight: Highlight): Range | null => {
    try {
      // Find the chapter container
      const chapterElement = document.querySelector(`[data-chapter="${highlight.chapterNumber}"]`);
      if (!chapterElement) {
        console.warn(`Chapter ${highlight.chapterNumber} not found for highlight ${highlight.id}`);
        return null;
      }

      console.log(`🔍 Found chapter element for highlight ${highlight.id}`);

      // Simple approach: try to find the text directly in the chapter
      const chapterText = chapterElement.textContent || '';
      const textIndex = chapterText.indexOf(highlight.text);
      
      if (textIndex === -1) {
        console.warn(`Text "${highlight.text}" not found in chapter ${highlight.chapterNumber}`);
        return null;
      }

      console.log(`🎯 Found text at index ${textIndex} in chapter`);

      // Find the text node and offset using the simple approach
      return findTextInChapter(chapterElement, highlight.text);
    } catch (error) {
      console.error(`Error recreating range for highlight ${highlight.id}:`, error);
      return null;
    }
  }, []);

  const findTextInChapter = useCallback((chapterElement: Element, text: string): Range | null => {
    console.log(`🔍 Searching for text: "${text.substring(0, 30)}..." in chapter`);
    
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
      console.warn(`Could not find text nodes for: "${text.substring(0, 30)}..."`);
      return null;
    }

    console.log(`✅ Found text nodes for highlight`);
    const range = document.createRange();
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);

    return range;
  }, []);

  const renderHighlight = useCallback((highlight: Highlight) => {
    console.log(`🔍 Attempting to render highlight:`, {
      id: highlight.id,
      text: highlight.text.substring(0, 30),
      chapter: highlight.chapterNumber,
      currentChapter,
      alreadyRendered: renderedHighlightsRef.current.has(highlight.id)
    });

    // Skip if already rendered
    if (renderedHighlightsRef.current.has(highlight.id)) {
      console.log(`⏭️ Skipping already rendered highlight: ${highlight.id}`);
      return;
    }

    // Only render highlights for the current chapter
    if (highlight.chapterNumber !== currentChapter) {
      console.log(`⏭️ Skipping highlight for different chapter: ${highlight.chapterNumber} vs ${currentChapter}`);
      return;
    }

    console.log(`🎯 Recreating range for highlight: ${highlight.id}`);
    const range = recreateRangeFromHighlight(highlight);
    if (!range) {
      console.warn(`❌ Could not recreate range for highlight: ${highlight.id}`);
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
      console.log(`✨ Rendered highlight: "${highlight.text.substring(0, 30)}..." by ${highlight.userName}`);
    } catch (error) {
      console.error(`Error rendering highlight ${highlight.id}:`, error);
      
      // Fallback: try to find and highlight the text manually
      try {
        const chapterElement = document.querySelector(`[data-chapter="${highlight.chapterNumber}"]`);
        if (chapterElement) {
          const fallbackRange = findTextInChapter(chapterElement, highlight.text);
          if (fallbackRange) {
            const span = createHighlightSpan(highlight);
            fallbackRange.surroundContents(span);
            renderedHighlightsRef.current.add(highlight.id);
            console.log(`✨ Rendered highlight (fallback): "${highlight.text.substring(0, 30)}..."`);
          }
        }
      } catch (fallbackError) {
        console.error(`Fallback rendering also failed for highlight ${highlight.id}:`, fallbackError);
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