import { Route, Routes } from 'react-router';

import {
  SiteAttendanceHome,
  ManageAttendance,
  ManageDay,
  PaymentPage,
} from '@/pages/Attendance';
import { LabourHome, LabourCreate, ManageLabour, RateWorkHome } from '@/pages/Labour';

import { CreateSitePage } from './CreateSite';
import { HomePage } from './Home';
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
          <Route path=":weekId/payment" element={<PaymentPage />} />
          <Route path=":weekId/days/:dayId" element={<ManageDay />} />
        </Route>
        <Route path="labours">
          <Route index element={<LabourHome />} />
          <Route path="create" element={<LabourCreate />} />
          <Route path="rate-work" element={<RateWorkHome />} />
          <Route path=":labourId" element={<ManageLabour />} />
        </Route>
      </Route>
    </Routes>
  );
};
