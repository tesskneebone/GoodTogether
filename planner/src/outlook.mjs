// Outlook calendar access through Microsoft Graph, signing in with the OAuth
// device-code flow (you open a link and enter a code once; the refresh token is
// cached locally after that).

import { readFile, writeFile } from "node:fs/promises";

const GRAPH = "https://graph.microsoft.com/v1.0";
const SCOPES = "offline_access Calendars.ReadWrite";

async function tokenRequest(tenant, params) {
  const res = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });
  return { ok: res.ok, data: await res.json() };
}

export async function getAccessToken({ clientId, tenant = "common" }, cachePath) {
  if (!clientId) {
    throw new Error("Set outlook.clientId in config.json (see planner/README.md for the Azure app setup).");
  }

  try {
    const cached = JSON.parse(await readFile(cachePath, "utf8"));
    const { ok, data } = await tokenRequest(tenant, {
      client_id: clientId,
      grant_type: "refresh_token",
      refresh_token: cached.refresh_token,
      scope: SCOPES,
    });
    if (ok) {
      await writeFile(cachePath, JSON.stringify({ refresh_token: data.refresh_token }), { mode: 0o600 });
      return data.access_token;
    }
  } catch {
    // No cache or expired refresh token: fall through to a fresh sign-in.
  }

  const res = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/devicecode`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, scope: SCOPES }),
  });
  const device = await res.json();
  if (!res.ok) throw new Error(`Outlook sign-in failed: ${device.error_description ?? device.error}`);
  console.log(`\n${device.message}\n`);

  let interval = (device.interval ?? 5) * 1000;
  const deadline = Date.now() + device.expires_in * 1000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, interval));
    const { ok, data } = await tokenRequest(tenant, {
      client_id: clientId,
      grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      device_code: device.device_code,
    });
    if (ok) {
      await writeFile(cachePath, JSON.stringify({ refresh_token: data.refresh_token }), { mode: 0o600 });
      return data.access_token;
    }
    if (data.error === "slow_down") interval += 5000;
    else if (data.error !== "authorization_pending") {
      throw new Error(`Outlook sign-in failed: ${data.error_description ?? data.error}`);
    }
  }
  throw new Error("Outlook sign-in timed out.");
}

async function graph(token, method, url, body) {
  const res = await fetch(url.startsWith("http") ? url : `${GRAPH}${url}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: 'outlook.timezone="UTC"',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Graph ${method} ${url} -> ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.status === 204 ? null : res.json();
}

// Graph returns e.g. "2026-09-28T16:00:00.0000000" in UTC (per the Prefer header).
const parseGraphTime = (t) => Date.parse(`${t.dateTime.slice(0, 19)}Z`);
const toGraphTime = (epoch) => ({ dateTime: new Date(epoch).toISOString().slice(0, 19), timeZone: "UTC" });

/** All events in [start, end), with recurring events expanded. */
export async function fetchEvents(token, start, end) {
  const params = new URLSearchParams({
    startDateTime: new Date(start).toISOString(),
    endDateTime: new Date(end).toISOString(),
    $select: "id,subject,start,end,categories,showAs,isAllDay,isCancelled",
    $top: "200",
  });
  const out = [];
  let url = `/me/calendarView?${params}`;
  while (url) {
    const page = await graph(token, "GET", url);
    for (const e of page.value) {
      out.push({
        id: e.id,
        subject: e.subject ?? "",
        categories: e.categories ?? [],
        showAs: e.showAs,
        isAllDay: e.isAllDay,
        isCancelled: e.isCancelled,
        start: parseGraphTime(e.start),
        end: parseGraphTime(e.end),
      });
    }
    url = page["@odata.nextLink"];
  }
  return out;
}

export async function deleteEvent(token, id) {
  await graph(token, "DELETE", `/me/events/${id}`);
}

export async function createEvent(token, block, category) {
  await graph(token, "POST", "/me/events", {
    subject: block.title,
    body: { contentType: "text", content: block.note ?? "" },
    start: toGraphTime(block.start),
    end: toGraphTime(block.end),
    categories: [category],
    showAs: "busy",
    isReminderOn: block.kind === "commute",
    reminderMinutesBeforeStart: 10,
  });
}
