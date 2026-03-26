"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

type ResolvedLocation = {
  latitude: number;
  longitude: number;
  city: string;
  street: string;
};

type MapViewProps = {
  recenterTrigger: number;
  onLocationResolved: (data: ResolvedLocation) => void;
  onLocationError: (message: string) => void;
};

function getLightPresetByHour(hour: number): "day" | "dusk" | "night" {
  if (hour >= 6 && hour < 18) return "day";
  if (hour >= 18 && hour < 20) return "dusk";
  return "night";
}

export default function MapView({
  recenterTrigger,
  onLocationResolved,
  onLocationError,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const userCoordsRef = useRef<{ latitude: number; longitude: number } | null>(null);

  async function reverseGeocode(latitude: number, longitude: number) {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return { city: "", street: "" };

    try {
      const response = await fetch(
        `https://api.mapbox.com/search/geocode/v6/reverse?longitude=${longitude}&latitude=${latitude}&language=he&access_token=${token}`
      );

      const data = await response.json();
      const features = Array.isArray(data.features) ? data.features : [];

      let street = "";

      for (const feature of features) {
        if (!street && feature.properties?.name) {
          street = feature.properties.name;
        }
      }

      return { city: "", street };
    } catch {
      return { city: "", street: "" };
    }
  }

  async function updateUserLocationOnMap() {
    if (!mapRef.current) return;

    navigator.geolocation.getCurrentPosition(async (position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      userCoordsRef.current = { latitude, longitude };

      moveToLocation(latitude, longitude);

      const { city, street } = await reverseGeocode(latitude, longitude);

      onLocationResolved({
        latitude,
        longitude,
        city,
        street,
      });
    });
  }

  function moveToLocation(latitude: number, longitude: number) {
    mapRef.current?.flyTo({
      center: [longitude, latitude],
      zoom: 17,
      essential: true,
    });

    if (!userMarkerRef.current) {
      const el = document.createElement("div");
      el.className = "user-location-marker";

      userMarkerRef.current = new mapboxgl.Marker({
        element: el,
        anchor: "center",
      })
        .setLngLat([longitude, latitude])
        .addTo(mapRef.current!);
    } else {
      userMarkerRef.current.setLngLat([longitude, latitude]);
    }
  }

  useEffect(() => {
    mapboxgl.setRTLTextPlugin(
      "https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.2.3/mapbox-gl-rtl-text.js",
      null,
      true
    );

    if (!mapContainer.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/standard",
      center: [34.7818, 32.0853],
      zoom: 14,
      config: {
        basemap: {
          lightPreset: getLightPresetByHour(new Date().getHours()),
          language: "he",
        },
      },
    });

    mapRef.current = map;

    map.on("load", () => {
      updateUserLocationOnMap();
    });

    return () => {
      map.remove();
    };
  }, []);

  useEffect(() => {
    if (!userCoordsRef.current) return;

    // 🔥 פה הקסם — חוזר מיד בלי GPS
    moveToLocation(
      userCoordsRef.current.latitude,
      userCoordsRef.current.longitude
    );
  }, [recenterTrigger]);

  return (
    <div
      ref={mapContainer}
      className="absolute inset-0 z-0"
      style={{ minHeight: "100vh", minWidth: "100vw" }}
    />
  );
}