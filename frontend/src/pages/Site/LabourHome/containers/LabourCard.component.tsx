import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import {
  Edit,
  User2,
  HardHat,
  Trash,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { useState, type Dispatch, type SetStateAction } from 'react';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';

import { client } from '@/axios';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Labour } from '@/types';

export const LabourCard = ({
  data,
  setLabourUpdateDialog,
}: {
  data?: Labour;
  setLabourUpdateDialog: Dispatch<SetStateAction<boolean>>;
}) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { siteId } = useParams();
  const [labourToDelete, setLabourToDelete] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await client.delete(`sites/${siteId}/labours/${labourToDelete}/`);
    },
    onSuccess: () => {
      toast.success('Labour was deleted successfully.');
      navigate(`/sites/${siteId}/labours/`, { replace: true });
      queryClient.invalidateQueries({
        queryKey: ['sites', siteId, 'labours'],
      });
      queryClient.invalidateQueries({
        queryKey: ['sites', siteId, 'weeks'],
      });
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        toast.error('Error', {
          description: 'Error occurred while deleting labour.',
        });
        return;
      }
      toast.error('Error', {
        description: 'Unknown error occurred.',
      });
    },
  });

  return (
    <Card className="border-l-4 border-l-green-600 gap-0 shadow-none">
      <CardHeader className="pb-4 px-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap justify-between">
              <CardTitle className="text-lg sm:text-xl truncate">
                {data?.name}
              </CardTitle>
            </div>

            <CardDescription className="mt-3 space-y-2 text-sm">
              {/* Role */}
              <div className="flex items-center gap-3">
                <User2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-muted-foreground">
                  {data?.gender ?? '—'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <HardHat className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-muted-foreground">
                  {data?.type ?? '—'}
                </span>
              </div>
            </CardDescription>
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0 border-gray-300 hover:bg-gray-100"
            onClick={() => setLabourUpdateDialog(true)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0 border-red-300 hover:bg-red-100 text-red-600 hover:text-red-600"
            disabled={deleteMutation.isPending}
            onClick={() => setLabourToDelete(data?.id ?? null)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <AlertDialog
        open={!!labourToDelete}
        onOpenChange={(open) => !open && setLabourToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <AlertDialogTitle>Delete Labour</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Are you sure you want to delete this labour? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                deleteMutation.mutate();
              }}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
