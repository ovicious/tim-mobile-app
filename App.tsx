import React, { useEffect } from 'react';
import AppNavigation from './app/navigation';
import { logger } from './app/utils/logger';

export default function App() {
  useEffect(() => {
    logger.info('App', 'Application initialized');
    
    // Log uncaught errors
    const errorHandler = (error: Error) => {
      logger.error('App', 'Uncaught error', error);
    };

    const unsubscribe = () => {
      // Cleanup if needed
    };

    return unsubscribe;
  }, []);

  return <AppNavigation />;
}
