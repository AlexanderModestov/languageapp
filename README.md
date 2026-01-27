# LinguaMind

Language learning through content consumption.

## Prerequisites

- Node.js 18+
- Python 3.11+
- Supabase account
- OpenAI API key

## Project Structure

```
LangApp/
├── backend/         # FastAPI backend
│   ├── app/
│   │   ├── core/    # Configuration
│   │   ├── models/  # Data models
│   │   ├── routers/ # API endpoints
│   │   └── services/
│   └── .venv/
└── frontend/        # React + Vite frontend
    └── src/
```

## Setup

### Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv

   # Windows
   .venv\Scripts\activate

   # macOS/Linux
   source .venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create `.env` file from the example:
   ```bash
   cp .env.example .env
   ```

5. Configure environment variables in `.env`:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-service-role-key
   SUPABASE_JWT_SECRET=your-jwt-secret
   OPENAI_API_KEY=your-openai-api-key
   DEBUG=true
   CORS_ORIGINS=["http://localhost:5173"]
   ```

### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file from the example:
   ```bash
   cp .env.example .env
   ```

4. Configure environment variables in `.env`:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_API_URL=http://localhost:8000
   ```

## Running the Application

### Start Backend

```bash
cd backend
.venv\Scripts\activate  # Windows
# or: source .venv/bin/activate  # macOS/Linux

uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`. API docs at `http://localhost:8000/docs`.

### Start Frontend

```bash
cd frontend
npm run dev
```

The app will be available at `http://localhost:5173`.

## Available Scripts

### Backend
- `uvicorn app.main:app --reload` - Run development server

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
