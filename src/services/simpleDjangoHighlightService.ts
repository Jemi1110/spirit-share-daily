// Simple Django Highlight Service
// Connects directly to your existing Django backend

export interface SimpleHighlight {
  id: string;
  user_name: string;
  verse: string;
  color: string;
  created_at?: string;
}

class SimpleDjangoHighlightService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
  }

  // Save highlight to your Django backend
  async saveHighlight(highlight: {
    id: string;
    userName: string;
    text: string;
    color: string;
    chapterNumber: number;
  }): Promise<void> {
    try {
      const payload = {
        id: highlight.id,
        user_name: highlight.userName,
        document_id: 'epub-book',
        document_title: 'EPUB Book',
        chapter_number: highlight.chapterNumber,
        chapter_title: `Chapter ${highlight.chapterNumber}`,
        highlighted_text: highlight.text,
        color: highlight.color,
        start_offset: 0,
        end_offset: highlight.text.length,
      };

      const response = await fetch(`${this.baseUrl}/book-highlights/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': this.getCSRFToken(),
        },
        credentials: 'include', // Important for session cookies
        body: JSON.stringify(payload),
      });

      // Silent operation - no console logs
    } catch (error) {
      // Silent fail - the app works with localStorage as fallback
    }
  }

  // Load highlights from your Django backend
  async loadHighlights(): Promise<SimpleHighlight[]> {
    try {
      const response = await fetch(`${this.baseUrl}/book-highlights/`, {
        headers: {
          'X-CSRFToken': this.getCSRFToken(),
        },
        credentials: 'include', // Important for session cookies
      });

      if (response.ok) {
        const highlights = await response.json();
        return highlights;
      } else {
        return [];
      }
    } catch (error) {
      return [];
    }
  }

  private getCSRFToken(): string {
    const name = 'csrftoken';
    let cookieValue = '';
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }
}

export const simpleDjangoHighlightService = new SimpleDjangoHighlightService();