'use client';

import BottomNav from './BottomNav';
import SidebarNav from './SidebarNav';
import LGPDBanner from './LGPDBanner';

export default function BottomNavWrapper() {
  return (
    <>
      <SidebarNav />
      <BottomNav />
      <LGPDBanner />
    </>
  );
}
