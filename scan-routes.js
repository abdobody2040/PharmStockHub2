
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class RoutesScanner {
  constructor() {
    this.routes = [];
    this.functions = [];
  }

  scanRouteFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Extract route definitions - improved patterns
      const routePatterns = [
        /app\.(get|post|put|delete|patch)\s*\(\s*["'`]([^"'`]+)["'`]/gi,
        /router\.(get|post|put|delete|patch)\s*\(\s*["'`]([^"'`]+)["'`]/gi,
        // Express.js route patterns
        /\.route\s*\(\s*["'`]([^"'`]+)["'`]\s*\)\s*\.(get|post|put|delete|patch)/gi,
        // Direct route definitions
        /["'`](\/api\/[^"'`]+)["'`]\s*,\s*async\s*\(/gi
      ];

      routePatterns.forEach(pattern => {
        let match;
        pattern.lastIndex = 0; // Reset regex
        while ((match = pattern.exec(content)) !== null) {
          if (match[1] && match[2]) {
            this.routes.push({
              method: match[1].toUpperCase(),
              path: match[2],
              file: path.basename(filePath)
            });
          } else if (match[1] && match[1].startsWith('/api/')) {
            // Handle direct API route patterns
            this.routes.push({
              method: 'UNKNOWN',
              path: match[1],
              file: path.basename(filePath)
            });
          }
        }
      });

      // Extract function definitions - improved patterns
      const functionPatterns = [
        /async\s+function\s+(\w+)/gi,
        /function\s+(\w+)/gi,
        /const\s+(\w+)\s*=\s*async\s*\(/gi,
        /const\s+(\w+)\s*=\s*\(/gi,
        /(\w+):\s*async\s*\(/gi,
        /export\s+async\s+function\s+(\w+)/gi,
        /export\s+function\s+(\w+)/gi
      ];

      functionPatterns.forEach(pattern => {
        let match;
        pattern.lastIndex = 0; // Reset regex
        while ((match = pattern.exec(content)) !== null) {
          if (match[1] && !['if', 'for', 'while', 'switch', 'catch'].includes(match[1])) {
            this.functions.push({
              name: match[1],
              file: path.basename(filePath)
            });
          }
        }
      });

    } catch (error) {
      console.error(`Error scanning ${filePath}:`, error.message);
    }
  }

  scanDirectory(dirPath) {
    try {
      const files = fs.readdirSync(dirPath);
      
      files.forEach(file => {
        const fullPath = path.join(dirPath, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          this.scanDirectory(fullPath);
        } else if (file.endsWith('.ts') || file.endsWith('.js')) {
          this.scanRouteFile(fullPath);
        }
      });
    } catch (error) {
      console.error(`Error scanning directory ${dirPath}:`, error.message);
    }
  }

  generateReport() {
    console.log('=== INVENTORY MANAGEMENT SYSTEM - ROUTES & FUNCTIONS SCAN ===\n');
    
    // Group routes by method
    const routesByMethod = {};
    this.routes.forEach(route => {
      if (!routesByMethod[route.method]) {
        routesByMethod[route.method] = [];
      }
      routesByMethod[route.method].push(route);
    });

    console.log('📍 API ROUTES FOUND:\n');
    Object.keys(routesByMethod).sort().forEach(method => {
      console.log(`${method} Routes (${routesByMethod[method].length}):`);
      routesByMethod[method].forEach(route => {
        console.log(`  ${method} ${route.path} (${route.file})`);
      });
      console.log();
    });

    // Group functions by file
    const functionsByFile = {};
    this.functions.forEach(func => {
      if (!functionsByFile[func.file]) {
        functionsByFile[func.file] = [];
      }
      functionsByFile[func.file].push(func.name);
    });

    console.log('🔧 FUNCTIONS FOUND:\n');
    Object.keys(functionsByFile).sort().forEach(file => {
      console.log(`${file} (${functionsByFile[file].length} functions):`);
      functionsByFile[file].forEach(funcName => {
        console.log(`  - ${funcName}()`);
      });
      console.log();
    });

    // Summary
    console.log('📊 SUMMARY:');
    console.log(`Total Routes: ${this.routes.length}`);
    console.log(`Total Functions: ${this.functions.length}`);
    console.log(`Files Scanned: ${new Set([...this.routes.map(r => r.file), ...this.functions.map(f => f.file)]).size}`);
    
    // Route breakdown
    console.log('\nRoute Breakdown:');
    Object.keys(routesByMethod).forEach(method => {
      console.log(`  ${method}: ${routesByMethod[method].length}`);
    });

    // Generate test endpoints list
    console.log('\n🧪 ENDPOINTS FOR TESTING:\n');
    this.routes.sort((a, b) => a.path.localeCompare(b.path)).forEach(route => {
      console.log(`${route.method.padEnd(6)} http://localhost:5000${route.path}`);
    });
  }

  getRoutesByCategory() {
    const categories = {
      authentication: [],
      users: [],
      inventory: [],
      categories: [],
      specialties: [],
      allocations: [],
      movements: [],
      requests: [],
      reports: [],
      system: []
    };

    this.routes.forEach(route => {
      const path = route.path.toLowerCase();
      
      if (path.includes('/auth')) {
        categories.authentication.push(route);
      } else if (path.includes('/user')) {
        categories.users.push(route);
      } else if (path.includes('/stock') || path.includes('/inventory')) {
        categories.inventory.push(route);
      } else if (path.includes('/categor')) {
        categories.categories.push(route);
      } else if (path.includes('/specialt')) {
        categories.specialties.push(route);
      } else if (path.includes('/allocation')) {
        categories.allocations.push(route);
      } else if (path.includes('/movement')) {
        categories.movements.push(route);
      } else if (path.includes('/request')) {
        categories.requests.push(route);
      } else if (path.includes('/report')) {
        categories.reports.push(route);
      } else {
        categories.system.push(route);
      }
    });

    return categories;
  }

  generateCategorizedReport() {
    const categories = this.getRoutesByCategory();
    
    console.log('\n🗂️  ROUTES BY CATEGORY:\n');
    
    Object.keys(categories).forEach(category => {
      if (categories[category].length > 0) {
        console.log(`${category.toUpperCase()} (${categories[category].length}):`);
        categories[category].forEach(route => {
          console.log(`  ${route.method} ${route.path}`);
        });
        console.log();
      }
    });
  }
}

// Main execution
function main() {
  const scanner = new RoutesScanner();
  
  // Scan server directory
  console.log('Scanning server routes...');
  scanner.scanDirectory('./server');
  
  // Scan client directory for any additional route definitions
  console.log('Scanning client for route definitions...');
  scanner.scanDirectory('./client/src');
  
  // Generate reports
  scanner.generateReport();
  scanner.generateCategorizedReport();
}

// Check if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default RoutesScanner;
