import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Mic, Smile, Send, X, Play, Pause, Edit2, Trash2 } from 'lucide-react';

interface Comment {
  id: string;
  highlightId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content?: string;
  audioUrl?: string;
  audioBlob?: Blob;
  type: 'text' | 'audio' | 'emoji';
  emoji?: string;
  chapterNumber: number;
  timestamp: string;
  reactions: any[];
  isEditing?: boolean;
}

interface Highlight {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  color: string;
  chapterNumber: number;
  comments: Comment[];
  createdAt: string;
}

const REACTION_EMOJIS = [
  '❤️', '🙏', '💡', '👍', '😊', '🤔', '✨', '🔥', 
  '📖', '💭', '🎯', '⭐', '🔖', '💫', '🌟', '✍️'
];

interface CommentPopupProps {
  isVisible: boolean;
  position: { x: number; y: number };
  highlight: Highlight | null;
  onAddComment: (highlightId: string, comment: Omit<Comment, 'id' | 'timestamp'>) => void;
  onEditComment?: (highlightId: string, commentId: string, newContent: string) => void;
  onDeleteComment?: (highlightId: string, commentId: string) => void;
  onDeleteHighlight?: (highlightId: string) => void;
  onChangeHighlightColor?: (highlightId: string, newColor: string) => void;
  onClose: () => void;
  currentUserId?: string;
}

const HIGHLIGHT_COLORS = {
  yellow: { bg: '#fff3cd', border: '#ffeaa7', name: 'Amarillo' },
  green: { bg: '#d4edda', border: '#a3d977', name: 'Verde' },
  blue: { bg: '#cce5ff', border: '#74b9ff', name: 'Azul' },
  pink: { bg: '#f8d7da', border: '#fd79a8', name: 'Rosa' },
  purple: { bg: '#e2d9f3', border: '#a29bfe', name: 'Morado' },
  orange: { bg: '#ffeaa7', border: '#fdcb6e', name: 'Naranja' }
};

