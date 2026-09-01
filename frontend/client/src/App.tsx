import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Analytics from "./pages/Analytics";
import Transfers from "./pages/Transfers";
import Payments from "./pages/Payments";
import Cards from "./pages/Cards";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import "./app-shell.css";

/**
 * Precision Ledger design system: the dashboard is an ink-black financial
 * workspace with high-contrast chartreuse signals and deliberate hierarchy.
 */

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/analytics"} component={Analytics} />
      <Route path={"/transfers"} component={Transfers} />
      <Route path={"/payments"} component={Payments} />
      <Route path={"/cards"} component={Cards} />
      <Route path={"/notifications"} component={Notifications} />
      <Route path={"/profile"} component={Profile} />
      <Route path={"/settings"} component={Settings} />
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
