import { useQuery } from '@tanstack/react-query';
import { PlusIcon, Search } from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router';

import { client } from '@/axios';
import { ProfileCard } from '@/components/ProfileCard';
import { Scaffold } from '@/components/Scaffold';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { ROLES } from '@/constants/role.constants';
import { useAuth } from '@/context/Auth';
import type { Site } from '@/types';

export const HomePage = () => {
  const { user } = useAuth();
  const { data, isError, isLoading, refetch } = useQuery({
    queryKey: ['sites'],
    queryFn: async () => {
      const response = await client.get<Site[]>('sites/');
      return response.data;
    },
  });
  const [searchText, setSearchText] = useState<string | undefined>();

  const filteredData = data?.filter((site) => {
    if (!searchText) {
      return true;
    }
    const search = searchText.toLowerCase();
    return (
      site.name?.toLowerCase().includes(search) ||
      site.address?.toLowerCase().includes(search)
    );
  });

  return (
    <Scaffold title="Sites">
      <div className="p-4 bg-white">
        <Input
          onChange={(e) => {
            setSearchText(e.target.value);
          }}
          startContent={<Search size={20} />}
          placeholder="Search by site name"
        />
      </div>
      <Separator />

      {/* Loading */}
      {!isError && isLoading && (
        <div className="pt-32 flex flex-1 justify-center">
          <Spinner />
        </div>
      )}
      <div className="overflow-y-auto grid">
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
          <p className="text-gray-500 text-center pt-32">No sites found.</p>
        )}
        {!isLoading &&
          !isError &&
          filteredData?.map((site) => (
            <React.Fragment key={site.id}>
              <Link to={site.id.toString()}>
                <ProfileCard
                  title={site.name}
                  description={site.address}
                  badgeText={site.isActive ? 'Active' : 'Completed'}
                  badgeClassName={
                    site.isActive
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-green-100 text-green-600'
                  }
                />
              </Link>
              <Separator />
            </React.Fragment>
          ))}
      </div>
      {user?.role === ROLES.HEAD_OFFICE && (
        <Link to="create">
          <div className="rounded-full bg-white fixed z-20 bottom-0 right-0 m-5 shadow-xl p-5 border hover:bg-gray-100 active:bg-gray-200">
            <PlusIcon />
          </div>
        </Link>
      )}
    </Scaffold>
  );
};
