import ReactDom from "react-dom/client";
import { Provider } from 'react-redux'
import "./index.css"; // Tailwind entry
import React from "react";
import App from "./App";
import store from "./app/store";

ReactDom.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
