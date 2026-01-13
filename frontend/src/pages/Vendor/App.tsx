import { Route, Routes } from 'react-router';

import { CreateOrderPage } from './CreateOrder';
import { CreateVendorPage } from './CreateVendor';
import { HomePage } from './Home';
import { ManageVendorPage } from './ManangeVendor';

export const App = () => {
  return (
    <Routes>
      <Route element={<HomePage />} index />
      <Route element={<CreateVendorPage />} path="create" />
      <Route element={<ManageVendorPage />} path=":vendorId" />
      <Route element={<CreateOrderPage />} path=":vendorId/order" />
    </Routes>
  );
};
