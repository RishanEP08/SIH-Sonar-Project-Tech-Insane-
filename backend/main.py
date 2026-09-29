from pathlib import Path
import shutil
import uuid

from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from ultralytics import YOLO


# ==========================================
# Paths
# ==========================================

# Project root:
# C:\Sonar\SIH-Sonar-Project-Tech-Insane-
BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_PATH = BASE_DIR / "backend" / "models" / "best.onnx"

UPLOAD_DIR = BASE_DIR / "backend" / "uploads"
RESULT_DIR = BASE_DIR / "backend" / "results"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
RESULT_DIR.mkdir(parents=True, exist_ok=True)


# ==========================================
# Load YOLO Model
# ==========================================

print("Loading YOLO model...")
model = YOLO(str(MODEL_PATH))
print("YOLO model loaded successfully.")


# ==========================================
# FastAPI Application
# ==========================================

app = FastAPI(
    title="AI-Powered Underwater Sonar Detection API",
    description="YOLO11n-based Side-Scan Sonar Object Detection",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://swarnadi-1lh1ncct4-tech-support5.vercel.app"    
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# Health Check
# ==========================================

@app.api_route("/",methods=["GET", "HEAD"])
def root():
    return {
        "status": "online",
        "model": "YOLO11n",
        "message": "Side-Scan Sonar Detection API is running"
    }


# ==========================================
# Prediction Endpoint
# ==========================================

@app.post("/predict")
async def predict(file: UploadFile = File(...),
                  latitude: float | None = Form(None),
                  longitude: float | None = Form(None)):

    # Generate a unique ID for this prediction
    file_id = uuid.uuid4().hex

    # Preserve the uploaded file extension
    original_name = Path(file.filename or "image.jpg")
    extension = original_name.suffix.lower()

    if extension not in [".jpg", ".jpeg", ".png", ".bmp", ".webp"]:
        extension = ".jpg"

    input_path = UPLOAD_DIR / f"{file_id}{extension}"

    # Save uploaded image
    with open(input_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # ======================================
    # Run YOLO
    # ======================================

    results = model.predict(
        source=str(input_path),
        conf=0.25,
        imgsz=640,
        save=True,
        project=str(RESULT_DIR),
        name=file_id
    )

    result = results[0]

    # ======================================
    # Extract detections
    # ======================================

    detections = []

    if result.boxes is not None:

        for box in result.boxes:

            class_id = int(box.cls[0])
            confidence = float(box.conf[0])

            coordinates = box.xyxy[0].tolist()

            detections.append({
                "class": model.names[class_id],
                "confidence": round(confidence, 4),
                "box": [
                    round(coordinates[0], 2),
                    round(coordinates[1], 2),
                    round(coordinates[2], 2),
                    round(coordinates[3], 2)
                ]
            })

    # ======================================
    # Response
    # ======================================

    return {
        "success": True,
        "detections": detections,
        "annotated_image": f"/result/{file_id}",
        "location": {
              "latitude": latitude,
              "longitude": longitude
         }
    }


# ==========================================
# Get Annotated Image
# ==========================================

@app.get("/result/{file_id}")
def get_result(file_id: str):

    result_directory = RESULT_DIR / file_id

    if not result_directory.exists():
        return {
            "success": False,
            "error": "Result not found"
        }

    image_files = [
        path
        for path in result_directory.iterdir()
        if path.suffix.lower() in [
            ".jpg",
            ".jpeg",
            ".png",
            ".bmp",
            ".webp"
        ]
    ]

    if not image_files:
        return {
            "success": False,
            "error": "Annotated image not found"
        }

    return FileResponse(image_files[0])


# ==========================================
# Local Development Server
# ==========================================

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True
    )

