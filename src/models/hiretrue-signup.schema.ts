import { z } from "zod";

export const VISA_STATUSES = [
  { label: "F-1 (Student Visa)", value: "f1" },
  { label: "H-1B (Work Visa)", value: "h1b" },
  { label: "Green Card / PR", value: "gc" },
  { label: "US Citizen", value: "citizen" },
  { label: "Other", value: "other" },
] as const;

export type VisaStatus = (typeof VISA_STATUSES)[number]["value"];

export const HireTrueSignupSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z
    .string()
    .min(3, { message: "Email must be at least 3 characters." })
    .email("Please enter a valid email."),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  visa_status: z.string().optional(),
});

export type HireTrueSignupInput = z.infer<typeof HireTrueSignupSchema>;
