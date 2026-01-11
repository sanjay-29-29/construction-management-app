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
import type { User } from '@/types';

export const HomePage = () => {
  const [searchText, setSearchText] = useState<string | undefined>();
  const { data, isError, isLoading, refetch } = useQuery({
    queryKey: ['siteData'],
    queryFn: async () => {
      const response = await client.get<User[]>('users/');
      return response.data;
    },
  });

  const filteredData = data?.filter((user) => {
    if (!searchText) {
      return true;
    }
    const search = searchText.toLowerCase();
    return (
      user.firstName?.toLowerCase().includes(search) ||
      user.lastName?.toLowerCase().includes(search) ||
      user.role?.toLowerCase().includes(search)
    );
  });

  return (
    <Scaffold title="Users">
      <div className="p-4 bg-white">
        <Input
          onChange={(e) => {
            setSearchText(e.target.value);
          }}
          startContent={<Search size={20} />}
          placeholder="Search by first name, last name"
        />
      </div>
      <Separator />
      {/* Loading */}
      {!isError && isLoading && (
        <div className="pt-32 flex justify-center flex-1">
          <Spinner />
        </div>
      )}
      <div className="grid h-full overflow-y-auto">
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
          <p className="text-gray-500 text-center pt-32">No found.</p>
        )}
        {!isLoading &&
          !isError &&
          filteredData?.map(({ id, firstName, lastName, role, isActive }) => (
            <React.Fragment key={id}>
              <Link to={id}>
                <ProfileCard
                  title={`${firstName} ${lastName}`}
                  description={role}
                  badgeText={isActive ? 'Active' : 'Disabled'}
                  badgeClassName={
                    isActive
                      ? 'bg-green-100 text-green-600'
                      : 'bg-red-100 text-red-600'
                  }
                />
              </Link>
              <Separator />
            </React.Fragment>
          ))}
      </div>
      <Link to="create">
        <div className="rounded-full bg-white fixed z-20 bottom-0 right-0 m-5 shadow-xl p-5 border hover:bg-gray-100 active:bg-gray-200">
          <PlusIcon />
        </div>
      </Link>
    </Scaffold>
  );
};
