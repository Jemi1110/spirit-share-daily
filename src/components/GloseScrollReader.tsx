import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SimpleEpubBook, SimpleChapter } from '@/services/simpleEpubReader';

interface GloseScrollReaderProps {
  epubBook: SimpleEpubBook;
  onChapterChange: (chapterNumber: number) => void;
  currentChapter: number;
}

interface ContentChunk {
  chapterOrder: number;
  chapterTitle: string;
  content: string;
  isLoaded: boolean;
}

interface GloseScrollReaderRef {
  navigateToChapter: (chapterNumber: number) => void;
}

export const GloseScrollReader = React.forwardRef<GloseScrollReaderRef, GloseScrollReaderProps>(({
  epubBook,
  onChapterChange,
  currentChapter
}, ref) => {
  const [contentChunks, setContentChunks] = useState<ContentChunk[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Progressive loading like Glose - load first few chapters, then load more as user scrolls
  useEffect(() => {
    if (epubBook && epubBook.chapters.length > 0) {
      
      const chunks: ContentChunk[] = epubBook.chapters.map((chapter, index) => ({
        chapterOrder: chapter.order,
        chapterTitle: chapter.title,
        content: chapter.content,
        isLoaded: true, // TEMPORARY: Load all chapters immediately for smooth reading
      }));
      
      setContentChunks(chunks);
    }
  }, [epubBook, epubBook?.chapters?.length]); // Also depend on chapters length

  // Progressive loading function
  const loadMoreChapters = useCallback((currentChapterIndex: number) => {
    setContentChunks(prev => {
      const updated = [...prev];
      // Load next 2 chapters ahead of current position
      for (let i = currentChapterIndex; i < Math.min(currentChapterIndex + 3, updated.length); i++) {
        if (!updated[i].isLoaded) {
          updated[i] = { ...updated[i], isLoaded: true };
        }
      }
      return updated;
    });
  }, []);

  // Navigation function for external control
  const navigateToChapter = useCallback((chapterNumber: number) => {
    
    // Simple approach: just scroll to the chapter (all chapters should be loaded now)
    setTimeout(() => {
      const chapterElement = document.querySelector(`[data-chapter="${chapterNumber}"]`);
      
      if (chapterElement) {
        chapterElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        console.warn(`⚠️ GloseScrollReader: Chapter ${chapterNumber} not found`);
        // Check what chapters are available
        const allChapters = document.querySelectorAll('[data-chapter]');
        const availableChapters = Array.from(allChapters).map(el => el.getAttribute('data-chapter'));
      }
    }, 100);
  }, []);

  // Expose navigation function via ref
  React.useImperativeHandle(ref, () => ({
    navigateToChapter
  }), [navigateToChapter]);

  // Intersection Observer for progressive loading and chapter detection
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const chapterOrder = parseInt(entry.target.getAttribute('data-chapter') || '0');
            if (chapterOrder > 0) {
              // Notify parent about chapter change
              onChapterChange(chapterOrder);
              
              // Load more chapters progressively
              loadMoreChapters(chapterOrder - 1);
            }
          }
        });
      },
      {
        threshold: 0.3,
        rootMargin: '200px 0px 400px 0px' // Load chapters before user reaches them
      }
    );

    // Observe all chapter elements
    const chapterElements = document.querySelectorAll('[data-chapter]');
    chapterElements.forEach(element => observer.observe(element));

    return () => observer.disconnect();
  }, [contentChunks, onChapterChange, loadMoreChapters]);

  return (
    <div 
      ref={scrollContainerRef}
      data-glose-container
      style={{
        width: '100%',
        maxWidth: '800px',
        margin: '0 auto',
        padding: '2rem',
        lineHeight: '1.8',
        fontSize: '18px',
        fontFamily: 'Georgia, serif',
        color: '#333',
        backgroundColor: '#fff'
      }}
    >
      {contentChunks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
          <h2>Cargando libro...</h2>
          <p>Preparando {epubBook?.title}</p>
        </div>
      ) : (
        contentChunks.map((chunk, index) => (
          <div
            key={chunk.chapterOrder}
            data-chapter={chunk.chapterOrder}
            style={{
              marginBottom: '3rem',
              paddingBottom: '2rem',
              borderBottom: index < contentChunks.length - 1 ? '1px solid #eee' : 'none'
            }}
          >
            {/* Chapter Header */}
            <div style={{
              textAlign: 'center',
              marginBottom: '2rem',
              paddingBottom: '1rem',
              borderBottom: '2px solid #f0f0f0'
            }}>
              <h1 style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: '#2c3e50',
                margin: '0 0 0.5rem 0',
                lineHeight: '1.2',
                textTransform: chunk.chapterTitle.startsWith('Chapter ') ? 'none' : 'capitalize'
              }}>
                {chunk.chapterTitle}
              </h1>
              <p style={{
                fontSize: '1rem',
                color: '#7f8c8d',
                margin: '0',
              }}>
                Capítulo {chunk.chapterOrder} de {epubBook.totalChapters}
              </p>
            </div>
            
            {/* Chapter Content */}
            {chunk.isLoaded ? (
              <div
                style={{
                  textAlign: 'justify',
                  lineHeight: '1.8',
                  fontSize: '18px'
                }}
                dangerouslySetInnerHTML={{ 
                  __html: chunk.content 
                }}
              />
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '4rem 0',
                color: '#7f8c8d',
                fontStyle: 'italic',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                margin: '2rem 0'
              }}>
                <div style={{
                  display: 'inline-block',
                  width: '32px',
                  height: '32px',
                  border: '4px solid #e3e3e3',
                  borderTop: '4px solid #3498db',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginBottom: '1rem'
                }}></div>
                <p style={{ margin: '0', fontSize: '16px', fontWeight: '500' }}>
                  Cargando capítulo {chunk.chapterOrder}...
                </p>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '14px', opacity: '0.7' }}>
                  {chunk.chapterTitle}
                </p>
                <style>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}</style>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
});