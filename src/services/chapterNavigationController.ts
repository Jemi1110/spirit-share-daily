// Chapter Navigation Controller
// Manages chapter navigation state and progression for CONTENTS-based EPUB reading

import { 
  ClassifiedEpubContent, 
  EnhancedEpubChapter, 
  ChapterNavigationState,
  ChapterDisplayPreferences,
  ReadingSession,
  ChapterUtils
} from './epubTypes';

export interface NavigationEvent {
  type: 'chapter-changed' | 'progress-updated' | 'navigation-error';
  data: any;
  timestamp: Date;
}

export interface NavigationOptions {
  skipAuxiliaryContent: boolean;
  enableProgressTracking: boolean;
  persistSession: boolean;
  autoSaveInterval: number; // milliseconds
}

export class ChapterNavigationController {
  private currentContent: ClassifiedEpubContent | null = null;
  private currentChapterId: string | null = null;
  private navigationState: ChapterNavigationState | null = null;
  private displayPreferences: ChapterDisplayPreferences;
  private readingSession: ReadingSession | null = null;
  private eventListeners: Map<string, ((event: NavigationEvent) => void)[]> = new Map();
  private autoSaveTimer: NodeJS.Timeout | null = null;
  private options: NavigationOptions;

  private defaultOptions: NavigationOptions = {
    skipAuxiliaryContent: true,
    enableProgressTracking: true,
    persistSession: true,
    autoSaveInterval: 30000 // 30 seconds
  };

  private defaultPreferences: ChapterDisplayPreferences = {
    showAuxiliaryContent: false,
    showChapterNumbers: true,
    groupByParts: false,
    sortOrder: 'original',
    hideEmptyChapters: true
  };

  constructor(
    options: Partial<NavigationOptions> = {},
    preferences: Partial<ChapterDisplayPreferences> = {}
  ) {
    this.options = { ...this.defaultOptions, ...options };
    this.displayPreferences = { ...this.defaultPreferences, ...preferences };
    
    console.log('ChapterNavigationController: Initialized with options:', this.options);
  }

  /**
   * Initialize navigation with EPUB content
   */
  async initialize(content: ClassifiedEpubContent, documentId?: string, userId?: string): Promise<void> {
    try {
      console.log(`ChapterNavigationController: Initializing with ${content.totalRealChapters} real chapters`);
      
      this.currentContent = content;
      
      // Initialize reading session if tracking is enabled
      if (this.options.enableProgressTracking && documentId && userId) {
        this.readingSession = {
          documentId,
          userId,
          currentChapter: '',
          currentPosition: 0,
          totalProgress: 0,
          lastReadAt: new Date(),
          readingTimeMinutes: 0,
          chaptersCompleted: [],
          bookmarks: [],
          notes: []
        };
        
        // Try to load existing session
        await this.loadSession();
      }
      
      // Set initial chapter (first real chapter or last read chapter)
      const initialChapter = this.getInitialChapter();
      if (initialChapter) {
        await this.navigateToChapter(initialChapter.id);
      }
      
      // Start auto-save if enabled
      if (this.options.persistSession && this.readingSession) {
        this.startAutoSave();
      }
      
      this.emitEvent('chapter-changed', {
        content: this.currentContent,
        navigationState: this.navigationState
      });
      
      console.log('ChapterNavigationController: Initialization complete');
    } catch (error) {
      console.error('ChapterNavigationController: Initialization failed:', error);
      this.emitEvent('navigation-error', { error: error.message });
      throw error;
    }
  }

  /**
   * Navigate to specific chapter by ID
   */
  async navigateToChapter(chapterId: string): Promise<boolean> {
    if (!this.currentContent) {
      console.error('ChapterNavigationController: No content loaded');
      return false;
    }

    try {
      const chapter = ChapterUtils.findChapterById(this.getVisibleChapters(), chapterId);
      if (!chapter) {
        console.error(`ChapterNavigationController: Chapter not found: ${chapterId}`);
        return false;
      }

      console.log(`ChapterNavigationController: Navigating to chapter: ${chapter.title}`);
      
      this.currentChapterId = chapterId;
      this.navigationState = ChapterUtils.generateNavigationState(
        this.getVisibleChapters(), 
        chapterId
      );

      // Update reading session
      if (this.readingSession) {
        this.readingSession.currentChapter = chapterId;
        this.readingSession.currentPosition = 0;
        this.readingSession.totalProgress = this.navigationState?.progress || 0;
        this.readingSession.lastReadAt = new Date();
      }

      this.emitEvent('chapter-changed', {
        chapter,
        navigationState: this.navigationState,
        content: this.currentContent
      });

      this.emitEvent('progress-updated', {
        progress: this.navigationState?.progress || 0,
        currentChapter: this.navigationState?.currentIndex || 0,
        totalChapters: this.navigationState?.totalChapters || 0
      });

      return true;
    } catch (error) {
      console.error('ChapterNavigationController: Navigation failed:', error);
      this.emitEvent('navigation-error', { error: error.message });
      return false;
    }
  }

