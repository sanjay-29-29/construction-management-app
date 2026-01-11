import { useQuery } from '@tanstack/react-query';
import { CalendarDays, ChevronRight, PlusIcon, Search } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';

import { client } from '@/axios';
import { Scaffold } from '@/components/Scaffold';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
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
    <Scaffold title="Attendance">
      <div className="p-4 bg-white">
        <Input
          onChange={(e) => {
            setSearchText(e.target.value);
          }}
          startContent={<Search size={20} />}
          placeholder="Search by date"
        />
      </div>
      <Separator />
      <div className="h-full grid">
        {/* Loading */}
        {!isError && isLoading && (
          <div className="pt-32 flex justify-center">
            <Spinner />
          </div>
        )}
        {/* Error */}
        {!isLoading && isError && (
          <div className="flex flex-1 flex-col items-center justify-center text-2xl min-h-100">
            <p>Error Occurred</p>
            <Button onClick={() => refetch()} className="mt-4">
              Retry
            </Button>
          </div>
        )}
        {/* Success */}
        {!isLoading && !isError && filteredData?.length === 0 && (
          <p className="text-gray-500 text-center pt-32">No week found.</p>
        )}
        {!isLoading &&
          !isError &&
          filteredData?.reverse().map((week) => (
            <Link
              to={week.id.toString()}
              key={week.id}
              className="group block transition-all bg-white hover:bg-white/60"
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
              <Separator />
            </Link>
          ))}
      </div>
      <div
        className="rounded-full bg-white fixed z-20 bottom-0 right-0 m-5 shadow-xl p-5 border hover:bg-gray-100 active:bg-gray-200"
        onClick={() => setOpen(true)}
      >
        <PlusIcon />
      </div>
      <CreateWeekDialog open={open} setOpen={setOpen} />
    </Scaffold>
  );
};
