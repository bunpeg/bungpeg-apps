import type { Adapter } from 'next-auth/adapters';
import { sql } from '@vercel/postgres';
import { nanoid } from 'nanoid';

export function PsqlAdapter(): Adapter {
  return {
    createUser: async (data: any) => {
      const response = await sql<{
        id: string;
        email: string;
        email_verified: string | null;
        name: string;
        image: string;
        is_setup: boolean;
      }>`
        INSERT INTO users (id, name, email, image, email_verified)
        VALUES (${nanoid()}, ${data.name}, ${data.email}, ${data.image}, ${data.emailVerified ? data.emailVerified.toDateString() : null})
        RETURNING id, email, email_verified, name, image, is_setup`;

      const user = response.rows[0]!;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        isSetup: user.is_setup,
        emailVerified: user.email_verified ? new Date(user.email_verified) : null,
      };
    },
    getUser: async (id) => {
      const response = await sql<{
        id: string;
        email: string;
        email_verified: string | null;
        name: string;
        image: string;
        is_setup: boolean;
      }>`
        SELECT id, email, email_verified, name, image, is_setup FROM users WHERE id = ${id}`;

      const user = response.rows[0];

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        isSetup: user.is_setup,
        emailVerified: user.email_verified ? new Date(user.email_verified) : null,
      };
    },
    getUserByEmail: async (email) => {
      const response = await sql<{
        id: string;
        email: string;
        email_verified: string | null;
        name: string;
        image: string;
        is_setup: boolean;
      }>`
        SELECT id, email, email_verified, name, image, is_setup FROM users WHERE email = ${email}`;

      const user = response.rows[0];

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        isSetup: user.is_setup,
        emailVerified: user.email_verified ? new Date(user.email_verified) : null,
      };
    },
    getUserByAccount: async (provider) => {
      const response = await sql<{
        id: string;
        email: string;
        email_verified: string;
        name: string;
        image: string;
        is_setup: boolean;
      }>`
          SELECT US.id, US.name, US.email, US.image, US.email_verified, US.is_setup
          FROM users US INNER JOIN accounts AC ON US.id = AC.user_id
          WHERE AC.provider_account_id = ${provider.providerAccountId} AND AC.provider = ${provider.provider}`;

      const user = response.rows[0];

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        isSetup: user.is_setup,
        emailVerified: user.email_verified ? new Date(user.email_verified) : null,
      };
    },
    updateUser: async ({ id, ...data }) => {
      const response = await sql<{
        id: string;
        email: string;
        email_verified: string;
        name: string;
        image: string;
        is_setup: boolean;
      }>`
        UPDATE users SET email_verified = ${data.emailVerified ? data.emailVerified.toDateString() : null}
        WHERE id = ${id}
        RETURNING id, email, email_verified, name, image, is_setup`;

      const user = response.rows[0]!;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        isSetup: user.is_setup,
        emailVerified: user.email_verified ? new Date(user.email_verified) : null,
      };
    },
    deleteUser: async (id) => {
      await sql`DELETE FROM users WHERE id = ${id}`;
    },
    linkAccount: async (data: any) => {
      await sql<{
        id: string;
        type: string;
        provider: string;
        provider_account_id: string;
        user_id: number;
        refresh_token: string;
        access_token: string;
        expires_at: string;
      }>`
        INSERT INTO accounts (id, type, provider, provider_account_id, user_id, refresh_token, access_token, expires_at)
        VALUES (${nanoid()}, ${data.type}, ${data.provider}, ${data.providerAccountId}, ${data.userId}, ${data.refresh_token}, ${data.access_token}, ${data.expires_at})`;
    },
    unlinkAccount: async (data) => {
      await sql`DELETE FROM accounts WHERE provider = ${data.provider} AND provider_account_id = ${data.providerAccountId}`;
    },
    getSessionAndUser: async (sessionToken) => {
      const sessionQuery = await sql<{
        id: string;
        name: string;
        email: string;
        email_verified: string | null;
        image: string | null;
        is_setup: boolean;
        expires: string;
        session_token: string;
      }>`
        SELECT US.id, US.name, US.email, US.image, US.is_setup, US.email_verified, SE.expires, SE.session_token
        FROM users US
          INNER JOIN sessions SE ON US.id = SE.user_id
        WHERE SE.session_token = ${sessionToken}`;

      const userAndSession = sessionQuery.rows[0];

      if (!userAndSession) {
        return null;
      }

      const {
        id,
        name,
        email,
        email_verified,
        image,
        expires,
        is_setup,
      } = userAndSession;
      return {
        user: {
          id,
          name,
          email,
          image,
          isSetup: is_setup,
          emailVerified: email_verified ? new Date(email_verified) : null,
        },
        session: { sessionToken, userId: id, expires: new Date(expires) },
      };
    },
    createSession: async (data) => {
      const response = await sql<{ session_token: string; user_id: string; expires: string }>`
        INSERT INTO sessions (id, session_token, user_id, expires)
        VALUES (${nanoid()}, ${data.sessionToken}, ${data.userId}, ${data.expires.toDateString()})
        RETURNING session_token, user_id, expires`;

      const session =  response.rows[0]!;
      return { userId: session.user_id, sessionToken: session.session_token, expires: new Date(session.expires) };
    },
    updateSession: async (data) => {
      const response = await sql<{ session_token: string; user_id: string; expires: string }>`
        UPDATE sessions SET expires = ${data.expires ? data.expires.toDateString() : null}
        WHERE session_token = ${data.sessionToken}
        RETURNING session_token, user_id, expires`;

      const session =  response.rows[0]!;
      return { userId: session.user_id, sessionToken: session.session_token, expires: new Date(session.expires) };
    },
    deleteSession: async (sessionToken) => {
      const client = await sql.connect();
      await client.sql`DELETE FROM sessions WHERE session_token = ${sessionToken}`;
    },
    createVerificationToken: async (data) => {
      const response = await sql<{ id: string; token: string; identifier: string; expires: string }>`
        INSERT INTO verification_tokens (token, identifier, expires)
        VALUES (${data.token}, ${data.identifier}, ${data.expires.toLocaleDateString()})
        RETURNING token, identifier, expires`;

      const verificationToken = response.rows[0]!;

      return {
        token: verificationToken.token,
        identifier: verificationToken.identifier,
        expires: new Date(verificationToken.expires),
      };
    },
    useVerificationToken: async (data) => {
      const client = await sql.connect();
      const verificationToken = (
        await client.sql<{ token: string; identifier: string; expires: Date }>`
          SELECT token, identifier, expires FROM verification_tokens
          WHERE token = ${data.token} AND identifier = ${data.identifier}`
      ).rows[0];

      if (!verificationToken) {
        client.release();
        return null;
      }

      await client.sql`DELETE FROM verification_tokens WHERE token = ${data.token} AND identifier = ${data.identifier}`;

      return verificationToken;
    },
  }
}
