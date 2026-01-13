import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router';

import { client } from '@/axios';
import { ProfileCard } from '@/components/ProfileCard';
import { SearchLayout } from '@/layouts/Search';
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
    <SearchLayout
      title="Vendors"
      searchPlaceholder="Search by vendor name"
      onSearchChange={setSearchText}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      data={filteredData}
      emptyText="No vendors found."
      showBottomLink={true}
      bottomLinkTo="create"
      renderItem={(vendor) => (
        <Link to={vendor.id.toString()}>
          <ProfileCard title={vendor.name} description={vendor.address} />
        </Link>
      )}
    />
  );
};
