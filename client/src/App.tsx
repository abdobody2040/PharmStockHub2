import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "next-themes";
import { ErrorBoundary } from "@/components/error-boundary";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import InventoryPage from "@/pages/inventory-page";
import StockMovementPage from "@/pages/stock-movement-page";
import ReportsPage from "@/pages/reports-page";
import AnalyticsDashboard from "@/pages/analytics-dashboard";
import RequestManagementPage from "./pages/request-management-page";
import UserManagementPage from "@/pages/user-management-page";
import InventoryAllocationPage from "@/pages/inventory-allocation-page";
import SettingsPage from "@/pages/settings-page";
import MobileApp from "@/pages/mobile-app";
import { ProtectedRoute } from "@/lib/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/inventory" component={InventoryPage} />
      <ProtectedRoute path="/stock-movement" component={StockMovementPage} />
      <ProtectedRoute path="/reports" component={ReportsPage} />
      <ProtectedRoute path="/analytics" component={AnalyticsDashboard} />
      <ProtectedRoute path="/users" component={UserManagementPage} />
      <ProtectedRoute path="/allocation" component={InventoryAllocationPage} roles={['ceo', 'admin', 'stockKeeper']} />
      <ProtectedRoute path="/settings" component={SettingsPage} roles={['ceo', 'admin']} />
      <ProtectedRoute path="/mobile" component={MobileApp} />
      <ProtectedRoute path="/mobile/:rest*" component={MobileApp} />
      <ProtectedRoute path="/requests" component={RequestManagementPage} roles={['productManager', 'stockKeeper', 'ceo', 'admin']} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;