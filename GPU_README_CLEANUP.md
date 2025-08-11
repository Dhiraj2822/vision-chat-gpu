# GPU-Ready Project Cleanup Instructions

## 1. Remove Unused Files

You can safely delete the following files if you are not using a database, Node.js Ollama, or RunPod integration:

- scripts/create-tables.sql
- scripts/ollama_server.js
- scripts/ollama_server_video.js
- scripts/runpod_integration.py
- app/api/chat/process-video/route.ts
- app/api/process-video/route.ts

## 2. Keep Only These for Video Analysis

- scripts/video_analysis_api.py (main FastAPI backend)
- app/api/llama/route.ts (Next.js API route for uploads)
- app/api/video-analysis-status/[video_id].ts (Next.js API route for polling)
- uploads/ and frames/ directories (for video and frame storage)

## 3. Install All Required Python Packages

```
pip install fastapi uvicorn opencv-python ultralytics python-multipart
```

## 4. Run the Backend (GPU-Ready)

```
uvicorn scripts.video_analysis_api:app --host 0.0.0.0 --port 8000 --reload
```

## 5. Run the Frontend

```
pnpm install   # or npm install
pnpm dev       # or npm run dev
```

## 6. GPU Usage

- YOLOv8 will automatically use your A100 GPU if CUDA is available.
- You can check GPU usage with `nvidia-smi`.

---

**You are now ready for GPU-accelerated video analysis!**

If you want, I can generate the exact shell commands to delete the files for you. Let me know if you want to proceed with the cleanup commands.
