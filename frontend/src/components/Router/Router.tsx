import { BrowserRouter, HashRouter } from 'react-router';

import type { ReactNode } from 'react';

export const Router = ({ children }: { children?: ReactNode }) => {
  if (import.meta.env.VITE_DESKTOP_APP) {
    return <HashRouter>{children}</HashRouter>;
  }
  return <BrowserRouter>{children}</BrowserRouter>;
};
