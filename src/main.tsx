import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { validateEnv } from "./lib/config";

// Validate environment variables on startup
validateEnv();

createRoot(document.getElementById("root")!).render(<App />);
