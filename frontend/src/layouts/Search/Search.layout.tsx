import { PlusIcon, Search } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router';

import { Scaffold } from '@/components/Scaffold';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

export type SearchLayoutProps<T> = {
  title: string;
  searchPlaceholder: string;
  onSearchChange: (value: string) => void;
  emptyText: string;
  data?: T[];
  renderItem: (item: T) => React.ReactNode;
  onRetry?: () => void;
  isLoading: boolean;
  isError: boolean;
  showBottomLink: boolean;
  bottomLinkTo: string;
  bottomLinkOnClick?: () => void;
};

export const SearchLayout = <T,>({
  title,
  searchPlaceholder,
  onSearchChange,
  emptyText,
  data,
  onRetry,
  renderItem,
  isLoading,
  isError,
  showBottomLink,
  bottomLinkTo,
  bottomLinkOnClick,
}: SearchLayoutProps<T>) => {
  return (
    <Scaffold title={title}>
      <div className="space-y-4">
        <div className="p-4 bg-white rounded-md shadow-sm">
          <Input
            onChange={(e) => {
              onSearchChange(e.target.value);
            }}
            startContent={<Search size={20} />}
            placeholder={searchPlaceholder}
          />
        </div>
        {/* Error */}
        {!isLoading && isError && (
          <div className="flex flex-1 flex-col items-center justify-center text-2xl min-h-100">
            <p>Error Occurred</p>
            <Button onClick={onRetry} className="mt-4">
              Retry
            </Button>
          </div>
        )}
        {/* Loading */}
        {!isError && isLoading && (
          <div className="pt-32 flex flex-1 justify-center">
            <Spinner />
          </div>
        )}
        {/* Empty */}
        {!isLoading && !isError && data?.length === 0 && (
          <p className="pt-32 text-center text-gray-500">{emptyText}</p>
        )}
        <div className="overflow-y-auto grid gap-4">
          {!isLoading &&
            !isError &&
            data?.map((item, index) => (
              <React.Fragment key={index}>{renderItem(item)}</React.Fragment>
            ))}
        </div>
        {showBottomLink &&
          (bottomLinkOnClick ? (
            <button
              className="rounded-full bg-white fixed z-20 bottom-0 right-0 m-5 shadow-xl p-5 border hover:bg-gray-100 active:bg-gray-200"
              onClick={bottomLinkOnClick}
            >
              <PlusIcon />
            </button>
          ) : (
            <Link to={bottomLinkTo} onClick={bottomLinkOnClick}>
              <div className="rounded-full bg-white fixed z-20 bottom-0 right-0 m-5 shadow-xl p-5 border hover:bg-gray-100 active:bg-gray-200">
                <PlusIcon />
              </div>
            </Link>
          ))}
      </div>
    </Scaffold>
  );
};
