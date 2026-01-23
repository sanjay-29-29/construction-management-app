import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import {
  Edit,
  HardHat,
  Trash,
  Landmark,
  CreditCard,
  Hash,
  MapPin,
  IdCard,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';

import { client } from '@/axios';
import { DeleteDialog } from '@/components/DeleteDialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { LABOUR_ROLES } from '@/constants';
import { useAuth } from '@/context/Auth';
import { formatNumber } from '@/lib/utils';
import { UpdateLabourDialog } from '@/pages/Labour/containers/UpdateLabour.container';
import type { Labour } from '@/types';

export const LabourCard = ({ data }: { data?: Labour }) => {
  const queryClient = useQueryClient();
  const { isHeadOffice } = useAuth();
  const navigate = useNavigate();
  const { siteId } = useParams();
  const [labourToDelete, setLabourToDelete] = useState<string | null>(null);
  const [isLabourUpdateDialogOpen, setLabourUpdateDialog] =
    useState<boolean>(false);

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

  const isRateWork = useMemo(
    () => data?.type === LABOUR_ROLES.RATE_WORKER,
    [data]
  );

  return (
    <Card className="border-l-4 border-l-blue-600 gap-0 shadow-none">
      <CardHeader className="pb-4 px-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex justify-between">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={data?.photo ?? undefined}
                    alt="labour photo"
                  />
                  <AvatarFallback>
                    {data?.name.slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-lg sm:text-xl truncate grid">
                  {data?.name}
                  <span className="font-medium text-muted-foreground text-sm">
                    {data?.gender ?? '—'}
                  </span>
                </CardTitle>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0 border-gray-300 hover:bg-gray-100"
                  onClick={() => setLabourUpdateDialog(true)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                {isHeadOffice && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0 border-red-300 hover:bg-red-100 text-red-600 hover:text-red-600"
                    disabled={deleteMutation.isPending}
                    onClick={() => setLabourToDelete(data?.id ?? null)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <CardDescription className="mt-8 flex justify-between">
              <div className="grid gap-2 text-sm">
                {/* Role */}
                <div className="flex items-center gap-3">
                  <HardHat className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-muted-foreground">
                    {data?.type ?? '—'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {/* Aadhar is an ID/Card */}
                  <IdCard className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-muted-foreground">
                    {data?.aadharNumber ?? '—'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {/* Aadhar is an ID/Card */}
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-muted-foreground">
                    {data?.panNumber ?? '—'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {/* Bank Account is the actual account/bank */}
                  <Landmark className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-muted-foreground">
                    {data?.bankAccountNumber ?? '—'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {/* IFSC is a Code/Hash */}
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-muted-foreground">
                    {data?.ifscCode ?? '—'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {/* Branch is a Location */}
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-muted-foreground">
                    {data?.branchName ?? '—'}
                  </span>
                </div>
              </div>
              {isRateWork && (
                <div className="grid text-xs">
                  <div>
                    <div className="text-muted-foreground">Total Cost</div>
                    <div className="font-semibold">
                      ₹ {formatNumber(data?.rateWorkPaymentTotal)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Paid</div>
                    <div className="font-semibold text-green-600">
                      ₹ {formatNumber(data?.amountPaid)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Balance</div>
                    <div className="font-semibold text-amber-600">
                      ₹{' '}
                      {formatNumber(
                        (data?.rateWorkPaymentTotal ?? 0) -
                          (data?.amountPaid ?? 0)
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <UpdateLabourDialog
        data={data}
        open={isLabourUpdateDialogOpen}
        onOpenChange={setLabourUpdateDialog}
      />
      <DeleteDialog
        open={!!labourToDelete}
        description="Are you sure you want to delete this labour? This action cannot be undone"
        loading={deleteMutation.isPending}
        onDelete={deleteMutation.mutate}
        onOpenChange={(open) => !open && setLabourToDelete(null)}
      />
    </Card>
  );
};
