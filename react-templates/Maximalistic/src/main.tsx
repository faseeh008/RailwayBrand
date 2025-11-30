import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { applyBrandTokens, getBrandTokens } from "./theme/brand-tokens";

try {
  applyBrandTokens(getBrandTokens());
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }
  createRoot(rootElement).render(<App />);
} catch (error) {
  console.error("Failed to render React app:", error);
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 2rem; text-align: center; font-family: sans-serif;">
        <h1 style="color: #ef4444; margin-bottom: 1rem;">Error Loading Page</h1>
        <p style="color: #666;">${error instanceof Error ? error.message : "Unknown error occurred"}</p>
        <p style="color: #999; margin-top: 1rem; font-size: 0.875rem;">Please check the console for more details.</p>
      </div>
    `;
  }
}
