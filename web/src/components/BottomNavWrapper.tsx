'use client';

import BottomNav from './BottomNav';
import SidebarNav from './SidebarNav';
import LGPDBanner from './LGPDBanner';
import ImpersonationBanner from './ImpersonationBanner';

export default function BottomNavWrapper() {
  return (
    <>
      <ImpersonationBanner />
      <SidebarNav />
      <BottomNav />
      <LGPDBanner />
    </>
  );
}
