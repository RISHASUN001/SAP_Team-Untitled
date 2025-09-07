import React, { useState } from "react";
import { getSkillGaps, getRecommendedCourses, completeCourse } from "../data/skillGapUtils";
import { userProfiles } from "../data/userProfiles";
import { courses } from "../data/courseData";

const testUserId = "user1"; // Change to test other users

export default function SkillGapTest() {
  const [user, setUser] = useState(userProfiles.find(u => u.userId === testUserId));
  const [skillGaps, setSkillGaps] = useState(getSkillGaps(testUserId));
  const [recommended, setRecommended] = useState(getRecommendedCourses(testUserId));
  const [completed, setCompleted] = useState(user?.completedCourses || []);

  const handleCompleteCourse = (courseId: string) => {
    completeCourse(testUserId, courseId);
    setUser(userProfiles.find(u => u.userId === testUserId));
    setSkillGaps(getSkillGaps(testUserId));
    setRecommended(getRecommendedCourses(testUserId));
    setCompleted(userProfiles.find(u => u.userId === testUserId)?.completedCourses || []);
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Skill Gap & Recommendation Test</h2>
      <h3>User: {user?.name} ({user?.role})</h3>
      <p><strong>Current Skills:</strong> {user?.skills.map(s => `${s.name} (Rating: ${s.rating})`).join(", ")}</p>
      <p><strong>Completed Courses:</strong> {completed.join(", ") || "None"}</p>
      <h4>Skill Gaps:</h4>
      <ul>
        {skillGaps.length === 0 ? <li>None</li> : skillGaps.map(gap => (
          <li key={gap.name}>{gap.name} (Required Level: {gap.level})</li>
        ))}
      </ul>
      <h4>Recommended Courses:</h4>
      <ul>
        {recommended.length === 0 ? <li>None</li> : recommended.map(course => (
          <li key={course.id}>
            {course.title} - <button onClick={() => handleCompleteCourse(course.id)}>Complete Course</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
