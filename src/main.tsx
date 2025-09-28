import ReactDom from "react-dom/client";

import "./index.css"; // Tailwind entry
import React from "react";
import App from "./App";

ReactDom.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
