// External Bible API service
// API Documentation: https://scripture.api.bible/

const BIBLE_API_BASE_URL = 'https://api.scripture.api.bible/v1';
const BIBLE_API_KEY = import.meta.env.VITE_BIBLE_API_KEY || 'your-api-key-here';

// Bible API interfaces
interface BibleApiVersion {
    id: string;
    dblId: string;
    abbreviation: string;
    abbreviationLocal: string;
    name: string;
    nameLocal: string;
    description: string;
    descriptionLocal: string;
    language: {
        id: string;
        name: string;
        nameLocal: string;
        script: string;
        scriptDirection: string;
    };
    countries: Array<{
        id: string;
        name: string;
        nameLocal: string;
    }>;
    type: string;
    updatedAt: string;
    audioBibles: any[];
}

interface BibleApiBook {
    id: string;
    bibleId: string;
    abbreviation: string;
    name: string;
    nameLong: string;
    chapters: Array<{
        id: string;
        bibleId: string;
        number: string;
        bookId: string;
        reference: string;
    }>;
}

interface BibleApiVerse {
    id: string;
    orgId: string;
    bibleId: string;
    bookId: string;
    chapterId: string;
    reference: string;
    text: string;
}

interface BibleApiChapter {
    id: string;
    bibleId: string;
    number: string;
    bookId: string;
    reference: string;
    content: string;
    copyright: string;
    verseCount: number;
    next?: {
        id: string;
        number: string;
    };
    previous?: {
        id: string;
        number: string;
    };
}

// Generic API call function for Bible API
async function bibleApiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: HeadersInit = {
        'api-key': BIBLE_API_KEY,
        'Content-Type': 'application/json',
        ...options.headers,
    };

    const response = await fetch(`${BIBLE_API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        throw new Error(`Bible API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || data;
}

// Bible API service
export const externalBibleAPI = {
    // Get available Bible versions
    getBibles: async (): Promise<BibleApiVersion[]> => {
        return bibleApiCall('/bibles');
    },

    // Get books for a specific Bible version
    getBooks: async (bibleId: string): Promise<BibleApiBook[]> => {
        return bibleApiCall(`/bibles/${bibleId}/books`);
    },

    // Get chapters for a specific book (excluding introductions)
    getChapters: async (bibleId: string, bookId: string) => {
        const allChapters = await bibleApiCall(`/bibles/${bibleId}/books/${bookId}/chapters`) as any[];
        
        // Filter out introduction chapters
        const filteredChapters = allChapters.filter((chapter: any) => {
            const chapterId = chapter.id?.toLowerCase() || '';
            const chapterNumber = chapter.number?.toLowerCase() || '';
            const chapterReference = chapter.reference?.toLowerCase() || '';
            
            // Skip chapters that are introductions
            const isIntro = chapterId.includes('intro') || 
                           chapterNumber.includes('intro') || 
                           chapterReference.includes('intro') ||
                           chapterId.includes('introduction') ||
                           chapterNumber.includes('introduction') ||
                           chapterReference.includes('introduction');
            
            return !isIntro;
        });
        
        
        return filteredChapters;
    },

    // Get a specific chapter with all verses
    getChapter: async (bibleId: string, chapterId: string): Promise<BibleApiChapter> => {
        return bibleApiCall(`/bibles/${bibleId}/chapters/${chapterId}?content-type=text&include-notes=false&include-titles=true&include-chapter-numbers=false&include-verse-numbers=true&include-verse-spans=false`);
    },

    // Get a specific verse
    getVerse: async (bibleId: string, verseId: string): Promise<BibleApiVerse> => {
        return bibleApiCall(`/bibles/${bibleId}/verses/${verseId}?content-type=text&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=true&include-verse-spans=false`);
    },

    // Search verses
    searchVerses: async (bibleId: string, query: string, limit: number = 20) => {
        const encodedQuery = encodeURIComponent(query);
        return bibleApiCall(`/bibles/${bibleId}/search?query=${encodedQuery}&limit=${limit}&sort=relevance`);
    },

    // Get verse of the day (if available)
    getVerseOfTheDay: async (bibleId: string = 'de4e12af7f28f599-02') => {
        // Using ESV as default, you can change this
        try {
            return bibleApiCall(`/bibles/${bibleId}/verses/JHN.3.16?content-type=text&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=true&include-verse-spans=false`);
        } catch (error) {
            console.error('Error getting verse of the day:', error);
            return null;
        }
    }
};

// Popular Bible version IDs for quick access
export const POPULAR_BIBLE_IDS = {
    ESV: 'de4e12af7f28f599-02', // English Standard Version
    NIV: '78a9f6124f344018-01', // New International Version
    KJV: 'de4e12af7f28f599-01', // King James Version
    NASB: '78a9f6124f344018-02', // New American Standard Bible
    NLT: '78a9f6124f344018-03', // New Living Translation
};

// Helper function to parse verse references
export const parseVerseReference = (reference: string) => {
    // Example: "JHN.3.16" -> { book: "JHN", chapter: 3, verse: 16 }
    const parts = reference.split('.');
    if (parts.length >= 3) {
        return {
            book: parts[0],
            chapter: parseInt(parts[1]),
            verse: parseInt(parts[2])
        };
    }
    return null;
};

// Helper function to format verse reference for display
export const formatVerseReference = (reference: string, bookName?: string) => {
    const parsed = parseVerseReference(reference);
    if (parsed) {
        const displayBook = bookName || parsed.book;
        return `${displayBook} ${parsed.chapter}:${parsed.verse}`;
    }
    return reference;
};