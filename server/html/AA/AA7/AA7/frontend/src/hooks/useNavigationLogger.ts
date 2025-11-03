import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import logger from '../utils/logger';

// Hook to track navigation changes
export const useNavigationLogger = () => {
  const location = useLocation();

  useEffect(() => {
    const currentPath = location.pathname + location.search + location.hash;
    
    // Log the navigation
    logger.navigation(
      'previous_route', // We don't have the previous route easily available here
      currentPath
    );

    // Log additional route information
    logger.info('NAVIGATION', `Route changed to: ${currentPath}`, {
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
      state: location.state,
    });

  }, [location]);

  return location;
};

// Enhanced navigation logger that tracks page visits and time spent
export const usePageLogger = (pageName: string) => {
  const location = useLocation();

  useEffect(() => {
    const startTime = Date.now();
    
    logger.info('PAGE', `Entered page: ${pageName}`, {
      pageName,
      path: location.pathname,
      timestamp: new Date().toISOString(),
    });

    // Track page view
    logger.userAction('PAGE_VIEW', pageName, {
      path: location.pathname,
      search: location.search,
      referrer: document.referrer,
    });

    return () => {
      const timeSpent = Date.now() - startTime;
      logger.info('PAGE', `Left page: ${pageName}`, {
        pageName,
        path: location.pathname,
        timeSpent,
        timestamp: new Date().toISOString(),
      });
    };
  }, [pageName, location.pathname, location.search]);
};

export default useNavigationLogger;