import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Highlighter, MessageSquare, BookOpen, ChevronLeft, ChevronRight, Palette, Heart, Star, Upload, FileText, Users, Share2, Trash2, Library } from "lucide-react";
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
  const navigate = useNavigate();
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

  const computeUserBibleNavigation = (bookId: string, chapterId: string) => {
    const bookIndex = availableBooks.findIndex(b => b.id === bookId);
    if (bookIndex === -1) return { next: null, previous: null };

    const book = availableBooks[bookIndex];
    const chapterIndex = book.chapters.findIndex(c => c.id === chapterId);
    if (chapterIndex === -1) return { next: null, previous: null };

    let previous: { id: string; number: string } | null = null;
    let next: { id: string; number: string } | null = null;

    if (chapterIndex > 0) {
      const prevCh = book.chapters[chapterIndex - 1];
      previous = { id: prevCh.id, number: prevCh.number };
    } else if (bookIndex > 0) {
      const prevBook = availableBooks[bookIndex - 1];
      const lastCh = prevBook.chapters[prevBook.chapters.length - 1];
      if (lastCh) previous = { id: lastCh.id, number: lastCh.number };
    }

    if (chapterIndex < book.chapters.length - 1) {
      const nextCh = book.chapters[chapterIndex + 1];
      next = { id: nextCh.id, number: nextCh.number };
    } else if (bookIndex < availableBooks.length - 1) {
      const nextBook = availableBooks[bookIndex + 1];
      const firstCh = nextBook.chapters[0];
      if (firstCh) next = { id: firstCh.id, number: firstCh.number };
    }

    return { next, previous };
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
              ...computeUserBibleNavigation(selectedBook, selectedChapter),
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
            ...computeUserBibleNavigation(bookId, chapterId),
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
      
      // If it's a Bible, add to versions and auto-open
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
        toast.success(`${file.name} añadido — abriendo...`);
        await handleVersionChange(`user-${uploadedDocument.id}`);
        setViewMode('chapter');
      } else if (uploadedDocument.file_type === 'epub' || uploadedDocument.file_type === 'pdf') {
        toast.success(`${file.name} subido — abriendo lector...`);
        navigate(`/collaborative-reader/${uploadedDocument.id}`);
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

    const target = direction === 'next' ? currentChapter.next : currentChapter.previous;
    if (!target) return;

    // For user Bibles, handle cross-book navigation
    if (selectedVersion.startsWith('user-')) {
      const currentBook = availableBooks.find(b => b.id === selectedBook);
      const isInCurrentBook = currentBook?.chapters.some(c => c.id === target.id);
      if (!isInCurrentBook) {
        const targetBook = availableBooks.find(b => b.chapters.some(c => c.id === target.id));
        if (targetBook) setSelectedBook(targetBook.id);
      }
    }

    setSelectedChapter(target.id);
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
        <div className="max-w-4xl space-y-6">
          <div className="bible-glass-card p-12 text-center">
            <BookOpen className="h-12 w-12 text-orange-400 mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Cargando Biblia...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl space-y-6">
        {/* Controls Bar */}
        <div className="bible-glass-card p-4 space-y-4">
          {/* Search + View Toggles */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Buscar versículos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="bg-background/50 border-white/10"
              />
              <button
                onClick={handleSearch}
                disabled={searching}
                className="bg-orange-500/20 hover:bg-orange-500/30 backdrop-blur-sm rounded-full px-4 py-2 text-orange-400 transition-colors"
              >
                <Search className="h-4 w-4" />
              </button>
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-muted-foreground transition-colors text-sm"
                >
                  Limpiar
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('highlights')}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'highlights'
                    ? 'bg-orange-500/20 text-orange-400'
                    : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                }`}
              >
                <Highlighter className="h-4 w-4" />
                <span className="hidden sm:inline">Resaltados</span>
                <span className="text-xs opacity-70">({highlights.length})</span>
              </button>
              <button
                onClick={() => setViewMode('library')}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'library'
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                }`}
              >
                <Library className="h-4 w-4" />
                <span className="hidden sm:inline">Biblioteca</span>
                <span className="text-xs opacity-70">({userDocuments.length})</span>
              </button>
            </div>
          </div>

          {/* Bible Selectors */}
          {viewMode === 'chapter' && (
            <div className="flex gap-3 items-center flex-wrap">
              <Select value={selectedVersion} onValueChange={handleVersionChange}>
                <SelectTrigger className="w-[200px] bg-background/50 border-white/10">
                  <SelectValue placeholder="Versión" />
                </SelectTrigger>
                <SelectContent>
                  {(() => {
                    const versionsByLanguage = bibleVersions?.reduce((acc, version) => {
                      const language = version.language.name;
                      if (!acc[language]) acc[language] = [];
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
                            ? 'text-orange-400 bg-orange-500/10 border-b border-orange-500/20'
                            : 'text-muted-foreground bg-muted/50'
                        }`}>
                          {language} ({versionsByLanguage[language].length})
                        </div>
                        {versionsByLanguage[language].map((version) => (
                          <SelectItem key={version.id} value={version.id}>
                            {version.name} ({version.abbreviation})
                          </SelectItem>
                        ))}
                      </div>
                    ));
                  })()}
                </SelectContent>
              </Select>

              <Select value={selectedBook} onValueChange={handleBookChange}>
                <SelectTrigger className="w-[180px] bg-background/50 border-white/10">
                  <SelectValue placeholder="Libro" />
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
                  <SelectTrigger className="w-[120px] bg-background/50 border-white/10">
                    <SelectValue placeholder="Cap." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBooks
                      ?.find(b => b.id === selectedBook)
                      ?.chapters?.map((chapter) => (
                        <SelectItem key={chapter.id} value={chapter.id}>
                          Cap. {chapter.number}
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
                ? `${searchResults.length} versículos encontrados para "${searchQuery}"`
                : !searching ? `Sin resultados para "${searchQuery}"` : 'Buscando...'}
            </div>
          )}
        </div>

        {/* Chapter Navigation */}
        {viewMode === 'chapter' && currentChapter && (
          <div className="bible-card-sunset relative overflow-hidden">
            <div className="relative z-10 flex items-center justify-between">
              <button
                onClick={() => navigateChapter('prev')}
                disabled={!currentChapter.previous}
                className="bg-white/20 backdrop-blur-sm rounded-full p-3 text-white disabled:opacity-30 transition-opacity"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="text-center">
                <p className="text-white/70 text-sm">Leyendo</p>
                <h2 className="text-white text-xl font-bold">
                  {getCurrentBookName()} {getCurrentChapterNumber()}
                </h2>
              </div>
              <button
                onClick={() => navigateChapter('next')}
                disabled={!currentChapter.next}
                className="bg-white/20 backdrop-blur-sm rounded-full p-3 text-white disabled:opacity-30 transition-opacity"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <div className="absolute inset-0 opacity-20">
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mb-16"></div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-6">
          {viewMode === 'library' ? (
            <>
              {/* Upload Hero */}
              <div className="bible-card-purple relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <Library className="h-6 w-6 text-white" />
                    <h2 className="text-white text-xl font-bold">Mi Biblioteca</h2>
                  </div>
                  <p className="text-white/70 mb-6">Sube tus libros y léelos directamente en Bibly</p>
                  <div className="flex flex-wrap gap-3">
                    <input
                      type="file"
                      accept=".pdf,.epub,.txt,.json,.xml"
                      onChange={handleFileUpload}
                      disabled={uploadingFile}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload">
                      <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 text-white font-medium cursor-pointer hover:bg-white/30 transition-colors">
                        <Upload className="h-5 w-5" />
                        {uploadingFile ? 'Subiendo...' : 'Subir Archivo'}
                      </span>
                    </label>
                    <button
                      onClick={() => setViewMode('chapter')}
                      className="bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 text-white font-medium hover:bg-white/20 transition-colors flex items-center gap-2"
                    >
                      <BookOpen className="h-5 w-5" />
                      Ir a Lectura
                    </button>
                  </div>
                  <p className="text-white/50 text-xs mt-3">PDF, EPUB, TXT, JSON, XML</p>
                </div>
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mb-20"></div>
                </div>
              </div>

              {/* Documents Grid */}
              {userDocuments.length === 0 ? (
                <div className="bible-glass-card p-12 text-center">
                  <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No tienes documentos aún</h3>
                  <p className="text-muted-foreground">
                    Sube tu primera Biblia, EPUB o PDF para comenzar
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="bible-glass-card p-4 cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => {
                        if (doc.is_bible) {
                          handleVersionChange(`user-${doc.id}`);
                          setViewMode('chapter');
                        } else if (doc.file_type === 'epub' || doc.file_type === 'pdf') {
                          navigate(`/collaborative-reader/${doc.id}`);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            doc.file_type === 'pdf' ? 'bg-red-500/20' :
                            doc.file_type === 'epub' ? 'bg-blue-500/20' :
                            doc.file_type === 'xml' ? 'bg-green-500/20' :
                            doc.file_type === 'json' ? 'bg-orange-500/20' :
                            'bg-gray-500/20'
                          }`}>
                            {doc.file_type === 'pdf' ? <FileText className="h-5 w-5 text-red-400" /> :
                             doc.file_type === 'epub' ? <BookOpen className="h-5 w-5 text-blue-400" /> :
                             <BookOpen className="h-5 w-5 text-orange-400" />}
                          </div>
                          <div>
                            <h4 className="font-medium text-sm">{doc.name}</h4>
                            <p className="text-xs text-muted-foreground">{doc.file_size_mb} MB</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>{doc.collaborators?.length || 0} colaboradores</span>
                        {doc.is_bible && (
                          <span className="bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full text-xs">Biblia</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {new Date(doc.created_at).toLocaleDateString('es-ES')}
                        </span>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="p-2 rounded-full hover:bg-white/10 text-muted-foreground transition-colors"
                            onClick={() => {
                              const email = prompt('Email del colaborador:');
                              if (email) shareDocument(doc.id, email);
                            }}
                          >
                            <Share2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            className="p-2 rounded-full hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                            onClick={() => deleteDocument(doc.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : viewMode === 'highlights' ? (
            <>
              {highlights.length === 0 ? (
                <div className="bible-glass-card p-12 text-center">
                  <Highlighter className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No tienes resaltados aún</h3>
                  <p className="text-muted-foreground mb-4">
                    Selecciona texto en la Biblia para crear tu primer resaltado
                  </p>
                  <button
                    onClick={() => setViewMode('chapter')}
                    className="bg-orange-500/20 hover:bg-orange-500/30 backdrop-blur-sm rounded-full px-6 py-3 text-orange-400 font-medium transition-colors"
                  >
                    <BookOpen className="h-4 w-4 inline mr-2" />
                    Ir a Lectura
                  </button>
                </div>
              ) : (
                <>
                  {/* Category Filters */}
                  <div className="flex flex-wrap gap-2">
                    <button className="bg-white/10 rounded-full px-4 py-1.5 text-sm text-foreground">
                      Todos ({highlights.length})
                    </button>
                    {HIGHLIGHT_CATEGORIES.map((category) => {
                      const count = highlights.filter(h => h.category === category.id).length;
                      if (count === 0) return null;
                      const IconComponent = category.icon;
                      return (
                        <button
                          key={category.id}
                          className={`rounded-full px-4 py-1.5 text-sm flex items-center gap-1.5 bg-${category.color}-500/20 text-${category.color}-400`}
                        >
                          <IconComponent className="h-3 w-3" />
                          {category.name} ({count})
                        </button>
                      );
                    })}
                  </div>

                  {/* Highlights List */}
                  <div className="space-y-3">
                    {highlights.map((highlight) => {
                      const colorData = HIGHLIGHT_COLORS[highlight.color as keyof typeof HIGHLIGHT_COLORS];
                      const category = HIGHLIGHT_CATEGORIES.find(c => c.id === highlight.category);

                      return (
                        <div key={highlight.id} className="bible-glass-card p-4 border-l-4 border-l-orange-400">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${colorData?.bg}`}></div>
                              <span className="font-medium text-orange-400 text-sm">{highlight.reference}</span>
                            </div>
                            <div className="flex gap-1">
                              <button
                                className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                                onClick={() => { setViewMode('chapter'); toast.success('Navegando al capítulo...'); }}
                              >
                                <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                              </button>
                              <button
                                className="p-1.5 rounded-full hover:bg-red-500/10 transition-colors"
                                onClick={() => { setHighlights(prev => prev.filter(h => h.id !== highlight.id)); toast.success('Eliminado'); }}
                              >
                                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-400" />
                              </button>
                            </div>
                          </div>
                          <blockquote className={`text-base leading-relaxed p-3 rounded-lg ${colorData?.bg} mb-2`}>
                            "{highlight.text}"
                          </blockquote>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            {category && (
                              <div className="flex items-center gap-1">
                                <category.icon className="h-3 w-3" />
                                <span>{category.name}</span>
                              </div>
                            )}
                            <span>{new Date(highlight.createdAt).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          ) : viewMode === 'search' ? (
            searchResults?.length === 0 ? (
              <div className="bible-glass-card p-8 text-center">
                <p className="text-muted-foreground">
                  {searchQuery ? 'No se encontraron versículos.' : 'Escribe algo para buscar.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {searchResults?.map((verse, index) => (
                  <div key={verse.id || index} className="bible-glass-card p-4 border-l-4 border-l-orange-400">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-orange-400">
                          {formatVerseReference(verse.reference)}
                        </h3>
                        <span className="text-xs text-muted-foreground bg-white/10 rounded-full px-2 py-0.5 inline-block mt-1">
                          {bibleVersions.find(v => v.id === selectedVersion)?.abbreviation || 'Bible'}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <button className="p-2 rounded-full hover:bg-white/10 text-muted-foreground">
                          <Highlighter className="h-4 w-4" />
                        </button>
                        <button className="p-2 rounded-full hover:bg-white/10 text-muted-foreground">
                          <MessageSquare className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-base leading-relaxed" dangerouslySetInnerHTML={{ __html: verse.text }} />
                  </div>
                ))}
              </div>
            )
          ) : (
            loadingChapter ? (
              <div className="bible-glass-card p-12 text-center">
                <BookOpen className="h-12 w-12 text-orange-400 mx-auto mb-4 animate-pulse" />
                <p className="text-muted-foreground">Cargando capítulo...</p>
              </div>
            ) : !currentChapter ? (
              <div className="bible-glass-card p-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Selecciona un libro y capítulo para empezar a leer
                </p>
              </div>
            ) : (
              <div className="bible-glass-card p-0 overflow-hidden">
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
                        if (highlightId) handleHighlightClick(highlightId);
                      }
                    }}
                    dangerouslySetInnerHTML={{
                      __html: (() => {
                        let content = currentChapter.content
                          .replace(/class="[^"]*"/g, '')
                          .replace(/<span[^>]*data-number="(\d+)"[^>]*>/g, '<sup>$1</sup>')
                          .replace(/<\/span>/g, '')
                          .replace(/\s+/g, ' ')
                          .replace(/(\d+)\s+/g, '<sup>$1</sup> ');

                        highlights.forEach(highlight => {
                          if (highlight.chapterId === currentChapter.id) {
                            const escapedText = highlight.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                            const regex = new RegExp(escapedText, 'gi');
                            content = content.replace(regex, `<span class="highlight-${highlight.color}" data-highlight-id="${highlight.id}">$&</span>`);
                          }
                        });

                        return `
                          <style>
                            .bible-text sup { font-size: 0.7em; color: hsl(var(--spiritual)); font-weight: 600; margin-right: 0.2em; padding: 0.1em 0.3em; background: hsl(var(--spiritual)/0.1); border-radius: 0.25rem; line-height: 1; }
                            .bible-text p { margin-bottom: 1.5rem; text-indent: 1.5rem; }
                            .bible-text p:first-child { text-indent: 0; }
                            .bible-text::selection { background: hsl(var(--spiritual)/0.3); }
                            .highlight-yellow { background-color: #fef3c7; padding: 2px 4px; border-radius: 3px; border-left: 3px solid #f59e0b; cursor: pointer; }
                            .highlight-blue { background-color: #dbeafe; padding: 2px 4px; border-radius: 3px; border-left: 3px solid #3b82f6; cursor: pointer; }
                            .highlight-green { background-color: #d1fae5; padding: 2px 4px; border-radius: 3px; border-left: 3px solid #10b981; cursor: pointer; }
                            .highlight-pink { background-color: #fce7f3; padding: 2px 4px; border-radius: 3px; border-left: 3px solid #ec4899; cursor: pointer; }
                            .highlight-purple { background-color: #e9d5ff; padding: 2px 4px; border-radius: 3px; border-left: 3px solid #8b5cf6; cursor: pointer; }
                            .highlight-orange { background-color: #fed7aa; padding: 2px 4px; border-radius: 3px; border-left: 3px solid #f97316; cursor: pointer; }
                            [class*="highlight-"]:hover { transform: scale(1.02); box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
                          </style>
                          ${content}
                        `;
                      })()
                    }}
                  />

                  {/* Highlight Menu */}
                  {showHighlightMenu && (
                    <div
                      className="fixed z-50 bible-glass-card p-3"
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
                          <button
                            key={colorKey}
                            className={`h-8 rounded-lg text-xs font-medium flex items-center justify-center gap-1 ${colorData.bg} ${colorData.text}`}
                            onClick={() => createHighlight(colorKey)}
                          >
                            <Palette className="h-3 w-3" />
                            {colorData.name}
                          </button>
                        ))}
                      </div>
                      <div className="border-t border-white/10 pt-2">
                        <div className="text-xs text-muted-foreground mb-1">Categorías:</div>
                        <div className="grid grid-cols-2 gap-1">
                          {HIGHLIGHT_CATEGORIES.map((cat) => {
                            const Icon = cat.icon;
                            const cd = HIGHLIGHT_COLORS[cat.color as keyof typeof HIGHLIGHT_COLORS];
                            return (
                              <button
                                key={cat.id}
                                className={`h-7 rounded-lg text-xs flex items-center justify-center gap-1 ${cd.bg} ${cd.text}`}
                                onClick={() => createHighlight(cat.color, cat.id)}
                              >
                                <Icon className="h-3 w-3" />
                                {cat.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <button
                        className="w-full mt-2 text-xs text-muted-foreground hover:text-foreground py-1"
                        onClick={() => setShowHighlightMenu(false)}
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>

                {/* Bottom Nav */}
                <div className="p-4 border-t border-white/10 flex justify-between items-center">
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigateChapter('prev')}
                      disabled={!currentChapter.previous}
                      className="bg-white/5 hover:bg-white/10 rounded-full px-4 py-2 text-sm text-muted-foreground disabled:opacity-30 flex items-center gap-1 transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" /> Anterior
                    </button>
                    <button
                      onClick={() => navigateChapter('next')}
                      disabled={!currentChapter.next}
                      className="bg-white/5 hover:bg-white/10 rounded-full px-4 py-2 text-sm text-muted-foreground disabled:opacity-30 flex items-center gap-1 transition-colors"
                    >
                      Siguiente <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="text-sm text-muted-foreground">{currentChapter.reference}</span>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Bible;