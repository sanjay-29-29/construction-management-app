import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import {
  Edit,
  Hash,
  IdCard,
  Landmark,
  Loader2,
  MapPin,
  Trash,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';

import { client } from '@/axios';
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
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatNumber } from '@/lib/utils';
import type { Vendor } from '@/types';

import { UpdateVendorContainer } from './containers/UpdateVendor.container';
import { VendorMaterialGrid } from './containers/VendorMaterialGrid.container';
import { VendorPaymentContainer } from './containers/VendorPayment.container';

export const ManageVendorPage = () => {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const {
    data: vendor,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['vendors', vendorId],
    queryFn: async () => {
      const response = await client.get<Vendor>(`vendors/${vendorId}/`);
      return response.data;
    },
  });

  const deleteVendorMutation = useMutation({
    mutationFn: async () => {
      await client.delete(`vendors/${vendorId}/`);
    },
    onSuccess: () => {
      toast.success('Vendor deleted successfully');
      queryClient.invalidateQueries({
        queryKey: ['vendors', vendorId],
      });
      setIsDeleteDialogOpen(false);
      navigate('/vendors', { replace: true });
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        toast.error('Failed to delete vendor.');
        return;
      }
      toast.error('Unknown error occurred.');
    },
  });

  if (isError) {
    return <Navigate to="/vendors" replace />;
  }

  if (!isError && isLoading) {
    return <LoaderPage />;
  }

  return (
    <Scaffold title="Manage Vendor">
      <div className="max-w-full overflow-x-hidden flex flex-col gap-16">
        <Card className="border-l-4 border-l-purple-600 gap-0 shadow-none">
          <CardHeader className="pb-4 px-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap justify-between">
                  <CardTitle className="text-lg sm:text-xl truncate">
                    {vendor?.name}
                  </CardTitle>
                </div>
                <CardDescription>
                  <div className="flex flex-col items-start gap-2 mt-2">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-gray-500" />
                      <span className="text-sm leading-relaxed wrap-break-words">
                        {vendor?.address}
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Landmark className="h-4 w-4 mt-0.5 shrink-0 text-gray-500" />
                      <span className="text-sm leading-relaxed wrap-break-words">
                        {vendor?.bankAccountNumber}
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <IdCard className="h-4 w-4 mt-0.5 shrink-0 text-gray-500" />
                      <span className="text-sm leading-relaxed wrap-break-words">
                        {vendor?.gstNumber}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* IFSC is a Code/Hash */}
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-muted-foreground">
                        {vendor?.ifscCode}
                      </span>
                    </div>

                    <p className="text-sm text-gray-700 leading-relaxed line-clamp-6 whitespace-pre-line">
                      {vendor?.notes}
                    </p>
                  </div>
                </CardDescription>
              </div>
              <div className="text-right flex flex-col gap-4 items-end">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0 border-gray-300 hover:bg-gray-100"
                    onClick={() => setIsUpdateDialogOpen(true)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0 border-red-300 hover:bg-red-100 text-red-600 hover:text-red-600"
                    disabled={deleteVendorMutation.isPending}
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-right grid gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Total Cost</p>
                    <p className="text-sm font-semibold text-orange-700">
                      ₹ {formatNumber(vendor?.orderCost)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Amount Paid</p>
                    <p className="text-sm font-semibold text-green-700">
                      ₹ {formatNumber(vendor?.amountPaid)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Amount To Pay</p>
                    <p className="text-sm font-semibold text-blue-700">
                      ₹{' '}
                      {formatNumber(
                        Number(vendor?.orderCost) - Number(vendor?.amountPaid)
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
        <VendorMaterialGrid vendor={vendor} />
        <VendorPaymentContainer data={vendor} />
      </div>
      <UpdateVendorContainer
        vendor={vendor}
        isDialogOpen={isUpdateDialogOpen}
        setDialog={setIsUpdateDialogOpen}
      />
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogDescription>
              Are you sure you want to delete this vendor? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteVendorMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteVendorMutation.isPending}
              type="button"
              onClick={(e: FormEvent<HTMLButtonElement>) => {
                e.preventDefault();
                deleteVendorMutation.mutate();
              }}
            >
              {deleteVendorMutation.isPending ? (
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
