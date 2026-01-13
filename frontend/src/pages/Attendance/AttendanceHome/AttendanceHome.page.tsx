import { useQuery } from '@tanstack/react-query';
import { CalendarDays, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';

import { client } from '@/axios';
import { SearchLayout } from '@/layouts/Search';
import { formatDate } from '@/lib/utils';
import type { Week } from '@/types';

import { CreateWeekDialog } from '../CreateWeek';

export const SiteAttendanceHome = () => {
  const { siteId } = useParams();
  const [open, setOpen] = useState(false);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['sites', siteId, 'weeks'],
    queryFn: async () => {
      const response = await client.get<Week[]>(`sites/${siteId}/weeks/`);
      return response.data;
    },
  });
  const [searchText, setSearchText] = useState<string | undefined>();

  const filteredData = data?.filter((week) => {
    if (!searchText) {
      return true;
    }
    const search = searchText.toLowerCase();
    return (
      formatDate(week.endDate).toLowerCase().includes(search) ||
      formatDate(week.startDate).toLowerCase().includes(search)
    );
  });

  return (
    <>
      <SearchLayout
        title="Week"
        searchPlaceholder="Search by date"
        onSearchChange={setSearchText}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        data={filteredData}
        emptyText="No weeks found."
        bottomLinkTo=""
        showBottomLink={true}
        bottomLinkOnClick={() => setOpen(true)}
        renderItem={(week) => (
          <Link
            to={week.id.toString()}
            key={week.id}
            className="group block transition-all bg-white hover:bg-white/60 rounded-md border"
          >
            <div className="flex items-center px-4 py-4 sm:px-6">
              <div className="flex min-w-0 flex-1 items-center">
                <div className="shrink-0 bg-blue-100 p-3 rounded-lg">
                  <CalendarDays className="h-6 w-6 text-blue-600" />
                </div>

                <div className="min-w-0 flex-1 px-4">
                  <p className="text-sm font-medium text-slate-900">
                    Week of {formatDate(week.startDate)}
                  </p>
                  <p className="flex items-center text-xs text-slate-500 mt-1">
                    Ends on {formatDate(week.endDate)}
                  </p>
                </div>
              </div>

              <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-slate-600 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        )}
      />
      <CreateWeekDialog open={open} setOpen={setOpen} />
    </>
  );
};
