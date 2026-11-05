# SCOT AI (Scout AI) - Multi-Sport Computer Vision Pipeline
### Advanced FIVB Volleyball Analytics, Multi-Sport Homography & Cloud Inference Engine

---

## ⚡ Architecture Overview

```
Scot_camber1/
├── config/
│   └── sports_config.yaml         # FIVB, FIFA, FIBA regulation court dimensions, class IDs & thresholds
├── data_prep/
│   ├── extract_frames.py          # OpenCV dynamic FPS frame extraction with temporal clipping
│   └── download_dataset.py        # Roboflow automated YOLOv11 dataset downloader with fallback
├── training/
│   └── train_scot.py              # YOLOv11 detection (yolo11s.pt) & pose (yolo11s-pose.pt) fine-tuning
├── analytics/
│   ├── base_sport_analyzer.py     # Abstract base class: ByteTrack, 2D Homography, speed (km/h), heatmaps
│   ├── volleyball_analyzer.py     # FIVB 6-Zones, 17-Keypoint Action Recognition, Vertical Leap, Spike Speed
│   └── other_sports_basics.py     # Football (K-Means jerseys, possession) & Basketball (Paint, 3PT Arc)
├── api/
│   └── app.py                     # FastAPI microservice with Clerk CORS support, async queues & outputs
└── requirements.txt               # Production Python dependencies
```

---

## 🚀 Quickstart: Google Colab Pro / Camber Cluster

### 1. Installation
```bash
git clone <YOUR_REPO> Scot_camber1
cd Scot_camber1
pip install -r requirements.txt
```

### 2. Extract Match Frames
```bash
python data_prep/extract_frames.py \
  --video_path /content/sample_match.mp4 \
  --sport volleyball \
  --fps 10 \
  --output_dir ./dataset/raw_frames
```

### 3. Download Pre-Annotated Volleyball Dataset
```bash
python data_prep/download_dataset.py \
  --api_key YOUR_ROBOFLOW_API_KEY \
  --output_dir ./dataset/volleyball_yolov11
```

### 4. Fine-Tune YOLOv11
```bash
# Object Detection (Ball, Players, Net, Referee)
python training/train_scot.py \
  --task detect \
  --data ./dataset/volleyball_yolov11/data.yaml \
  --epochs 60 \
  --batch 32 \
  --device 0

# Multi-Person Pose Estimation (Spike, Jump, Setter Dynamics)
python training/train_scot.py \
  --task pose \
  --data ./dataset/volleyball_yolov11/data.yaml \
  --epochs 60 \
  --batch 32 \
  --device 0
```

### 5. Launch FastAPI Microservice
```bash
python api/app.py
# Or with Uvicorn:
uvicorn api.app:app --host 0.0.0.0 --port 8000 --reload
```

---

## 📡 API Endpoints

- **`GET /health`**: Verifies GPU acceleration, CUDA VRAM availability, and system status.
- **`POST /analyze/{sport_type}`**: Uploads match video, runs ByteTrack + Pose + FIVB Rules, and returns:
  1. Annotated MP4 URL (`/outputs/{job_id}_annotated.mp4`)
  2. Spatial Heatmap URL (`/outputs/{job_id}_heatmap.png`)
  3. Structured JSON Report URL (`/outputs/{job_id}_analytics_report.json`)
- **`GET /jobs/{job_id}`**: Polling progress and live status.

