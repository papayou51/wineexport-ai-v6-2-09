import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AuthenticatedNavigation from "@/components/AuthenticatedNavigation";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { NotificationCenter } from "@/components/ui/notification-center";
import { useNotifications } from "@/hooks/useNotifications";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { Suspense, lazy } from "react";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { OptimizedWrapper } from "@/components/OptimizedWrapper";

// Pages
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import ProductNew from "./pages/ProductNew";
import ProductDetail from "./pages/ProductDetail";
import Project from "./pages/Project";
import ProjectNew from "./pages/ProjectNew";
import ProjectAnalysis from "./pages/ProjectAnalysis";
import Leads from "./pages/Leads";
import AnalysisReport from "./pages/AnalysisReport";
import GeographicAnalysis from "./pages/GeographicAnalysis";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import NotFound from "./pages/NotFound";

// Lazy load pages for better performance
const Products = lazy(() => import("./pages/Products"));
const Projects = lazy(() => import("./pages/Projects"));
const Analyses = lazy(() => import("./pages/Analyses"));
const Reports = lazy(() => import("./pages/Reports"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Testing = lazy(() => import("./pages/Testing"));
const Settings = lazy(() => import("./pages/Settings"));
const Monitoring = lazy(() => import("./pages/Monitoring"));

const queryClient = new QueryClient();

// App layout wrapper with conditional navigation
const AppLayout = () => {
  const { user, loading } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  
  // Initialize realtime notifications
  useRealtimeNotifications();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <OptimizedWrapper>
        {user && (
          <>
            <AuthenticatedNavigation />
            <div className="fixed top-4 right-4 z-50">
              <NotificationCenter
                notifications={notifications}
                unreadCount={unreadCount}
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
                onClearAll={clearAll}
              />
            </div>
          </>
        )}
        <Suspense fallback={<LoadingSkeleton variant="card" count={3} />}>
          <Routes>
          {/* Public routes */}
          <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Index />} />
          <Route path="/auth/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
          <Route path="/auth/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />
          <Route path="/auth/forgot-password" element={user ? <Navigate to="/dashboard" replace /> : <ForgotPassword />} />
          <Route path="/auth/reset-password" element={user ? <Navigate to="/dashboard" replace /> : <ResetPassword />} />
          
          {/* Protected routes with lazy loading */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/products" element={
            <ProtectedRoute>
              <Products />
            </ProtectedRoute>
          } />
          <Route path="/products/new" element={
            <ProtectedRoute>
              <ProductNew />
            </ProtectedRoute>
          } />
          <Route path="/products/:id" element={
            <ProtectedRoute>
              <ProductDetail />
            </ProtectedRoute>
          } />
          <Route path="/projects" element={
            <ProtectedRoute>
              <Projects />
            </ProtectedRoute>
          } />
          <Route path="/projects/new" element={
            <ProtectedRoute>
              <ProjectNew />
            </ProtectedRoute>
          } />
          <Route path="/projects/:id" element={
            <ProtectedRoute>
              <Project />
            </ProtectedRoute>
          } />
          <Route path="/projects/:id/analysis" element={
            <ProtectedRoute>
              <ProjectAnalysis />
            </ProtectedRoute>
          } />
          <Route path="/analyses" element={
            <ProtectedRoute>
              <Analyses />
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          } />
          <Route path="/projects/:id/leads" element={
            <ProtectedRoute>
              <Leads />
            </ProtectedRoute>
          } />
          <Route path="/analysis/:id" element={
            <ProtectedRoute>
              <AnalysisReport />
            </ProtectedRoute>
          } />
          <Route path="/projects/:id/geographic" element={
            <ProtectedRoute>
              <GeographicAnalysis />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/testing" element={
            <ProtectedRoute>
              <Testing />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="/monitoring" element={
            <ProtectedRoute>
              <Monitoring />
            </ProtectedRoute>
          } />
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </OptimizedWrapper>
    </ErrorBoundary>
  );
};

const App = () => (
  <ErrorBoundary>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppLayout />
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
