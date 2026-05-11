import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface OnboardingStep {
  target: string; // CSS Selector
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

interface OnboardingState {
  isActive: boolean;
  currentStepIndex: number;
  steps: OnboardingStep[];
  completedTours: string[];
  activeTourId: string | null;

  // Actions
  startTour: (steps: OnboardingStep[], tourId: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  completeTour: (tourId: string) => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      isActive: false,
      currentStepIndex: 0,
      steps: [],
      completedTours: [],
      activeTourId: null,

      startTour: (steps, tourId) =>
        set({
          steps,
          isActive: true,
          currentStepIndex: 0,
          activeTourId: tourId
        }),

      nextStep: () =>
        set((state) => ({
          currentStepIndex: Math.min(
            state.currentStepIndex + 1,
            state.steps.length - 1
          )
        })),

      prevStep: () =>
        set((state) => ({
          currentStepIndex: Math.max(state.currentStepIndex - 1, 0)
        })),

      skipTour: () => set({ isActive: false }),

      completeTour: (tourId) =>
        set((state) => ({
          isActive: false,
          completedTours: state.completedTours.includes(tourId)
            ? state.completedTours
            : [...state.completedTours, tourId]
        }))
    }),
    {
      name: 'sparqly-onboarding-storage'
    }
  )
);
