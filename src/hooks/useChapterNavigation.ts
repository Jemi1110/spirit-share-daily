// React Hook for Chapter Navigation
// Provides easy integration of ChapterNavigationController with React components

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ChapterNavigationController, 
  NavigationEvent,
  NavigationOptions,
  createChapterNavigationController 
} from '../services/chapterNavigationController';
import { 
  ClassifiedEpubContent, 
  EnhancedEpubChapter, 
  ChapterNavigationState,
  ChapterDisplayPreferences 
} from '../services/epubTypes';

export interface UseChapterNavigationOptions {
  documentId?: string;
  userId?: string;
  navigationOptions?: Partial<NavigationOptions>;
  displayPreferences?: Partial<ChapterDisplayPreferences>;
}

export interface ChapterNavigationHook {
  // State
  isInitialized: boolean;
  currentChapter: EnhancedEpubChapter | null;
  navigationState: ChapterNavigationState | null;
  chapterList: Array<{
    id: string;
    title: string;
    displayTitle: string;
    order: number;
    isCurrent: boolean;
    isCompleted: boolean;
    type: 'chapter' | 'auxiliary' | 'metadata';
  }>;
  progressInfo: {
    currentChapter: number;
    totalChapters: number;
    percentage: number;
    chaptersCompleted: number;
    estimatedTimeRemaining: number;
  };
  
  // Actions
  initialize: (content: ClassifiedEpubContent) => Promise<void>;
  navigateToChapter: (chapterId: string) => Promise<boolean>;
  navigateToNext: () => Promise<boolean>;
  navigateToPrevious: () => Promise<boolean>;
  navigateToIndex: (index: number) => Promise<boolean>;
  markChapterCompleted: () => void;
  updateDisplayPreferences: (preferences: Partial<ChapterDisplayPreferences>) => void;
  
  // Utilities
  canGoNext: boolean;
  canGoPrevious: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useChapterNavigation(options: UseChapterNavigationOptions = {}): ChapterNavigationHook {
  const controllerRef = useRef<ChapterNavigationController | null>(null);
  
  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentChapter, setCurrentChapter] = useState<EnhancedEpubChapter | null>(null);
  const [navigationState, setNavigationState] = useState<ChapterNavigationState | null>(null);
  const [chapterList, setChapterList] = useState<any[]>([]);
  const [progressInfo, setProgressInfo] = useState({
    currentChapter: 0,
    totalChapters: 0,
    percentage: 0,
    chaptersCompleted: 0,
    estimatedTimeRemaining: 0
  });

  // Initialize controller
  useEffect(() => {
    if (!controllerRef.current) {
      controllerRef.current = createChapterNavigationController(
        options.navigationOptions,
        options.displayPreferences
      );

      // Set up event listeners
      controllerRef.current.addEventListener('chapter-changed', handleChapterChanged);
      controllerRef.current.addEventListener('progress-updated', handleProgressUpdated);
      controllerRef.current.addEventListener('navigation-error', handleNavigationError);
    }

    return () => {
      if (controllerRef.current) {
        controllerRef.current.dispose();
        controllerRef.current = null;
      }
    };
  }, []);

  // Event handlers
  const handleChapterChanged = useCallback((event: NavigationEvent) => {
    
    if (event.data.chapter) {
      setCurrentChapter(event.data.chapter);
    }
    
    if (event.data.navigationState) {
      setNavigationState(event.data.navigationState);
    }
    
    // Update chapter list
    if (controllerRef.current) {
      setChapterList(controllerRef.current.getChapterList());
      setProgressInfo(controllerRef.current.getProgressInfo());
    }
    
    setError(null);
  }, []);

  const handleProgressUpdated = useCallback((event: NavigationEvent) => {
    
    if (controllerRef.current) {
      setProgressInfo(controllerRef.current.getProgressInfo());
    }
  }, []);

  const handleNavigationError = useCallback((event: NavigationEvent) => {
    console.error('useChapterNavigation: Navigation error:', event.data.error);
    setError(event.data.error);
    setIsLoading(false);
  }, []);

  // Actions
  const initialize = useCallback(async (content: ClassifiedEpubContent) => {
    if (!controllerRef.current) {
      setError('Navigation controller not initialized');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await controllerRef.current.initialize(
        content, 
        options.documentId, 
        options.userId
      );
      
      setIsInitialized(true);
      setCurrentChapter(controllerRef.current.getCurrentChapter());
      setNavigationState(controllerRef.current.getCurrentNavigationState());
      setChapterList(controllerRef.current.getChapterList());
      setProgressInfo(controllerRef.current.getProgressInfo());
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('useChapterNavigation: Initialization failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [options.documentId, options.userId]);

  const navigateToChapter = useCallback(async (chapterId: string): Promise<boolean> => {
    if (!controllerRef.current || !isInitialized) {
      setError('Navigation not initialized');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const success = await controllerRef.current.navigateToChapter(chapterId);
      if (!success) {
        setError('Failed to navigate to chapter');
      }
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Navigation failed';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  const navigateToNext = useCallback(async (): Promise<boolean> => {
    if (!controllerRef.current || !isInitialized) {
      setError('Navigation not initialized');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const success = await controllerRef.current.navigateToNext();
      if (!success) {
        setError('No next chapter available');
      }
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Navigation failed';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  const navigateToPrevious = useCallback(async (): Promise<boolean> => {
    if (!controllerRef.current || !isInitialized) {
      setError('Navigation not initialized');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const success = await controllerRef.current.navigateToPrevious();
      if (!success) {
        setError('No previous chapter available');
      }
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Navigation failed';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  const navigateToIndex = useCallback(async (index: number): Promise<boolean> => {
    if (!controllerRef.current || !isInitialized) {
      setError('Navigation not initialized');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const success = await controllerRef.current.navigateToIndex(index);
      if (!success) {
        setError('Invalid chapter index');
      }
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Navigation failed';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  const markChapterCompleted = useCallback(() => {
    if (controllerRef.current && isInitialized) {
      controllerRef.current.markChapterCompleted();
    }
  }, [isInitialized]);

  const updateDisplayPreferences = useCallback((preferences: Partial<ChapterDisplayPreferences>) => {
    if (controllerRef.current && isInitialized) {
      controllerRef.current.updateDisplayPreferences(preferences);
    }
  }, [isInitialized]);

  // Computed values
  const canGoNext = navigationState?.hasNext || false;
  const canGoPrevious = navigationState?.hasPrevious || false;

  return {
    // State
    isInitialized,
    currentChapter,
    navigationState,
    chapterList,
    progressInfo,
    
    // Actions
    initialize,
    navigateToChapter,
    navigateToNext,
    navigateToPrevious,
    navigateToIndex,
    markChapterCompleted,
    updateDisplayPreferences,
    
    // Utilities
    canGoNext,
    canGoPrevious,
    isLoading,
    error
  };
}