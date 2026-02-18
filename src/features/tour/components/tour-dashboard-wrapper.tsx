'use client';

import { TourProvider } from '../context/tour-context';
import { TourOverlay } from './tour-overlay';

export function TourDashboardWrapper({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <TourProvider>
      {children}
      <TourOverlay />
    </TourProvider>
  );
}
