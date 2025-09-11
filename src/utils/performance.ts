// Performance monitoring utilities for Core Web Vitals
export const reportWebVitals = (onPerfEntry?: (metric: any) => void) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    // Optional web-vitals integration - will work if package is installed
    try {
      import('web-vitals').then((webVitals: any) => {
        const { getCLS, getFID, getFCP, getLCP, getTTFB } = webVitals;
        if (getCLS) getCLS(onPerfEntry);
        if (getFID) getFID(onPerfEntry);
        if (getFCP) getFCP(onPerfEntry);
        if (getLCP) getLCP(onPerfEntry);
        if (getTTFB) getTTFB(onPerfEntry);
      }).catch(() => {
        console.log('Web Vitals not available');
      });
    } catch (error) {
      console.log('Web Vitals import failed:', error);
    }
  }
};

// Resource loading optimization
export const preloadCriticalResources = () => {
  // Preload critical fonts
  const fontLink = document.createElement('link');
  fontLink.rel = 'preload';
  fontLink.as = 'font';
  fontLink.type = 'font/woff2';
  fontLink.crossOrigin = 'anonymous';
  document.head.appendChild(fontLink);
};

// Error boundary for performance monitoring
export class PerformanceErrorBoundary extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PerformanceError';
  }
}

// Performance metrics tracking
export const trackPageLoad = (pageName: string) => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const navigationStart = performance.timing.navigationStart;
    const loadComplete = performance.timing.loadEventEnd;
    const loadTime = loadComplete - navigationStart;
    
    console.log(`${pageName} load time: ${loadTime}ms`);
    
    // You can send this to your analytics service
    return loadTime;
  }
  return null;
};

// Lazy loading intersection observer
export const createLazyLoadObserver = (callback: IntersectionObserverCallback) => {
  if ('IntersectionObserver' in window) {
    return new IntersectionObserver(callback, {
      root: null,
      rootMargin: '50px',
      threshold: 0.1
    });
  }
  return null;
};