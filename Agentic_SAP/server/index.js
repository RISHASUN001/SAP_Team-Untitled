import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';  
dotenv.config(); //loads the env variable

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Mock data storage
let users = [
  {
    id: "mgr001",
    name: "Sarah Chen",
    role: "Data Science Team Lead",
    department: "IT - Data Science",
    skills: ["Python", "Machine Learning", "Team Management", "Strategic Planning", "Data Visualization"],
    experience: "8 years",
    currentGoals: ["Team skill development", "Project delivery optimization"],
    preferredMentoringStyle: "Collaborative",
    availability: "Monday-Friday 9-17 PST"
  },
  {
    id: "tm001", 
    name: "Alex Rodriguez",
    role: "Junior Data Scientist",
    department: "IT - Data Science",
    skills: ["Python", "SQL", "Basic ML"],
    skillGaps: ["Deep Learning", "MLOps", "Cloud Computing"],
    experience: "1.5 years",
    currentGoals: ["Learn TensorFlow", "Complete ML certification"],
    mentoringNeeds: ["Technical guidance", "Career planning"]
  },
  {
    id: "tm002",
    name: "Jordan Kim", 
    role: "Data Analyst",
    department: "IT - Data Science",
    skills: ["SQL", "Tableau", "Excel", "Statistics"],
    skillGaps: ["Python", "Advanced Analytics", "Automation"],
    experience: "2 years",
    currentGoals: ["Transition to Data Science role", "Python proficiency"],
    mentoringNeeds: ["Skill development", "Role transition guidance"]
  }
];

let courses = [
  {
    id: "ds001",
    name: "Machine Learning Fundamentals",
    provider: "TechEd Online",
    link: "https://teched.com/ml-fundamentals",
    description: "Comprehensive introduction to ML concepts and algorithms",
    duration: "8 weeks",
    difficulty: "Intermediate",
    prerequisites: ["Python", "Statistics"],
    skills_gained: ["Supervised Learning", "Unsupervised Learning", "Model Evaluation"],
    timeline_breakdown: {
      week1: "Introduction to ML and Python review",
      week2: "Linear Regression and Classification",
      week3: "Decision Trees and Random Forest",
      week4: "Clustering and Dimensionality Reduction",
      week5: "Neural Networks Basics",
      week6: "Model Evaluation and Validation",
      week7: "Feature Engineering",
      week8: "Final Project and Deployment"
    },
    estimated_hours: 40,
    target_roles: ["Data Scientist", "ML Engineer"],
    rating: 4.8,
    enrolled: 2340
  },
  {
    id: "py001",
    name: "Python for Data Science",
    provider: "DataLearn Academy",
    link: "https://datalearn.com/python-ds",
    description: "Master Python programming specifically for data science applications",
    duration: "6 weeks",
    difficulty: "Beginner",
    prerequisites: [],
    skills_gained: ["Python Programming", "Data Manipulation", "Visualization"],
    timeline_breakdown: {
      week1: "Python basics and data types",
      week2: "Working with Pandas DataFrames",
      week3: "Data visualization with Matplotlib",
      week4: "NumPy for numerical computing",
      week5: "Data cleaning and preprocessing",
      week6: "Final project and portfolio"
    },
    estimated_hours: 30,
    target_roles: ["Data Analyst", "Data Scientist"],
    rating: 4.6,
    enrolled: 1890
  },
  {
    id: "dl001",
    name: "Deep Learning Specialization",
    provider: "AI Institute",
    link: "https://aiinstitute.com/deep-learning",
    description: "Advanced deep learning techniques and neural networks",
    duration: "12 weeks",
    difficulty: "Advanced",
    prerequisites: ["Python", "Machine Learning", "Linear Algebra"],
    skills_gained: ["Neural Networks", "CNN", "RNN", "Transformers"],
    timeline_breakdown: {
      week1: "Neural Network Fundamentals",
      week2: "Backpropagation and Optimization",
      week3: "Convolutional Neural Networks",
      week4: "Computer Vision Applications",
      week5: "Recurrent Neural Networks",
      week6: "LSTM and GRU Networks",
      week7: "Attention Mechanisms",
      week8: "Transformers and BERT",
      week9: "Generative Models",
      week10: "GANs and VAEs",
      week11: "Deployment and MLOps",
      week12: "Capstone Project"
    },
    estimated_hours: 80,
    target_roles: ["ML Engineer", "AI Researcher"],
    rating: 4.9,
    enrolled: 567
  }
];

