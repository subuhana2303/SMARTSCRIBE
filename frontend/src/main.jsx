const { createRoot } = ReactDOM;

const container = document.getElementById('root');
const root = createRoot(container);

// Wait for all components to load before rendering
setTimeout(() => {
  if (window.App) {
    root.render(<window.App />);
  } else {
    console.error('App component not loaded');
  }
}, 100);
