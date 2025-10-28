// Browser API Test - Copy and paste this in your browser console
// Test your Django API connection directly

console.log('🧪 Starting Django API Tests...');

// Test 1: Check if Django is running
async function testDjangoConnection() {
  try {
    console.log('📡 Testing Django connection...');
    const response = await fetch('http://127.0.0.1:8000/api/highlight/');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Django is running!');
      console.log(`📊 Found ${data.length} highlights:`, data);
      return true;
    } else {
      console.error('❌ Django connection failed:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error('❌ Django connection error:', error);
    return false;
  }
}

// Test 2: Test CORS
async function testCORS() {
  try {
    console.log('🔒 Testing CORS...');
    const response = await fetch('http://127.0.0.1:8000/api/highlight/', {
      method: 'OPTIONS'
    });
    
    if (response.ok) {
      console.log('✅ CORS is working!');
      return true;
    } else {
      console.error('❌ CORS failed:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ CORS error:', error);
    return false;
  }
}

// Test 3: Test POST (create highlight)
async function testCreateHighlight() {
  try {
    console.log('💾 Testing highlight creation...');
    
    const testHighlight = {
      id: `browser_test_${Date.now()}`,
      user_name: 'Browser Test User',
      verse: 'Test highlight from browser console',
      color: 'blue'
    };
    
    const response = await fetch('http://127.0.0.1:8000/api/highlight/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testHighlight)
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Highlight created successfully!', data);
      return true;
    } else {
      console.error('❌ Failed to create highlight:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return false;
    }
  } catch (error) {
    console.error('❌ Create highlight error:', error);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Running all Django API tests...');
  
  const connectionOK = await testDjangoConnection();
  const corsOK = await testCORS();
  
  if (connectionOK && corsOK) {
    console.log('🎯 Basic tests passed! Trying to create a highlight...');
    await testCreateHighlight();
  } else {
    console.log('❌ Basic tests failed. Check Django server and CORS configuration.');
  }
  
  console.log('🏁 Tests completed!');
}

// Auto-run tests
runAllTests();

// Manual test functions (you can call these individually)
window.testDjango = {
  connection: testDjangoConnection,
  cors: testCORS,
  create: testCreateHighlight,
  all: runAllTests
};

console.log('💡 You can also run individual tests:');
console.log('- testDjango.connection()');
console.log('- testDjango.cors()'); 
console.log('- testDjango.create()');
console.log('- testDjango.all()');