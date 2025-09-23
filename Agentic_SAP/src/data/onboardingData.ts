// Onboarding journey types and data structures
export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  type: 'task' | 'training' | 'meeting' | 'system_access' | 'documentation' | 'orientation';
  estimatedDuration: string;
  isCompleted: boolean;
  dueDate?: string;
  resources?: OnboardingResource[];
  dependencies?: string[]; // IDs of steps that must be completed first
  priority: 'high' | 'medium' | 'low';
  category: string;
}

export interface OnboardingResource {
  type: 'link' | 'video' | 'document' | 'form' | 'system' | 'meeting';
  title: string;
  url: string;
  description: string;
  icon?: string;
}

export interface OnboardingJourney {
  userId: string;
  role: string;
  department: string;
  startDate: string;
  estimatedCompletionDate: string;
  currentProgress: number; // percentage
  steps: OnboardingStep[];
}

// Mock onboarding data for different roles
export const mockOnboardingJourneys: OnboardingJourney[] = [
  {
    userId: "tm001",
    role: "Junior Data Scientist",
    department: "IT - Data Science",
    startDate: "2025-09-23",
    estimatedCompletionDate: "2025-10-23",
    currentProgress: 25,
    steps: [
      {
        id: "step_001",
        title: "Welcome & Company Introduction",
        description: "Learn about SAP's mission, values, and organizational structure",
        type: "orientation",
        estimatedDuration: "2 hours",
        isCompleted: true,
        category: "Company Culture",
        priority: "high",
        resources: [
          {
            type: "video",
            title: "Welcome to SAP - CEO Message",
            url: "https://www.sap.com/about/company/ceo-message.html",
            description: "Personal welcome message from our CEO about SAP's vision",
            icon: "play"
          },
          {
            type: "document",
            title: "SAP Company Handbook",
            url: "https://internal.sap.com/employee-handbook",
            description: "Complete guide to SAP policies, benefits, and culture",
            icon: "book"
          },
          {
            type: "link",
            title: "SAP Innovation Timeline",
            url: "https://www.sap.com/about/company/innovation.html",
            description: "Explore SAP's 50+ year history of business innovation",
            icon: "timeline"
          }
        ]
      },
      {
        id: "step_002",
        title: "IT Setup & System Access",
        description: "Get your laptop, accounts, and development environment configured",
        type: "system_access",
        estimatedDuration: "4 hours",
        isCompleted: true,
        category: "Technical Setup",
        priority: "high",
        dependencies: ["step_001"],
        resources: [
          {
            type: "form",
            title: "IT Equipment Request",
            url: "https://helpdesk.sap.com/equipment-request",
            description: "Request laptop, monitor, and other hardware needed for your role",
            icon: "laptop"
          },
          {
            type: "system",
            title: "SAP Identity Management",
            url: "https://identity.sap.com",
            description: "Activate your SAP accounts and set up multi-factor authentication",
            icon: "shield"
          },
          {
            type: "link",
            title: "Development Tools Setup Guide",
            url: "https://developers.sap.com/tutorials/setup-environment.html",
            description: "Step-by-step guide to configure your data science development environment",
            icon: "code"
          }
        ]
      },
      {
        id: "step_003",
        title: "Meet Your Team",
        description: "Schedule introductory meetings with your immediate team and key stakeholders",
        type: "meeting",
        estimatedDuration: "1 week",
        isCompleted: false,
        category: "Team Integration",
        priority: "high",
        dependencies: ["step_002"],
        dueDate: "2025-09-27",
        resources: [
          {
            type: "link",
            title: "Team Directory",
            url: "https://people.sap.com/data-science-team",
            description: "Meet your colleagues and understand team structure",
            icon: "users"
          },
          {
            type: "form",
            title: "Schedule Team Meetings",
            url: "https://calendar.sap.com/schedule-intros",
            description: "Book 30-minute intro calls with each team member",
            icon: "calendar"
          }
        ]
      },
      {
        id: "step_004",
        title: "SAP Technology Stack Overview",
        description: "Learn about SAP's data architecture, HANA, and cloud platforms",
        type: "training",
        estimatedDuration: "3 days",
        isCompleted: false,
        category: "Technical Training",
        priority: "high",
        dependencies: ["step_003"],
        dueDate: "2025-10-02",
        resources: [
          {
            type: "video",
            title: "SAP HANA for Data Scientists",
            url: "https://learning.sap.com/hana-data-science",
            description: "Introduction to SAP's in-memory database platform",
            icon: "database"
          },
          {
            type: "link",
            title: "SAP Analytics Cloud Tutorial",
            url: "https://www.sap.com/products/technology-platform/cloud-analytics.html",
            description: "Learn SAP's business intelligence and analytics platform",
            icon: "chart"
          },
          {
            type: "document",
            title: "Data Science at SAP Best Practices",
            url: "https://internal.sap.com/data-science-guidelines",
            description: "Internal guide to data science methodologies used at SAP",
            icon: "book"
          }
        ]
      },
      {
        id: "step_005",
        title: "First Project Assignment",
        description: "Begin work on a starter project to apply your skills in the SAP environment",
        type: "task",
        estimatedDuration: "2 weeks",
        isCompleted: false,
        category: "Project Work",
        priority: "medium",
        dependencies: ["step_004"],
        dueDate: "2025-10-16",
        resources: [
          {
            type: "document",
            title: "Starter Project Brief",
            url: "https://projects.sap.com/starter-ds-001",
            description: "Customer churn analysis using SAP HANA data",
            icon: "file"
          },
          {
            type: "link",
            title: "SAP GitHub Repository",
            url: "https://github.com/SAP-samples/data-science-templates",
            description: "Access code templates and examples for your project",
            icon: "github"
          }
        ]
      },
      {
        id: "step_006",
        title: "Professional Development Planning",
        description: "Work with your manager to create a 90-day development plan",
        type: "meeting",
        estimatedDuration: "1 hour",
        isCompleted: false,
        category: "Career Development",
        priority: "medium",
        dependencies: ["step_003"],
        dueDate: "2025-10-10",
        resources: [
          {
            type: "form",
            title: "90-Day Goal Setting Template",
            url: "https://hr.sap.com/goal-setting-template",
            description: "Structured template for setting your first quarter objectives",
            icon: "target"
          },
          {
            type: "link",
            title: "SAP Learning Catalog",
            url: "https://learning.sap.com/catalog",
            description: "Browse available training courses and certifications",
            icon: "graduation-cap"
          }
        ]
      }
    ]
  },
  {
    userId: "tm002",
    role: "Data Analyst",
    department: "IT - Data Science",
    startDate: "2025-09-23",
    estimatedCompletionDate: "2025-10-21",
    currentProgress: 40,
    steps: [
      {
        id: "step_101",
        title: "Welcome & Company Introduction",
        description: "Learn about SAP's mission, values, and organizational structure",
        type: "orientation",
        estimatedDuration: "2 hours",
        isCompleted: true,
        category: "Company Culture",
        priority: "high",
        resources: [
          {
            type: "video",
            title: "Welcome to SAP - CEO Message",
            url: "https://www.sap.com/about/company/ceo-message.html",
            description: "Personal welcome message from our CEO about SAP's vision",
            icon: "play"
          },
          {
            type: "document",
            title: "SAP Company Handbook",
            url: "https://internal.sap.com/employee-handbook",
            description: "Complete guide to SAP policies, benefits, and culture",
            icon: "book"
          }
        ]
      },
      {
        id: "step_102",
        title: "IT Setup & Business Tools Access",
        description: "Configure your workstation and get access to business intelligence tools",
        type: "system_access",
        estimatedDuration: "3 hours",
        isCompleted: true,
        category: "Technical Setup",
        priority: "high",
        dependencies: ["step_101"],
        resources: [
          {
            type: "form",
            title: "IT Equipment Request",
            url: "https://helpdesk.sap.com/equipment-request",
            description: "Request laptop, monitor, and analytics software licenses",
            icon: "laptop"
          },
          {
            type: "system",
            title: "SAP Analytics Cloud Access",
            url: "https://analytics.sap.com",
            description: "Get access to SAP's primary business intelligence platform",
            icon: "chart"
          }
        ]
      },
      {
        id: "step_103",
        title: "Business Intelligence Foundations",
        description: "Learn SAP's approach to business intelligence and reporting",
        type: "training",
        estimatedDuration: "2 days",
        isCompleted: false,
        category: "Technical Training",
        priority: "high",
        dependencies: ["step_102"],
        dueDate: "2025-09-30",
        resources: [
          {
            type: "video",
            title: "Business Intelligence at SAP",
            url: "https://learning.sap.com/bi-foundations",
            description: "Overview of how SAP uses BI to drive business decisions",
            icon: "chart"
          },
          {
            type: "link",
            title: "SAP Analytics Cloud Certification Path",
            url: "https://training.sap.com/certification/analytics-cloud",
            description: "Certification path for SAP Analytics Cloud specialists",
            icon: "award"
          }
        ]
      },
      {
        id: "step_104",
        title: "First Analytics Project",
        description: "Complete a guided analytics project using real SAP data",
        type: "task",
        estimatedDuration: "1 week",
        isCompleted: false,
        category: "Project Work",
        priority: "medium",
        dependencies: ["step_103"],
        dueDate: "2025-10-08",
        resources: [
          {
            type: "document",
            title: "Sales Analytics Project Guide",
            url: "https://projects.sap.com/analytics-001",
            description: "Step-by-step guide to analyzing quarterly sales performance",
            icon: "file"
          }
        ]
      }
    ]
  },
  {
    userId: "mgr001",
    role: "Data Science Team Lead", 
    department: "IT - Data Science",
    startDate: "2025-09-23",
    estimatedCompletionDate: "2025-11-15",
    currentProgress: 30,
    steps: [
      {
        id: "step_201",
        title: "Welcome & Company Introduction",
        description: "Learn about SAP's mission, values, and organizational structure",
        type: "orientation",
        estimatedDuration: "2 hours",
        isCompleted: true,
        category: "Company Culture",
        priority: "high",
        resources: [
          {
            type: "video",
            title: "Welcome to SAP - CEO Message",
            url: "https://www.sap.com/about/company/ceo-message.html",
            description: "Personal welcome message from our CEO about SAP's vision",
            icon: "play"
          },
          {
            type: "document",
            title: "SAP Company Handbook",
            url: "https://internal.sap.com/employee-handbook",
            description: "Complete guide to SAP policies, benefits, and culture",
            icon: "book"
          },
          {
            type: "link",
            title: "SAP Innovation Timeline",
            url: "https://www.sap.com/about/company/innovation.html",
            description: "Explore SAP's 50+ year history of business innovation",
            icon: "timeline"
          }
        ]
      },
      {
        id: "step_202",
        title: "IT Setup & System Access",
        description: "Get your laptop, accounts, and development environment configured",
        type: "system_access",
        estimatedDuration: "4 hours",
        isCompleted: true,
        category: "Technical Setup",
        priority: "high",
        dependencies: ["step_201"],
        resources: [
          {
            type: "form",
            title: "Manager IT Equipment Request",
            url: "https://helpdesk.sap.com/manager-equipment-request",
            description: "Request laptop, monitors, and management tools access",
            icon: "laptop"
          },
          {
            type: "system",
            title: "SAP Identity Management",
            url: "https://identity.sap.com",
            description: "Activate your SAP accounts and set up multi-factor authentication",
            icon: "shield"
          },
          {
            type: "system",
            title: "Manager Dashboard Access",
            url: "https://managers.sap.com/dashboard",
            description: "Access to team management tools and HR systems",
            icon: "chart"
          },
          {
            type: "link",
            title: "Leadership Tools Setup Guide",
            url: "https://internal.sap.com/leadership-tools-setup",
            description: "Configure team management and reporting tools",
            icon: "code"
          }
        ]
      },
      {
        id: "step_203",
        title: "Meet Your Team & Stakeholders",
        description: "Schedule introductory meetings with your team members and key stakeholders",
        type: "meeting",
        estimatedDuration: "1 week",
        isCompleted: false,
        category: "Team Integration",
        priority: "high",
        dependencies: ["step_202"],
        dueDate: "2025-09-30",
        resources: [
          {
            type: "link",
            title: "Your Team Directory",
            url: "https://people.sap.com/data-science-team",
            description: "Meet your direct reports and understand team structure",
            icon: "users"
          },
          {
            type: "form",
            title: "Schedule Team One-on-Ones",
            url: "https://calendar.sap.com/schedule-team-meetings",
            description: "Book individual meetings with each team member",
            icon: "calendar"
          },
          {
            type: "document",
            title: "Stakeholder Map",
            url: "https://internal.sap.com/stakeholder-map-ds",
            description: "Key contacts and relationships for your role",
            icon: "users"
          }
        ]
      },
      {
        id: "step_204",
        title: "Leadership Onboarding & Executive Briefing",
        description: "Executive briefing on SAP's data strategy and organizational priorities",
        type: "orientation",
        estimatedDuration: "4 hours",
        isCompleted: false,
        category: "Leadership Development",
        priority: "high",
        dependencies: ["step_203"],
        dueDate: "2025-10-05",
        resources: [
          {
            type: "meeting",
            title: "Executive Briefing Session",
            url: "https://calendar.sap.com/exec-briefing",
            description: "Meet with senior leadership to understand strategic priorities",
            icon: "users"
          },
          {
            type: "document",
            title: "SAP Data Strategy 2025",
            url: "https://internal.sap.com/data-strategy",
            description: "Confidential strategic roadmap for SAP's data initiatives",
            icon: "file"
          },
          {
            type: "video",
            title: "Leadership at SAP",
            url: "https://learning.sap.com/leadership-principles",
            description: "SAP's leadership principles and management philosophy",
            icon: "play"
          }
        ]
      },
      {
        id: "step_205",
        title: "SAP Technology Stack Overview",
        description: "Deep dive into SAP's data architecture, HANA, and cloud platforms from a leadership perspective",
        type: "training",
        estimatedDuration: "2 days",
        isCompleted: false,
        category: "Technical Training",
        priority: "high",
        dependencies: ["step_204"],
        dueDate: "2025-10-10",
        resources: [
          {
            type: "video",
            title: "SAP HANA Architecture Overview",
            url: "https://learning.sap.com/hana-architecture",
            description: "Technical overview for managers and architects",
            icon: "database"
          },
          {
            type: "link",
            title: "SAP Cloud Platform Strategy",
            url: "https://www.sap.com/products/technology-platform/cloud.html",
            description: "Understanding SAP's cloud strategy and roadmap",
            icon: "chart"
          },
          {
            type: "document",
            title: "Technology Decision Framework",
            url: "https://internal.sap.com/tech-decision-framework",
            description: "Guidelines for making technology choices for your team",
            icon: "book"
          }
        ]
      },
      {
        id: "step_206",
        title: "Team Assessment & Skills Analysis",
        description: "Review your team's current capabilities and plan development initiatives",
        type: "task",
        estimatedDuration: "1 week",
        isCompleted: false,
        category: "Team Management",
        priority: "high",
        dependencies: ["step_203"],
        dueDate: "2025-10-12",
        resources: [
          {
            type: "document",
            title: "Team Skills Assessment Template",
            url: "https://hr.sap.com/skills-assessment",
            description: "Framework for evaluating team member capabilities and growth areas",
            icon: "clipboard"
          },
          {
            type: "link",
            title: "SAP People Analytics Dashboard",
            url: "https://people.sap.com/analytics",
            description: "Access team performance metrics and development tracking tools",
            icon: "chart"
          },
          {
            type: "form",
            title: "Individual Development Planning",
            url: "https://hr.sap.com/individual-development-plans",
            description: "Create development plans for each team member",
            icon: "target"
          }
        ]
      },
      {
        id: "step_207",
        title: "Budget & Resource Planning",
        description: "Review team budget and plan resource allocation for upcoming projects",
        type: "task",
        estimatedDuration: "3 days",
        isCompleted: false,
        category: "Financial Planning",
        priority: "medium",
        dependencies: ["step_206"],
        dueDate: "2025-10-18",
        resources: [
          {
            type: "system",
            title: "SAP Financial Planning System",
            url: "https://finance.sap.com/planning",
            description: "Access budget allocation and expense tracking tools",
            icon: "dollar-sign"
          },
          {
            type: "document",
            title: "Budget Planning Guidelines",
            url: "https://internal.sap.com/budget-guidelines",
            description: "Best practices for team budget management",
            icon: "book"
          },
          {
            type: "meeting",
            title: "Finance Partner Meeting",
            url: "https://calendar.sap.com/finance-partner",
            description: "Meet with your assigned finance business partner",
            icon: "users"
          }
        ]
      },
      {
        id: "step_208",
        title: "Project Portfolio Review",
        description: "Understand current projects, priorities, and upcoming initiatives",
        type: "task",
        estimatedDuration: "1 week",
        isCompleted: false,
        category: "Project Management",
        priority: "high",
        dependencies: ["step_205"],
        dueDate: "2025-10-25",
        resources: [
          {
            type: "document",
            title: "Current Project Portfolio",
            url: "https://projects.sap.com/data-science-portfolio",
            description: "Overview of all active and planned data science projects",
            icon: "file"
          },
          {
            type: "system",
            title: "SAP Project Management Office",
            url: "https://pmo.sap.com",
            description: "Access project tracking and resource allocation tools",
            icon: "target"
          },
          {
            type: "meeting",
            title: "Project Stakeholder Meetings",
            url: "https://calendar.sap.com/project-stakeholders",
            description: "Meet with project sponsors and key stakeholders",
            icon: "users"
          }
        ]
      },
      {
        id: "step_209",
        title: "Leadership Development Program",
        description: "Enroll in SAP's leadership development program for new managers",
        type: "training",
        estimatedDuration: "4 weeks",
        isCompleted: false,
        category: "Leadership Development",
        priority: "medium",
        dependencies: ["step_204"],
        dueDate: "2025-11-08",
        resources: [
          {
            type: "link",
            title: "SAP Leadership Academy",
            url: "https://learning.sap.com/leadership-academy",
            description: "Comprehensive leadership development program",
            icon: "graduation-cap"
          },
          {
            type: "video",
            title: "Managing Technical Teams",
            url: "https://learning.sap.com/technical-team-management",
            description: "Best practices for leading engineering and data science teams",
            icon: "play"
          },
          {
            type: "document",
            title: "Performance Management Guide",
            url: "https://hr.sap.com/performance-management",
            description: "Guidelines for conducting reviews and managing performance",
            icon: "book"
          }
        ]
      },
      {
        id: "step_210",
        title: "First 90-Day Goals Setting",
        description: "Work with your manager to create detailed 90-day objectives and success metrics",
        type: "meeting",
        estimatedDuration: "2 hours",
        isCompleted: false,
        category: "Goal Setting",
        priority: "high",
        dependencies: ["step_208"],
        dueDate: "2025-11-01",
        resources: [
          {
            type: "form",
            title: "90-Day Leadership Goals Template",
            url: "https://hr.sap.com/leadership-goal-setting",
            description: "Structured template for setting leadership objectives",
            icon: "target"
          },
          {
            type: "document",
            title: "Success Metrics Framework",
            url: "https://internal.sap.com/success-metrics",
            description: "How to define and measure leadership success at SAP",
            icon: "chart"
          },
          {
            type: "meeting",
            title: "Manager Alignment Session",
            url: "https://calendar.sap.com/manager-alignment",
            description: "Align on expectations and success criteria with your manager",
            icon: "users"
          }
        ]
      }
    ]
  }
];

