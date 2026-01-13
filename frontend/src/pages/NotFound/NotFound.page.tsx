import { Link } from 'react-router';

import { Scaffold } from '@/components/Scaffold';
import { Button } from '@/components/ui/button';

export const NotFoundPage = () => {
  return (
    <Scaffold title="Not Found">
      <div className="bg-white flex-1 flex justify-center items-center">
        <div className="flex items-center flex-col gap-4">
          <div className="text-xl text-center font-semibold text-gray-800">
            The page you are looking for is not found. <br />{' '}
            <span className="text-gray-500">404</span>
          </div>
          <Link to="/" replace>
            <Button variant="outline">Go Home</Button>
          </Link>
        </div>
      </div>
    </Scaffold>
  );
};
