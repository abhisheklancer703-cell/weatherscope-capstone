import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/Sidebar";
import NotFound from "@/pages/not-found";

// Pages
import Home from "@/pages/Home";
import Upload from "@/pages/Upload";
import DataCleaning from "@/pages/DataCleaning";
import Analysis from "@/pages/Analysis";
import Visualization from "@/pages/Visualization";
import Prediction from "@/pages/Prediction";
import Results from "@/pages/Results";
import About from "@/pages/About";

// Admin Pages
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminLogs from "@/pages/admin/AdminLogs";
import AdminSettings from "@/pages/admin/AdminSettings";

const BASE = "/weatherscope-capstone";

function MainRouter() {
  return (
    <Switch>
      <Route path={BASE + "/"} component={Home} />
      <Route path={BASE + "/upload"} component={Upload} />
      <Route path={BASE + "/cleaning"} component={DataCleaning} />
      <Route path={BASE + "/analysis"} component={Analysis} />
      <Route path={BASE + "/visualization"} component={Visualization} />
      <Route path={BASE + "/prediction"} component={Prediction} />
      <Route path={BASE + "/results"} component={Results} />
      <Route path={BASE + "/about"} component={About} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AdminLayout() {
  return (
    <Switch>
      <Route path={BASE + "/admin"} component={AdminLogin} />
      <Route path={BASE + "/admin/dashboard"} component={AdminDashboard} />
      <Route path={BASE + "/admin/users"} component={AdminUsers} />
      <Route path={BASE + "/admin/logs"} component={AdminLogs} />
      <Route path={BASE + "/admin/settings"} component={AdminSettings} />
      <Route component={AdminLogin} />
    </Switch>
  );
}

function MainLayout() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Sidebar />
      <main className="lg:pl-64 min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <MainRouter />
        </div>
      </main>
    </div>
  );
}

function App() {
  const [location] = useLocation();
  const isAdminRoute = location.startsWith(BASE + "/admin");

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {isAdminRoute ? <AdminLayout /> : <MainLayout />}
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
