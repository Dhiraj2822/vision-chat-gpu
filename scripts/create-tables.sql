-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS video_analyses CASCADE;

-- Create video_analyses table with metadata column
CREATE TABLE video_analyses (
    id TEXT PRIMARY KEY,
    video_url TEXT NOT NULL,
    events JSONB NOT NULL DEFAULT '[]',
    summary TEXT NOT NULL,
    captions JSONB NOT NULL DEFAULT '[]',
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_messages table
CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    video_id TEXT NOT NULL,
    user_message TEXT NOT NULL,
    assistant_response TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (video_id) REFERENCES video_analyses(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_video_analyses_created_at ON video_analyses(created_at);
CREATE INDEX idx_chat_messages_video_id ON chat_messages(video_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);

-- Add some sample data for testing (optional)
INSERT INTO video_analyses (id, video_url, events, summary, captions, metadata) VALUES 
(
    'sample_video_1',
    '/sample-video.mp4',
    '[
        {
            "timestamp": 5.2,
            "type": "object_detection",
            "description": "Person walking detected",
            "confidence": 0.95,
            "objects": ["person", "sidewalk", "building"]
        }
    ]'::jsonb,
    'Sample video analysis for testing purposes.',
    '[
        {
            "timestamp": 0,
            "caption": "A person walks down a city sidewalk"
        }
    ]'::jsonb,
    '{
        "filename": "sample-video.mp4",
        "size": 1048576,
        "duration": 30,
        "processedAt": "2024-01-01T00:00:00.000Z"
    }'::jsonb
);