let goals = [
  {
    id: "goal001",
    userId: "tm001",
    title: "Complete TensorFlow Certification",
    description: "Earn Google TensorFlow Developer Certificate",
    deadline: "2025-06-30",
    status: "in_progress",
    progress: 35,
    category: "certification",
    milestones: [
      { id: "m1", title: "Complete Course 1", completed: true, date: "2025-01-15" },
      { id: "m2", title: "Complete Course 2", completed: true, date: "2025-02-01" },
      { id: "m3", title: "Complete Course 3", completed: false, dueDate: "2025-03-15" },
      { id: "m4", title: "Complete Course 4", completed: false, dueDate: "2025-04-30" },
      { id: "m5", title: "Pass Certification Exam", completed: false, dueDate: "2025-06-15" }
    ]
  },
  {
    id: "goal002",
    userId: "tm002",
    title: "Learn Python Programming",
    description: "Achieve proficiency in Python for data science applications",
    deadline: "2025-04-30",
    status: "in_progress",
    progress: 60,
    category: "skill_development",
    milestones: [
      { id: "m1", title: "Python Basics", completed: true, date: "2025-01-10" },
      { id: "m2", title: "Data Structures", completed: true, date: "2025-01-25" },
      { id: "m3", title: "Pandas & NumPy", completed: false, dueDate: "2025-02-20" },
      { id: "m4", title: "Build First Project", completed: false, dueDate: "2025-03-30" }
    ]
  }
];

let chatSessions = [];

// API Routes

// Authentication
app.get('/api/auth/profile/:userId', (req, res) => {
  const { userId } = req.params;
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json(user);
});

