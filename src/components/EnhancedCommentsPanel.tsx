import React, { useState, useMemo } from 'react';
import { MessageSquare, X, Filter, Search, ChevronDown, ChevronRight, Eye } from 'lucide-react';

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
  updatedAt: string;
}

interface EnhancedCommentsPanelProps {
  isVisible: boolean;
  highlights: Highlight[];
  currentChapter: number;
  totalChapters: number;
  onClose: () => void;
  onNavigateToHighlight: (highlightId: string, chapterNumber: number) => void;
  onHighlightClick: (highlight: Highlight) => void;
}

type FilterType = 'all' | 'current-chapter' | 'my-highlights' | 'with-comments';

export const EnhancedCommentsPanel: React.FC<EnhancedCommentsPanelProps> = ({
  isVisible,
  highlights,
  currentChapter,
  totalChapters,
  onClose,
  onNavigateToHighlight,
  onHighlightClick
}) => {
  const [filter, setFilter] = useState<FilterType>('current-chapter');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set([currentChapter]));

  // Filter and group highlights
  const filteredHighlights = useMemo(() => {
    let filtered = highlights;

    // Apply filters
    switch (filter) {
      case 'current-chapter':
        filtered = highlights.filter(h => h.chapterNumber === currentChapter);
        break;
      case 'my-highlights':
        filtered = highlights.filter(h => h.userId === 'current-user');
        break;
      case 'with-comments':
        filtered = highlights.filter(h => h.comments.length > 0);
        break;
      default:
        filtered = highlights;
    }

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(h => 
        h.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.comments.some(c => c.content?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Group by chapter
    const grouped = filtered.reduce((acc, highlight) => {
      if (!acc[highlight.chapterNumber]) {
        acc[highlight.chapterNumber] = [];
      }
      acc[highlight.chapterNumber].push(highlight);
      return acc;
    }, {} as Record<number, Highlight[]>);

    // Sort highlights within each chapter by creation time
    Object.keys(grouped).forEach(chapterNum => {
      grouped[parseInt(chapterNum)].sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    });

    return grouped;
  }, [highlights, filter, searchTerm, currentChapter]);

  const toggleChapterExpansion = (chapterNumber: number) => {
    setExpandedChapters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chapterNumber)) {
        newSet.delete(chapterNumber);
      } else {
        newSet.add(chapterNumber);
      }
      return newSet;
    });
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

  const getHighlightColorClass = (color: string) => {
    const colorMap = {
      yellow: 'bg-yellow-100 border-yellow-300',
      green: 'bg-green-100 border-green-300',
      blue: 'bg-blue-100 border-blue-300',
      pink: 'bg-pink-100 border-pink-300',
      purple: 'bg-purple-100 border-purple-300',
      orange: 'bg-orange-100 border-orange-300'
    };
    return colorMap[color as keyof typeof colorMap] || 'bg-gray-100 border-gray-300';
  };

  const totalHighlights = highlights.length;
  const totalComments = highlights.reduce((sum, h) => sum + h.comments.length, 0);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 md:inset-auto md:top-20 md:right-6 md:w-96 md:max-h-[80vh]">
      {/* Mobile Overlay */}
      <div className="md:hidden absolute inset-0 bg-black/50" onClick={onClose}></div>
      
      {/* Panel Content */}
      <div className="absolute bottom-0 left-0 right-0 md:relative md:bottom-auto bg-white rounded-t-2xl md:rounded-2xl shadow-2xl max-h-[85vh] md:max-h-full overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Highlights & Comentarios</h3>
                <p className="text-sm text-gray-500">
                  {totalHighlights} highlights • {totalComments} comentarios
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-200 transition-colors"
            >
              <X className="h-4 w-4 text-gray-600" />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar highlights o comentarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto">
            {[
              { key: 'current-chapter', label: 'Capítulo actual' },
              { key: 'all', label: 'Todos' },
              { key: 'my-highlights', label: 'Mis highlights' },
              { key: 'with-comments', label: 'Con comentarios' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key as FilterType)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  filter === key
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {Object.keys(filteredHighlights).length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No hay highlights</p>
              <p className="text-gray-400 text-sm">
                {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Selecciona texto para crear highlights'}
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {Object.entries(filteredHighlights)
                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                .map(([chapterNum, chapterHighlights]) => {
                  const chapterNumber = parseInt(chapterNum);
                  const isExpanded = expandedChapters.has(chapterNumber);
                  
                  return (
                    <div key={chapterNumber} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Chapter Header */}
                      <button
                        onClick={() => toggleChapterExpansion(chapterNumber)}
                        className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          <span className="font-medium text-gray-800">
                            Capítulo {chapterNumber}
                          </span>
                          <span className="text-sm text-gray-500">
                            ({chapterHighlights.length} highlights)
                          </span>
                        </div>
                        {chapterNumber === currentChapter && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            Actual
                          </span>
                        )}
                      </button>

                      {/* Chapter Highlights */}
                      {isExpanded && (
                        <div className="divide-y divide-gray-100">
                          {chapterHighlights.map((highlight) => (
                            <div key={highlight.id} className="p-4 hover:bg-gray-50 transition-colors">
                              {/* Highlight Header */}
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-medium text-purple-600">
                                      {highlight.userName.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <span className="text-sm font-medium text-gray-800">
                                    {highlight.userName}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {formatTimestamp(highlight.createdAt)}
                                  </span>
                                </div>
                                <button
                                  onClick={() => onNavigateToHighlight(highlight.id, chapterNumber)}
                                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                  title="Ver en texto"
                                >
                                  <Eye size={14} />
                                </button>
                              </div>

                              {/* Highlight Text */}
                              <div
                                className={`p-3 rounded-lg border-l-4 cursor-pointer transition-all hover:shadow-sm ${getHighlightColorClass(highlight.color)}`}
                                onClick={() => onHighlightClick(highlight)}
                              >
                                <p className="text-sm text-gray-800 line-clamp-3">
                                  "{highlight.text}"
                                </p>
                              </div>

                              {/* Comments */}
                              {highlight.comments.length > 0 && (
                                <div className="mt-3 space-y-2">
                                  {highlight.comments.slice(0, 2).map((comment) => (
                                    <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-medium text-gray-700">
                                          {comment.userName}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                          {formatTimestamp(comment.timestamp)}
                                        </span>
                                      </div>
                                      {comment.type === 'text' && comment.content && (
                                        <p className="text-sm text-gray-700">{comment.content}</p>
                                      )}
                                      {comment.type === 'emoji' && comment.emoji && (
                                        <span className="text-lg">{comment.emoji}</span>
                                      )}
                                    </div>
                                  ))}
                                  {highlight.comments.length > 2 && (
                                    <button
                                      onClick={() => onHighlightClick(highlight)}
                                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                      Ver {highlight.comments.length - 2} comentarios más...
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};