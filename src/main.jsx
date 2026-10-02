import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { PrimeReactProvider } from 'primereact/api';
import { HelmetProvider } from 'react-helmet-async';
import 'primereact/resources/themes/saga-green/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import App from './App.jsx';
import './index.css';
import { store } from './store';
import { Provider } from 'react-redux';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <Provider store={store}>
        <PrimeReactProvider value={{ ripple: true }}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </PrimeReactProvider>
      </Provider>
    </HelmetProvider>
  </React.StrictMode>,
);