// =========================
// Mentor Mode Chat Endpoints
// =========================
app.post('/api/chat/mentor-suggest', async (req, res) => {
  const { message, user_id } = req.body; // UPDATED: Now forwards user_id to Python backend
  // Forward the message to Python Flask server
  try {
    const response = await fetch('http://localhost:5001/api/mentor-suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, user_id }) // UPDATED: Include user_id for conversation tracking
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error connecting to Python server:', error);
    res.status(500).json({ error: 'Failed to get mentor suggestion from AI server.' });
  }
});

// NEW ENDPOINT: Reset conversation history in Python backend
// This endpoint forwards reset requests to the Python Flask server
// Called when user clicks the reset/refresh button in frontend
app.post('/api/chat/mentor-reset', async (req, res) => {
  const { user_id } = req.body;
  // Forward reset request to Python Flask server to clear conversation_store
  try {
    const response = await fetch('http://localhost:5001/api/mentor-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id })
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error connecting to Python server for reset:', error);
    res.status(500).json({ error: 'Failed to reset conversation on AI server.' });
  }
});

// =========================
// Practice Mode Chat Endpoints - UPDATED to connect to practice_mode.py
// =========================
// NEW ENDPOINT: Start practice session with scenario selection
app.post('/api/chat/practice-start', async (req, res) => {
  const { user_id } = req.body;
  // Forward request to Practice Mode Python server (port 5002)
  try {
    const response = await fetch('http://localhost:5002/api/practice-start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id })
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error connecting to Practice Mode server:', error);
    res.status(500).json({ error: 'Failed to start practice session.' });
  }
});

// NEW ENDPOINT: Handle practice mode conversation
app.post('/api/chat/practice-respond', async (req, res) => {
  const { message, user_id } = req.body;
  // Forward request to Practice Mode Python server (port 5002)
  try {
    const response = await fetch('http://localhost:5002/api/practice-respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, user_id })
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error connecting to Practice Mode server:', error);
    res.status(500).json({ error: 'Failed to get practice response.' });
  }
});

// NEW ENDPOINT: Reset practice session history
app.post('/api/chat/practice-reset', async (req, res) => {
  const { user_id } = req.body;
  // Forward reset request to Practice Mode Python server (port 5002)
  try {
    const response = await fetch('http://localhost:5002/api/practice-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id })
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error connecting to Practice Mode server for reset:', error);
    res.status(500).json({ error: 'Failed to reset practice session.' });
  }
});

// =========================
// General Chat/Onboarding Mode Endpoints - NEW
// =========================
// NEW ENDPOINT: Handle general chat with onboarding information
app.post('/api/chat/general-chat', async (req, res) => {
  const { message, user_id } = req.body;
  // Forward request to Onboarding Mode Python server (port 5003)
  try {
    const response = await fetch('http://localhost:5003/api/onboarding-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, user_id })
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error connecting to Onboarding Mode server:', error);
    res.status(500).json({ error: 'Failed to get general chat response.' });
  }
});

// NEW ENDPOINT: Reset general chat conversation history
app.post('/api/chat/general-reset', async (req, res) => {
  const { user_id } = req.body;
  // Forward reset request to Onboarding Mode Python server (port 5003)
  try {
    const response = await fetch('http://localhost:5003/api/onboarding-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id })
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error connecting to Onboarding Mode server for reset:', error);
    res.status(500).json({ error: 'Failed to reset general chat conversation.' });
  }
});

// NEW ENDPOINT: Search onboarding documents directly
app.post('/api/chat/search-docs', async (req, res) => {
  const { query, top_k = 3 } = req.body;
  // Forward search request to Onboarding Mode Python server (port 5003)
  try {
    const response = await fetch('http://localhost:5003/api/search-docs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, top_k })
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error connecting to Onboarding Mode server for search:', error);
    res.status(500).json({ error: 'Failed to search documents.' });
  }
});

// LEGACY ENDPOINT: Keep for backward compatibility but deprecated
app.post('/api/chat/practice-session', async (req, res) => {
  const { scenario, difficulty, userId } = req.body;
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const menteeQuestions = [
    "I'm struggling with imposter syndrome. Everyone seems so much more advanced than me.",
    "How do I know if I'm ready to take on more complex projects?",
    "I keep making the same mistakes in my code. How can I improve?",
    "What's the best way to ask for help without seeming incompetent?",
    "How do I balance learning new skills with my current workload?"
  ];
  
  const response = {
    menteeQuestion: menteeQuestions[Math.floor(Math.random() * menteeQuestions.length)],
    context: "This is a practice scenario. Respond as you would to a real mentee.",
    tips: [
      "Use empathetic language",
      "Ask follow-up questions",
      "Share relevant experiences",
      "Provide actionable advice"
    ]
  };
  
  res.json(response);
});






// Course Recommendations
app.get('/api/courses/recommend/:userId', (req, res) => {
  const { userId } = req.params;
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Simple recommendation logic based on skill gaps
  const recommendedCourses = courses.filter(course => {
    if (!user.skillGaps) return false;
    return course.skills_gained.some(skill => 
      user.skillGaps.some(gap => 
        skill.toLowerCase().includes(gap.toLowerCase()) || 
        gap.toLowerCase().includes(skill.toLowerCase())
      )
    );
  });
  
  const recommendations = recommendedCourses.map(course => ({
    ...course,
    matchScore: Math.floor(Math.random() * 20) + 80, // 80-100
    reasoning: `Matches your skill gap in ${user.skillGaps.join(', ')}`,
    timeline: `${course.duration} - ${course.estimated_hours} hours total`,
    prerequisites_met: course.prerequisites.every(prereq => 
      user.skills.some(skill => skill.toLowerCase().includes(prereq.toLowerCase()))
    )
  }));
  
  res.json(recommendations.slice(0, 5));
});

app.get('/api/courses', (req, res) => {
  res.json(courses);
});

app.post('/api/courses/enroll', (req, res) => {
  const { userId, courseId } = req.body;
  
  // In a real app, this would update the database
  res.json({ 
    success: true, 
    message: 'Successfully enrolled in course',
    enrollmentId: uuidv4()
  });
});

// Goals
app.get('/api/goals/:userId', (req, res) => {
  const { userId } = req.params;
  const userGoals = goals.filter(goal => goal.userId === userId);
  res.json(userGoals);
});

app.post('/api/goals/create', (req, res) => {
  const { userId, title, description, deadline, category } = req.body;
  
  const newGoal = {
    id: uuidv4(),
    userId,
    title,
    description,
    deadline,
    status: 'not_started',
    progress: 0,
    category,
    milestones: []
  };
  
  goals.push(newGoal);
  res.json(newGoal);
});

app.put('/api/goals/:goalId/progress', (req, res) => {
  const { goalId } = req.params;
  const { progress } = req.body;
  
  const goalIndex = goals.findIndex(g => g.id === goalId);
  if (goalIndex === -1) {
    return res.status(404).json({ error: 'Goal not found' });
  }
  
  goals[goalIndex].progress = progress;
  goals[goalIndex].status = progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : 'not_started';
  
  res.json(goals[goalIndex]);
});

// Feedback and Analytics
app.post('/api/feedback/submit', (req, res) => {
  const { userId, feedback, rating, source } = req.body;
  
  const newFeedback = {
    id: uuidv4(),
    userId,
    feedback,
    rating,
    source,
    timestamp: new Date().toISOString()
  };
  
  res.json(newFeedback);
});

app.get('/api/feedback/summary/:userId', (req, res) => {
  const { userId } = req.params;
  
  // Mock feedback summary
  const summary = {
    averageRating: 4.3,
    totalFeedback: 15,
    strengths: ["Technical problem solving", "Learning agility", "Code quality"],
    improvements: ["Presentation skills", "Documentation", "Team collaboration"],
    trends: {
      technical: [4.2, 4.4, 4.6, 4.7],
      communication: [3.8, 4.0, 4.2, 4.4],
      leadership: [3.5, 3.7, 4.0, 4.2]
    }
  };
  
  res.json(summary);
});

app.get('/api/analytics/team/:managerId', (req, res) => {
  const { managerId } = req.params;
  
  // Mock team analytics
  const analytics = {
    teamSize: 8,
    averageProgress: 75,
    completedGoals: 23,
    activeMentoringPairs: 5,
    skillGrowth: 15,
    retentionRate: 94
  };
  
  res.json(analytics);
});

// Teams Integration (Mock)
app.post('/api/teams/schedule-meeting', (req, res) => {
  const { participants, date, duration, topic } = req.body;
  
  const meeting = {
    id: uuidv4(),
    participants,
    date,
    duration,
    topic,
    teamsLink: `https://teams.microsoft.com/l/meetup-join/${uuidv4()}`,
    status: 'scheduled'
  };
  
  res.json(meeting);
});

app.get('/api/teams/availability', (req, res) => {
  const { userId, date } = req.query;
  
  // Mock availability data
  const availability = {
    date,
    slots: [
      { time: '09:00', available: true },
      { time: '10:00', available: false },
      { time: '11:00', available: true },
      { time: '14:00', available: true },
      { time: '15:00', available: false },
      { time: '16:00', available: true }
    ]
  };
  
  res.json(availability);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 AI Mentoring Platform API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

export default app;