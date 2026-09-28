import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./App.css";

function App() {
  const mapContainer = useRef(null);
  const map = useRef(null);

  const [showIntro, setShowIntro] = useState(true);
  const [introFade, setIntroFade] = useState(false);

  useEffect(() => {
    if (map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,

      style: "https://tiles.openfreemap.org/styles/dark",

      center: [88.3639, 22.5726],
      zoom: 4,

      attributionControl: false,
    });

    map.current.on("load", () => {
      const layers = map.current.getStyle().layers;

      layers.forEach((layer) => {
        // Water bodies
        if (
          layer.type === "fill" &&
          layer["source-layer"] === "water"
        ) {
          try {
            map.current.setPaintProperty(
              layer.id,
              "fill-color",
              "#063b5c"
            );
          } catch {}
        }

        // Rivers
        if (
          layer.type === "line" &&
          layer["source-layer"] === "waterway"
        ) {
          try {
            map.current.setPaintProperty(
              layer.id,
              "line-color",
              "#0876a8"
            );
          } catch {}
        }
      });
    });

    map.current.addControl(
      new maplibregl.NavigationControl({
        showCompass: true,
        showZoom: true,
      }),
      "bottom-right"
    );

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Startup sequence
  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setIntroFade(true);
    }, 1700);

    const hideTimer = setTimeout(() => {
      setShowIntro(false);
    }, 2300);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  return (
    <div className="app">

      {/* MAP */}
      <div ref={mapContainer} className="map" />

      {/* HUD */}
      <div className="hud">

        <div className="brand">
          <div className="brand-name">SWARNADI</div>

          <div className="brand-subtitle">
            WHERE SOUND MAPS THE UNKNOWN
          </div>
        </div>

        <div className="status">
          <span className="status-dot"></span>
          SONAR SYSTEM ONLINE
        </div>

      </div>
      {/* UPLOAD BUTTON */}
      <button className="upload-button">
        <span className="upload-icon">＋</span>
        UPLOAD SONAR IMAGE
      </button>
      
      {/* STARTUP SCREEN */}
      {showIntro && (
        <div
          className={`intro-screen ${
            introFade ? "intro-fade" : ""
          }`}
        >

          <div className="sonar-ripple ripple-1"></div>
          <div className="sonar-ripple ripple-2"></div>
          <div className="sonar-ripple ripple-3"></div>

          <div className="intro-content">

            <div className="intro-title">
              SWARNADI
            </div>

            <div className="intro-line"></div>

            <div className="intro-tagline">
              WHERE SOUND MAPS THE UNKNOWN
            </div>

            <div className="intro-status">
              INITIALIZING SONAR SYSTEM
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
export default App;