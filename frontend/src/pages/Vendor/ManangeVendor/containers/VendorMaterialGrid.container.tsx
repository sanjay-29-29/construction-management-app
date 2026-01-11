import { AgGridReact } from 'ag-grid-react';
import { useNavigate } from 'react-router';

import { client } from '@/axios';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatNumber } from '@/lib/utils';
import type { Order, Vendor } from '@/types';

import type {
  ColDef,
  GridReadyEvent,
  IGetRowsParams,
  RowClickedEvent,
  ValueFormatterParams,
} from 'ag-grid-community';


export const VendorMaterialGrid = ({ vendor }: { vendor?: Vendor }) => {
  const navigate = useNavigate();

  const onGridReady = (params: GridReadyEvent) => {
    params.api.setGridOption('loading', true);
    const dataSource = {
      getRows: async (gridParams: IGetRowsParams) => {
        const { startRow, endRow, sortModel, filterModel } = gridParams;

        const queryParams = new URLSearchParams();
        queryParams.append('startRow', startRow.toString());
        queryParams.append('endRow', endRow.toString());

        if (sortModel?.length) {
          queryParams.append('sort', JSON.stringify(sortModel));
        }

        if (filterModel && Object.keys(filterModel).length) {
          queryParams.append('filter', JSON.stringify(filterModel));
        }

        try {
          const response = await client.get(
            `vendors/${vendor?.id}/orders/?${queryParams.toString()}`
          );

          gridParams.successCallback(
            response.data.rows,
            response.data.totalRows
          );
        } catch (err) {
          console.error(err);
          gridParams.failCallback();
        } finally {
          params.api.setGridOption('loading', false);
        }
      },
    };

    params.api.setGridOption('datasource', dataSource);
  };

  const columnDefs: ColDef<Order>[] = [
    {
      headerName: 'Date',
      field: 'createdAt',
      sortable: true,
      filter: 'agDateColumnFilter',
      filterParams: {
        maxNumConditions: 1,
        filterOptions: ['equals', 'inRange'],
      },
      lockPosition: 'left',
      valueFormatter: ({ value }) => formatDate(value),
    },
    {
      headerName: 'Order Number',
      field: 'number',
      sortable: true,
      filter: 'agTextColumnFilter',
      cellClass: 'ag-cell-centered',
      filterParams: {
        maxNumConditions: 1,
        filterOptions: ['contains'],
      },
    },

    {
      headerName: 'Order Name',
      field: 'name',
      sortable: true,
      filter: 'agTextColumnFilter',
      cellClass: 'ag-cell-centered',
      filterParams: {
        maxNumConditions: 1,
        filterOptions: ['contains'],
      },
    },
    {
      headerName: 'Site Name',
      field: 'site',
      sortable: true,
      filter: 'agTextColumnFilter',
      filterParams: {
        maxNumConditions: 1,
        filterOptions: ['contains'],
      },
    },
    {
      headerName: 'Order Cost',
      field: 'cost',
      sortable: true,
      filter: false,
      valueFormatter: (params) => `₹ ${formatNumber(params.value)}`,
      filterParams: {
        maxNumConditions: 1,
        filterOptions: ['contains'],
      },
    },
    {
      headerName: 'Amount Paid',
      field: 'paid',
      sortable: true,
      filter: false,
      valueFormatter: (params) => `₹ ${formatNumber(params.value)}`,
      filterParams: {
        maxNumConditions: 1,
        filterOptions: ['contains'],
      },
    },

    {
      headerName: 'Order Status',
      field: 'isCompleted',
      filter: 'agBooleanColumnFilter',
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
      // debounceMs: 300,
    },
  };

  const onRowClicked = (event: RowClickedEvent<Order>) => {
    navigate(`/orders/${event.data?.id}`);
  };

  return (
    <>
      <div className="text-xl font-semibold my-5">Your Orders</div>
      <div className="w-full max-h-100 overflow-auto h-100">
        <AgGridReact
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowModelType="infinite"
          cacheBlockSize={20}
          maxBlocksInCache={10}
          onGridReady={onGridReady}
          onRowClicked={onRowClicked}
          suppressMovableColumns
        />
      </div>
    </>
  );
};
