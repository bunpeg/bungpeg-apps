import { nanoid } from 'nanoid';
import { addDays } from 'date-fns';
import { sql, toServerDate } from '@bunpeg/helpers';

interface Params {
  work_email: string;
  baseUrl: string;
  redirectTo: string;
  secret: string;
}

export async function generateAuthByPassLink(params: Params) {
  const { work_email, secret, baseUrl, redirectTo } = params;
  const token = nanoid();
  const hashedToken = await createHash(`${token}${secret}`);
  const today = new Date();
  const expires = addDays(today, 1);

  const tokenQuery = await sql`
    INSERT INTO verification_token (token, identifier, expires)
    VALUES (${hashedToken}, ${work_email}, ${toServerDate(expires)})`;

  if (!tokenQuery.rowsAffected) {
    return '/not-allowed';
  }

  const authURL = new URL(`/api/auth/callback/resend`, baseUrl);
  authURL.searchParams.set('token', token);
  authURL.searchParams.set('email', work_email);
  authURL.searchParams.set('callbackUrl', `${baseUrl}${redirectTo}`);

  return authURL.toString();
}

export async function createHash(message: string) {
  const data = new TextEncoder().encode(message)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toString()
}
