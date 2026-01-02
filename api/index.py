import os
import json
import httpx
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    docs_url="/api/docs", 
    openapi_url="/api/openapi.json"
)

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
ELEVENLABS_KEY = os.environ.get("ELEVENLABS_KEY") 

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

def generate_wwise_map(results: List[EventOutput], project_name: str) -> str:
    output = "Audio File\tObject Path\tObject Type\tNotes\n"
    
    for event in results:
        clean_name = event.name.replace(" ", "")
        container_path = f"\\Actor-Mixer Hierarchy\\Default Work Unit\\<Folder>{project_name}\\<Random Container>Sfx_{clean_name}"
        
        for i, url in enumerate(event.variations):
            filename = f"{event.name.replace(' ', '_')}_{i}.mp3"
            line = f"C:\\Mirelo_Assets\\{filename}\t{container_path}\tSound SFX\tAI Generated\n"
            output += line
            
    return output

async def analyse_timestamps(video_url: str) -> List[EventInput]:
    try:
        async with httpx.AsyncClient(verify=False) as http_client:
            response = await http_client.get(video_url)
            if response.status_code != 200:
                raise ValueError("Failed to download video")
            video_bytes = response.content

        prompt_text = """
        You are a Senior Combat Audio Designer for a AAA fighting game (like Tekken, Street Fighter, or God of War).
        Your task is to perform a frame-by-frame "Spotting Session" for the provided gameplay footage.

        ### 1. IDENTIFY COMBAT EVENTS (Archetypes)
        Scan the video for these specific combat audio events:
        - **IMPACTS:** Punches, kicks, weapon hits, body slams.
        - **WHOOSHES:** Weapon swings, arm movements (these often happen *before* an impact).
        - **FOLEY:** Footsteps, jump landings, body falls, cloth rustles.
        - **VOCALS:** Effort grunts (attacking), pain grunts (getting hit).

        ### 2. TIMING & DURATION RULES (STRICT):
        - **START TIME:** Must be the EXACT frame the action initiates. Precision is key for combat sync.
        - **DURATION (THE 1.0s RULE):**
          - Combat sounds need "tails" (decay/reverb) to sound powerful.
          - **Logic:** `Final_Duration = MAX(Visual_Duration, 1.0)`
          - *Example:* A jab is 0.1s visually. Output `1.0` (Impact + Decay).
          - *Example:* A slow-motion kill cam is 3.5s. Output `3.5`.
          - **NEVER** output a duration less than 1.0 and greater than 10.

        ### 3. PROMPT ENGINEERING (VISCERAL QUALITY):
        Provide 3 DISTINCT prompts for an SFX generator. Use "Visceral" language.
        - **Bad:** "Punch sound."
        - **Good:** "Heavy, bone-crunching impact, wet meat texture, low-end sub-bass thud, aggressive transient."
        - **Good:** "High-velocity air whoosh, sharp snapping cloth sound, cutting through air."

        ### OUTPUT FORMAT:
        Return ONLY a raw JSON array.
        
        [
            {
                "name": "Heavy_Right_Hook",
                "start": 1.42, 
                "duration": 1.0, 
                "prompts": [
                    "Visceral bone-crushing impact with wet gore texture...",
                    "Dry, heavy leather glove hitting face, sharp snap...",
                    "Low-frequency cinametic boom punch..."
                ]
            }
        ]
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

    async with httpx.AsyncClient(verify=False, timeout=60.0) as http_client:
        for event in events:
            print(event)
            variations = []
            
            for i in range(3):
                text_prompt = event.prompts[i] if i < len(event.prompts) else ""
                
                payload = {
                    "video_url": video.url,
                    "start_offset": event.start,
                    "duration": event.duration,
                    "text_prompt": text_prompt,
                    "seed": i * 100 + 55,
                    "model_version": "latest", 
                }
                
                try:
                    resp = await http_client.post(
                        "https://api.mirelo.ai/video-to-sfx",
                        json=payload,
                        headers={"x-api-key": MIRELO_KEY}
                    )

                    if resp.status_code in [200, 201]:
                        data = resp.json()
                        url = data.get("output_paths")[0]
                        print(f"✓ Mirelo success: {event.name} variation {i+1}")
                    else:
                        print(f"⚠️ Mirelo Error {resp.status_code}: {resp.text}") 
                        
                except Exception as e:
                    print(f"   Mirelo Call Failed: {e}")

                variations.append(url)

            if variations:
                try:
                    supabase.table("assets").insert({
                        "project": video.project,
                        "event_name": event.name,
                        "timestamp": event.start,
                        "variations": variations,
                    }).execute()
                except Exception:
                    pass

            results.append(EventOutput(
                name=event.name, 
                variations=variations, 
                prompts=event.prompts, 
                start=event.start, 
                duration=event.duration
            ))

    wwise_data = generate_wwise_map(results, video.project)

    return {
        "status": "success", 
        "data": results,
        "wwise_import_map": wwise_data
    }

class ManualEventInput(BaseModel):
    project: str
    video_url: str
    event_name: str
    start: float
    duration: float
    text_prompt: str

@app.post("/api/create-manual-event")
async def create_manual_event(input: ManualEventInput):
    """Create a single event manually with one text prompt, generate 1 variation"""
    
    payload = {
        "video_url": input.video_url,
        "start_offset": input.start,
        "duration": input.duration,
        "text_prompt": input.text_prompt,
        "seed": 55,
        "model_version": "latest",
    }
    
    url = None
    
    async with httpx.AsyncClient(verify=False, timeout=60.0) as http_client:
        try:
            resp = await http_client.post(
                "https://api.mirelo.ai/video-to-sfx",
                json=payload,
                headers={"x-api-key": MIRELO_KEY}
            )
            
            if resp.status_code in [200, 201]:
                data = resp.json()
                url = data.get("output_paths")[0]
                print(f"✓ Manual event created: {input.event_name}")
            else:
                print(f"⚠️ Mirelo Error {resp.status_code}: {resp.text}")
                raise HTTPException(status_code=resp.status_code, detail=f"Mirelo API error: {resp.text}")
                
        except httpx.HTTPError as e:
            print(f"✗ HTTP Error: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to call Mirelo API: {str(e)}")
    
    if not url:
        raise HTTPException(status_code=500, detail="No audio URL received from Mirelo")
    
    try:
        result = supabase.table("assets").insert({
            "project": input.project,
            "event_name": input.event_name,
            "timestamp": input.start,
            "variations": [url],
            "prompts": [input.text_prompt]
        }).execute()
        
        return {
            "status": "success",
            "event": {
                "name": input.event_name,
                "start": input.start,
                "duration": input.duration,
                "variations": [url],
                "prompts": [input.text_prompt]
            }
        }
    except Exception as e:
        print(f"✗ Database error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save to database: {str(e)}")

class RegenerateVariationInput(BaseModel):
    event_id: int
    variation_index: int
    video_url: str
    start: float
    duration: float
    text_prompt: str

@app.post("/api/regenerate-variation")
async def regenerate_variation(input: RegenerateVariationInput):
    """Regenerate a specific variation with a new text prompt"""
    
    payload = {
        "video_url": input.video_url,
        "start_offset": input.start,
        "duration": input.duration,
        "text_prompt": input.text_prompt,
        "seed": input.variation_index * 100 + 55,
        "model_version": "latest",
    }
    
    new_url = None
    
    async with httpx.AsyncClient(verify=False, timeout=60.0) as http_client:
        try:
            resp = await http_client.post(
                "https://api.mirelo.ai/video-to-sfx",
                json=payload,
                headers={"x-api-key": MIRELO_KEY}
            )
            
            if resp.status_code in [200, 201]:
                data = resp.json()
                new_url = data.get("output_paths")[0]
                print(f"✓ Variation regenerated for event ID {input.event_id}, index {input.variation_index}")
            else:
                print(f"⚠️ Mirelo Error {resp.status_code}: {resp.text}")
                raise HTTPException(status_code=resp.status_code, detail=f"Mirelo API error: {resp.text}")
                
        except httpx.HTTPError as e:
            print(f"✗ HTTP Error: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to call Mirelo API: {str(e)}")
    
    if not new_url:
        raise HTTPException(status_code=500, detail="No audio URL received from Mirelo")
    
    try:
        event_data = supabase.table("assets").select("*").eq("id", input.event_id).execute()
        
        if not event_data.data:
            raise HTTPException(status_code=404, detail="Event not found")
        
        event = event_data.data[0]
        variations = event.get("variations", [])
        prompts = event.get("prompts", [])
        
        # Update the specific variation and prompt
        if input.variation_index < len(variations):
            variations[input.variation_index] = new_url
        
        if input.variation_index < len(prompts):
            prompts[input.variation_index] = input.text_prompt
        
        # Update database
        supabase.table("assets").update({
            "variations": variations,
            "prompts": prompts
        }).eq("id", input.event_id).execute()
        
        return {
            "status": "success",
            "variation": {
                "index": input.variation_index,
                "url": new_url,
                "prompt": input.text_prompt
            }
        }
    except Exception as e:
        print(f"✗ Database error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update database: {str(e)}")