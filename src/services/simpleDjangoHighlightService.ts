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
    this.baseUrl = 'http://127.0.0.1:8000/api';
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
      console.log('💾 Saving highlight to Django:', highlight.id);
      
      const payload = {
        id: highlight.id,
        user_name: highlight.userName,
        verse: `${highlight.text} (Chapter ${highlight.chapterNumber})`,
        color: highlight.color,
      };

      const response = await fetch(`${this.baseUrl}/highlight/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': this.getCSRFToken(),
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log('✅ Highlight saved to Django backend');
      } else {
        console.error('❌ Failed to save highlight:', response.statusText);
      }
    } catch (error) {
      console.error('❌ Error saving highlight to Django:', error);
    }
  }

  // Load highlights from your Django backend
  async loadHighlights(): Promise<SimpleHighlight[]> {
    try {
      console.log('📚 Loading highlights from Django backend');
      
      const response = await fetch(`${this.baseUrl}/highlight/`, {
        headers: {
          'X-CSRFToken': this.getCSRFToken(),
        },
      });

      if (response.ok) {
        const highlights = await response.json();
        console.log(`✅ Loaded ${highlights.length} highlights from Django`);
        return highlights;
      } else {
        console.error('❌ Failed to load highlights:', response.statusText);
        return [];
      }
    } catch (error) {
      console.error('❌ Error loading highlights from Django:', error);
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