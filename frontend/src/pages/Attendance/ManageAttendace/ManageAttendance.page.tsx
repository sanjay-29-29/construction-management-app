import { useQuery } from '@tanstack/react-query';
import { Navigate, useParams } from 'react-router';

import { client } from '@/axios';
import { LoaderPage } from '@/components/LoaderPage';
import { Scaffold } from '@/components/Scaffold';
import { formatDate } from '@/lib/utils';
import type { Week } from '@/types';

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

  if (attendanceIsLoading) {
    return <LoaderPage />;
  }

  if (attendanceIsError) {
    return <Navigate to="/sites" replace />;
  }

  return (
    <Scaffold title={`Week of ${formatDate(attendanceData?.startDate)}`}>
      <div className="flex flex-col h-full gap-16">
        <AttendanceGrid data={attendanceData} />
        <LabourContainer
          data={attendanceData?.labours}
          isEditable={attendanceData?.isEditable}
        />
      </div>
    </Scaffold>
  );
};
