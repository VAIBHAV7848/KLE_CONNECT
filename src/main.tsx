import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AuthProvider } from './hooks/useAuth';
import { SystemConfigProvider } from './contexts/SystemConfigContext';
import "./index.css";
import { validateEnv } from "./lib/config";

// Validate environment variables on startup
validateEnv();

createRoot(document.getElementById("root")!).render(
    <AuthProvider>
        <SystemConfigProvider>
            <App />
        </SystemConfigProvider>
    </AuthProvider>
);
