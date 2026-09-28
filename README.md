# SWARNADI

### AI-Powered Automated Underwater Marine Debris and Anomaly Detection System using Side-Scan Sonar Imagery

**Smart India Hackathon 2026 — Problem Statement 26057**  
**Team: Tech Insane**  
**Theme: Disaster Management**  
**Category: Software**

> **Prototype Disclaimer:** SWARNADI is a working proof-of-concept prototype developed for Smart India Hackathon 2026. It demonstrates the core workflow of side-scan sonar image upload, AI-based object detection, confidence reporting, and survey-location visualization. It is not presented as a production-ready marine survey, navigation, geospatial, or autonomous underwater vehicle system.

---

## 1. Problem Statement

Side-Scan Sonar (SSS) imagery provides a way to survey underwater environments and detect objects that may otherwise be difficult to observe.

However, manually reviewing large volumes of sonar imagery can be time-consuming and difficult to scale. Underwater debris, abandoned fishing gear, vessels, and other anomalous objects may appear in sonar imagery with varying shapes, textures, shadows, and acoustic characteristics.

The Smart India Hackathon 2026 Problem Statement **26057** proposes an AI-powered system for automated analysis of side-scan sonar imagery, with the broader goal of assisting marine debris and anomaly detection.

The original problem concept includes areas such as:

- Automated side-scan sonar image processing
- Marine debris and anomaly detection
- Object localization and segmentation
- Sonar/GPS-based geotagging
- Interactive visualization
- Noise reduction and sonar-specific preprocessing
- Potential edge deployment for underwater platforms

SWARNADI implements a focused prototype of this broader concept.

---

## 2. Our Prototype

The current prototype focuses on one core objective:

> **Detect potentially relevant objects in side-scan sonar imagery and present the detections together with the associated survey location.**

The implemented workflow is:

```text
Side-Scan Sonar Image
        │
        ▼
   Image Upload
        │
        ▼
   YOLO11n Detector
        │
        ├── Object Class
        ├── Confidence
        └── Bounding Box
        │
        ▼
 Annotated Sonar Image
        │
        ▼
 Survey Coordinates
 (Latitude / Longitude)
        │
        ▼
 Interactive MapLibre Map
        │
        ▼
 Detection Result HUD