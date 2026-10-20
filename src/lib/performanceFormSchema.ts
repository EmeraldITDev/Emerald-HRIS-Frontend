/**
 * Guide §5 / §6 field definitions for Batch 3.
 * Legacy keys listed for read-compat with historical self_assessment / manager_review JSON.
 */

export type SelfAssessmentDraft = {
  achievements_impact: string;
  objective_results: string;
  not_fully_achieved: string;
  control_vs_external: string;
  collaboration_example: string;
  ownership_professionalism: string;
  skills_applied: string;
  improvement_one_thing: string;
  support_needed: string;
  next_priorities: string;
  // Legacy keys retained when loading older drafts (not shown as primary fields).
  [key: string]: string;
};

export const EMPTY_SELF_ASSESSMENT: SelfAssessmentDraft = {
  achievements_impact: "",
  objective_results: "",
  not_fully_achieved: "",
  control_vs_external: "",
  collaboration_example: "",
  ownership_professionalism: "",
  skills_applied: "",
  improvement_one_thing: "",
  support_needed: "",
  next_priorities: "",
};

/** Guide §5 B — required on submit (not inventing employee self-ratings). */
export const SELF_ASSESSMENT_REQUIRED_KEYS = [
  "achievements_impact",
  "objective_results",
  "not_fully_achieved",
  "control_vs_external",
  "collaboration_example",
  "ownership_professionalism",
  "skills_applied",
  "improvement_one_thing",
  "support_needed",
  "next_priorities",
] as const;

/** Named form fields only — excludes the string-index legacy catch-all on SelfAssessmentDraft. */
export type SelfAssessmentFieldKey = (typeof SELF_ASSESSMENT_REQUIRED_KEYS)[number];

export const SELF_ASSESSMENT_FIELDS: Array<{
  key: SelfAssessmentFieldKey;
  label: string;
  legacyKeys?: string[];
}> = [
  {
    key: "achievements_impact",
    label:
      "What were your most important achievements during this review period? What was the impact?",
    legacyKeys: ["achievements"],
  },
  {
    key: "objective_results",
    label:
      "For each agreed objective, what was the target, what did you achieve, and what evidence supports your answer? (Structured objectives arrive in Batch 4 — summarise here for now.)",
    legacyKeys: ["completedGoals"],
  },
  {
    key: "not_fully_achieved",
    label: "Which objectives or commitments were not fully achieved? What were the main reasons?",
    legacyKeys: ["unachievedGoals", "challenges"],
  },
  {
    key: "control_vs_external",
    label:
      "Which factors were within your control, and which depended on other teams, resources or changing priorities?",
  },
  {
    key: "collaboration_example",
    label: "How effectively did you collaborate with colleagues or other teams? Give an example.",
    legacyKeys: ["teamCommunication"],
  },
  {
    key: "ownership_professionalism",
    label:
      "How did you demonstrate ownership, professionalism, integrity and compliance with relevant policies or safety requirements?",
    legacyKeys: ["professionalism"],
  },
  {
    key: "skills_applied",
    label: "What skills or knowledge have you improved or applied during this period?",
    legacyKeys: ["skillsToLearn"],
  },
  {
    key: "improvement_one_thing",
    label: "What is one thing you could improve or do differently next time?",
    legacyKeys: ["suggestions"],
  },
  {
    key: "support_needed",
    label: "What support, tools, training or decisions would help you perform better?",
    legacyKeys: ["resourcesNeeded"],
  },
  {
    key: "next_priorities",
    label: "What should be your key priorities for the next six months?",
    legacyKeys: ["futureGoals", "teamContribution"],
  },
];

