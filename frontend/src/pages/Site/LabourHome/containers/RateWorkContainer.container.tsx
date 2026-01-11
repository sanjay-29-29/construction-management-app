// import { client } from '@/axios';
// import { Button } from '@/components/ui/button';
// import { useQuery } from '@tanstack/react-query';
// import * as z from 'zod';
// import { PlusIcon } from 'lucide-react';
// import { useParams } from 'react-router';

// const rateWork = z.object({
//   name: z.string().min(1, { error: 'Enter a valid work name.' }),
//   gender: z.number(),
// });

export const RateWorkContainer = () => {
  // const { siteId, labourId } = useParams();

  // const { data, isLoading, isError } = useQuery({
  //   queryKey: ['sites', siteId, 'labours', labourId, 'rate-work'],
  //   queryFn: async () => {
  //     const response = await client.get(
  //       `sites/${siteId}/labours/${labourId}/rate-work/`
  //     );
  //     return response.data;
  //   },
  // });

  return (
    <></>
    // <div>
    //   <div className="flex justify-between items-center">
    //     <div className="text-xl font-semibold">Rate Work</div>
    //     <Button variant="outline">
    //       <PlusIcon /> Add Work
    //     </Button>
    //   </div>
    // </div>
  );
};
