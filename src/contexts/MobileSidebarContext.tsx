import { createContext, useContext, useState, type ReactNode } from 'react';

interface MobileSidebarState {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const MobileSidebarContext = createContext<MobileSidebarState>({
  open: false,
  setOpen: () => {},
});

export function MobileSidebarProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <MobileSidebarContext.Provider value={{ open, setOpen }}>
      {children}
    </MobileSidebarContext.Provider>
  );
}

export function useMobileSidebar() {
  return useContext(MobileSidebarContext);
}
