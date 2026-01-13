import { useQuery } from '@tanstack/react-query';
import { Navigate, useParams } from 'react-router';

import { client } from '@/axios';
import { LoaderPage } from '@/components/LoaderPage';
import { Scaffold } from '@/components/Scaffold';
import type { RateWork } from '@/types';

import { RateWorkCard } from './containers/RateWorkCard.container';
import { RateWorkPayments } from './containers/RateWorkPayments.container';

export const ManageRateWork = () => {
  const { siteId, rateWorkId } = useParams();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['sites', siteId, 'rate-work', rateWorkId],
    queryFn: async () => {
      const response = await client.get<RateWork>(
        `sites/${siteId}/rate-work/${rateWorkId}/`
      );
      return response.data;
    },
  });

  if (isError) {
    return <Navigate to="/sites" replace />;
  }

  if (!isError && isLoading) {
    return <LoaderPage />;
  }

  return (
    <Scaffold title="Manage Rate Work">
      <div className="gap-16 flex flex-col">
        <RateWorkCard data={data} />
        <RateWorkPayments data={data} />
      </div>
    </Scaffold>
  );
};
