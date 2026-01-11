import { Route, Routes } from 'react-router';

import { SiteAttendanceHome } from './AttendanceHome';
import { CreateSitePage } from './CreateSite';
import { HomePage } from './Home';
import { LabourCreate } from './LabourCreate';
import { LabourHome } from './LabourHome';
import { ManageAttendance } from './ManageAttendace';
import { ManageDay } from './ManageDay/ManageDay.page';
import { ManageLabour } from './ManageLabour';
import { ManageSite } from './ManageSite';

export const App = () => {
  return (
    <Routes>
      <Route index element={<HomePage />} />
      <Route path="create" element={<CreateSitePage />} />
      <Route path=":siteId">
        <Route index element={<ManageSite />} />
        <Route path="weeks">
          <Route index element={<SiteAttendanceHome />} />
          <Route path=":weekId" element={<ManageAttendance />} />
          <Route path=":weekId/days/:dayId" element={<ManageDay />} />
        </Route>
        <Route path="labours">
          <Route index element={<LabourHome />} />
          <Route path="create" element={<LabourCreate />} />
          <Route path=":labourId" element={<ManageLabour />} />
        </Route>
      </Route>
    </Routes>
  );
};
