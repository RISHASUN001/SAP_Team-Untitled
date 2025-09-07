import React from "react";
import Layout from "./Layout";
import { useAuth } from "../contexts/AuthContext";
import { getSkillGaps } from "../data/skillGapUtils";
import { userProfiles } from "../data/userProfiles";

const Skills: React.FC = () => {
  const { currentUser } = useAuth();
  if (!currentUser) return <Layout><div className="p-6">Please log in to view your skills.</div></Layout>;
  const userProfile = userProfiles.find(u => u.name === currentUser.name);
  if (!userProfile) return <Layout><div className="p-6">No skill data found for this user.</div></Layout>;

  return (
    <Layout>
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">{userProfile.name}'s Skills</h2>
        <ul>
          {userProfile.skills.map((s) => (
            <li key={s.name}>{s.name} (Rating: {s.rating})</li>
          ))}
        </ul>
        <h3 className="text-lg font-semibold mt-6 mb-2">Skill Gaps for Role: {userProfile.role}</h3>
        <ul>
          {getSkillGaps(userProfile.userId).length === 0 ? <li>None</li> : getSkillGaps(userProfile.userId).map(gap => (
            <li key={gap.name}>{gap.name} (Required Level: {gap.level})</li>
          ))}
        </ul>
      </div>
    </Layout>
  );
};

export default Skills;
