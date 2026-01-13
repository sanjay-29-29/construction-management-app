import { ChevronRightIcon } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemHeader,
  ItemMedia,
} from '@/components/ui/item';
import { cn } from '@/lib/utils';

import type { ReactNode } from 'react';

export type ProfileCardProps = {
  title: string;
  description?: string;
  imageSrc?: string;
  badgeText?: string;
  badgeClassName?: string;
  showChevron?: boolean;
  className?: string;
  disableProfileIcon?: boolean;
  profileIcon?: ReactNode;
};

export const ProfileCard = ({
  title,
  description,
  imageSrc,
  badgeText,
  badgeClassName,
  showChevron = true,
  disableProfileIcon = false,
  profileIcon,
  className,
}: ProfileCardProps) => {
  return (
    <Item
      className={cn(
        'border-gray-200 bg-white hover:bg-white/60 cursor-pointer group transition-all',
        className
      )}
    >
      {/* Media */}
      {!disableProfileIcon && (
        <ItemMedia>
          {profileIcon ? (
            profileIcon
          ) : (
            <Avatar className="h-12 w-12">
              {imageSrc && <AvatarImage src={imageSrc} alt={title} />}
              <AvatarFallback>
                {title.charAt(0).toLocaleUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
        </ItemMedia>
      )}

      {/* Content */}
      <ItemContent>
        <ItemHeader className="line-clamp-1">{title}</ItemHeader>
        {description && (
          <ItemDescription className="line-clamp-1">
            {description}
          </ItemDescription>
        )}
      </ItemContent>

      {/* Actions */}
      <ItemActions>
        {badgeText && (
          <Badge className={cn('shrink-0', badgeClassName)}>{badgeText}</Badge>
        )}
        {showChevron && (
          <ChevronRightIcon className="h-5 w-5 text-slate-400 group-hover:text-slate-600 transition-transform group-hover:translate-x-1" />
        )}
      </ItemActions>
    </Item>
  );
};
