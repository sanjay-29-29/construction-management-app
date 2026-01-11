import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router';

import { cn } from '@/lib/utils';

import type { ItemCardProps } from './ItemCard.type';

export const ItemCard = ({
  title,
  description,
  icon,
  to,
  className,
}: ItemCardProps) => {
  return (
    <Link to={to}>
      <div
        className={cn(
          'group relative flex items-center gap-4 rounded-xl border bg-card p-4 transition-all   cursor-pointer',
          className ? className : 'hover:bg-muted/50'
        )}
      >
        {icon}

        {/* Text Content */}
        <div className="flex flex-1 flex-col justify-center">
          <h3 className="font-semibold tracking-tight text-foreground">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-slate-600 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
};
