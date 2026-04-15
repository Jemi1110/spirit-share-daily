import React, { useState, useMemo } from 'react';
import { X, Search, ChevronDown, ChevronRight, Eye, Highlighter, MessageCircle } from 'lucide-react';

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
  currentUserId?: string;
  onClose: () => void;
  onNavigateToHighlight: (highlightId: string, chapterNumber: number) => void;
  onHighlightClick: (highlight: Highlight) => void;
}

type FilterType = 'all' | 'current-chapter' | 'my-highlights' | 'with-comments';

const HIGHLIGHT_COLORS: Record<string, string> = {
  yellow: 'bg-yellow-100 border-yellow-400',
  green: 'bg-green-100 border-green-400',
  blue: 'bg-blue-100 border-blue-400',
  pink: 'bg-pink-100 border-pink-400',
  purple: 'bg-purple-100 border-purple-400',
  orange: 'bg-orange-100 border-orange-400',
};

const COLOR_DOT: Record<string, string> = {
  yellow: 'bg-yellow-400',
  green: 'bg-green-400',
  blue: 'bg-blue-400',
  pink: 'bg-pink-400',
  purple: 'bg-purple-400',
  orange: 'bg-orange-400',
};

export const EnhancedCommentsPanel: React.FC<EnhancedCommentsPanelProps> = ({
  isVisible,
  highlights,
  currentChapter,
  totalChapters,
  currentUserId = 'current-user',
  onClose,
  onNavigateToHighlight,
  onHighlightClick
}) => {
  const [filter, setFilter] = useState<FilterType>('current-chapter');
  const [viewMode, setViewMode] = useState<'highlights' | 'comments'>('highlights');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set([currentChapter]));

  const filteredHighlights = useMemo(() => {
    let filtered = highlights;

    switch (filter) {
      case 'current-chapter':
        filtered = highlights.filter(h => h.chapterNumber === currentChapter);
        break;
      case 'my-highlights':
        filtered = highlights.filter(h => h.userId === currentUserId || h.userName === currentUserId);
        break;
      case 'with-comments':
        filtered = highlights.filter(h => h.comments.length > 0);
        break;
      default:
        filtered = highlights;
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(h =>
        h.text.toLowerCase().includes(term) ||
        h.comments.some(c => c.content?.toLowerCase().includes(term))
      );
    }

    const grouped = filtered.reduce((acc, highlight) => {
      if (!acc[highlight.chapterNumber]) acc[highlight.chapterNumber] = [];
      acc[highlight.chapterNumber].push(highlight);
      return acc;
    }, {} as Record<number, Highlight[]>);

    Object.keys(grouped).forEach(n => {
      grouped[parseInt(n)].sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    });

    return grouped;
  }, [highlights, filter, searchTerm, currentChapter]);

  const toggleChapter = (n: number) => {
    setExpandedChapters(prev => {
      const s = new Set(prev);
      s.has(n) ? s.delete(n) : s.add(n);
      return s;
    });
  };

  const fmt = (ts: string) => {
    const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
    if (diff < 1) return 'Ahora';
    if (diff < 60) return `${diff}m`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h`;
    return new Date(ts).toLocaleDateString();
  };

  const totalH = highlights.length;
  const totalC = highlights.reduce((s, h) => s + h.comments.length, 0);

  if (!isVisible) return null;

  const colorCls = (c: string) => HIGHLIGHT_COLORS[c] || 'bg-gray-100 border-gray-400';
  const dotCls = (c: string) => COLOR_DOT[c] || 'bg-gray-400';

  const filters: { key: FilterType; label: string }[] = [
    { key: 'current-chapter', label: 'Cap. actual' },
    { key: 'all', label: 'Todos' },
    { key: 'my-highlights', label: 'Míos' },
    ...(viewMode === 'comments' ? [{ key: 'with-comments' as FilterType, label: 'Con comentarios' }] : []),
  ];

  return (
    <>
      {/* Backdrop - mobile full overlay, desktop click-away */}
      <div
        className="fixed inset-0 z-[60] bg-black/40 md:bg-transparent"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed z-[61] inset-x-0 bottom-0 md:inset-auto md:top-4 md:right-4 md:bottom-4 md:w-[380px] flex flex-col bg-white rounded-t-2xl md:rounded-2xl shadow-2xl border border-gray-200 max-h-[88vh] md:max-h-[calc(100vh-2rem)]">

        {/* ─── HEADER (fixed, never scrolls) ─── */}
        <div className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-gray-100">
          {/* Title row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                viewMode === 'highlights'
                  ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                  : 'bg-gradient-to-br from-purple-500 to-pink-500'
              }`}>
                {viewMode === 'highlights'
                  ? <Highlighter className="h-4 w-4 text-white" />
                  : <MessageCircle className="h-4 w-4 text-white" />
                }
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 leading-tight">
                  {viewMode === 'highlights' ? 'Highlights' : 'Comentarios'}
                </h3>
                <p className="text-xs text-gray-400">{totalH} highlights · {totalC} comentarios</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-lg p-0.5 mb-3">
            <button
              onClick={() => setViewMode('highlights')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'highlights'
                  ? 'bg-white text-yellow-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Highlighter className="h-3.5 w-3.5" />
              Highlights ({totalH})
            </button>
            <button
              onClick={() => setViewMode('comments')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'comments'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Comentarios ({totalC})
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder={viewMode === 'highlights' ? 'Buscar highlights...' : 'Buscar comentarios...'}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-purple-400 focus:border-purple-400 outline-none"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 -mx-1 px-1">
            {filters.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${
                  filter === key
                    ? viewMode === 'highlights'
                      ? 'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-300'
                      : 'bg-purple-100 text-purple-800 ring-1 ring-purple-300'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ─── SCROLLABLE CONTENT ─── */}
        <div className="flex-1 overflow-y-auto overscroll-contain min-h-0">
          {Object.keys(filteredHighlights).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              {viewMode === 'highlights' ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center mb-3">
                    <Highlighter className="h-6 w-6 text-yellow-300" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">No hay highlights</p>
                  <p className="text-xs text-gray-400 mt-1 text-center">
                    {searchTerm ? 'Sin resultados' : 'Selecciona texto para resaltar'}
                  </p>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center mb-3">
                    <MessageCircle className="h-6 w-6 text-purple-300" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">No hay comentarios</p>
                  <p className="text-xs text-gray-400 mt-1 text-center">
                    {searchTerm ? 'Sin resultados' : 'Comenta en tus highlights'}
                  </p>
                </>
              )}
            </div>
          ) : viewMode === 'highlights' ? (
            /* ═══════ HIGHLIGHTS VIEW ═══════ */
            <div className="p-2 space-y-1.5">
              {Object.entries(filteredHighlights)
                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                .map(([chapterNum, items]) => {
                  const n = parseInt(chapterNum);
                  const open = expandedChapters.has(n);

                  return (
                    <div key={n}>
                      {/* Chapter toggle */}
                      <button
                        onClick={() => toggleChapter(n)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-yellow-50/60 transition-colors"
                      >
                        {open
                          ? <ChevronDown size={14} className="text-yellow-600 flex-shrink-0" />
                          : <ChevronRight size={14} className="text-yellow-600 flex-shrink-0" />
                        }
                        <span className="text-xs font-semibold text-gray-700">Cap. {n}</span>
                        <span className="ml-auto text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-medium">
                          {items.length}
                        </span>
                        {n === currentChapter && (
                          <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">
                            Actual
                          </span>
                        )}
                      </button>

                      {/* Expanded items */}
                      {open && (
                        <div className="ml-2 space-y-1 mt-0.5 mb-2">
                          {items.map(hl => (
                            <div
                              key={hl.id}
                              className="group rounded-lg border border-gray-100 bg-white hover:border-gray-200 transition-all"
                            >
                              {/* Highlight card */}
                              <div className="p-2.5">
                                {/* Meta row */}
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dotCls(hl.color)}`} />
                                  <span className="text-[11px] font-medium text-gray-600 truncate">{hl.userName}</span>
                                  <span className="text-[10px] text-gray-400 ml-auto flex-shrink-0">{fmt(hl.createdAt)}</span>
                                  <button
                                    onClick={() => onNavigateToHighlight(hl.id, n)}
                                    className="p-1 text-gray-300 hover:text-blue-500 transition-colors flex-shrink-0"
                                    title="Ir al texto"
                                  >
                                    <Eye size={12} />
                                  </button>
                                </div>

                                {/* Quoted text */}
                                <div
                                  onClick={() => onHighlightClick(hl)}
                                  className={`px-2.5 py-2 rounded-md border-l-[3px] cursor-pointer ${colorCls(hl.color)}`}
                                >
                                  <p className="text-[12px] text-gray-700 leading-relaxed line-clamp-2">
                                    "{hl.text}"
                                  </p>
                                </div>

                                {/* Comment count link */}
                                {hl.comments.length > 0 && (
                                  <button
                                    onClick={() => setViewMode('comments')}
                                    className="mt-1.5 flex items-center gap-1 text-[11px] text-purple-500 hover:text-purple-700 font-medium"
                                  >
                                    <MessageCircle className="h-3 w-3" />
                                    {hl.comments.length} comentario{hl.comments.length !== 1 ? 's' : ''}
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          ) : (
            /* ═══════ COMMENTS VIEW ═══════ */
            <div className="p-2 space-y-1.5">
              {Object.entries(filteredHighlights)
                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                .map(([chapterNum, items]) => {
                  const n = parseInt(chapterNum);
                  const open = expandedChapters.has(n);
                  const commentCount = items.reduce((s, h) => s + h.comments.length, 0);

                  return (
                    <div key={n}>
                      {/* Chapter toggle */}
                      <button
                        onClick={() => toggleChapter(n)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-purple-50/60 transition-colors"
                      >
                        {open
                          ? <ChevronDown size={14} className="text-purple-600 flex-shrink-0" />
                          : <ChevronRight size={14} className="text-purple-600 flex-shrink-0" />
                        }
                        <span className="text-xs font-semibold text-gray-700">Cap. {n}</span>
                        <span className="ml-auto text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium">
                          {commentCount}
                        </span>
                        {n === currentChapter && (
                          <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">
                            Actual
                          </span>
                        )}
                      </button>

                      {/* Expanded items */}
                      {open && (
                        <div className="ml-2 space-y-2 mt-0.5 mb-2">
                          {items.map(hl => (
                            <div key={hl.id} className="rounded-lg border border-gray-100 bg-white overflow-hidden">
                              {/* Reference highlight (slim) */}
                              <div
                                onClick={() => onNavigateToHighlight(hl.id, n)}
                                className={`px-3 py-1.5 border-l-[3px] cursor-pointer flex items-center gap-2 ${colorCls(hl.color)}`}
                              >
                                <p className="text-[11px] text-gray-600 line-clamp-1 italic flex-1 min-w-0">
                                  "{hl.text}"
                                </p>
                                <Eye size={11} className="text-gray-400 flex-shrink-0" />
                              </div>

                              {/* Comments list */}
                              {hl.comments.length > 0 ? (
                                <div className="px-3 py-2 space-y-2 bg-gray-50/50">
                                  {hl.comments.map(c => (
                                    <div key={c.id} className="flex gap-2">
                                      {/* Avatar */}
                                      <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-[10px] font-bold text-purple-600">
                                          {c.userName.charAt(0).toUpperCase()}
                                        </span>
                                      </div>
                                      {/* Body */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline gap-1.5">
                                          <span className="text-[11px] font-semibold text-gray-700">{c.userName}</span>
                                          <span className="text-[10px] text-gray-400">{fmt(c.timestamp)}</span>
                                        </div>
                                        {c.type === 'text' && c.content && (
                                          <p className="text-[12px] text-gray-600 leading-relaxed mt-0.5">{c.content}</p>
                                        )}
                                        {c.type === 'emoji' && c.emoji && (
                                          <span className="text-base">{c.emoji}</span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="px-3 py-2">
                                  <p className="text-[11px] text-gray-400 italic">Sin comentarios</p>
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
    </>
  );
};
