'use client'

import React, { useRef, useEffect, useState } from 'react'
import { motion, useMotionValue, useTransform, type MotionValue, type Transition, type PanInfo } from 'framer-motion'
import Image from 'next/image'

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
  { id: 1, image: 'https://res.cloudinary.com/dom4xev0l/image/upload/v1762839187/84ba0018-a2f3-4916-8f67-8797e5d58479.png' },
  { id: 2, image: 'https://res.cloudinary.com/dom4xev0l/image/upload/v1762839187/84ba0018-a2f3-4916-8f67-8797e5d58479.png' },
  { id: 3, image: 'https://res.cloudinary.com/dom4xev0l/image/upload/v1762839187/84ba0018-a2f3-4916-8f67-8797e5d58479.png' },
  { id: 4, image: 'https://res.cloudinary.com/dom4xev0l/image/upload/v1762839187/84ba0018-a2f3-4916-8f67-8797e5d58479.png' }
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
      <Image src={item.image} alt={`carousel-${item.id}`} className="w-full h-full object-cover" fill />
    </motion.div>
  );
}

export default function Carousel({
  items = DEFAULT_ITEMS,
  autoplay = false,
  autoplayDelay = 3000,
  pauseOnHover = false,
  loop = false
}: CarouselProps) {
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
