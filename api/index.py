import os
import json
import httpx
import urllib3
from typing import List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from google import genai
from google.genai import types
from dotenv import load_dotenv

urllib3.disable_warnings()
load_dotenv()

app = FastAPI(docs_url="/api/docs", openapi_url="/api/openapi.json")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
MIRELO_KEY = os.environ.get("MIRELO")
GEMINI_KEY = os.environ.get("GEMINI")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
client = genai.Client(api_key=GEMINI_KEY)

class Video(BaseModel):
    url: str
    project: str

class EventInput(BaseModel):
    name: str
    start: float
    duration: float
    prompts: List[str] 

class EventOutput(BaseModel):
    name: str
    variations: List[str]
    prompts: List[str]
    start: float
    duration: float

async def analyse_timestamps(video_url: str) -> List[EventInput]:
    try:
        async with httpx.AsyncClient(verify=False) as http_client:
            response = await http_client.get(video_url)
            if response.status_code != 200:
                raise ValueError("Failed to download video")
            video_bytes = response.content

        prompt_text = """
        You are a Game Audio Director. Watch this gameplay video.
        Identify discrete actions that require sound effects.
        For each action, provide:
        1. A short name.
        2. The start timestamp and duration(duration needs to be atleast 1 sec)
        3. A list of 3 DISTINCT text prompts to generate this sound.
        Return pure JSON.
        """

        response = client.models.generate_content(
            model="gemini-flash-latest",
            contents=types.Content(
                parts=[
                    types.Part(
                        inline_data=types.Blob(
                            data=video_bytes, 
                            mime_type='video/mp4'
                        )
                    ),
                    types.Part(text=prompt_text)
                ]
            ),
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=list[EventInput]
            )
        )
        
        events_parsed = json.loads(response.text)
        return [EventInput(**e) for e in events_parsed]

    except Exception as e:
        print(f"Analysis Error: {e}")
        return []

@app.post("/api/process")
async def process(video: Video):
    events = await analyse_timestamps(video.url)
    
    if not events:
        raise HTTPException(status_code=500, detail="Analysis failed")

    results = []

    async with httpx.AsyncClient(verify=False) as http_client:
        for event in events:
            print(event)
            variations = []
            for i in range(3):
                payload = {
                    "video_url": video.url,
                    "start_offset": event.start,
                    "duration": event.duration,
                    "text_prompt": event.prompts[i] if i < len(event.prompts) else "",
                    "seed": i * 100 + 55, 
                }
    
                url = "const"
                
                try:
                    resp = await http_client.post(
                        "https://api.mirelo.ai/video-to-sfx",
                        json=payload,
                        headers={"x-api-key": MIRELO_KEY}
                    )
                    print(resp.status_code)
                    print(resp)
                    if resp.status_code == 200:
                        api_url = resp.json().get("audio_url")
                        if api_url:
                            url = api_url
                        
                except Exception:
                    print("M call failed")
                    pass

                variations.append(url)

            if variations:
                try:
                    result = supabase.table("assets").insert({
                        "project": video.project,
                        "event_name": event.name,
                        "timestamp": event.start,
                        "variations": variations,
                    }).execute()
                    print(f"✓ Saved to DB: {event.name} for project '{video.project}'")
                except Exception as e:
                    print(f"✗ DB insert failed: {e}")
                    pass

            results.append(EventOutput(name=event.name, variations=variations, prompts=event.prompts, start=event.start, duration=event.duration))

    return {"status": "success", "data": results}