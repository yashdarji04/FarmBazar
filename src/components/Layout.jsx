import { Outlet, useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { cloneElement } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { ConfirmProvider } from '../context/ConfirmContext';

export default function Layout() {
  const location = useLocation();
  const outlet = useOutlet();

  return (
    <ConfirmProvider>
      <Navbar />
      <div className="flex-grow flex flex-col">
        <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo(0, 0)}>
          {outlet && cloneElement(outlet, { key: location.pathname })}
        </AnimatePresence>
      </div>
      <Footer />
    </ConfirmProvider>
  );
}