  /**
   * Navigate to next chapter
   */
  async navigateToNext(): Promise<boolean> {
    if (!this.navigationState?.hasNext) {
      console.log('ChapterNavigationController: No next chapter available');
      return false;
    }

    const nextChapter = this.navigationState.nextChapter;
    if (!nextChapter) {
      return false;
    }

    console.log(`ChapterNavigationController: Navigating to next chapter: ${nextChapter.title}`);
    return await this.navigateToChapter(nextChapter.id);
  }

  /**
   * Navigate to previous chapter
   */
  async navigateToPrevious(): Promise<boolean> {
    if (!this.navigationState?.hasPrevious) {
      console.log('ChapterNavigationController: No previous chapter available');
      return false;
    }

    const previousChapter = this.navigationState.previousChapter;
    if (!previousChapter) {
      return false;
    }

    console.log(`ChapterNavigationController: Navigating to previous chapter: ${previousChapter.title}`);
    return await this.navigateToChapter(previousChapter.id);
  }

  /**
   * Navigate to chapter by index (1-based)
   */
  async navigateToIndex(index: number): Promise<boolean> {
    const visibleChapters = this.getVisibleChapters();
    
    if (index < 1 || index > visibleChapters.length) {
      console.error(`ChapterNavigationController: Invalid chapter index: ${index}`);
      return false;
    }

    const chapter = visibleChapters[index - 1];
    return await this.navigateToChapter(chapter.id);
  }

  /**
   * Get current navigation state
   */
  getCurrentNavigationState(): ChapterNavigationState | null {
    return this.navigationState;
  }

  /**
   * Get current chapter
   */
  getCurrentChapter(): EnhancedEpubChapter | null {
    return this.navigationState?.currentChapter || null;
  }

  /**
   * Get all visible chapters based on display preferences
   */
  getVisibleChapters(): EnhancedEpubChapter[] {
    if (!this.currentContent) return [];

    let chapters = [...this.currentContent.chapters];
    
    // Include auxiliary content if preference is set
    if (this.displayPreferences.showAuxiliaryContent) {
      chapters = [...chapters, ...this.currentContent.auxiliaryContent];
    }

    // Filter out empty chapters if preference is set
    if (this.displayPreferences.hideEmptyChapters) {
      chapters = chapters.filter(chapter => chapter.hasRealContent);
    }

    // Sort chapters
    switch (this.displayPreferences.sortOrder) {
      case 'alphabetical':
        chapters.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'original':
      default:
        chapters = ChapterUtils.sortChaptersByOrder(chapters);
        break;
    }

    return ChapterUtils.getVisibleChapters(chapters);
  }

  /**
   * Get chapter list for display
   */
  getChapterList(): Array<{
    id: string;
    title: string;
    displayTitle: string;
    order: number;
    isCurrent: boolean;
    isCompleted: boolean;
    type: 'chapter' | 'auxiliary' | 'metadata';
  }> {
    const visibleChapters = this.getVisibleChapters();
    const completedChapters = this.readingSession?.chaptersCompleted || [];

    return visibleChapters.map((chapter, index) => ({
      id: chapter.id,
      title: chapter.title,
      displayTitle: ChapterUtils.formatChapterTitle(chapter, this.displayPreferences.showChapterNumbers),
      order: index + 1,
      isCurrent: chapter.id === this.currentChapterId,
      isCompleted: completedChapters.includes(chapter.id),
      type: chapter.type
    }));
  }

  /**
   * Get reading progress information
   */
  getProgressInfo(): {
    currentChapter: number;
    totalChapters: number;
    percentage: number;
    chaptersCompleted: number;
    estimatedTimeRemaining: number;
  } {
    const visibleChapters = this.getVisibleChapters();
    const completedChapters = this.readingSession?.chaptersCompleted || [];
    const currentIndex = this.navigationState?.currentIndex || 0;

    // Estimate reading time (assuming 200 words per minute, 1000 words per chapter average)
    const averageWordsPerChapter = 1000;
    const wordsPerMinute = 200;
    const remainingChapters = visibleChapters.length - currentIndex;
    const estimatedTimeRemaining = (remainingChapters * averageWordsPerChapter) / wordsPerMinute;

    return {
      currentChapter: currentIndex + 1,
      totalChapters: visibleChapters.length,
      percentage: this.navigationState?.progress || 0,
      chaptersCompleted: completedChapters.length,
      estimatedTimeRemaining: Math.round(estimatedTimeRemaining)
    };
  }

