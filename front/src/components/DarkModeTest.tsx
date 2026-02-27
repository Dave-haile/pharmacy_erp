import React from 'react';
import { useTheme } from '../components/context/ThemeContext';

const DarkModeTest: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="p-6 bg-primary min-h-screen">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-primary mb-6">Dark Mode Test</h1>
        
        {/* Theme Switcher */}
        <div className="bg-secondary p-4 rounded-lg border border-custom">
          <h2 className="text-xl font-semibold text-primary mb-4">Current Theme: {theme}</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setTheme('light')}
              className={`px-4 py-2 rounded-md transition-all ${
                theme === 'light' 
                  ? 'bg-primary text-secondary border-2 border-accent' 
                  : 'bg-tertiary text-secondary hover:bg-primary'
              }`}
            >
              Light
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`px-4 py-2 rounded-md transition-all ${
                theme === 'dark' 
                  ? 'bg-primary text-secondary border-2 border-accent' 
                  : 'bg-tertiary text-secondary hover:bg-primary'
              }`}
            >
              Dark
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`px-4 py-2 rounded-md transition-all ${
                theme === 'system' 
                  ? 'bg-primary text-secondary border-2 border-accent' 
                  : 'bg-tertiary text-secondary hover:bg-primary'
              }`}
            >
              System
            </button>
          </div>
        </div>

        {/* Test Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-secondary p-6 rounded-lg border border-custom">
            <h3 className="text-lg font-semibold text-primary mb-2">Card 1</h3>
            <p className="text-secondary mb-2">This is a test card with dark mode support.</p>
            <p className="text-tertiary text-sm">Tertiary text color example.</p>
          </div>
          
          <div className="bg-secondary p-6 rounded-lg border border-custom">
            <h3 className="text-lg font-semibold text-primary mb-2">Card 2</h3>
            <p className="text-secondary mb-2">Another card to test consistency.</p>
            <button className="mt-4 px-4 py-2 bg-accent text-accent-text rounded-md hover:opacity-90 transition-opacity">
              Action Button
            </button>
          </div>
        </div>

        {/* Color Palette Display */}
        <div className="bg-secondary p-6 rounded-lg border border-custom">
          <h3 className="text-lg font-semibold text-primary mb-4">Color Palette</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-full h-16 bg-primary rounded border border-custom mb-2"></div>
              <p className="text-xs text-secondary">Primary</p>
            </div>
            <div className="text-center">
              <div className="w-full h-16 bg-secondary rounded border border-custom mb-2"></div>
              <p className="text-xs text-secondary">Secondary</p>
            </div>
            <div className="text-center">
              <div className="w-full h-16 bg-tertiary rounded border border-custom mb-2"></div>
              <p className="text-xs text-secondary">Tertiary</p>
            </div>
            <div className="text-center">
              <div className="w-full h-16 bg-accent rounded border border-custom mb-2"></div>
              <p className="text-xs text-accent-text">Accent</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DarkModeTest;
