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

      if (!response.ok) {
        return { city: "", street: "" };
      }

      const data = await response.json();
      const features = Array.isArray(data.features) ? data.features : [];

      let city = "";
      let street = "";

      for (const feature of features) {
        if (!city && Array.isArray(feature.context)) {
          const placeContext = feature.context.find(
            (item: { id?: string; name?: string }) =>
              item.id?.startsWith("place") || item.id?.startsWith("locality")
          );

          if (placeContext?.name) {
            city = placeContext.name;
          }
        }

        if (!street) {
          if (feature.feature_type === "street" && feature.properties?.name) {
            street = feature.properties.name;
          } else if (feature.properties?.name) {
            street = feature.properties.name;
          }
        }

        if (city && street) break;
      }

      return { city, street };
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      return { city: "", street: "" };
    }
  }

  async function updateUserLocationOnMap() {
    if (!mapRef.current) return;

    if (!navigator.geolocation) {
      onLocationError("הדפדפן לא תומך במיקום");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        userCoordsRef.current = { latitude, longitude };

        mapRef.current?.flyTo({
          center: [longitude, latitude],
          zoom: 16,
          essential: true,
        });

        if (!userMarkerRef.current) {
          userMarkerRef.current = new mapboxgl.Marker({
            color: "#facc15",
            scale: 1.05,
          })
            .setLngLat([longitude, latitude])
            .addTo(mapRef.current!);
        } else {
          userMarkerRef.current.setLngLat([longitude, latitude]);
        }

        const { city, street } = await reverseGeocode(latitude, longitude);

        onLocationResolved({
          latitude,
          longitude,
          city,
          street,
        });
      },
      (error) => {
        console.error("Geolocation error:", error);
        onLocationError("לא התקבלה הרשאת מיקום");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }

  useEffect(() => {
    if (!mapContainer.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      console.error("Missing Mapbox token. Set NEXT_PUBLIC_MAPBOX_TOKEN in .env.local.");
      onLocationError("חסר טוקן של Mapbox");
      return;
    }

    mapboxgl.accessToken = token;

    if (!mapboxgl.supported()) {
      console.error("Mapbox GL is not supported in this browser or WebGL is disabled.");
      onLocationError("המפה לא נתמכת בדפדפן הזה");
      return;
    }

    const currentHour = new Date().getHours();
    const lightPreset = getLightPresetByHour(currentHour);

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/standard",
      center: [34.7818, 32.0853],
      zoom: 14,
      config: {
        basemap: {
          lightPreset,
        },
      },
    });

    mapRef.current = map;

    map.on("load", () => {
      map.resize();
      updateUserLocationOnMap();
    });

    map.on("error", (event) => {
      console.error("Mapbox load error:", event.error || event);
    });

    return () => {
      userMarkerRef.current?.remove();
      map.remove();
      mapRef.current = null;
      userMarkerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (recenterTrigger === 0) return;
    updateUserLocationOnMap();
  }, [recenterTrigger]);

  return (
    <div
      ref={mapContainer}
      className="absolute inset-0 z-0 bg-slate-800"
      style={{ minHeight: "100vh", minWidth: "100vw" }}
    />
  );
}