  /**
   * Mark current chapter as completed
   */
  markChapterCompleted(): void {
    if (!this.readingSession || !this.currentChapterId) return;

    if (!this.readingSession.chaptersCompleted.includes(this.currentChapterId)) {
      this.readingSession.chaptersCompleted.push(this.currentChapterId);
      console.log(`ChapterNavigationController: Marked chapter as completed: ${this.currentChapterId}`);
      
      this.emitEvent('progress-updated', {
        chaptersCompleted: this.readingSession.chaptersCompleted.length,
        totalChapters: this.getVisibleChapters().length
      });
    }
  }

  /**
   * Update display preferences
   */
  updateDisplayPreferences(preferences: Partial<ChapterDisplayPreferences>): void {
    this.displayPreferences = { ...this.displayPreferences, ...preferences };
    console.log('ChapterNavigationController: Updated display preferences:', this.displayPreferences);
    
    // Refresh navigation state with new preferences
    if (this.currentChapterId) {
      this.navigationState = ChapterUtils.generateNavigationState(
        this.getVisibleChapters(), 
        this.currentChapterId
      );
      
      this.emitEvent('chapter-changed', {
        navigationState: this.navigationState,
        content: this.currentContent
      });
    }
  }

  /**
   * Add event listener
   */
  addEventListener(eventType: string, callback: (event: NavigationEvent) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(callback);
  }

  /**
   * Remove event listener
   */
  removeEventListener(eventType: string, callback: (event: NavigationEvent) => void): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Get initial chapter (first real chapter or last read)
   */
  private getInitialChapter(): EnhancedEpubChapter | null {
    const visibleChapters = this.getVisibleChapters();
    if (visibleChapters.length === 0) return null;

    // If we have a reading session with a current chapter, use that
    if (this.readingSession?.currentChapter) {
      const lastChapter = ChapterUtils.findChapterById(visibleChapters, this.readingSession.currentChapter);
      if (lastChapter) {
        console.log('ChapterNavigationController: Resuming from last read chapter:', lastChapter.title);
        return lastChapter;
      }
    }

    // Otherwise, start with the first real chapter
    const firstChapter = visibleChapters[0];
    console.log('ChapterNavigationController: Starting with first chapter:', firstChapter.title);
    return firstChapter;
  }

  /**
   * Load existing reading session
   */
  private async loadSession(): Promise<void> {
    if (!this.readingSession) return;

    try {
      // This would typically load from localStorage or a backend API
      const sessionKey = `reading-session-${this.readingSession.documentId}-${this.readingSession.userId}`;
      const savedSession = localStorage.getItem(sessionKey);
      
      if (savedSession) {
        const parsedSession = JSON.parse(savedSession);
        this.readingSession = {
          ...this.readingSession,
          ...parsedSession,
          lastReadAt: new Date(parsedSession.lastReadAt)
        };
        console.log('ChapterNavigationController: Loaded existing session:', this.readingSession);
      }
    } catch (error) {
      console.warn('ChapterNavigationController: Failed to load session:', error);
    }
  }

  /**
   * Save reading session
   */
  private async saveSession(): Promise<void> {
    if (!this.readingSession || !this.options.persistSession) return;

    try {
      const sessionKey = `reading-session-${this.readingSession.documentId}-${this.readingSession.userId}`;
      localStorage.setItem(sessionKey, JSON.stringify(this.readingSession));
      console.log('ChapterNavigationController: Session saved');
    } catch (error) {
      console.warn('ChapterNavigationController: Failed to save session:', error);
    }
  }

  /**
   * Start auto-save timer
   */
  private startAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }

    this.autoSaveTimer = setInterval(() => {
      this.saveSession();
    }, this.options.autoSaveInterval);
  }

  /**
   * Emit navigation event
   */
  private emitEvent(type: NavigationEvent['type'], data: any): void {
    const event: NavigationEvent = {
      type,
      data,
      timestamp: new Date()
    };

    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('ChapterNavigationController: Event listener error:', error);
        }
      });
    }
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }

    // Save session one final time
    this.saveSession();

    // Clear event listeners
    this.eventListeners.clear();

    console.log('ChapterNavigationController: Disposed');
  }
}

// Export a factory function for easy creation
export function createChapterNavigationController(
  options?: Partial<NavigationOptions>,
  preferences?: Partial<ChapterDisplayPreferences>
): ChapterNavigationController {
  return new ChapterNavigationController(options, preferences);
}