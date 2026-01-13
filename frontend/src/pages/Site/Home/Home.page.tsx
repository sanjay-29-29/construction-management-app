import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router';

import { client } from '@/axios';
import { ProfileCard } from '@/components/ProfileCard';
import { ROLES } from '@/constants/role.constants';
import { useAuth } from '@/context/Auth';
import { SearchLayout } from '@/layouts/Search';
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
    <SearchLayout
      title="Sites"
      searchPlaceholder="Search by site name"
      onSearchChange={setSearchText}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      data={filteredData}
      emptyText="No sites found."
      showBottomLink={
        user?.role === ROLES.ADMIN || user?.role === ROLES.HEAD_OFFICE
      }
      bottomLinkTo="create"
      renderItem={(site) => (
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
            disableProfileIcon
          />
        </Link>
      )}
    />
  );
};
