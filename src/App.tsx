import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { OrgProvider } from "@/hooks/useOrg";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import LandingPage from "./pages/Landing";
import Index from "./pages/Index";
import LeadsPage from "./pages/Leads";
import EventsPage from "./pages/Events";
import AnalyticsPage from "./pages/Analytics";
import SettingsPage from "./pages/Settings";
import DocumentationPage from "./pages/Documentation";
import AuthPage from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import BrandGuidelines from "./pages/BrandGuidelines";
import OrgSetupPage from "./pages/OrgSetup";
import SuperAdminPage from "./pages/SuperAdmin";
import { useEffect } from "react";
import { initOfflineSync } from "@/lib/offlineQueue";
import { toast } from "sonner";

const queryClient = new QueryClient();

function OfflineSyncInit() {
  useEffect(() => {
    return initOfflineSync((result) => {
      if (result.synced > 0) {
        toast.success(`${result.synced} offline lead(s) synced!`);
        queryClient.invalidateQueries({ queryKey: ["leads"] });
      }
      if (result.failed > 0) {
        toast.error(`${result.failed} lead(s) failed to sync.`);
      }
    });
  }, []);
  return null;
}

const App = () => (
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <OrgProvider>
          <BrowserRouter>
            <OfflineSyncInit />
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/org-setup" element={<ProtectedRoute><OrgSetupPage /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/leads" element={<ProtectedRoute><LeadsPage /></ProtectedRoute>} />
              <Route path="/events" element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute allowedRoles={["admin", "manager", "super_admin"]}><AnalyticsPage /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
              <Route path="/docs" element={<ProtectedRoute allowedRoles={["admin", "super_admin"]}><DocumentationPage /></ProtectedRoute>} />
              <Route path="/super-admin" element={<ProtectedRoute allowedRoles={["super_admin"]}><SuperAdminPage /></ProtectedRoute>} />
              <Route path="/brand" element={<BrandGuidelines />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </OrgProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
