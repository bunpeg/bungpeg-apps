'use client'
import { type ReactNode } from 'react';
import Image from 'next/image';
import { useMediaQuery } from '@bunpeg/ui/hooks';

interface Props {
  children: ReactNode;
}

const query = '(max-width: 768px)';

const ViewSizeGuard = (props: Props) => {
  const matches = useMediaQuery(query);

  return (
    <>
      {matches ? (
        <div className="px-10 bg-background mx-auto flex flex-col items-center justify-center">
          <Image src="/undraw_mobile-devices.svg" width={320} height={280} alt="no mobile support" />
          <h2 className="text text-4xl text-center font-semibold my-6">
            No small screen support.
          </h2>
          <span className="text text-center mb-5">
            We currently do not support small screens, we are working on it. <br className="hidden md:inline" />
            Please use a desktop device to access the platform.
          </span>
        </div>
      ) : props.children}
    </>
  );
};

export default ViewSizeGuard;
