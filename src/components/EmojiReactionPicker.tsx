import React, { useState, useRef, useEffect } from 'react';
import { Smile, Plus } from 'lucide-react';

const QUICK_REACTIONS = ['❤️', '👍', '😊', '🔥', '💡', '🙏'];
const ALL_REACTIONS = [
  '❤️', '🙏', '💡', '👍', '😊', '🤔', '✨', '🔥', 
  '📖', '💭', '🎯', '⭐', '🔖', '💫', '🌟', '✍️',
  '👏', '🎉', '😍', '🤯', '💯', '🚀', '💪', '🙌'
];

interface Reaction {
  userId: string;
  userName: string;
  userAvatar?: string;
  emoji: string;
  timestamp: string;
}

interface EmojiReactionPickerProps {
  reactions: Reaction[];
  onAddReaction: (emoji: string) => void;
  onRemoveReaction: (emoji: string) => void;
  currentUserId: string;
  className?: string;
}

export const EmojiReactionPicker: React.FC<EmojiReactionPickerProps> = ({
  reactions,
  onAddReaction,
  onRemoveReaction,
  currentUserId,
  className = ''
}) => {
  const [showAllEmojis, setShowAllEmojis] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, Reaction[]>);

  // Check if current user has reacted with specific emoji
  const hasUserReacted = (emoji: string) => {
    return groupedReactions[emoji]?.some(r => r.userId === currentUserId) || false;
  };

  // Handle reaction toggle
  const handleReactionToggle = (emoji: string) => {
    if (hasUserReacted(emoji)) {
      onRemoveReaction(emoji);
    } else {
      onAddReaction(emoji);
    }
  };

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowAllEmojis(false);
      }
    };

    if (showAllEmojis) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAllEmojis]);

  return (
    <div className={`relative ${className}`} ref={pickerRef}>
      {/* Existing reactions */}
      <div className="flex flex-wrap gap-1 mb-2">
        {Object.entries(groupedReactions).map(([emoji, emojiReactions]) => (
          <button
            key={emoji}
            onClick={() => handleReactionToggle(emoji)}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-all hover:scale-105 ${
              hasUserReacted(emoji)
                ? 'bg-blue-100 border-2 border-blue-300 text-blue-700'
                : 'bg-gray-100 border-2 border-transparent hover:bg-gray-200'
            }`}
            title={`${emoji} - ${emojiReactions.map(r => r.userName).join(', ')}`}
          >
            <span className="text-base">{emoji}</span>
            <span className="text-xs font-medium">{emojiReactions.length}</span>
          </button>
        ))}
      </div>

      {/* Quick reactions */}
      <div className="flex items-center gap-1">
        {QUICK_REACTIONS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleReactionToggle(emoji)}
            className={`p-2 rounded-full text-lg transition-all hover:scale-110 ${
              hasUserReacted(emoji)
                ? 'bg-blue-100 text-blue-600'
                : 'hover:bg-gray-100'
            }`}
            title={`Reaccionar con ${emoji}`}
          >
            {emoji}
          </button>
        ))}
        
        {/* More emojis button */}
        <button
          onClick={() => setShowAllEmojis(!showAllEmojis)}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          title="Más reacciones"
        >
          <Plus size={16} className="text-gray-500" />
        </button>
      </div>

      {/* Extended emoji picker */}
      {showAllEmojis && (
        <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 animate-in fade-in-0 zoom-in-95 duration-200">
          <div className="grid grid-cols-8 gap-1 max-w-xs">
            {ALL_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  handleReactionToggle(emoji);
                  setShowAllEmojis(false);
                }}
                className={`p-2 rounded text-lg transition-all hover:scale-110 ${
                  hasUserReacted(emoji)
                    ? 'bg-blue-100 text-blue-600'
                    : 'hover:bg-gray-100'
                }`}
                title={`Reaccionar con ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};