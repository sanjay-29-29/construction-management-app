import { Edit } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/context/Auth';
import { cn, formatNumber } from '@/lib/utils';
import type { RateWork } from '@/types';

import { RateWorkUpdateDialog } from './RateWorkUpdate.container';

export const RateWorkCard = ({ data }: { data?: RateWork }) => {
  const { isHeadOffice } = useAuth();
  const [rateRateWorkUpdateDialog, setRateWorkUpdateDialog] = useState(false);

  return (
    <>
      <Card
        className={cn(
          'gap-0 shadow-none border-l-4',
          data?.isCompleted ? 'border-l-green-600' : 'border-l-blue-600'
        )}
      >
        <CardHeader className="px-4 pb-3">
          <div className="flex items-start justify-between gap-3">
            {/* Left content */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="truncate text-lg sm:text-xl">
                  {data?.name}
                </CardTitle>
                <Badge
                  className={cn(
                    'shrink-0',
                    data?.isCompleted
                      ? 'bg-green-100 text-green-600 hover:bg-green-100'
                      : 'bg-blue-100 text-blue-600 hover:bg-blue-100'
                  )}
                >
                  {data?.isCompleted ? 'Completed' : 'Pending'}
                </Badge>
              </div>
              {/* Labour */}
              <CardDescription className="mt-1.5 truncate">
                {data?.labourName}
              </CardDescription>
            </div>
            {/* Edit action */}
            {(isHeadOffice || !data?.isCompleted) && (
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0 border-gray-300 hover:bg-gray-100"
                onClick={() => setRateWorkUpdateDialog(true)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        {/* Meta info */}
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-500 mb-1">Quantity</p>
              <p className="font-medium text-gray-900">
                {formatNumber(data?.quantity)} {data?.unit}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Cost Per Unit</p>
              <p className="font-medium text-gray-900">
                ₹ {formatNumber(data?.costPerUnit)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Total Cost</p>
              <p className="font-medium text-gray-900">
                ₹{' '}
                {formatNumber(
                  Number(data?.quantity) * Number(data?.costPerUnit)
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Amount Paid</p>
              <p className="font-medium text-gray-900">
                ₹ {formatNumber(data?.paid)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Amount to Pay</p>
              <p className="font-medium text-gray-900">
                ₹{' '}
                {formatNumber(
                  Number(data?.quantity) * Number(data?.costPerUnit) -
                    Number(data?.paid)
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <RateWorkUpdateDialog
        data={data}
        setDialogState={setRateWorkUpdateDialog}
        dialog={rateRateWorkUpdateDialog}
      />
    </>
  );
};
