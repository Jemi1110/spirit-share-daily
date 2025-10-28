import React, { useState, useEffect, useRef } from 'react';
import { Highlighter, MessageSquare, Mic, Smile, X } from 'lucide-react';

const HIGHLIGHT_COLORS = {
  yellow: { bg: '#fff3cd', border: '#ffeaa7', name: 'Amarillo' },
  green: { bg: '#d4edda', border: '#a3d977', name: 'Verde' },
  blue: { bg: '#cce5ff', border: '#74b9ff', name: 'Azul' },
  pink: { bg: '#f8d7da', border: '#fd79a8', name: 'Rosa' },
  purple: { bg: '#e2d9f3', border: '#a29bfe', name: 'Morado' },
  orange: { bg: '#ffeaa7', border: '#fdcb6e', name: 'Naranja' }
};

type HighlightColor = keyof typeof HIGHLIGHT_COLORS;

interface HighlightToolbarProps {
  isVisible: boolean;
  position: { x: number; y: number };
  selectedText: string;
  onCreateHighlight: (color: HighlightColor, addComment?: boolean) => void;
  onClose: () => void;
}

export const HighlightToolbar: React.FC<HighlightToolbarProps> = ({
  isVisible,
  position,
  selectedText,
  onCreateHighlight,
  onClose
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState<HighlightColor>('yellow');
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Position the toolbar
  useEffect(() => {
    if (isVisible && toolbarRef.current) {
      const toolbar = toolbarRef.current;
      const rect = toolbar.getBoundingClientRect();
      
      // Adjust position to keep toolbar in viewport
      let adjustedX = position.x - rect.width / 2;
      let adjustedY = position.y - rect.height - 10;

      // Keep within viewport bounds
      if (adjustedX < 10) adjustedX = 10;
      if (adjustedX + rect.width > window.innerWidth - 10) {
        adjustedX = window.innerWidth - rect.width - 10;
      }
      if (adjustedY < 10) adjustedY = position.y + 30;

      toolbar.style.left = `${adjustedX}px`;
      toolbar.style.top = `${adjustedY}px`;
    }
  }, [isVisible, position]);

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
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isVisible, onClose]);

  const handleColorSelect = (color: HighlightColor) => {
    setSelectedColor(color);
    setShowColorPicker(false);
    onCreateHighlight(color, false);
  };

  const handleHighlightWithComment = () => {
    onCreateHighlight(selectedColor, true);
  };

  if (!isVisible) return null;

  return (
    <div
      ref={toolbarRef}
      className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-2 animate-in fade-in-0 zoom-in-95 duration-200"
      style={{ 
        position: 'fixed',
        transform: 'translateZ(0)' // Force hardware acceleration
      }}
    >
      {/* Selected text preview */}
      <div className="px-3 py-2 border-b border-gray-100 max-w-xs">
        <p className="text-xs text-gray-500 mb-1">Texto seleccionado:</p>
        <p className="text-sm text-gray-800 truncate">
          "{selectedText.length > 50 ? selectedText.substring(0, 50) + '...' : selectedText}"
        </p>
      </div>

      {/* Main actions */}
      <div className="flex items-center gap-2 p-2">
        {/* Quick highlight button */}
        <button
          onClick={() => onCreateHighlight(selectedColor, false)}
          className="flex items-center gap-2 px-3 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-md transition-colors text-sm font-medium"
          title={`Resaltar con ${HIGHLIGHT_COLORS[selectedColor].name}`}
        >
          <Highlighter size={16} />
          Resaltar
        </button>

        {/* Color picker toggle */}
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          title="Cambiar color"
        >
          <div 
            className="w-4 h-4 rounded border-2"
            style={{ 
              backgroundColor: HIGHLIGHT_COLORS[selectedColor].bg,
              borderColor: HIGHLIGHT_COLORS[selectedColor].border
            }}
          />
        </button>

        {/* Highlight with comment */}
        <button
          onClick={handleHighlightWithComment}
          className="flex items-center gap-2 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-md transition-colors text-sm"
          title="Resaltar y comentar"
        >
          <MessageSquare size={16} />
          Comentar
        </button>

        {/* Close button */}
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-500"
          title="Cerrar"
        >
          <X size={16} />
        </button>
      </div>

      {/* Color picker dropdown */}
      {showColorPicker && (
        <div className="border-t border-gray-100 p-3">
          <p className="text-xs text-gray-500 mb-2">Elegir color:</p>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(HIGHLIGHT_COLORS).map(([colorKey, colorData]) => (
              <button
                key={colorKey}
                onClick={() => handleColorSelect(colorKey as HighlightColor)}
                className={`p-2 rounded-md border-2 transition-all hover:scale-105 ${
                  selectedColor === colorKey 
                    ? 'border-gray-400 ring-2 ring-blue-200' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                style={{ backgroundColor: colorData.bg }}
                title={colorData.name}
              >
                <div className="w-full h-4 rounded" style={{ backgroundColor: colorData.border }} />
                <p className="text-xs mt-1 text-gray-700">{colorData.name}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Keyboard shortcuts hint */}
      <div className="px-3 py-2 border-t border-gray-100 text-xs text-gray-400">
        <span>Esc para cerrar</span>
      </div>
    </div>
  );
};