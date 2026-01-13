import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useParams } from 'react-router';

import { client } from '@/axios';
import { ProfileCard } from '@/components/ProfileCard';
import { SearchLayout } from '@/layouts/Search';
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
      renderItem={(labour) => (
        <Link to={labour.id.toString()}>
          <ProfileCard
            title={labour.name}
            description={labour.type}
            imageSrc={labour.photo}
          />
        </Link>
      )}
    />
  );
};
