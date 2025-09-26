import React from 'react';

const SkipLinks: React.FC = () => {
  return (
    <div className="sr-only focus-within:not-sr-only focus-within:absolute focus-within:top-0 focus-within:left-0 focus-within:z-50">
      <nav aria-label="Skip navigation links">
        <ul className="flex space-x-4 p-4 bg-blue-600 text-white">
          <li>
            <a
              href="#main-content"
              className="focus:outline-none focus:ring-2 focus:ring-white rounded px-2 py-1"
            >
              Skip to main content
            </a>
          </li>
          <li>
            <a
              href="#search"
              className="focus:outline-none focus:ring-2 focus:ring-white rounded px-2 py-1"
            >
              Skip to search
            </a>
          </li>
          <li>
            <a
              href="#navigation"
              className="focus:outline-none focus:ring-2 focus:ring-white rounded px-2 py-1"
            >
              Skip to navigation
            </a>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default SkipLinks;