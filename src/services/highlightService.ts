// Highlight Service - Database Integration
export interface HighlightData {
  id: string;
  userId: string;
  userName: string;
  documentId: string;
  text: string;
  color: string;
  chapterNumber: number;
  position: {
    startOffset: number;
    endOffset: number;
  };
  comments: Array<{
    id: string;
    userId: string;
    userName: string;
    text: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

class HighlightService {
  private baseUrl: string;

  constructor() {
    // Use environment variable or default to your Django backend
    this.baseUrl = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) || 'http://127.0.0.1:8000/admin/api';
  }

  // Save highlight to your existing Django backend
  async saveHighlight(highlight: HighlightData): Promise<HighlightData> {
    try {
      console.log('💾 Saving highlight to Django backend:', highlight.id);
      
      // Adapt to your existing Django API structure
      const highlightPayload = {
        id: highlight.id,
        user_name: highlight.userName,
        document_id: highlight.documentId,
        text: highlight.text,
        color: highlight.color,
        chapter_number: highlight.chapterNumber,
        start_offset: highlight.position?.startOffset || 0,
        end_offset: highlight.position?.endOffset || highlight.text.length,
        verse: `${highlight.text.substring(0, 50)}...`, // Adapt to your verse field
      };

      const response = await fetch(`${this.baseUrl}/highlight/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': this.getCSRFToken(),
          'Authorization': `Token ${this.getAuthToken()}`,
        },
        body: JSON.stringify(highlightPayload),
      });

      if (!response.ok) {
        throw new Error(`Failed to save highlight: ${response.statusText}`);
      }

      const savedHighlight = await response.json();
      console.log('✅ Highlight saved to Django backend:', savedHighlight.id);
      return savedHighlight;
    } catch (error) {
      console.error('❌ Error saving highlight to Django backend:', error);
      // Fallback to localStorage for offline support
      this.saveToLocalStorage(highlight);
      throw error;
    }
  }

  // Load highlights from your Django backend
  async loadHighlights(documentId: string, userId?: string): Promise<HighlightData[]> {
    try {
      console.log('📚 Loading highlights from Django backend for document:', documentId);
      
      const url = new URL(`${this.baseUrl}/highlight/`);
      url.searchParams.append('document_id', documentId);
      if (userId) {
        url.searchParams.append('user_id', userId);
      }

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Token ${this.getAuthToken()}`,
          'X-CSRFToken': this.getCSRFToken(),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load highlights: ${response.statusText}`);
      }

      const djangoHighlights = await response.json();
      
      // Convert Django format to frontend format
      const highlights = djangoHighlights.map((h: any) => ({
        id: h.id,
        userId: h.user || 'unknown',
        userName: h.user_name || 'Unknown User',
        documentId: h.document_id || documentId,
        text: h.text,
        color: h.color,
        chapterNumber: h.chapter_number,
        position: {
          startOffset: h.start_offset || 0,
          endOffset: h.end_offset || h.text.length
        },
        comments: h.comments || [],
        createdAt: h.created_at,
        updatedAt: h.updated_at || h.created_at
      }));

      console.log(`✅ Loaded ${highlights.length} highlights from Django backend`);
      return highlights;
    } catch (error) {
      console.error('❌ Error loading highlights from Django backend:', error);
      // Fallback to localStorage
      return this.loadFromLocalStorage(documentId);
    }
  }

  // Update highlight in database
  async updateHighlight(highlightId: string, updates: Partial<HighlightData>): Promise<HighlightData> {
    try {
      console.log('🔄 Updating highlight in database:', highlightId);
      
      const response = await fetch(`${this.baseUrl}/highlight/${highlightId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update highlight: ${response.statusText}`);
      }

      const updatedHighlight = await response.json();
      console.log('✅ Highlight updated in database:', updatedHighlight.id);
      return updatedHighlight;
    } catch (error) {
      console.error('❌ Error updating highlight in database:', error);
      throw error;
    }
  }

  // Delete highlight from database
  async deleteHighlight(highlightId: string): Promise<void> {
    try {
      console.log('🗑️ Deleting highlight from database:', highlightId);
      
      const response = await fetch(`${this.baseUrl}/highlight/${highlightId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete highlight: ${response.statusText}`);
      }

      console.log('✅ Highlight deleted from database:', highlightId);
    } catch (error) {
      console.error('❌ Error deleting highlight from database:', error);
      throw error;
    }
  }

  // Real-time collaboration via WebSocket (Django Channels)
  subscribeToHighlightUpdates(documentId: string, callback: (highlight: HighlightData, action: 'created' | 'updated' | 'deleted') => void): () => void {
    const wsUrl = (typeof process !== 'undefined' && process.env?.REACT_APP_WS_URL) || 'ws://127.0.0.1:8000';
    const ws = new WebSocket(`${wsUrl}/ws/highlights/${documentId}/`);

    ws.onopen = () => {
      console.log('🔗 Connected to Django highlight updates WebSocket');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📡 Received highlight update from Django:', data);
        callback(data.highlight, data.action);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('Django WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('🔌 Disconnected from Django highlight updates WebSocket');
    };

    // Return cleanup function
    return () => {
      ws.close();
    };
  }

  // Fallback methods for offline support
  private saveToLocalStorage(highlight: HighlightData): void {
    try {
      const storageKey = `highlights_${highlight.documentId}`;
      const existing = localStorage.getItem(storageKey);
      const highlights = existing ? JSON.parse(existing) : [];
      
      const existingIndex = highlights.findIndex((h: HighlightData) => h.id === highlight.id);
      if (existingIndex >= 0) {
        highlights[existingIndex] = highlight;
      } else {
        highlights.push(highlight);
      }
      
      localStorage.setItem(storageKey, JSON.stringify(highlights));
      console.log('💾 Saved highlight to localStorage as fallback');
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  private loadFromLocalStorage(documentId: string): HighlightData[] {
    try {
      const storageKey = `highlights_${documentId}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const highlights = JSON.parse(saved);
        console.log(`📚 Loaded ${highlights.length} highlights from localStorage fallback`);
        return highlights;
      }
      return [];
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return [];
    }
  }

  private getAuthToken(): string {
    // Get Django authentication token
    return localStorage.getItem('django_auth_token') || localStorage.getItem('authToken') || '';
  }

  private getCSRFToken(): string {
    // Get Django CSRF token from cookie
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

  // Sync offline highlights when back online
  async syncOfflineHighlights(documentId: string): Promise<void> {
    try {
      const offlineHighlights = this.loadFromLocalStorage(documentId);
      const onlineHighlights = await this.loadHighlights(documentId);
      
      // Find highlights that exist offline but not online
      const toSync = offlineHighlights.filter(offline => 
        !onlineHighlights.find(online => online.id === offline.id)
      );

      console.log(`🔄 Syncing ${toSync.length} offline highlights`);
      
      for (const highlight of toSync) {
        await this.saveHighlight(highlight);
      }
      
      console.log('✅ Offline highlights synced successfully');
    } catch (error) {
      console.error('❌ Error syncing offline highlights:', error);
    }
  }
}

export const highlightService = new HighlightService();