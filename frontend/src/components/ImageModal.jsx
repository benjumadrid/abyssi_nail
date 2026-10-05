import React, { useState, useEffect, useRef } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, ExternalLink, Sparkles, Move } from 'lucide-react';

export default function ImageModal({ isOpen, onClose, imageUrl, title }) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const containerRef = useRef(null);

  // Reset zoom & pan whenever a new image is opened
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setImageLoaded(false);
    }
  }, [isOpen, imageUrl]);

  // Keyboard navigation (+, -, 0, Escape)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        handleResetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, scale]);

  if (!isOpen || !imageUrl) return null;

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Click image to cycle zoom: 1x -> 2x -> 3x -> 1x
  const handleImageClick = (e) => {
    if (isDragging) return;
    setScale((prev) => {
      if (prev >= 3) {
        setPosition({ x: 0, y: 0 });
        return 1;
      }
      return prev + 1;
    });
  };

  // Mouse wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setScale((prev) => Math.min(prev + 0.25, 4));
    } else {
      setScale((prev) => {
        const next = Math.max(prev - 0.25, 1);
        if (next === 1) setPosition({ x: 0, y: 0 });
        return next;
      });
    }
  };

  // Drag to pan when zoomed
  const handleMouseDown = (e) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || scale <= 1) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-950/95 backdrop-blur-xl flex flex-col items-center justify-between p-3 sm:p-6 animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      {/* Top Header Bar */}
      <div
        className="w-full max-w-5xl flex items-center justify-between gap-3 bg-stone-900/90 border border-amber-400/30 px-4 sm:px-6 py-3 rounded-2xl sm:rounded-3xl shadow-2xl backdrop-blur-md z-20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-stone-950 shrink-0 shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-serif text-sm sm:text-base font-bold text-white truncate">
              {title || 'Ultra-HD Nail Art Detail'}
            </h3>
            <span className="text-[10px] text-amber-300 font-semibold flex items-center gap-1">
              <span>Original Crystal-Clear Quality</span>
              <span>•</span>
              <span>{Math.round(scale * 100)}% Zoom</span>
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Zoom Out Button */}
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={scale <= 1}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-stone-800 hover:bg-stone-700 disabled:opacity-30 disabled:hover:bg-stone-800 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border border-stone-700"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* Current Zoom Percentage Badge */}
          <button
            type="button"
            onClick={handleResetZoom}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 text-xs font-extrabold font-mono transition-all cursor-pointer"
            title="Click to Reset Zoom (100%)"
          >
            {Math.round(scale * 100)}%
          </button>

          {/* Zoom In Button */}
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={scale >= 4}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-stone-800 hover:bg-stone-700 disabled:opacity-30 disabled:hover:bg-stone-800 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border border-stone-700"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {/* Reset Zoom Button */}
          {scale > 1 && (
            <button
              type="button"
              onClick={handleResetZoom}
              className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-all border border-stone-700 cursor-pointer hidden sm:flex items-center"
              title="Reset Zoom (0)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {/* Open Original Raw Image in New Tab */}
          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 hover:text-amber-200 text-xs font-bold transition-all flex items-center gap-1 border border-stone-700 cursor-pointer"
            title="Open Original High-Res File (100% Native Resolution)"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="hidden md:inline">Raw File</span>
          </a>

          {/* Close Modal Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-md ml-1"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Close</span>
          </button>
        </div>
      </div>

      {/* Main Viewport Container */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={(e) => e.stopPropagation()}
        className={`relative flex-1 w-full max-w-5xl my-3 flex items-center justify-center overflow-hidden rounded-3xl border border-stone-800/80 bg-stone-900/40 shadow-2xl ${
          scale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'
        }`}
      >
        <img
          src={imageUrl}
          alt={title || 'Nail Art Detail'}
          onLoad={() => setImageLoaded(true)}
          onClick={handleImageClick}
          draggable={false}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            imageRendering: '-webkit-optimize-contrast',
            willChange: 'transform',
            maxHeight: '75vh',
            maxWidth: '90vw',
          }}
          className={`object-contain transition-opacity duration-300 select-none ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Zoom & Pan Guidance Overlay */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-stone-950/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-stone-700/80 text-[11px] text-stone-300 flex items-center gap-2 pointer-events-none shadow-lg">
          {scale > 1 ? (
            <>
              <Move className="w-3.5 h-3.5 text-amber-400" />
              <span>Drag to pan around details • Click or double-click to cycle zoom</span>
            </>
          ) : (
            <>
              <ZoomIn className="w-3.5 h-3.5 text-amber-400" />
              <span>Click or scroll to zoom in up to 400% high-definition</span>
            </>
          )}
        </div>
      </div>

      {/* Bottom Footer Callout */}
      <div
        className="w-full max-w-5xl bg-stone-900/80 border border-stone-800/80 px-4 py-2 rounded-2xl flex items-center justify-between text-[11px] text-stone-400 backdrop-blur-md"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="flex items-center gap-1.5 text-amber-300 font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Beauty Abyssi Studio Quality</span>
        </span>
        <span className="hidden sm:inline">
          Use mouse wheel or buttons to zoom • Press <strong>Esc</strong> to close
        </span>
      </div>
    </div>
  );
}
