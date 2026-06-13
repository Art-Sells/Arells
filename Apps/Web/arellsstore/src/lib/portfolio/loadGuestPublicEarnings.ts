import { getSessionFromAppCookies } from '../auth/session';
import { fetchPublicEarningsServer } from './fetchPublicEarningsServer';

export async function loadGuestPublicEarnings() {
  const session = await getSessionFromAppCookies();
  if (session) return null;
  return fetchPublicEarningsServer();
}
