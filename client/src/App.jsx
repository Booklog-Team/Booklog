// Booklog App — 「따뜻한 라이브러리」
// Route configuration for all pages
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
// Pages
import Home from "./pages/Home";
import Onboarding from "./pages/Onboarding";
import Auth from "./pages/Auth";
import Search from "./pages/Search";
import BookDetail from "./pages/BookDetail";
import Library from "./pages/Library";
import Community from "./pages/Community";
import Profile from "./pages/Profile";
import Points from "./pages/Points";
import NotFound from "./pages/NotFound";
function Router() {
    return (<Switch>
      <Route path="/" component={Home}/>
      <Route path="/onboarding" component={Onboarding}/>
      <Route path="/auth" component={Auth}/>
      <Route path="/search" component={Search}/>
      <Route path="/book/:id" component={BookDetail}/>
      <Route path="/library" component={Library}/>
      <Route path="/community" component={Community}/>
      <Route path="/profile" component={Profile}/>
      <Route path="/points" component={Points}/>
      <Route path="/404" component={NotFound}/>
      <Route component={NotFound}/>
    </Switch>);
}
function App() {
    return (<ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster position="top-center" richColors/>
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>);
}
export default App;
