import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAbsoluteOffset } from '../utils/highlightUtils';
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BookOpen,
  Users,
  MessageSquare,
  Mic,
  ChevronLeft,
  ChevronRight,
  Highlighter,
  Eye,
  EyeOff,
  List,
  X,
  Copy
} from "lucide-react";
import { toast } from "sonner";
import { documentAPI, userAPI, getToken } from "@/services/api";
import { simpleEpubReader, type SimpleEpubBook, type SimpleChapter, type EpubLoadingProgress } from "@/services/simpleEpubReader";
import { GloseScrollReader } from "@/components/GloseScrollReader";
import { TextSelectionHandler } from "@/components/TextSelectionHandler";
import { HighlightRenderer } from "@/components/HighlightRenderer";
import { HighlightToolbar } from "@/components/HighlightToolbar";
import { CommentPopup } from "@/components/CommentPopup";
import { EnhancedCommentsPanel } from "@/components/EnhancedCommentsPanel";
import { useCollaborativeHighlights } from "@/hooks/useCollaborativeHighlights";
import { highlightService } from "@/services/highlightService";
import { simpleDjangoHighlightService } from "@/services/simpleDjangoHighlightService";
import { readingProgressService } from "@/services/readingProgressService";
import { ThemeToggle } from "@/components/ThemeToggle";

// Add CSS for smooth animations
const gloseStyles = `
  .chapter-transition {
    animation: fadeInUp 0.6s ease-out;
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .chapter-link {
    color: #3b82f6;
    text-decoration: none;
    border-bottom: 1px solid #3b82f6;
    cursor: pointer;
    transition: all 0.2s;
    padding: 0 2px;
  }
  
  .chapter-link:hover {
    color: #1d4ed8;
    border-bottom-color: #1d4ed8;
    background-color: rgba(59, 130, 246, 0.1);
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  /* Highlight Styles */
  .glose-highlight {
    cursor: pointer;
    transition: all 0.2s ease;
    border-radius: 2px;
    padding: 1px 2px;
    margin: 0 1px;
    position: relative;
  }
  
  .glose-highlight:hover {
    transform: scale(1.02);
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  }
  
  .glose-highlight-yellow {
    background-color: #fff3cd !important;
    border-bottom: 2px solid #ffeaa7 !important;
  }
  
  .glose-highlight-green {
    background-color: #d4edda !important;
    border-bottom: 2px solid #a3d977 !important;
  }
  
  .glose-highlight-blue {
    background-color: #cce5ff !important;
    border-bottom: 2px solid #74b9ff !important;
  }
  
  .glose-highlight-pink {
    background-color: #f8d7da !important;
    border-bottom: 2px solid #fd79a8 !important;
  }
  
  .glose-highlight-purple {
    background-color: #e2d9f3 !important;
    border-bottom: 2px solid #a29bfe !important;
  }
  
  .glose-highlight-orange {
    background-color: #ffeaa7 !important;
    border-bottom: 2px solid #fdcb6e !important;
  }
`;

interface CollaborativeSession {
  id: string;
  documentId: string;
  name: string;
  participants: Participant[];
  currentPage: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}

interface Participant {
  id: string;
  name: string;
  avatar?: string;
  isOnline: boolean;
  currentPage: number;
  role: 'host' | 'participant';
}

interface Comment {
  id: string;
  highlightId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content?: string; // For text comments
  audioUrl?: string; // For audio comments
  audioBlob?: Blob; // For local audio before upload
  type: 'text' | 'audio' | 'emoji';
  emoji?: string; // For emoji reactions
  chapterNumber: number;
  timestamp: string;
  reactions: Reaction[];
  isEditing?: boolean; // For inline editing
}

interface Reaction {
  userId: string;
  userName: string;
  userAvatar?: string;
  emoji: string;
  timestamp: string;
}

interface Highlight {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  color: string;
  chapterNumber: number;
  textRange: {
    startOffset: number;
    endOffset: number;
    startContainer: string; // CSS selector or unique identifier
    endContainer: string;
  };
  position: { x: number; y: number }; // For popup positioning
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

interface TextSelection {
  isActive: boolean;
  selectedText: string;
  range: Range | null;
  boundingRect: DOMRect | null;
  chapterNumber: number;
}

const REACTION_EMOJIS = [
  '❤️', '🙏', '💡', '👍', '😊', '🤔', '✨', '🔥',
  '📖', '💭', '🎯', '⭐', '🔖', '💫', '🌟', '✍️'
];

const HIGHLIGHT_COLORS = {
  yellow: { bg: '#fff3cd', border: '#ffeaa7', name: 'Amarillo' },
  green: { bg: '#d4edda', border: '#a3d977', name: 'Verde' },
  blue: { bg: '#cce5ff', border: '#74b9ff', name: 'Azul' },
  pink: { bg: '#f8d7da', border: '#fd79a8', name: 'Rosa' },
  purple: { bg: '#e2d9f3', border: '#a29bfe', name: 'Morado' },
  orange: { bg: '#ffeaa7', border: '#fdcb6e', name: 'Naranja' }
};

type CommentType = 'text' | 'audio' | 'emoji';
type HighlightColor = keyof typeof HIGHLIGHT_COLORS;

/**
 * Helper function to detect auxiliary content based on chapter titles
 * Auxiliary content includes: table of contents, acknowledgments, prefaces, 
 * indexes, bibliographies, author information, copyright pages, appendices, etc.
 * This content is typically not part of the main narrative flow.
 */
const isAuxiliaryChapter = (title: string): boolean => {
  const auxiliaryKeywords = [
    'contents', 'table of contents', 'toc', 'índice', 'contenido',
    'acknowledgments', 'acknowledgements', 'acknowledgment', 'agradecimientos',
    'preface', 'foreword', 'prólogo', 'prefacio',
    'index', 'bibliography', 'references', 'notes', 'notas', 'referencias',
    'about the author', 'about this book', 'sobre el autor', 'acerca del autor',
    'copyright', 'legal', 'disclaimer', 'derechos',
    'appendix', 'glossary', 'resources', 'apéndice', 'glosario',
    'dedication', 'epigraph', 'dedicatoria'
  ];

  const normalizedTitle = title.toLowerCase().trim();
  return auxiliaryKeywords.some(keyword =>
    normalizedTitle.includes(keyword) ||
    normalizedTitle === keyword ||
    normalizedTitle.startsWith(keyword + ' ') ||
    normalizedTitle.endsWith(' ' + keyword)
  );
};

const CollaborativeReader = () => {
  const { documentId, sessionId, chapterNumber } = useParams();
  const navigate = useNavigate();

  // Debug logging for URL parameters
  useEffect(() => {

    // If we ended up on a chapter file URL, go back immediately
    if (documentId && (documentId.includes('.xhtml') || documentId.includes('.html'))) {

      // Try to go back to the previous page
      if (window.history.length > 1) {
        window.history.back();
      } else {
        // Fallback to bible if no history
        navigate('/bible');
      }
      return;
    }
  }, [documentId, sessionId, navigate]);

  // Document and session state
  const [documentData, setDocumentData] = useState<any>(null);
  const [session, setSession] = useState<CollaborativeSession | null>(null);
  const [currentChapter, setCurrentChapter] = useState(1);
  const [totalChapters, setTotalChapters] = useState(0);
  const [useGloseReader, setUseGloseReader] = useState(true); // Enable Glose-style reading

  // User identity - fetched from backend or localStorage
  const [currentUserId, setCurrentUserId] = useState<string>('current-user');
  const [currentUserName, setCurrentUserName] = useState<string>('Usuario');

  // Reading progress tracking
  const [isProgressLoaded, setIsProgressLoaded] = useState(false);
  const autoSaveCleanupRef = useRef<(() => void) | null>(null);

  const [loading, setLoading] = useState(true);

  // Simple EPUB state
  const [epubBook, setEpubBook] = useState<SimpleEpubBook | null>(null);
  const [currentChapterData, setCurrentChapterData] = useState<SimpleChapter | null>(null);
  const gloseReaderRef = useRef<{ navigateToChapter: (chapterNumber: number) => void }>(null);

  // Progressive loading state (Glose-style)
  const [epubLoadingProgress, setEpubLoadingProgress] = useState<{
    isLoading: boolean;
    phase: string;
    progress: number;
    message: string;
    chaptersLoaded: number;
    totalChapters: number;
  }>({
    isLoading: false,
    phase: '',
    progress: 0,
    message: '',
    chaptersLoaded: 0,
    totalChapters: 0
  });

  // Collaboration state
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isHost, setIsHost] = useState(false);

