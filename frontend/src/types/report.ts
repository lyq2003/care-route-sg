export interface Report {
  id: string;
  reporter_user_id: string;
  reported_user_id: string;
  help_request_id?: string;
  reason: string;
  description?: string;
  status: "PENDING" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";
  created_at: string;
  updated_at?: string;
  reporter_name?: string;
  reported_name?: string;
  reporter_role?: "elderly" | "volunteer" | "caregiver";
  reported_role?: "elderly" | "volunteer" | "caregiver";
  attachments?: string[];
}

export interface ReportFormData {
  reportedUserId: string;
  helpRequestId?: string;
  reason: string;
  description?: string;
}

export const REPORT_REASONS = [
  "No-show",
  "Inappropriate behavior",
  "Misconduct",
  "Rude behavior",
  "Safety concerns",
  "Harassment",
  "Fraud / scam",
  "Other"
] as const;

export type ReportReason = typeof REPORT_REASONS[number];
