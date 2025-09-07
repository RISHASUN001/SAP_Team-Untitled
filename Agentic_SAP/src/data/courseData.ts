export const courses = [
  {
    id: "course1",
    title: "Advanced Python for Data Science",
    skills: [{ name: "Python", level: 3 }],
    description: "Master advanced Python programming techniques specifically for data science applications.",
    recommendedForRoles: ["Junior Data Scientist", "Data Analyst", "Data Science Team Lead"],
    difficulty: "Advanced",
    duration: "8 weeks",
    estimatedHours: 40
  },
  {
    id: "course2",
    title: "Advanced Machine Learning",
    skills: [{ name: "Machine Learning", level: 3 }],
    description: "Master advanced machine learning techniques including ensemble methods, feature engineering, and model optimization.",
    recommendedForRoles: ["Data Science Team Lead"],
    difficulty: "Advanced",
    duration: "8 weeks",
    estimatedHours: 40
  },
  {
    id: "course3",
    title: "Deep Learning with TensorFlow",
    skills: [{ name: "Deep Learning", level: 3 }, { name: "TensorFlow", level: 2 }],
    description: "Build and deploy deep learning models using TensorFlow framework.",
    recommendedForRoles: ["Junior Data Scientist", "Data Science Team Lead"],
    difficulty: "Advanced",
    duration: "10 weeks",
    estimatedHours: 50
  },
  {
    id: "course4",
    title: "SQL for Data Analysis",
    skills: [{ name: "SQL", level: 3 }],
    description: "Master advanced SQL queries for complex data analysis and reporting.",
    recommendedForRoles: ["Data Analyst", "Junior Data Scientist"],
    difficulty: "Intermediate",
    duration: "4 weeks",
    estimatedHours: 20
  },
  {
    id: "course5",
    title: "Data Visualization with Tableau",
    skills: [{ name: "Tableau", level: 3 }],
    description: "Create compelling data visualizations and interactive dashboards.",
    recommendedForRoles: ["Data Analyst", "Junior Data Scientist"],
    difficulty: "Beginner",
    duration: "3 weeks",
    estimatedHours: 15
  },
  {
    id: "course6",
    title: "Cloud Computing for Data Science",
    skills: [{ name: "Cloud Computing", level: 2 }, { name: "AWS", level: 2 }],
    description: "Deploy data science solutions on cloud platforms like AWS.",
    recommendedForRoles: ["Data Science Team Lead", "Junior Data Scientist"],
    difficulty: "Intermediate",
    duration: "6 weeks",
    estimatedHours: 35
  },
  {
    id: "course7",
    title: "MLOps and Model Deployment",
    skills: [{ name: "MLOps", level: 3 }, { name: "Docker", level: 2 }],
    description: "Learn to deploy and maintain machine learning models in production.",
    recommendedForRoles: ["Data Science Team Lead", "Junior Data Scientist"],
    difficulty: "Advanced",
    duration: "8 weeks",
    estimatedHours: 45
  },
  {
    id: "course8",
    title: "Statistical Analysis with R",
    skills: [{ name: "R", level: 3 }, { name: "Statistics", level: 3 }],
    description: "Perform advanced statistical analysis using R programming language.",
    recommendedForRoles: ["Data Analyst", "Junior Data Scientist"],
    difficulty: "Beginner",
    duration: "5 weeks",
    estimatedHours: 25
  },
  {
    id: "course9",
    title: "Introduction to Data Science",
    skills: [{ name: "Python", level: 1 }, { name: "Statistics", level: 1 }],
    description: "Get started with data science fundamentals and basic Python programming.",
    recommendedForRoles: ["Data Analyst"],
    difficulty: "Beginner",
    duration: "2 weeks",
    estimatedHours: 10
  },
  {
    id: "course10",
    title: "Advanced Data Engineering",
    skills: [{ name: "Python", level: 3 }, { name: "Apache Spark", level: 3 }, { name: "SQL", level: 3 }],
    description: "Build scalable data pipelines and engineering solutions for big data.",
    recommendedForRoles: ["Data Science Team Lead"],
    difficulty: "Advanced",
    duration: "12 weeks",
    estimatedHours: 60
  },
  {
    id: "course11",
    title: "Business Intelligence with Power BI",
    skills: [{ name: "Power BI", level: 3 }, { name: "DAX", level: 2 }],
    description: "Create comprehensive business intelligence solutions using Microsoft Power BI.",
    recommendedForRoles: ["Data Analyst"],
    difficulty: "Intermediate",
    duration: "4 weeks",
    estimatedHours: 20
  },
  {
    id: "course12",
    title: "Machine Learning Operations (MLOps) Fundamentals",
    skills: [{ name: "MLOps", level: 2 }, { name: "Git", level: 2 }, { name: "CI/CD", level: 2 }],
    description: "Learn the fundamentals of MLOps including version control, continuous integration, and model deployment.",
    recommendedForRoles: ["Junior Data Scientist", "Data Science Team Lead"],
    difficulty: "Intermediate",
    duration: "6 weeks",
    estimatedHours: 30
  }
];

export interface SkillRequirement {
  name: string;
  level: number;
}

export interface RequiredSkillsByRole {
  [role: string]: SkillRequirement[];
}

export const requiredSkillsByRole: RequiredSkillsByRole = {
  "Data Science Team Lead": [
    { name: "Python", level: 3 },
    { name: "Machine Learning", level: 3 },
    { name: "Deep Learning", level: 2 },
    { name: "MLOps", level: 3 },
    { name: "Cloud Computing", level: 2 },
    { name: "SQL", level: 2 }
  ],
  "Junior Data Scientist": [
    { name: "Python", level: 3 },
    { name: "Machine Learning", level: 2 },
    { name: "Deep Learning", level: 2 },
    { name: "SQL", level: 2 },
    { name: "Statistics", level: 2 },
    { name: "TensorFlow", level: 2 }
  ],
  "Data Analyst": [
    { name: "SQL", level: 3 },
    { name: "Python", level: 2 },
    { name: "Tableau", level: 3 },
    { name: "Statistics", level: 2 },
    { name: "R", level: 2 }
  ]
};