  // UI state
  const [showComments, setShowComments] = useState(true);
  const [showParticipants, setShowParticipants] = useState(true);
  const [showTableOfContents, setShowTableOfContents] = useState(false);
  const [showAuxiliaryContent, setShowAuxiliaryContent] = useState(() => {
    // Load preference from localStorage
    const saved = localStorage.getItem('showAuxiliaryContent');
    return saved ? JSON.parse(saved) : false;
  });
  const [newComment, setNewComment] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Glose-style interaction states
  const [showHighlightPopup, setShowHighlightPopup] = useState(false);
  const [highlightPopupPosition, setHighlightPopupPosition] = useState({ x: 0, y: 0 });
  const [selectedRange, setSelectedRange] = useState<Range | null>(null);

  // Text selection state
  const [textSelection, setTextSelection] = useState<TextSelection>({
    isActive: false,
    selectedText: '',
    range: null,
    boundingRect: null,
    chapterNumber: 1
  });
  const [isHighlightMode, setIsHighlightMode] = useState(true); // Enable highlighting by default
  const [selectedHighlight, setSelectedHighlight] = useState<Highlight | null>(null);
  const [showCommentPopup, setShowCommentPopup] = useState(false);

  // Collaborative highlights management
  const {
    highlights,
    isConnected: isCollaborativeConnected,
    participants: collaborativeParticipants,
    createHighlight: createCollaborativeHighlight,
    updateHighlight: updateCollaborativeHighlight,
    deleteHighlight: deleteCollaborativeHighlight,
    addComment: addCollaborativeComment,
    updateComment: updateCollaborativeComment,
    deleteComment: deleteCollaborativeComment,
    setInitialHighlights
  } = useCollaborativeHighlights({
    sessionId: sessionId || 'local-session',
    userId: currentUserId,
    userName: currentUserName,
    onHighlightUpdate: useCallback(async (updatedHighlights: Highlight[]) => {
      // Save highlights to Django backend (with localStorage fallback)
      try {
        for (const highlight of updatedHighlights) {
          // Save to Django backend
          await simpleDjangoHighlightService.saveHighlight({
            id: highlight.id,
            userName: highlight.userName,
            text: highlight.text,
            color: highlight.color,
            chapterNumber: highlight.chapterNumber,
            documentId: documentId
          });
        }
        // Highlights saved successfully
      } catch (error) {
        console.error('Error saving highlights to Django backend:', error);
        // Fallback to localStorage
        const storageKey = `highlights_${documentId || 'default'}`;
        localStorage.setItem(storageKey, JSON.stringify(updatedHighlights));
        // Highlights saved to localStorage as fallback
      }
    }, [documentId])
  });

  // Keep selected block in sync so that comments update instantly in the popup
  useEffect(() => {
    if (showCommentPopup && selectedHighlight) {
      const updatedMatch = highlights.find(h => h.id === selectedHighlight.id);
      if (updatedMatch && JSON.stringify(updatedMatch.comments) !== JSON.stringify(selectedHighlight.comments)) {
        setSelectedHighlight(updatedMatch);
      }
    }
  }, [highlights, selectedHighlight, showCommentPopup]);

  // Fetch current user profile
  useEffect(() => {
    const fetchUser = async () => {
      const token = getToken();
      if (!token) return;
      try {
        const profile: any = await userAPI.getProfile();
        if (profile?.username) {
          setCurrentUserId(profile.id?.toString() || profile.username);
          setCurrentUserName(profile.username);
        }
      } catch {
        // Not logged in or error - keep defaults
      }
    };
    fetchUser();
  }, []);

  // Load saved highlights on component mount
  useEffect(() => {
    const loadSavedHighlights = async () => {
      try {
        // Load highlights from Django backend
        const djangoHighlights = await simpleDjangoHighlightService.loadHighlights(documentId);

        if (djangoHighlights.length > 0) {

          // Only load if we don't already have highlights (avoid duplicates)
          if (highlights.length === 0) {

            // Convert Django format to frontend format
            const mappedHighlights = djangoHighlights.map((djangoHighlight: any) => ({
              id: djangoHighlight.id,
              userId: 'django-user',
              userName: djangoHighlight.user_name,
              text: djangoHighlight.highlighted_text, // Use correct field name
              color: djangoHighlight.color,
              chapterNumber: djangoHighlight.chapter_number || 1, // Use actual chapter number
              textRange: {
                startOffset: djangoHighlight.start_offset || 0,
                endOffset: djangoHighlight.end_offset || djangoHighlight.highlighted_text.length,
                startContainer: `[data-chapter="${djangoHighlight.chapter_number || 1}"]`,
                endContainer: `[data-chapter="${djangoHighlight.chapter_number || 1}"]`
              },
              position: { x: 100, y: 100 },
              comments: [],
              createdAt: djangoHighlight.created_at || new Date().toISOString(),
              updatedAt: djangoHighlight.created_at || new Date().toISOString()
            }));
            
            setInitialHighlights(mappedHighlights);
          }
        }
      } catch (error) {
        console.error('Error loading saved highlights from database:', error);

        // Fallback to localStorage
        const storageKey = `highlights_${documentId || 'default'}`;
        try {
          const savedHighlights = localStorage.getItem(storageKey);
          if (savedHighlights) {
            const parsedHighlights = JSON.parse(savedHighlights);

            if (highlights.length === 0 && parsedHighlights.length > 0) {
              setInitialHighlights(parsedHighlights);
            }
          }
        } catch (localError) {
          console.error('Error loading from localStorage fallback:', localError);
        }
      }
    };

    // Only load highlights once when document is ready and we have no highlights yet
    if (documentId && epubBook && highlights.length === 0) {
      loadSavedHighlights();
    }
  }, [documentId, epubBook, highlights.length, setInitialHighlights]);

  // Audio recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Chapter navigation now works like a traditional index - no URL changes needed

  // Save auxiliary content preference to localStorage
  useEffect(() => {
    localStorage.setItem('showAuxiliaryContent', JSON.stringify(showAuxiliaryContent));
  }, [showAuxiliaryContent]);

