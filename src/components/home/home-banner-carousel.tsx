'use client';

import Image from 'next/image';
import { useMemo, useRef, useState } from 'react';
import type { Locale } from '@/lib/constants/site';
import type { HomeBannerItem } from '@/features/home-banners/api';

type HomeBannerCarouselProps = {
  items: HomeBannerItem[];
  locale: Locale;
};

export function HomeBannerCarousel({ items, locale }: HomeBannerCarouselProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const labels = useMemo(
    () =>
      locale === 'zh'
        ? { prev: '上一张', next: '下一张', slide: '轮播图', banner: '首页 Banner' }
        : { prev: 'Previous', next: 'Next', slide: 'Slide', banner: 'Homepage Banner' },
    [locale],
  );

  if (!items.length) {
    return null;
  }

  function scrollToIndex(index: number) {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const slides = viewport.querySelectorAll<HTMLElement>('[data-banner-slide]');
    const target = slides[index];
    if (!target) return;

    viewport.scrollTo({
      left: target.offsetLeft,
      behavior: 'smooth',
    });
    setActiveIndex(index);
  }

  function handleScroll() {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const slides = [...viewport.querySelectorAll<HTMLElement>('[data-banner-slide]')];
    if (!slides.length) return;

    const current = slides.reduce(
      (best, slide, index) => {
        const distance = Math.abs(slide.offsetLeft - viewport.scrollLeft);
        return distance < best.distance ? { index, distance } : best;
      },
      { index: 0, distance: Number.POSITIVE_INFINITY },
    );

    if (current.index !== activeIndex) {
      setActiveIndex(current.index);
    }
  }

  return (
    <section className="home-banner-section">
      <div className="home-banner-carousel">
        <div className="home-banner-carousel__viewport" onScroll={handleScroll} ref={viewportRef}>
          {items.map((item, index) => (
            <article className="home-banner-carousel__slide" data-banner-slide key={item.id}>
              <Image src={item.imageUrl} alt={`${labels.banner} ${index + 1}`} fill sizes="100vw" priority={index === 0} />
            </article>
          ))}
        </div>

        {items.length > 1 ? (
          <>
            <button
              aria-label={labels.prev}
              className="home-banner-carousel__nav home-banner-carousel__nav--prev"
              onClick={() => scrollToIndex((activeIndex - 1 + items.length) % items.length)}
              type="button"
            >
              ‹
            </button>
            <button
              aria-label={labels.next}
              className="home-banner-carousel__nav home-banner-carousel__nav--next"
              onClick={() => scrollToIndex((activeIndex + 1) % items.length)}
              type="button"
            >
              ›
            </button>
            <div className="home-banner-carousel__dots">
              {items.map((item, index) => (
                <button
                  aria-label={`${labels.slide} ${index + 1}`}
                  className={`home-banner-carousel__dot${index === activeIndex ? ' home-banner-carousel__dot--active' : ''}`}
                  key={item.id}
                  onClick={() => scrollToIndex(index)}
                  type="button"
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
