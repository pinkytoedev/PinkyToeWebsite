import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";

import Home from "@/pages/home";
import Articles from "@/pages/articles";
import ArticleDetail from "@/pages/article-detail";
import Team from "@/pages/team";
import TeamMemberDetail from "@/pages/team-detail";
import PrivacyPolicy from "@/pages/privacy-policy";
import NotFound from "@/pages/not-found";

import "@/index.css";
import "./assets/fonts.css";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/articles" component={Articles} />
      <Route path="/articles/:id" component={ArticleDetail} />
      <Route path="/team" component={Team} />
      <Route path="/team/:id" component={TeamMemberDetail} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
