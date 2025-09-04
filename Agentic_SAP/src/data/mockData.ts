export const mockUsers = [
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

export const mockCourses = [
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

export const mockGoals = [
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

export const mockFeedback = [
  {
    id: "fb001",
    userId: "tm001",
    source: "Sarah Chen",
    type: "manager_review",
    date: "2025-01-15",
    content: "Alex shows strong analytical thinking and is eager to learn new technologies. Needs to work on communication skills when presenting findings.",
    themes: ["analytical_thinking", "communication", "learning_attitude"],
    rating: 4.2
  },
  {
    id: "fb002",
    userId: "tm001",
    source: "Peer Review",
    type: "peer_feedback",
    date: "2025-01-10",
    content: "Great team player, always willing to help others debug code. Could improve on documentation practices.",
    themes: ["teamwork", "technical_skills", "documentation"],
    rating: 4.0
  }
];