import { google } from "googleapis";
import { decrypt } from "@/lib/encryption";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
];

function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URI!,
  );
}

export function getAuthUrl(state: string): string {
  const oauth2Client = createOAuthClient();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
    state,
  });
}

export async function exchangeCode(
  code: string
): Promise<{ refreshToken: string; calendarId: string }> {
  const oauth2Client = createOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  if (!tokens.refresh_token) throw new Error("No refresh token returned");
  return { refreshToken: tokens.refresh_token, calendarId: "primary" };
}

function getAuthenticatedClient(encryptedToken: string) {
  const oauth2Client = createOAuthClient();
  oauth2Client.setCredentials({ refresh_token: decrypt(encryptedToken) });
  return google.calendar({ version: "v3", auth: oauth2Client });
}

export interface CalendarEventData {
  summary: string;
  description?: string | null;
  startDateTime: string; // ISO 8601 with timezone
  endDateTime: string;
}

export async function createCalendarEvent(
  refreshToken: string,
  calendarId: string,
  event: CalendarEventData
): Promise<string> {
  const calendar = getAuthenticatedClient(refreshToken);
  const res = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: event.summary,
      description: event.description ?? null,
      start: { dateTime: event.startDateTime, timeZone: "Asia/Manila" },
      end: { dateTime: event.endDateTime, timeZone: "Asia/Manila" },
    },
  });
  return (res as { data: { id: string } }).data.id;
}

export async function updateCalendarEvent(
  refreshToken: string,
  calendarId: string,
  eventId: string,
  event: CalendarEventData
): Promise<void> {
  const calendar = getAuthenticatedClient(refreshToken);
  await calendar.events.update({
    calendarId,
    eventId,
    requestBody: {
      summary: event.summary,
      description: event.description ?? null,
      start: { dateTime: event.startDateTime, timeZone: "Asia/Manila" },
      end: { dateTime: event.endDateTime, timeZone: "Asia/Manila" },
    },
  });
}

export async function deleteCalendarEvent(
  refreshToken: string,
  calendarId: string,
  eventId: string
): Promise<void> {
  const calendar = getAuthenticatedClient(refreshToken);
  await calendar.events.delete({ calendarId, eventId });
}

export async function revokeToken(encryptedToken: string): Promise<void> {
  const plainToken = decrypt(encryptedToken);
  const oauth2Client = createOAuthClient();
  oauth2Client.setCredentials({ refresh_token: plainToken });
  await oauth2Client.revokeToken(plainToken);
}
