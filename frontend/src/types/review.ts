export interface Review {
  id: string;
  author_user_id: string;
  recipient_user_id: string;
  help_request_id: string;
  rating: number;
  text?: string;
  created_at: string;
  updated_at?: string;
  is_edited?: boolean;
  author_name?: string;
  recipient_name?: string;
  author_role?: "elderly" | "volunteer" | "caregiver";
  recipient_role?: "elderly" | "volunteer" | "caregiver";
}

export interface ReviewFormData {
  recipientUserId: string;
  helpRequestId: string;
  rating: number;
  text?: string;
}
