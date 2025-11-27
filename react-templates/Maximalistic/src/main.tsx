
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { applyBrandTokens, getBrandTokens } from "./theme/brand-tokens";

applyBrandTokens(getBrandTokens());

createRoot(document.getElementById("root")!).render(<App />);
  