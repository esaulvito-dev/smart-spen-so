import "./index.css";

const globalScope = globalThis as Record<string, unknown>;
if (!("__LOVA_FIX_TRIGGER__" in globalScope)) {
  globalScope.__LOVA_FIX_TRIGGER__ = false;
}

if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    const message = event.reason instanceof Error ? event.reason.message : String(event.reason ?? "");

    if (message.includes("__LOVA_FIX_TRIGGER__")) {
      event.preventDefault();
    }
  });
}

const mountApp = async () => {
  const [{ createRoot }, { default: App }] = await Promise.all([
    import("react-dom/client"),
    import("./App.tsx"),
  ]);

  const rootElement = document.getElementById("root");
  if (!rootElement) return;

  createRoot(rootElement).render(<App />);
};

void mountApp();
