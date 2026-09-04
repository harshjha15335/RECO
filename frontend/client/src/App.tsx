import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import RecoveryCases from "./pages/RecoveryCases";
import Recoveries from "./pages/Recoveries";
import Customers from "./pages/Customers";
import SystemHealth from "./pages/SystemHealth";
import AuditTrail from "./pages/AuditTrail";
import Rules from "./pages/Rules";
import CaseDetail from "./pages/CaseDetail";
import "./app-shell.css";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Dashboard} />
      <Route path={"/cases"} component={RecoveryCases} />
      <Route path={"/cases/:id"} component={CaseDetail} />
      <Route path={"/recoveries"} component={Recoveries} />
      <Route path={"/customers"} component={Customers} />
      <Route path={"/system"} component={SystemHealth} />
      <Route path={"/audit"} component={AuditTrail} />
      <Route path={"/rules"} component={Rules} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
