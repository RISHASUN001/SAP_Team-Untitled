# Agentic AI Architecture for SAP Learning Platform

## System Overview
This document outlines the multi-agent LLM system for intelligent course recommendations.

## Agent Architecture

### 1. Skills Analysis Agent (`skills_analysis_agent.py`)
**Purpose**: Deep analysis of user skills and learning capabilities
- Analyzes current skill levels vs. required levels
- Identifies critical skill gaps
- Determines learning readiness and prerequisites
- Suggests skill development priorities

### 2. Goals Analysis Agent (`goals_analysis_agent.py`)
**Purpose**: Alignment between user goals and available courses
- Analyzes user career goals and objectives
- Maps goals to specific courses and learning paths
- Prioritizes courses based on goal relevance
- Provides goal-achievement timelines

### 3. Feedback Analysis Agent (`feedback_analysis_agent.py`)
**Purpose**: Learning style and preference analysis from feedback data
- Analyzes historical feedback patterns
- Identifies learning strengths and weaknesses
- Determines optimal learning approaches
- Suggests course delivery preferences

### 4. Course Recommendation Coordinator (`ai_skill_gap.py` - Enhanced)
**Purpose**: Orchestrates all agent inputs for final recommendations
- Receives structured input from all three agents
- Combines multi-agent insights
- Generates comprehensive learning timeline
- Provides final course sequence recommendations

## Data Flow
```
User Profile → Skills Agent → Skills Analysis
             → Goals Agent → Goals Analysis  
             → Feedback Agent → Feedback Analysis
                              ↓
All Agent Outputs → Coordinator Agent → Final Recommendations
```

## Implementation Strategy
1. Create individual agent files with specialized LLM prompts
2. Implement agent orchestration layer
3. Modify existing `ai_skill_gap.py` to coordinate agents
4. Integrate with existing course enrollment flow