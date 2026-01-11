import { useQuery } from '@tanstack/react-query';
import { PlusIcon, Search } from 'lucide-react';
import React from 'react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';

import { client } from '@/axios';
import { ProfileCard } from '@/components/ProfileCard';
import { Scaffold } from '@/components/Scaffold';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import type { Labour } from '@/types';

export const LabourHome = () => {
  const { siteId } = useParams();

  const [searchText, setSearchText] = useState<string | undefined>();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['sites', siteId, 'labours'],
    queryFn: async () => {
      const response = await client.get<Labour[]>(`sites/${siteId}/labours`);
      return response.data;
    },
  });

  const filteredData = data?.filter((labour) => {
    if (!searchText) {
      return true;
    }
    const search = searchText.toLowerCase();
    return (
      labour.name?.toLowerCase().includes(search) ||
      labour.gender?.toLowerCase().includes(search) ||
      labour.type?.toLowerCase().includes(search)
    );
  });

  return (
    <Scaffold title="Labours">
      <div className="p-4 bg-white">
        <Input
          onChange={(e) => {
            setSearchText(e.target.value);
          }}
          startContent={<Search size={20} />}
          placeholder="Search by labour name, gender or type"
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
          <p className="text-gray-500 text-center pt-32">No labours found.</p>
        )}
        {!isLoading &&
          !isError &&
          filteredData?.map((labour) => (
            <React.Fragment key={labour.id}>
              <Link to={labour.id.toString()}>
                <ProfileCard title={labour.name} description={labour.type} />
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
