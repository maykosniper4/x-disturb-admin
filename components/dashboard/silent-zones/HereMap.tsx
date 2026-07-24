"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

type HereMapProps = {
  onCoordinatesChange: (coords: { lat: string; lng: string }) => void;
  radius: number;
  initialCoordinates?: { lat: string; lng: string };
};

const HereMap = ({
  onCoordinatesChange,
  radius,
  initialCoordinates,
}: HereMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<InstanceType<NonNullable<Window["H"]>["Map"]> | null>(null);
  const markerRef = useRef<InstanceType<NonNullable<Window["H"]>["map"]["Marker"]> | null>(null);
  const circleRef = useRef<InstanceType<NonNullable<Window["H"]>["map"]["Circle"]> | null>(null);
  const platformRef = useRef<any>(null);
  const onCoordsChangeRef = useRef(onCoordinatesChange);
  onCoordsChangeRef.current = onCoordinatesChange;
  const [coordinates, setCoordinates] = useState<{
    lat: string | null;
    lng: string | null;
  }>({
    lat: initialCoordinates?.lat || null,
    lng: initialCoordinates?.lng || null,
  });
  const [error, setError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isMapLoading, setIsMapLoading] = useState<boolean>(true);

  const apikey: string = process.env.NEXT_PUBLIC_HERE_API_KEY || "";

  const isValidCoord = (v: string | null) =>
    v !== null && v !== "" && isFinite(Number(v));

  const syncMapToCoord = (lat: number, lng: number) => {
    const map = mapInstance.current;
    if (!map) return;
    const coord = { lat, lng };
    map.setCenter(coord);

    if (markerRef.current) {
      markerRef.current.setGeometry(coord);
    } else {
      markerRef.current = new window.H.map.Marker(coord);
      map.addObject(markerRef.current!);
    }

    if (circleRef.current) {
      circleRef.current.setCenter(coord);
      circleRef.current.setRadius(radius);
    } else {
      circleRef.current = new window.H.map.Circle(coord, radius, {
        style: {
          strokeColor: "rgba(255, 0, 0, 0.7)",
          lineWidth: 2,
          fillColor: "rgba(0, 255, 0, 0.3)",
        },
      });
      map.addObject(circleRef.current!);
    }
  };

  useEffect(() => {
    if (!apikey) {
      setIsMapLoading(false);
      return;
    }

    if (!mapRef.current) {
      setIsMapLoading(false);
      return;
    }

    setIsMapLoading(true);
    const loadScript = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () =>
          reject(new Error(`Failed to load script: ${src}`));
        document.body.appendChild(script);
      });
    };

    let isMounted = true;

    const initializeMap = async () => {
      try {
        await loadScript("https://js.api.here.com/v3/3.1/mapsjs-core.js");
        await loadScript("https://js.api.here.com/v3/3.1/mapsjs-service.js");
        await loadScript("https://js.api.here.com/v3/3.1/mapsjs-ui.js");
        await loadScript("https://js.api.here.com/v3/3.1/mapsjs-mapevents.js");

        if (!isMounted) return;

        const here = window.H;

        if (!here) {
          throw new Error("HERE Maps API not loaded");
        }

        if (mapInstance.current) {
          mapInstance.current.dispose();
          mapInstance.current = null;
        }

        platformRef.current = new here.service.Platform({ apikey });

        const defaultLayers = platformRef.current.createDefaultLayers();

        const hasInitialCoords = !!(
          initialCoordinates &&
          isValidCoord(initialCoordinates.lat) &&
          isValidCoord(initialCoordinates.lng) &&
          Number(initialCoordinates.lat) !== 0 &&
          Number(initialCoordinates.lng) !== 0
        );
        const mapCenter = hasInitialCoords
          ? {
              lat: Number(initialCoordinates.lat!),
              lng: Number(initialCoordinates.lng!),
            }
          : { lat: 9.0572, lng: 38.7592 };

        mapInstance.current = new here.Map(
          mapRef.current!,
          defaultLayers.vector.normal.map,
          {
            center: mapCenter,
            zoom: 14,
            pixelRatio: window.devicePixelRatio || 1,
          }
        );

        new here.mapevents.Behavior(
          new here.mapevents.MapEvents(mapInstance.current)
        );

        here.ui.UI.createDefault(mapInstance.current, defaultLayers);

        mapInstance.current?.addEventListener("tap", (evt: any) => {
          const coord = mapInstance.current!.screenToGeo(
            evt.currentPointer.viewportX,
            evt.currentPointer.viewportY
          );

          if (coord) {
            const newCoord = {
              lat: coord.lat.toFixed(6),
              lng: coord.lng.toFixed(6),
            };
            setCoordinates(newCoord);
            onCoordsChangeRef.current(newCoord);
            syncMapToCoord(coord.lat, coord.lng);
          }
        });

        setIsMapLoading(false);
      } catch (err) {
        console.error("Map initialization error:", err);
        setIsMapLoading(false);
      }
    };

    initializeMap();

    return () => {
      isMounted = false;
      if (mapInstance.current) {
        mapInstance.current.dispose();
        mapInstance.current = null;
      }
    };
  }, [apikey]);

  useEffect(() => {
    if (!mapInstance.current || !circleRef.current) return;

    circleRef.current.setRadius(radius);
  }, [radius]);

  const handleCoordinateInputChange = (type: "lat" | "lng", value: string) => {
    const newCoord = { ...coordinates, [type]: value };
    setCoordinates(newCoord);
    if (isValidCoord(newCoord.lat) && isValidCoord(newCoord.lng)) {
      onCoordsChangeRef.current({
        lat: newCoord.lat!,
        lng: newCoord.lng!,
      });
    }
  };

  const handleApplyCoords = () => {
    if (isValidCoord(coordinates.lat) && isValidCoord(coordinates.lng)) {
      onCoordsChangeRef.current({
        lat: coordinates.lat!,
        lng: coordinates.lng!,
      });
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        const newCoord = { lat, lng };

        setCoordinates(newCoord);
        onCoordsChangeRef.current(newCoord);
        syncMapToCoord(position.coords.latitude, position.coords.longitude);
        setIsLocating(false);
      },
      (err) => {
        console.error("Geolocation error:", err);
        let errorMsg = "Failed to retrieve your current location.";
        if (err.code === 1) {
          errorMsg = "Permission denied. Please allow location access in your browser.";
        } else if (err.code === 2) {
          errorMsg = "Position unavailable. Please try again.";
        } else if (err.code === 3) {
          errorMsg = "Location request timed out. Please try again.";
        }
        setError(errorMsg);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  useEffect(() => {
    if (
      !mapInstance.current ||
      !isValidCoord(coordinates.lat) ||
      !isValidCoord(coordinates.lng)
    ) {
      return;
    }
    syncMapToCoord(Number(coordinates.lat), Number(coordinates.lng));
  }, [coordinates.lat, coordinates.lng, radius]);

  const mapAvailable = !!apikey;

  return (
    <Card className="w-full mx-auto shadow-lg">
      <CardContent>
        {mapAvailable ? (
          <>
            <div className="flex gap-2 mb-4">
              <Button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={isMapLoading || isLocating}
                variant="outline"
                className="border-primary text-primary hover:bg-primary/10"
              >
                {isLocating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <MapPin className="h-4 w-4 mr-1" />
                )}
                Use Current Location
              </Button>
            </div>

            <div
              className={cn(
                "relative w-full h-[400px] bg-slate-100 rounded-md overflow-hidden"
              )}
            >
              {isMapLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-100 bg-opacity-80 z-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Loading map...</span>
                </div>
              )}
              <div ref={mapRef} className="w-full h-full" />
            </div>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </>
        ) : (
          <div className="py-4 text-center text-muted-foreground">
            <MapPin className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm">Map unavailable — enter coordinates manually</p>
          </div>
        )}

        <div className="mt-4 p-3 bg-slate-50 rounded-md flex items-center justify-center gap-4 flex-wrap">
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-1 text-primary" />
            <Input
              type="text"
              value={coordinates.lat || ""}
              onChange={(e) =>
                handleCoordinateInputChange("lat", e.target.value)
              }
              placeholder="Latitude"
              className="w-32 text-sm"
            />
          </div>
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-1 text-primary" />
            <Input
              type="text"
              value={coordinates.lng || ""}
              onChange={(e) =>
                handleCoordinateInputChange("lng", e.target.value)
              }
              placeholder="Longitude"
              className="w-32 text-sm"
            />
          </div>
          {!mapAvailable && (
            <Button type="button" variant="outline" size="sm" onClick={handleApplyCoords}>
              Apply
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default HereMap;
