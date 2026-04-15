// Simple Django Highlight Service
// Connects directly to your existing Django backend

export interface SimpleHighlight {
  id: string;
  user_name: string;
  verse: string;
  color: string;
  created_at?: string;
}

export interface SimpleComment {
  id: string;
  highlight_id: string;
  user_name: string;
  text: string;
  created_at?: string;
}

class SimpleDjangoHighlightService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      headers['X-CSRFToken'] = this.getCSRFToken();
    }
    return headers;
  }

  // Save highlight to your Django backend
  async saveHighlight(highlight: {
    id: string;
    userName: string;
    text: string;
    color: string;
    chapterNumber: number;
    documentId?: string;
  }): Promise<void> {
    try {
      const payload = {
        id: highlight.id,
        user_name: highlight.userName,
        document_id: highlight.documentId || 'epub-book',
        document_title: 'EPUB Book',
        chapter_number: highlight.chapterNumber,
        chapter_title: `Chapter ${highlight.chapterNumber}`,
        highlighted_text: highlight.text,
        color: highlight.color,
        start_offset: 0,
        end_offset: highlight.text.length,
      };

      await fetch(`${this.baseUrl}/book-highlights/`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(payload),
      });
    } catch (error) {
      // Silent fail - the app works with localStorage as fallback
    }
  }

  // Load highlights from your Django backend
  async loadHighlights(documentId?: string): Promise<SimpleHighlight[]> {
    try {
      const url = documentId
        ? `${this.baseUrl}/book-highlights/?document_id=${documentId}`
        : `${this.baseUrl}/book-highlights/`;
      const response = await fetch(url, {
        headers: this.getAuthHeaders(),
        credentials: 'include',
      });

      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      return [];
    }
  }

  // Save a comment on a highlight
  async saveComment(highlightId: string, comment: {
    text: string;
    userName: string;
  }): Promise<SimpleComment | null> {
    try {
      const response = await fetch(`${this.baseUrl}/book-highlights/${highlightId}/add_comment/`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          text: comment.text,
          user_name: comment.userName,
        }),
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  // Load comments for a highlight
  async loadComments(highlightId: string): Promise<SimpleComment[]> {
    try {
      const response = await fetch(`${this.baseUrl}/book-highlights/${highlightId}/comments/`, {
        headers: this.getAuthHeaders(),
        credentials: 'include',
      });

      if (response.ok) {
        return await response.json();
      }
      return [];
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