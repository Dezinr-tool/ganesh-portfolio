import type { IaQuestion } from "./types";

export const IA_GREETING =
  "Let's build the information architecture for your product. What are we working on?";

export const IA_OPTIONAL_KEYS = new Set(["q11", "q13", "q14"]);
export const IA_MULTI_CHIP_KEYS = new Set<string>();

export const IA_QUESTIONS: IaQuestion[] = [
  {
    key: "q1",
    question_text: "What's the product name and what does it do?",
    question_type: "open",
    parent_key: null,
    follow_up_condition: null,
    chips_options: null,
    category: "understand",
    order_index: 1,
  },
  {
    key: "q2",
    question_text: "What type of product is this?",
    question_type: "chips",
    parent_key: null,
    follow_up_condition: null,
    chips_options: ["Mobile App", "Web App", "Website", "Desktop App", "Other"],
    category: "understand",
    order_index: 2,
  },
  {
    key: "q3",
    question_text: "Is this a new product or restructuring an existing one?",
    question_type: "chips",
    parent_key: null,
    follow_up_condition: null,
    chips_options: ["New product", "Restructuring existing"],
    category: "understand",
    order_index: 3,
  },
  {
    key: "q3a",
    question_text:
      "Share the existing URL or upload screenshots. I'll analyze the current structure.",
    question_type: "open_upload",
    parent_key: "q3",
    follow_up_condition: "Restructuring existing",
    chips_options: null,
    category: "understand",
    order_index: 4,
  },
  {
    key: "q3b",
    question_text:
      "What's broken about the current structure? What do users struggle to find?",
    question_type: "open_upload",
    parent_key: "q3a",
    follow_up_condition: null,
    chips_options: null,
    category: "understand",
    order_index: 5,
  },
  {
    key: "q4",
    question_text: "Who are the primary users? Be specific.",
    question_type: "open",
    parent_key: null,
    follow_up_condition: null,
    chips_options: null,
    category: "understand",
    order_index: 6,
  },
  {
    key: "q5",
    question_text:
      "Are there multiple user types who need different access or views?",
    question_type: "chips",
    parent_key: null,
    follow_up_condition: null,
    chips_options: [
      "Single user type",
      "2 user types",
      "3+ user types",
      "Admin + End user",
    ],
    category: "understand",
    order_index: 7,
  },
  {
    key: "q5a",
    question_text:
      "Briefly describe each user type — who they are and what they need access to.",
    question_type: "open",
    parent_key: "q5",
    follow_up_condition: "MULTI_USER",
    chips_options: null,
    category: "understand",
    order_index: 8,
  },
  {
    key: "q6",
    question_text:
      "What are the 3 most important things a user must be able to DO in this product?",
    question_type: "open",
    parent_key: null,
    follow_up_condition: null,
    chips_options: null,
    category: "understand",
    order_index: 9,
  },
  {
    key: "q7",
    question_text:
      "What are the 3 most important things a user must be able to FIND?",
    question_type: "open",
    parent_key: null,
    follow_up_condition: null,
    chips_options: null,
    category: "understand",
    order_index: 10,
  },
  {
    key: "q8",
    question_text: "Roughly how much content/features does this product have?",
    question_type: "chips",
    parent_key: null,
    follow_up_condition: null,
    chips_options: [
      "Simple (5-10 screens)",
      "Medium (10-30 screens)",
      "Complex (30-50 screens)",
      "Very complex (50+ screens)",
    ],
    category: "content",
    order_index: 11,
  },
  {
    key: "q9",
    question_text: "Does the product have user authentication (login/signup)?",
    question_type: "chips",
    parent_key: null,
    follow_up_condition: null,
    chips_options: ["Yes — core feature", "Yes — but secondary", "No — public only"],
    category: "content",
    order_index: 12,
  },
  {
    key: "q10",
    question_text:
      "Any content that requires permissions or roles? (admin, premium, free)",
    question_type: "chips",
    parent_key: null,
    follow_up_condition: null,
    chips_options: [
      "Yes — multiple roles",
      "Yes — just admin",
      "No — same for everyone",
    ],
    category: "content",
    order_index: 13,
  },
  {
    key: "q11",
    question_text:
      "Are there any existing navigation patterns you want to keep or definitely avoid?",
    question_type: "open",
    parent_key: null,
    follow_up_condition: null,
    chips_options: null,
    category: "content",
    order_index: 14,
    is_optional: true,
  },
  {
    key: "q12",
    question_text:
      "What is the single most important action you want users to take?",
    question_type: "open",
    parent_key: null,
    follow_up_condition: null,
    chips_options: null,
    category: "goals",
    order_index: 15,
  },
  {
    key: "q13",
    question_text:
      "Any technical or business constraints that affect structure?",
    question_type: "open",
    parent_key: null,
    follow_up_condition: null,
    chips_options: null,
    category: "goals",
    order_index: 16,
    is_optional: true,
  },
  {
    key: "q14",
    question_text:
      "Do you have any research, user interviews, or existing documentation I should consider?",
    question_type: "upload",
    parent_key: null,
    follow_up_condition: null,
    chips_options: null,
    category: "goals",
    order_index: 17,
    is_optional: true,
  },
];
