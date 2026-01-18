import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AgGridReact } from 'ag-grid-react';
import { isAxiosError } from 'axios';
import { Edit, EllipsisVerticalIcon, X } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';

import { client } from '@/axios';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/Auth';
import { formatDate, formatNumber } from '@/lib/utils';
import type { AttendanceEntry, Labour, Week } from '@/types';

import type { ColDef, ICellRendererParams } from 'ag-grid-community';

type AttendanceGridRow = Labour & {
  [key: string]: AttendanceEntry | string | number | null | undefined;
};

export const AttendanceGrid = ({ data }: { data?: Week }) => {
  const navigate = useNavigate();
  const { siteId, weekId } = useParams();
  const queryClient = useQueryClient();
  const { isHeadOffice } = useAuth();

  const dayUpdateMutation = useMutation({
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
      toast.success(`The day has been edited.`);
      queryClient.invalidateQueries({
        queryKey: ['sites', siteId, 'weeks', weekId],
      });
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        toast.error('An error occurred while updating day.');
        return;
      }
      toast.error('Unknown error occurred.');
    },
  });

  const weekUpdateMutation = useMutation({
    mutationFn: async ({ adminUnlocked }: { adminUnlocked: boolean }) => {
      await client.patch(`sites/${siteId}/weeks/${weekId}/`, {
        adminUnlocked: adminUnlocked,
      });
    },
    onSuccess: () => {
      toast.success(`The week has been edited.`);
      queryClient.invalidateQueries({
        queryKey: ['sites', siteId, 'weeks', weekId],
      });
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        toast.error('An error occurred while updating week.');
        return;
      }
      toast.error('Unknown error occurred.');
    },
  });

  const rowData = useMemo(() => {
    if (!data?.labours || !data?.dailyEntry) return [];

    return data.labours.map((labour) => {
      const row: AttendanceGridRow = {
        name: labour.name,
        id: labour.id,
        type: labour.type,
        gender: labour.gender,
        amountPaid: labour.amountPaid,
        openingBalance: labour.openingBalance,
        totalDueToDate: labour.totalDueToDate,
      };

      let weeklyTotal = 0;

      const attendanceMap = new Map(
        data.dailyEntry?.flatMap((entry) =>
          entry.attendance.map((a) => [
            `${entry.date}-${a.labour}`,
            { ...a, date: entry.date },
          ])
        )
      );

      data.dailyEntry?.forEach((entry) => {
        const record = attendanceMap.get(`${entry.date}-${labour.id}`);
        row[entry.date] = record || null;

        weeklyTotal += record?.advanceTaken ?? 0;
      });

      row.weeklyTotal = weeklyTotal + (labour.amountPaid ?? 0);

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
            const showDropdown = isHeadOffice || isEditable;
            if (!showDropdown) {
              return (
                <div className="w-full h-full flex flex-col pt-1">
                  <div className="flex-1 border-b flex w-full items-center justify-center text-xs">
                    <div>{formatDate(displayName)}</div>
                  </div>
                  <div className="flex h-6 text-[10px]">
                    <div className="flex-1 flex items-center justify-center">
                      ADVANCE
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
                                dayUpdateMutation.mutate({
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
                            dayUpdateMutation.mutate({
                              id,
                              adminUnlocked: true,
                            })
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
                  <div className="flex-1 flex items-center justify-center">
                    ADVANCE
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
                  {val.advanceTaken > 0 ? (
                    <div className="flex-1 flex flex-col justify-center items-center border-r border-slate-200 font-semibold bg-amber-50 text-amber-400">
                      <span className="text-xs font-semibold text-amber-700">
                        ₹ {formatNumber(val.advanceTaken)}
                      </span>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col justify-center items-center border-r border-slate-200 font-semibold bg-green-50 text-emerald-500 text-xs">
                      Present
                    </div>
                  )}
                </div>
              );
            }

            // 3. Absent
            return (
              <div className="w-full h-full flex items-center justify-center gap-1.5 opacity-60 bg-red-100">
                {val.advanceTaken > 0 ? (
                  <div className="text-xs font-semibold text-red-400">
                    ₹ {formatNumber(val.advanceTaken)}
                  </div>
                ) : (
                  <span className="text-red-600 text-xs ">Absent</span>
                )}
              </div>
            );
          },
        };
      }),
      {
        field: 'amountPaid',
        width: 150,
        headerComponent: () => {
          const showDropdown = isHeadOffice || data.isEditable;
          if (!showDropdown) {
            return (
              <div className="w-full h-full flex flex-col pt-1 py-1">
                <div className="flex-1 flex items-center justify-center">
                  Wage for Week
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
                      className="flex w-full h-full items-center justify-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div>Wage For Week</div>
                      <EllipsisVerticalIcon className="h-full" size={14} />
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="center">
                    {data.isEditable ? (
                      <>
                        <DropdownMenuItem
                          className="h-10"
                          onClick={() => navigate('payment')}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {isHeadOffice && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.preventDefault();
                              weekUpdateMutation.mutate({
                                adminUnlocked: false,
                              });
                            }}
                            className="h-10"
                          >
                            <X className="mr-2 h-4 w-4" />
                            Disable Editing
                          </DropdownMenuItem>
                        )}
                      </>
                    ) : (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault();
                          weekUpdateMutation.mutate({ adminUnlocked: true });
                        }}
                        className="h-10"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Enable Edit
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        },

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
        field: 'totalDueToDate',
        headerName: 'To Pay',
        width: 120,
        cellClass:
          'bg-violet-50 font-semibold flex items-center justify-center',
        valueFormatter: (params) => `₹ ${formatNumber(params.value)}`,
      },

      {
        field: 'weeklyTotal',
        headerName: 'Total Paid',
        width: 120,
        cellClass: 'bg-blue-50 font-semibold flex items-center justify-center',
        valueFormatter: (params) => `₹ ${formatNumber(params.value)}`,
      },
    ];
  }, [data, navigate, isHeadOffice, dayUpdateMutation, weekUpdateMutation]);

  const footerData = useMemo(() => {
    if (!rowData) return [];
    const total = rowData.reduce(
      (acc, row) => acc + Number(row.weeklyTotal),
      0
    );
    const toPayTotal = rowData.reduce(
      (acc, row) => acc + Number(row.totalDueToDate),
      0
    );
    return [
      {
        name: 'Total',
        toPayAtWeekend: toPayTotal,
        weeklyTotal: total,
        isFooter: true,
      },
    ];
  }, [rowData]);

  return (
    <div className="h-full space-y-4">
      <div className="text-2xl font-bold hidden lg:block">
        Week of <span>{formatDate(data?.startDate)}</span>
      </div>
      <div className="text-xl font-semibold text-gray-900">
        This Week's Attendance
      </div>
      <div className="h-120 sm:h-200 overflow-auto create-order ag-theme-alpine cell-border">
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
