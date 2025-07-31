import { createRoot } from "react-dom/client";
import { Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import App from "./App";
import "./index.css";
import { initConsoleCommands } from "./lib/consoleCommands";

// Override the API module for GitHub Pages
import * as ghPagesApi from "./lib/api.gh-pages";
import * as api from "./lib/api";
Object.assign(api, ghPagesApi);

// Include FontAwesome for icons
const fontAwesomeLink = document.createElement('link');
fontAwesomeLink.rel = 'stylesheet';
fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
document.head.appendChild(fontAwesomeLink);

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