import { Spinner } from '@/components/ui/spinner';

export const LoaderPage = () => {
  return (
    <div className="items-center flex justify-center h-dvh">
      <Spinner className="size-15" />
    </div>
  );
};
