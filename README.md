# SAP_Team-Untitled

To run chatbot backend refer to : (Running_Chatbots)[Agentic_SAP/Running_Chatbots_Guide.md]

# AI-Powered Mentor-Mentee Platform

A comprehensive web application that facilitates mentoring relationships in IT departments with AI-powered assistance, course recommendations, and team management features.

## Features

### Core Functionality

- **AI Mentor Suggestion System**: Get intelligent suggestions for mentoring conversations
- **Practice Mentoring Mode**: Simulate mentee interactions to improve mentoring skills
- **Smart Course Recommendations**: AI-powered course suggestions based on skill gaps
- **Goal Tracking & Analytics**: Visual progress tracking with milestone management
- **Smart Calendar Integration**: Deadline management with automated reminders
- **Feedback Aggregation**: Collect and analyze feedback from multiple sources
- **Team Management**: Supervisor dashboards and progress notifications

### AI-Powered Features

- **Mentor Mode**: Toggle-able chat mode providing real-time mentoring suggestions
- **Practice Sessions**: AI acts as mentee for realistic scenario practice
- **Skill Gap Analysis**: Intelligent matching of learning opportunities
- **Personalized Learning Paths**: Adaptive course recommendations
- **Automated Progress Insights**: AI-generated improvement recommendations

### User Experience

- **Modern Design**: Clean, professional interface with dark/light mode
- **Responsive Layout**: Optimized for desktop, tablet, and mobile devices
- **Real-time Updates**: Live notifications and progress tracking
- **Interactive Dashboards**: Comprehensive analytics and visualizations

## Getting Started

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/RISHASUN001/SAP_Team-Untitled.git
   cd SAP_Team-Untitled/Agentic_SAP
   ```

2. **Install frontend dependencies**

   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd server
   pip install -r requirements.txt
   cd ..
   ```

### Running the Application

#### Starting the Backend Services

Navigate to the server directory:

```bash
cd Agentic_SAP/server
```

For macOS/Linux:

```bash
./start_all_backends.sh
```

For Windows:

```bash
./start_all_backends.ps1
```

This will start all required backend services including mentor mode API, practice mode API, onboarding chat API, and timeline API.

#### Starting the Frontend

In a new terminal, navigate to the project root:

```bash
cd Agentic_SAP/src
```

Start the development server:

```bash
npm run dev
```

#### Access the application

- Frontend: http://localhost:5173

#### Stopping the Backend

From the server directory:

For macOS/Linux:

```bash
./stop_all_backends.sh
```

## 👥 Demo Users

The platform includes three pre-configured demo users:

### Manager Profile

- **Name**: Sarah Chen
- **Role**: Data Science Team Lead
- **Experience**: Newly joined as a Manager
- **Skills**: Python, Machine Learning, Team Management, Strategic Planning

### Team Member 1

- **Name**: Alex Rodriguez
- **Role**: Junior Data Scientist
- **Experience**: 1.5 years
- **Skill Gaps**: Deep Learning, MLOps, Cloud Computing

### Team Member 2

- **Name**: Jordan Kim
- **Role**: Data Analyst
- **Experience**: New joinee
- **Skill Gaps**: Python, Advanced Analytics, Automation

## Key Features Overview

### 1. AI Mentor Assistant

- **Mentor Mode**: Get suggestions on tone, approach, and follow-up questions
- **Practice Mode**: Simulate real mentoring scenarios with AI feedback
- **Context-Aware**: Responses adapt to user profile and conversation history

### 2. Intelligent Course System

- **Skill Gap Analysis**: Compare current vs target skills
- **Personalized Recommendations**: AI-powered course matching
- **Progress Tracking**: Visual timeline with milestone tracking
- **Completion Analytics**: Detailed progress insights

### 3. Smart Goal Management

- **Visual Progress Tracking**: Interactive progress bars and charts
- **Milestone Management**: Break goals into manageable steps
- **Automated Reminders**: Smart deadline notifications
- **Success Analytics**: Achievement tracking and insights

### 4. Comprehensive Analytics

- **Learning Progress**: Track skill development over time
- **Mentoring Effectiveness**: Session analytics and feedback trends

## Project Structure

### Frontend (`/src`)

- `/components`: UI components (Chat, Calendar, Dashboard, etc.)
- `/contexts`: React context providers for state management
- `/data`: Mock data and utilities
- `/hooks`: Custom React hooks
- `/pages`: Main page components
- `/utils`: Helper functions

### Backend (`/server`)

- `/chatbot`: AI agent implementations for different modes
  - `mentor_mode.py`: Mentor suggestion system
  - `practice_mode.py`: Interactive practice scenarios
  - `onboarding_mode.py`: New employee onboarding assistance and FAQ
