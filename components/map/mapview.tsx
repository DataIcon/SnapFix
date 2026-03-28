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
  imageDataUrl?: string | null;
  createdAt: string;
};

function openReportImageLightbox(src: string) {
  const backdrop = document.createElement("div");
  backdrop.className = "report-image-lightbox-backdrop";
  backdrop.dir = "rtl";

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "report-image-lightbox-close";
  closeBtn.setAttribute("aria-label", "סגור");
  closeBtn.innerHTML = "<span aria-hidden=\"true\">&#215;</span>";

  const img = document.createElement("img");
  img.src = src;
  img.alt = "תמונת דיווח";
  img.className = "report-image-lightbox-img";

  function close() {
    backdrop.remove();
    document.removeEventListener("keydown", onKey);
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === "Escape") close();
  }

  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) close();
  });
  closeBtn.addEventListener("click", close);
  img.addEventListener("click", (e) => e.stopPropagation());

  document.addEventListener("keydown", onKey);

  backdrop.appendChild(closeBtn);
  backdrop.appendChild(img);
  document.body.appendChild(backdrop);
}

type MapTheme = "light" | "dark";

type MapViewProps = {
  recenterTrigger: number;
  mapTheme: MapTheme;
  onLocationResolved: (data: ResolvedLocation) => void;
  onLocationError: (message: string) => void;
  reports?: ReportItem[];
  onDeleteReport?: (reportId: string) => void;
};

/** Map click target can be a Text node (e.g. "!" inside the marker button), not HTMLElement. */
function eventTargetToElement(target: EventTarget | null): HTMLElement | null {
  if (!target) return null;
  if (target instanceof HTMLElement) return target;
  if (target instanceof Text && target.parentElement) return target.parentElement;
  return null;
}

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

    const map = mapRef.current;

    reportMarkersRef.current.forEach((marker) => marker.remove());
    reportMarkersRef.current = [];

    const safeReports = Array.isArray(reports) ? reports : [];
    type MarkerBinding = {
      markerEl: HTMLButtonElement;
      popup: mapboxgl.Popup;
      marker: mapboxgl.Marker;
    };
    const markerBindings: MarkerBinding[] = [];

    function makeBox(label: string, valueText: string, valueClass?: string) {
      const box = document.createElement("div");
      box.className = "report-popup-box";

      const labelEl = document.createElement("div");
      labelEl.className = "report-popup-box-label";
      labelEl.textContent = label;

      const valueEl = document.createElement("div");
      valueEl.className = "report-popup-box-value";
      if (valueClass) valueEl.classList.add(valueClass);
      valueEl.textContent = valueText;

      box.appendChild(labelEl);
      box.appendChild(valueEl);
      return box;
    }

    safeReports.forEach((report) => {
      const markerEl = document.createElement("button");
      markerEl.className = "report-marker";
      markerEl.type = "button";
      markerEl.setAttribute("aria-label", `דיווח: ${report.type}`);
      markerEl.innerHTML = "!";

      const popupContainer = document.createElement("div");
      popupContainer.dir = "rtl";
      popupContainer.className = "report-popup";

      const titleBox = document.createElement("div");
      titleBox.className = "report-popup-box report-popup-box--lead";
      titleBox.textContent = report.type;

      popupContainer.appendChild(titleBox);

      popupContainer.appendChild(
        makeBox(
          "מיקום",
          `${report.city || "ללא עיר"}, ${report.street || "ללא רחוב"}`
        )
      );

      popupContainer.appendChild(
        makeBox("תיאור", report.description?.trim() || "ללא תיאור")
      );

      const imageBox = document.createElement("div");
      imageBox.className = "report-popup-box";

      const imageLabel = document.createElement("div");
      imageLabel.className = "report-popup-box-label";
      imageLabel.textContent = "תמונה";

      const imageValue = document.createElement("div");
      imageValue.className =
        "report-popup-box-value report-popup-box-value--media";

      const imageSlot = document.createElement("div");
      imageSlot.className = "report-popup-thumb-slot";

      if (report.imageDataUrl) {
        const thumbBtn = document.createElement("button");
        thumbBtn.type = "button";
        thumbBtn.className = "report-popup-thumb-btn";
        thumbBtn.setAttribute(
          "aria-label",
          "הצג תמונה בגודל מלא"
        );

        const thumbImg = document.createElement("img");
        thumbImg.src = report.imageDataUrl;
        thumbImg.alt = report.imageName || "תמונת דיווח";
        thumbImg.className = "report-popup-thumb-img";
        thumbImg.draggable = false;

        thumbBtn.appendChild(thumbImg);
        thumbBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          openReportImageLightbox(report.imageDataUrl!);
        });

        imageSlot.appendChild(thumbBtn);
      }

      imageValue.appendChild(imageSlot);

      imageBox.appendChild(imageLabel);
      imageBox.appendChild(imageValue);
      popupContainer.appendChild(imageBox);

      popupContainer.appendChild(
        makeBox(
          "נוצר",
          new Date(report.createdAt).toLocaleString("he-IL"),
          "report-popup-box-value--meta"
        )
      );

      const deleteButton = document.createElement("button");
      deleteButton.className = "report-popup-delete";
      deleteButton.type = "button";
      deleteButton.textContent = "מחק דיווח";
      deleteButton.addEventListener("click", (e) => {
        e.stopPropagation();
        onDeleteReport?.(report.id);
      });

      popupContainer.appendChild(deleteButton);

      const popup = new mapboxgl.Popup({
        offset: 28,
        closeButton: false,
        closeOnClick: false,
        maxWidth: "280px",
      }).setDOMContent(popupContainer);

      const marker = new mapboxgl.Marker({
        element: markerEl,
        anchor: "bottom",
      })
        .setLngLat([report.longitude, report.latitude])
        .addTo(map);

      markerBindings.push({ markerEl, popup, marker });

      popup.on("open", () => {
        popup
          .getElement()
          ?.querySelector(".mapboxgl-popup-close-button")
          ?.remove();
      });

      reportMarkersRef.current.push(marker);
    });

    function handleReportMapClick(e: mapboxgl.MapMouseEvent) {
      const path = e.originalEvent.composedPath();
      for (const node of path) {
        if (!(node instanceof HTMLElement)) continue;
        if (!node.classList.contains("report-marker")) continue;

        const binding = markerBindings.find((b) => b.markerEl === node);
        if (!binding) continue;

        const { popup, marker } = binding;
        if (popup.isOpen()) {
          popup.remove();
        } else {
          markerBindings.forEach(({ popup: p }) => {
            if (p !== popup && p.isOpen()) p.remove();
          });
          popup.setLngLat(marker.getLngLat()!).addTo(map);
        }
        return;
      }

      const el = eventTargetToElement(e.originalEvent.target);
      if (!el) return;
      if (el.closest(".mapboxgl-popup")) return;

      markerBindings.forEach(({ popup: p }) => {
        if (p.isOpen()) p.remove();
      });
    }

    map.on("click", handleReportMapClick);

    return () => {
      map.off("click", handleReportMapClick);
    };
  }, [reports, onDeleteReport]);

  return <div ref={mapContainer} className="h-full w-full" />;
}