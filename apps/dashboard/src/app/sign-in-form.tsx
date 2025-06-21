'use client';

import type { FormEventHandler } from 'react';
import { signIn } from 'next-auth/react';
import { Button, Input } from '@bunpeg/ui';

export default function SignInForm() {
  const handleLogin: FormEventHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = e.currentTarget.email.value;
    void signIn('email', { email, redirect: true });
  }

  return (
    <form onSubmit={handleLogin}>
      <div className="grid gap-4">
        <Input
          id="email"
          type="email"
          placeholder="example@domain.com"
        />
        <Button type="submit" className="w-full">
          Get started
        </Button>
      </div>
    </form>
  );
}
