'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboardingStore } from '@/store/onboarding-store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { IconChevronRight, IconChevronLeft, IconX } from '@tabler/icons-react';

export function OnboardingTour() {
  const {
    isActive,
    steps,
    currentStepIndex,
    nextStep,
    prevStep,
    skipTour,
    completeTour,
    activeTourId
  } = useOnboardingStore();

  const [coords, setCoords] = React.useState({
    top: 0,
    left: 0,
    width: 0,
    height: 0
  });
  const currentStep = steps[currentStepIndex];

  React.useEffect(() => {
    if (!isActive || !currentStep) return;

    const updateCoords = () => {
      const element = document.querySelector(currentStep.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        setCoords({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height
        });

        // Smooth scroll to element
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    updateCoords();
    window.addEventListener('resize', updateCoords);
    return () => window.removeEventListener('resize', updateCoords);
  }, [isActive, currentStep, currentStepIndex]);

  if (!isActive || !currentStep) return null;

  const isLastStep = currentStepIndex === steps.length - 1;

  return (
    <div className='pointer-events-none fixed inset-0 z-[9999]'>
      {/* Dim Overlay with Hole */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className='absolute inset-0 bg-black/60 backdrop-blur-[2px]'
        style={{
          clipPath: `polygon(
            0% 0%, 0% 100%, 
            ${coords.left}px 100%, 
            ${coords.left}px ${coords.top}px, 
            ${coords.left + coords.width}px ${coords.top}px, 
            ${coords.left + coords.width}px ${coords.top + coords.height}px, 
            ${coords.left}px ${coords.top + coords.height}px, 
            ${coords.left}px 100%, 
            100% 100%, 100% 0%
          )`
        }}
      />

      {/* Spotlight Border */}
      <motion.div
        animate={{
          top: coords.top - 4,
          left: coords.left - 4,
          width: coords.width + 8,
          height: coords.height + 8
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 120 }}
        className='border-primary absolute rounded-xl border-2 shadow-[0_0_20px_rgba(var(--primary),0.3)]'
      />

      {/* Tooltip Card */}
      <AnimatePresence mode='wait'>
        <motion.div
          key={currentStepIndex}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
            top: coords.top + coords.height + 20,
            left: Math.max(
              20,
              Math.min(
                window.innerWidth - 340,
                coords.left + coords.width / 2 - 160
              )
            )
          }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className='pointer-events-auto absolute w-[320px]'
        >
          <div className='bg-background group relative overflow-hidden rounded-3xl border p-6 shadow-2xl'>
            {/* Progress Bar */}
            <div className='bg-muted absolute top-0 right-0 left-0 h-1'>
              <motion.div
                className='bg-primary h-full'
                initial={{ width: 0 }}
                animate={{
                  width: `${((currentStepIndex + 1) / steps.length) * 100}%`
                }}
              />
            </div>

            <button
              onClick={skipTour}
              className='text-muted-foreground hover:text-foreground absolute top-4 right-4 transition-colors'
            >
              <IconX size={18} />
            </button>

            <div className='space-y-4'>
              <div className='space-y-1'>
                <p className='text-primary text-[10px] font-bold tracking-widest uppercase'>
                  Step {currentStepIndex + 1} of {steps.length}
                </p>
                <h3 className='text-xl leading-tight font-bold'>
                  {currentStep.title}
                </h3>
              </div>

              <p className='text-muted-foreground text-sm leading-relaxed'>
                {currentStep.content}
              </p>

              <div className='flex items-center justify-between pt-4'>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={prevStep}
                  disabled={currentStepIndex === 0}
                  className='rounded-full'
                >
                  <IconChevronLeft size={16} className='mr-1' /> Back
                </Button>

                <Button
                  size='sm'
                  onClick={
                    isLastStep ? () => completeTour(activeTourId!) : nextStep
                  }
                  className='shadow-primary/20 rounded-full px-6 shadow-lg'
                >
                  {isLastStep ? 'Finish' : 'Next'}
                  {!isLastStep && (
                    <IconChevronRight size={16} className='ml-1' />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
