import { Route, Routes } from 'react-router';

import { ManageOrderPage } from './ManageOrder';

export const App = () => {
  return (
    <Routes>
      <Route element={<ManageOrderPage />} path=":id" />
    </Routes>
  );
};
