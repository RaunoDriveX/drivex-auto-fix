import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Index from "./pages/Index";
import Inspection from "./pages/Inspection";
import InspectionResults from "./pages/InspectionResults";
import AIReport from "./pages/AIReport";
import ClaimSubmission from "./pages/ClaimSubmission";
import JobTracking from "./pages/JobTracking";
import ShopAuth from "./pages/ShopAuth";
import ShopDashboard from "./pages/ShopDashboard";
import InsurerAuth from "./pages/InsurerAuth";
import InsurerDashboard from "./pages/InsurerDashboard";
import NotFound from "./pages/NotFound";
import ErrorBoundary from "./components/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => {
  console.log("App component rendering...");
  return (
    <ErrorBoundary>
      <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/inspection/:token" element={<Inspection />} />
            <Route path="/results/:token" element={<InspectionResults />} />
            <Route path="/report/:token" element={<AIReport />} />
            <Route path="/claim/:appointmentId" element={<ClaimSubmission />} />
            <Route path="/track/:appointmentId" element={<JobTracking />} />
            <Route path="/shop-auth" element={<ShopAuth />} />
            <Route path="/shop-dashboard" element={<ShopDashboard />} />
            <Route path="/insurer-auth" element={<InsurerAuth />} />
            <Route path="/insurer-dashboard" element={<InsurerDashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
</ErrorBoundary>
  );
};

export default App;
