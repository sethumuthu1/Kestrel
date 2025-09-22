import React, { useEffect, useRef, useState } from "react";
import Map from "@arcgis/core/Map";
// alias the ArcGIS MapView to avoid name collision with our React component
import ArcGISMapView from "@arcgis/core/views/MapView";
import Graphic from "@arcgis/core/Graphic";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Expand from "@arcgis/core/widgets/Expand";
import BasemapGallery from "@arcgis/core/widgets/BasemapGallery";
import { FiTarget, FiMaximize } from "react-icons/fi";

import "../styles/MapView.css";

import vehicles from "../data/vehicles.json";
import routes from "../data/routes.json";

/**
 * MapView component (ArcGIS) that reacts to `filters` coming from the Sidebar.
 *
 * filters structure expected:
 * {
 *   types: { Trash: boolean, Recycling: boolean, "Heavy Trash": boolean },
 *   vehicles: [ids...],
 *   showStartEnd: boolean,
 *   showLabels: boolean,
 *   selectedDate: string | null,
 *   routeColors: [colorHex...],
 *   addressSearch: string
 * }
 */
export default function MapView({ filters }) {
  const mapDiv = useRef(null);
  const viewRef = useRef(null);
  const graphicsLayerRef = useRef(null);
  const [viewReady, setViewReady] = useState(false);

  // Initialize map & view once
  useEffect(() => {
    if (!mapDiv.current) return;

    const map = new Map({ basemap: "streets-navigation-vector" });

    const view = new ArcGISMapView({
      container: mapDiv.current,
      map,
      center: [-95.416, 29.044],
      zoom: 12,
      ui: { components: [] },
    });

    viewRef.current = view;

    // initial graphics layer
    const gl = new GraphicsLayer();
    graphicsLayerRef.current = gl;
    map.add(gl);

    // Basemap gallery
    const basemapGallery = new BasemapGallery({ view });
    const bgExpand = new Expand({
      view,
      content: basemapGallery,
      expandTooltip: "Change Basemap",
    });
    view.ui.add(bgExpand, "top-right");

    view.when(() => setViewReady(true));

    // cleanup on unmount
    return () => {
      try {
        if (view) view.destroy();
      } catch (e) {
        /* ignore */
      }
      viewRef.current = null;
      graphicsLayerRef.current = null;
    };
  }, []);

  // Helper: safely remove old graphics layer and create a fresh one
  const resetGraphicsLayer = () => {
    const view = viewRef.current;
    if (!view) return null;

    const map = view.map;
    // remove old if exists
    try {
      if (graphicsLayerRef.current) {
        if (map.layers && map.layers.includes(graphicsLayerRef.current)) {
          map.remove(graphicsLayerRef.current);
        }
      }
    } catch (e) {
      // ignore removal errors
    }

    const newLayer = new GraphicsLayer();
    graphicsLayerRef.current = newLayer;
    map.add(newLayer);
    return newLayer;
  };

  // Filtering logic: runs whenever filters change
  useEffect(() => {
    if (!viewReady) return;
    const view = viewRef.current;
    if (!view) return;

    // create a fresh layer each time (clean slate)
    const gLayer = resetGraphicsLayer();
    if (!gLayer) return;

    // Determine which vehicle objects should be shown
    // Priority: if explicit vehicle ids exist -> show only those ids (regardless of type selection)
    // Otherwise show vehicles matching the enabled types.
    const explicitVehicleIds = Array.isArray(filters.vehicles) ? filters.vehicles : [];
    const enabledTypes = filters.types || {};
    const typeKeys = Object.keys(enabledTypes);

    // helper: are any types explicitly enabled?
    const anyTypeEnabled = typeKeys.some((t) => !!enabledTypes[t]);

    // vehiclesToShow: array of vehicle objects that will be placed on the map as dots
    let vehiclesToShow = [];

    if (explicitVehicleIds.length > 0) {
      // Show explicit vehicle selection (even if types are all false)
      vehiclesToShow = vehicles.filter((v) => explicitVehicleIds.includes(v.id));
    } else if (anyTypeEnabled) {
      // No explicit ids, but some types are enabled -> show all vehicles of enabled types
      vehiclesToShow = vehicles.filter((v) => !!enabledTypes[v.type]);
    } else {
      // no explicit vehicles and no types selected -> vehiclesToShow remains empty
      vehiclesToShow = [];
    }

    // ROUTE DISPLAY DECISION:
    // Show routes (and start/end markers) ONLY when:
    // - filters.showStartEnd === true
    // AND
    // - At least one of:
    //    -> routeColors selected
    //    -> explicit vehicles selected
    //    -> any type selected
    const routeColors = Array.isArray(filters.routeColors) ? filters.routeColors : [];
    const showRoutes =
      !!filters.showStartEnd &&
      (routeColors.length > 0 || explicitVehicleIds.length > 0 || anyTypeEnabled);

    // RULE: If user selected ONLY routes (routeColors set) and nothing else,
    // we should display routes and NOT vehicles (per requirement 4).
    const onlyRoutesSelected =
      routeColors.length > 0 && explicitVehicleIds.length === 0 && !anyTypeEnabled;

    // If onlyRoutesSelected is true, blank vehicle list
    if (onlyRoutesSelected) vehiclesToShow = [];

    // If no vehiclesToShow and no routes to show => map should show nothing (empty)
    // (we still keep the basemap)
    // --- Add vehicle graphics ---
    const labelEnabled = !!filters.showLabels;

    vehiclesToShow.forEach((v) => {
      // point geometry
      const pointGeom = { type: "point", longitude: v.lng, latitude: v.lat };

      // marker symbol color by type
      const markerSymbol = {
        type: "simple-marker",
        color:
          v.type === "Trash"
            ? "#ef4444"
            : v.type === "Recycling"
            ? "#22c55e"
            : "#3b82f6",
        size: 14,
        outline: { color: "white", width: 1.5 },
        style: "circle",
      };

      const popupTemplate = {
        title: v.name,
        content: `
          <div style="font-family:Arial; font-size:13px; line-height:1.4;">
            <b>Type:</b> ${v.type}<br/>
            <b>ID:</b> ${v.id}<br/>
            <b>Last Seen:</b> ${v.lastSeen || "N/A"}
          </div>
        `,
      };

      const vehicleGraphic = new Graphic({
        geometry: pointGeom,
        symbol: markerSymbol,
        popupTemplate,
        attributes: { id: v.id, type: v.type },
      });
      gLayer.add(vehicleGraphic);

      // add label if enabled
      if (labelEnabled) {
        const textGraphic = new Graphic({
          geometry: pointGeom,
          symbol: {
            type: "text",
            color: "black",
            text: v.name,
            font: {
              size: 10,
              family: "Arial",
              weight: "bold",
            },
            yoffset: -18,
            // horizontally centered default
          },
        });
        gLayer.add(textGraphic);
      }
    });

    // --- Add routes if required ---
    if (showRoutes) {
      // pick routes to draw:
      // 1. If routeColors selected -> draw routes with those colors
      // 2. Else if explicitVehicleIds or anyTypeEnabled -> draw ALL routes (or you can choose to
      //    implement a smarter mapping if you have route<->vehicle relationships)
      let routesToShow = [];

      if (routeColors.length > 0) {
        routesToShow = routes.filter((r) => routeColors.includes(r.color));
      } else {
        // No specific color filter; but showRoutes is true because of vehicle/type presence.
        // We'll show all routes.
        routesToShow = routes.slice();
      }

      routesToShow.forEach((r) => {
        if (!r.path || !r.path.length) return;

        const polyline = {
          type: "polyline",
          paths: r.path.map((p) => [p.lng, p.lat]),
        };

        const lineSymbol = {
          type: "simple-line",
          // ArcGIS simple-line color can be an array [r,g,b,a] or CSS string; we already have hex in r.color
          color: r.color,
          width: 4,
        };

        const routeGraphic = new Graphic({
          geometry: polyline,
          symbol: lineSymbol,
          attributes: { id: r.id, color: r.color },
        });

        gLayer.add(routeGraphic);

        // start / end markers
        if (r.path.length > 0) {
          const start = r.path[0];
          const end = r.path[r.path.length - 1];

          const startGraphic = new Graphic({
            geometry: { type: "point", longitude: start.lng, latitude: start.lat },
            symbol: {
              type: "simple-marker",
              color: "limegreen",
              size: 10,
              outline: { color: "#fff", width: 1 },
            },
            attributes: { routeId: r.id, point: "start" },
          });

          const endGraphic = new Graphic({
            geometry: { type: "point", longitude: end.lng, latitude: end.lat },
            symbol: {
              type: "simple-marker",
              color: "red",
              size: 10,
              outline: { color: "#fff", width: 1 },
            },
            attributes: { routeId: r.id, point: "end" },
          });

          gLayer.add(startGraphic);
          gLayer.add(endGraphic);
        }
      });
    }

    // Optional: zoom or adjust extent when content changes.
    // If vehicles shown, zoom to them; else if routes shown, zoom to routes; otherwise don't zoom.
    (async () => {
      try {
        // small pause to let layer render
        await view.whenLayerView(gLayer);
        const allGraphics = gLayer.graphics && gLayer.graphics.toArray
          ? gLayer.graphics.toArray()
          : [];

        if (allGraphics.length > 0) {
          // compute extent
          const extents = allGraphics
            .map((g) => g.geometry)
            .filter(Boolean)
            .map((geom) => {
              // For points, use single point extent; for polylines use geom.extent if available.
              if (geom.type === "point") {
                return { xmin: geom.longitude, ymin: geom.latitude, xmax: geom.longitude, ymax: geom.latitude };
              }
              if (geom.extent) {
                return geom.extent;
              }
              return null;
            })
            .filter(Boolean);

          // compute combined extent if possible
          if (extents.length > 0) {
            // simple combine
            let xmin = extents[0].xmin, ymin = extents[0].ymin, xmax = extents[0].xmax, ymax = extents[0].ymax;
            extents.forEach((ex) => {
              xmin = Math.min(xmin, ex.xmin);
              ymin = Math.min(ymin, ex.ymin);
              xmax = Math.max(xmax, ex.xmax);
              ymax = Math.max(ymax, ex.ymax);
            });

            // add small padding
            const paddingFactor = 0.05;
            const xpad = (xmax - xmin) * paddingFactor || 0.01;
            const ypad = (ymax - ymin) * paddingFactor || 0.01;

            view.goTo({
              target: {
                xmin: xmin - xpad,
                ymin: ymin - ypad,
                xmax: xmax + xpad,
                ymax: ymax + ypad,
                spatialReference: view.spatialReference,
              },
            });
          }
        }
      } catch (e) {
        // ignore zoom errors
      }
    })();

    // nothing to return here; cleanup handled when next effect runs by removing previous layer via resetGraphicsLayer
  }, [filters, viewReady]);

  // Recenter and zoom-to-fit buttons use the viewRef
  return (
    <div className="map-wrapper">
      <div className="map-header">
        <h2>Live Map View</h2>
        <div className="map-actions">
          <button
            onClick={() =>
              viewRef.current &&
              viewRef.current.goTo({ center: [-95.416, 29.044], zoom: 12 })
            }
          >
            <FiTarget /> Recenter
          </button>
          <button
            onClick={() =>
              viewRef.current &&
              viewRef.current.goTo({
                target: viewRef.current.map.allLayers,
              })
            }
          >
            <FiMaximize /> Zoom to Fit
          </button>
        </div>
      </div>
      <div className="map-view" ref={mapDiv} />
    </div>
  );
}
