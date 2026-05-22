export interface QuestionSuggestion {
  question_text: string;
  question_type: "text" | "textarea" | "email" | "phone" | "select";
  is_required?: boolean;
  options?: { option_text: string; display_order: number }[];
}

export const QUESTION_SUGGESTIONS: QuestionSuggestion[] = [
  {
    question_text: "Please share anything that will help prepare for our meeting.",
    question_type: "textarea",
    is_required: false,
  },
  {
    question_text: "What is the main topic you'd like to discuss?",
    question_type: "text",
    is_required: false,
  },
  {
    question_text: "Company / Organization",
    question_type: "text",
    is_required: false,
  },
  {
    question_text: "Phone number",
    question_type: "phone",
    is_required: false,
  },
  {
    question_text: "LinkedIn profile URL",
    question_type: "text",
    is_required: false,
  },
  {
    question_text: "How did you hear about us?",
    question_type: "select",
    is_required: false,
    options: [
      { option_text: "Google search", display_order: 1 },
      { option_text: "Social media", display_order: 2 },
      { option_text: "Friend or colleague", display_order: 3 },
      { option_text: "Other", display_order: 4 },
    ],
  },
  {
    question_text: "Role / Job title",
    question_type: "text",
    is_required: false,
  },
  {
    question_text: "Number of attendees",
    question_type: "select",
    is_required: false,
    options: [
      { option_text: "Just me", display_order: 1 },
      { option_text: "2–5 people", display_order: 2 },
      { option_text: "6+ people", display_order: 3 },
    ],
  },
];
