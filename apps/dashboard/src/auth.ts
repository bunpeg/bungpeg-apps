import NextAuth, { type DefaultSession } from 'next-auth';
import Resend from 'next-auth/providers/resend';
// import { generateAuthByPassLink, PlanetScaleAdapter, sql } from '@hr-hub/helpers';

import { env } from '@/env';
import { PsqlAdapter } from '@/utils/psql-adapter';

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      name: string;
      email: string;
    } & DefaultSession['user'];
  }

  interface User {
  }
}

export const { handlers, auth } = NextAuth({
  adapter: PsqlAdapter() as any,
  callbacks: {
    // signIn: async ({ user, email }) => {
    //   const query = await sql<{ work_email: string; is_demo: number; domain: string; organisation_id: string }>`
    //       SELECT user.work_email, o.is_demo, o.domain, user.organisation_id
    //       FROM user
    //       JOIN organisation o ON o.id = user.organisation_id
    //       WHERE user.work_email = ${user.email} AND user.is_admin = true AND user.is_active = true`;
    //
    //   const dbUser = query.rows[0];
    //   if (!dbUser) return '/not-allowed';
    //
    //   if (email?.verificationRequest) {
    //     if (dbUser.is_demo) {
    //       return await generateAuthByPassLink({
    //         work_email: dbUser.work_email,
    //         secret: env.NEXTAUTH_SECRET,
    //         baseUrl: env.NEXTAUTH_URL,
    //         redirectTo: '/team',
    //       });
    //     }
    //
    //     const featureFlags = await fetchFeatureFlags(dbUser.organisation_id);
    //     if (!featureFlags.check_domain) return true;
    //
    //     const [_, userDomain] = user.email!.split('@');
    //     return dbUser.domain === userDomain ? true : '/not-allowed';
    //   }
    //
    //   return true;
    // },
    // session: ({ session, user }) => {
    //   return {
    //     ...session,
    //     user: {
    //       ...session.user,
    //       id: user.id,
    //       is_admin: user.is_admin,
    //       organisation_id: user.organisation_id,
    //       is_demo_org: user.is_demo_org,
    //     },
    //   };
    // },
  },
  pages: {
    signIn: '/team',
    verifyRequest: '/verify-email',
    error: '/?sign-in-error=true',
  },
  providers: [
    Resend({
      // If your environment variable is named differently than default
      apiKey: 'EMPTY_API_KEY',
      from: 'no-reply@company.com',
      // sendVerificationRequest: async (params) => {
      //   const { identifier, url } = params;
      //   await sendVerificationEmail({
      //     url,
      //     email: identifier,
      //   });
      // },
    }),
  ],
})
