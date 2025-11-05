import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

export const SimpleDjangoTest: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testConnection = async () => {
    setIsLoading(true);
    setResult('🔍 Testing Django connection...');
    
    try {
      const response = await fetch('http://127.0.0.1:8000/api/book-highlights/');
      
      if (response.ok) {
        const data = await response.json();
        setResult(`✅ Success! Found ${data.length} highlights: ${JSON.stringify(data, null, 2)}`);
      } else {
        setResult(`❌ Failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      setResult(`❌ Error: ${error}`);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm mb-4">
      <h3 className="text-lg font-semibold mb-4">📚 Book Highlights API Test</h3>
      
      <Button 
        onClick={testConnection} 
        disabled={isLoading}
        className="mb-4"
      >
        {isLoading ? 'Testing...' : 'Test Book Highlights API'}
      </Button>

      <div className="bg-gray-100 p-3 rounded text-sm font-mono whitespace-pre-wrap">
        {result || 'Click button to test'}
      </div>
    </div>
  );
};