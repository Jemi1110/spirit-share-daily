import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  MessageSquare,
  Highlighter,
  Play,
  CheckCircle,
  Heart,
  Loader2,
  Library
} from "lucide-react";
import Layout from "@/components/Layout";
import { documentAPI, bookHighlightAPI, userAPI } from "@/services/api";
import { readingProgressService } from "@/services/readingProgressService";

const Feed = () => {
  const navigate = useNavigate();

  const { data: userProfile, isLoading: isUserLoading } = useQuery<any>({
    queryKey: ['profile'],
    queryFn: () => userAPI.getProfile()
  });

  const { data: apiBooks = [], isLoading: isBooksLoading } = useQuery<any[]>({
    queryKey: ['documents'],
    queryFn: () => documentAPI.getAll() as Promise<any[]>
  });

  const { data: apiHighlights = [], isLoading: isHighlightsLoading } = useQuery<any[]>({
    queryKey: ['highlights'],
    queryFn: () => bookHighlightAPI.getAll() as Promise<any[]>
  });

  const currentUser = userProfile?.username || userProfile?.first_name || "Usuario";
  const currentUserId = userProfile?.id?.toString() || userProfile?.username || "current-user";

  const { data: bookProgresses = {} } = useQuery({
    queryKey: ['bookProgresses', apiBooks, currentUserId],
    queryFn: async () => {
      const results: Record<string, any> = {};
      if (!apiBooks.length) return results;
      
      const promises = apiBooks.map(async (doc: any) => {
        try {
          const p = await readingProgressService.loadProgress(doc.id, currentUserId);
          return {
            id: doc.id,
            progress: p?.progress_percentage || 0,
            lastRead: p ? `Cap. ${p.current_chapter}` : "Cap. 1"
          };
        } catch {
          return { id: doc.id, progress: 0, lastRead: "Cap. 1" };
        }
      });
      
      const loaded = await Promise.all(promises);
      loaded.forEach(r => { results[r.id] = r; });
      return results;
    },
    enabled: !!currentUserId && apiBooks.length > 0
  });

  // Map API data to the format expected by the UI, providing fallbacks if needed
  const books = Array.isArray(apiBooks) && apiBooks.length > 0 
    ? apiBooks.map((doc: any, index: number) => ({
        id: doc.id,
        title: doc.name || `Documento ${index + 1}`,
        author: doc.author || "Autor Desconocido",
        progress: bookProgresses[doc.id]?.progress || doc.progress || 0,
        lastRead: bookProgresses[doc.id]?.lastRead || doc.last_read || "Cap. 1",
        collaborators: doc.collaborators_count || 1
      }))
    : [];

  const highlights = Array.isArray(apiHighlights) && apiHighlights.length > 0
    ? [...apiHighlights] // Clone to avoid mutating original data
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) // Most recent first
        .slice(0, 3) // Show only the 3 most recent highlights
        .map((hl: any) => {
          const rawText = hl.text || hl.highlighted_text || hl.content || "";
          // Truncate text if it's too long
          const truncatedText = rawText.length > 120 
            ? rawText.substring(0, 117) + "..." 
            : rawText;
            
          return {
            id: hl.id,
            text: truncatedText,
            book: hl.book_title || hl.document_name || "Documento",
            color: hl.color || "yellow",
            author: hl.user_name || hl.author || "Usuario"
          };
        })
    : [];

  const handleBookClick = (bookId: string | number) => {
    navigate(`/collaborative-reader/${bookId}`);
  };

  const isLoading = isUserLoading || isBooksLoading || isHighlightsLoading;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl space-y-8">
        {/* Welcome Header - Mobile only */}
        <div className="lg:hidden flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-6 h-6 text-orange-400" />
              <span className="text-lg font-medium text-muted-foreground">Buen día,</span>
            </div>
            <h1 className="text-2xl font-bold">{currentUser}</h1>
          </div>
          <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString('es-ES', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
          })}</p>
        </div>

        {/* Continue Reading Card */}
        {books.length > 0 ? (
          <div className="bible-card-sunset relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-white/80 text-sm font-medium">Continuar leyendo</p>
                  <p className="text-white text-xl font-semibold">{books[0].title}</p>
                </div>
                <button
                  onClick={() => handleBookClick(books[0].id)}
                  className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 text-white font-medium flex items-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  Continuar
                </button>
              </div>

              <div className="mb-8">
                <p className="text-white text-lg leading-relaxed mb-4">
                  {books[0].lastRead} • {books[0].progress}% completado
                </p>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div
                    className="bg-white h-2 rounded-full transition-all duration-300"
                    style={{ width: `${books[0].progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 text-white">
                    <Highlighter className="w-5 h-5" />
                    <span>{highlights.length}</span>
                  </button>
                  <button className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 text-white">
                    <MessageSquare className="w-5 h-5" />
                    <span>0</span>
                  </button>
                </div>
                <button className="bg-white/20 backdrop-blur-sm rounded-full p-4 text-white">
                  <Heart className="w-6 h-6" />
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
        ) : (
          <div className="bible-card-sunset relative overflow-hidden flex flex-col justify-center items-center py-10">
            <BookOpen className="h-12 w-12 text-white/50 mb-4" />
            <h2 className="text-white text-xl font-semibold mb-2">No tienes libros todavía</h2>
            <button 
              onClick={() => navigate('/bible')}
              className="bg-white text-orange-500 hover:bg-gray-100 rounded-full px-6 py-2 font-medium"
            >
              Explorar Biblioteca
            </button>
          </div>
        )}

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="bible-glass-card lg:col-span-2 relative min-h-[200px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Actividad Reciente</h2>
              <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
            </div>
            
            {highlights.length > 0 ? (
              <div className="space-y-4">
                {highlights.map((highlight: any) => (
                  <div key={highlight.id} className="border-l-4 border-orange-400 pl-4">
                    <p className="text-sm text-muted-foreground mb-1">{highlight.book}</p>
                    <p className="font-medium">"{highlight.text}"</p>
                    <p className="text-sm text-muted-foreground mt-1">- {highlight.author}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center h-full opacity-50 py-10">
                <Highlighter className="w-8 h-8 mb-2" />
                <p>No hay actividad reciente.</p>
                <p className="text-sm">Empieza a leer y resaltar para ver actividad aquí.</p>
              </div>
            )}
          </div>

          {/* My Library Card */}
          <div 
            className="relative h-full min-h-[280px] rounded-2xl overflow-hidden cursor-pointer group transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/20"
            onClick={() => navigate('/bible')}
          >
            {/* Background Image with Parallax-like hover effect */}
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
              style={{ backgroundImage: 'url("/sacred_library_bg.png")' }}
            >
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-purple-900/90 via-purple-900/40 to-transparent"></div>
            </div>

            {/* Content Container */}
            <div className="relative h-full p-6 flex flex-col justify-between z-10">
              <div className="flex justify-between items-start">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
                  <Library className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-white/60 text-xs font-medium tracking-widest uppercase">Explorar</p>
                  <p className="text-white text-lg font-bold">Biblia</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="inline-block px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 mb-2">
                  <span className="text-[10px] text-purple-200 font-bold tracking-tighter uppercase">Premium Library</span>
                </div>
                <h3 className="text-white text-2xl font-bold leading-tight">
                  Biblioteca <span className="text-purple-300">Sagrada</span>
                </h3>
                <p className="text-white/70 text-sm leading-relaxed max-w-[200px]">
                  Accede a tus versiones, notas y documentos compartidos.
                </p>
              </div>

              {/* Bottom Decorative Element */}
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-white text-xs font-medium">Entrar ahora</span>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-white/40 to-transparent"></div>
              </div>
            </div>

            {/* Subtle glow effect on hover */}
            <div className="absolute -inset-px bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
          </div>
        </div>

        {/* Books Grid */}
        {books.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book: any) => (
              <div
                key={book.id}
                className="bible-glass-card cursor-pointer hover:scale-105 transition-transform"
                onClick={() => handleBookClick(book.id)}
              >
                <div className="mb-4">
                  <p className="text-muted-foreground text-sm">Libro</p>
                  <h3 className="text-foreground text-lg font-semibold truncate" title={book.title}>{book.title}</h3>
                  <p className="text-muted-foreground text-sm truncate" title={book.author}>{book.author}</p>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-muted-foreground text-sm">{book.collaborators} colaboradores</span>
                  <div className="w-12 h-12 bg-gray-500/20 rounded-full flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-gray-500" />
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-orange-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${book.progress}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Feed;
