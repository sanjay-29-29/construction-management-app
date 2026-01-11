import { Route, Routes } from 'react-router';

import { CreateUserPage } from './CreateUser';
import { HomePage } from './Home';
import { ManageUserPage } from './ManageUser';

export const App = () => {
  return (
    <Routes>
      <Route element={<HomePage />} index />
      <Route element={<CreateUserPage />} path="create" />
      <Route element={<ManageUserPage />} path=":id" />
    </Routes>
  );
};
