"use client";

import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";

const MotionHydratedContext = createContext(false);

/** True only after hydration; false on server and during the hydration pass. */
export function MotionHydrationProvider({ children }: { children: ReactNode }) {
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  return (
    <MotionHydratedContext.Provider value={hydrated}>
      {children}
    </MotionHydratedContext.Provider>
  );
}

export function useMotionHydrated() {
  return useContext(MotionHydratedContext);
}
