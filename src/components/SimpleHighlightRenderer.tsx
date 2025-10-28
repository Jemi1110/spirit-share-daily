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
    console.log(`🎨 Applying highlights for chapter ${currentChapter}`);
    
    // Get the chapter element
    const chapterElement = document.querySelector(`[data-chapter="${currentChapter}"]`);
    if (!chapterElement) {
      console.warn(`Chapter element not found: ${currentChapter}`);
      return;
    }

    // Get highlights for current chapter
    const chapterHighlights = highlights.filter(h => h.chapterNumber === currentChapter);
    console.log(`🎨 Found ${chapterHighlights.length} highlights for chapter ${currentChapter}`);

    if (chapterHighlights.length === 0) {
      return;
    }

    // Get the original HTML content
    let htmlContent = chapterElement.innerHTML;
    
    // Sort highlights by text length (longest first) to avoid conflicts
    const sortedHighlights = [...chapterHighlights].sort((a, b) => b.text.length - a.text.length);

    // Apply each highlight
    sortedHighlights.forEach(highlight => {
      console.log(`🎨 Applying highlight: "${highlight.text.substring(0, 30)}..."`);
      console.log(`🔍 Original HTML length: ${htmlContent.length}`);
      console.log(`🔍 Looking for text: "${highlight.text}"`);
      console.log(`🔍 Text includes in HTML: ${htmlContent.includes(highlight.text)}`);
      
      // Simple string replacement first
      if (htmlContent.includes(highlight.text)) {
        const highlightSpan = `<span class="glose-highlight glose-highlight-${highlight.color}" data-highlight-id="${highlight.id}" data-user-name="${highlight.userName}" title="Highlight by ${highlight.userName}">${highlight.text}</span>`;
        htmlContent = htmlContent.replace(highlight.text, highlightSpan);
        console.log(`✅ Applied highlight for: "${highlight.text.substring(0, 30)}..."`);
      } else {
        console.warn(`❌ Text not found in HTML: "${highlight.text.substring(0, 30)}..."`);
        // Let's see what the actual content looks like
        console.log(`🔍 First 100 chars of HTML: "${htmlContent.substring(0, 100)}"`);
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
          console.log(`🖱️ Highlight clicked: ${highlight.text.substring(0, 30)}`);
          onHighlightClick(highlight, event as any);
        }
      });
    });

    console.log(`✅ Applied ${sortedHighlights.length} highlights to chapter ${currentChapter}`);
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