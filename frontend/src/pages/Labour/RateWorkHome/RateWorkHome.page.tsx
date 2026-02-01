import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useParams } from 'react-router';

import { client } from '@/axios';
import { ProfileCard } from '@/components/ProfileCard';
import { SearchLayout } from '@/layouts/Search';
import type { Labour } from '@/types';

export const RateWorkHome = () => {
    const { siteId } = useParams();

    const [searchText, setSearchText] = useState<string | undefined>();

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['sites', siteId, 'labours', 2],
        queryFn: async () => {
            const response = await client.get<Labour[]>(`sites/${siteId}/labours/`, {
                params: {
                    type: 2
                }
            });
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
            labour.gender?.toLowerCase().includes(search)
        );
    });

    return (
        <SearchLayout
            title="Rate Workers"
            searchPlaceholder="Search by user name"
            onSearchChange={setSearchText}
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
            data={filteredData}
            emptyText="No rate workers found."
            bottomLinkTo="../create"
            showBottomLink={false}
            renderItem={(labour) => (
                <Link to={`../${labour.id}`} key={labour.id}>
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
