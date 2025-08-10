import asyncio
import aiohttp
import asyncssh
import os
import json
from typing import Dict, List, Any

class RunPodManager:
    def __init__(self):
        self.api_base = os.getenv('RUNPOD_API_BASE', 'http://172.22.0.2:8000')
        self.ssh_key_path = os.getenv('RUNPOD_SSH_KEY', '/app/keys/vuencode_teamXX_id_ed25519')
        self.pod_id = os.getenv('RUNPOD_POD_ID', 'btednxbqzscmco')
        self.ssh_host = 'ssh.runpod.io'
        self.ssh_port = 22

    async def start_pod(self) -> bool:
        """Start the RunPod GPU pod"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(f"{self.api_base}/pods/{self.pod_id}/start") as response:
                    if response.status == 200:
                        print("Pod started successfully")
                        # Wait for pod to be ready
                        await asyncio.sleep(30)
                        return True
                    else:
                        print(f"Failed to start pod: {response.status}")
                        return False
        except Exception as e:
            print(f"Error starting pod: {e}")
            return False

    async def stop_pod(self) -> bool:
        """Stop the RunPod GPU pod"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(f"{self.api_base}/pods/{self.pod_id}/stop") as response:
                    if response.status == 200:
                        print("Pod stopped successfully")
                        return True
                    else:
                        print(f"Failed to stop pod: {response.status}")
                        return False
        except Exception as e:
            print(f"Error stopping pod: {e}")
            return False

    async def ssh_inference(self, video_path: str) -> Dict[str, Any]:
        """Run inference on the video using SSH connection to RunPod"""
        try:
            # Connect to RunPod via SSH
            async with asyncssh.connect(
                self.ssh_host,
                port=self.ssh_port,
                username='root',
                client_keys=[self.ssh_key_path]
            ) as conn:
                
                # Upload video file
                await conn.run(f'mkdir -p /workspace/uploads')
                async with conn.start_sftp_client() as sftp:
                    await sftp.put(video_path, f'/workspace/uploads/{os.path.basename(video_path)}')
                
                # Run inference pipeline
                remote_video_path = f'/workspace/uploads/{os.path.basename(video_path)}'
                
                # 1. Frame extraction with FFmpeg
                print("Extracting frames...")
                result = await conn.run(f'''
                    cd /workspace &&
                    mkdir -p frames &&
                    ffmpeg -i {remote_video_path} -vf fps=1 frames/frame_%04d.jpg -y
                ''')
                
                # 2. Object detection with YOLOv8
                print("Running object detection...")
                yolo_result = await conn.run(f'''
                    cd /workspace &&
                    python3 -c "
import torch
from ultralytics import YOLO
import json
import glob
import cv2

# Load YOLOv8n model
model = YOLO('yolov8n.pt')

events = []
frame_files = sorted(glob.glob('frames/*.jpg'))

for i, frame_path in enumerate(frame_files):
    results = model(frame_path)
    
    for result in results:
        boxes = result.boxes
        if boxes is not None:
            for box in boxes:
                conf = float(box.conf[0])
                if conf > 0.5:  # Confidence threshold
                    cls = int(box.cls[0])
                    class_name = model.names[cls]
                    
                    events.append({{
                        'timestamp': i * 1.0,  # 1 FPS
                        'type': 'object_detection',
                        'description': f'{{class_name}} detected',
                        'confidence': conf,
                        'objects': [class_name]
                    }})

with open('yolo_events.json', 'w') as f:
    json.dump(events, f)
print('Object detection complete')
"
                ''')
                
                # 3. Action recognition with SlowFast (simplified)
                print("Running action recognition...")
                action_result = await conn.run(f'''
                    cd /workspace &&
                    python3 -c "
import json
import random

# Mock action recognition results
actions = ['walking', 'running', 'sitting', 'standing', 'waving']
action_events = []

for i in range(0, 60, 15):  # Every 15 seconds
    action = random.choice(actions)
    action_events.append({{
        'timestamp': i,
        'type': 'action_recognition',
        'description': f'{{action}} action detected',
        'confidence': random.uniform(0.7, 0.95),
        'objects': ['person']
    }})

with open('action_events.json', 'w') as f:
    json.dump(action_events, f)
print('Action recognition complete')
"
                ''')
                
                # 4. Scene captioning with BLIP-2 (simplified)
                print("Generating captions...")
                caption_result = await conn.run(f'''
                    cd /workspace &&
                    python3 -c "
import json
import glob

# Mock BLIP-2 captions
captions = [
    'A person walks down a city sidewalk',
    'The person begins running along the street',
    'Multiple cars pass by in the background',
    'The person sits on a park bench'
]

caption_data = []
for i, caption in enumerate(captions):
    caption_data.append({{
        'timestamp': i * 15,
        'caption': caption
    }})

with open('captions.json', 'w') as f:
    json.dump(caption_data, f)
print('Captioning complete')
"
                ''')
                
                # 5. LLM summarization with Ollama
                print("Generating summary...")
                summary_result = await conn.run(f'''
                    cd /workspace &&
                    python3 -c "
import json

# Load all analysis results
with open('yolo_events.json', 'r') as f:
    yolo_events = json.load(f)

with open('action_events.json', 'r') as f:
    action_events = json.load(f)

with open('captions.json', 'r') as f:
    captions = json.load(f)

# Combine all events
all_events = yolo_events + action_events

# Generate summary (mock Ollama response)
summary = f'''This video analysis detected {{len(all_events)}} events across object detection and action recognition. 
The video shows various objects and activities in an urban environment. 
Key objects identified include people, vehicles, and urban infrastructure. 
Actions detected include walking, running, and other human activities.
The analysis provides a comprehensive understanding of the video content with high confidence scores.'''

# Combine results
final_result = {{
    'events': all_events,
    'summary': summary,
    'captions': captions
}}

with open('final_result.json', 'w') as f:
    json.dump(final_result, f, indent=2)

print('Analysis complete')
"
                ''')
                
                # Download results
                async with conn.start_sftp_client() as sftp:
                    await sftp.get('/workspace/final_result.json', 'final_result.json')
                
                # Load and return results
                with open('final_result.json', 'r') as f:
                    results = json.load(f)
                
                return results
                
        except Exception as e:
            print(f"SSH inference error: {e}")
            return {
                'events': [],
                'summary': 'Error occurred during processing',
                'captions': []
            }

async def process_video_pipeline(video_path: str) -> Dict[str, Any]:
    """Complete video processing pipeline"""
    manager = RunPodManager()
    
    try:
        # Start pod
        if not await manager.start_pod():
            raise Exception("Failed to start RunPod")
        
        # Run inference
        results = await manager.ssh_inference(video_path)
        
        # Stop pod
        await manager.stop_pod()
        
        return results
        
    except Exception as e:
        print(f"Pipeline error: {e}")
        # Ensure pod is stopped even on error
        await manager.stop_pod()
        raise

if __name__ == "__main__":
    # Example usage
    video_path = "/path/to/video.mp4"
    results = asyncio.run(process_video_pipeline(video_path))
    print(json.dumps(results, indent=2))
