import { Building2, LogOut, Store, UserRound } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import { ItemCard } from '@/components/ItemCard';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
} from '@/components/ui/alert-dialog';
import { ROLES } from '@/constants/role.constants';
import { useAuth } from '@/context/Auth';

export const HomePage = () => {
  const { user, clearAuth } = useAuth();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const navigate = useNavigate();

  const logout = async () => {
    clearAuth();
    toast.success('Logged out successfully.');
    navigate('/login', { replace: true });
  };

  return (
    <div>
      <div className="relative">
        <div className="py-32 px-10 space-y-4 flex flex-col rounded-b-lg bg-gray-100">
          <div className="text-center line-clamp-2 text-4xl">{`Welcome, ${user?.firstName}`}</div>
          <div className="text-center">{user?.role}</div>
        </div>
        <button
          className="rounded-full active:bg-red-200 hover:bg-red-100 absolute top-0 m-5 p-2"
          onClick={() => setIsLogoutDialogOpen(true)}
        >
          <LogOut className="w-5 h-5 text-red-500" />
        </button>
      </div>
      <div className="h-full py-8 px-2 flex flex-col space-y-4">
        <ItemCard
          title="Sites"
          description="View and manage sites"
          to="/sites"
          icon={
            <div className="bg-blue-100 p-2 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
          }
        />
        {user?.role === ROLES.HEAD_OFFICE && (
          <>
            <ItemCard
              title="Vendors"
              description="View and manage vendors"
              to="/vendors"
              icon={
                <div className="bg-violet-100 p-2 rounded-lg">
                  <Store className="h-6 w-6 text-violet-600" />
                </div>
              }
            />
            <ItemCard
              title="Users"
              description="View and manage users"
              to="/users"
              icon={
                <div className="bg-green-100 p-2 rounded-lg">
                  <UserRound className="h-6 w-6 text-green-600" />
                </div>
              }
            />
          </>
        )}
      </div>
      <AlertDialog
        open={isLogoutDialogOpen}
        onOpenChange={setIsLogoutDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogDescription className="text-center grid gap-4">
              Are you sure you want to logout.
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={logout}
              >
                Logout
              </AlertDialogAction>
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