// Helper functions for onboarding journey management
export const getOnboardingJourneyByUserId = (userId: string): OnboardingJourney | undefined => {
  // Try to get from localStorage first for persistence
  const savedJourneys = localStorage.getItem('onboardingJourneys');
  if (savedJourneys) {
    try {
      const journeys: OnboardingJourney[] = JSON.parse(savedJourneys);
      const savedJourney = journeys.find(journey => journey.userId === userId);
      if (savedJourney) {
        return savedJourney;
      }
    } catch (error) {
      console.error('Error parsing saved onboarding journeys:', error);
    }
  }
  
  // Fallback to mock data
  return mockOnboardingJourneys.find(journey => journey.userId === userId);
};

export const saveOnboardingJourney = (journey: OnboardingJourney): void => {
  try {
    const savedJourneys = localStorage.getItem('onboardingJourneys');
    let journeys: OnboardingJourney[] = [];
    
    if (savedJourneys) {
      journeys = JSON.parse(savedJourneys);
    }
    
    // Update or add the journey
    const existingIndex = journeys.findIndex(j => j.userId === journey.userId);
    if (existingIndex >= 0) {
      journeys[existingIndex] = journey;
    } else {
      journeys.push(journey);
    }
    
    localStorage.setItem('onboardingJourneys', JSON.stringify(journeys));
  } catch (error) {
    console.error('Error saving onboarding journey:', error);
  }
};

export const updateStepCompletion = (userId: string, stepId: string, isCompleted: boolean): OnboardingJourney | null => {
  const journey = getOnboardingJourneyByUserId(userId);
  if (journey) {
    const step = journey.steps.find(s => s.id === stepId);
    if (step) {
      step.isCompleted = isCompleted;
      
      // Recalculate progress
      const completedSteps = journey.steps.filter(s => s.isCompleted).length;
      journey.currentProgress = Math.round((completedSteps / journey.steps.length) * 100);
      
      // Save to localStorage
      saveOnboardingJourney(journey);
      
      return journey;
    }
  }
  return null;
};

export const getNextIncompleteStep = (journey: OnboardingJourney): OnboardingStep | undefined => {
  return journey.steps.find(step => !step.isCompleted);
};

export const getCompletedStepsCount = (journey: OnboardingJourney): number => {
  return journey.steps.filter(step => step.isCompleted).length;
};

export const getStepsByCategory = (journey: OnboardingJourney): Record<string, OnboardingStep[]> => {
  return journey.steps.reduce((acc, step) => {
    if (!acc[step.category]) {
      acc[step.category] = [];
    }
    acc[step.category].push(step);
    return acc;
  }, {} as Record<string, OnboardingStep[]>);
};