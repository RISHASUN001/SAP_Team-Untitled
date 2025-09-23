import { OnboardingJourney, OnboardingStep } from './onboardingData';

// Simulated LLM service for generating personalized onboarding journeys
// In a real implementation, this would call an actual LLM API

interface UserProfile {
  id: string;
  name: string;
  role: string;
  department: string;
  skills: string[];
  experience: string;
  skillGaps?: string[];
  mentoringNeeds?: string[];
}

interface OnboardingGenerationOptions {
  focusAreas?: string[];
  urgentSkills?: string[];
  preferredLearningStyle?: 'visual' | 'hands-on' | 'reading' | 'collaborative';
  timeConstraints?: 'standard' | 'accelerated' | 'extended';
}

// Template steps that can be customized based on user profile
const baseStepTemplates = {
  // Company Orientation Steps
  company_intro: {
    title: "Welcome & Company Introduction",
    description: "Learn about SAP's mission, values, and organizational structure",
    type: "orientation" as const,
    category: "Company Culture",
    priority: "high" as const,
    estimatedDuration: "2 hours",
    resources: [
      {
        type: "video" as const,
        title: "Welcome to SAP - CEO Message",
        url: "https://www.sap.com/about/company/ceo-message.html",
        description: "Personal welcome message from our CEO about SAP's vision",
        icon: "play"
      },
      {
        type: "document" as const,
        title: "SAP Company Handbook",
        url: "https://internal.sap.com/employee-handbook",
        description: "Complete guide to SAP policies, benefits, and culture",
        icon: "book"
      }
    ]
  },

  // IT Setup Steps
  basic_it_setup: {
    title: "IT Setup & System Access",
    description: "Get your laptop, accounts, and basic system access configured",
    type: "system_access" as const,
    category: "Technical Setup",
    priority: "high" as const,
    estimatedDuration: "3 hours",
    resources: [
      {
        type: "form" as const,
        title: "IT Equipment Request",
        url: "https://helpdesk.sap.com/equipment-request",
        description: "Request laptop, monitor, and other hardware",
        icon: "laptop"
      },
      {
        type: "system" as const,
        title: "SAP Identity Management",
        url: "https://identity.sap.com",
        description: "Activate your SAP accounts and set up multi-factor authentication",
        icon: "shield"
      }
    ]
  },

  // Role-specific training templates
  data_science_training: {
    title: "SAP Data Science Platform Training",
    description: "Learn SAP's data science tools and methodologies",
    type: "training" as const,
    category: "Technical Training",
    priority: "high" as const,
    estimatedDuration: "1 week",
    resources: [
      {
        type: "video" as const,
        title: "SAP HANA for Data Scientists",
        url: "https://learning.sap.com/hana-data-science",
        description: "Introduction to SAP's in-memory database platform",
        icon: "database"
      },
      {
        type: "link" as const,
        title: "SAP Analytics Cloud Tutorial",
        url: "https://www.sap.com/products/technology-platform/cloud-analytics.html",
        description: "Learn SAP's business intelligence platform",
        icon: "chart"
      }
    ]
  },

  analytics_training: {
    title: "Business Intelligence Foundations",
    description: "Learn SAP's approach to business intelligence and reporting",
    type: "training" as const,
    category: "Technical Training",
    priority: "high" as const,
    estimatedDuration: "3 days",
    resources: [
      {
        type: "video" as const,
        title: "Business Intelligence at SAP",
        url: "https://learning.sap.com/bi-foundations",
        description: "Overview of how SAP uses BI to drive business decisions",
        icon: "chart"
      }
    ]
  },

  // Team integration
  team_integration: {
    title: "Meet Your Team",
    description: "Schedule introductory meetings with your team and stakeholders",
    type: "meeting" as const,
    category: "Team Integration",
    priority: "high" as const,
    estimatedDuration: "1 week",
    resources: [
      {
        type: "link" as const,
        title: "Team Directory",
        url: "https://people.sap.com/team-directory",
        description: "Meet your colleagues and understand team structure",
        icon: "users"
      }
    ]
  },

  // Project assignments
  starter_project: {
    title: "First Project Assignment",
    description: "Begin work on a starter project to apply your skills",
    type: "task" as const,
    category: "Project Work",
    priority: "medium" as const,
    estimatedDuration: "2 weeks",
    resources: [
      {
        type: "document" as const,
        title: "Starter Project Brief",
        url: "https://projects.sap.com/starter-project",
        description: "Your first project assignment with detailed requirements",
        icon: "file"
      }
    ]
  }
};

