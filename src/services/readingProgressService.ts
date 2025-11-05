// Reading Progress Service - Save and restore reading position

export interface ReadingProgress {
  id?: number;
  document_id: string;
  current_chapter: number;
  scroll_position: number;
  total_chapters: number;
  reading_time_minutes: number;
  progress_percentage?: number;
  last_read_at?: string;
  created_at?: string;
  updated_at?: string;
}

class ReadingProgressService {
  private baseUrl: string;

  constructor() {
    // Use Vite environment variable or default to Django API
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
  }

  // Save reading progress to Django backend
  async saveProgress(progress: any): Promise<void> {
    try {
      console.log('💾 Saving reading progress:', progress);
      
      const csrfToken = await this.getCSRFToken();
      const response = await fetch(`${this.baseUrl}/reading-progress/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include', // Important for session cookies and CSRF
        body: JSON.stringify(progress),
      });

      if (response.ok) {
        console.log('✅ Reading progress saved to Django');
      } else {
        const errorText = await response.text();
        console.error(`❌ Failed to save progress to Django (${response.status}):`, errorText);
        
        // Provide specific error information
        if (response.status === 403) {
          console.error('🔐 Authentication/CSRF error - check Django setup');
        } else if (response.status === 404) {
          console.error('🔍 Endpoint not found - check Django URLs');
        }
        
        // Fallback to localStorage
        this.saveToLocalStorage(progress);
      }
    } catch (error) {
      console.error('❌ Error saving progress to Django:', error);
      // Fallback to localStorage
      this.saveToLocalStorage(progress);
    }
  }

  // Load reading progress from Django backend
  async loadProgress(documentId: string, userId: string): Promise<ReadingProgress | null> {
    try {
      console.log('📚 Loading reading progress for:', documentId);
      
      const csrfToken = await this.getCSRFToken();
      const response = await fetch(`${this.baseUrl}/reading-progress/?document_id=${documentId}`, {
        headers: {
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include', // Important for session cookies
      });

      if (response.ok) {
        const progressData = await response.json();
        if (progressData.length > 0) {
          console.log('✅ Loaded reading progress from Django:', progressData[0]);
          return progressData[0];
        }
      }
    } catch (error) {
      console.error('❌ Error loading progress from Django:', error);
    }

    // Fallback to localStorage
    return this.loadFromLocalStorage(documentId, userId);
  }

  // Auto-save progress every few seconds
  startAutoSave(
    documentId: string, 
    userId: string, 
    getCurrentChapter: () => number,
    getScrollPosition: () => number,
    getTotalChapters: () => number
  ): () => void {
    const interval = setInterval(() => {
      const progress = {
        document_id: documentId,
        current_chapter: getCurrentChapter(),
        scroll_position: getScrollPosition(),
        total_chapters: getTotalChapters(),
        reading_time_minutes: this.getReadingTime(documentId)
      };

      this.saveProgress(progress);
    }, 10000); // Save every 10 seconds

    console.log('🔄 Auto-save reading progress started');

    // Return cleanup function
    return () => {
      clearInterval(interval);
      console.log('🛑 Auto-save reading progress stopped');
    };
  }

  // Fallback methods for offline support
  private saveToLocalStorage(progress: any): void {
    try {
      const storageKey = `reading_progress_${progress.document_id}_current-user`;
      localStorage.setItem(storageKey, JSON.stringify(progress));
      console.log('💾 Reading progress saved to localStorage');
    } catch (error) {
      console.error('Error saving progress to localStorage:', error);
    }
  }

  private loadFromLocalStorage(documentId: string, userId: string): ReadingProgress | null {
    try {
      const storageKey = `reading_progress_${documentId}_current-user`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const progress = JSON.parse(saved);
        console.log('📚 Loaded reading progress from localStorage:', progress);
        return progress;
      }
    } catch (error) {
      console.error('Error loading progress from localStorage:', error);
    }
    return null;
  }

  private getReadingTime(documentId: string): number {
    const startTimeKey = `reading_start_${documentId}`;
    const startTime = localStorage.getItem(startTimeKey);
    
    if (!startTime) {
      localStorage.setItem(startTimeKey, Date.now().toString());
      return 0;
    }
    
    const elapsed = Date.now() - parseInt(startTime);
    return Math.floor(elapsed / (1000 * 60)); // Convert to minutes
  }

  private async getCSRFToken(): Promise<string> {
    // First try to get CSRF token from cookie
    let token = this.getCSRFTokenFromCookie();
    
    if (!token) {
      // Fallback: fetch CSRF token from Django endpoint
      try {
        console.log('🔐 Fetching CSRF token from Django...');
        const response = await fetch(`${this.baseUrl}/csrf/`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          token = data.csrfToken;
          console.log('✅ CSRF token fetched from Django');
        }
      } catch (error) {
        console.warn('⚠️ Could not fetch CSRF token from Django:', error);
      }
    }
    
    return token || '';
  }

  private getCSRFTokenFromCookie(): string {
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

export const readingProgressService = new ReadingProgressService();