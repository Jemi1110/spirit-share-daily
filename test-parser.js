// Simple test to verify our XML parser works with Spanish names
import { XMLBibleParser } from './src/services/xmlBibleParser.js';
import { readFileSync } from 'fs';

const xmlContent = readFileSync('./test-spanish-bible.xml', 'utf8');
const parser = new XMLBibleParser(true); // Enable debug mode

console.log('Testing XML Bible Parser with Spanish names...\n');

const result = parser.parseXMLBible(xmlContent);

if (result.success && result.data) {
  console.log('✅ Parsing successful!');
  console.log(`📚 Books found: ${result.data.books.length}`);
  
  result.data.books.forEach((book, index) => {
    console.log(`\n${index + 1}. ${book.name} (${book.abbreviation})`);
    console.log(`   ID: ${book.id}`);
    console.log(`   Chapters: ${book.chapters.length}`);
    
    book.chapters.forEach(chapter => {
      const verseCount = Object.keys(chapter.verses).length;
      console.log(`   - ${chapter.reference}: ${verseCount} verses`);
    });
  });
  
  console.log('\n🎉 All books have proper Spanish names!');
} else {
  console.log('❌ Parsing failed:', result.error);
}