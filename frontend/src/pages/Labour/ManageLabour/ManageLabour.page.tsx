import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Navigate, useParams } from 'react-router';

import { client } from '@/axios';
import { LoaderPage } from '@/components/LoaderPage';
import { Scaffold } from '@/components/Scaffold';
import type { Labour } from '@/types';

import { LabourDocumentsContainer } from './containers/LabourDocuments.container';
import { UpdateLabourDialog } from './containers/UpdateLabour.container';
import { LabourCard } from '../LabourHome/containers/LabourCard.component';

export const ManageLabour = () => {
  const { siteId, labourId } = useParams();
  const [isLabourUpdateDialogOpen, setLabourUpdateDialog] =
    useState<boolean>(false);

  const { data, isError, isLoading } = useQuery({
    queryFn: async () => {
      const response = await client.get<Labour>(
        `sites/${siteId}/labours/${labourId}/`
      );
      return response.data;
    },
    queryKey: ['sites', siteId, 'labours', labourId],
  });

  if (isError) {
    return <Navigate to="/sites" replace />;
  }

  if (!isError && isLoading) {
    return <LoaderPage />;
  }

  return (
    <Scaffold title="Manage Labour">
      <div className="grid gap-10">
        <LabourCard data={data} setLabourUpdateDialog={setLabourUpdateDialog} />
        <LabourDocumentsContainer data={data} />
      </div>
      <UpdateLabourDialog
        data={data}
        open={isLabourUpdateDialogOpen}
        onOpenChange={setLabourUpdateDialog}
      />
    </Scaffold>
  );
};
