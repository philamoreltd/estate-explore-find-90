import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Tenants from "./pages/Tenants";
import Landlords from "./pages/Landlords";
import Browse from "./pages/Browse";
import PropertyDetails from "./pages/PropertyDetails";
import AddProperty from "./pages/AddProperty";
import EditProperty from "./pages/EditProperty";
import AdminDashboard from "./pages/AdminDashboard";
import PaymentHistory from "./pages/PaymentHistory";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/property/:id" element={<PropertyDetails />} />
            <Route path="/landlords" element={
              <ProtectedRoute>
                <Landlords />
              </ProtectedRoute>
            } />
            <Route path="/add-property" element={
              <ProtectedRoute>
                <AddProperty />
              </ProtectedRoute>
            } />
            <Route path="/edit-property/:id" element={
              <ProtectedRoute>
                <EditProperty />
              </ProtectedRoute>
            } />
            <Route path="/tenants" element={
              <ProtectedRoute>
                <Tenants />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/payments" element={
              <ProtectedRoute>
                <PaymentHistory />
              </ProtectedRoute>
            } />
            <Route path="/auth" element={<Auth />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
