import { useQuery } from '@tanstack/react-query';
import { ChevronRightIcon } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';

import { client } from '@/axios';
import { Badge } from '@/components/ui/badge';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemHeader,
} from '@/components/ui/item';
import { SearchLayout } from '@/layouts/Search';
import { cn, formatNumber } from '@/lib/utils';
import type { RateWork } from '@/types';

import { CreateRateWorkDialog } from './container/CreateRateWork.container';

export const RateWorkHome = () => {
  const { siteId } = useParams();
  const { data, isError, isLoading, refetch } = useQuery({
    queryKey: ['sites', siteId, 'rate-work'],
    queryFn: async () => {
      const response = await client.get<RateWork[]>(
        `sites/${siteId}/rate-work/`
      );
      return response.data;
    },
  });

  const [searchText, setSearchText] = useState<string | undefined>();
  const [open, setOpen] = useState(false);

  const filteredData = data?.filter((rateWork) => {
    if (!searchText) {
      return true;
    }
    const search = searchText.toLowerCase();
    return (
      rateWork.name?.toLowerCase().includes(search) ||
      rateWork.labourName.toLowerCase().includes(search)
    );
  });

  return (
    <>
      <SearchLayout
        title="Rate Work"
        searchPlaceholder="Search by work name, labour name"
        onSearchChange={setSearchText}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        data={filteredData}
        emptyText="No rate work found."
        bottomLinkTo=""
        bottomLinkOnClick={() => setOpen(true)}
        showBottomLink={true}
        renderItem={(rateWork) => (
          <Link
            to={rateWork.id.toString()}
            className="block focus:outline-none"
          >
            <Item className="border-gray-200 bg-white hover:bg-white/60 cursor-pointer group transition-all">
              <ItemContent>
                <ItemHeader className="line-clamp-1">
                  {rateWork.name}
                </ItemHeader>
                <ItemDescription className="line-clamp-1">
                  {rateWork.labourName}
                </ItemDescription>
                <div className="mt-1 flex gap-4 text-xs text-gray-500">
                  <span>
                    {formatNumber(rateWork.quantity)} {rateWork.unit}
                  </span>
                  <span>₹ {formatNumber(rateWork.costPerUnit)}</span>
                  <span>
                    ₹ {formatNumber(rateWork.costPerUnit * rateWork.quantity)}
                  </span>
                </div>
              </ItemContent>
              <ItemActions>
                <Badge
                  className={cn(
                    'shrink-0',
                    rateWork.isCompleted
                      ? 'bg-green-100 text-green-600'
                      : 'bg-blue-100 text-blue-600'
                  )}
                >
                  {rateWork.isCompleted ? 'Completed' : 'Pending'}
                </Badge>
                <ChevronRightIcon className="h-5 w-5 text-slate-400 group-hover:text-slate-600 transition-transform group-hover:translate-x-1" />
              </ItemActions>
            </Item>
          </Link>
        )}
      />
      <CreateRateWorkDialog dialog={open} setDialogState={setOpen} />
    </>
  );
};
