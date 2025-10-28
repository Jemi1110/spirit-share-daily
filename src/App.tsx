import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GloseThemeProvider } from "./components/GloseThemeProvider";
import "./styles/glose-utilities.css";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Feed from "./pages/Feed";
import Bible from "./pages/Bible";
import Devotionals from "./pages/Devotionals";
import DevotionalDetail from "./pages/DevotionalDetail";
import Prayer from "./pages/Prayer";
import Blog from "./pages/Blog";
import BlogDetail from "./pages/BlogDetail";
import Profile from "./pages/Profile";
import CollaborativeReader from "./pages/CollaborativeReader";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', backgroundColor: '#fee', minHeight: '100vh' }}>
          <h1>Something went wrong!</h1>
          <p>Error: {this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <GloseThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/bible" element={<Bible />} />
              <Route path="/devotionals" element={<Devotionals />} />
              <Route path="/devotionals/:id" element={<DevotionalDetail />} />
              <Route path="/prayer" element={<Prayer />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:id" element={<BlogDetail />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/collaborative-reader/:documentId" element={<CollaborativeReader />} />
              <Route path="/collaborative-reader/:documentId/:sessionId" element={<CollaborativeReader />} />
              {/* Catch malformed collaborative reader URLs */}
              <Route path="/collaborative-reader/*" element={<CollaborativeReader />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </GloseThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
