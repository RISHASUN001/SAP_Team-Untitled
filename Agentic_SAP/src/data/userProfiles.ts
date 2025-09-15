export interface UserSkill {
  name: string;
  rating: number;
}

export interface UserProfile {
  userId: string;
  name: string;
  role: string;
  department?: string;
  experience?: string;
  currentGoals?: string[];
  mentoringNeeds?: string[];
  skills: UserSkill[];
  completedCourses: string[];
}

export const userProfiles: UserProfile[] = [
  {
    userId: "mgr001",
    name: "Sarah Chen",
    role: "Data Science Team Lead",
    department: "IT - Data Science",
    experience: "5 years",
    currentGoals: ["Team leadership excellence", "Advanced ML/AI implementation", "Strategic planning"],
    mentoringNeeds: ["Leadership skills", "Advanced technical guidance"],
    skills: [
      { name: "Python", rating: 3 },
      { name: "Machine Learning", rating: 2 },
      { name: "SQL", rating: 2 }
      // Missing: Deep Learning (level 2), MLOps (level 3), Cloud Computing (level 2)
    ],
    completedCourses: ["course1"]
  },
  {
    userId: "tm001",
    name: "Alex Rodriguez", 
    role: "Junior Data Scientist",
    department: "IT - Data Science",
    experience: "1.5 years",
    currentGoals: ["Learn TensorFlow", "Complete ML certification", "Statistical Analysis with R"],
    mentoringNeeds: ["Technical guidance", "Career planning", "Skill development"],
    skills: [
      { name: "Python", rating: 1 },
      { name: "SQL", rating: 1 }
      // Missing: Machine Learning (level 2), Deep Learning (level 2), Statistics (level 2), TensorFlow (level 2)
    ],
    completedCourses: []
  },
  {
    userId: "tm002",
    name: "Jordan Kim",
    role: "Data Analyst",
    department: "IT - Data Science",
    experience: "2 years",
    currentGoals: ["Transition to Data Science role", "Python proficiency", "Advanced Analytics"],
    mentoringNeeds: ["Skill development", "Role transition guidance"],
    skills: [
      { name: "SQL", rating: 3 }
      // Missing: Python (level 2), Tableau (level 3), Statistics (level 2), R (level 2)
    ],
    completedCourses: []
  }
];