- `/chroma_db`: Vector database for knowledge storage
- `/data`: Backend data storage
- `start_all_backends.sh`: Script to launch all backend services
- `stop_all_backends.sh`: Script to stop all backend services

### Architecture

The application uses a microservice architecture with several backend services:

- Mentor mode API (port 5001)
- Practice mode API (port 5002)
- Onboarding chat API (port 5003)
- Timeline API (port 5004)

Each service is responsible for a specific aspect of the application's functionality.

- **Team Performance**: Manager dashboards with team insights
- **Predictive Analytics**: AI-powered improvement suggestions

### 5. Calendar Integration

- **Smart Scheduling**: Integrated calendar with conflict detection
- **Meeting Management**: Automated meeting suggestions and follow-ups
- **Deadline Tracking**: Visual timeline with priority management
- **Teams Integration**: Seamless Microsoft Teams connectivity

## Technical Architecture

### Frontend

- **React 18**: Modern component-based architecture
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling with custom design system
- **React Router**: Client-side routing
- **Recharts**: Interactive data visualizations
- **Context API**: State management

### Backend

- **Node.js/Express**: RESTful API server
- **Mock Data**: Comprehensive demo dataset
- **UUID**: Unique identifier generation
- **CORS**: Cross-origin resource sharing

### Design System

- **Color Palette**: Primary blue, success green, warning amber, error red
- **Typography**: Hierarchical font system with proper contrast
- **Spacing**: Consistent 8px grid system
- **Components**: Reusable UI components with consistent styling
- **Animations**: Smooth transitions and micro-interactions

## User Interface Features

### Dashboard

- **Stats Overview**: Key metrics and progress indicators
- **Quick Actions**: Fast access to core features
- **Recent Activity**: Timeline of recent interactions
- **Goal Progress**: Visual progress tracking

### Chat Interface

- **Mode Toggle**: Switch between mentor and practice modes
- **Real-time Suggestions**: Context-aware mentoring tips
- **Conversation History**: Persistent chat sessions
- **Quick Actions**: Pre-defined conversation starters

### Course Catalog

- **Smart Search**: AI-powered course discovery
- **Filter System**: Multi-criteria course filtering
- **Recommendation Engine**: Personalized course suggestions
- **Progress Tracking**: Course completion analytics

### Goal Management

- **Visual Timeline**: Interactive milestone tracking
- **Progress Controls**: Easy progress updates
- **Category System**: Organized goal classification
- **Achievement Celebrations**: Success recognition

### Analytics Dashboard

- **Multi-tab Interface**: Organized analytics views
- **Interactive Charts**: Comprehensive data visualizations
- **Export Functionality**: Data export capabilities
- **Trend Analysis**: Historical progress tracking

## 🔧 API Endpoints

### Authentication

- `GET /api/auth/profile/:userId` - Get user profile

### Chat & Mentoring

- `POST /api/chat/mentor-suggest` - Get mentoring suggestions
- `POST /api/chat/practice-session` - Start practice session

### Courses

- `GET /api/courses` - Get all courses
- `GET /api/courses/recommend/:userId` - Get personalized recommendations
- `POST /api/courses/enroll` - Enroll in course

### Goals

- `GET /api/goals/:userId` - Get user goals
- `POST /api/goals/create` - Create new goal
- `PUT /api/goals/:goalId/progress` - Update goal progress

### Analytics

- `GET /api/feedback/summary/:userId` - Get feedback summary

## 🎯 Future Enhancements

### Planned Features

- **Real AI Integration**: Connect to actual LLM services
- **Database Integration**: Replace mock data with real database
- **Advanced Analytics**: Machine learning-powered insights
- **Mobile App**: Native mobile applications
- **API Integrations**: Connect with external learning platforms
- **Advanced Permissions**: Role-based access control
- **Notification System**: Multi-channel notifications
- **File Management**: Document sharing and collaboration

### Potential Integrations

- **Microsoft Graph API**: Full Office 365 integration
- **Learning Management Systems**: Connect with existing LMS platforms
- **HR Systems**: Employee data synchronization
- **Slack/Teams**: Enhanced chat integrations
- **Calendar Systems**: Multi-platform calendar sync

## 📊 Performance & Optimization

- **Lazy Loading**: Components loaded on demand
- **Code Splitting**: Optimized bundle sizes
- **Image Optimization**: Responsive image loading
- **Caching**: Intelligent data caching strategies
- **SEO Optimization**: Search engine friendly architecture

## 🔒 Security Considerations

- **Data Validation**: Input sanitization and validation
- **Error Handling**: Comprehensive error management
- **CORS Configuration**: Secure cross-origin requests
- **Environment Variables**: Secure configuration management

## Acknowledgments

- Design inspiration from modern SaaS platforms
- Component patterns from React community best practices
- UX principles from leading design systems
- AI interaction patterns from modern chat interfaces

---
