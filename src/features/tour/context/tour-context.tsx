'use client';

import * as React from 'react';

export type TourStepConfig = {
  id: string;
  target?: string;
  title: string;
  description: string;
};

type TourContextValue = {
  steps: TourStepConfig[];
  currentIndex: number;
  isActive: boolean;
  start: () => void;
  next: () => void;
  skip: () => void;
};

const TourContext = React.createContext<TourContextValue | null>(null);

const DEFAULT_STEPS: TourStepConfig[] = [
  {
    id: 'welcome',
    target: '[data-tour="trigger"]',
    title: 'Welcome to Sparqly',
    description:
      'This quick tour will show you around. Click Next to continue or Skip to close.'
  },
  {
    id: 'sidebar',
    target: '[data-tour="sidebar"]',
    title: 'Navigation',
    description:
      'Use the sidebar to switch between Repurpose, Create, Content, Analytics, and more.'
  },
  {
    id: 'done',
    title: "You're all set",
    description:
      'Start by repurposing content or creating something new. Need help? Click the tour button anytime.'
  }
];

export function TourProvider({
  children,
  steps = DEFAULT_STEPS
}: {
  children: React.ReactNode;
  steps?: TourStepConfig[];
}) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isActive, setIsActive] = React.useState(false);

  const start = React.useCallback(() => {
    setCurrentIndex(0);
    setIsActive(true);
  }, []);

  const next = React.useCallback(() => {
    setCurrentIndex((i) => {
      if (i >= steps.length - 1) {
        setIsActive(false);
        return 0;
      }
      return i + 1;
    });
  }, [steps.length]);

  const skip = React.useCallback(() => {
    setIsActive(false);
    setCurrentIndex(0);
  }, []);

  const value: TourContextValue = React.useMemo(
    () => ({ steps, currentIndex, isActive, start, next, skip }),
    [steps, currentIndex, isActive, start, next, skip]
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour() {
  const ctx = React.useContext(TourContext);
  if (!ctx) {
    throw new Error('useTour must be used within TourProvider');
  }
  return ctx;
}
