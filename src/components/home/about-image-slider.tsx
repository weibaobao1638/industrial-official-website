'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import type { Locale } from '@/lib/constants/site';

type AboutImageSliderProps = {
  images: string[];
  locale: Locale;
};

export function AboutImageSlider({ images, locale }: AboutImageSliderProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  if (!images.length) {
    return null;
  }

  const label = locale === 'zh' ? '公司图片' : 'Company image';

  function scrollToIndex(index: number) {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const slides = viewport.querySelectorAll<HTMLElement>('[data-about-slide]');
    const target = slides[index];
    if (!target) return;

    viewport.scrollTo({ left: target.offsetLeft, behavior: 'smooth' });
    setActiveIndex(index);
  }

  function handleScroll() {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const slides = [...viewport.querySelectorAll<HTMLElement>('[data-about-slide]')];
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
    <div className="about-media">
      <div className="about-media__slider">
        <div className="about-media__viewport" onScroll={handleScroll} ref={viewportRef}>
          {images.map((src, index) => (
            <div className="about-media__slide" data-about-slide key={index}>
              <Image
                src={src}
                alt={`${label} ${index + 1}`}
                fill
                sizes="(max-width: 960px) 100vw, 50vw"
              />
            </div>
          ))}
        </div>

        {images.length > 1 ? (
          <div className="about-media__dots">
            {images.map((src, index) => (
              <button
                aria-label={`${label} ${index + 1}`}
                className={`about-media__dot${index === activeIndex ? ' about-media__dot--active' : ''}`}
                key={src}
                onClick={() => scrollToIndex(index)}
                type="button"
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
