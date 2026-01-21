import { Edit, MapPin, Trash, UserCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/context/Auth';
import type { Site } from '@/types';

import type { Dispatch, SetStateAction } from 'react';

export const SiteCard = ({
  site,
  setSiteUpdateDialog,
  setSiteDeleteDialog,
}: {
  site?: Site;
  setSiteUpdateDialog: Dispatch<SetStateAction<boolean>>;
  setSiteDeleteDialog: Dispatch<SetStateAction<boolean>>;
}) => {
  const { isHeadOffice } = useAuth();

  return (
    <Card className="border-l-4 border-l-blue-600 gap-0 shadow-none">
      <CardHeader className="pb-4 px-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap justify-between">
              <CardTitle className="text-lg sm:text-xl truncate">
                {site?.name}
              </CardTitle>
              <Badge
                className={`shrink-0 ${
                  site?.isActive
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-green-100 text-green-600'
                }`}
              >
                {site?.isActive ? 'Active' : 'Completed'}
              </Badge>
            </div>
            <CardDescription className="flex items-start gap-2 mt-2">
              <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-gray-500" />
              <span className="text-sm leading-relaxed wrap-break-words">
                {site?.address}
              </span>
            </CardDescription>
          </div>
          {isHeadOffice && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0 border-gray-300 hover:bg-gray-100"
                onClick={() => setSiteUpdateDialog(true)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0 border-red-300 hover:bg-red-100 text-red-600 hover:text-red-600"
                onClick={() => setSiteDeleteDialog(true)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pb-4">
        {/* Supervisors Display */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <UserCircle className="h-4 w-4 text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-900">
              Supervisors ({site?.supervisors ? site.supervisors.length : 0})
            </h3>
          </div>
          {site?.supervisors && site?.supervisors.length === 0 ? (
            <p className="text-sm text-gray-500 italic">
              No supervisors assigned
            </p>
          ) : (
            <div className="space-y-3">
              {site?.supervisors &&
                site?.supervisors.map((supervisor) => (
                  <div
                    key={supervisor.firstName}
                    className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <UserCircle className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">
                          {supervisor.firstName} {supervisor.lastName}
                        </p>
                        <p className="text-xs text-gray-600 mt-1 break-all">
                          {supervisor.phone}
                        </p>
                        <p className="text-xs text-gray-600 truncate">
                          {supervisor.email}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
