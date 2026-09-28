from ultralytics import YOLO
from tkinter import Tk, filedialog
from pathlib import Path


# =========================
# Configuration
# =========================

MODEL_PATH = "backend/models/best.pt"
CONFIDENCE = 0.25
IMAGE_SIZE = 640


# =========================
# Select Image
# =========================

def select_image():
    root = Tk()
    root.withdraw()

    image_path = filedialog.askopenfilename(
        title="Select a Side-Scan Sonar Image",
        filetypes=[
            ("Image files", "*.jpg *.jpeg *.png *.bmp *.webp"),
            ("All files", "*.*")
        ]
    )

    root.destroy()
    return image_path


# =========================
# Main Inference
# =========================

def main():

    print("Loading sonar detection model...")
    model = YOLO(MODEL_PATH)

    print("\nSelect a Side-Scan Sonar image.")
    image_path = select_image()

    if not image_path:
        print("No image selected.")
        return

    print(f"\nSelected image: {image_path}")
    print("Running detection...\n")

    results = model.predict(
        source=image_path,
        conf=CONFIDENCE,
        imgsz=IMAGE_SIZE,
        save=True
    )

    for result in results:

        print("=" * 50)
        print("DETECTIONS")
        print("=" * 50)

        if result.boxes is None or len(result.boxes) == 0:
            print("No objects detected.")
        else:
            for box in result.boxes:

                cls = int(box.cls[0])
                conf = float(box.conf[0])
                xyxy = box.xyxy[0].tolist()

                class_name = model.names[cls]

                print(
                    f"{class_name:10s} "
                    f"confidence={conf:.3f} "
                    f"box={[round(x, 1) for x in xyxy]}"
                )

        print("\nAnnotated image saved to:")
        print(result.save_dir)


if __name__ == "__main__":
    main()

