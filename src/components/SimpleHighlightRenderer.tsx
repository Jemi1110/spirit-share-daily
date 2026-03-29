import React, { useEffect, useCallback } from 'react';

interface Highlight {
  id: string;
  userId: string;
  userName: string;
  text: string;
  color: string;
  chapterNumber: number;
  comments: any[];
}

interface SimpleHighlightRendererProps {
  highlights: Highlight[];
  onHighlightClick: (highlight: Highlight, event: MouseEvent) => void;
  currentChapter: number;
}

export const SimpleHighlightRenderer: React.FC<SimpleHighlightRendererProps> = ({
  highlights,
  onHighlightClick,
  currentChapter
}) => {

  const applyHighlights = useCallback(() => {
    
    // Get the chapter element
    const chapterElement = document.querySelector(`[data-chapter="${currentChapter}"]`);
    if (!chapterElement) {
      console.warn(`Chapter element not found: ${currentChapter}`);
      return;
    }

    // Get highlights for current chapter
    const chapterHighlights = highlights.filter(h => h.chapterNumber === currentChapter);

    if (chapterHighlights.length === 0) {
      return;
    }

    // Get the original HTML content
    let htmlContent = chapterElement.innerHTML;
    
    // Sort highlights by text length (longest first) to avoid conflicts
    const sortedHighlights = [...chapterHighlights].sort((a, b) => b.text.length - a.text.length);

    // Apply each highlight
    sortedHighlights.forEach(highlight => {
      
      // Simple string replacement first
      if (htmlContent.includes(highlight.text)) {
        const highlightSpan = `<span class="glose-highlight glose-highlight-${highlight.color}" data-highlight-id="${highlight.id}" data-user-name="${highlight.userName}" title="Highlight by ${highlight.userName}">${highlight.text}</span>`;
        htmlContent = htmlContent.replace(highlight.text, highlightSpan);
      } else {
        console.warn(`❌ Text not found in HTML: "${highlight.text.substring(0, 30)}..."`);
        // Let's see what the actual content looks like
      }
    });

    // Update the chapter content
    chapterElement.innerHTML = htmlContent;

    // Add click listeners to highlights
    const highlightElements = chapterElement.querySelectorAll('.glose-highlight');
    highlightElements.forEach(element => {
      element.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        
        const highlightId = element.getAttribute('data-highlight-id');
        const highlight = highlights.find(h => h.id === highlightId);
        
        if (highlight) {
          onHighlightClick(highlight, event as any);
        }
      });
    });

  }, [highlights, currentChapter, onHighlightClick]);

  // Apply highlights when they change or chapter changes
  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      applyHighlights();
    }, 100);

    return () => clearTimeout(timer);
  }, [applyHighlights]);

  // This component doesn't render anything visible
  return null;
};