// Bible Error Handler Service
// Handles error classification, user-friendly messages, and logging

import { toast } from "sonner";
import { BibleError } from "./xmlBibleParser";

export class BibleErrorHandler {
  private debugMode: boolean = false;

  constructor(debugMode: boolean = false) {
    this.debugMode = debugMode;
  }

  /**
   * Handle parsing errors and convert to user-friendly format
   */
  handleParseError(error: Error, fileName: string): BibleError {
    const errorMessage = error.message.toLowerCase();

    if (errorMessage.includes('invalid xml') || errorMessage.includes('parsererror')) {
      return {
        type: 'PARSE_ERROR',
        message: 'Invalid XML format detected',
        details: `The file "${fileName}" contains XML syntax errors that prevent parsing.`,
        suggestions: [
          'Verify the XML file is properly formatted',
          'Check for missing closing tags or invalid characters',
          'Try validating the XML using an online XML validator'
        ]
      };
    }

    if (errorMessage.includes('no bible content') || errorMessage.includes('unable to parse')) {
      return {
        type: 'VALIDATION_ERROR',
        message: 'No Bible content found in file',
        details: `The file "${fileName}" does not contain recognizable Bible structure.`,
        suggestions: [
          'Ensure the file contains Bible books, chapters, and verses',
          'Supported formats: XMLBIBLE, OSIS, or generic XML with book/chapter/verse structure',
          'Check if the file is corrupted or in an unsupported format'
        ]
      };
    }

    if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
      return {
        type: 'NETWORK_ERROR',
        message: 'Network error occurred',
        details: `Failed to load or process the file "${fileName}" due to network issues.`,
        suggestions: [
          'Check your internet connection',
          'Try uploading the file again',
          'Ensure the file is not too large for upload'
        ]
      };
    }

    return {
      type: 'UNKNOWN_ERROR',
      message: 'Unexpected error occurred',
      details: `An unexpected error occurred while processing "${fileName}": ${error.message}`,
      suggestions: [
        'Try uploading the file again',
        'Check if the file is corrupted',
        'Contact support if the problem persists'
      ]
    };
  }

  /**
   * Handle validation errors for incomplete Bible structures
   */
  handleValidationError(issues: string[], fileName?: string): BibleError {
    const fileRef = fileName ? ` in "${fileName}"` : '';
    
    return {
      type: 'VALIDATION_ERROR',
      message: 'Bible structure validation failed',
      details: `The following issues were found${fileRef}: ${issues.join(', ')}`,
      suggestions: [
        'Ensure all books have at least one chapter',
        'Verify that chapters contain verses',
        'Check for missing required attributes or elements'
      ]
    };
  }

  /**
   * Display user-friendly error message with toast notification
   */
  displayUserFriendlyError(error: BibleError): void {
    // Log detailed error for debugging
    this.log('Bible Error:', error);

    // Show user-friendly toast message
    const toastMessage = this.formatErrorMessage(error);
    
    switch (error.type) {
      case 'PARSE_ERROR':
        toast.error(toastMessage, {
          description: 'Please check your XML file format',
          duration: 6000
        });
        break;
      
      case 'VALIDATION_ERROR':
        toast.error(toastMessage, {
          description: 'The file structure is not recognized as a Bible',
          duration: 6000
        });
        break;
      
      case 'NETWORK_ERROR':
        toast.error(toastMessage, {
          description: 'Please check your connection and try again',
          duration: 5000
        });
        break;
      
      default:
        toast.error(toastMessage, {
          description: 'Please try again or contact support',
          duration: 5000
        });
        break;
    }

    // Show suggestions if available
    if (error.suggestions && error.suggestions.length > 0) {
      setTimeout(() => {
        toast.info('Suggestions:', {
          description: error.suggestions!.slice(0, 2).join('. '),
          duration: 8000
        });
      }, 1000);
    }
  }

  /**
   * Format error message for display
   */
  private formatErrorMessage(error: BibleError): string {
    switch (error.type) {
      case 'PARSE_ERROR':
        return 'XML file format error';
      
      case 'VALIDATION_ERROR':
        return 'Bible content not found';
      
      case 'NETWORK_ERROR':
        return 'Network connection error';
      
      default:
        return 'File processing error';
    }
  }

  /**
   * Handle successful parsing with warnings
   */
  displaySuccessWithWarnings(fileName: string, booksFound: number, warnings: string[]): void {
    toast.success(`${fileName} loaded successfully`, {
      description: `${booksFound} books found`,
      duration: 4000
    });

    if (warnings.length > 0) {
      setTimeout(() => {
        toast.warning('Loading completed with warnings', {
          description: warnings.slice(0, 2).join('. '),
          duration: 6000
        });
      }, 1000);
    }
  }

  /**
   * Display successful parsing result
   */
  displaySuccess(fileName: string, booksFound: number, chaptersFound: number): void {
    toast.success(`${fileName} loaded successfully`, {
      description: `${booksFound} books, ${chaptersFound} chapters found`,
      duration: 4000
    });
  }

  /**
   * Log error information for debugging
   */
  private log(...args: any[]): void {
    if (this.debugMode) {
      console.error('[BibleErrorHandler]', ...args);
    }
  }

  /**
   * Create a validation error for missing books
   */
  createNoBooksError(fileName: string): BibleError {
    return {
      type: 'VALIDATION_ERROR',
      message: 'No books found in Bible file',
      details: `The file "${fileName}" was parsed but contains no recognizable Bible books.`,
      suggestions: [
        'Verify the file contains book elements or structures',
        'Check if the XML uses supported naming conventions',
        'Ensure the file is not empty or corrupted'
      ]
    };
  }

  /**
   * Create a validation error for missing chapters
   */
  createNoChaptersError(fileName: string, bookName: string): BibleError {
    return {
      type: 'VALIDATION_ERROR',
      message: 'Book has no chapters',
      details: `The book "${bookName}" in "${fileName}" contains no chapters.`,
      suggestions: [
        'Verify the book contains chapter elements',
        'Check if chapters are properly nested within books',
        'Ensure chapter numbering is present'
      ]
    };
  }

  /**
   * Create a validation error for missing verses
   */
  createNoVersesError(fileName: string, chapterRef: string): BibleError {
    return {
      type: 'VALIDATION_ERROR',
      message: 'Chapter has no verses',
      details: `The chapter "${chapterRef}" in "${fileName}" contains no verses.`,
      suggestions: [
        'Verify the chapter contains verse elements or text',
        'Check if verses are properly formatted',
        'Ensure verse numbering is present'
      ]
    };
  }
}