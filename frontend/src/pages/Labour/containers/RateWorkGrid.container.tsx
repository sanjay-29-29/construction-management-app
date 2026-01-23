import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AgGridReact } from 'ag-grid-react';
import { Edit, PlusIcon, Trash } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { toast } from 'sonner';

import { client } from '@/axios';
import { DeleteDialog } from '@/components/DeleteDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/Auth';
import { formatDate, formatNumber } from '@/lib/utils';
import type { Labour, RateWork } from '@/types';

import { CreateRateWorkDialog } from './CreateRateWork.container';
import { RateWorkUpdateDialog } from './UpdateRateWork.container';

import type {
  ColDef,
  ICellRendererParams,
  ValueFormatterParams,
} from 'ag-grid-community';

export const RateWorkGrid = ({ data }: { data?: Labour }) => {
  const { isHeadOffice } = useAuth();
  const { labourId, siteId } = useParams();
  const queryClient = useQueryClient();

  const [open, setDialogOpen] = useState(false);
  const [workToDelete, setWorkToDelete] = useState<null | string>(null);
  const [workToUpdate, setWorkToUpdate] = useState<null | RateWork>(null);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await client.delete(`labours/${labourId}/rate-work/${workToDelete}/`);
    },
    onSuccess: () => {
      toast.success('Rate work removed successfully');
      queryClient.invalidateQueries({
        queryKey: ['sites', siteId, 'labours', labourId],
      });
      setWorkToDelete(null);
    },
    onError: () => {
      toast.error('Error removing rate work');
    },
  });

  const columnDefs: ColDef<RateWork>[] = useMemo(
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
        headerName: 'Name',
        field: 'name',
        sortable: true,
        lockPosition: 'left',
      },
      {
        headerName: 'Cost Per Unit',
        field: 'costPerUnit',
        sortable: true,
        valueFormatter: ({ value }) => `₹ ${formatNumber(value)}`,
      },
      {
        headerName: 'Quantity',
        field: 'quantity',
        sortable: true,
        filter: false,
        cellRenderer: (params: ICellRendererParams<RateWork>) => {
          const unit = params.data?.unit;
          return `${formatNumber(params.data?.quantity)} ${unit}`;
        },
      },
      {
        headerName: 'Total Cost',
        field: 'totalCost',
        sortable: true,
        valueFormatter: ({ value }) => `₹ ${formatNumber(value)}`,
      },
      {
        headerName: 'Order Status',
        field: 'isCompleted',
        filter: false,
        cellRenderer: (params: ValueFormatterParams<boolean>) =>
          params.value ? (
            <Badge
              variant="secondary"
              className="shrink-0 bg-green-100 text-green-600"
            >
              Completed
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              className="shrink-0 bg-blue-100 text-blue-600"
            >
              Pending
            </Badge>
          ),
      },
      {
        headerName: 'Actions',
        filter: false,
        sortable: false,
        hide: !isHeadOffice,
        cellRenderer: (params: ICellRendererParams<RateWork>) => {
          const id = params.data?.id;
          return (
            <div className="w-full flex justify-center items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0 border-gray-300 hover:bg-gray-100"
                onClick={() => setWorkToUpdate(params?.data ?? null)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              {isHeadOffice && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="border-red-200 border text-red-500 hover:bg-red-100 hover:text-red-600"
                  onClick={() => setWorkToDelete(id ?? null)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [isHeadOffice]
  );

  console.log(workToUpdate);

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
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <div className="text-xl font-semibold">Rate Works</div>
        <Button
          variant="outline"
          type="button"
          onClick={() => setDialogOpen(true)}
        >
          <PlusIcon /> Add Rate Work
        </Button>
      </div>
      <div className="w-full max-h-100 overflow-auto h-100">
        <AgGridReact
          rowData={data?.rateWorks ?? []}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowHeight={52}
          headerHeight={44}
          suppressRowHoverHighlight
          suppressCellFocus
          suppressMovableColumns
        />
      </div>
      <CreateRateWorkDialog dialog={open} setDialogState={setDialogOpen} />
      <DeleteDialog
        open={!!workToDelete}
        onOpenChange={(open) => !open && setWorkToDelete(null)}
        description="Are you sure you want to delete this rate work? This action cannot be"
        onDelete={deleteMutation.mutate}
        loading={deleteMutation.isPending}
      />
      <RateWorkUpdateDialog
        dialog={!!workToUpdate}
        setDialogState={(val) => !val && setWorkToUpdate(null)}
        data={workToUpdate ?? undefined}
      />
    </div>
  );
};
