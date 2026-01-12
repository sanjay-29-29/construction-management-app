import { useQuery } from '@tanstack/react-query';
import { ClipboardCheck, Users2 } from 'lucide-react';
import { useState } from 'react';
import { Navigate, useParams } from 'react-router';

import { client } from '@/axios';
import { ItemCard } from '@/components/ItemCard';
import { LoaderPage } from '@/components/LoaderPage';
import { Scaffold } from '@/components/Scaffold';
import type { Site } from '@/types';

import { SiteCard } from './containers/SiteCard.container';
import { SiteOrderGrid } from './containers/SiteOrderGrid.container';
import { UpdateSiteContainer } from './containers/UpdateSite.container';

export const ManageSite = () => {
  const { siteId } = useParams();
  const [isSiteUpdateDialogOpen, setSiteUpdateDialog] =
    useState<boolean>(false);
  const {
    data: site,
    isError,
    isLoading,
  } = useQuery({
    queryKey: ['sites', siteId],
    queryFn: async () => {
      const response = await client.get<Site>(`sites/${siteId}/`);
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
    <Scaffold title="Manage Site">
      <div className="p-4 max-w-full flex flex-col gap-10">
        <SiteCard setSiteUpdateDialog={setSiteUpdateDialog} site={site} />
        <div>
          <div className="text-xl font-semibold mb-5">NMR</div>
          <div className="grid space-y-4">
            <ItemCard
              title="Mark Attendance"
              description="View and mark attendance"
              to="weeks"
              icon={
                <div className="bg-blue-100 p-2 rounded-lg">
                  <ClipboardCheck className="h-6 w-6 text-blue-600" />
                </div>
              }
              className="hover:bg-white/60"
            />
            <ItemCard
              title="Labours"
              description="View and manage labours"
              to="labours"
              icon={
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Users2 className="h-6 w-6 text-blue-600" />
                </div>
              }
              className="hover:bg-white/60"
            />
          </div>
        </div>
        <SiteOrderGrid site={site} />
      </div>
      <UpdateSiteContainer
        {...{ site, isSiteUpdateDialogOpen, setSiteUpdateDialog }}
      />
    </Scaffold>
  );
};
