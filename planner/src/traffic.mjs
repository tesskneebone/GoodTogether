// Travel-time providers. Both return a `travel(query)` function resolving to
// minutes (or null), as expected by planSchedule.

import { localParts } from "./time.mjs";

const ROUTES_URL = "https://routes.googleapis.com/directions/v2:computeRoutes";

/** Live traffic-aware estimates from the Google Maps Routes API. */
export function googleRoutesTravel(apiKey) {
  return async ({ mode, from, to, departAt, arriveBy }) => {
    const body = {
      origin: { address: from },
      destination: { address: to },
      travelMode: mode === "drive" ? "DRIVE" : "TRANSIT",
    };
    if (mode === "drive") {
      body.routingPreference = "TRAFFIC_AWARE_OPTIMAL";
      body.trafficModel = "BEST_GUESS";
    }
    if (departAt != null) body.departureTime = new Date(departAt).toISOString();
    if (arriveBy != null) body.arrivalTime = new Date(arriveBy).toISOString();

    const res = await fetch(ROUTES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "routes.duration",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Routes API ${res.status}: ${text.slice(0, 300)}`);
    }
    const data = await res.json();
    const duration = data.routes?.[0]?.duration; // e.g. "1834s"
    if (!duration) return null;
    return Math.ceil(parseInt(duration, 10) / 60);
  };
}

/**
 * Made-up LA-style traffic for --demo and tests: a 22 min base drive with a
 * morning peak around 8am and a bigger evening peak around 5:30pm on weekdays.
 */
export function demoTravel(tz) {
  const bump = (hour, center, height, width) => height * Math.exp(-((hour - center) ** 2) / (2 * width ** 2));
  return async ({ mode, departAt, arriveBy }) => {
    const t = departAt ?? arriveBy;
    const p = localParts(tz, t);
    const hour = p.hour + p.minute / 60;
    const weekend = p.weekday === "Sat" || p.weekday === "Sun";
    if (mode === "transit") return weekend ? 60 : 52;
    const rush = weekend ? 0 : bump(hour, 8, 26, 0.9) + bump(hour, 17.5, 38, 1.3);
    return Math.round(22 + rush);
  };
}