  useEffect(() => {
    const initializeReader = async () => {
      if (documentId) {
        setLoading(true);
        try {
          const loadedDoc = await loadDocument();
          if (loadedDoc) {
            if (sessionId) {
              await joinSession();
            } else {
              await createSession(loadedDoc);
            }
          }
        } catch (error) {
          console.error('Error initializing reader:', error);
          toast.error('Error al inicializar el lector');
        } finally {
          setLoading(false);
        }
      }
    };

    // Add global error handler for unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      // Don't show toast for CORS errors as they might be from external resources
      if (event.reason && event.reason.toString().includes('CORS')) {
        console.warn('CORS error detected, likely from external resource');
        event.preventDefault(); // Prevent the error from being logged to console
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    initializeReader();

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [documentId, sessionId]);

  // Debounce chapter changes to prevent loops
  const lastChapterChangeRef = useRef(0);
  const chapterChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle chapter changes from Glose reader with debouncing
  const handleChapterChange = useCallback((chapterNumber: number) => {
    const now = Date.now();

    // Ignore rapid changes (less than 500ms apart)
    if (now - lastChapterChangeRef.current < 500) {
      return;
    }

    // Clear any pending timeout
    if (chapterChangeTimeoutRef.current) {
      clearTimeout(chapterChangeTimeoutRef.current);
    }

    // Set a timeout to actually change the chapter
    chapterChangeTimeoutRef.current = setTimeout(() => {
      setCurrentChapter(chapterNumber);
      lastChapterChangeRef.current = now;

      // Update session state if needed
      if (session) {
        // TODO: Update collaborative session with current chapter
      }
    }, 100);
  }, [session]);

  // Text selection handlers
  const handleTextSelected = useCallback((selection: {
    selectedText: string;
    range: Range;
    boundingRect: DOMRect;
    chapterNumber: number;
  }) => {

    setTextSelection({
      isActive: true,
      selectedText: selection.selectedText,
      range: selection.range,
      boundingRect: selection.boundingRect,
      chapterNumber: selection.chapterNumber
    });

    // Position and show highlight popup
    const popupPosition = {
      x: selection.boundingRect.left + selection.boundingRect.width / 2,
      y: selection.boundingRect.top - 10
    };

    setHighlightPopupPosition(popupPosition);
    setShowHighlightPopup(true);
  }, []);

  const handleSelectionCleared = useCallback(() => {
    // Text selection cleared

    setTextSelection({
      isActive: false,
      selectedText: '',
      range: null,
      boundingRect: null,
      chapterNumber: currentChapter
    });
    setShowHighlightPopup(false);
  }, [currentChapter]);

  // Highlight creation and management
  const createHighlight = useCallback((color: HighlightColor, addComment: boolean = false) => {
    if (!textSelection.isActive || !textSelection.range) {
      console.warn('No active text selection to highlight');
      return;
    }

    const highlightId = `highlight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Calculate text range offsets using deterministic TreeWalker
    const chapterElement = document.querySelector(`[data-chapter="${textSelection.chapterNumber}"]`);
    if (!chapterElement) {
      console.error('Chapter element not found');
      return;
    }

    const startOffset = getAbsoluteOffset(chapterElement, textSelection.range.startContainer, textSelection.range.startOffset);
    const endOffset = getAbsoluteOffset(chapterElement, textSelection.range.endContainer, textSelection.range.endOffset);

    const newHighlight: Highlight = {
      id: highlightId,
      userId: currentUserId,
      userName: currentUserName,
      userAvatar: undefined,
      text: textSelection.selectedText,
      color,
      chapterNumber: textSelection.chapterNumber,
      textRange: {
        startOffset,
        endOffset,
        startContainer: `[data-chapter="${textSelection.chapterNumber}"]`,
        endContainer: `[data-chapter="${textSelection.chapterNumber}"]`
      },
      position: {
        x: textSelection.boundingRect?.left || 0,
        y: textSelection.boundingRect?.top || 0
      },
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Create highlight collaboratively
    createCollaborativeHighlight(newHighlight);

    // Debug: Check if highlights array is updating
    setTimeout(() => {
    }, 100);

    // Clear selection
    window.getSelection()?.removeAllRanges();
    handleSelectionCleared();

    // If user wants to add a comment immediately
    if (addComment) {
      setTimeout(() => {
        handleHighlightClick(newHighlight, {
          clientX: textSelection.boundingRect?.left || 0,
          clientY: textSelection.boundingRect?.top || 0
        } as MouseEvent);
      }, 100);
    }
  }, [textSelection, handleSelectionCleared, createCollaborativeHighlight]);

  const handleHighlightClick = useCallback((highlight: Highlight, event: MouseEvent) => {

    // Position comment popup near the click
    setHighlightPopupPosition({
      x: event.clientX,
      y: event.clientY - 10
    });

    // Set the selected highlight for commenting
    setSelectedHighlight(highlight);
    setSelectedRange(null); // Clear any text selection
    setShowHighlightPopup(false); // Hide highlight toolbar
    setShowCommentPopup(true); // Show comment popup
  }, []);

  // Comment management
  const handleAddComment = useCallback(async (highlightId: string, commentData: Omit<Comment, 'id' | 'timestamp'>) => {
    const newComment: Comment = {
      ...commentData,
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };

    // Add comment to local state
    addCollaborativeComment(newComment);

    // Persist comment to Django backend
    try {
      await simpleDjangoHighlightService.saveComment(highlightId, {
        text: commentData.content || commentData.emoji || '',
        userName: currentUserName,
      });
    } catch {
      // Comment saved locally but failed to persist - still works in session
    }

  }, [addCollaborativeComment, currentUserName]);

  const handleEditComment = useCallback((highlightId: string, commentId: string, newContent: string) => {
    updateCollaborativeComment(highlightId, commentId, {
      content: newContent
    });

  }, [updateCollaborativeComment]);

  const handleDeleteComment = useCallback((highlightId: string, commentId: string) => {
    deleteCollaborativeComment(highlightId, commentId);

  }, [deleteCollaborativeComment]);

  const handleDeleteHighlight = useCallback((highlightId: string) => {
    deleteCollaborativeHighlight(highlightId);

    // Clear any existing highlight spans for this highlight
    const highlightSpans = document.querySelectorAll(`[data-highlight-id="${highlightId}"]`);
    highlightSpans.forEach(span => {
      const parent = span.parentNode;
      if (parent) {
        while (span.firstChild) {
          parent.insertBefore(span.firstChild, span);
        }
        parent.removeChild(span);
      }
    });

  }, [deleteCollaborativeHighlight]);

  // Reaction management (placeholder for future implementation)

  const handleRemoveReaction = useCallback((highlightId: string, commentId: string, emoji: string) => {
    // This would be implemented with collaborative reactions
  }, []);

  // Navigation functions
  const navigateToChapter = useCallback((chapterNumber: number) => {
    // Simple scroll to chapter
    const chapterElement = document.querySelector(`[data-chapter="${chapterNumber}"]`);
    if (chapterElement) {
      chapterElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setCurrentChapter(chapterNumber);
      setShowTableOfContents(false);
    }
  }, []);

  // Load and restore reading progress
  useEffect(() => {
    const loadReadingProgress = async () => {
      if (!documentId || !epubBook || isProgressLoaded) return;

      try {
        const progress = await readingProgressService.loadProgress(documentId, currentUserId);

        if (progress) {

          // Restore chapter position
          if (progress.current_chapter !== currentChapter) {
            navigateToChapter(progress.current_chapter);
          }

          // Restore scroll position after a short delay
          setTimeout(() => {
            window.scrollTo(0, progress.scroll_position);
          }, 500);

          toast.success(`Continuando desde el capítulo ${progress.current_chapter}`);
        } else {
        }

        setIsProgressLoaded(true);
      } catch (error) {
        console.error('Error loading reading progress:', error);
        setIsProgressLoaded(true);
      }
    };

    loadReadingProgress();
  }, [documentId, epubBook, currentChapter, navigateToChapter, isProgressLoaded]);

  // Start auto-save reading progress
  useEffect(() => {
    if (!documentId || !epubBook || !isProgressLoaded) return;

    // Start auto-save
    const cleanup = readingProgressService.startAutoSave(
      documentId,
      currentUserId,
      () => currentChapter,
      () => window.scrollY,
      () => totalChapters
    );

    autoSaveCleanupRef.current = cleanup;

    // Cleanup on unmount
    return () => {
      if (autoSaveCleanupRef.current) {
        autoSaveCleanupRef.current();
      }
    };
  }, [documentId, epubBook, currentChapter, totalChapters, isProgressLoaded]);

  // Highlight management
  const handleChangeHighlightColor = useCallback((highlightId: string, newColor: string) => {
    updateCollaborativeHighlight(highlightId, {
      color: newColor,
      updatedAt: new Date().toISOString()
    });

  }, [updateCollaborativeHighlight]);

  // Navigation to highlights
  const handleNavigateToHighlight = useCallback((highlightId: string, chapterNumber: number) => {

    // Navigate to chapter if not current
    if (chapterNumber !== currentChapter) {
      navigateToChapter(chapterNumber);
    }

    // Wait a bit for chapter to load, then scroll to highlight
    setTimeout(() => {
      const highlightElement = document.querySelector(`[data-highlight-id="${highlightId}"]`);
      if (highlightElement) {
        highlightElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });

        // Briefly highlight the element
        highlightElement.classList.add('animate-pulse');
        setTimeout(() => {
          highlightElement.classList.remove('animate-pulse');
        }, 2000);
      }
    }, chapterNumber !== currentChapter ? 1000 : 100);
  }, [currentChapter, navigateToChapter]);

  const createSimpleEpubStructure = async (filename: string, fileBlob: File) => {
    // Extract title from filename
    const title = filename.replace(/\.(epub|EPUB)$/, '').replace(/_/g, ' ');

    // Create a simple structure
    return {
      metadata: {
        title: title,
        author: 'Unknown Author',
        description: 'EPUB book loaded with basic parser',
        language: 'en',
        publisher: ''
      },
      chapters: [
        { id: 'chapter-1', title: 'Chapter 1', href: 'chapter1.html', order: 1 },
        { id: 'chapter-2', title: 'Chapter 2', href: 'chapter2.html', order: 2 },
        { id: 'chapter-3', title: 'Chapter 3', href: 'chapter3.html', order: 3 },
        { id: 'chapter-4', title: 'Chapter 4', href: 'chapter4.html', order: 4 },
        { id: 'chapter-5', title: 'Chapter 5', href: 'chapter5.html', order: 5 }
      ],
      totalChapters: 5,
      book: null
    };
  };

  const parseEpubFile = async (doc: any) => {
    let file: File | null = null;

    try {

      // Show progress to user
      toast.info('Descargando archivo EPUB...');

      // Fetch the actual file from the server
      let fileResponse;
      try {
        fileResponse = await fetch(doc.file, {
          mode: 'cors',
          credentials: 'omit'
        });
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        if (fetchError.message.includes('CORS') || fetchError.message.includes('Failed to fetch')) {
          throw new Error('CORS: El archivo EPUB está en un servidor externo que no permite el acceso directo. Por favor, sube el archivo directamente a la aplicación.');
        }
        throw fetchError;
      }

      if (!fileResponse.ok) {
        throw new Error(`Failed to fetch EPUB file: ${fileResponse.status} ${fileResponse.statusText}`);
      }

      const fileBlob = await fileResponse.blob();

      if (fileBlob.size === 0) {
        throw new Error('EPUB file is empty');
      }

      file = new File([fileBlob], doc.name, { type: 'application/epub+zip' });

      // Show parsing progress
      toast.info('Procesando contenido EPUB...');

      // This section is no longer used - using simple EPUB reader instead

      // This section is no longer used

    } catch (error) {
      console.error('Error parsing EPUB:', error);

      // Try to provide more specific error messages
      let errorMessage = 'Error desconocido';
      if (error.message.includes('CORS')) {
        errorMessage = 'El archivo contiene recursos externos que no se pueden cargar';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'El archivo EPUB tardó demasiado en procesar';
      } else if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
        errorMessage = 'No se pudo descargar el archivo EPUB. Verifica que el enlace sea válido.';
      } else if (error.message.includes('parse')) {
        errorMessage = 'El archivo EPUB está corrupto o no es válido';
      } else {
        errorMessage = error.message;
      }

      toast.error(`Error al procesar el archivo EPUB: ${errorMessage}`);

      // Fallback: show error message as content
      const fallbackBook: SimpleEpubBook = {
        title: doc.name.replace(/\.(epub|EPUB)$/, '').replace(/_/g, ' '),
        author: '',
        chapters: [
          {
            id: 'chapter-1',
            title: 'Error al cargar',
            content: `
              <h2>No se pudo procesar este archivo</h2>
              <p>El formato del EPUB no es compatible o el archivo está dañado.</p>
              <p>Intenta subir otro archivo o verifica que el EPUB sea válido.</p>
            `,
            order: 1,
            wordCount: 20
          }
        ],
        totalChapters: 1
      };

      setEpubBook(fallbackBook);
      setCurrentChapterData(fallbackBook.chapters[0]);
      setTotalChapters(1);
      toast.error('No se pudo procesar el EPUB. Verifica el archivo.');
    }
  };

  const loadDocument = async () => {
    try {
      const doc = await documentAPI.getById(documentId!);
      const docTyped = doc as any;
      setDocumentData(doc);

      // Validate that this document supports collaborative reading
      if (docTyped.file_type !== 'epub' && docTyped.file_type !== 'pdf') {
        toast.error('Este tipo de documento no soporta lectura colaborativa. Solo EPUBs y PDFs.');
        navigate('/bible');
        return null;
      }

      // Parse EPUB/PDF content
      if (docTyped.file_type === 'epub') {

        // Start loading state
        setEpubLoadingProgress({
          isLoading: true,
          phase: 'initializing',
          progress: 0,
          message: 'Preparando archivo EPUB...',
          chaptersLoaded: 0,
          totalChapters: 0
        });

        try {
          // Fetch the actual file
          const fileResponse = await fetch(docTyped.file);
          const fileBlob = await fileResponse.blob();
          const file = new File([fileBlob], docTyped.name, { type: 'application/epub+zip' });

          // Use progressive EPUB reader with progress callback
          const epubBook = await simpleEpubReader.loadEpub(file, (progress: EpubLoadingProgress) => {

            setEpubLoadingProgress({
              isLoading: progress.phase !== 'complete',
              phase: progress.phase,
              progress: progress.progress,
              message: progress.message,
              chaptersLoaded: progress.chaptersLoaded,
              totalChapters: progress.totalChapters
            });

            // Update epubBook when new chapters are loaded
            if (progress.phase === 'background-loading' || progress.phase === 'complete') {
              // Force update by creating completely new object
              setEpubBook(currentBook => {
                if (currentBook && currentBook.chapters.length !== progress.chaptersLoaded) {
                  // Create completely new book object to force React re-render
                  const newBook = {
                    title: currentBook.title,
                    author: currentBook.author,
                    chapters: currentBook.chapters.map(ch => ({ ...ch })), // Deep copy chapters
                    totalChapters: progress.totalChapters
                  };
                  return newBook;
                }
                return currentBook;
              });
            }

            // Show progress toasts for key milestones
            if (progress.phase === 'first-chapter') {
              toast.success(`Primer capítulo listo para lectura`);
            } else if (progress.phase === 'complete') {
              toast.success(`EPUB completamente cargado: ${progress.totalChapters} capítulos`);
            }
          });

          setEpubBook(epubBook);
          setCurrentChapterData(epubBook.chapters[0]);
          setTotalChapters(epubBook.totalChapters);

          // Show initial success message
          toast.success(`📚 ${epubBook.title} - Listo para leer (cargando capítulos adicionales...)`);

        } catch (error) {
          console.error('Failed to extract real EPUB content:', error);
          // Fallback to basic structure
          const fallbackBook: SimpleEpubBook = {
            title: docTyped.name.replace(/\.(epub|EPUB)$/, '').replace(/_/g, ' '),
            author: 'Unknown Author',
            chapters: [
              {
                id: 'chapter-1',
                title: 'Capítulo 1: Error de Compatibilidad',
                content: `
                  <h2>Problema de Compatibilidad</h2>
                  <p>No se pudo extraer el contenido real del EPUB debido a problemas de compatibilidad.</p>
                  <p>Sin embargo, el sistema de lectura Glose está funcionando correctamente.</p>
                  <h3>Posibles Soluciones</h3>
                  <ul>
                    <li>Intenta con un archivo EPUB diferente</li>
                    <li>Verifica que el archivo no esté corrupto</li>
                    <li>Asegúrate de que sea un EPUB válido</li>
                  </ul>
                `,
                order: 1,
                wordCount: 50
              }
            ],
            totalChapters: 1
          };

          setEpubBook(fallbackBook);
          setCurrentChapterData(fallbackBook.chapters[0]);
          setTotalChapters(1);
          toast.warning(`EPUB cargado con analizador básico: ${fallbackBook.title}`);
        }
      } else if (docTyped.file_type === 'pdf') {
        // PDF support will be added later - for now focus on EPUB
        setTotalChapters(5);
      }

      return doc; // Return the document for immediate use
    } catch (error) {
      console.error('Error loading document:', error);

      // Check if it's a CORS error
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.error('Possible CORS or network error detected');
        toast.error('Error de conexión. Verifica que el servidor esté ejecutándose.');
      } else {
        toast.error('Error al cargar el documento');
      }
      throw error; // Re-throw to be caught by the useEffect
    }
  };

  const generateEpubContent = (documentName: string = 'Documento EPUB', page: number = 1) => {
    const chapters = [
      {
        title: "Capítulo 1: El Poder de la Oración",
        content: `
          <p>La oración es una de las herramientas más poderosas que tenemos como creyentes. A través de ella, podemos comunicarnos directamente con nuestro Creador y encontrar paz en medio de las tormentas de la vida.</p>
          
          <p>En este capítulo exploraremos diferentes aspectos de la oración:</p>
          <ul>
            <li>La importancia de la oración constante</li>
            <li>Cómo desarrollar una vida de oración efectiva</li>
            <li>El poder de la oración comunitaria</li>
            <li>Testimonios de oraciones respondidas</li>
          </ul>
          
          <h3>La Oración Como Comunicación</h3>
          <p>Cuando oramos, no estamos simplemente recitando palabras al aire. Estamos entrando en una conversación íntima con el Dios del universo. Esta perspectiva cambia completamente nuestra aproximación a la oración.</p>
          
          <blockquote style="border-left: 4px solid #8B5CF6; padding-left: 16px; margin: 16px 0; font-style: italic; color: #6B7280;">
            "Orad sin cesar" - 1 Tesalonicenses 5:17
          </blockquote>
          
          <p>Este versículo nos enseña que la oración no debe ser algo que hacemos solo en momentos específicos, sino una actitud constante de comunicación con Dios.</p>
          
          <h3>Práctica de la Oración</h3>
          <p>Para desarrollar una vida de oración efectiva, considera estos elementos:</p>
          <ol>
            <li><strong>Tiempo dedicado:</strong> Establece momentos específicos para la oración</li>
            <li><strong>Lugar tranquilo:</strong> Encuentra un espacio donde puedas concentrarte</li>
            <li><strong>Corazón preparado:</strong> Acércate con humildad y expectativa</li>
          </ol>
        `
      },
      {
        title: "Capítulo 2: La Fe en Tiempos Difíciles",
        content: `
          <p>La fe verdadera se prueba en los momentos más difíciles de nuestra vida. Es fácil creer cuando todo va bien, pero ¿qué pasa cuando enfrentamos adversidades?</p>
          
          <h3>Manteniendo la Fe</h3>
          <p>Durante las pruebas, es natural que nuestra fe se tambalee. Sin embargo, es precisamente en estos momentos cuando más necesitamos aferrarnos a las promesas de Dios.</p>
          
          <blockquote style="border-left: 4px solid #8B5CF6; padding-left: 16px; margin: 16px 0; font-style: italic; color: #6B7280;">
            "Porque por fe andamos, no por vista" - 2 Corintios 5:7
          </blockquote>
          
          <h3>Testimonios de Esperanza</h3>
          <p>A lo largo de la historia, muchos creyentes han encontrado fortaleza en medio de las dificultades:</p>
          <ul>
            <li>Job mantuvo su fe a pesar de perder todo</li>
            <li>Daniel confió en Dios en el foso de los leones</li>
            <li>Pablo encontró gozo en la prisión</li>
          </ul>
          
          <p>Estos ejemplos nos enseñan que la fe no es la ausencia de problemas, sino la confianza en que Dios está con nosotros en medio de ellos.</p>
        `
      },
      {
        title: "Capítulo 3: El Amor Como Fundamento",
        content: `
          <p>El amor es el mandamiento más grande y el fundamento de toda nuestra fe. Sin amor, todas nuestras acciones religiosas carecen de significado.</p>
          
          <h3>El Amor de Dios</h3>
          <p>Antes de poder amar a otros, debemos entender el profundo amor que Dios tiene por nosotros. Este amor es incondicional, eterno y transformador.</p>
          
          <blockquote style="border-left: 4px solid #8B5CF6; padding-left: 16px; margin: 16px 0; font-style: italic; color: #6B7280;">
            "Nosotros le amamos a él, porque él nos amó primero" - 1 Juan 4:19
          </blockquote>
          
          <h3>Amor en Acción</h3>
          <p>El amor verdadero se manifiesta en acciones concretas:</p>
          <ol>
            <li>Servir a otros sin esperar nada a cambio</li>
            <li>Perdonar como hemos sido perdonados</li>
            <li>Mostrar compasión hacia los necesitados</li>
            <li>Ser pacientes con las debilidades de otros</li>
          </ol>
        `
      },
      {
        title: "Capítulo 4: La Esperanza Eterna",
        content: `
          <p>La esperanza cristiana no es un simple optimismo, sino una certeza basada en las promesas de Dios. Esta esperanza nos sostiene en los momentos más oscuros.</p>
          
          <h3>Fundamento de Nuestra Esperanza</h3>
          <p>Nuestra esperanza está fundamentada en la obra redentora de Cristo y en las promesas eternas de Dios para aquellos que creen en Él.</p>
          
          <blockquote style="border-left: 4px solid #8B5CF6; padding-left: 16px; margin: 16px 0; font-style: italic; color: #6B7280;">
            "Bendito el Dios y Padre de nuestro Señor Jesucristo, que según su grande misericordia nos hizo renacer para una esperanza viva" - 1 Pedro 1:3
          </blockquote>
          
          <h3>Viviendo con Esperanza</h3>
          <p>La esperanza eterna cambia nuestra perspectiva sobre:</p>
          <ul>
            <li>Las dificultades temporales</li>
            <li>El propósito de nuestra vida</li>
            <li>Nuestras relaciones con otros</li>
            <li>El futuro que nos espera</li>
          </ul>
        `
      },
      {
        title: "Capítulo 5: La Comunidad de Fe",
        content: `
          <p>La fe cristiana no está diseñada para vivirse en aislamiento. Dios nos ha llamado a formar parte de una comunidad de creyentes que se apoyan mutuamente.</p>
          
          <h3>La Importancia de la Comunidad</h3>
          <p>En la comunidad de fe encontramos:</p>
          <ul>
            <li>Apoyo en tiempos difíciles</li>
            <li>Celebración en momentos de gozo</li>
            <li>Corrección amorosa cuando nos desviamos</li>
            <li>Oportunidades para servir y crecer</li>
          </ul>
          
          <blockquote style="border-left: 4px solid #8B5CF6; padding-left: 16px; margin: 16px 0; font-style: italic; color: #6B7280;">
            "Y considerémonos unos a otros para estimularnos al amor y a las buenas obras" - Hebreos 10:24
          </blockquote>
          
          <h3>Construyendo Comunidad</h3>
          <p>Para construir una comunidad saludable necesitamos:</p>
          <ol>
            <li>Compromiso mutuo</li>
            <li>Transparencia y honestidad</li>
            <li>Perdón y gracia</li>
            <li>Servicio desinteresado</li>
          </ol>
        `
      }
    ];

    const currentChapter = chapters[Math.min(page - 1, chapters.length - 1)] || chapters[0];

    return `
      <div class="epub-content">
        <div class="document-header">
          <h1>${documentName}</h1>
          <p class="document-type">📚 Libro Electrónico (EPUB) - Página ${page}</p>
        </div>
        
        <h2>${currentChapter.title}</h2>
        ${currentChapter.content}
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; text-align: center; color: #6B7280;">
          <p><em>Página ${page} de ${chapters.length}</em></p>
        </div>
      </div>
    `;
  };

  const generatePdfContent = (documentName: string = 'Documento PDF', page: number = 1) => {
    const pages = [
      {
        title: "Estudio Bíblico: La Fe en Acción",
        content: `
          <p><strong>Fecha:</strong> Domingo, 15 de Octubre</p>
          <p><strong>Tema:</strong> Cómo vivir una fe práctica en el día a día</p>
          
          <h3>Introducción</h3>
          <p>La fe no es solo una creencia abstracta, sino una fuerza transformadora que debe manifestarse en nuestras acciones cotidianas. En este estudio exploraremos cómo hacer que nuestra fe sea visible y práctica.</p>
          
          <h3>Versículos Clave</h3>
          <div style="background-color: #F3F4F6; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p><em>"Así también la fe, si no tiene obras, es muerta en sí misma."</em> - Santiago 2:17</p>
          </div>
          
          <h3>Preguntas para Reflexión</h3>
          <ol>
            <li>¿Cómo se manifiesta tu fe en tu trabajo diario?</li>
            <li>¿Qué acciones concretas demuestran tu amor por Dios?</li>
            <li>¿Cómo puedes ser luz en tu comunidad?</li>
          </ol>
        `
      },
      {
        title: "Aplicación Práctica - Semana 1",
        content: `
          <h3>Aplicación Práctica</h3>
          <p>Esta semana, identifica tres maneras específicas en las que puedes poner tu fe en acción. Comparte tus experiencias con el grupo la próxima semana.</p>
          
          <h3>Desafíos Semanales</h3>
          <ol>
            <li><strong>Lunes-Martes:</strong> Practica la paciencia en situaciones estresantes</li>
            <li><strong>Miércoles-Jueves:</strong> Busca oportunidades para servir a otros</li>
            <li><strong>Viernes-Domingo:</strong> Comparte tu fe de manera natural</li>
          </ol>
          
          <h3>Notas del Estudio</h3>
          <div style="background-color: #FEF3C7; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p><strong>Recordatorio:</strong> La fe sin obras es como un árbol sin frutos. Nuestras acciones son el testimonio visible de lo que creemos en nuestro corazón.</p>
          </div>
        `
      },
      {
        title: "Testimonios y Reflexiones",
        content: `
          <h3>Testimonios de la Comunidad</h3>
          <p>Aquí compartimos algunas experiencias de miembros de nuestra comunidad que han puesto su fe en acción:</p>
          
          <div style="background-color: #EFF6FF; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <h4>María - Servicio en el Hospital</h4>
            <p><em>"Decidí ofrecer mi tiempo como voluntaria en el hospital local. Al principio era intimidante, pero pronto me di cuenta de que Dios me estaba usando para llevar esperanza a los pacientes."</em></p>
          </div>
          
          <div style="background-color: #F0FDF4; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <h4>Carlos - Perdón en el Trabajo</h4>
            <p><em>"Tuve que perdonar a un compañero que me había traicionado. Fue difícil, pero al hacerlo, no solo encontré paz, sino que también restauramos nuestra relación."</em></p>
          </div>
          
          <h3>Preguntas para Discusión Grupal</h3>
          <ul>
            <li>¿Qué testimonio te impactó más y por qué?</li>
            <li>¿Has tenido una experiencia similar?</li>
            <li>¿Cómo puedes aplicar estos ejemplos en tu vida?</li>
          </ul>
        `
      },
      {
        title: "Recursos Adicionales",
        content: `
          <h3>Lecturas Recomendadas</h3>
          <ul>
            <li><strong>Libros:</strong>
              <ul>
                <li>"Radical" por David Platt</li>
                <li>"El Costo del Discipulado" por Dietrich Bonhoeffer</li>
                <li>"Cristianismo Auténtico" por Ray Ortlund</li>
              </ul>
            </li>
          </ul>
          
          <h3>Versículos para Memorizar</h3>
          <div style="background-color: #FEF3C7; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p><strong>Esta semana:</strong> Santiago 2:17</p>
            <p><em>"Así también la fe, si no tiene obras, es muerta en sí misma."</em></p>
          </div>
          
          <h3>Próximos Estudios</h3>
          <ol>
            <li><strong>Semana 2:</strong> "El Poder de la Oración Comunitaria"</li>
            <li><strong>Semana 3:</strong> "Viviendo en Comunidad"</li>
            <li><strong>Semana 4:</strong> "Compartiendo Nuestra Fe"</li>
          </ol>
          
          <h3>Contacto</h3>
          <p>Para más información sobre estos estudios, contacta al líder del grupo o visita nuestra página web.</p>
        `
      },
      {
        title: "Notas Personales",
        content: `
          <h3>Espacio para Notas Personales</h3>
          <p>Usa este espacio para escribir tus reflexiones, oraciones y compromisos personales:</p>
          
          <div style="border: 1px solid #D1D5DB; min-height: 200px; padding: 16px; margin: 16px 0; background-color: #FAFAFA;">
            <p style="color: #9CA3AF; font-style: italic;">Mis reflexiones sobre este estudio...</p>
          </div>
          
          <h3>Compromisos de Oración</h3>
          <div style="border: 1px solid #D1D5DB; min-height: 150px; padding: 16px; margin: 16px 0; background-color: #FAFAFA;">
            <p style="color: #9CA3AF; font-style: italic;">Por quién y qué voy a orar esta semana...</p>
          </div>
          
          <h3>Metas de Acción</h3>
          <div style="border: 1px solid #D1D5DB; min-height: 150px; padding: 16px; margin: 16px 0; background-color: #FAFAFA;">
            <p style="color: #9CA3AF; font-style: italic;">Acciones específicas que tomaré para vivir mi fe...</p>
          </div>
        `
      }
    ];

    const currentPage = pages[Math.min(page - 1, pages.length - 1)] || pages[0];

    return `
      <div class="pdf-content">
        <div class="document-header">
          <h1>${documentName}</h1>
          <p class="document-type">📄 Documento PDF - Página ${page}</p>
        </div>
        
        <h2>${currentPage.title}</h2>
        ${currentPage.content}
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; text-align: center; color: #6B7280;">
          <p><em>Página ${page} de ${pages.length}</em></p>
        </div>
      </div>
    `;
  };

  const createSession = async (doc?: any) => {
    try {
      const documentToUse = doc || documentData;
      if (!documentToUse) {
        console.error('Cannot create session: document is null or undefined');
        throw new Error('Document not loaded');
      }

      if (!documentToUse.name) {
        console.error('Cannot create session: document name is missing');
        throw new Error('Document name is missing');
      }

      // This would create a new collaborative session
      const newSession: CollaborativeSession = {
        id: `session-${Date.now()}`,
        documentId: documentId!,
        name: `Lectura colaborativa: ${documentToUse.name}`,
        participants: [{
          id: 'current-user',
          name: 'Tú',
          isOnline: true,
          currentPage: 1,
          role: 'host'
        }],
        currentPage: 1,
        isActive: true,
        createdBy: 'current-user',
        createdAt: new Date().toISOString()
      };

      setSession(newSession);
      setIsHost(true);
      setParticipants(newSession.participants);

      toast.success(`Sesión colaborativa creada para "${documentToUse.name}"`);
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Error al crear la sesión colaborativa');
      throw error;
    }
  };

  const joinSession = async () => {
    try {
      // This would join an existing session
      toast.success('Te has unido a la sesión colaborativa');
    } catch (error) {
      console.error('Error joining session:', error);
      toast.error('Error al unirse a la sesión');
    }
  };

  const navigateChapter = (direction: 'prev' | 'next') => {
    const newChapter = direction === 'prev' ? currentChapter - 1 : currentChapter + 1;
    if (newChapter >= 1 && newChapter <= totalChapters) {
      navigateToChapter(newChapter);
    } else {
      // Provide feedback when at boundaries
      if (newChapter < 1) {
        toast.info('Ya estás en el primer capítulo');
      } else if (newChapter > totalChapters) {
        toast.info('Ya estás en el último capítulo');
      }
    }
  };

  // No need for complex blocking - just remove all links from content

  // NUCLEAR navigation prevention
  useEffect(() => {
    // Override window.location to prevent navigation
    const originalLocation = window.location;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      const targetUrl = window.location.href;

      // If it's trying to navigate to a chapter file, prevent it
      if (targetUrl.includes('.xhtml') || targetUrl.includes('.html')) {
        event.preventDefault();
        event.returnValue = 'Permaneciendo en la sesión de lectura';
        return 'Permaneciendo en la sesión de lectura';
      }
    };

    // Intercept history changes
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (state, title, url) {
      const urlStr = url?.toString() || '';
      if (urlStr && (urlStr.includes('.xhtml') || urlStr.includes('.html'))) {
        return;
      }
      return originalPushState.call(this, state, title, url);
    };

    history.replaceState = function (state, title, url) {
      const urlStr = url?.toString() || '';
      if (urlStr && (urlStr.includes('.xhtml') || urlStr.includes('.html'))) {
        return;
      }
      return originalReplaceState.call(this, state, title, url);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        history.pushState = originalPushState;
        history.replaceState = originalReplaceState;
      };
    }
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spiritual mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold mb-2">Cargando documento...</h2>
              <p className="text-muted-foreground">Preparando la sesión colaborativa</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <style dangerouslySetInnerHTML={{ __html: gloseStyles }} />

      {/* Text Selection Handler */}
      <TextSelectionHandler
        onTextSelected={handleTextSelected}
        onSelectionCleared={handleSelectionCleared}
        isEnabled={isHighlightMode}
        currentChapter={currentChapter}
      />

      {/* Highlight Renderer */}
      <HighlightRenderer
        highlights={highlights}
        onHighlightClick={handleHighlightClick}
        currentChapter={currentChapter}
      />

      {/* Highlight Toolbar */}
      <HighlightToolbar
        isVisible={showHighlightPopup && textSelection.isActive}
        position={highlightPopupPosition}
        selectedText={textSelection.selectedText}
        onCreateHighlight={createHighlight}
        onClose={handleSelectionCleared}
      />

      {/* Desktop Layout */}
      <div className="hidden lg:flex h-screen overflow-hidden">
        {/* Sidebar - Fixed height, scrollable independently */}
        <div className="w-80 bg-card/50 backdrop-blur-lg border-r border-border p-6 space-y-6 overflow-y-auto flex-shrink-0">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-orange-400" />
                <span className="text-lg font-medium text-muted-foreground">Leyendo ahora,</span>
              </div>
              <ThemeToggle />
            </div>
            <h1 className="text-2xl font-bold">{documentData?.name || 'Cargando...'}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {epubBook && epubBook.chapters[currentChapter - 1] 
                ? epubBook.chapters[currentChapter - 1].title 
                : `Capítulo ${currentChapter}`
              }
            </p>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            <button 
              onClick={() => setShowTableOfContents(!showTableOfContents)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg ${showTableOfContents 
                ? 'bg-gray-500/10 text-gray-400' 
                : 'text-muted-foreground hover:bg-muted/50'
              }`}
            >
              <List className="w-5 h-5" />
              <span className="font-medium">Índice</span>
            </button>
            <button 
              onClick={() => setIsHighlightMode(!isHighlightMode)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg ${isHighlightMode 
                ? 'bg-yellow-500/10 text-yellow-600' 
                : 'text-muted-foreground hover:bg-muted/50'
              }`}
            >
              <Highlighter className="w-5 h-5" />
              <span>Resaltar</span>
            </button>
            <button 
              onClick={() => setShowComments(!showComments)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg ${showComments 
                ? 'bg-gray-500/10 text-gray-400' 
                : 'text-muted-foreground hover:bg-muted/50'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              <span>Comentarios</span>
            </button>
            <button 
              onClick={() => setShowParticipants(!showParticipants)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors border-2 ${showParticipants 
                ? 'bg-blue-50/50 text-blue-700 border-blue-600' 
                : 'text-muted-foreground hover:bg-muted/50 border-transparent'
              }`}
            >
              <Users className="w-5 h-5" />
              <span>Colaboradores</span>
            </button>
          </nav>
        </div>

        {/* Main Content - Scrollable independently */}
        <div className="flex-1 p-8 max-w-4xl overflow-y-auto">
          <div className="space-y-8">
            {/* Reading Progress Card - Como BibleAppPreview */}
            <div className="bible-card-sunset relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-white/80 text-sm font-medium">Progreso de lectura</p>
                    <p className="text-white text-xl font-semibold">Capítulo {currentChapter} de {totalChapters}</p>
                  </div>
                  <button 
                    onClick={() => navigateChapter('next')}
                    disabled={currentChapter >= totalChapters}
                    className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 text-white font-medium flex items-center gap-2 disabled:opacity-50"
                  >
                    <ChevronRight className="w-5 h-5" />
                    Siguiente
                  </button>
                </div>

                <div className="mb-8">
                  <p className="text-white text-lg font-medium leading-relaxed">
                    {epubBook && epubBook.chapters[currentChapter - 1] 
                      ? epubBook.chapters[currentChapter - 1].title 
                      : 'Continuando con la lectura...'
                    }
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => navigateChapter('prev')}
                      disabled={currentChapter <= 1}
                      className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 text-white disabled:opacity-50"
                    >
                      <ChevronLeft className="w-5 h-5" />
                      <span>Anterior</span>
                    </button>
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 text-white">
                      <Highlighter className="w-5 h-5" />
                      <span>{highlights.length}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowComments(!showComments)}
                    className="bg-white/20 backdrop-blur-sm rounded-full p-4 text-white"
                  >
                    <MessageSquare className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Background decoration */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mb-20"></div>
                <div className="absolute top-1/2 right-12 w-3 h-3 bg-white/30 rounded-full"></div>
                <div className="absolute top-1/3 right-24 w-2 h-2 bg-white/40 rounded-full"></div>
              </div>
            </div>

            {/* Reading Content - Full Width */}
            <div className="bible-glass-card min-h-[60vh] relative overflow-hidden">
              <div className="bible-reading-content">
                {epubBook && useGloseReader ? (
                  <GloseScrollReader
                    ref={gloseReaderRef}
                    epubBook={epubBook}
                    onChapterChange={handleChapterChange}
                    currentChapter={currentChapter}
                  />
                ) : (
                  <div className="text-center py-12">
                    <div className="w-8 h-8 border-2 border-gray-500 border-t-transparent rounded-full mx-auto mb-4 animate-spin"></div>
                    <p className="text-foreground">
                      {epubBook ? 'Preparando lector...' : 'Cargando contenido...'}
                    </p>
                    {epubBook && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Libro: {epubBook.title} ({epubBook.chapters.length} capítulos)
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout - EXACTO como BibleAppPreview */}
      <div className="lg:hidden p-4 space-y-6 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-6 h-6 text-orange-400" />
              <span className="text-lg font-medium text-muted-foreground">Leyendo ahora,</span>
            </div>
            <h1 className="bible-heading">{documentData?.name || 'Cargando...'}</h1>
          </div>
          <div className="flex flex-col items-end gap-2">
            <ThemeToggle />
            <p className="text-sm text-muted-foreground">Cap {currentChapter}/{totalChapters}</p>
          </div>
        </div>

        {/* Progress Card - Mobile */}
        <div className="bible-card-sunset relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white/80 text-sm font-medium">Progreso de lectura</p>
                <p className="text-white text-lg font-semibold">Capítulo {currentChapter} de {totalChapters}</p>
              </div>
              <button 
                onClick={() => navigateChapter('next')}
                disabled={currentChapter >= totalChapters}
                className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
                Siguiente
              </button>
            </div>

            <div className="mb-6">
              <p className="text-white text-xl font-medium leading-relaxed">
                {epubBook && epubBook.chapters[currentChapter - 1] 
                  ? epubBook.chapters[currentChapter - 1].title 
                  : 'Continuando con la lectura...'
                }
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => navigateChapter('prev')}
                  disabled={currentChapter <= 1}
                  className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="text-sm">Anterior</span>
                </button>
                <button className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white">
                  <Highlighter className="w-4 h-4" />
                  <span className="text-sm">{highlights.length}</span>
                </button>
              </div>
              <button 
                onClick={() => setShowComments(!showComments)}
                className="bg-white/20 backdrop-blur-sm rounded-full p-3 text-white"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Background decoration */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mb-16"></div>
            <div className="absolute top-1/2 right-8 w-2 h-2 bg-white/30 rounded-full"></div>
            <div className="absolute top-1/3 right-16 w-1 h-1 bg-white/40 rounded-full"></div>
          </div>
        </div>

        {/* Reading Content */}
        <div className="bible-glass-card min-h-[60vh] relative overflow-hidden">
          <div className="bible-reading-content">
            {epubBook && useGloseReader ? (
              <GloseScrollReader
                ref={gloseReaderRef}
                epubBook={epubBook}
                onChapterChange={handleChapterChange}
                currentChapter={currentChapter}
              />
            ) : (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-gray-500 border-t-transparent rounded-full mx-auto mb-4 animate-spin"></div>
                <p className="text-foreground">
                  {epubBook ? 'Preparando lector...' : 'Cargando contenido...'}
                </p>
                {epubBook && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Libro: {epubBook.title} ({epubBook.chapters.length} capítulos)
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Bottom Navigation - Only on Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-lg border-t border-border">
        <div className="flex items-center justify-around py-3 px-4 max-w-md mx-auto">
          <button 
            onClick={() => setShowTableOfContents(!showTableOfContents)}
            className="flex flex-col items-center gap-1 p-2"
          >
            <div className={`w-6 h-6 ${showTableOfContents ? 'bg-gray-500' : ''} rounded-full flex items-center justify-center`}>
              <List className={`w-4 h-4 ${showTableOfContents ? 'text-white' : 'text-muted-foreground'}`} />
            </div>
            <span className={`text-xs ${showTableOfContents ? 'text-gray-500 font-medium' : 'text-muted-foreground'}`}>Índice</span>
          </button>

          <button 
            onClick={() => setIsHighlightMode(!isHighlightMode)}
            className="flex flex-col items-center gap-1 p-2"
          >
            <div className={`w-6 h-6 ${isHighlightMode ? 'bg-yellow-500' : ''} rounded-full flex items-center justify-center`}>
              <Highlighter className={`w-4 h-4 ${isHighlightMode ? 'text-white' : 'text-muted-foreground'}`} />
            </div>
            <span className={`text-xs ${isHighlightMode ? 'text-yellow-600 font-medium' : 'text-muted-foreground'}`}>Resaltar</span>
          </button>

          <button 
            onClick={() => setShowComments(!showComments)}
            className="flex flex-col items-center gap-1 p-2"
          >
            <div className={`w-6 h-6 ${showComments ? 'bg-gray-500' : ''} rounded-full flex items-center justify-center`}>
              <MessageSquare className={`w-4 h-4 ${showComments ? 'text-white' : 'text-muted-foreground'}`} />
            </div>
            <span className={`text-xs ${showComments ? 'text-gray-500 font-medium' : 'text-muted-foreground'}`}>Comentarios</span>
          </button>

          <button 
            onClick={() => setShowInviteModal(true)}
            className="flex flex-col items-center gap-1 p-2"
          >
            <div className={`w-6 h-6 ${showInviteModal ? 'bg-gray-500' : ''} rounded-full flex items-center justify-center`}>
              <Users className={`w-4 h-4 ${showInviteModal ? 'text-white' : 'text-muted-foreground'}`} />
            </div>
            <span className={`text-xs ${showInviteModal ? 'text-gray-500 font-medium' : 'text-muted-foreground'}`}>Colaborar</span>
          </button>
        </div>
      </div>

      {/* Enhanced Comments Panel */}
      <EnhancedCommentsPanel
        isVisible={showComments}
        highlights={highlights}
        currentChapter={currentChapter}
        totalChapters={totalChapters}
        currentUserId={currentUserId}
        onClose={() => setShowComments(false)}
        onNavigateToHighlight={handleNavigateToHighlight}
        onHighlightClick={(highlight) => {
          setSelectedHighlight(highlight as any);
          setShowCommentPopup(true);
          setShowComments(false);
        }}
      />

      {/* Comment Popup */}
      <CommentPopup
        isVisible={showCommentPopup}
        position={highlightPopupPosition}
        highlight={selectedHighlight}
        onAddComment={handleAddComment}
        onEditComment={handleEditComment}
        onDeleteComment={handleDeleteComment}
        onDeleteHighlight={handleDeleteHighlight}
        onChangeHighlightColor={handleChangeHighlightColor}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        onClose={() => {
          setShowCommentPopup(false);
          setSelectedHighlight(null);
        }}
      />




      {/* Floating Panels - Responsive */}

      {/* Table of Contents Panel */}
      {showTableOfContents && documentData?.file_type === 'epub' && epubBook && (
        <div className="fixed inset-0 z-50 md:inset-auto md:top-20 md:right-6 md:w-80 md:max-h-[70vh]">
          {/* Mobile Overlay */}
          <div className="md:hidden absolute inset-0 bg-black/50" onClick={() => setShowTableOfContents(false)}></div>

          {/* Panel Content */}
          <div className="absolute bottom-0 left-0 right-0 md:relative md:bottom-auto bg-white rounded-t-2xl md:rounded-2xl shadow-2xl max-h-[80vh] md:max-h-full overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Índice</h3>
                    <p className="text-sm text-gray-500">
                      {epubBook.totalChapters} capítulos • {Math.round((currentChapter / epubBook.totalChapters) * 100)}% completado
                    </p>
                    {showAuxiliaryContent && (
                      <p className="text-xs text-orange-600 font-medium mt-1">
                        📋 Mostrando contenido auxiliar
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAuxiliaryContent(!showAuxiliaryContent)}
                    className={`p-2 rounded-full transition-colors ${showAuxiliaryContent
                      ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                      : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                      }`}
                    title={showAuxiliaryContent ? "Ocultar contenido auxiliar" : "Mostrar contenido auxiliar"}
                  >
                    {showAuxiliaryContent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => setShowTableOfContents(false)}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <X className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Content Filter Info */}
              {!showAuxiliaryContent && (
                <div className="mb-4 p-3 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex items-center gap-2 text-sm text-green-800">
                    <Eye className="h-4 w-4" />
                    <span className="font-medium">Solo capítulos principales</span>
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    Mostrando solo el contenido narrativo principal. Usa el botón 👁️ para ver todo.
                  </p>
                </div>
              )}

              {showAuxiliaryContent && (
                <div className="mb-4 p-3 bg-orange-50 rounded-xl border border-orange-200">
                  <div className="flex items-center gap-2 text-sm text-orange-800">
                    <Eye className="h-4 w-4" />
                    <span className="font-medium">Todo el contenido visible</span>
                  </div>
                  <p className="text-xs text-orange-600 mt-1">
                    Incluye prólogos, índices, agradecimientos y otros elementos no narrativos.
                  </p>
                </div>
              )}

              {/* Progress Bar - Glose Style */}
              <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-blue-700">Progreso de lectura</span>
                  <span className="text-xs text-blue-600">{Math.round((currentChapter / epubBook.totalChapters) * 100)}%</span>
                </div>
                <div className="w-full bg-blue-100 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(currentChapter / epubBook.totalChapters) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-blue-600 mt-1">
                  <span>Capítulo {currentChapter}</span>
                  <span>{epubBook.totalChapters - currentChapter} restantes</span>
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {epubBook.chapters
                  .map((chapter, originalIndex) => {
                    // Basic auxiliary content detection based on title
                    const isAuxiliary = isAuxiliaryChapter(chapter.title);
                    const shouldShow = showAuxiliaryContent || !isAuxiliary;

                    if (!shouldShow) return null;

                    return { chapter, originalIndex };
                  })
                  .filter(Boolean)
                  .map(({ chapter, originalIndex }) => {
                    const isCurrentChapter = currentChapter === originalIndex + 1;
                    const isRead = originalIndex + 1 < currentChapter;
                    const estimatedReadTime = Math.ceil((chapter.wordCount || 0) / 200); // 200 words per minute

                    return (
                      <button
                        type="button"
                        key={chapter.id}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          navigateToChapter(originalIndex + 1);
                        }}
                        className={`w-full text-left p-4 rounded-xl transition-all group ${isCurrentChapter
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-[1.02]'
                          : isRead
                            ? 'hover:bg-green-50 text-gray-700 border border-green-100'
                            : 'hover:bg-gray-50 text-gray-700'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-medium relative ${isCurrentChapter
                            ? 'bg-white/20 text-white'
                            : isRead
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600'
                            }`}>
                            {isRead && !isCurrentChapter && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">✓</span>
                              </div>
                            )}
                            {isCurrentChapter && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
                            )}
                            {chapter.order}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="font-medium text-sm leading-tight">{chapter.title}</div>
                              {isAuxiliaryChapter(chapter.title) && (
                                <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${isCurrentChapter
                                  ? 'bg-white/20 text-white'
                                  : 'bg-orange-100 text-orange-600'
                                  }`}>
                                  AUX
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                              <span className={`${isCurrentChapter ? 'text-white/70' : 'text-gray-500'
                                }`}>
                                📖 {chapter.wordCount?.toLocaleString() || 'N/A'} palabras
                              </span>
                              <span className={`${isCurrentChapter ? 'text-white/70' : 'text-gray-500'
                                }`}>
                                ⏱️ ~{estimatedReadTime} min
                              </span>
                            </div>
                            {isRead && !isCurrentChapter && (
                              <div className="text-xs text-green-600 mt-1 font-medium">
                                ✅ Leído
                              </div>
                            )}
                            {isCurrentChapter && (
                              <div className="text-xs text-white/80 mt-1 font-medium">
                                👁️ Leyendo ahora
                              </div>
                            )}
                          </div>
                          <div className={`text-xs ${isCurrentChapter ? 'text-white/60' : 'text-gray-400'
                            }`}>
                            →
                          </div>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Participants Panel */}
      {showParticipants && (
        <div className="fixed inset-0 z-50 md:inset-auto md:top-20 md:left-6 md:w-80 md:max-h-[70vh]">
          {/* Mobile Overlay */}
          <div className="md:hidden absolute inset-0 bg-black/50" onClick={() => setShowParticipants(false)}></div>

          {/* Panel Content */}
          <div className="absolute bottom-0 left-0 right-0 md:relative md:bottom-auto bg-white rounded-t-2xl md:rounded-2xl shadow-2xl max-h-[80vh] md:max-h-full overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-600 rounded-xl flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Lectores</h3>
                    <p className="text-sm text-gray-500">{participants.length} conectados</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowParticipants(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="h-4 w-4 text-gray-600" />
                </button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {participants.map((participant) => (
                  <div key={participant.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                        {participant.name.charAt(0).toUpperCase()}
                      </div>
                      {participant.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 text-sm">{participant.name}</p>
                        {participant.role === 'host' && (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">Host</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {participant.isOnline ? `👀 Capítulo ${participant.currentPage}` : '💤 Desconectado'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Compartir Enlace Section */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Invitar Colaboradores</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 flex items-center shadow-inner">
                    <input 
                      readOnly
                      value={window.location.href}
                      className="flex-1 bg-transparent border-none focus:ring-0 text-xs text-gray-600 outline-none truncate"
                    />
                  </div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success('¡Enlace listo para pegar!');
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-2.5 rounded-lg flex items-center gap-1.5 font-medium text-xs transition-colors"
                  >
                    <Copy className="h-3 w-3" />
                    Copiar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Comments Panel */}
      <EnhancedCommentsPanel
        isVisible={showComments}
        highlights={highlights}
        currentChapter={currentChapter}
        totalChapters={totalChapters}
        onClose={() => setShowComments(false)}
        onNavigateToHighlight={handleNavigateToHighlight}
        onHighlightClick={(highlight) => {
          setSelectedHighlight(highlight as any);
          setShowCommentPopup(true);
          setShowComments(false);
        }}
      />

      {/* Highlight Popup */}
      {showHighlightPopup && selectedText && (
        <div
          className="fixed z-50 transform -translate-x-1/2 -translate-y-full"
          style={{
            left: highlightPopupPosition.x,
            top: highlightPopupPosition.y,
          }}
        >
          <div className="bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-2xl border border-white/20">
            <div className="text-xs font-medium text-gray-700 mb-2 max-w-48 truncate">
              "{selectedText.substring(0, 30)}{selectedText.length > 30 ? '...' : ''}"
            </div>

            {/* Highlight Colors */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => createHighlight('yellow')}
                className="w-6 h-6 rounded-full bg-yellow-300 hover:bg-yellow-400 transition-all hover:scale-110 shadow-md"
                title="Amarillo"
              />
              <button
                onClick={() => createHighlight('blue')}
                className="w-6 h-6 rounded-full bg-blue-300 hover:bg-blue-400 transition-all hover:scale-110 shadow-md"
                title="Azul"
              />
              <button
                onClick={() => createHighlight('green')}
                className="w-6 h-6 rounded-full bg-green-300 hover:bg-green-400 transition-all hover:scale-110 shadow-md"
                title="Verde"
              />
              <button
                onClick={() => createHighlight('pink')}
                className="w-6 h-6 rounded-full bg-pink-300 hover:bg-pink-400 transition-all hover:scale-110 shadow-md"
                title="Rosa"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setNewComment(`"${selectedText}" - `);
                  setShowHighlightPopup(false);
                  setShowComments(true);
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full transition-colors"
              >
                <MessageSquare className="h-3 w-3" />
                Comentar
              </button>
              <button
                onClick={() => {
                  setIsRecording(true);
                  setShowHighlightPopup(false);
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-red-50 hover:bg-red-100 text-red-700 rounded-full transition-colors"
              >
                <Mic className="h-3 w-3" />
                Voz
              </button>
            </div>

            <button
              onClick={() => setShowHighlightPopup(false)}
              className="absolute -top-1 -right-1 w-5 h-5 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors text-xs"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-3">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <button onClick={() => setShowInviteModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Colaboradores</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Este es un libro colaborativo. Copia este enlace mágico y envíalo para que tus conocidos puedan leer simultáneamente contigo, debatir y ver tus notas.</p>
            </div>
            
            <div className="p-6 bg-gray-50/50">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Enlace de lectura</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2.5 flex items-center shadow-sm">
                  <input 
                    readOnly
                    value={window.location.href}
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-gray-600 outline-none truncate"
                  />
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success('¡Enlace copiado al portapapeles!');
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium text-sm transition-colors shadow-sm"
                >
                  <Copy className="h-4 w-4" />
                  Copiar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollaborativeReader;
