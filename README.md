# Academic Planner with Smart Scheduling & Analytics

A modern academic planning application with AI-powered smart scheduling, dynamic analytics, and seamless task, class, and exam management.


---

## AI TOOLS & TECH STACK USED
- **Gemini API** (Google AI) for Smart Scheduling
- **React 18** (frontend)
- **Redux Toolkit** (state management)
- **Node.js + Express** (backend API)
- **Python** (backend logic, scheduling, analytics)
- **JWT** (authentication)
- **RESTful API** (data exchange)
- **MongoDB** (data storage)
- **lucide-react** (icons)
- **Vite** (frontend tooling)

---

## Features

- **Smart Scheduling:** AI-powered study plan generation based on tasks, classes, and exams using Gemini API, with rule-based fallback.
- **Task, Class & Exam Management:** Add, edit, and delete academic items with rich forms and validation.
- **Interactive Calendar:** Modern month/year calendar with visual task/class/exam indicators.
- **Dynamic Analytics:** Real-time dashboard with study slot stats (total, confirmed, completed) and insights.
- **User Profiles:** Personalize your academic experience.
- **Responsive UI:** Modern, accessible design with modals and popups.
- **Error Handling:** Comprehensive feedback for all user actions.

---

## Tech Stack

- **Frontend:** React 18, Redux Toolkit, Vite, lucide-react
- **Backend:** Node.js, Express, Python (for advanced scheduling/analytics)
- **Database:** MongoDB
- **Authentication:** JWT-based
- **AI Integration:** Gemini API (Google AI Studio)
- **UI Components:** Custom React components, modals, popups

---

## Prerequisites

- Node.js (v16+ recommended)
- Python 3.8+
- MongoDB (v4.0+)
- npm or yarn

---

## Installation

1. **Clone and Install Dependencies**
   ```bash
   git clone https://github.com/yourusername/academic-planner.git
   cd Academic_Planner_Project
   npm install
   cd academic-planner
   npm install
   ```

2. **Environment Setup**
   - Create a `.env` file in the backend directory:
     ```
     PORT=5000
     MONGO_URI=mongodb://localhost:27017/academic_planner
     JWT_SECRET=your_jwt_secret
     GEMINI_API_KEY=your_gemini_api_key
     ```
   - (Optionally) add any other API keys as needed.

3. **Start Development Servers**
   ```bash
   # Start backend server (smart-study-backend)
   npm start

   # Start frontend server (academic-planner)
   cd academic-planner
   npm run dev
   ```

4. **Access the application:**  
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Key Features Implementation

### 1. Authentication System
- JWT-based authentication
- Secure password hashing
- Protected routes and persistent sessions

### 2. Academic Management
- CRUD operations for Tasks, Classes, Exams
- Validation and error handling
- Calendar integration for all items

### 3. Smart Scheduling
- AI-driven study plan generation (Gemini API)
- Rule-based fallback system if AI is unavailable
- Customizable scheduling rules (evenings, weekends, breaks)

### 4. Analytics & Insights
- Real-time stats for study slots (total, confirmed, completed)
- Insights and suggestions for better planning

### 5. User Preferences
- Profile customization
- Theme and notification settings (future roadmap)

---

## API Endpoints

### Authentication
```
POST /api/auth/signup      # Register new user
POST /api/auth/login       # User login
GET  /api/auth/profile     # Get user profile
PUT  /api/auth/profile     # Update user profile
```

### Tasks, Classes, Exams
```
GET    /api/tasks          # Get all tasks
POST   /api/tasks          # Create task
PUT    /api/tasks/:id      # Update task
DELETE /api/tasks/:id      # Delete task

GET    /api/classes        # Get all classes
POST   /api/classes        # Create class
PUT    /api/classes/:id    # Update class
DELETE /api/classes/:id    # Delete class

GET    /api/exams          # Get all exams
POST   /api/exams          # Create exam
PUT    /api/exams/:id      # Update exam
DELETE /api/exams/:id      # Delete exam
```

### Smart Scheduling & Analytics
```
POST   /api/schedule/generate   # Generate smart schedule
GET    /api/analytics           # Get analytics dashboard data
```

---

## Component Structure

```
src/
├── components/
│   ├── Dashboard.jsx      # Main dashboard, calendar, modals
│   ├── SmartSchedule.jsx  # Smart scheduling logic and UI
│   ├── Analytics.jsx      # Analytics dashboard
│   ├── Insights.jsx       # Study insights and suggestions
│   ├── common/            # Reusable UI components
├── store/                 # Redux store and slices
├── api/                   # API integration
├── utils/                 # Utility functions
└── pages/                 # Main page components (login, signup, etc.)
```

---

## Error Handling

The application includes robust error handling for:
- Network/API errors
- Authentication failures
- Data validation
- Token expiration
- Scheduling conflicts
- Server errors

---

## Smart Scheduler Views

- **Daily View:** Schedules for a selected day, arranged by time
- **Weekly View:** Schedules for a week, arranged by day
- **Monthly View:** Calendar layout with schedule summaries per day

---

## AI & Fallback

- **Gemini API** is used for advanced scheduling.  
- If unavailable, a rule-based fallback ensures reliable scheduling using class, task, and exam data.

---

## Contributing

Pull requests and feature suggestions are welcome!

---

