import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AgGridReact } from 'ag-grid-react';
import { isAxiosError } from 'axios';
import { PlusIcon } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router';
import { toast } from 'sonner';

import { client } from '@/axios';
import { Button } from '@/components/ui/button';
import { formatDate, formatNumber } from '@/lib/utils';
import type { Payment, Vendor } from '@/types';

import { CreateVendorPayment } from './CreateVendorPayment.container';

import type { ColDef, ICellRendererParams } from 'ag-grid-community';

export const VendorPaymentContainer = ({ data }: { data?: Vendor }) => {
  const { vendorId } = useParams();
  const queryClient = useQueryClient();
  const [dialogState, setDialogState] = useState(false);

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      await client.delete(`vendors/${vendorId}/payments/${id}/`);
    },
    onSuccess: () => {
      toast.success('Payment record removed successfully');
      queryClient.invalidateQueries({
        queryKey: ['vendors', vendorId],
      });
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        toast.error('Error occurred while removing payment.');
      }
      toast.error('Unknown error occurred.');
    },
  });

  const columnDefs: ColDef<Payment>[] = [
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
      sortable: true,
      filter: 'agTextColumnFilter',
    },
    {
      headerName: 'Amount Paid',
      field: 'amount',
      sortable: true,
      filter: true,
      valueFormatter: (params) => `₹ ${formatNumber(params.value)}`,
    },
    {
      headerName: 'Actions',
      filter: false,
      sortable: false,
      cellRenderer: (params: ICellRendererParams<Payment>) => {
        const id = params.data?.id;
        return (
          <div className="w-full flex justify-center items-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => mutation.mutate(id ?? '')}
              className="h-9 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              Remove
            </Button>
          </div>
        );
      },
    },
  ];

  const defaultColDef = {
    flex: 1,
    minWidth: 150,
    sortable: true,
    filter: true,
    resizable: true,
    suppressMovable: true,
    filterParams: {
      buttons: ['apply', 'reset'],
    },
  };

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="text-xl font-semibold">Your Payments</div>
          <Button
            variant="outline"
            type="button"
            onClick={() => setDialogState(true)}
          >
            <PlusIcon /> Add Payment Entry
          </Button>
        </div>
        <div className="w-full max-h-100 overflow-auto h-100">
          <AgGridReact
            rowData={data?.payments ?? []}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            rowHeight={52}
            headerHeight={44}
            suppressRowHoverHighlight
            suppressCellFocus
            suppressMovableColumns
          />
        </div>
      </div>
      <CreateVendorPayment
        dialogOpen={dialogState}
        setDialogOpen={setDialogState}
      />
    </>
  );
};