export const CommentPopup: React.FC<CommentPopupProps> = ({
  isVisible,
  position,
  highlight,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onDeleteHighlight,
  onChangeHighlightColor,
  onClose,
  currentUserId = 'current-user'
}) => {
  const [commentType, setCommentType] = useState<'text' | 'audio' | 'emoji'>('text');
  const [textComment, setTextComment] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Position the popup
  useEffect(() => {
    if (isVisible && popupRef.current) {
      const popup = popupRef.current;
      const rect = popup.getBoundingClientRect();
      
      // Adjust position to keep popup in viewport
      let adjustedX = position.x - rect.width / 2;
      let adjustedY = position.y - rect.height - 10;

      // Keep within viewport bounds
      if (adjustedX < 10) adjustedX = 10;
      if (adjustedX + rect.width > window.innerWidth - 10) {
        adjustedX = window.innerWidth - rect.width - 10;
      }
      if (adjustedY < 10) adjustedY = position.y + 30;

      popup.style.left = `${adjustedX}px`;
      popup.style.top = `${adjustedY}px`;
    }
  }, [isVisible, position]);

  // Focus textarea when switching to text mode
  useEffect(() => {
    if (commentType === 'text' && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [commentType]);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isVisible, onClose]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isVisible, onClose]);

  const handleSubmitTextComment = () => {
    if (!textComment.trim() || !highlight) return;

    onAddComment(highlight.id, {
      highlightId: highlight.id,
      userId: 'current-user',
      userName: 'Current User',
      content: textComment.trim(),
      type: 'text',
      chapterNumber: highlight.chapterNumber,
      reactions: []
    });

    setTextComment('');
    onClose();
  };

  const handleEmojiSelect = (emoji: string) => {
    if (!highlight) return;

    onAddComment(highlight.id, {
      highlightId: highlight.id,
      userId: currentUserId,
      userName: 'Current User',
      emoji,
      type: 'emoji',
      chapterNumber: highlight.chapterNumber,
      reactions: []
    });

    setShowEmojiPicker(false);
    onClose();
  };

  const handleStartEdit = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingContent(comment.content || '');
  };

  const handleSaveEdit = () => {
    if (!editingCommentId || !highlight || !onEditComment) return;
    
    onEditComment(highlight.id, editingCommentId, editingContent);
    setEditingCommentId(null);
    setEditingContent('');
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingContent('');
  };

  const handleDeleteComment = (commentId: string) => {
    if (!highlight || !onDeleteComment) return;
    
    if (confirm('¿Estás seguro de que quieres eliminar este comentario?')) {
      onDeleteComment(highlight.id, commentId);
    }
  };

  const handleDeleteHighlight = () => {
    if (!highlight || !onDeleteHighlight) return;
    
    if (confirm('¿Estás seguro de que quieres eliminar este highlight y todos sus comentarios?')) {
      onDeleteHighlight(highlight.id);
      onClose();
    }
  };

  const handleChangeColor = (newColor: string) => {
    if (!highlight || !onChangeHighlightColor) return;
    
    onChangeHighlightColor(highlight.id, newColor);
    setShowColorPicker(false);
  };

  const handleReactToComment = (commentId: string, emoji: string) => {
    // This would be implemented to add reactions to specific comments
    console.log('React to comment:', { commentId, emoji });
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
    return date.toLocaleDateString();
  };

  if (!isVisible || !highlight) return null;

  return (
    <div
      ref={popupRef}
      className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 w-80 max-h-96 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200"
      style={{ 
        position: 'fixed',
        transform: 'translateZ(0)'
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800 mb-1">
              Highlight por {highlight.userName}
            </p>
            <p className="text-xs text-gray-600 line-clamp-2">
              "{highlight.text.length > 80 ? highlight.text.substring(0, 80) + '...' : highlight.text}"
            </p>
          </div>
          <div className="flex gap-1">
            {highlight.userId === currentUserId && onChangeHighlightColor && (
              <div className="relative">
                <button
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Cambiar color"
                >
                  <div 
                    className="w-4 h-4 rounded border-2"
                    style={{ 
                      backgroundColor: HIGHLIGHT_COLORS[highlight.color as keyof typeof HIGHLIGHT_COLORS]?.bg || '#fff3cd',
                      borderColor: HIGHLIGHT_COLORS[highlight.color as keyof typeof HIGHLIGHT_COLORS]?.border || '#ffeaa7'
                    }}
                  />
                </button>
                
                {showColorPicker && (
                  <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50">
                    <div className="grid grid-cols-3 gap-1">
                      {Object.entries(HIGHLIGHT_COLORS).map(([colorKey, colorData]) => (
                        <button
                          key={colorKey}
                          onClick={() => handleChangeColor(colorKey)}
                          className={`p-2 rounded border-2 transition-all hover:scale-105 ${
                            highlight.color === colorKey 
                              ? 'border-gray-400 ring-2 ring-blue-200' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          style={{ backgroundColor: colorData.bg }}
                          title={colorData.name}
                        >
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: colorData.border }} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {highlight.userId === currentUserId && onDeleteHighlight && (
              <button
                onClick={handleDeleteHighlight}
                className="p-1 hover:bg-red-100 text-red-600 rounded transition-colors"
                title="Eliminar highlight"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Existing Comments */}
      {highlight.comments.length > 0 && (
        <div className="max-h-40 overflow-y-auto border-b border-gray-100">
          {highlight.comments.map((comment) => (
            <div key={comment.id} className="px-4 py-3 border-b border-gray-50 last:border-b-0">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-600">
                    {comment.userName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-800">{comment.userName}</span>
                    <span className="text-xs text-gray-500">{formatTimestamp(comment.timestamp)}</span>
                  </div>
                  
                  {comment.type === 'text' && comment.content && (
                    <>
                      {editingCommentId === comment.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            className="w-full p-2 text-sm border border-gray-200 rounded resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleSaveEdit}
                              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between">
                          <p className="text-sm text-gray-700 flex-1">{comment.content}</p>
                          {comment.userId === currentUserId && (
                            <div className="flex gap-1 ml-2">
                              <button
                                onClick={() => handleStartEdit(comment)}
                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                title="Editar comentario"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                title="Eliminar comentario"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                  
                  {comment.type === 'emoji' && comment.emoji && (
                    <span className="text-lg">{comment.emoji}</span>
                  )}
                  
                  {comment.type === 'audio' && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Play size={14} />
                      <span>Audio comment (0:15)</span>
                    </div>
                  )}
                  
                  {/* Reactions */}
                  {comment.reactions && comment.reactions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {comment.reactions.map((reaction, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs"
                          title={`${reaction.emoji} por ${reaction.userName}`}
                        >
                          <span>{reaction.emoji}</span>
                          <span className="text-gray-600">{reaction.userName}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comment Type Selector */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex gap-2">
          <button
            onClick={() => setCommentType('text')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
              commentType === 'text' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <MessageSquare size={16} />
            Texto
          </button>
          
          <button
            onClick={() => setCommentType('emoji')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
              commentType === 'emoji' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Smile size={16} />
            Emoji
          </button>
          
          <button
            onClick={() => setCommentType('audio')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
              commentType === 'audio' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Mic size={16} />
            Audio
          </button>
        </div>
      </div>

      {/* Comment Input */}
      <div className="p-4">
        {commentType === 'text' && (
          <div className="space-y-3">
            <textarea
              ref={textareaRef}
              value={textComment}
              onChange={(e) => setTextComment(e.target.value)}
              placeholder="Escribe tu comentario..."
              className="w-full p-3 border border-gray-200 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              rows={3}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  handleSubmitTextComment();
                }
              }}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Ctrl+Enter para enviar</span>
              <button
                onClick={handleSubmitTextComment}
                disabled={!textComment.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <Send size={16} />
                Enviar
              </button>
            </div>
          </div>
        )}

        {commentType === 'emoji' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Selecciona una reacción:</p>
            <div className="grid grid-cols-8 gap-2">
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiSelect(emoji)}
                  className="p-2 text-lg hover:bg-gray-100 rounded-md transition-colors"
                  title={`Reaccionar con ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {commentType === 'audio' && (
          <div className="space-y-3">
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-md">
              <Mic size={32} className="mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-3">Grabación de audio</p>
              <button
                onClick={() => setIsRecording(!isRecording)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isRecording 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isRecording ? 'Detener' : 'Grabar'}
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center">
              Función de audio próximamente disponible
            </p>
          </div>
        )}
      </div>
    </div>
  );
};