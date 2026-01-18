import { useQuery } from '@tanstack/react-query';
import { Edit, Hash, IdCard, Landmark, MapPin } from 'lucide-react';
import { useState } from 'react';
import { Navigate, useParams } from 'react-router';

import { client } from '@/axios';
import { LoaderPage } from '@/components/LoaderPage';
import { Scaffold } from '@/components/Scaffold';
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
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);

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
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0 border-gray-300 hover:bg-gray-100"
                  onClick={() => setIsUpdateDialogOpen(true)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <div className="text-right grid gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Total Cost</p>
                    <p className="text-sm font-semibold text-orange-700">
                      ₹ {formatNumber(vendor?.amountPaid)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Amount Paid</p>
                    <p className="text-sm font-semibold text-green-700">
                      ₹ {formatNumber(vendor?.orderCost)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Amount To Pay</p>
                    <p className="text-sm font-semibold text-blue-700">
                      ₹{' '}
                      {formatNumber(
                        Number(vendor?.amountPaid) - Number(vendor?.orderCost)
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
    </Scaffold>
  );
};
