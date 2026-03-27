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

type ReportItem = {
  id: string;
  latitude: number;
  longitude: number;
  city: string;
  street: string;
  type: string;
  description: string;
  imageName: string | null;
  createdAt: string;
};

type MapTheme = "light" | "dark";

type MapViewProps = {
  recenterTrigger: number;
  mapTheme: MapTheme;
  onLocationResolved: (data: ResolvedLocation) => void;
  onLocationError: (message: string) => void;
  reports?: ReportItem[];
  onDeleteReport?: (reportId: string) => void;
};

function getBasemapPreset(theme: MapTheme): "day" | "night" {
  return theme === "dark" ? "night" : "day";
}

export default function MapView({
  recenterTrigger,
  mapTheme,
  onLocationResolved,
  onLocationError,
  reports = [],
  onDeleteReport,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const userCoordsRef = useRef<{ latitude: number; longitude: number } | null>(
    null
  );
  const reportMarkersRef = useRef<mapboxgl.Marker[]>([]);

  async function reverseGeocode(latitude: number, longitude: number) {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return { city: "", street: "" };

    try {
      const response = await fetch(
        `https://api.mapbox.com/search/geocode/v6/reverse?longitude=${longitude}&latitude=${latitude}&language=he&access_token=${token}`
      );

      const data = await response.json();
      const features = Array.isArray(data.features) ? data.features : [];

      let city = "";
      let street = "";

      for (const feature of features) {
        if (!street && feature.properties?.name) {
          street = feature.properties.name;
        }

        if (!city && Array.isArray(feature.properties?.context)) {
          const place = feature.properties.context.find(
            (item: { id?: string; name?: string }) =>
              item.id?.includes("place") || item.id?.includes("locality")
          );

          if (place?.name) {
            city = place.name;
          }
        }
      }

      return { city, street };
    } catch {
      return { city: "", street: "" };
    }
  }

  function moveToLocation(latitude: number, longitude: number) {
    mapRef.current?.flyTo({
      center: [longitude, latitude],
      zoom: 17,
      essential: true,
    });

    if (!userMarkerRef.current && mapRef.current) {
      const el = document.createElement("div");
      el.className = "user-location-marker";

      userMarkerRef.current = new mapboxgl.Marker({
        element: el,
        anchor: "center",
      })
        .setLngLat([longitude, latitude])
        .addTo(mapRef.current);
    } else {
      userMarkerRef.current?.setLngLat([longitude, latitude]);
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
        moveToLocation(latitude, longitude);

        const { city, street } = await reverseGeocode(latitude, longitude);

        onLocationResolved({
          latitude,
          longitude,
          city,
          street,
        });
      },
      () => {
        onLocationError("לא הצלחנו לקבל את המיקום שלך");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  }

  useEffect(() => {
    if (mapRef.current) return;

    const rtlStatus = mapboxgl.getRTLTextPluginStatus();
    if (rtlStatus === "unavailable") {
      mapboxgl.setRTLTextPlugin(
        "https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.2.3/mapbox-gl-rtl-text.js",
        null,
        true
      );
    }

    if (!mapContainer.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      onLocationError("חסר Mapbox token");
      return;
    }

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/standard",
      center: [34.7818, 32.0853],
      zoom: 14,
      config: {
        basemap: {
          lightPreset: getBasemapPreset(mapTheme),
          language: "he",
        },
      },
    });

    mapRef.current = map;

    map.on("load", () => {
      updateUserLocationOnMap();
    });

    return () => {
      reportMarkersRef.current.forEach((marker) => marker.remove());
      reportMarkersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
    // Map initialization should run once; theme updates are handled by the separate effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    mapRef.current.setConfigProperty(
      "basemap",
      "lightPreset",
      getBasemapPreset(mapTheme)
    );
  }, [mapTheme]);

  useEffect(() => {
    if (!userCoordsRef.current) return;

    moveToLocation(userCoordsRef.current.latitude, userCoordsRef.current.longitude);
  }, [recenterTrigger]);

  useEffect(() => {
    if (!mapRef.current) return;

    reportMarkersRef.current.forEach((marker) => marker.remove());
    reportMarkersRef.current = [];

    const safeReports = Array.isArray(reports) ? reports : [];

    safeReports.forEach((report) => {
      const markerEl = document.createElement("button");
      markerEl.className = "report-marker";
      markerEl.type = "button";
      markerEl.setAttribute("aria-label", `דיווח: ${report.type}`);
      markerEl.innerHTML = "!";

      const popupContainer = document.createElement("div");
      popupContainer.dir = "rtl";
      popupContainer.className = "report-popup";

      const title = document.createElement("div");
      title.className = "report-popup-title";
      title.textContent = report.type;

      const location = document.createElement("div");
      location.className = "report-popup-line";
      location.textContent = `${report.city || "ללא עיר"}, ${
        report.street || "ללא רחוב"
      }`;

      const description = document.createElement("div");
      description.className = "report-popup-line";
      description.textContent = report.description || "ללא תיאור";

      const image = document.createElement("div");
      image.className = "report-popup-line";
      image.textContent = report.imageName
        ? `תמונה: ${report.imageName}`
        : "ללא תמונה";

      const createdAt = document.createElement("div");
      createdAt.className = "report-popup-line";
      createdAt.textContent = `נוצר: ${new Date(report.createdAt).toLocaleString(
        "he-IL"
      )}`;

      const deleteButton = document.createElement("button");
      deleteButton.className = "report-popup-delete";
      deleteButton.type = "button";
      deleteButton.textContent = "מחק דיווח";
      deleteButton.addEventListener("click", () => {
        onDeleteReport?.(report.id);
      });

      popupContainer.appendChild(title);
      popupContainer.appendChild(location);
      popupContainer.appendChild(description);
      popupContainer.appendChild(image);
      popupContainer.appendChild(createdAt);
      popupContainer.appendChild(deleteButton);

      const popup = new mapboxgl.Popup({
        offset: 28,
        closeButton: true,
      }).setDOMContent(popupContainer);

      const marker = new mapboxgl.Marker({
        element: markerEl,
        anchor: "bottom",
      })
        .setLngLat([report.longitude, report.latitude])
        .setPopup(popup)
        .addTo(mapRef.current!);

      reportMarkersRef.current.push(marker);
    });
  }, [reports, onDeleteReport]);

  return <div ref={mapContainer} className="h-full w-full" />;
}