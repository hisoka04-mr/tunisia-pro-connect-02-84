import React, { useState, useRef, useEffect } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
}

const LazyImage: React.FC<LazyImageProps> = ({ 
  src, 
  alt, 
  className = '', 
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04NyA3NEw5NSA4Mkw4NyA5MEw3OSA4Mkw4NyA3NFoiIGZpbGw9IiNEMUQ1REIiLz4KPHBhdGggZD0iTTczIDEwNkwxMjcgMTA2TDEyNyAxMTRMNzMgMTE0VjEwNloiIGZpbGw9IiNEMUQ1REIiLz4KPC9zdmc+'
}) => {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setLoaded(true);
  };

  return (
    <img
      ref={imgRef}
      src={inView ? src : placeholder}
      alt={alt}
      className={`lazy-load ${loaded ? 'loaded' : ''} ${className}`}
      onLoad={handleLoad}
      loading="lazy"
    />
  );
};

export default LazyImage;