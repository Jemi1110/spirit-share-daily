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
  currentChapter?: number; // Kept for compatibility but ignored for rendering cycles
}

import { restoreRangeByOffset } from '../utils/highlightUtils';

export const HighlightRenderer: React.FC<HighlightRendererProps> = ({
  highlights,
  onHighlightClick
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
    
    // Fallback inline styles
    span.style.cursor = 'pointer';
    span.style.position = 'relative';
    span.style.zIndex = '1';
    
    // Click handler
    span.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      onHighlightClick(highlight, event as any);
    });

    span.addEventListener('mouseenter', () => {
      span.style.opacity = '0.8';
    });

    span.addEventListener('mouseleave', () => {
      span.style.opacity = '1';
    });

    return span;
  }, [onHighlightClick]);

  const removeHighlightSpan = useCallback((id: string) => {
    // Finds and safely unwraps highlight boundaries to preserve original DOM markup tags
    const spans = document.querySelectorAll(`.glose-highlight[data-highlight-id="${id}"]`);
    spans.forEach(span => {
      const parent = span.parentNode;
      if (parent) {
        const fragment = document.createDocumentFragment();
        while (span.firstChild) {
          fragment.appendChild(span.firstChild);
        }
        parent.replaceChild(fragment, span);
      }
    });
    renderedHighlightsRef.current.delete(id);
  }, []);

  const recreateRangeFromHighlight = useCallback((highlight: Highlight, chapterElement: Element): Range | null => {
    return restoreRangeByOffset(chapterElement, highlight.textRange.startOffset, highlight.textRange.endOffset);
  }, []);

  const renderHighlight = useCallback((highlight: Highlight) => {
    if (renderedHighlightsRef.current.has(highlight.id)) return;

    // Check if the target chapter container exists in the viewport / progressive load
    const chapterElement = document.querySelector(`[data-chapter="${highlight.chapterNumber}"]`);
    if (!chapterElement) return; // Wait until loaded

    const range = recreateRangeFromHighlight(highlight, chapterElement);
    if (!range) return;

    try {
      // Find all text nodes within the range dynamically
      const walker = document.createTreeWalker(
        range.commonAncestorContainer,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: function(node) {
            return range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
          }
        }
      );
      
      const nodesToWrap: Text[] = [];
      let currentNode = walker.nextNode() as Text;
      
      // If commonAncestorContainer is a text node itself, tree walker might skip it if we start from it without including root?
      // Actually, if commonAncestorContainer is Text, walker yields it as root if we use the right walker, but let's just check it.
      if (range.commonAncestorContainer.nodeType === Node.TEXT_NODE) {
        nodesToWrap.push(range.commonAncestorContainer as Text);
      } else {
        while (currentNode) {
          nodesToWrap.push(currentNode);
          currentNode = walker.nextNode() as Text;
        }
      }

      if (nodesToWrap.length === 0) return;

      // Wrap each text node's selected portion individually (guaranteed to not break DOM or CSS)
      nodesToWrap.forEach(textNode => {
        const span = createHighlightSpan(highlight);
        const wrapRange = document.createRange();
        
        if (textNode === range.startContainer && textNode === range.endContainer) {
          wrapRange.setStart(textNode, range.startOffset);
          wrapRange.setEnd(textNode, range.endOffset);
        } else if (textNode === range.startContainer) {
          wrapRange.setStart(textNode, range.startOffset);
          wrapRange.setEnd(textNode, textNode.length);
        } else if (textNode === range.endContainer) {
          wrapRange.setStart(textNode, 0);
          wrapRange.setEnd(textNode, range.endOffset);
        } else {
          wrapRange.selectNodeContents(textNode);
        }
        
        // Skip empty ranges
        if (wrapRange.toString().length === 0) return;

        wrapRange.surroundContents(span);
      });
      
      renderedHighlightsRef.current.add(highlight.id);
    } catch (error) {
       console.warn(`Highlight extraction skipped due to incompatible elements wrap logic for HTML. Offset limits hit.`, error);
    }
  }, [createHighlightSpan, recreateRangeFromHighlight]);

  // Main sync effect completely decoupled from 'currentChapter' scroll limits
  useEffect(() => {
    // 1. Differentiate and Delete Removed Highlights
    const highlightIds = new Set(highlights.map(h => h.id));
    const renderedArray = Array.from(renderedHighlightsRef.current);
    
    renderedArray.forEach(id => {
      if (!highlightIds.has(id)) {
        removeHighlightSpan(id);
      }
    });

    // 2. Render procedure for new components
    const triggerRenderHighlights = () => {
      highlights.forEach(highlight => {
        // The container might have been completely re-rendered by React, destroying our <span> injections.
        // We must check if the span physically exists in the DOM, rather than relying solely on our ref memory.
        const stillInDOM = document.querySelector(`.glose-highlight[data-highlight-id="${highlight.id}"]`);
        
        if (!stillInDOM) {
           renderedHighlightsRef.current.delete(highlight.id); // Clear false memory
           renderHighlight(highlight);
        }
      });
    };

    triggerRenderHighlights();

    // 3. Attach standard DOM observer globally to automatically hook elements on dynamic infinite scroll
    const observer = new MutationObserver((mutations) => {
      let isLayoutChanged = false;
      mutations.forEach(mutation => {
        if (mutation.addedNodes.length > 0) isLayoutChanged = true;
      });
      
      if (isLayoutChanged) {
        // Small wait to ensure React DOM hydration finished 
        setTimeout(triggerRenderHighlights, 150);
      }
    });

    const targetNode = document.querySelector('[data-glose-container]') || document.body;
    observer.observe(targetNode, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
    };
  }, [highlights, renderHighlight, removeHighlightSpan]);

  // Global unmount cleanup
  useEffect(() => {
    return () => {
      const allIds = Array.from(renderedHighlightsRef.current);
      allIds.forEach(id => removeHighlightSpan(id));
    };
  }, [removeHighlightSpan]);

  return null;
};