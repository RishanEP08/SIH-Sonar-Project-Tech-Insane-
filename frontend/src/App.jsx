import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./App.css";

function createScanMarker() {
  const el = document.createElement("div");
  el.className = "scan-marker";

  el.innerHTML = `
    <div class="scan-marker-ring ring-1"></div>
    <div class="scan-marker-ring ring-2"></div>
    <div class="scan-marker-ring ring-3"></div>
    <div class="scan-marker-core"></div>
  `;

  return el;
}
function App() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const scanMarker = useRef(null); //new

  const [showIntro, setShowIntro] = useState(true);
  const [introFade, setIntroFade] = useState(false);
  const [showScanPanel, setShowScanPanel] = useState(false);
  const [scanPanelClosing, setScanPanelClosing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [resultPosition, setResultPosition] = useState({
    x: 0,
    y: 0,
  });
  
  const [resultSize, setResultSize] = useState({
    width: 460,
    height: 520,
  });
  
  const resultDragging = useRef(false);
  const resultResizing = useRef(false);
  
  const resultDragStart = useRef({
    x: 0,
    y: 0,
  });
  
  const resultResizeStart = useRef({
    x: 0,
    y: 0,
    width: 460,
    height: 520,
  });

  // START SCAN
  const handleScan = async () => {
    setScanError("");

    if (!selectedFile) {
      setScanError("Please select a sonar image.");
      return;
    }

    if (!latitude || !longitude) {
      setScanError("Please enter latitude and longitude.");
      return;
    }

    setIsScanning(true);

    try {
      const formData = new FormData();

      formData.append("file", selectedFile);
      formData.append("latitude", latitude);
      formData.append("longitude", longitude);

      const response = await fetch(
        "/api/predict",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.detail || "Sonar scan failed."
        );
      }

      console.log("SCAN RESULT:", data);

      setScanResult(data);

      // Move map to scan location
      if (map.current && data.location) {
          const lat = Number(data.location.latitude);
          const lon = Number(data.location.longitude);
           // Remove previous scan marker
          if (scanMarker.current) {
            scanMarker.current.remove();
          }
        
          // Create new scan marker
          const markerElement = createScanMarker();
        
          scanMarker.current = new maplibregl.Marker({
            element: markerElement,
            anchor: "center",
          }).setLngLat([lon, lat])
            .addTo(map.current);
                  console.log("MAP COORDINATES:", {
                    latitude: lat,
                    longitude: lon,
                  });
          map.current.flyTo({
            center: [lon, lat],
            zoom: 9,
            speed: 0.8,
            curve: 1.4,
            essential: true,
          });
        }

    } catch (error) {
      console.error(error);
      setScanError(error.message);
    } finally {
      setIsScanning(false);
    }
  };
  const handleResultPointerDown = (e) => {
  if (e.button !== 0) return;

  resultDragging.current = true;

  resultDragStart.current = {
    x: e.clientX - resultPosition.x,
    y: e.clientY - resultPosition.y,
  };

  e.currentTarget.setPointerCapture(e.pointerId);
};

const handleResultPointerMove = (e) => {
  if (!resultDragging.current) return;

  setResultPosition({
    x: e.clientX - resultDragStart.current.x,
    y: e.clientY - resultDragStart.current.y,
  });
};

const handleResultPointerUp = (e) => {
  resultDragging.current = false;

  if (e.currentTarget.hasPointerCapture(e.pointerId)) {
    e.currentTarget.releasePointerCapture(e.pointerId);
  }
};

const handleResultResizeStart = (e) => {
  e.preventDefault();
  e.stopPropagation();

  resultResizing.current = true;

  resultResizeStart.current = {
    x: e.clientX,
    y: e.clientY,
    width: resultSize.width,
    height: resultSize.height,
  };

  e.currentTarget.setPointerCapture(e.pointerId);
};

const handleResultResizeMove = (e) => {
  if (!resultResizing.current) return;

  const deltaX =
    e.clientX - resultResizeStart.current.x;

  const deltaY =
    e.clientY - resultResizeStart.current.y;

  setResultSize({
    width: Math.max(
      320,
      resultResizeStart.current.width + deltaX
    ),

    height: Math.max(
      400,
      resultResizeStart.current.height + deltaY
    ),
  });
};