// Simulated LLM prompt templates for different scenarios
const generateLLMPrompt = (userProfile: UserProfile, options: OnboardingGenerationOptions = {}): string => {
  return `
Generate a personalized onboarding journey for a new SAP employee with the following profile:

Name: ${userProfile.name}
Role: ${userProfile.role}
Department: ${userProfile.department}
Experience Level: ${userProfile.experience}
Current Skills: ${userProfile.skills.join(', ')}
Skill Gaps: ${userProfile.skillGaps?.join(', ') || 'None specified'}
Mentoring Needs: ${userProfile.mentoringNeeds?.join(', ') || 'None specified'}

Preferences:
- Focus Areas: ${options.focusAreas?.join(', ') || 'Standard onboarding'}
- Urgent Skills: ${options.urgentSkills?.join(', ') || 'Role-appropriate skills'}
- Learning Style: ${options.preferredLearningStyle || 'mixed'}
- Timeline: ${options.timeConstraints || 'standard'}

Please create a customized onboarding journey that:
1. Addresses their specific skill gaps
2. Leverages their existing experience
3. Includes role-appropriate technical training
4. Provides mentoring support based on their needs
5. Sets them up for success in their first 30-60 days

Return a structured journey with steps ordered chronologically.
  `;
};

// Simulated LLM response based on user profile analysis
const simulateLLMResponse = (userProfile: UserProfile, _options: OnboardingGenerationOptions = {}): OnboardingStep[] => {
  const steps: OnboardingStep[] = [];
  let stepCounter = 1;

  // Helper function to create a step
  const createStep = (templateKey: string, customizations: Partial<OnboardingStep> = {}) => {
    const template = baseStepTemplates[templateKey as keyof typeof baseStepTemplates];
    if (!template) return null;

    return {
      id: `step_${stepCounter.toString().padStart(3, '0')}`,
      ...template,
      ...customizations,
      isCompleted: false,
      dependencies: customizations.dependencies || (stepCounter > 1 ? [`step_${(stepCounter - 1).toString().padStart(3, '0')}`] : undefined)
    };
  };

  // 1. Always start with company introduction
  const companyIntro = createStep('company_intro');
  if (companyIntro) {
    steps.push(companyIntro);
    stepCounter++;
  }

  // 2. IT Setup (customized based on role)
  const itSetup = createStep('basic_it_setup', {
    description: userProfile.role.toLowerCase().includes('lead') || userProfile.role.toLowerCase().includes('manager')
      ? "Configure your workstation and get access to management systems and reporting tools"
      : "Get your laptop, accounts, and development environment configured",
    estimatedDuration: userProfile.role.toLowerCase().includes('scientist') ? "4 hours" : "3 hours"
  });
  if (itSetup) {
    steps.push(itSetup);
    stepCounter++;
  }

  // 3. Team integration (always important)
  const teamMeeting = createStep('team_integration', {
    dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 4 days from now
  });
  if (teamMeeting) {
    steps.push(teamMeeting);
    stepCounter++;
  }

  // 4. Role-specific training based on user profile
  if (userProfile.role.toLowerCase().includes('data scientist')) {
    const dsTraining = createStep('data_science_training', {
      description: userProfile.skillGaps?.includes('Deep Learning') 
        ? "Learn SAP's data science tools with focus on deep learning capabilities"
        : "Learn SAP's data science tools and methodologies",
      dueDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    if (dsTraining) {
      steps.push(dsTraining);
      stepCounter++;
    }
  } else if (userProfile.role.toLowerCase().includes('analyst')) {
    const analyticsTraining = createStep('analytics_training', {
      description: userProfile.skillGaps?.includes('Python') 
        ? "Learn SAP's BI tools and get Python training for advanced analytics"
        : "Learn SAP's approach to business intelligence and reporting",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    if (analyticsTraining) {
      steps.push(analyticsTraining);
      stepCounter++;
    }
  }

  // 5. First project (customized based on experience and role)
  const projectTitle = userProfile.experience.includes('1.5') || userProfile.experience.includes('2')
    ? "Guided Starter Project"
    : userProfile.role.toLowerCase().includes('lead')
      ? "Team Assessment & Planning"
      : "First Project Assignment";

  const projectDescription = userProfile.role.toLowerCase().includes('lead')
    ? "Review your team's current capabilities and plan development initiatives"
    : userProfile.skillGaps?.length 
      ? `Begin work on a starter project focused on ${userProfile.skillGaps[0]} skills`
      : "Begin work on a starter project to apply your skills in the SAP environment";

  const project = createStep('starter_project', {
    title: projectTitle,
    description: projectDescription,
    estimatedDuration: userProfile.role.toLowerCase().includes('lead') ? "1 week" : "2 weeks",
    dueDate: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });
  if (project) {
    steps.push(project);
    stepCounter++;
  }

  // 6. Add professional development planning for everyone
  const devPlanStep: OnboardingStep = {
    id: `step_${stepCounter.toString().padStart(3, '0')}`,
    title: "Professional Development Planning",
    description: userProfile.role.toLowerCase().includes('lead')
      ? "Create strategic development plans for yourself and your team"
      : "Work with your manager to create a 90-day development plan",
    type: "meeting",
    estimatedDuration: userProfile.role.toLowerCase().includes('lead') ? "2 hours" : "1 hour",
    isCompleted: false,
    category: "Career Development",
    priority: "medium",
    dependencies: [`step_${(stepCounter - 1).toString().padStart(3, '0')}`],
    dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    resources: [
      {
        type: "form",
        title: "90-Day Goal Setting Template",
        url: "https://hr.sap.com/goal-setting-template",
        description: "Structured template for setting your objectives",
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
  };
  steps.push(devPlanStep);

  return steps;
};

export const generatePersonalizedOnboardingJourney = async (
  userProfile: UserProfile, 
  options: OnboardingGenerationOptions = {}
): Promise<OnboardingJourney> => {
  // In a real implementation, this would call an actual LLM API
  // For now, we'll simulate the LLM response based on user profile analysis
  
  const prompt = generateLLMPrompt(userProfile, options);
  console.log('Generated LLM Prompt:', prompt);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Generate personalized steps based on user profile
  const personalizedSteps = simulateLLMResponse(userProfile, options);
  
  // Calculate estimated completion date based on steps
  const totalWeeks = personalizedSteps.reduce((acc, step) => {
    const duration = step.estimatedDuration;
    if (duration.includes('week')) {
      return acc + parseInt(duration);
    } else if (duration.includes('day')) {
      return acc + (parseInt(duration) / 7);
    }
    return acc + 0.1; // Assume hours are minimal
  }, 0);
  
  const startDate = new Date().toISOString().split('T')[0];
  const estimatedCompletionDate = new Date(Date.now() + totalWeeks * 7 * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0];
  
  const journey: OnboardingJourney = {
    userId: userProfile.id,
    role: userProfile.role,
    department: userProfile.department,
    startDate,
    estimatedCompletionDate,
    currentProgress: 0,
    steps: personalizedSteps
  };
  
  return journey;
};

// Helper function to regenerate journey with new preferences
export const regenerateOnboardingJourney = async (
  userProfile: UserProfile,
  currentJourney: OnboardingJourney,
  newOptions: OnboardingGenerationOptions
): Promise<OnboardingJourney> => {
  // Preserve completion status of existing steps when regenerating
  const newJourney = await generatePersonalizedOnboardingJourney(userProfile, newOptions);
  
  // Map completed steps from current journey to new journey
  newJourney.steps.forEach(newStep => {
    const existingStep = currentJourney.steps.find(step => 
      step.title === newStep.title || step.type === newStep.type
    );
    if (existingStep && existingStep.isCompleted) {
      newStep.isCompleted = true;
    }
  });
  
  // Recalculate progress
  const completedSteps = newJourney.steps.filter(step => step.isCompleted).length;
  newJourney.currentProgress = Math.round((completedSteps / newJourney.steps.length) * 100);
  
  return newJourney;
};

export type { UserProfile, OnboardingGenerationOptions };