import type { HTMLProps } from 'react';
import type { To } from 'react-router';

export type ItemCardProps = {
  title: string;
  description: string;
  icon?: React.ReactNode;
  className?: HTMLProps<HTMLElement>['className'];
  to: To;
};
