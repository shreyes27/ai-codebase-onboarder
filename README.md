# AI Codebase Onboarder

> **Understand any GitHub repository before you dive into the code.**

AI Codebase Onboarder analyzes a GitHub repository, understands its structure and dependencies, identifies important files and entry points, and generates a **grounded developer onboarding guide** using an LLM.

Instead of manually navigating hundreds or thousands of files, developers can provide a repository URL and get a structured explanation of how the codebase is organized, where to start, and how the major components connect.

## 🚀 Live Demo

**Live:** https://ai-codebase-onboarder-h4730mj3n-shreyes27s-projects.vercel.app

**Repository:** https://github.com/shreyes27/ai-codebase-onboarder

---

## ✨ Features

* 🔗 **GitHub Repository Analysis**
  Analyze public GitHub repositories directly from their URL.

* 🧠 **Intelligent Codebase Understanding**
  Detects repository type, project structure, dependencies, important files, modules, and entry points.

* 🎯 **Relevant File Prioritization**
  Filters and prioritizes files instead of blindly sending the entire repository to an LLM.

* 📚 **Context-Aware Onboarding Guide**
  Builds structured context from repository metadata, README content, dependencies, module summaries, and code snippets.

* 🤖 **LLM-Powered Explanation**
  Uses **Groq** as the primary provider to generate the onboarding guide.

* 🛡️ **Grounding & Validation**
  Validates generated guides against the analyzed repository and detects invalid file-path references.

* 🔧 **Automatic Repair**
  Can repair generated content when validation identifies path-related issues.

* ⚡ **Caching**
  Repeated analysis of the same repository can reuse cached results instead of unnecessarily regenerating the guide.

* 📊 **Persistent Usage Statistics**
  Successful fresh analyses are tracked using Firebase Firestore.

* 🌐 **Production Deployment**
  Frontend and backend are deployed separately for a real production workflow.

---

## 🧩 How It Works

```text
GitHub Repository
        │
        ▼
   Repository Clone
        │
        ▼
   Repository Scan
        │
        ▼
 Project Type Detection
        │
        ▼
 Dependency Analysis
        │
        ▼
 Relevant File Selection
        │
        ▼
 File Prioritization
        │
        ▼
 Entry Point Detection
        │
        ▼
 Module Analysis
        │
        ▼
 Structured Context Builder
        │
        ▼
      Groq LLM
        │
        ▼
 Onboarding Guide
        │
        ▼
 Validation
        │
        ├── Valid ──────────► Final Guide
        │
        └── Issues ─────────► Repair ──► Final Guide
```

The system follows a **context-first approach**: rather than passing an entire repository to the model, it analyzes and compresses the codebase into relevant structured context first.

---

## 🏗️ Architecture

### Frontend

The React frontend provides:

* Repository URL input
* Analysis state and loading feedback
* Onboarding guide presentation
* Navigation and project information
* Production API integration

**Stack:**

* React
* Vite
* Tailwind CSS
* JavaScript

### Backend

The FastAPI backend handles the complete analysis pipeline:

* Repository cloning
* File and folder scanning
* Project detection
* Dependency extraction
* File relevance scoring
* Entry-point detection
* Module analysis
* Context construction
* LLM generation
* Response validation
* Cache management
* Statistics

**Stack:**

* Python
* FastAPI
* Uvicorn

### AI Layer

The project uses an LLM abstraction layer so the provider can be configured independently from the analysis pipeline.

**Primary provider:**

* Groq
* `openai/gpt-oss-120b`

**Optional local provider:**

* Ollama

This allows local development without making the entire application dependent on a cloud LLM.

### Persistence

Firebase Firestore stores global analysis statistics.

```text
stats
 └── global
      └── repos_analyzed
```

Only successful **fresh analyses** increment the counter. Cached analyses are excluded.

---

## 🛠️ Tech Stack

| Layer               | Technology         |
| ------------------- | ------------------ |
| Frontend            | React              |
| Build Tool          | Vite               |
| Styling             | Tailwind CSS       |
| Backend             | FastAPI            |
| Language            | Python             |
| Server              | Uvicorn            |
| AI Provider         | Groq               |
| Local AI            | Ollama             |
| Database            | Firebase Firestore |
| Repository Source   | GitHub             |
| Frontend Deployment | Vercel             |
| Backend Deployment  | Render             |

---

## 📂 Project Structure

```text
ai-codebase-onboarder/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── ...
│   ├── .env
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── app/
│   │   ├── routes/
│   │   ├── services/
│   │   │   ├── analysis_pipeline.py
│   │   │   ├── context_builder.py
│   │   │   ├── github_service.py
│   │   │   ├── response_validator.py
│   │   │   └── stats_service.py
│   │   └── main.py
│   │
│   ├── requirements.txt
│   └── .env.example
│
├── .gitignore
└── README.md
```

---

## 🔌 API

### `GET /`

Health check for the backend.

### `GET /api/stats`

Returns persistent repository analysis statistics.

Example:

