import { useRef, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CATEGORIES } from '~/lib/types';

export function CategoryNav() {
  const location = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const isHome = location.pathname === '/' || location.pathname === '';

  // Get current category from path
  const currentCategory = CATEGORIES.find(
    (cat) => location.pathname === cat.path || location.pathname.startsWith(cat.path + '/')
  );

  const updateScrollArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeftArrow(el.scrollLeft > 0);
    setShowRightArrow(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  };

  useEffect(() => {
    updateScrollArrows();
    window.addEventListener('resize', updateScrollArrows);
    return () => window.removeEventListener('resize', updateScrollArrows);
  }, []);

  useEffect(() => {
    if (currentCategory && scrollRef.current) {
      const activeTab = scrollRef.current.querySelector(`[data-category="${currentCategory.id}"]`);
      if (activeTab) {
        activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentCategory]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = 200;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const navClasses = [
    'category-nav',
    isHome ? 'category-nav--hidden' : 'category-nav--visible',
  ].join(' ');

  return (
    <nav className={navClasses}>
      {/* Left scroll arrow */}
      <button
        onClick={() => scroll('left')}
        className="category-nav-arrow category-nav-arrow--left"
        style={{
          opacity: showLeftArrow ? 1 : 0,
          pointerEvents: showLeftArrow ? 'auto' : 'none',
        }}
        aria-label="Scroll left"
      >
        <ChevronLeft size={16} />
      </button>

      {/* Scrollable tabs container */}
      <div ref={scrollRef} onScroll={updateScrollArrows} className="category-nav-scroll">
        <div className="category-nav-tabs">
          {CATEGORIES.map((category, index) => {
            const isActive = currentCategory?.id === category.id;
            return (
              <Link
                key={category.id}
                to={category.path}
                prefetch="render"
                viewTransition
                data-category={category.id}
                className={`category-tab ${isActive ? 'category-tab--active' : ''}`}
                style={
                  {
                    '--tab-index': index,
                    '--tab-hue': category.color.hue,
                  } as React.CSSProperties
                }
              >
                {category.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Right scroll arrow */}
      <button
        onClick={() => scroll('right')}
        className="category-nav-arrow category-nav-arrow--right"
        style={{
          opacity: showRightArrow ? 1 : 0,
          pointerEvents: showRightArrow ? 'auto' : 'none',
        }}
        aria-label="Scroll right"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}
