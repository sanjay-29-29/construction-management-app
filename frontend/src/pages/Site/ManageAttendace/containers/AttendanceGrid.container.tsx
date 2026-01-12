import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AgGridReact } from 'ag-grid-react';
import { isAxiosError } from 'axios';
import { Edit, EllipsisVerticalIcon, PrinterIcon, X } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';

import { client } from '@/axios';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ROLES } from '@/constants/role.constants';
import { useAuth } from '@/context/Auth';
import { cn, formatDate, formatNumber } from '@/lib/utils';
import type { AttendanceEntry, Labour, Week } from '@/types';

import type { ColDef, ICellRendererParams } from 'ag-grid-community';

type AttendanceGridRow = Labour & {
  [key: string]: AttendanceEntry | string | number | null | undefined;
};

export const AttendanceGrid = ({ data }: { data?: Week }) => {
  const navigate = useNavigate();
  const { siteId, weekId } = useParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const mutation = useMutation({
    mutationFn: async ({
      id,
      adminUnlocked,
    }: {
      id: string;
      adminUnlocked: boolean;
    }) => {
      await client.patch(`sites/${siteId}/weeks/${weekId}/days/${id}/`, {
        adminUnlocked: adminUnlocked,
      });
    },
    onSuccess: () => {
      toast.success('The day has been unlocked for editing.');
      queryClient.invalidateQueries({
        queryKey: ['sites', siteId, 'weeks', weekId],
      });
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        toast.error('An error occurred updating day.');
        return;
      }
      toast.error('Unknown error occurred.');
    },
  });

  const rowData = useMemo(() => {
    return data?.labours?.map((labour) => {
      const row: AttendanceGridRow = { ...labour };
      let weeklyTotal = 0;
      let toPayAtWeekend = labour.openingBalance ?? 0;

      data?.dailyEntry?.forEach((entry) => {
        const record = entry.attendance.find((a) => a.labour === labour.id);
        row[entry.date] = record || null;

        if (record?.isPresent) {
          weeklyTotal += record.wageForDay + record.advanceTaken;
          toPayAtWeekend +=
            (labour.weeklyDailyWage ?? 0) -
            (record.wageForDay + record.advanceTaken);
        }
      });

      row.toPayAtWeekend = toPayAtWeekend;
      row.weeklyTotal = weeklyTotal;
      return row;
    });
  }, [data]);

  const columnDefs = useMemo<ColDef[]>(() => {
    if (!data?.labours || !data?.dailyEntry) return [];

    return [
      {
        field: 'name',
        headerName: 'Labour Name',
        pinned: 'left',
        width: 160,
        cellClass:
          'font-medium border-slate-200 flex items-center justify-center',
      },
      {
        field: 'gender',
        headerName: 'Gender',
        width: 100,
        cellClass: 'font-medium flex items-center justify-center',
      },

      {
        field: 'openingBalance',
        headerName: 'Prev. Bal',
        width: 100,
        cellClass:
          'flex items-center justify-center font-semibold text-xs border-r border-slate-200',
        cellRenderer: (params: ICellRendererParams) => {
          if (params.node.isRowPinned()) return null;
          const val = params.value || 0;
          return (
            <span className={val < 0 ? 'text-red-500' : 'text-green-600'}>
              ₹ {formatNumber(val)}
            </span>
          );
        },
      },
      ...data.dailyEntry.map((entry) => {
        return {
          field: entry.date,
          minWidth: 160,
          flex: 1,
          cellStyle: { padding: '0px' },
          cellClass: 'border-r border-slate-100',
          headerComponent: ({
            displayName,
            isEditable,
            id,
          }: {
            displayName: string;
            isEditable: boolean;
            id: string;
          }) => {
            const isHeadOffice =
              user?.role === ROLES.HEAD_OFFICE || user?.role === ROLES.ADMIN;
            const showDropdown = isHeadOffice || isEditable;
            if (!showDropdown) {
              return (
                <div className="w-full h-full flex flex-col pt-1">
                  <div className="flex-1 border-b flex w-full items-center justify-center text-xs">
                    <div>{formatDate(displayName)}</div>
                  </div>
                  <div className="flex h-6 text-[10px]">
                    <div className="flex-1 flex items-center justify-center border-r border-slate-200">
                      ADV
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                      WAGE
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div className="w-full h-full flex flex-col pt-1">
                <div className="flex-1 border-b relative">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        /* ADDED h-full here to fill the flex-1 container */
                        className="flex w-full h-full items-center justify-center text-xs gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div>{formatDate(displayName)}</div>
                        <EllipsisVerticalIcon className="h-full" size={14} />
                      </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="center">
                      {isEditable ? (
                        <>
                          <DropdownMenuItem
                            onClick={() => navigate(`days/${id}`)}
                            className="h-10"
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          {isHeadOffice && (
                            <DropdownMenuItem
                              onClick={() =>
                                mutation.mutate({
                                  id: id,
                                  adminUnlocked: false,
                                })
                              }
                              className="h-10"
                            >
                              <X className="mr-2 h-4 w-4" />
                              Disable Editing
                            </DropdownMenuItem>
                          )}
                        </>
                      ) : (
                        <DropdownMenuItem
                          onClick={() =>
                            mutation.mutate({ id, adminUnlocked: true })
                          }
                          className="h-10"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Enable Edit
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex h-6 text-[10px]">
                  <div className="flex-1 flex items-center justify-center border-r border-slate-200">
                    ADV
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    WAGE
                  </div>
                </div>
              </div>
            );
          },
          headerComponentParams: {
            displayName: entry.date,
            isEditable: entry.isEditable,
            id: entry.id,
          },
          cellRenderer: (
            params: ICellRendererParams<
              AttendanceGridRow,
              AttendanceEntry | null
            >
          ) => {
            const val = params.value;

            if (!val) {
              return (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-slate-300 text-xl font-light">-</span>
                </div>
              );
            }
            // 2. Present
            if (val.isPresent) {
              return (
                <div className="flex w-full h-full">
                  <div
                    className={cn(
                      'flex-1 flex flex-col justify-center items-center border-r border-slate-200 font-semibold',
                      val.advanceTaken > 0
                        ? 'bg-amber-50 text-amber-400'
                        : 'bg-transparent'
                    )}
                  >
                    <span
                      className={`text-xs font-semibold${
                        val.advanceTaken > 0
                          ? 'text-amber-700'
                          : 'text-slate-300'
                      }`}
                    >
                      {val.advanceTaken > 0
                        ? `₹ ${formatNumber(val.advanceTaken)}`
                        : '-'}
                    </span>
                  </div>

                  {/* RIGHT SIDE: Wage */}
                  <div className="flex-1 flex flex-col justify-center items-center">
                    <span className="text-xs font-semibold text-green-700">
                      ₹ {formatNumber(val.wageForDay)}
                    </span>
                  </div>
                </div>
              );
            }

            // 3. Absent
            return (
              <div className="w-full h-full flex items-center justify-center gap-1.5 opacity-60 bg-red-100">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                <span className="text-red-600 text-xs ">Absent</span>
              </div>
            );
          },
        };
      }),

      {
        field: 'toPayAtWeekend',
        headerName: 'To Pay',
        width: 120,
        cellRenderer: (params: ICellRendererParams) => {
          if (params.node.isRowPinned()) return null;
          const val = params.value || 0;
          return (
            <span className="w-full text-center font-semibold">
              ₹ {formatNumber(val)}
            </span>
          );
        },
      },

      {
        field: 'weeklyTotal',
        headerName: 'Amount Paid',
        width: 120,
        cellClass:
          'bg-emerald-50 font-semibold flex items-center justify-center border-emerald-200',
        valueFormatter: (params) => `₹ ${formatNumber(params.value)}`,
      },
    ];
  }, [data, navigate, user, mutation]);

  const footerData = useMemo(() => {
    if (!rowData) return [];
    const total = rowData.reduce(
      (acc, row) => acc + Number(row.weeklyTotal),
      0
    );
    return [
      {
        name: 'Total',
        weeklyTotal: total,
        isFooter: true,
      },
    ];
  }, [rowData]);

  return (
    <div className="h-full space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-xl font-semibold text-gray-900">
          This Week's Attendance
        </div>
        <Button variant="outline">
          <PrinterIcon />
        </Button>
      </div>
      <div className="h-120 sm:h-200 overflow-auto create-order ag-theme-alpine">
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          pinnedBottomRowData={footerData}
          suppressMovableColumns
          suppressRowHoverHighlight
          suppressCellFocus
          headerHeight={56}
          defaultColDef={{
            resizable: true,
            sortable: false,
          }}
        />
      </div>
    </div>
  );
};
