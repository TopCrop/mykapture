import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import LeadsPage from "./pages/Leads";
import EventsPage from "./pages/Events";
import AnalyticsPage from "./pages/Analytics";
import SettingsPage from "./pages/Settings";
import DocumentationPage from "./pages/Documentation";
import AuthPage from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/leads" element={<ProtectedRoute><LeadsPage /></ProtectedRoute>} />
            <Route path="/events" element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute allowedRoles={["admin", "manager"]}><AnalyticsPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute allowedRoles={["admin"]}><SettingsPage /></ProtectedRoute>} />
            <Route path="/docs" element={<ProtectedRoute><DocumentationPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
