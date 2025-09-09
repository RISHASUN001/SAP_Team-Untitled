import { courses, requiredSkillsByRole, SkillRequirement } from "./courseData";
import { userProfiles, UserProfile, UserSkill } from "./userProfiles";

// AI-Enhanced Recommendation Interface
export interface AIRecommendation {
  course_id: string;
  course_title: string;
  sequence_order: number;
  reasoning: string;
  timing_advice: string;
}

export interface AISkillAnalysis {
  recommended_sequence: AIRecommendation[];
  strategic_advice: string;
  estimated_timeline: string;
}

// Skill Gap Analysis: returns missing skills for a user
export function getSkillGaps(userId: string): SkillRequirement[] {
  const user: UserProfile | undefined = userProfiles.find(u => u.userId === userId);
  if (!user) return [];
  const required: SkillRequirement[] = requiredSkillsByRole[user.role] || [];
  const userSkills: { [name: string]: number } = Object.fromEntries(user.skills.map((s: UserSkill) => [s.name, s.rating]));
  return required.filter((req: SkillRequirement) => (userSkills[req.name] || 0) < req.level);
}

// Traditional Recommend courses to fill skill gaps
export function getRecommendedCourses(userId: string) {
  const gaps: SkillRequirement[] = getSkillGaps(userId);
  if (gaps.length === 0) return [];
  return courses.filter(course =>
    course.skills.some((skill: SkillRequirement) =>
      gaps.some((gap: SkillRequirement) => gap.name === skill.name && skill.level >= gap.level)
    )
  );
}

// NEW: AI-Enhanced Skill Gap Analysis
export async function getAIRecommendedCourses(userId: string): Promise<AISkillAnalysis | null> {
  try {
    const user = userProfiles.find(u => u.userId === userId);
    if (!user) return null;
    
    const skillGaps = getSkillGaps(userId);
    if (skillGaps.length === 0) return null;
    
    const recommendedCourses = getRecommendedCourses(userId);
    
    // Call AI service for intelligent analysis
    const response = await fetch('http://localhost:5004/api/ai-skill-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_profile: user,
        skill_gaps: skillGaps,
        available_courses: recommendedCourses
      }),
    });
    
    if (response.ok) {
      const result = await response.json();
      
      // Extract ai_recommendations from the wrapped response
      const aiRecommendations = result.ai_recommendations;
      return aiRecommendations;
    }
    
    return null;
  } catch (error) {
    console.error('AI recommendation service error:', error);
    return null;
  }
}

// Update user skills after course completion
export function completeCourse(userId: string, courseId: string) {
  const user: UserProfile | undefined = userProfiles.find(u => u.userId === userId);
  const course = courses.find(c => c.id === courseId);
  if (!user || !course) return false;
  course.skills.forEach((skill: SkillRequirement) => {
    const userSkill = user.skills.find((s: UserSkill) => s.name === skill.name);
    if (userSkill) {
      userSkill.rating = Math.max(userSkill.rating, skill.level);
    } else {
      user.skills.push({ name: skill.name, rating: skill.level });
    }
  });
  if (!user.completedCourses.includes(courseId)) {
    user.completedCourses.push(courseId);
  }
  return true;
}
