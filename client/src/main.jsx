import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { auth } from './firebase'

// Global fetch interceptor to attach Firebase ID Token
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  let [resource, config] = args;
  
  if (typeof resource === 'string' && (resource.includes('localhost:8000') || resource.includes('127.0.0.1:8000') || resource.includes('localhost:5000') || resource.startsWith('/api'))) {
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      config = config || {};
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`
      };
      args = [resource, config];
    }
  }
  
  return originalFetch(...args);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
