"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";
import { Ship, Plane, Truck } from "lucide-react";

export interface MapPoint {
  lat: number;
  lng: number;
  label: string;
}

// Build a gently-curved set of points between a and b (quadratic bezier) so the
// route reads as an arc rather than a straight rhumb line.
function arc(a: MapPoint, b: MapPoint): [number, number][] {
  const mid: [number, number] = [(a.lat + b.lat) / 2 + Math.abs(a.lng - b.lng) * 0.12, (a.lng + b.lng) / 2];
  const pts: [number, number][] = [];
  for (let t = 0; t <= 1.0001; t += 0.05) {
    const lat = (1 - t) * (1 - t) * a.lat + 2 * (1 - t) * t * mid[0] + t * t * b.lat;
    const lng = (1 - t) * (1 - t) * a.lng + 2 * (1 - t) * t * mid[1] + t * t * b.lng;
    pts.push([lat, lng]);
  }
  return pts;
}

/** Realistic interactive map (Leaflet + CARTO/OSM tiles) with origin→destination arc. */
export function MapPreview({
  origin,
  destination,
  transitDays,
  mode = "ocean",
  className,
}: {
  origin?: MapPoint;
  destination?: MapPoint;
  transitDays?: number;
  mode?: "ocean" | "air" | "truck";
  className?: string;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const Icon = mode === "air" ? Plane : mode === "truck" ? Truck : Ship;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !elRef.current) return;
      // tear down any prior instance (StrictMode / prop change)
      if (mapRef.current) {
        (mapRef.current as { remove: () => void }).remove();
        mapRef.current = null;
      }
      const map = L.map(elRef.current, { zoomControl: true, attributionControl: true, scrollWheelZoom: false });
      mapRef.current = map;
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 18,
        subdomains: "abcd",
        attribution: "© OpenStreetMap © CARTO",
      }).addTo(map);

      const pin = (color: string) =>
        L.divIcon({
          className: "",
          html: `<span style="display:block;width:14px;height:14px;border-radius:9999px;background:${color};box-shadow:0 0 0 4px ${color}33;border:2px solid white"></span>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });

      const pts: [number, number][] = [];
      if (origin) {
        L.marker([origin.lat, origin.lng], { icon: pin("#2563eb") }).addTo(map).bindTooltip(origin.label, { direction: "top" });
        pts.push([origin.lat, origin.lng]);
      }
      if (destination) {
        L.marker([destination.lat, destination.lng], { icon: pin("#0ea5b7") }).addTo(map).bindTooltip(destination.label, { direction: "top" });
        pts.push([destination.lat, destination.lng]);
      }
      if (origin && destination) {
        const line = arc(origin, destination);
        L.polyline(line, { color: "#2563eb", weight: 2.5, opacity: 0.85, dashArray: "1 8", lineCap: "round" }).addTo(map);
        map.fitBounds(line as [number, number][], { padding: [38, 38] });
      } else if (pts.length === 1) {
        map.setView(pts[0], 4);
      } else {
        map.setView([25, 0], 1);
      }
      // ensure tiles lay out after mount
      setTimeout(() => map.invalidateSize(), 60);
    })();
    return () => {
      cancelled = true;
      if (mapRef.current) {
        (mapRef.current as { remove: () => void }).remove();
        mapRef.current = null;
      }
    };
  }, [origin?.lat, origin?.lng, destination?.lat, destination?.lng]);

  return (
    <div className={cn("relative h-72 overflow-hidden rounded-xl border", className)}>
      <div ref={elRef} className="absolute inset-0 z-0" />
      {transitDays != null && (
        <div className="pointer-events-none absolute bottom-3 left-1/2 z-[500] flex -translate-x-1/2 items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground shadow">
          <Icon className="size-3.5" /> {transitDays} days transit
        </div>
      )}
    </div>
  );
}
