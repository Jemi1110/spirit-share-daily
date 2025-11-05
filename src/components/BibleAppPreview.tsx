import React from 'react';
import {
    Sun,
    Volume2,
    MessageCircle,
    Share2,
    Heart,
    CheckCircle,
    Play,
    BookOpen,
    Sparkles,
    Home,
    Search,
    Clock,
    User
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export const BibleAppPreview: React.FC = () => {
    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Desktop Layout */}
            <div className="hidden lg:flex">
                {/* Sidebar */}
                <div className="w-80 bg-card/50 backdrop-blur-lg border-r border-border p-6 space-y-6">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Sun className="w-6 h-6 text-orange-400" />
                                <span className="text-lg font-medium text-muted-foreground">Good morning,</span>
                            </div>
                            <ThemeToggle />
                        </div>
                        <h1 className="text-2xl font-bold">Christopher</h1>
                        <p className="text-sm text-muted-foreground mt-1">Dec 7, 2024</p>
                    </div>

                    {/* Navigation */}
                    <nav className="space-y-2">
                        <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-gray-500/10 text-gray-400">
                            <Home className="w-5 h-5" />
                            <span className="font-medium">Home</span>
                        </button>
                        <button className="w-full flex items-center gap-3 p-3 rounded-lg text-muted-foreground hover:bg-muted/50">
                            <Search className="w-5 h-5" />
                            <span>Search</span>
                        </button>
                        <button className="w-full flex items-center gap-3 p-3 rounded-lg text-muted-foreground hover:bg-muted/50">
                            <Clock className="w-5 h-5" />
                            <span>Reading Plans</span>
                        </button>
                        <button className="w-full flex items-center gap-3 p-3 rounded-lg text-muted-foreground hover:bg-muted/50">
                            <BookOpen className="w-5 h-5" />
                            <span>Bible</span>
                        </button>
                        <button className="w-full flex items-center gap-3 p-3 rounded-lg text-muted-foreground hover:bg-muted/50">
                            <Sparkles className="w-5 h-5" />
                            <span>My Notes</span>
                        </button>
                        <button className="w-full flex items-center gap-3 p-3 rounded-lg text-muted-foreground hover:bg-muted/50">
                            <User className="w-5 h-5" />
                            <span>Profile</span>
                        </button>
                    </nav>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-8 max-w-4xl">
                    <div className="space-y-8">
                        {/* Verse of the Day Card */}
                        <div className="bible-card-sunset relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <p className="text-white/80 text-sm font-medium">Verse of the day</p>
                                        <p className="text-white text-xl font-semibold">John 1:1 KJV</p>
                                    </div>
                                    <button className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 text-white font-medium flex items-center gap-2">
                                        <Volume2 className="w-5 h-5" />
                                        Listen
                                    </button>
                                </div>

                                <div className="mb-8">
                                    <p className="text-white text-2xl font-medium leading-relaxed">
                                        In the beginning was the word, and the word was with God, and the word was God.
                                    </p>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <button className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 text-white">
                                            <MessageCircle className="w-5 h-5" />
                                            <span>82</span>
                                        </button>
                                        <button className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 text-white">
                                            <Share2 className="w-5 h-5" />
                                            <span>24</span>
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

                        {/* Grid Layout for Desktop */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Today's Reflection */}
                            <div className="bible-glass-card lg:col-span-2">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-semibold">Today's Reflection</h2>
                                    <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center">
                                        <CheckCircle className="w-5 h-5 text-white" />
                                    </div>
                                </div>
                                <p className="text-muted-foreground leading-relaxed text-lg">
                                    God's plan for us is filled with hope. Reflect on the assurance that His promises bring to your life today. Take time to meditate on His goodness and faithfulness in your journey.
                                </p>
                            </div>

                            {/* Watch Video Card */}
                            <div className="bible-card-purple relative">
                                <div className="mb-6">
                                    <h3 className="text-white text-lg font-semibold mb-4">Watch Video</h3>
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
                                    <h4 className="text-white text-xl font-bold mb-1">GREATEST</h4>
                                    <h4 className="text-white text-xl font-bold">BIBLE VERSES</h4>
                                </div>

                                <div className="flex justify-center">
                                    <div className="w-12 h-12 bg-gray-500 rounded-full flex items-center justify-center">
                                        <Play className="w-6 h-6 text-white ml-1" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Reading Progress Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bible-card-blue">
                                <div className="mb-4">
                                    <p className="text-white/80 text-sm">Reading Plan</p>
                                    <h3 className="text-white text-lg font-semibold">Daily Devotional</h3>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-white/80 text-sm">Day 15 of 365</span>
                                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                        <BookOpen className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                            </div>

                            <div className="bible-card-green">
                                <div className="mb-4">
                                    <p className="text-white/80 text-sm">Highlights</p>
                                    <h3 className="text-white text-lg font-semibold">My Notes</h3>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-white/80 text-sm">24 verses saved</span>
                                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                        <Sparkles className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                            </div>

                            <div className="bible-card-orange">
                                <div className="mb-4">
                                    <p className="text-white/80 text-sm">Prayer</p>
                                    <h3 className="text-white text-lg font-semibold">Requests</h3>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-white/80 text-sm">3 active</span>
                                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                        <Heart className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                            </div>

                            <div className="bible-glass-card">
                                <div className="mb-4">
                                    <p className="text-muted-foreground text-sm">Community</p>
                                    <h3 className="text-foreground text-lg font-semibold">Discussion</h3>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground text-sm">12 new messages</span>
                                    <div className="w-12 h-12 bg-gray-500/20 rounded-full flex items-center justify-center">
                                        <MessageCircle className="w-6 h-6 text-gray-400" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Layout */}
            <div className="lg:hidden p-4 space-y-6 pb-20">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Sun className="w-6 h-6 text-orange-400" />
                            <span className="text-lg font-medium text-muted-foreground">Good morning,</span>
                        </div>
                        <h1 className="bible-heading">Christopher</h1>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <ThemeToggle />
                        <p className="text-sm text-muted-foreground">Dec 7, 2024</p>
                    </div>
                </div>

                {/* Verse of the Day Card */}
                <div className="bible-card-sunset relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-white/80 text-sm font-medium">Verse of the day</p>
                                <p className="text-white text-lg font-semibold">John 1:1 KJV</p>
                            </div>
                            <button className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm font-medium flex items-center gap-2">
                                <Volume2 className="w-4 h-4" />
                                Listen
                            </button>
                        </div>

                        <div className="mb-6">
                            <p className="text-white text-xl font-medium leading-relaxed">
                                In the beginning was the word, and the word was with God, and the word was God.
                            </p>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white">
                                    <MessageCircle className="w-4 h-4" />
                                    <span className="text-sm">82</span>
                                </button>
                                <button className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white">
                                    <Share2 className="w-4 h-4" />
                                    <span className="text-sm">24</span>
                                </button>
                            </div>
                            <button className="bg-white/20 backdrop-blur-sm rounded-full p-3 text-white">
                                <Heart className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Background decoration */}
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mb-16"></div>
                        <div className="absolute top-1/2 right-8 w-2 h-2 bg-white/30 rounded-full"></div>
                        <div className="absolute top-1/3 right-16 w-1 h-1 bg-white/40 rounded-full"></div>
                    </div>
                </div>

                {/* Today's Reflection */}
                <div className="bible-glass-card">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="bible-subheading">Today's Reflection</h2>
                        <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                        God's plan for us is filled with hope. Reflect on the assurance that His promises bring to your life today.
                    </p>
                </div>

                {/* Watch Video Card */}
                <div className="bible-card-purple">
                    <div className="mb-4">
                        <h3 className="text-white text-lg font-semibold mb-2">Watch Video</h3>
                        <div className="flex items-center gap-1 mb-4">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="w-1 h-1 bg-white/40 rounded-full"></div>
                            ))}
                            <div className="w-2 h-2 bg-white rounded-full mx-2"></div>
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="w-1 h-1 bg-white/40 rounded-full"></div>
                            ))}
                        </div>
                    </div>

                    <div className="text-center">
                        <h4 className="text-white text-2xl font-bold mb-2">GREATEST</h4>
                        <h4 className="text-white text-2xl font-bold">BIBLE VERSES</h4>
                    </div>

                    <div className="absolute bottom-4 left-4">
                        <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                            <Play className="w-4 h-4 text-white ml-0.5" />
                        </div>
                    </div>
                </div>

                {/* Reading Progress Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bible-card-blue">
                        <div className="mb-4">
                            <p className="text-white/80 text-sm">Reading Plan</p>
                            <h3 className="text-white text-lg font-semibold">Daily Devotional</h3>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-white/80 text-sm">Day 15 of 365</span>
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                <BookOpen className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="bible-card-green">
                        <div className="mb-4">
                            <p className="text-white/80 text-sm">Highlights</p>
                            <h3 className="text-white text-lg font-semibold">My Notes</h3>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-white/80 text-sm">24 verses saved</span>
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Today's Reflection */}
                <div className="bible-glass-card">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="bible-subheading">Today's Reflection</h2>
                        <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                        God's plan for us is filled with hope. Reflect on the assurance that His promises bring to your life today.
                    </p>
                </div>

                {/* Watch Video Card */}
                <div className="bible-card-purple">
                    <div className="mb-4">
                        <h3 className="text-white text-lg font-semibold mb-2">Watch Video</h3>
                        <div className="flex items-center gap-1 mb-4">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="w-1 h-1 bg-white/40 rounded-full"></div>
                            ))}
                            <div className="w-2 h-2 bg-white rounded-full mx-2"></div>
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="w-1 h-1 bg-white/40 rounded-full"></div>
                            ))}
                        </div>
                    </div>

                    <div className="text-center">
                        <h4 className="text-white text-2xl font-bold mb-2">GREATEST</h4>
                        <h4 className="text-white text-2xl font-bold">BIBLE VERSES</h4>
                    </div>

                    <div className="absolute bottom-4 left-4">
                        <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                            <Play className="w-4 h-4 text-white ml-0.5" />
                        </div>
                    </div>
                </div>

                {/* Reading Progress Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bible-card-blue">
                        <div className="mb-4">
                            <p className="text-white/80 text-sm">Reading Plan</p>
                            <h3 className="text-white text-lg font-semibold">Daily Devotional</h3>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-white/80 text-sm">Day 15 of 365</span>
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                <BookOpen className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="bible-card-green">
                        <div className="mb-4">
                            <p className="text-white/80 text-sm">Highlights</p>
                            <h3 className="text-white text-lg font-semibold">My Notes</h3>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-white/80 text-sm">24 verses saved</span>
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Navigation - Only on Mobile */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-lg border-t border-border">
                <div className="flex items-center justify-around py-3 px-4 max-w-md mx-auto">
                    <button className="flex flex-col items-center gap-1 p-2">
                        <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center">
                            <Home className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-xs text-gray-400 font-medium">Home</span>
                    </button>

                    <button className="flex flex-col items-center gap-1 p-2">
                        <div className="w-6 h-6 flex items-center justify-center">
                            <Search className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <span className="text-xs text-muted-foreground">Search</span>
                    </button>

                    <button className="flex flex-col items-center gap-1 p-2">
                        <div className="w-6 h-6 flex items-center justify-center">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <span className="text-xs text-muted-foreground">Plans</span>
                    </button>

                    <button className="flex flex-col items-center gap-1 p-2">
                        <div className="w-6 h-6 flex items-center justify-center">
                            <User className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <span className="text-xs text-muted-foreground">Profile</span>
                    </button>
                </div>
            </div>
        </div>
    );
};