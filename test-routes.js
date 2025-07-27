
import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

// Test data for creating records
const testData = {
  user: {
    username: `testuser${Date.now()}`,
    password: 'testpass123',
    name: 'Test User',
    role: 'admin',
    region: 'Test Region',
    avatar: ''
  },
  category: {
    name: `Test Category ${Date.now()}`,
    description: 'Test category for API testing',
    color: 'bg-blue-500'
  },
  specialty: {
    name: `Test Specialty ${Date.now()}`,
    description: 'Test specialty for API testing'
  },
  stockItem: {
    name: `Test Item ${Date.now()}`,
    categoryId: 1,
    specialtyId: 1,
    quantity: 100,
    price: 1500, // $15.00 in cents
    expiry: '2024-12-31',
    uniqueNumber: 'TEST001',
    notes: 'Test item for API testing'
  },
  request: {
    type: 'Receive Inventory',
    title: 'Test Request',
    description: 'Test inventory request',
    priority: 'medium',
    assignedTo: null,
    items: [{
      stockItemId: 'none',
      itemName: 'Test Request Item',
      quantity: 10,
      notes: 'Test item in request'
    }]
  }
};

class APITester {
  constructor() {
    this.axios = axios.create({
      baseURL: BASE_URL,
      timeout: 30000, // Increased timeout
      validateStatus: () => true, // Don't throw on HTTP errors
      withCredentials: true, // Important for session cookies
      headers: {
        'User-Agent': 'API-Tester/1.0'
      }
    });
    this.sessionCookie = null;
    this.testResults = [];
  }

