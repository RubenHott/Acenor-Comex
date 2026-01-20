import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ComexLayout } from "@/components/layout/ComexLayout";
import LoginPage from "./pages/LoginPage";
import ModulesPage from "./pages/ModulesPage";
import DashboardPage from "./pages/DashboardPage";
import ProductsPage from "./pages/ProductsPage";
import RequirementsPage from "./pages/RequirementsPage";
import PIMsPage from "./pages/PIMsPage";
import SuppliersPage from "./pages/SuppliersPage";
import ComingSoonPage from "./pages/ComingSoonPage";
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
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<ModulesPage />} />
            
            {/* COMEX Module Routes */}
            <Route path="/comex" element={<ComexLayout />}>
              <Route index element={<Navigate to="/comex/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="requirements" element={<RequirementsPage />} />
              <Route path="pims" element={<PIMsPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="suppliers" element={<SuppliersPage />} />
              <Route path="contracts" element={<ComingSoonPage />} />
              <Route path="payments" element={<ComingSoonPage />} />
              <Route path="prices" element={<ComingSoonPage />} />
              <Route path="users" element={<ComingSoonPage />} />
              <Route path="notifications" element={<ComingSoonPage />} />
              <Route path="settings" element={<ComingSoonPage />} />
            </Route>

            {/* Future modules would go here */}
            {/* <Route path="/work-orders" element={<WorkOrdersLayout />}> ... </Route> */}

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
