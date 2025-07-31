import { createRoot } from "react-dom/client";
import { Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import App from "./App";
import "./index.css";
import { initConsoleCommands } from "./lib/consoleCommands";

// FontAwesome is loaded via HTML link tag in index.gh-pages.html

// Initialize the console commands
initConsoleCommands();

// App wrapper with hash routing for GitHub Pages
function AppWithHashRouter() {
    return (
        <Router hook={useHashLocation}>
            <App />
        </Router>
    );
}

createRoot(document.getElementById("root")!).render(<AppWithHashRouter />);