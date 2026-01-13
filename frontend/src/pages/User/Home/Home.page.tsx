import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router';

import { client } from '@/axios';
import { ProfileCard } from '@/components/ProfileCard';
import { SearchLayout } from '@/layouts/Search';
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
    <SearchLayout
      title="Users"
      searchPlaceholder="Search by user name, role"
      onSearchChange={setSearchText}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      data={filteredData}
      emptyText="No users found."
      bottomLinkTo="create"
      showBottomLink={true}
      renderItem={({ id, firstName, lastName, isActive, role }) => (
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
      )}
    />
  );
};
