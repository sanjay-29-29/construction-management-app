import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { ClipboardCheck, HardHatIcon, Loader2, Users2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';

import { client } from '@/axios';
import { ItemCard } from '@/components/ItemCard';
import { LoaderPage } from '@/components/LoaderPage';
import { Scaffold } from '@/components/Scaffold';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
} from '@/components/ui/alert-dialog';
import type { Site } from '@/types';

import { SiteCard } from './containers/SiteCard.container';
import { SiteOrderGrid } from './containers/SiteOrderGrid.container';
import { UpdateSiteContainer } from './containers/UpdateSite.container';

export const ManageSite = () => {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSiteUpdateDialogOpen, setSiteUpdateDialog] =
    useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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

  const deleteSiteMutation = useMutation({
    mutationFn: async () => {
      await client.delete(`sites/${siteId}/`);
    },
    onSuccess: () => {
      toast.success('Site deleted successfully');
      queryClient.invalidateQueries({
        queryKey: ['sites', siteId],
      });
      setIsDeleteDialogOpen(false);
      navigate('/sites', { replace: true });
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        toast.error('Failed to delete site.');
        return;
      }
      toast.error('Unknown error occurred.');
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
      <div className="max-w-full flex flex-col gap-16">
        <SiteCard
          setSiteUpdateDialog={setSiteUpdateDialog}
          site={site}
          setSiteDeleteDialog={setIsDeleteDialogOpen}
        />
        <div>
          <div className="text-xl font-semibold mb-4">Actions</div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
            <ItemCard
              title="Rate Work"
              description="View and manage rate work"
              to="labours/rate-work"
              icon={
                <div className="bg-blue-100 p-2 rounded-lg">
                  <HardHatIcon className="h-6 w-6 text-blue-600" />
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
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogDescription>
              Are you sure you want to delete this site? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteSiteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteSiteMutation.isPending}
              type="button"
              onClick={(e: FormEvent<HTMLButtonElement>) => {
                e.preventDefault();
                deleteSiteMutation.mutate();
              }}
            >
              {deleteSiteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Scaffold>
  );
};
