import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Navigate, useParams } from 'react-router';

import { client } from '@/axios';
import { LoaderPage } from '@/components/LoaderPage';
import { Scaffold } from '@/components/Scaffold';
import { LABOUR_ROLES } from '@/constants';
import {
  LabourCard,
  LabourDocumentsContainer,
  RateWorkPayments,
} from '@/pages/Labour/containers';
import type { Labour } from '@/types';

import { RateWorkGrid } from '../containers/RateWorkGrid.container';

export const ManageLabour = () => {
  const { siteId, labourId } = useParams();

  const { data, isError, isLoading } = useQuery({
    queryFn: async () => {
      const response = await client.get<Labour>(
        `sites/${siteId}/labours/${labourId}/`
      );
      return response.data;
    },
    queryKey: ['sites', siteId, 'labours', labourId],
  });

  const isRateWork = useMemo(
    () => data?.type === LABOUR_ROLES.RATE_WORKER,
    [data]
  );

  if (isError) {
    return <Navigate to="/sites" replace />;
  }

  if (!isError && isLoading) {
    return <LoaderPage />;
  }

  return (
    <Scaffold title="Manage Labour">
      <div className="grid gap-16">
        <LabourCard data={data} />
        {isRateWork && (
          <>
            <RateWorkGrid data={data} />
            <RateWorkPayments data={data} />
          </>
        )}
        <LabourDocumentsContainer data={data} />
      </div>
    </Scaffold>
  );
};
