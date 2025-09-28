'use client';
import { useEffect, useState, useRef } from 'react';
import { motion, PanInfo, useMotionValue, useTransform, type MotionValue, type Transition } from 'motion/react';
import React, { JSX } from 'react';

export interface CarouselItem {
  id: number;
  image: string;
}

export interface CarouselProps {
  items?: CarouselItem[];
  autoplay?: boolean;
  autoplayDelay?: number;
  pauseOnHover?: boolean;
  loop?: boolean;
  round?: boolean;
}

const DEFAULT_ITEMS: CarouselItem[] = [
  { id: 1, image: 'https://picsum.photos/1200/600?random=1' },
  { id: 2, image: 'https://picsum.photos/1200/600?random=2' },
  { id: 3, image: 'https://picsum.photos/1200/600?random=3' },
  { id: 4, image: 'https://picsum.photos/1200/600?random=4' }
];

const GAP = 16;
const DRAG_BUFFER = 0;
const VELOCITY_THRESHOLD = 500;
const SPRING_OPTIONS: Transition = { type: 'spring', stiffness: 300, damping: 30 };
const NO_TRANSITION: Transition = { duration: 0 };

function CarouselCard({
  item,
  x,
  itemWidth,
  effectiveTransition
}: {
  item: CarouselItem;
  x: MotionValue<number>;
  itemWidth: number;
  effectiveTransition: Transition;
}) {
  const rotateY = useTransform(x, [-itemWidth, 0, itemWidth], [45, 0, -45]);
  return (
    <motion.div
      key={item.id}
      className="relative shrink-0 overflow-hidden rounded-[12px] cursor-grab active:cursor-grabbing"
      style={{ width: itemWidth, height: itemWidth * 0.25, rotateY }}
      transition={effectiveTransition}
    >
      <img src={item.image} alt={`carousel-${item.id}`} className="w-full h-full object-cover" />
    </motion.div>
  );
}

export default function Carousel({
  items = DEFAULT_ITEMS,
  autoplay = false,
  autoplayDelay = 3000,
  pauseOnHover = false,
  loop = false
}: CarouselProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const x: MotionValue<number> = useMotionValue(0);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Update container width dynamically
  useEffect(() => {
    const updateWidth = () => setContainerWidth(containerRef.current?.offsetWidth || 0);
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const itemWidth = containerWidth;
  const trackItemOffset = itemWidth + GAP;
  const carouselItems = loop ? [...items, items[0]] : items;
  const effectiveTransition = isResetting ? NO_TRANSITION : SPRING_OPTIONS;

  // Hover pause
  useEffect(() => {
    if (!pauseOnHover || !containerRef.current) return;
    const container = containerRef.current;
    const enter = () => setIsHovered(true);
    const leave = () => setIsHovered(false);
    container.addEventListener('mouseenter', enter);
    container.addEventListener('mouseleave', leave);
    return () => {
      container.removeEventListener('mouseenter', enter);
      container.removeEventListener('mouseleave', leave);
    };
  }, [pauseOnHover]);

  // Autoplay
  useEffect(() => {
    if (!autoplay || (pauseOnHover && isHovered)) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % carouselItems.length);
    }, autoplayDelay);
    return () => clearInterval(timer);
  }, [autoplay, autoplayDelay, isHovered, carouselItems.length, pauseOnHover]);

  const handleAnimationComplete = () => {
    if (loop && currentIndex === carouselItems.length - 1) {
      setIsResetting(true);
      x.set(0);
      setCurrentIndex(0);
      setTimeout(() => setIsResetting(false), 50);
    }
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    if (offset < -DRAG_BUFFER || velocity < -VELOCITY_THRESHOLD) {
      setCurrentIndex(prev => Math.min(prev + 1, carouselItems.length - 1));
    } else if (offset > DRAG_BUFFER || velocity > VELOCITY_THRESHOLD) {
      setCurrentIndex(prev => Math.max(prev - 1, 0));
    }
  };

  const dragProps = loop ? {} : { dragConstraints: { left: -trackItemOffset * (carouselItems.length - 1), right: 0 } };

  return (
    <div ref={containerRef} className="relative overflow-hidden w-full">
      <motion.div
        className="flex"
        drag="x"
        {...dragProps}
        style={{ gap: `${GAP}px`, x }}
        onDragEnd={handleDragEnd}
        animate={{ x: -(currentIndex * trackItemOffset) }}
        transition={effectiveTransition}
        onAnimationComplete={handleAnimationComplete}
      >
        {carouselItems.map((item,index) => (
          <CarouselCard
            key={`${item.id}-${index}`}
            item={item}
            x={x}
            itemWidth={itemWidth}
            effectiveTransition={effectiveTransition}
          />
        ))}
      </motion.div>
    </div>
  );
}
