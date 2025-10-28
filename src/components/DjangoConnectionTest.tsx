import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

export const DjangoConnectionTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testDjangoConnection = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    addResult('🔍 Starting Django connection tests...');

    // Test 1: Basic connection
    try {
      addResult('📡 Testing basic connection to Django...');
      const response = await fetch('http://127.0.0.1:8000/api/highlight/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        addResult(`✅ Django connection successful! Found ${data.length} highlights`);
        addResult(`📊 Highlights: ${JSON.stringify(data, null, 2)}`);
      } else {
        addResult(`❌ Django connection failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      addResult(`❌ Django connection error: ${error}`);
    }

    // Test 2: CORS check
    try {
      addResult('🔒 Testing CORS configuration...');
      const corsResponse = await fetch('http://127.0.0.1:8000/api/highlight/', {
        method: 'OPTIONS',
      });
      
      if (corsResponse.ok) {
        addResult('✅ CORS is properly configured');
      } else {
        addResult('❌ CORS might not be configured correctly');
      }
    } catch (error) {
      addResult(`❌ CORS test failed: ${error}`);
    }

    setIsLoading(false);
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-4">🧪 Django Backend Connection Test</h3>
      
      <Button 
        onClick={testDjangoConnection} 
        disabled={isLoading}
        className="mb-4"
      >
        {isLoading ? 'Testing...' : 'Test Django Connection'}
      </Button>

      <div className="bg-gray-100 p-3 rounded max-h-96 overflow-y-auto">
        {testResults.length === 0 ? (
          <p className="text-gray-500">Click the button to test Django connection</p>
        ) : (
          testResults.map((result, index) => (
            <div key={index} className="text-sm font-mono mb-1">
              {result}
            </div>
          ))
        )}
      </div>
    </div>
  );
};