const handleResultResizeEnd = (e) => {
  resultResizing.current = false;

  if (e.currentTarget.hasPointerCapture(e.pointerId)) {
    e.currentTarget.releasePointerCapture(e.pointerId);
  }
};

  useEffect(() => {
    if (map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,

      style: "https://tiles.openfreemap.org/styles/dark",

      center: [72.3639, 22.5726],
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

    // Give the intro overlay time to finish fading,
    // then force MapLibre to recalculate its viewport.
    setTimeout(() => {
      if (map.current) {
        map.current.resize();
        map.current.jumpTo({
          center: [72.3639, 22.5726],
          zoom: 4,
        });
      }
    }, 100);
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
      
        {scanResult && (
        <div
          className="result-card"
          style={{
            width: `${resultSize.width}px`,
            height: `${resultSize.height}px`,
            top: "105px",
            right: "30px",
            transform: `translate(${resultPosition.x}px, ${resultPosition.y}px)`,
          }}
        >
      
          {/* RESULT HEADER */}
          <div
            className="result-header"
            onPointerDown={handleResultPointerDown}
            onPointerMove={handleResultPointerMove}
            onPointerUp={handleResultPointerUp}
            onPointerCancel={handleResultPointerUp}
          >
            <div>
              <div className="result-title">
                SONAR ANALYSIS
              </div>
      
              <div className="result-subtitle">
                DETECTION RESULTS
              </div>
            </div>
      
            <div className="result-status">
              COMPLETE
            </div>
          </div>
      
          {/* IMAGE */}
          <div className="result-image-wrapper">
            <img
              src={`/api${scanResult.annotated_image}`}
              alt="Annotated sonar scan"
              className="result-image"
            />
          </div>
      
          {/* DETECTIONS */}
          <div className="detection-list">
            {scanResult.detections.length > 0 ? (
              scanResult.detections.map((detection, index) => (
                <div
                  className="detection-block"
                  key={index}
                >
                  <div className="detection-field">
                    <span className="detection-label">
                      OBJECT
                    </span>
      
                    <span className="detection-value">
                      : {detection.class.toUpperCase()}
                    </span>
                  </div>
      
                  <div className="detection-field">
                    <span className="detection-label">
                      CONFIDENCE
                    </span>
      
                    <span className="detection-value">
                      : {(detection.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-detection">
                NO ANOMALIES DETECTED
              </div>
            )}
          </div>
      
          {/* RESIZE HANDLE */}
          <div
            className="result-resize-handle"
            onPointerDown={handleResultResizeStart}
            onPointerMove={handleResultResizeMove}
            onPointerUp={handleResultResizeEnd}
            onPointerCancel={handleResultResizeEnd}
          />
      
        </div>
      )}
      {/* UPLOAD BUTTON */}
      <button
        className="upload-button"
        onClick={() => {
          if (showScanPanel) {
            setScanPanelClosing(true);
      
            setTimeout(() => {
              setShowScanPanel(false);
              setScanPanelClosing(false);
            }, 400);
          } else {
            setShowScanPanel(true);
          }
        }}
      >
        <span className="upload-icon">＋</span>
        UPLOAD SONAR IMAGE
      </button>
      
      {/* SCAN PANEL */}
      {showScanPanel && (
        <div
           className={`scan-panel ${
                 scanPanelClosing ? "scan-panel-closing" : ""
              }`}
          >
          <div className="scan-header">
            <div>
              <div className="scan-title">
                NEW SONAR SCAN
              </div>
      
              <div className="scan-subtitle">
                UNDERWATER ANOMALY ANALYSIS
              </div>
            </div>
      
            <button
              className="close-button"
              onClick={() => setShowScanPanel(false)}
            >
              ×
            </button>
          </div>
      
          <div className="scan-body">
      
            {/* IMAGE UPLOAD */}
            <label className="upload-area">
      
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setSelectedFile(e.target.files[0])
                }
              />
      
              <div className="upload-area-icon">
                +
              </div>
      
              <div className="upload-area-title">
                {selectedFile
                  ? selectedFile.name
                  : "SELECT SONAR IMAGE"}
              </div>
      
              <div className="upload-area-subtitle">
                PNG / JPG / JPEG
              </div>
      
            </label>
      
            {/* LATITUDE */}
            <div className="coordinate-section">
      
              <div className="coordinate-label">
                LATITUDE
              </div>
      
              <input
                className="coordinate-input"
                type="number"
                step="any"
                placeholder="22.5726"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
              />
      
            </div>
      
            {/* LONGITUDE */}
            <div className="coordinate-section">
      
              <div className="coordinate-label">
                LONGITUDE
              </div>
      
              <input
                className="coordinate-input"
                type="number"
                step="any"
                placeholder="88.3639"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
              />
      
            </div>
            {scanError && (
              <div className="scan-error">
                {scanError}
              </div>
            )}

            {/* START SCAN */}
            <button
               className="scan-button"
               onClick={handleScan}
               disabled={isScanning}
             >
               <span>
                 {isScanning ? "SCANNING..." : "START SCAN"}
               </span>
             
               <span className="scan-arrow">
                 {isScanning ? "◌" : "→"}
               </span>
             </button>
      
          </div>
        </div>
      )}
      </div>
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