# Mirelio Game Forge - Frontend

A professional React + Vite frontend for AI-powered game audio generation.

## Features

- 🎮 Upload gameplay videos to Supabase
- 🤖 AI-powered sound effect generation
- 🎵 Multiple audio variations per event
- 📊 Event timeline visualization
- 🎨 Professional black/white/green UI
- 📱 Fully responsive design

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Add your Supabase credentials and API URL to `.env`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:8000
```

4. Make sure your Supabase project has a `videos` storage bucket:
   - Go to Supabase Dashboard > Storage
   - Create a new bucket named `videos`
   - Set it to public or configure appropriate policies

## Development

Run the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Build

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Usage

1. Enter a project name
2. Upload your gameplay video (MP4 recommended)
3. Click "Generate Audio" and wait for processing
4. View the generated events in the list
5. Click on an event to see details and play audio variations
6. Download your favorite variations

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Supabase** - File storage and database
- **Axios** - HTTP client
- **CSS3** - Modern styling with CSS variables

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── VideoUpload.jsx    # Video upload interface
│   │   ├── EventList.jsx      # Event list display
│   │   └── EventDetail.jsx    # Event details and audio player
│   ├── App.jsx                # Main application component
│   ├── App.css                # Application styles
│   ├── supabaseClient.js      # Supabase configuration
│   ├── main.jsx               # Application entry point
│   └── index.css              # Global styles
├── index.html                 # HTML template
├── vite.config.js            # Vite configuration
└── package.json              # Dependencies and scripts
```

## API Integration

The frontend communicates with the FastAPI backend at `/api/process`:

**Request:**
```json
{
  "url": "https://supabase-url/videos/video.mp4",
  "project": "my-game-project"
}
```

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "name": "Jump Sound",
      "start": 2.5,
      "duration": 1.0,
      "variations": ["url1", "url2", "url3"],
      "prompts": ["prompt1", "prompt2", "prompt3"]
    }
  ]
}
```

## License

MIT
