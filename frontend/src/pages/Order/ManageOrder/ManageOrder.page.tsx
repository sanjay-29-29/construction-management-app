import { useQuery } from '@tanstack/react-query';
import { useParams, Navigate } from 'react-router';

import { client } from '@/axios';
import { LoaderPage } from '@/components/LoaderPage';
import { Scaffold } from '@/components/Scaffold';
import type { Order } from '@/types';

import {
  OrderCardContainer,
  OrderImage,
  OrderMaterialGridContainer,
} from './containers';

export const ManageOrderPage = () => {
  const { id } = useParams();

  const {
    data: order,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['orders', id],
    queryFn: async () => {
      const response = await client.get<Order>(`orders/${id}/`);
      return response.data;
    },
  });

  if (!isError && isLoading) return <LoaderPage />;

  if (isError) return <Navigate to="/" replace />;

  return (
    <Scaffold title="Manage Order">
      <div className="p-4 flex flex-col gap-16">
        <OrderCardContainer order={order} />
        <OrderMaterialGridContainer order={order} />
        <OrderImage order={order} />
      </div>
    </Scaffold>
  );
};