export function hydrateSelfAssessment(source: any): SelfAssessmentDraft {
  const next = { ...EMPTY_SELF_ASSESSMENT };
  if (!source || typeof source !== "object") return next;
  for (const field of SELF_ASSESSMENT_FIELDS) {
    const keys = [field.key, ...(field.legacyKeys || [])];
    for (const k of keys) {
      const v = source[k];
      if (v !== undefined && v !== null && String(v).trim() !== "") {
        next[field.key] = String(v);
        break;
      }
    }
  }
  // Preserve unrecognised legacy keys so we do not discard historical data on save.
  for (const [k, v] of Object.entries(source)) {
    if (!(k in next) && v !== undefined && v !== null) {
      next[k] = typeof v === "string" ? v : JSON.stringify(v);
    }
  }
  return next;
}

export type ManagerAssessmentDraft = {
  objectives_clear: string;
  measures_clear: string;
  material_changes_recorded: string;
  objective_assessments_narrative: string;
  behaviour_skills_rating: string;
  behaviour_skills_example: string;
  behaviour_collaboration_rating: string;
  behaviour_collaboration_example: string;
  behaviour_ownership_rating: string;
  behaviour_ownership_example: string;
  behaviour_learning_rating: string;
  behaviour_learning_example: string;
  strengths: string;
  areas_for_improvement: string;
  ratings: string;
  comments: string;
  next_priorities: string;
  development_action: string;
  development_owner: string;
  development_target_date: string;
  manager_support: string;
  pip_recommended: string;
  pip_reason: string;
  performance_assessment: string;
  recommendations: string;
  [key: string]: string;
};

export const EMPTY_MANAGER_ASSESSMENT: ManagerAssessmentDraft = {
  objectives_clear: "",
  measures_clear: "",
  material_changes_recorded: "",
  objective_assessments_narrative: "",
  behaviour_skills_rating: "",
  behaviour_skills_example: "",
  behaviour_collaboration_rating: "",
  behaviour_collaboration_example: "",
  behaviour_ownership_rating: "",
  behaviour_ownership_example: "",
  behaviour_learning_rating: "",
  behaviour_learning_example: "",
  strengths: "",
  areas_for_improvement: "",
  ratings: "",
  comments: "",
  next_priorities: "",
  development_action: "",
  development_owner: "",
  development_target_date: "",
  manager_support: "",
  pip_recommended: "",
  pip_reason: "",
  performance_assessment: "",
  recommendations: "",
};

export const MANAGER_SUBMIT_REQUIRED_KEYS = [
  "behaviour_ownership_rating",
  "behaviour_ownership_example",
  "behaviour_learning_rating",
  "behaviour_learning_example",
  "strengths",
  "areas_for_improvement",
  "ratings",
  "next_priorities",
  "development_action",
  "development_owner",
  "development_target_date",
  "manager_support",
  "pip_recommended",
] as const;

export function hydrateManagerAssessment(source: any): ManagerAssessmentDraft {
  const next = { ...EMPTY_MANAGER_ASSESSMENT };
  if (!source || typeof source !== "object") return next;
  for (const key of Object.keys(EMPTY_MANAGER_ASSESSMENT)) {
    const v = source[key];
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      next[key] = String(v);
    }
  }
  // Legacy aliases
  if (!next.performance_assessment && source.observations) {
    next.performance_assessment = String(source.observations);
  }
  if (!next.objective_assessments_narrative && next.performance_assessment) {
    next.objective_assessments_narrative = next.performance_assessment;
  }
  if (!next.recommendations && source.development_actions) {
    next.recommendations = String(source.development_actions);
  }
  if (!next.development_action && next.recommendations) {
    next.development_action = next.recommendations;
  }
  for (const [k, v] of Object.entries(source)) {
    if (!(k in next) && v !== undefined && v !== null && typeof v !== "object") {
      next[k] = String(v);
    }
  }
  return next;
}

/** Flatten manager form into API manager_review JSON (keeps legacy keys for older consumers). */
export function toManagerReviewPayload(draft: ManagerAssessmentDraft): Record<string, string> {
  const payload: Record<string, string> = { ...draft };
  payload.performance_assessment =
    draft.objective_assessments_narrative || draft.performance_assessment || "";
  payload.recommendations = draft.development_action || draft.recommendations || "";
  payload.observations = draft.comments || draft.performance_assessment || "";
  return payload;
}