  log(message, status = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${status}] ${message}`;
    console.log(logMessage);
    this.testResults.push({ timestamp, status, message });
  }

  async makeRequest(method, url, data = null, headers = {}) {
    try {
      const config = {
        method,
        url,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        withCredentials: true
      };

      // Handle session cookies more robustly
      if (this.sessionCookie) {
        config.headers.Cookie = this.sessionCookie;
      }

      if (data) {
        config.data = data;
      }

      const response = await this.axios(config);
      
      // Store all session cookies if received
      if (response.headers['set-cookie']) {
        // Join multiple cookies if present
        this.sessionCookie = response.headers['set-cookie'].join('; ');
      }

      return response;
    } catch (error) {
      this.log(`Request failed: ${error.message}`, 'ERROR');
      return { status: 0, data: { error: error.message } };
    }
  }

  async testRoute(method, endpoint, data = null, expectedStatus = 200, description = '') {
    const testName = `${method} ${endpoint}${description ? ' - ' + description : ''}`;
    this.log(`Testing: ${testName}`);

    const response = await this.makeRequest(method, endpoint, data);
    
    // Handle array of expected status codes
    const expectedStatuses = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
    
    if (expectedStatuses.includes(response.status)) {
      this.log(`✅ PASS: ${testName} (${response.status})`, 'PASS');
      return { success: true, data: response.data, status: response.status };
    } else {
      this.log(`❌ FAIL: ${testName} (Expected: ${expectedStatuses.join(' or ')}, Got: ${response.status})`, 'FAIL');
      if (response.data) {
        this.log(`Response: ${JSON.stringify(response.data)}`, 'INFO');
      }
      return { success: false, data: response.data, status: response.status };
    }
  }

  async runTests() {
    this.log('Starting comprehensive API tests...', 'START');

    // Test server connectivity first
    this.log('\n=== CONNECTIVITY TESTS ===');
    const connectivityTest = await this.testRoute('GET', '/', null, 200, 'Server connectivity');
    if (!connectivityTest.success) {
      this.log('❌ Server is not responding. Please ensure the server is running on port 5000.', 'ERROR');
      return;
    }

    // Test authentication endpoints
    this.log('\n=== AUTHENTICATION TESTS ===');
    
    // Test current user without authentication (should fail)
    await this.testRoute('GET', '/api/user', null, 401, 'Get user without auth');

    // Test registration (should work or fail if user exists)
    const registerResult = await this.testRoute('POST', '/api/register', testData.user, [201, 400], 'User registration');

    // Test login with created user
    const loginResult = await this.testRoute('POST', '/api/login', 
      { username: testData.user.username, password: testData.user.password }, 200, 'User login');
    
    if (loginResult.success) {
      // Test authenticated user endpoint
      await this.testRoute('GET', '/api/user', null, 200, 'Get authenticated user');
      this.log('✅ Authentication successful - proceeding with authenticated tests', 'SUCCESS');
    } else {
      this.log('❌ Authentication failed - some tests may not work', 'ERROR');
    }

    // Test login with invalid credentials (should fail)
    await this.testRoute('POST', '/api/login', 
      { username: 'invalid', password: 'invalid' }, 401, 'Invalid login');

    // Test categories (public endpoint)
    this.log('\n=== CATEGORY TESTS ===');
    await this.testRoute('GET', '/api/categories', null, 200, 'Get categories');
    
    // Test category creation (requires auth)
    const categoryResult = await this.testRoute('POST', '/api/categories', testData.category, 200, 'Create category');
    let categoryId = null;
    if (categoryResult.success && categoryResult.data.id) {
      categoryId = categoryResult.data.id;
      testData.stockItem.categoryId = categoryId;
    }

    // Test specialties
    this.log('\n=== SPECIALTY TESTS ===');
    await this.testRoute('GET', '/api/specialties', null, 200, 'Get specialties');
    
    const specialtyResult = await this.testRoute('POST', '/api/specialties', testData.specialty, 200, 'Create specialty');
    let specialtyId = null;
    if (specialtyResult.success && specialtyResult.data.id) {
      specialtyId = specialtyResult.data.id;
      testData.stockItem.specialtyId = specialtyId;
    }

    // Test users management
    this.log('\n=== USER MANAGEMENT TESTS ===');
    await this.testRoute('GET', '/api/users', null, 200, 'Get users');

    // Test stock items
    this.log('\n=== STOCK ITEM TESTS ===');
    await this.testRoute('GET', '/api/stock-items', null, 200, 'Get stock items');
    await this.testRoute('GET', '/api/stock-items/expiring', null, 200, 'Get expiring items');
    
    const stockItemResult = await this.testRoute('POST', '/api/stock-items', testData.stockItem, 200, 'Create stock item');
    let stockItemId = null;
    if (stockItemResult.success && stockItemResult.data.id) {
      stockItemId = stockItemResult.data.id;
    }

    // Test allocations
    this.log('\n=== ALLOCATION TESTS ===');
    await this.testRoute('GET', '/api/allocations', null, 200, 'Get allocations');
    await this.testRoute('GET', '/api/my-allocated-inventory', null, 200, 'Get my allocated inventory');
    await this.testRoute('GET', '/api/my-specialty-inventory', null, 200, 'Get my specialty inventory');

    // Test movements
    this.log('\n=== MOVEMENT TESTS ===');
    await this.testRoute('GET', '/api/movements', null, 200, 'Get movements');
    if (stockItemId) {
      await this.testRoute('GET', `/api/movements?itemId=${stockItemId}`, null, 200, 'Get movements for item');
    }

    // Test requests
    this.log('\n=== REQUEST TESTS ===');
    await this.testRoute('GET', '/api/requests', null, 200, 'Get requests');
    
    const requestResult = await this.testRoute('POST', '/api/requests', testData.request, 200, 'Create request');
    let requestId = null;
    if (requestResult.success && requestResult.data.id) {
      requestId = requestResult.data.id;
      
      // Test request details
      await this.testRoute('GET', `/api/requests/${requestId}`, null, 200, 'Get request details');
      
      // Test request approval actions
      await this.testRoute('POST', `/api/requests/${requestId}/approve`, 
        { notes: 'Test approval' }, 200, 'Approve request');
    }

    // Test active roles
    this.log('\n=== ROLE MANAGEMENT TESTS ===');
    await this.testRoute('GET', '/api/active-roles', null, 200, 'Get active roles');

    // Test sync functionality
    this.log('\n=== SYNC TESTS ===');
    await this.testRoute('POST', '/api/sync-quantities', null, 200, 'Sync quantities');

    // Test logout
    this.log('\n=== LOGOUT TEST ===');
    await this.testRoute('POST', '/api/logout', null, 200, 'User logout');

    // Generate summary
    this.generateSummary();
  }

  generateSummary() {
    this.log('\n=== TEST SUMMARY ===', 'SUMMARY');
    
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const total = passed + failed;
    
    this.log(`Total Tests: ${total}`, 'SUMMARY');
    this.log(`Passed: ${passed}`, 'SUMMARY');
    this.log(`Failed: ${failed}`, 'SUMMARY');
    this.log(`Success Rate: ${total > 0 ? ((passed / total) * 100).toFixed(2) : 0}%`, 'SUMMARY');
    
    if (failed > 0) {
      this.log('\nFailed Tests:', 'SUMMARY');
      this.testResults.filter(r => r.status === 'FAIL').forEach(test => {
        this.log(`- ${test.message}`, 'SUMMARY');
      });
    }

    this.log('\nTest completed!', 'SUMMARY');
  }
}

// Run the tests
async function main() {
  const tester = new APITester();
  
  try {
    await tester.runTests();
  } catch (error) {
    console.error('Test runner failed:', error);
  }
}

// Export for use as module or run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { APITester, testData };
