import { useQuery } from '@tanstack/react-query';
import { PlusIcon, Search } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';

import { client } from '@/axios';
import { ProfileCard } from '@/components/ProfileCard';
import { Scaffold } from '@/components/Scaffold';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { type Vendor } from '@/types';

export const HomePage = () => {
  const [searchText, setSearchText] = useState<string | undefined>();
  const { data, isError, isLoading, refetch } = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const response = await client.get<Vendor[]>('vendors/');
      return response.data;
    },
  });

  const filteredData = data?.filter((vendor) => {
    if (!searchText) {
      return true;
    }
    const search = searchText.toLowerCase();
    return (
      vendor.name?.toLowerCase().includes(search) ||
      vendor.address?.toLowerCase().includes(search)
    );
  });

  return (
    <Scaffold title="Vendors">
      <div className="p-4 bg-white">
        <Input
          onChange={(e) => {
            setSearchText(e.target.value);
          }}
          startContent={<Search size={20} />}
          placeholder="Search by vendor name"
        />
      </div>
      <Separator />
      {/* Loading */}
      {isLoading && (
        <div className="pt-32 flex justify-center flex-1">
          <Spinner />
        </div>
      )}
      <div className="h-full overflow-y-auto grid">
        {/* Error */}
        {isError && (
          <div className="flex flex-1 flex-col items-center justify-center text-2xl min-h-100">
            <p>Error Occurred</p>
            <Button onClick={() => refetch()} className="mt-4">
              Retry
            </Button>
          </div>
        )}
        {/* Success */}
        {!isLoading && !isError && filteredData?.length === 0 && (
          <p className="text-gray-500 text-center pt-32">No vendors found.</p>
        )}
        {!isLoading &&
          !isError &&
          filteredData?.map((vendor) => (
            <Link to={vendor.id} key={vendor.id}>
              <ProfileCard title={vendor.name} description={vendor.address} />
              <Separator />
            </Link>
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
