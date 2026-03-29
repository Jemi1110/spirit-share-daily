import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  MessageSquare,
  Highlighter,
  Play,
  CheckCircle,
  Heart
} from "lucide-react";
import Layout from "@/components/Layout";

const Feed = () => {
  const navigate = useNavigate();
  const currentUser = "Ana";

  // Mock data for demonstration
  const mockBooks = [
    {
      id: 1,
      title: "El Principito",
      author: "Antoine de Saint-Exupéry",
      progress: 65,
      lastRead: "Capítulo 8",
      collaborators: 3
    },
    {
      id: 2,
      title: "Cien años de soledad",
      author: "Gabriel García Márquez",
      progress: 23,
      lastRead: "Capítulo 3",
      collaborators: 5
    },
    {
      id: 3,
      title: "Don Quijote de la Mancha",
      author: "Miguel de Cervantes",
      progress: 12,
      lastRead: "Capítulo 1",
      collaborators: 2
    }
  ];

  const mockHighlights = [
    {
      id: 1,
      text: "Lo esencial es invisible a los ojos",
      book: "El Principito",
      color: "yellow",
      author: "María"
    },
    {
      id: 2,
      text: "Muchos años después, frente al pelotón de fusilamiento",
      book: "Cien años de soledad",
      color: "blue",
      author: "Carlos"
    }
  ];

  const handleBookClick = (bookId: number) => {
    navigate(`/collaborative-reader/book-${bookId}`);
  };

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
        <div className="bible-card-sunset relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-white/80 text-sm font-medium">Continuar leyendo</p>
                <p className="text-white text-xl font-semibold">{mockBooks[0].title}</p>
              </div>
              <button
                onClick={() => handleBookClick(mockBooks[0].id)}
                className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 text-white font-medium flex items-center gap-2"
              >
                <Play className="w-5 h-5" />
                Continuar
              </button>
            </div>

            <div className="mb-8">
              <p className="text-white text-lg leading-relaxed mb-4">
                {mockBooks[0].lastRead} • {mockBooks[0].progress}% completado
              </p>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div
                  className="bg-white h-2 rounded-full transition-all duration-300"
                  style={{ width: `${mockBooks[0].progress}%` }}
                ></div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 text-white">
                  <Highlighter className="w-5 h-5" />
                  <span>{mockHighlights.length}</span>
                </button>
                <button className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 text-white">
                  <MessageSquare className="w-5 h-5" />
                  <span>12</span>
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

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="bible-glass-card lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Actividad Reciente</h2>
              <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="space-y-4">
              {mockHighlights.map((highlight) => (
                <div key={highlight.id} className="border-l-4 border-orange-400 pl-4">
                  <p className="text-sm text-muted-foreground mb-1">{highlight.book}</p>
                  <p className="font-medium">"{highlight.text}"</p>
                  <p className="text-sm text-muted-foreground mt-1">- {highlight.author}</p>
                </div>
              ))}
            </div>
          </div>

          {/* My Library Card */}
          <div className="bible-card-purple relative">
            <div className="mb-6">
              <h3 className="text-white text-lg font-semibold mb-4">Mi Biblioteca</h3>
              <div className="flex items-center gap-1 mb-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="w-1 h-1 bg-white/40 rounded-full"></div>
                ))}
                <div className="w-2 h-2 bg-white rounded-full mx-2"></div>
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="w-1 h-1 bg-white/40 rounded-full"></div>
                ))}
              </div>
            </div>

            <div className="text-center mb-6">
              <h4 className="text-white text-xl font-bold mb-1">LECTURA</h4>
              <h4 className="text-white text-xl font-bold">COLABORATIVA</h4>
            </div>

            <div className="absolute bottom-4 left-4">
              <div className="w-12 h-12 bg-gray-500 rounded-full flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Books Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockBooks.map((book) => (
            <div
              key={book.id}
              className="bible-glass-card cursor-pointer hover:scale-105 transition-transform"
              onClick={() => handleBookClick(book.id)}
            >
              <div className="mb-4">
                <p className="text-muted-foreground text-sm">Libro</p>
                <h3 className="text-foreground text-lg font-semibold">{book.title}</h3>
                <p className="text-muted-foreground text-sm">{book.author}</p>
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
      </div>
    </Layout>
  );
};

export default Feed;
