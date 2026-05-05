# CommunityPulse

A full‑stack community needs tracker that helps residents report urgent needs (water, health, food, education) and matches them with local volunteers using AI.

## Features

- **Submit a need** – title, category, area, affected count, description
- **View & filter needs** – browse all submitted needs by category
- **AI‑powered volunteer matching** – Gemini ranks volunteers by suitability for each need
- **Volunteer registration** – name, phone, ward, skills, availability
- **Real‑time data** – all needs & volunteers stored in Firestore
- **Responsive UI** – works on desktop and mobile

## Tech Stack

| Layer       | Technology                          |
| ----------- | ----------------------------------- |
| Frontend    | React, Vite, TanStack React Query   |
| Backend     | Node.js, Express                    |
| Database    | Firebase Firestore                  |
| AI          | Google Gemini 1.5 Flash             |
| Styling     | CSS (custom, no framework)          |

## Project Structure
```bash
community-pulse/
├── backend/
│ ├── server.js # Express API
│ ├── seed.js # Dummy data seeder
│ ├── .env.example # Environment template
│ └── package.json
├── frontend/
│ ├── src/
│ │ ├── components/ # React components (Header, SubmitForm, ViewNeeds, etc.)
│ │ ├── api.js # API helper functions
│ │ ├── App.jsx # Main app with routing logic
│ │ └── main.jsx # Entry point
│ ├── index.html
│ ├── vite.config.js
│ └── package.json
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Firebase project with Firestore enabled
- Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/community-pulse.git
cd community-pulse
```
### 2. Backend setup
```bash
cd backend

# Install dependencies
npm install

# Create your environment file
cp .env.example .env
```

# Now open .env and fill in the required values:
```bash
FIRESTORE_PROJECT_ID=your-firebase-project-id
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
PORT=5000
GEMINI_API_KEY=your-gemini-api-key
```

Place your downloaded Firebase service account JSON file inside the backend/ folder and rename it to service-account-key.json (make sure the filename matches the GOOGLE_APPLICATION_CREDENTIALS value).

#### Seed the database with dummy data
```bash
npm run seed
```
This inserts sample community needs and volunteers into your Firestore database so the app isn’t empty.

#### Start the backend server
```bash
npm start
```
The API will be available at http://localhost:5000.

### 3. Frontend setup
#### Open a new terminal and go to the frontend folder:
```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

#### The app will open at http://localhost:3000.
#### API calls to /api are automatically proxied to the backend (thanks to Vite’s configuration).

### Disclaimer
This project is a portfolio / learning example. It intentionally omits authentication and uses relaxed Firestore security rules for development simplicity. It is not production‑ready without additional security considerations.

### License

MIT – feel free to fork, modify, and use it in your own projects.
