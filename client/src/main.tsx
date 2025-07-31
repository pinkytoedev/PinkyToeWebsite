import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initConsoleCommands } from "./lib/consoleCommands";

// FontAwesome is loaded via HTML link tag in index.html

// Initialize the console commands
initConsoleCommands();

createRoot(document.getElementById("root")!).render(<App />);
