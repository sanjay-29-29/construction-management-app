import { App as CapacitorApp } from '@capacitor/app';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';

import type { PluginListenerHandle } from '@capacitor/core';

export const BackButtonHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let handle: PluginListenerHandle | undefined;

    CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack && location.pathname !== '/') {
        navigate(-1);
      } else {
        CapacitorApp.exitApp();
      }
    }).then((h) => {
      handle = h;
    });

    return () => {
      handle?.remove();
    };
  }, [navigate, location.pathname]);

  return null;
};
