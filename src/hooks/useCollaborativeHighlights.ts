import { useState, useEffect, useCallback, useRef } from 'react';

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
    startContainer: string;
    endContainer: string;
  };
  position: { x: number; y: number };
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

interface Comment {
  id: string;
  highlightId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content?: string;
  audioUrl?: string;
  type: 'text' | 'audio' | 'emoji';
  emoji?: string;
  chapterNumber: number;
  timestamp: string;
  reactions: any[];
}

interface CollaborativeEvent {
  type: 'highlight_created' | 'highlight_updated' | 'highlight_deleted' | 'comment_added' | 'comment_updated' | 'comment_deleted';
  data: any;
  userId: string;
  userName: string;
  timestamp: string;
  sessionId: string;
}

interface UseCollaborativeHighlightsProps {
  sessionId: string;
  userId: string;
  userName: string;
  onHighlightUpdate?: (highlights: Highlight[]) => void;
}

export const useCollaborativeHighlights = ({
  sessionId,
  userId,
  userName,
  onHighlightUpdate
}: UseCollaborativeHighlightsProps) => {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);

  // Simulate WebSocket connection (in real implementation, this would be actual WebSocket)
  const connect = useCallback(() => {
    try {
      // For now, we'll simulate the connection
      
      // Simulate connection success immediately (no timeout to avoid loops)
      setIsConnected(true);
      reconnectAttempts.current = 0;
      
      // Initialize with empty highlights
      const existingHighlights: Highlight[] = [];
      setHighlights(existingHighlights);
      onHighlightUpdate?.(existingHighlights);

    } catch (error) {
      console.error('❌ Failed to connect to collaborative session:', error);
      scheduleReconnect();
    }
  }, [sessionId]); // Remove onHighlightUpdate from dependencies

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttempts.current < 5) {
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
      reconnectAttempts.current++;
      
      
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, delay);
    } else {
      console.error('❌ Max reconnection attempts reached');
      setIsConnected(false);
    }
  }, [connect]);

  // Broadcast event to other participants
  const broadcastEvent = useCallback((event: Omit<CollaborativeEvent, 'userId' | 'userName' | 'timestamp' | 'sessionId'>) => {
    if (!isConnected) {
      console.warn('⚠️ Cannot broadcast event: not connected');
      return;
    }

    const fullEvent: CollaborativeEvent = {
      ...event,
      userId,
      userName,
      timestamp: new Date().toISOString(),
      sessionId
    };

    // In real implementation, this would send via WebSocket:
    // wsRef.current?.send(JSON.stringify(fullEvent));

    // For now, we'll simulate local updates
    setTimeout(() => {
      handleCollaborativeEvent(fullEvent);
    }, 100);
  }, [isConnected, userId, userName, sessionId]);

  // Handle incoming collaborative events
  const handleCollaborativeEvent = useCallback((event: CollaborativeEvent) => {

    // Don't process our own events
    if (event.userId === userId) {
      return;
    }

    switch (event.type) {
      case 'highlight_created':
        setHighlights(prev => {
          const newHighlights = [...prev, event.data];
          onHighlightUpdate?.(newHighlights);
          return newHighlights;
        });
        break;

      case 'highlight_updated':
        setHighlights(prev => {
          const newHighlights = prev.map(h => 
            h.id === event.data.id ? { ...h, ...event.data } : h
          );
          onHighlightUpdate?.(newHighlights);
          return newHighlights;
        });
        break;

      case 'highlight_deleted':
        setHighlights(prev => {
          const newHighlights = prev.filter(h => h.id !== event.data.highlightId);
          onHighlightUpdate?.(newHighlights);
          return newHighlights;
        });
        break;

      case 'comment_added':
        setHighlights(prev => {
          const newHighlights = prev.map(h => 
            h.id === event.data.highlightId 
              ? { ...h, comments: [...h.comments, event.data] }
              : h
          );
          onHighlightUpdate?.(newHighlights);
          return newHighlights;
        });
        break;

      case 'comment_updated':
        setHighlights(prev => {
          const newHighlights = prev.map(h => 
            h.id === event.data.highlightId 
              ? {
                  ...h,
                  comments: h.comments.map(c => 
                    c.id === event.data.id ? { ...c, ...event.data } : c
                  )
                }
              : h
          );
          onHighlightUpdate?.(newHighlights);
          return newHighlights;
        });
        break;

      case 'comment_deleted':
        setHighlights(prev => {
          const newHighlights = prev.map(h => 
            h.id === event.data.highlightId 
              ? {
                  ...h,
                  comments: h.comments.filter(c => c.id !== event.data.commentId)
                }
              : h
          );
          onHighlightUpdate?.(newHighlights);
          return newHighlights;
        });
        break;
    }
  }, [userId, onHighlightUpdate]);

  // Public methods for managing highlights collaboratively
  const createHighlight = useCallback((highlight: Highlight) => {

    // Update local state immediately
    setHighlights(prev => {
      const newHighlights = [...prev, highlight];
      onHighlightUpdate?.(newHighlights);
      return newHighlights;
    });

    // Broadcast to other participants
    broadcastEvent({
      type: 'highlight_created',
      data: highlight
    });
  }, [broadcastEvent, onHighlightUpdate]);

  const updateHighlight = useCallback((highlightId: string, updates: Partial<Highlight>) => {
    setHighlights(prev => {
      const newHighlights = prev.map(h => 
        h.id === highlightId ? { ...h, ...updates } : h
      );
      onHighlightUpdate?.(newHighlights);
      return newHighlights;
    });

    broadcastEvent({
      type: 'highlight_updated',
      data: { id: highlightId, ...updates }
    });
  }, [broadcastEvent, onHighlightUpdate]);

  const deleteHighlight = useCallback((highlightId: string) => {
    setHighlights(prev => {
      const newHighlights = prev.filter(h => h.id !== highlightId);
      onHighlightUpdate?.(newHighlights);
      return newHighlights;
    });

    broadcastEvent({
      type: 'highlight_deleted',
      data: { highlightId }
    });
  }, [broadcastEvent, onHighlightUpdate]);

  const addComment = useCallback((comment: Comment) => {
    setHighlights(prev => {
      const newHighlights = prev.map(h => 
        h.id === comment.highlightId 
          ? { ...h, comments: [...h.comments, comment] }
          : h
      );
      onHighlightUpdate?.(newHighlights);
      return newHighlights;
    });

    broadcastEvent({
      type: 'comment_added',
      data: comment
    });
  }, [broadcastEvent, onHighlightUpdate]);

  const updateComment = useCallback((highlightId: string, commentId: string, updates: Partial<Comment>) => {
    setHighlights(prev => {
      const newHighlights = prev.map(h => 
        h.id === highlightId 
          ? {
              ...h,
              comments: h.comments.map(c => 
                c.id === commentId ? { ...c, ...updates } : c
              )
            }
          : h
      );
      onHighlightUpdate?.(newHighlights);
      return newHighlights;
    });

    broadcastEvent({
      type: 'comment_updated',
      data: { id: commentId, highlightId, ...updates }
    });
  }, [broadcastEvent, onHighlightUpdate]);

  const deleteComment = useCallback((highlightId: string, commentId: string) => {
    setHighlights(prev => {
      const newHighlights = prev.map(h => 
        h.id === highlightId 
          ? {
              ...h,
              comments: h.comments.filter(c => c.id !== commentId)
            }
          : h
      );
      onHighlightUpdate?.(newHighlights);
      return newHighlights;
    });

    broadcastEvent({
      type: 'comment_deleted',
      data: { highlightId, commentId }
    });
  }, [broadcastEvent, onHighlightUpdate]);

  // Initialize connection
  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [sessionId]); // Only reconnect when sessionId changes

  return {
    highlights,
    isConnected,
    participants,
    createHighlight,
    updateHighlight,
    deleteHighlight,
    addComment,
    updateComment,
    deleteComment
  };
};