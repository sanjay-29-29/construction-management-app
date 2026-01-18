import { ArrowLeft, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router';

import logo from '@/assets/logo.jpeg';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/Auth';
import { cn } from '@/lib/utils';

import type { ScaffoldType } from './Scaffold.type';

export const Scaffold = ({ children, title, disablePadding }: ScaffoldType) => {
  const navigate = useNavigate();
  const { user, isHeadOffice, logout } = useAuth();

  return (
    <div className="flex min-h-dvh flex-col bg-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            {/* Mobile Back Button */}
            <button
              className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 lg:hidden"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5 text-gray-900" />
            </button>

            {/* Desktop Logo/Brand */}
            <div className="hidden lg:block w-36">
              <img src={logo} />
            </div>

            {/* Title */}
            <h1 className="text-lg font-semibold text-gray-900 lg:hidden">
              {title}
            </h1>

            {/* Desktop Navigation - Left aligned after logo */}
            <nav className="hidden lg:flex items-center gap-1 ml-8">
              <Link
                to="/"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Home
              </Link>
              {isHeadOffice && (
                <>
                  <Link
                    to="/sites"
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Sites
                  </Link>
                  <Link
                    to="/vendors"
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Vendors
                  </Link>
                  <Link
                    to="/users"
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Users
                  </Link>
                </>
              )}
            </nav>
          </div>

          {/* Right Section - User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="items-center gap-3 hover:bg-gray-100 rounded-lg p-1.5 transition-colors hidden lg:flex">
                <Avatar className="h-9 w-9 lg:h-10 lg:w-10 border border-gray-200">
                  <AvatarFallback>
                    {user?.firstName.charAt(0).toLocaleUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user?.role}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Page Content */}
      <main
        className={cn(
          'mx-auto w-full max-w-7xl flex-1 flex flex-col',
          disablePadding ? null : 'p-4 sm:p-6 lg:p-8'
        )}
      >
        {children}
      </main>
    </div>
  );
};
