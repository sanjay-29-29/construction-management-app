import { useQuery } from '@tanstack/react-query';
import { Navigate, useParams } from 'react-router';

import { client } from '@/axios';
import { LoaderPage } from '@/components/LoaderPage';
import { Scaffold } from '@/components/Scaffold';
import { formatDate } from '@/lib/utils';
import type { Labour, Week } from '@/types';

import { AttendanceGrid } from './containers/AttendanceGrid.container';
import { LabourContainer } from './containers/Labours.container';


export const ManageAttendance = () => {
  const { siteId, weekId } = useParams();

  const {
    data: attendanceData,
    isLoading: attendanceIsLoading,
    isError: attendanceIsError,
  } = useQuery({
    queryKey: ['sites', siteId, 'weeks', weekId],
    queryFn: async () => {
      const response = await client.get<Week>(
        `sites/${siteId}/weeks/${weekId}/`
      );
      return response.data;
    },
  });

  const {
    data,
    isLoading,
    isError: labourIsError,
  } = useQuery({
    queryKey: ['sites', siteId, 'weeks', weekId, 'labours'],
    queryFn: async () => {
      const response = await client.get<Labour[]>(
        `sites/${siteId}/weeks/${weekId}/labours/`
      );
      return response.data;
    },
  });

  if (attendanceIsError || labourIsError)
    return <Navigate to="/sites" replace />;

  if (
    (!attendanceIsError && attendanceIsLoading) ||
    (!labourIsError && isLoading)
  ) {
    return <LoaderPage />;
  }

  return (
    <Scaffold title={`Week of ${formatDate(attendanceData?.startDate)}`}>
      <div className="flex flex-col h-full p-4 gap-10">
        <AttendanceGrid data={attendanceData} />
        <LabourContainer data={data} siteId={siteId} weekId={weekId} />
      </div>
    </Scaffold>
  );
};
