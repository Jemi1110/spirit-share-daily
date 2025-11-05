import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Users,
  MessageSquare,
  Highlighter,
  Clock,
  Search,
  Home,
  User,
  Play,
  CheckCircle,
  Heart
} from "lucide-react";
import { ThemeToggle } from "../components/ThemeToggle";

const Feed = () => {
  const navigate = useNavigate();
  const currentUser = "Ana";

  const mockBooks = [
    {
      id: 1,
      title: "El Principito",
      author: "Antoine de Saint-Exupéry",
      progress: 65,
      lastRead: "Capítulo 8",
      collaborators: 3
    }
  ];

  const mockHighlights = [
    {
      id: 1,
      text: "Lo esencial es invisible a los ojos",
      book: "El Principito",
      color: "yellow",
      author: "María"
    }
  ];

  const handleBookClick = (bookId: number) => {
    navigate(`/collaborative-reader/book-${bookId}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Feed Dashboard</h1>
        <p>Welcome to your collaborative reading dashboard!</p>
      </div>
    </div>
  );
};

export default Feed;
