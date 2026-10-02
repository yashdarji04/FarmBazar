import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <h1 className="text-9xl font-bold text-primary mb-4">404</h1>
      <h2 className="text-3xl font-semibold mb-6">Page Not Found</h2>
      <p className="text-on-surface-variant mb-8 max-w-md">
        Oops! The page you are looking for does not exist. It might have been moved or deleted.
      </p>
      <Link 
        to="/" 
        className="bg-primary text-white px-6 py-3 rounded-full hover:bg-primary/90 transition-colors"
      >
        Go Back Home
      </Link>
    </div>
  );
}
