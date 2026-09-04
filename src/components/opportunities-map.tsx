"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Link from "next/link";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { CATEGORY_LABELS, LA_MAP_CENTER, NEIGHBORHOOD_COORDS } from "@/lib/constants";
import type { Opportunity } from "@/types/database";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export function OpportunitiesMap({ opportunities }: { opportunities: Opportunity[] }) {
  const byNeighborhood = new Map<string, Opportunity[]>();
  for (const opp of opportunities) {
    const coords = NEIGHBORHOOD_COORDS[opp.neighborhood];
    if (!coords) continue;
    const existing = byNeighborhood.get(opp.neighborhood) ?? [];
    existing.push(opp);
    byNeighborhood.set(opp.neighborhood, existing);
  }

  return (
    <div className="h-[600px] overflow-hidden rounded-xl border border-stone-200">
      <MapContainer
        center={LA_MAP_CENTER}
        zoom={10}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {Array.from(byNeighborhood.entries()).map(([neighborhood, opps]) => (
          <Marker
            key={neighborhood}
            position={NEIGHBORHOOD_COORDS[neighborhood]}
            icon={markerIcon}
          >
            <Popup>
              <div className="max-w-xs">
                <p className="font-semibold text-stone-900">{neighborhood}</p>
                <ul className="mt-1 space-y-1">
                  {opps.map((opp) => (
                    <li key={opp.id}>
                      <Link
                        href={`/opportunities/${opp.id}`}
                        className="text-sm text-brand-700 hover:underline"
                      >
                        {opp.title}
                      </Link>
                      <span className="text-xs text-stone-500">
                        {" "}
                        &middot; {CATEGORY_LABELS[opp.category]}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
