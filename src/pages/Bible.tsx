import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Highlighter, MessageSquare, BookOpen, ChevronLeft, ChevronRight, Palette, Tag, Heart, Star, Upload, FileText, Users, Share2, Download, Eye, Trash2, Library } from "lucide-react";
import { externalBibleAPI, POPULAR_BIBLE_IDS, formatVerseReference } from "@/services/bibleApi";
import { documentAPI } from "@/services/api";
import { toast } from "sonner";
import { XMLBibleParser } from "@/services/xmlBibleParser";
import { BibleErrorHandler } from "@/services/bibleErrorHandler";

interface BibleVersion {
  id: string;
  name: string;
  abbreviation: string;
  language: {
    name: string;
  };
}

interface BibleBook {
  id: string;
  name: string;
  nameLong: string;
  abbreviation: string;
  chapters: Array<{
    id: string;
    number: string;
    reference: string;
  }>;
}

interface BibleChapter {
  id: string;
  reference: string;
  content: string;
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

// Highlight colors and categories
const HIGHLIGHT_COLORS = {
  yellow: { bg: 'bg-yellow-200', text: 'text-yellow-800', name: 'Amarillo' },
  blue: { bg: 'bg-blue-200', text: 'text-blue-800', name: 'Azul' },
  green: { bg: 'bg-green-200', text: 'text-green-800', name: 'Verde' },
  pink: { bg: 'bg-pink-200', text: 'text-pink-800', name: 'Rosa' },
  purple: { bg: 'bg-purple-200', text: 'text-purple-800', name: 'Morado' },
  orange: { bg: 'bg-orange-200', text: 'text-orange-800', name: 'Naranja' },
};

const HIGHLIGHT_CATEGORIES = [
  { id: 'promise', name: 'Promesas', icon: Star, color: 'yellow' },
  { id: 'prayer', name: 'Oración', icon: Heart, color: 'blue' },
  { id: 'wisdom', name: 'Sabiduría', icon: BookOpen, color: 'green' },
  { id: 'comfort', name: 'Consuelo', icon: MessageSquare, color: 'pink' },
  { id: 'guidance', name: 'Guía', icon: Search, color: 'purple' },
  { id: 'praise', name: 'Alabanza', icon: Highlighter, color: 'orange' },
];

const Bible = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVersion, setSelectedVersion] = useState(POPULAR_BIBLE_IDS.ESV);
  const [selectedBook, setSelectedBook] = useState("");
  const [selectedChapter, setSelectedChapter] = useState("");
  const [bibleVersions, setBibleVersions] = useState<BibleVersion[]>([]);
  const [availableBooks, setAvailableBooks] = useState<BibleBook[]>([]);
  const [currentChapter, setCurrentChapter] = useState<BibleChapter | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [loadingChapter, setLoadingChapter] = useState(false);
  const [viewMode, setViewMode] = useState<'search' | 'chapter' | 'highlights' | 'library'>('chapter');
  const [highlights, setHighlights] = useState<any[]>([]);
  const [selectedText, setSelectedText] = useState<string>("");
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const [highlightMenuPosition, setHighlightMenuPosition] = useState({ x: 0, y: 0 });
  const [userDocuments, setUserDocuments] = useState<any[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Initialize XML parser and error handler
  const xmlParser = new XMLBibleParser(true); // Enable debug mode
  const errorHandler = new BibleErrorHandler(true);

  useEffect(() => {
    loadUserDocuments();
    loadBibleData();
  }, []);

  // Load user documents from backend
  const loadUserDocuments = async () => {
    try {
      const documents = await documentAPI.getAll() as any[];
      
      // Debug: Log document structure
      documents.forEach((doc: any, index: number) => {
      });
      
      setUserDocuments(documents);
      
      // Add Bible documents to Bible versions
      const bibleDocuments = documents.filter((doc: any) => doc.is_bible);
      
      const bibleVersions = bibleDocuments.map((doc: any) => ({
        id: `user-${doc.id}`,
        name: doc.name.replace(/\.(json|xml|txt)$/i, ''),
        abbreviation: 'UPLOADED',
        language: {
          name: 'Uploaded Bibles'
        },
        parsedContent: doc.parsed_content
      }));
      
      setBibleVersions(prev => {
        // Remove any existing user Bibles to avoid duplicates
        const externalVersions = prev.filter(version => !version.id.startsWith('user-'));
        // Add user Bibles at the beginning
        return [...bibleVersions, ...externalVersions];
      });
    } catch (error) {
      console.error('Error loading documents:', error);
      // Don't show error toast on initial load, just log it
    }
  };

  useEffect(() => {
    // This useEffect is now only for fallback cases
    // Auto-selection is handled directly in loadBooks for both user and external Bibles
    if (selectedVersion && availableBooks?.length > 0 && !selectedBook) {
      // Only auto-select if it's a user Bible (external Bibles are handled in loadBooks)
      if (selectedVersion.startsWith('user-')) {
        setSelectedBook(availableBooks[0].id);
      }
    }
  }, [selectedVersion, availableBooks, selectedBook]);

  useEffect(() => {
    // Only auto-select if no chapter is selected and we're not in the middle of a book change
    if (selectedBook && availableBooks?.length > 0 && !selectedChapter) {
      const book = availableBooks.find(b => b.id === selectedBook);
      if (book && book.chapters?.length > 0) {
        setSelectedChapter(book.chapters[0].id);
      }
    }
  }, [selectedBook, availableBooks, selectedChapter]);

  useEffect(() => {
    // This useEffect is now mainly for manual chapter changes, not automatic loading
    // Automatic loading is handled directly in handleBookChange
    if (selectedVersion && selectedChapter && selectedBook && !selectedVersion.startsWith('user-')) {
      // Only load if this seems to be a manual chapter change (not from book selection)
      const isManualChapterChange = currentChapter && currentChapter.id !== selectedChapter;
      if (isManualChapterChange) {
        loadChapter();
      }
    }
  }, [selectedVersion, selectedChapter, selectedBook, currentChapter]);

  const loadBibleData = async () => {
    try {
      // Load all Bible versions
      const versions = await externalBibleAPI.getBibles();

      // Group versions by language
      const versionsByLanguage = versions.reduce((acc, version) => {
        const language = version.language.name;
        if (!acc[language]) {
          acc[language] = [];
        }
        acc[language].push(version);
        return acc;
      }, {} as Record<string, BibleVersion[]>);

      // Sort languages alphabetically, but put Uploaded Bibles first, then Spanish, then English
      const sortedLanguages = Object.keys(versionsByLanguage).sort((a, b) => {
        if (a === 'Uploaded Bibles') return -1;
        if (b === 'Uploaded Bibles') return 1;
        if (a === 'Spanish') return -1;
        if (b === 'Spanish') return 1;
        if (a === 'English') return -1;
        if (b === 'English') return 1;
        return a.localeCompare(b);
      });

      // Flatten all versions with language headers
      const organizedVersions: BibleVersion[] = [];
      sortedLanguages.forEach(language => {
        // Add versions for this language
        organizedVersions.push(...versionsByLanguage[language]);
      });

      // Preserve user-uploaded Bibles and add external versions
      setBibleVersions(prev => {
        // Keep existing user Bibles (those with id starting with 'user-')
        const userBibles = prev.filter(version => version.id.startsWith('user-'));
        // Combine user Bibles with external versions
        return [...userBibles, ...organizedVersions];
      });

      // Load books for default version
      if (selectedVersion) {
        await loadBooks(selectedVersion);
      }
    } catch (error) {
      console.error('Error loading Bible data:', error);
      toast.error('Failed to load Bible data. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const loadBooks = async (bibleId: string) => {
    try {
      
      // Clear current selections when loading new Bible
      setSelectedBook("");
      setSelectedChapter("");
      setCurrentChapter(null);
      
      // Check if it's a user-uploaded Bible
      if (bibleId.startsWith('user-')) {
        const result = await loadUserBibleBooks(bibleId);
        if (result.success && result.books) {
          setAvailableBooks(result.books);
          
          const bookNames = result.books.slice(0, 3).map(book => book.name).join(', ');
          const moreBooks = result.books.length > 3 ? ` y ${result.books.length - 3} más` : '';
          toast.success(`${result.fileName} cargado exitosamente`, {
            description: `${result.books.length} libros: ${bookNames}${moreBooks}`,
            duration: 5000
          });
          
          // Auto-select the first book and go directly to chapter 1
          if (result.books.length > 0) {
            const firstBook = result.books[0];
            setSelectedBook(firstBook.id);
            
            // Go directly to first chapter
            if (firstBook.chapters && firstBook.chapters.length > 0) {
              const firstChapter = firstBook.chapters[0];
              setSelectedChapter(firstChapter.id);
              
              // Load the chapter content immediately for user Bibles
              await loadChapterForUserBible(bibleId, firstBook.id, firstChapter.id);
            }
          }
        } else {
          throw new Error(result.error || 'Failed to load user Bible');
        }
        return;
      }
      
      // Load from external API for standard Bibles
      const books = await externalBibleAPI.getBooks(bibleId);
      setAvailableBooks(books);
      
      // Auto-select the first book and go directly to chapter 1
      if (books && books.length > 0) {
        const firstBook = books[0];
        setSelectedBook(firstBook.id);
        
        // Load chapters and go directly to chapter 1
        await handleBookChangeForExternalBible(firstBook.id, bibleId);
      }
    } catch (error) {
      console.error('Error loading books:', error);
      
      // Only show error toast for external API failures
      if (!bibleId.startsWith('user-')) {
        toast.error('Failed to load Bible books');
      } else {
        // For user Bibles, show a more specific error
        toast.error('Error al cargar la Biblia subida. Verifica el formato del archivo.');
      }
    }
  };

  // Helper function to handle book change for external Bibles during auto-selection
  const handleBookChangeForExternalBible = async (bookId: string, bibleId: string) => {
    try {
      
      // Load chapters for the selected book
      const chapters = await externalBibleAPI.getChapters(bibleId, bookId);

      // Update the book in availableBooks with chapters
      setAvailableBooks(prevBooks =>
        prevBooks.map(book =>
          book.id === bookId
            ? { ...book, chapters: chapters as Array<{ id: string; number: string; reference: string }> }
            : book
        )
      );

      // Go directly to first chapter
      if (chapters && Array.isArray(chapters) && chapters.length > 0) {
        const firstChapter = chapters[0];
        setSelectedChapter(firstChapter.id);
        
        // Load the chapter content immediately
        await loadChapterForExternalBible(bibleId, firstChapter.id);
      }
    } catch (error) {
      console.error('Error in auto book selection for external Bible:', error);
      // Don't show error toast for auto-selection, just log it
    }
  };

  // Helper method for loading user-uploaded Bibles with proper validation
  const loadUserBibleBooks = async (bibleId: string): Promise<{
    success: boolean;
    books?: BibleBook[];
    fileName?: string;
    error?: string;
  }> => {
    try {
      const documentId = bibleId.replace('user-', '');
      const document = userDocuments.find(doc => doc.id === documentId);
      
      if (!document) {
        return {
          success: false,
          error: 'Document not found'
        };
      }

      // Check if we have valid parsed content
      let parsedBooks: any[] = [];
      
      if (document.parsed_content && document.parsed_content.books && Array.isArray(document.parsed_content.books)) {
        // Use existing parsed content
        parsedBooks = document.parsed_content.books;
      } else {
        // Try to re-parse the content using our XML parser
        
        // Try different content field names that the backend might use
        let contentToParse = document.content || document.file_content || document.raw_content;
        
        // Check if parsed_content has raw XML content
        if (!contentToParse && document.parsed_content && document.parsed_content.raw_xml) {
          contentToParse = document.parsed_content.raw_xml;
        }
        
        // If no content available, try to fetch the file directly
        if (!contentToParse && document.file) {
          try {
            // Try to fetch the file with proper headers
            const response = await fetch(document.file, {
              method: 'GET',
              headers: {
                'Accept': 'text/plain, application/xml, text/xml, */*'
              }
            });
            
            if (response.ok) {
              contentToParse = await response.text();
            } else {
              console.error('Failed to fetch file:', response.status, response.statusText);
              
              // If direct fetch fails, try using the document API to get content
              try {
                const docResponse = await documentAPI.getById(document.id) as any;
                if (docResponse.content) {
                  contentToParse = docResponse.content;
                }
              } catch (apiError) {
                console.error('Document API fetch also failed:', apiError);
              }
            }
          } catch (fetchError) {
            console.error('Error fetching file content:', fetchError);
          }
        }
        
        if (contentToParse && typeof contentToParse === 'string') {
          try {
            // Check if it's XML content
            if (contentToParse.trim().startsWith('<')) {
              const parseResult = xmlParser.parseXMLBible(contentToParse);
              
              if (parseResult.success && parseResult.data && parseResult.data.books) {
                parsedBooks = parseResult.data.books;
                
                // Update the document with parsed content for future use
                document.parsed_content = parseResult.data;
              } else {
                console.error('XML parsing failed:', parseResult.error);
                return {
                  success: false,
                  error: parseResult.error || 'Failed to parse XML content'
                };
              }
            } else {
              // Try JSON parsing
              try {
                const jsonData = JSON.parse(contentToParse);
                const jsonResult = parseJsonBible(jsonData);
                if (jsonResult && jsonResult.books) {
                  parsedBooks = jsonResult.books;
                }
              } catch (jsonError) {
                console.error('JSON parsing failed:', jsonError);
              }
            }
          } catch (parseError) {
            console.error('Content parsing failed:', parseError);
            return {
              success: false,
              error: 'Failed to parse document content. Please check the file format.'
            };
          }
        } else {
          console.error('No content available for parsing. Document fields:', {
            has_content: !!document.content,
            has_file_content: !!document.file_content,
            has_raw_content: !!document.raw_content,
            has_file: !!document.file,
            has_parsed_content: !!document.parsed_content,
            parsed_content_keys: document.parsed_content ? Object.keys(document.parsed_content) : []
          });
          
          return {
            success: false,
            error: 'Document has no content to parse. Please re-upload the file.'
          };
        }
      }

      // Validate and transform books
      if (!parsedBooks || parsedBooks.length === 0) {
        return {
          success: false,
          error: 'No Bible books found in document. Please check the file format.'
        };
      }

      // Validate books have required structure and transform to expected format
      const books = parsedBooks
        .filter((book: any) => book && book.id && book.name) // Filter out invalid books
        .map((book: any) => ({
          id: book.id,
          name: book.name,
          nameLong: book.nameLong || book.name,
          abbreviation: book.abbreviation || book.name.substring(0, 3).toUpperCase(),
          chapters: (book.chapters || [])
            .filter((chapter: any) => chapter && chapter.id) // Filter out invalid chapters
            .map((chapter: any) => ({
              id: chapter.id,
              number: chapter.number || '1',
              reference: chapter.reference || `${book.name} ${chapter.number || '1'}`
            }))
        }))
        .filter((book: BibleBook) => book.chapters.length > 0); // Only include books with chapters

      if (books.length === 0) {
        return {
          success: false,
          error: 'No valid Bible books found after processing. Please check the file structure.'
        };
      }

      return {
        success: true,
        books: books,
        fileName: document.name
      };

    } catch (error) {
      console.error('Error in loadUserBibleBooks:', error);
      return {
        success: false,
        error: `Error processing Bible: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  };

  const loadChapter = async () => {
    if (!selectedVersion || !selectedChapter) return;

    setLoadingChapter(true);
    try {
      // Check if it's a user-uploaded Bible
      if (selectedVersion.startsWith('user-')) {
        const documentId = selectedVersion.replace('user-', '');
        const document = userDocuments.find(doc => doc.id === documentId);
        
        if (document && document.parsed_content) {
          // Find the specific book and chapter
          const book = document.parsed_content.books.find((b: any) => b.id === selectedBook);
          const chapter = book?.chapters.find((c: any) => c.id === selectedChapter);
          
          if (chapter) {
            // Convert verses object to HTML content
            let content = '<div>';
            const verses = chapter.verses || {};
            
            Object.keys(verses).forEach(verseNum => {
              const verseText = verses[verseNum];
              content += `<p><sup>${verseNum}</sup> ${verseText}</p>`;
            });
            
            content += '</div>';
            
            const realChapter = {
              id: selectedChapter,
              reference: chapter.reference,
              content: content,
              verseCount: Object.keys(verses).length,
              next: null, // TODO: Calculate next chapter
              previous: null // TODO: Calculate previous chapter
            };
            
            setCurrentChapter(realChapter);
            return;
          } else {
            toast.error('Capítulo no encontrado en el archivo');
            return;
          }
        }
      }
      
      // Load from external API for standard Bibles
      
      // Validate that we have proper IDs for external API
      if (!selectedBook || !selectedChapter) {
        console.warn('Missing book or chapter ID for external API call');
        return;
      }
      
      const chapter = await externalBibleAPI.getChapter(selectedVersion, selectedChapter);
      setCurrentChapter(chapter);
    } catch (error) {
      console.error('Error loading chapter:', error);
      
      // Only show error toast for external API failures
      if (!selectedVersion.startsWith('user-')) {
        toast.error('Failed to load chapter');
      } else {
      }
    } finally {
      setLoadingChapter(false);
    }
  };

  // Helper function to load chapter content for user-uploaded Bibles
  const loadChapterForUserBible = async (versionId: string, bookId: string, chapterId: string) => {
    try {
      setLoadingChapter(true);
      
      const documentId = versionId.replace('user-', '');
      const document = userDocuments.find(doc => doc.id === documentId);
      
      if (document && document.parsed_content) {
        // Find the specific book and chapter
        const book = document.parsed_content.books.find((b: any) => b.id === bookId);
        const chapter = book?.chapters.find((c: any) => c.id === chapterId);
        
        if (chapter) {
          // Convert verses object to HTML content
          let content = '<div>';
          const verses = chapter.verses || {};
          
          Object.keys(verses).forEach(verseNum => {
            const verseText = verses[verseNum];
            content += `<p><sup>${verseNum}</sup> ${verseText}</p>`;
          });
          
          content += '</div>';
          
          const realChapter = {
            id: chapterId,
            reference: chapter.reference,
            content: content,
            verseCount: Object.keys(verses).length,
            next: null, // TODO: Calculate next chapter
            previous: null // TODO: Calculate previous chapter
          };
          
          setCurrentChapter(realChapter);
        }
      }
    } catch (error) {
      console.error('Error loading user Bible chapter:', error);
    } finally {
      setLoadingChapter(false);
    }
  };

  // Helper function to load chapter content for external Bibles
  const loadChapterForExternalBible = async (versionId: string, chapterId: string) => {
    try {
      setLoadingChapter(true);
      
      const chapter = await externalBibleAPI.getChapter(versionId, chapterId);
      setCurrentChapter(chapter);
    } catch (error) {
      console.error('Error loading external Bible chapter:', error);
      toast.error('Failed to load chapter');
    } finally {
      setLoadingChapter(false);
    }
  };

  const handleVersionChange = async (versionId: string) => {
    
    setSelectedVersion(versionId);
    setSelectedBook("");
    setSelectedChapter("");
    setCurrentChapter(null);
    
    await loadBooks(versionId);
  };

  const handleBookChange = async (bookId: string) => {
    setSelectedBook(bookId);
    setSelectedChapter("");
    setCurrentChapter(null);

    // Load chapters for the selected book
    try {
      // Check if it's a user-uploaded Bible
      if (selectedVersion.startsWith('user-')) {
        
        // Find the book in availableBooks (already loaded with chapters)
        const selectedBookData = availableBooks.find(book => book.id === bookId);
        
        if (selectedBookData && selectedBookData.chapters && selectedBookData.chapters.length > 0) {
          
          // Set the first chapter as selected and load it immediately
          const firstChapter = selectedBookData.chapters[0];
          setSelectedChapter(firstChapter.id);
          
          // Load the chapter content immediately for user Bibles
          await loadChapterForUserBible(selectedVersion, bookId, firstChapter.id);
        } else {
          console.warn('No chapters found for book:', bookId);
          toast.warning('No se encontraron capítulos para este libro');
        }
      } else {
        // Use external API for standard Bibles
        const chapters = await externalBibleAPI.getChapters(selectedVersion, bookId);

        // Update the book in availableBooks with chapters
        setAvailableBooks(prevBooks =>
          prevBooks.map(book =>
            book.id === bookId
              ? { ...book, chapters: chapters as Array<{ id: string; number: string; reference: string }> }
              : book
          )
        );

        // Set the first chapter as selected and load it immediately
        if (chapters && Array.isArray(chapters) && chapters.length > 0) {
          const firstChapter = chapters[0];
          setSelectedChapter(firstChapter.id);
          
          // Load the chapter content immediately for external Bibles
          await loadChapterForExternalBible(selectedVersion, firstChapter.id);
        }
      }
    } catch (error) {
      console.error('Error loading chapters:', error);
      
      // Only show error for external API failures, not for user Bibles
      if (!selectedVersion.startsWith('user-')) {
        toast.error('Failed to load chapters');
      } else {
      }
    }
  };

  const handleChapterChange = (chapterId: string) => {
    setSelectedChapter(chapterId);
  };

  // Handle text selection for highlighting
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      const selectedText = selection.toString().trim();
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setSelectedText(selectedText);
      setHighlightMenuPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      });
      setShowHighlightMenu(true);
    } else {
      setShowHighlightMenu(false);
    }
  };

  // Parse file content based on type
  const parseFileContent = async (file: File) => {
    const text = await file.text();
    
    try {
      if (file.type.includes('json')) {
        // Parse JSON Bible format
        const jsonData = JSON.parse(text);
        return parseJsonBible(jsonData);
      } else if (file.type.includes('xml')) {
        // Parse XML Bible format (OSIS, USFM, etc.)
        return parseXmlBible(text);
      } else if (file.type.includes('text')) {
        // Parse plain text Bible format
        return parseTextBible(text);
      }
    } catch (error) {
      console.error('Error parsing file:', error);
      toast.error('Error al parsear el archivo. Verifique el formato.');
      return null;
    }
    
    return null;
  };

  // Parse JSON Bible format
  const parseJsonBible = (jsonData: any) => {
    // Handle different JSON Bible formats
    if (jsonData.books || jsonData.Bible) {
      const books = jsonData.books || jsonData.Bible;
      return {
        books: Object.keys(books).map(bookKey => ({
          id: bookKey,
          name: books[bookKey].name || bookKey,
          nameLong: books[bookKey].name || bookKey,
          abbreviation: bookKey,
          chapters: Object.keys(books[bookKey].chapters || {}).map(chapterKey => ({
            id: `${bookKey}.${chapterKey}`,
            number: chapterKey,
            reference: `${books[bookKey].name || bookKey} ${chapterKey}`,
            verses: books[bookKey].chapters[chapterKey]
          }))
        }))
      };
    }
    return null;
  };

  // Parse XML Bible format using the new XML parser service
  const parseXmlBible = (xmlText: string) => {
    try {
      const result = xmlParser.parseXMLBible(xmlText);
      
      if (result.success && result.data) {
        // Log success information
        if (result.metadata) {
        }
        
        // Show warnings if any
        if (result.warnings && result.warnings.length > 0) {
          result.warnings.forEach(warning => {
            console.warn('XML Parse Warning:', warning);
          });
        }
        
        return result.data;
      } else {
        // Handle parsing failure
        const error = new Error(result.error || 'Unknown parsing error');
        const bibleError = errorHandler.handleParseError(error, 'XML file');
        errorHandler.displayUserFriendlyError(bibleError);
        throw error;
      }
    } catch (error) {
      // Handle unexpected errors
      const bibleError = errorHandler.handleParseError(
        error instanceof Error ? error : new Error('Unknown error'), 
        'XML file'
      );
      errorHandler.displayUserFriendlyError(bibleError);
      throw error;
    }
  };

  // Parse plain text Bible format
  const parseTextBible = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    const books: any[] = [];
    let currentBook: any = null;
    let currentChapter: any = null;
    
    for (const line of lines) {
      // Check if it's a book title (usually all caps or starts with number)
      if (/^[0-9]*\s*[A-Z][A-Z\s]+$/.test(line.trim()) && line.length < 50) {
        if (currentBook) books.push(currentBook);
        
        currentBook = {
          id: line.trim().replace(/\s+/g, ''),
          name: line.trim(),
          nameLong: line.trim(),
          abbreviation: line.trim().substring(0, 3).toUpperCase(),
          chapters: []
        };
        currentChapter = null;
      }
      // Check if it's a chapter (starts with number followed by colon or verse pattern)
      else if (/^\d+[:.]/.test(line.trim())) {
        const match = line.match(/^(\d+)[:.](.+)/);
        if (match && currentBook) {
          const chapterNum = match[1];
          const verseText = match[2].trim();
          
          if (!currentChapter || currentChapter.number !== chapterNum) {
            currentChapter = {
              id: `${currentBook.id}.${chapterNum}`,
              number: chapterNum,
              reference: `${currentBook.name} ${chapterNum}`,
              verses: {}
            };
            currentBook.chapters.push(currentChapter);
          }
          
          // Extract verse number and text
          const verseMatch = verseText.match(/^(\d+)\s+(.+)/);
          if (verseMatch) {
            currentChapter.verses[verseMatch[1]] = verseMatch[2];
          } else {
            currentChapter.verses['1'] = verseText;
          }
        }
      }
    }
    
    if (currentBook) books.push(currentBook);
    return { books };
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/epub+zip',
      'text/plain',
      'application/json', // For Bible versions
      'application/xml',
      'text/xml' // For structured Bible formats (OSIS, USFM, etc.)
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de archivo no soportado. Use PDF, EPUB, TXT, JSON o XML.');
      return;
    }

    setUploadingFile(true);
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name);
      formData.append('description', '');

      // Upload to backend
      const uploadedDocument = await documentAPI.upload(formData);
      
      // Add to local state
      setUserDocuments(prev => [...prev, uploadedDocument]);
      
      // If it's a Bible, add to Bible versions
      if (uploadedDocument.is_bible) {
        const bibleVersion = {
          id: `user-${uploadedDocument.id}`,
          name: uploadedDocument.name.replace(/\.(json|xml|txt)$/i, ''),
          abbreviation: 'UPLOADED',
          language: {
            name: 'Uploaded Bibles'
          },
          parsedContent: uploadedDocument.parsed_content
        };
        
        setBibleVersions(prev => [bibleVersion, ...prev]);
        toast.success(`${file.name} añadido como versión bíblica personal`);
      } else {
        toast.success(`${file.name} subido exitosamente`);
      }
      
      // Clear the input
      event.target.value = '';
      
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Error al subir el archivo');
    } finally {
      setUploadingFile(false);
    }
  };

  // Share document with collaborators
  const shareDocument = async (documentId: string, userEmail: string) => {
    try {
      // Share via backend API
      await documentAPI.share(documentId, userEmail);
      
      // Update local state (in a real app, you'd refetch the document)
      setUserDocuments(prev => 
        prev.map(doc => 
          doc.id === documentId 
            ? { ...doc, collaborators: [...(doc.collaborators || []), { email: userEmail, role: 'reader' }] }
            : doc
        )
      );
      toast.success(`Documento compartido con ${userEmail}`);
    } catch (error) {
      console.error('Error sharing document:', error);
      toast.error('Error al compartir documento');
    }
  };

  // Delete document
  const deleteDocument = async (documentId: string) => {
    try {
      const document = userDocuments.find(doc => doc.id === documentId);
      
      // Delete from backend
      await documentAPI.delete(documentId);
      
      // Remove from local state
      setUserDocuments(prev => prev.filter(doc => doc.id !== documentId));
      
      // If it's a Bible, also remove from Bible versions
      if (document?.is_bible) {
        setBibleVersions(prev => prev.filter(version => version.id !== `user-${documentId}`));
        toast.success('Biblia eliminada del lector y biblioteca');
      } else {
        toast.success('Documento eliminado');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Error al eliminar documento');
    }
  };

  // Handle highlight click
  const handleHighlightClick = (highlightId: string) => {
    const highlight = highlights.find(h => h.id === highlightId);
    if (highlight) {
      toast.success(`Highlight: ${highlight.text.substring(0, 50)}... (${HIGHLIGHT_COLORS[highlight.color as keyof typeof HIGHLIGHT_COLORS]?.name})`);
    }
  };

  // Create highlight
  const createHighlight = async (color: string, category?: string) => {
    if (!selectedText || !currentChapter) return;

    const highlight = {
      id: Date.now().toString(),
      text: selectedText,
      color,
      category,
      chapterId: currentChapter.id,
      reference: currentChapter.reference,
      createdAt: new Date().toISOString(),
      userId: 'current-user', // This would come from auth context
    };

    try {
      // Save to backend (you'll need to implement this API call)
      // await highlightAPI.create(highlight);

      // For now, save locally
      setHighlights(prev => [...prev, highlight]);
      setShowHighlightMenu(false);
      setSelectedText("");

      // Clear selection
      window.getSelection()?.removeAllRanges();

      toast.success('Texto resaltado exitosamente');
    } catch (error) {
      console.error('Error creating highlight:', error);
      toast.error('Error al crear el resaltado');
    }
  };

  const navigateChapter = (direction: 'prev' | 'next') => {
    if (!currentChapter) return;

    if (direction === 'next' && currentChapter.next) {
      setSelectedChapter(currentChapter.next.id);
    } else if (direction === 'prev' && currentChapter.previous) {
      setSelectedChapter(currentChapter.previous.id);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setViewMode('chapter');
      return;
    }

    setSearching(true);
    setViewMode('search');
    try {
      const results = await externalBibleAPI.searchVerses(selectedVersion, searchQuery, 20);
      setSearchResults((results as any).verses || []);
    } catch (error) {
      console.error('Error searching verses:', error);
      toast.error('Failed to search verses');
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setViewMode('chapter');
  };

  const getCurrentBookName = () => {
    const book = availableBooks.find(b => b.id === selectedBook);
    return book ? book.name : '';
  };

  const getCurrentChapterNumber = () => {
    if (!selectedChapter || !availableBooks?.length) return '';

    const book = availableBooks.find(b => b.id === selectedBook);
    if (!book) return '';

    const chapter = book.chapters.find(c => c.id === selectedChapter);
    return chapter ? chapter.number : '';
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center">Loading Bible...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-spiritual" />
              Bible Reader - Enhanced Navigation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search verses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full"
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={searching}
                className="bg-spiritual hover:bg-spiritual/90"
              >
                <Search className="h-4 w-4" />
              </Button>
              {searchQuery && (
                <Button variant="outline" onClick={clearSearch}>
                  Clear
                </Button>
              )}
              <Button
                variant={viewMode === 'highlights' ? 'default' : 'outline'}
                className="flex items-center gap-2"
                onClick={() => setViewMode('highlights')}
              >
                <Highlighter className="h-4 w-4" />
                Resaltados ({highlights.length})
              </Button>
              <Button
                variant={viewMode === 'library' ? 'default' : 'outline'}
                className="flex items-center gap-2"
                onClick={() => setViewMode('library')}
              >
                <Library className="h-4 w-4" />
                Mi Biblioteca ({userDocuments.length})
              </Button>
            </div>

            {viewMode === 'chapter' && (
              <div className="flex gap-4 items-center flex-wrap">
                <Select value={selectedVersion} onValueChange={handleVersionChange}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select Version" />
                  </SelectTrigger>
                  <SelectContent>
                    {(() => {
                      const versionsByLanguage = bibleVersions?.reduce((acc, version) => {
                        const language = version.language.name;
                        if (!acc[language]) {
                          acc[language] = [];
                        }
                        acc[language].push(version);
                        return acc;
                      }, {} as Record<string, BibleVersion[]>) || {};

                      const sortedLanguages = Object.keys(versionsByLanguage).sort((a, b) => {
                        if (a === 'Uploaded Bibles') return -1;
                        if (b === 'Uploaded Bibles') return 1;
                        if (a === 'Spanish') return -1;
                        if (b === 'Spanish') return 1;
                        if (a === 'English') return -1;
                        if (b === 'English') return 1;
                        return a.localeCompare(b);
                      });

                      return sortedLanguages.map(language => (
                        <div key={language}>
                          <div className={`px-2 py-1 text-xs font-semibold sticky top-0 ${
                            language === 'Uploaded Bibles' 
                              ? 'text-spiritual bg-spiritual/10 border-b border-spiritual/20' 
                              : 'text-muted-foreground bg-muted/50'
                          }`}>
                            {language === 'Uploaded Bibles' ? '📚 UPLOADED BIBLES' : language} ({versionsByLanguage[language].length})
                          </div>
                          {versionsByLanguage[language].map((version) => (
                            <SelectItem key={version.id} value={version.id}>
                              {language === 'Uploaded Bibles' ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-spiritual">📖</span>
                                  <span>{version.name}</span>
                                  <span className="text-xs text-muted-foreground">({version.abbreviation})</span>
                                </div>
                              ) : (
                                `${version.name} (${version.abbreviation})`
                              )}
                            </SelectItem>
                          ))}
                        </div>
                      ));
                    })()}
                  </SelectContent>
                </Select>

                <Select value={selectedBook} onValueChange={handleBookChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Book" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBooks?.map((book) => (
                      <SelectItem key={book.id} value={book.id}>
                        {book.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedBook && (
                  <Select value={selectedChapter} onValueChange={handleChapterChange}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Chapter" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableBooks
                        ?.find(b => b.id === selectedBook)
                        ?.chapters?.map((chapter) => (
                          <SelectItem key={chapter.id} value={chapter.id}>
                            Chapter {chapter.number}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {viewMode === 'search' && searchQuery && (
              <div className="text-sm text-muted-foreground">
                {searchResults?.length > 0
                  ? `Found ${searchResults?.length} verses matching "${searchQuery}"`
                  : !searching
                    ? `No verses found matching "${searchQuery}"`
                    : 'Searching...'
                }
              </div>
            )}
          </CardContent>
        </Card>

        {viewMode === 'chapter' && currentChapter && (
          <Card className="bg-spiritual-light">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={() => navigateChapter('prev')}
                  disabled={!currentChapter.previous}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <div className="text-center">
                  <h2 className="text-xl font-semibold">
                    {getCurrentBookName()} {getCurrentChapterNumber()}
                  </h2>
                </div>

                <Button
                  variant="ghost"
                  onClick={() => navigateChapter('next')}
                  disabled={!currentChapter.next}
                  className="flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {viewMode === 'library' ? (
            <div className="space-y-6">
              {/* Upload Section */}
              <Card className="border-l-4 border-l-spiritual">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Library className="h-5 w-5 text-spiritual" />
                    Mi Biblioteca Personal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Upload Area */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Subir Documentos</h3>
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-spiritual/50 transition-colors">
                        <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground mb-4">
                          Arrastra archivos aquí o haz clic para seleccionar
                        </p>
                        <input
                          type="file"
                          accept=".pdf,.epub,.txt,.json,.xml"
                          onChange={handleFileUpload}
                          disabled={uploadingFile}
                          className="hidden"
                          id="file-upload"
                        />
                        <label htmlFor="file-upload">
                          <Button 
                            variant="outline" 
                            disabled={uploadingFile}
                            className="cursor-pointer"
                            asChild
                          >
                            <span>
                              {uploadingFile ? 'Subiendo...' : 'Seleccionar Archivos'}
                            </span>
                          </Button>
                        </label>
                        <p className="text-xs text-muted-foreground mt-2">
                          Formatos soportados: PDF, EPUB, TXT, JSON, XML (Biblias)
                        </p>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Acciones Rápidas</h3>
                      <div className="grid gap-3">
                        <Button 
                          variant="outline" 
                          className="justify-start"
                          onClick={() => {
                            // Trigger file upload for Bible creation
                            document.getElementById('file-upload')?.click();
                            toast.info('Selecciona un archivo XML o JSON para crear una nueva Biblia');
                          }}
                        >
                          <BookOpen className="h-4 w-4 mr-2" />
                          Crear Nueva Biblia
                        </Button>
                        {/* Collaborative Reading - Only show if user has EPUBs or PDFs */}
                        {userDocuments.some(doc => doc.file_type === 'epub' || doc.file_type === 'pdf') && (
                          <Button 
                            variant="outline" 
                            className="justify-start bg-spiritual/10 hover:bg-spiritual/20 border-spiritual text-spiritual"
                            onClick={() => {
                              const collaborativeDoc = userDocuments.find(doc => doc.file_type === 'epub' || doc.file_type === 'pdf');
                              if (collaborativeDoc) {
                                window.open(`/collaborative-reader/${collaborativeDoc.id}`, '_blank');
                              } else {
                                toast.info('Sube un EPUB o PDF para crear una sesión colaborativa');
                              }
                            }}
                          >
                            <Users className="h-4 w-4 mr-2" />
                            Crear Sesión de Lectura Colaborativa
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          className="justify-start"
                          onClick={() => {
                            // Filter to show only public documents
                            toast.info('Funcionalidad próximamente: Explorar documentos públicos de la comunidad');
                          }}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Explorar Biblioteca Pública
                        </Button>
                        <Button 
                          variant="outline" 
                          className="justify-start"
                          onClick={() => {
                            // Show shared documents
                            const sharedDocs = userDocuments.filter(doc => doc.collaborators && doc.collaborators.length > 0);
                            if (sharedDocs.length > 0) {
                              toast.success(`Tienes ${sharedDocs.length} documentos compartidos contigo`);
                            } else {
                              toast.info('No tienes documentos compartidos. Pide a alguien que comparta contigo.');
                            }
                          }}
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Documentos Compartidos Conmigo
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Documents Grid */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Mis Documentos ({userDocuments.length})</span>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setViewMode('chapter')}
                        className="bg-spiritual/10 hover:bg-spiritual/20 border-spiritual text-spiritual"
                      >
                        <BookOpen className="h-4 w-4 mr-1" />
                        Ir a Lectura
                      </Button>
                      <Button variant="outline" size="sm">
                        <Tag className="h-4 w-4 mr-1" />
                        Filtrar
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {userDocuments.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No tienes documentos aún</h3>
                      <p className="text-muted-foreground mb-4">
                        Sube tu primera Biblia, EPUB o PDF para comenzar a estudiar en colaboración.
                      </p>
                      <Button 
                        onClick={() => setViewMode('chapter')}
                        className="bg-spiritual hover:bg-spiritual/90"
                      >
                        <BookOpen className="h-4 w-4 mr-2" />
                        Ir a Lectura
                      </Button>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {userDocuments.map((doc) => (
                        <Card key={doc.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                {doc.file_type === 'pdf' && <FileText className="h-5 w-5 text-red-500" />}
                                {doc.file_type === 'epub' && <BookOpen className="h-5 w-5 text-blue-500" />}
                                {doc.file_type === 'json' && <BookOpen className="h-5 w-5 text-spiritual" />}
                                {doc.file_type === 'xml' && <BookOpen className="h-5 w-5 text-green-500" />}
                                {doc.file_type === 'txt' && <FileText className="h-5 w-5 text-gray-500" />}
                                <div>
                                  <h4 className="font-medium text-sm">{doc.name}</h4>
                                  <p className="text-xs text-muted-foreground">
                                    {doc.file_size_mb} MB
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 mb-3 text-xs text-muted-foreground">
                              <Users className="h-3 w-3" />
                              <span>{doc.collaborators?.length || 0} colaboradores</span>
                              {doc.isPublic && (
                                <>
                                  <span>•</span>
                                  <span>Público</span>
                                </>
                              )}
                              {doc.is_bible && (
                                <>
                                  <span>•</span>
                                  <span className="text-spiritual font-medium">📖 En Lector</span>
                                </>
                              )}
                              {(doc.file_type === 'epub' || doc.file_type === 'pdf') && (
                                <>
                                  <span>•</span>
                                  <span className="text-blue-600 font-medium">👥 Colaborativo</span>
                                </>
                              )}
                            </div>

                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Eye className="h-4 w-4" />
                              </Button>
                              
                              {/* Collaborative Reading - Only for EPUBs and PDFs */}
                              {(doc.file_type === 'epub' || doc.file_type === 'pdf') && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0 text-spiritual hover:text-spiritual"
                                  onClick={() => {
                                    // Navigate to collaborative reader
                                    window.open(`/collaborative-reader/${doc.id}`, '_blank');
                                  }}
                                  title="Leer Juntos (Colaborativo)"
                                >
                                  <Users className="h-4 w-4" />
                                </Button>
                              )}
                              
                              {/* Share - For all document types */}
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  const email = prompt('Email del colaborador:');
                                  if (email) shareDocument(doc.id, email);
                                }}
                                title={doc.is_bible ? "Compartir Biblia" : "Compartir Documento"}
                              >
                                <Share2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                onClick={() => deleteDocument(doc.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="text-xs text-muted-foreground mt-2">
                              {new Date(doc.created_at).toLocaleDateString('es-ES')}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : viewMode === 'highlights' ? (
            <div className="space-y-4">
              <Card className="border-l-4 border-l-spiritual">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Highlighter className="h-5 w-5 text-spiritual" />
                    Mis Resaltados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {highlights.length === 0 ? (
                    <div className="text-center py-12">
                      <Highlighter className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No tienes resaltados aún</h3>
                      <p className="text-muted-foreground mb-4">
                        Selecciona texto en la Biblia para crear tu primer resaltado.
                      </p>
                      <Button 
                        onClick={() => setViewMode('chapter')}
                        className="bg-spiritual hover:bg-spiritual/90"
                      >
                        <BookOpen className="h-4 w-4 mr-2" />
                        Ir a Lectura
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Filter by categories */}
                      <div className="flex flex-wrap gap-2 mb-6">
                        <Button variant="outline" size="sm" className="text-xs">
                          Todos ({highlights.length})
                        </Button>
                        {HIGHLIGHT_CATEGORIES.map((category) => {
                          const count = highlights.filter(h => h.category === category.id).length;
                          if (count === 0) return null;
                          const IconComponent = category.icon;
                          const colorData = HIGHLIGHT_COLORS[category.color as keyof typeof HIGHLIGHT_COLORS];
                          return (
                            <Button 
                              key={category.id}
                              variant="outline" 
                              size="sm" 
                              className={`text-xs ${colorData?.bg} ${colorData?.text}`}
                            >
                              <IconComponent className="h-3 w-3 mr-1" />
                              {category.name} ({count})
                            </Button>
                          );
                        })}
                      </div>

                      {/* Highlights grid */}
                      <div className="grid gap-4">
                        {highlights.map((highlight) => {
                          const colorData = HIGHLIGHT_COLORS[highlight.color as keyof typeof HIGHLIGHT_COLORS];
                          const category = HIGHLIGHT_CATEGORIES.find(c => c.id === highlight.category);
                          
                          return (
                            <Card key={highlight.id} className={`border-l-4 border-l-${highlight.color}-400 hover:shadow-md transition-shadow`}>
                              <CardContent className="pt-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-4 h-4 rounded ${colorData?.bg}`}></div>
                                    <span className="font-medium text-spiritual">
                                      {highlight.reference}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      onClick={() => {
                                        // Navigate to the chapter with this highlight
                                        setViewMode('chapter');
                                        toast.success('Navegando al capítulo...');
                                      }}
                                    >
                                      <BookOpen className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                      onClick={() => {
                                        setHighlights(prev => prev.filter(h => h.id !== highlight.id));
                                        toast.success('Resaltado eliminado');
                                      }}
                                    >
                                      ✕
                                    </Button>
                                  </div>
                                </div>
                                
                                <blockquote className={`text-lg leading-relaxed mb-3 p-4 rounded-lg ${colorData?.bg} border-l-4 border-l-${highlight.color}-500`}>
                                  "{highlight.text}"
                                </blockquote>
                                
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                  <div className="flex items-center gap-2">
                                    {category && (
                                      <div className="flex items-center gap-1">
                                        <category.icon className="h-4 w-4" />
                                        <span>{category.name}</span>
                                      </div>
                                    )}
                                  </div>
                                  <span>
                                    {new Date(highlight.createdAt).toLocaleDateString('es-ES', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </span>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : viewMode === 'search' ? (
            searchResults?.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">
                    {searchQuery ? 'No verses found. Try a different search term.' : 'Enter a search term to find verses.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {searchResults?.map((verse, index) => (
                  <Card key={verse.id || index} className="border-l-4 border-l-spiritual">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-semibold text-spiritual">
                              {formatVerseReference(verse.reference)}
                            </h3>
                            <Badge variant="outline" className="mt-1">
                              {bibleVersions.find(v => v.id === selectedVersion)?.abbreviation || 'Bible'}
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Highlighter className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-lg leading-relaxed" dangerouslySetInnerHTML={{ __html: verse.text }} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          ) : (
            loadingChapter ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">Loading chapter...</p>
                </CardContent>
              </Card>
            ) : !currentChapter ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">
                    Select a book and chapter to start reading
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-l-4 border-l-spiritual">

                <CardContent>
                  <div className="max-w-4xl mx-auto">
                    <div className="relative">
                      <div
                        className="bible-text select-text"
                        style={{
                          fontSize: '1.2rem',
                          lineHeight: '2.2rem',
                          fontFamily: 'Georgia, "Times New Roman", serif',
                          textAlign: 'justify',
                          color: 'hsl(var(--foreground))',
                          padding: '2rem',
                          background: 'linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--muted)/0.3) 100%)',
                          borderRadius: '0.75rem',
                          boxShadow: 'inset 0 1px 3px 0 hsl(var(--muted))',
                          userSelect: 'text',
                          WebkitUserSelect: 'text',
                          MozUserSelect: 'text',
                          msUserSelect: 'text',
                        }}
                        onMouseUp={handleTextSelection}
                        onTouchEnd={handleTextSelection}
                        onClick={(e) => {
                          const target = e.target as HTMLElement;
                          if (target.hasAttribute('data-highlight-id')) {
                            const highlightId = target.getAttribute('data-highlight-id');
                            if (highlightId) {
                              handleHighlightClick(highlightId);
                            }
                          }
                        }}
                        dangerouslySetInnerHTML={{
                          __html: (() => {
                            // First, process the base content
                            let content = currentChapter.content
                              .replace(/class="[^"]*"/g, '') // Remove existing classes
                              .replace(/<span[^>]*data-number="(\d+)"[^>]*>/g, '<sup>$1</sup>') // Style verse numbers as superscript
                              .replace(/<\/span>/g, '') // Remove closing span tags
                              .replace(/\s+/g, ' ') // Normalize whitespace
                              .replace(/(\d+)\s+/g, '<sup>$1</sup> '); // Catch any remaining verse numbers

                            // Apply highlights to the content
                            highlights.forEach(highlight => {
                              if (highlight.chapterId === currentChapter.id) {
                                const highlightClass = `highlight-${highlight.color}`;
                                // Escape special regex characters in the highlight text
                                const escapedText = highlight.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                const regex = new RegExp(escapedText, 'gi');
                                content = content.replace(regex, `<span class="${highlightClass}" title="Categoría: ${highlight.category || 'Sin categoría'}" data-highlight-id="${highlight.id}">$&</span>`);
                              }
                            });

                            return `
                              <style>
                                .bible-text sup {
                                  font-size: 0.7em;
                                  color: hsl(var(--spiritual));
                                  font-weight: 600;
                                  margin-right: 0.2em;
                                  padding: 0.1em 0.3em;
                                  background: hsl(var(--spiritual)/0.1);
                                  border-radius: 0.25rem;
                                  line-height: 1;
                                }
                                .bible-text p {
                                  margin-bottom: 1.5rem;
                                  text-indent: 1.5rem;
                                }
                                .bible-text p:first-child {
                                  text-indent: 0;
                                }
                                .bible-text::selection {
                                  background: hsl(var(--spiritual)/0.3);
                                  color: hsl(var(--spiritual-foreground));
                                }
                                .bible-text::-moz-selection {
                                  background: hsl(var(--spiritual)/0.3);
                                  color: hsl(var(--spiritual-foreground));
                                }
                                .highlight-yellow { 
                                  background-color: #fef3c7; 
                                  padding: 2px 4px; 
                                  border-radius: 3px; 
                                  border-left: 3px solid #f59e0b;
                                  cursor: pointer;
                                  transition: all 0.2s;
                                }
                                .highlight-blue { 
                                  background-color: #dbeafe; 
                                  padding: 2px 4px; 
                                  border-radius: 3px; 
                                  border-left: 3px solid #3b82f6;
                                  cursor: pointer;
                                  transition: all 0.2s;
                                }
                                .highlight-green { 
                                  background-color: #d1fae5; 
                                  padding: 2px 4px; 
                                  border-radius: 3px; 
                                  border-left: 3px solid #10b981;
                                  cursor: pointer;
                                  transition: all 0.2s;
                                }
                                .highlight-pink { 
                                  background-color: #fce7f3; 
                                  padding: 2px 4px; 
                                  border-radius: 3px; 
                                  border-left: 3px solid #ec4899;
                                  cursor: pointer;
                                  transition: all 0.2s;
                                }
                                .highlight-purple { 
                                  background-color: #e9d5ff; 
                                  padding: 2px 4px; 
                                  border-radius: 3px; 
                                  border-left: 3px solid #8b5cf6;
                                  cursor: pointer;
                                  transition: all 0.2s;
                                }
                                .highlight-orange { 
                                  background-color: #fed7aa; 
                                  padding: 2px 4px; 
                                  border-radius: 3px; 
                                  border-left: 3px solid #f97316;
                                  cursor: pointer;
                                  transition: all 0.2s;
                                }
                                [class*="highlight-"]:hover {
                                  transform: scale(1.02);
                                  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                                }
                              </style>
                              ${content}
                            `;
                          })()
                        }}
                      />

                      {/* Highlight Menu */}
                      {showHighlightMenu && (
                        <div
                          className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border p-2"
                          style={{
                            left: highlightMenuPosition.x - 150,
                            top: highlightMenuPosition.y - 80,
                            width: '300px'
                          }}
                        >
                          <div className="text-xs font-medium text-muted-foreground mb-2">
                            Resaltar: "{selectedText.substring(0, 30)}..."
                          </div>

                          <div className="grid grid-cols-3 gap-1 mb-3">
                            {Object.entries(HIGHLIGHT_COLORS).map(([colorKey, colorData]) => (
                              <Button
                                key={colorKey}
                                variant="outline"
                                size="sm"
                                className={`h-8 ${colorData.bg} ${colorData.text} border-2`}
                                onClick={() => createHighlight(colorKey)}
                              >
                                <Palette className="h-3 w-3 mr-1" />
                                {colorData.name}
                              </Button>
                            ))}
                          </div>

                          <div className="border-t pt-2">
                            <div className="text-xs font-medium text-muted-foreground mb-1">Categorías:</div>
                            <div className="grid grid-cols-2 gap-1">
                              {HIGHLIGHT_CATEGORIES.map((category) => {
                                const IconComponent = category.icon;
                                const colorData = HIGHLIGHT_COLORS[category.color as keyof typeof HIGHLIGHT_COLORS];
                                return (
                                  <Button
                                    key={category.id}
                                    variant="ghost"
                                    size="sm"
                                    className={`h-7 text-xs ${colorData.bg} ${colorData.text}`}
                                    onClick={() => createHighlight(category.color, category.id)}
                                  >
                                    <IconComponent className="h-3 w-3 mr-1" />
                                    {category.name}
                                  </Button>
                                );
                              })}
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full mt-2 text-xs"
                            onClick={() => setShowHighlightMenu(false)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t flex justify-between items-center">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateChapter('prev')}
                        disabled={!currentChapter.previous}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateChapter('next')}
                        disabled={!currentChapter.next}
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {currentChapter.reference}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </div>

        <Card className="bg-spiritual-light">
          <CardContent className="pt-6">
            <h4 className="font-semibold mb-2">Reading Plans</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Create or join Bible reading plans with your community
            </p>
            <Button className="bg-spiritual hover:bg-spiritual/90">
              Explore Plans (Coming Soon)
            </Button>
          </CardContent>
        </Card>
      </div>

    </Layout>
  );
};

export default Bible;