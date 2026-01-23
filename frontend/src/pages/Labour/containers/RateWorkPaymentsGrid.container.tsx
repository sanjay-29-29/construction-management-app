import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AgGridReact } from 'ag-grid-react';
import { Plus, Trash } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { toast } from 'sonner';

import { client } from '@/axios';
import { DeleteDialog } from '@/components/DeleteDialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/Auth';
import { formatDate, formatNumber } from '@/lib/utils';
import type { Labour, RateWorkPayment } from '@/types';

import { RateWorkPaymentCreateDialog } from './RateWorkPaymentCreate.container';

import type { ColDef, ICellRendererParams } from 'ag-grid-community';

export const RateWorkPayments = ({ data }: { data?: Labour }) => {
  const queryClient = useQueryClient();
  const { isHeadOffice } = useAuth();
  const { siteId, labourId } = useParams();
  const [isCreatePaymentDialogOpen, setCreatePaymentDialog] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<null | string>(null);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await client.delete(`labours/${labourId}/rate-work/payments/${id}/`);
    },
    onSuccess: () => {
      toast.success('Payment entry removed successfully');
      queryClient.invalidateQueries({
        queryKey: ['sites', siteId, 'labours', labourId],
      });
      setPaymentToDelete(null);
    },
    onError: () => {
      toast.error('Error removing payment entry');
    },
  });

  const columnDefs: ColDef<RateWorkPayment>[] = useMemo(
    () => [
      {
        headerName: 'Date',
        field: 'dateCreated',
        sortable: true,
        filter: 'agDateColumnFilter',
        lockPosition: 'left',
        valueFormatter: ({ value }) => formatDate(value),
      },
      {
        headerName: 'Note',
        field: 'note',
        sortable: false,
        filter: 'agTextColumnFilter',
      },
      {
        headerName: 'Amount Paid',
        field: 'amount',
        sortable: true,
        filter: false,
        valueFormatter: (params) => `₹ ${formatNumber(params.value)}`,
        valueGetter: (params) => parseInt(params.data?.amount ?? '')
      },
      {
        headerName: 'Actions',
        filter: false,
        sortable: false,
        hide: !isHeadOffice,
        cellRenderer: (params: ICellRendererParams<RateWorkPayment>) => {
          const id = params.data?.id;
          return (
            <div className="w-full flex justify-center items-center">
              <Button
                variant="ghost"
                size="icon"
                className="border-red-200 border text-red-500 hover:bg-red-100 hover:text-red-600"
                onClick={() => setPaymentToDelete(id ?? null)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [isHeadOffice]
  );

  const defaultColDef = useMemo(
    () => ({
      flex: 1,
      minWidth: 150,
      sortable: true,
      filter: true,
      resizable: true,
      suppressMovable: true,
      filterParams: {
        buttons: ['apply', 'reset'],
      },
    }),
    []
  );

  return (
    <>
      <div className="grid gap-4">
        <div className="flex justify-between items-center">
          <div className="font-semibold text-xl">Past Payments</div>
          <Button
            variant="outline"
            type="button"
            onClick={() => setCreatePaymentDialog(true)}
          >
            <Plus /> Add Payment Entry
          </Button>
        </div>
        <div className="w-full max-h-100 overflow-auto h-100">
          <AgGridReact
            rowData={data?.rateWorkPayments ?? []}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            rowHeight={52}
            headerHeight={44}
            suppressRowHoverHighlight
            suppressCellFocus
            suppressMovableColumns
          />
        </div>
        <DeleteDialog
          open={!!paymentToDelete}
          onOpenChange={(open) => !open && setPaymentToDelete(null)}
          description="Are you sure you want to delete this payment? This action cannot be undone"
          onDelete={() => {
            if (paymentToDelete) {
              deleteMutation.mutate(paymentToDelete);
            }
          }}
          loading={deleteMutation.isPending}
        />
        <RateWorkPaymentCreateDialog
          dialogOpen={isCreatePaymentDialogOpen}
          setDialogOpen={setCreatePaymentDialog}
        />
      </div>
    </>
  );
};
