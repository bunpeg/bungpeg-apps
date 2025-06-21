import type { Adapter } from 'next-auth/adapters';
import { nanoid } from 'nanoid';

import { db } from './db';

export function PlanetScaleAdapter(): Adapter {
  return {
    createUser: async (data: any) => {
      const userId = nanoid();
      await db.execute<{
        id: string;
        email: string;
        email_verified: Date | null;
        name: string | null;
        image: string | null;
      }>(
        `INSERT INTO user (id, work_email, image, email_verified) VALUES (?, ?, ?, ?)`,
        [userId, data.email, data.image, data.emailVerified],
      );

      return {
        id: userId,
        name: data.name,
        email: data.email,
        image: data.image,
        emailVerified: data.emailVerified ?? null,
      };
    },
    getUser: async (id) => {
      const response = await db.execute<{
        id: string;
        name: string | null;
        email: string;
        image: string | null;
        email_verified: string | null;
        is_admin: number;
        is_manager: number;
        is_root: number;
        organisation_id: string;
        team_id: number | null;
        head_of_team: number | null;
        is_demo: number | null,
      }>(`
        SELECT
          US.id,
          US.name,
          US.work_email as email,
          US.image, US.email_verified,
          US.is_manager,
          US.is_admin,
          US.is_root,
          US.organisation_id,
          US.team_id,
          team.id as head_of_team,
          o.is_demo
        FROM user US
          LEFT JOIN team ON US.id = team.head_of_team_id
          LEFT JOIN organisation o ON US.organisation_id = o.id
        WHERE id = ?`, [id]);

      const user = response.rows[0];

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        emailVerified: user.email_verified ? new Date(user.email_verified) : null,
        is_manager: !!user.is_manager,
        is_admin: !!user.is_admin,
        is_root: !!user.is_root,
        organisation_id: user.organisation_id,
        team_id: user.team_id,
        head_of_team: user.head_of_team,
        is_demo_org: !!user.is_demo,
      };
    },
    getUserByEmail: async (email) => {
      const response = await db.execute<{
        id: string;
        name: string | null;
        email: string;
        image: string | null;
        email_verified: string | null;
        is_admin: number;
        is_manager: number;
        is_root: number;
        organisation_id: string;
        team_id: number | null;
        head_of_team: number | null;
        is_demo: number | null,
      }>(
        `
          SELECT
            US.id,
            US.name,
            US.work_email as email,
            US.image, US.email_verified,
            US.is_manager,
            US.is_admin,
            US.is_root,
            US.organisation_id,
            US.team_id,
            team.id as head_of_team,
            o.is_demo
          FROM user US
          LEFT JOIN team ON US.id = team.head_of_team_id
          LEFT JOIN organisation o ON US.organisation_id = o.id
          WHERE work_email = ?`,
        [email],
      );

      const user = response.rows[0];

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        emailVerified: user.email_verified ? new Date(user.email_verified) : null,
        is_manager: !!user.is_manager,
        is_admin: !!user.is_admin,
        is_root: !!user.is_root,
        organisation_id: user.organisation_id,
        team_id: user.team_id,
        head_of_team: user.head_of_team,
        is_demo_org: !!user.is_demo,
      } as any;
    },
    getUserByAccount: async (provider) => {
      const response = await db.execute<{
        id: string;
        email: string;
        email_verified: Date | null;
        name: string | null;
        image: string | null;
      }>(`
          SELECT
            US.id,
            name,
            US.work_email as email,
            US.image,
            US.email_verified
          FROM user US INNER JOIN account AC ON US.id = AC.user_id
          WHERE AC.provider_account_id = ? AND AC.provider = ?`, [provider.providerAccountId, provider.provider]);

      const user = response.rows[0];

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        emailVerified: user.email_verified ?? null,
      } as any;
    },
    updateUser: async ({ id, ...data }) => {
      await db.execute(`UPDATE user SET email_verified = ? WHERE id = ?`, [data.emailVerified, id]);

      const response = await db.execute<{
        id: string;
        email: string;
        email_verified: Date | null;
        name: string | null;
        image: string | null;
      }>(
        `
        SELECT id,
          work_email as email,
          email_verified,
          name,
          image FROM user WHERE id = ?`,
        [id],
      );

      const user = response.rows[0]!;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        emailVerified: user.email_verified ?? null,
      } as any;
    },
    deleteUser: async (id) => {
      await db.execute(`DELETE FROM user WHERE id = ?`, [id]);
    },
    linkAccount: async (data: any) => {
      await db.execute<{
        id: string;
        type: string;
        provider: string;
        provider_account_id: string;
        user_id: number;
        refresh_token: string;
        access_token: string;
        expires_at: string;
      }>(
        `INSERT
          INTO account (id, type, provider, provider_account_id, user_id, refresh_token, access_token, expires_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [nanoid(), data.type, data.provider, data.providerAccountId, data.userId, data.refresh_token, data.access_token, data.expires_at],
      );
    },
    unlinkAccount: async (data: any) => {
      await db.execute(
        `DELETE FROM account WHERE provider = ? AND provider_account_id = ?`,
        [data.provider, data.providerAccountId],
      );
    },
    getSessionAndUser: async (sessionToken) => {
      const sessionQuery = await db.execute<{
        id: string;
        name: string | null;
        email: string;
        image: string | null;
        email_verified: string | null;
        is_admin: number;
        is_manager: number;
        is_root: number;
        organisation_id: string;
        team_id: number | null;
        expires: string;
        session_token: string;
        head_of_team: number | null;
        is_demo: number | null,
      }>(`
        SELECT
          US.id,
          US.name,
          US.work_email as email,
          US.image, US.email_verified,
          US.is_manager,
          US.is_admin,
          US.is_root,
          US.organisation_id,
          US.team_id,
          SE.expires,
          SE.session_token,
          team.id as head_of_team,
          o.is_demo
        FROM user US
          JOIN session SE ON US.id = SE.user_id
          LEFT JOIN team ON US.id = team.head_of_team_id
          LEFT JOIN organisation o ON US.organisation_id = o.id
        WHERE SE.session_token = ?`, [sessionToken]);

      const userAndSession = sessionQuery.rows[0];

      if (!userAndSession) {
        return null;
      }

      return {
        user: {
          id: userAndSession.id,
          name: userAndSession.name,
          email: userAndSession.email,
          image: userAndSession.image,
          emailVerified: userAndSession.email_verified ? new Date(userAndSession.email_verified) : null,
          is_manager: !!userAndSession.is_manager,
          is_admin: !!userAndSession.is_admin,
          is_root: !!userAndSession.is_root,
          team_id: userAndSession.team_id,
          head_of_team: userAndSession.head_of_team,
          organisation_id: userAndSession.organisation_id,
          is_demo_org: !!userAndSession.is_demo,
        },
        session: { sessionToken, userId: userAndSession.id, expires: new Date(userAndSession.expires) },
      };
    },
    createSession: async (data) => {
      await db.execute(
        `INSERT INTO
          session (id, session_token, user_id, expires)
          VALUES (?, ?, ?, ?)`,
        [nanoid(), data.sessionToken, data.userId, data.expires]
      );

      const response = await db.execute<{ session_token: string; user_id: string; expires: string }>(
        `SELECT session_token, user_id, expires FROM session WHERE session_token = ?`, [data.sessionToken]
      );

      const session =  response.rows[0]!;
      return { userId: session.user_id, sessionToken: session.session_token, expires: new Date(session.expires) };
    },
    updateSession: async (data) => {
      await db.execute(
        `UPDATE session SET expires = ? WHERE session_token = ?`,
        [data.expires, data.sessionToken],
      );

      const response = await db.execute<{ session_token: string; user_id: string; expires: string }>(
        `SELECT session_token, user_id, expires FROM session WHERE session_token = ?`,
        [data.sessionToken],
      );

      const session =  response.rows[0]!;
      return { userId: session.user_id, sessionToken: session.session_token, expires: new Date(session.expires) };
    },
    deleteSession: async (sessionToken) => {
      await db.execute(`DELETE FROM session WHERE session_token = ?`, [sessionToken]);
    },
    createVerificationToken: async (data) => {
      await db.execute(
        `INSERT INTO verification_token (token, identifier, expires) VALUES (?, ?, ?)`,
        [data.token, data.identifier, data.expires],
      );

      const response = await db.execute<{ id: string; token: string; identifier: string; expires: string }>(
        `SELECT id, token, identifier, expires FROM verification_token WHERE token = ?`,
        [data.token],
      );

      const verificationToken = response.rows[0]!;

      return {
        id: verificationToken.id,
        token: verificationToken.token,
        identifier: verificationToken.identifier,
        expires: new Date(verificationToken.expires),
      };
    },
    useVerificationToken: async (data) => {
      const response = await db.execute<{ token: string; identifier: string; expires: Date }>(
        `SELECT token, identifier, expires FROM verification_token WHERE token = ? AND identifier = ?`,
        [data.token, data.identifier],
      );

      const verificationToken = response.rows[0];

      if (!verificationToken) {
        return null;
      }

      await db.execute(`DELETE FROM verification_token WHERE token = ? AND identifier = ?`, [data.token, data.identifier]);

      return verificationToken;
    },
  }
}