```json
{
  "repos_analyzed": 4
}
```

### `POST /api/analyze`

Analyzes the supplied GitHub repository and builds the structured codebase context.

### `POST /api/onboard`

Generates the final onboarding guide using the analyzed context and configured LLM provider.

Example request:

```json
{
  "repo_url": "https://github.com/expressjs/express"
}
```

---

## ⚙️ Local Development

### Prerequisites

* Node.js 20+
* Python 3.13+
* Git
* A Groq API key for cloud LLM generation

Ollama can optionally be used for local inference.

### 1. Clone the repository

```bash
git clone https://github.com/shreyes27/ai-codebase-onboarder.git
cd ai-codebase-onboarder
```

### 2. Backend setup

```bash
cd server

python -m venv venv
```

Windows:

```powershell
.\venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file based on `.env.example`.

```env
LLM_PROVIDER=groq

GROQ_API_KEY=your_groq_api_key
GROQ_BASE_URL=https://api.groq.com/openai/v1
GROQ_MODEL=openai/gpt-oss-120b

OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
OLLAMA_TIMEOUT_SECONDS=300
```

Start the backend:

```bash
uvicorn app.main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

API documentation:

```text
http://127.0.0.1:8000/docs
```

### 3. Frontend setup

Open another terminal:

```bash
cd client
npm install
```

Create:

```text
client/.env
```

with:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Start the frontend:

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

## 🔐 Environment Variables

### Backend

| Variable                         | Purpose                                  |
| -------------------------------- | ---------------------------------------- |
| `LLM_PROVIDER`                   | Selects the active LLM provider          |
| `GROQ_API_KEY`                   | Groq authentication                      |
| `GROQ_BASE_URL`                  | Groq API base URL                        |
| `GROQ_MODEL`                     | Groq model used for generation           |
| `OLLAMA_BASE_URL`                | Local Ollama server                      |
| `OLLAMA_MODEL`                   | Local Ollama model                       |
| `OLLAMA_TIMEOUT_SECONDS`         | Ollama request timeout                   |
| `GOOGLE_APPLICATION_CREDENTIALS` | Firebase service-account credential path |

### Frontend

| Variable            | Purpose              |
| ------------------- | -------------------- |
| `VITE_API_BASE_URL` | Backend API base URL |

> **Never commit API keys or Firebase service-account credentials to Git.**

---

## 🧠 Design Approach

A major design goal of the project is to avoid treating a repository as a single large text blob.

The backend progressively reduces the repository into useful context:

```text
Thousands of Files
       ↓
Repository Structure
       ↓
Relevant Files
       ↓
Prioritized Files
       ↓
Entry Points
       ↓
Modules
       ↓
Structured Context
       ↓
LLM
```

This approach helps keep LLM input focused on the parts of the codebase that are most useful for onboarding.

---

## 🛡️ Grounding & Validation

LLM-generated documentation can sometimes reference files or paths that do not exist.

To reduce this problem, the project includes a validation layer that checks generated onboarding content against the analyzed repository context.

The validator can detect:

* Unknown file paths
* Invalid repository references
* Path mismatches

When repairable issues are found, the system can perform a targeted repair pass instead of regenerating the entire guide.

---

## ⚡ Caching

Repository analysis and onboarding generation use caching to avoid unnecessary repeated work.

For repeated requests, the system can return previously generated results when the relevant cache entry is available.

This improves:

* Response time
* LLM efficiency
* Resource usage
* User experience

Cached analyses do **not** count as new repository analyses in the persistent statistics.

---

## ☁️ Deployment

### Frontend — Vercel

The React/Vite frontend is deployed on Vercel.

```text
Vercel
   │
   ▼
React Frontend
   │
   ▼
Production API
```

### Backend — Render

The FastAPI backend is deployed on Render.

```text
Render
   │
   ▼
FastAPI
   │
   ├── Repository Analysis
   ├── Groq
   ├── Validation
   ├── Cache
   └── Firebase
```

### Database — Firebase

Firestore provides persistent storage for production usage statistics.

---

## 📈 Production Verification

The deployed application has been tested through the complete production flow:

```text
Vercel Frontend
      ↓
Render API
      ↓
GitHub Repository
      ↓
Repository Analysis
      ↓
Groq Generation
      ↓
Guide Validation
      ↓
Firebase Statistics
```

Fresh repository analyses are reflected in the production statistics, while repeated cached analyses are excluded from the count.

---

## 🔮 Future Improvements

Possible future improvements include:

* Private GitHub repository support
* GitHub OAuth integration
* Incremental repository analysis
* Commit-history-aware onboarding
* More language/framework-specific analyzers
* Dependency graph visualization
* Interactive codebase exploration
* Pull-request-aware onboarding
* Team/project workspace support

---

## 👨‍💻 Author

**Shreyes Kanchan**

B.Tech CSE — AI Specialization

* GitHub: https://github.com/shreyes27
* Project: https://github.com/shreyes27/ai-codebase-onboarder

---

## 📄 License

This project is available under the MIT License.
