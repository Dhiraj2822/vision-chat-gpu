from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from ultralytics import YOLO
import cv2
import os
import uuid
import json

app = FastAPI()
model = YOLO("yolov8x.pt")  # Use the largest model, you have the VRAM!
UPLOAD_DIR = "uploads"
FRAME_DIR = "frames"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(FRAME_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

def extract_and_analyze_frames(video_path, video_id, interval_sec=30):
    vidcap = cv2.VideoCapture(video_path)
    fps = vidcap.get(cv2.CAP_PROP_FPS)
    frame_count = int(vidcap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = frame_count / fps
    results = []
    for sec in range(0, int(duration), interval_sec):
        vidcap.set(cv2.CAP_PROP_POS_MSEC, sec * 1000)
        success, image = vidcap.read()
        if success:
            frame_path = os.path.join(FRAME_DIR, f"{video_id}_frame_{sec}.jpg")
            cv2.imwrite(frame_path, image)
            yolo_result = model(frame_path)
            detections = yolo_result[0].boxes.data.tolist()
            results.append({"timestamp": sec, "frame": frame_path, "detections": detections})
    vidcap.release()
    with open(f"{FRAME_DIR}/{video_id}_results.json", "w") as f:
        json.dump(results, f)

@app.post("/analyze-video")
async def analyze_video(
    video: UploadFile = File(...),
    prompt: str = Form("Describe this video."),
    background_tasks: BackgroundTasks = None
):
    video_id = str(uuid.uuid4())
    video_filename = f"{video_id}_{video.filename}"
    video_path = os.path.join(UPLOAD_DIR, video_filename)
    with open(video_path, "wb") as buffer:
        buffer.write(await video.read())

    # Immediate: analyze first frame only
    vidcap = cv2.VideoCapture(video_path)
    success, image = vidcap.read()
    first_frame_path = os.path.join(FRAME_DIR, f"{video_id}_frame_0.jpg")
    if success:
        cv2.imwrite(first_frame_path, image)
        yolo_result = model(first_frame_path)
        detections = yolo_result[0].boxes.data.tolist()
    else:
        detections = []
    vidcap.release()

    # Background: analyze all frames at interval
    background_tasks.add_task(extract_and_analyze_frames, video_path, video_id, 30)

    return JSONResponse(content={
        "video_id": video_id,
        "video_url": f"http://localhost:8000/uploads/{video_filename}",
        "first_frame_analysis": {
            "frame": first_frame_path,
            "detections": detections
        },
        "status": "processing"
    })

@app.get("/video-analysis-status/{video_id}")
async def get_video_analysis_status(video_id: str):
    result_path = f"{FRAME_DIR}/{video_id}_results.json"
    if os.path.exists(result_path):
        with open(result_path, "r") as f:
            results = json.load(f)
        return JSONResponse(content={"status": "done", "results": results})
    else:
        return JSONResponse(content={"status": "processing"})
