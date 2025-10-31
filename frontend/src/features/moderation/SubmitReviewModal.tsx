import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";

interface SubmitReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientUserId?: string | null;
  helpRequestId?: string | null;
}

const SubmitReviewModal: React.FC<SubmitReviewModalProps> = ({ isOpen, onClose, recipientUserId, helpRequestId }) => {
  const [rating, setRating] = useState<number | null>(null);
  const [text, setText] = useState<string>("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!rating || rating < 1 || rating > 5) {
      alert("Please select a rating from 1 to 5.");
      return;
    }
    // Demo-only: log and alert
    // eslint-disable-next-line no-console
    console.log("Submitting review", { recipientUserId, helpRequestId, rating, text });
    alert("Review submitted!");
    onClose();
  };

  const infoMissing = !recipientUserId || !helpRequestId;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Leave a Review</DialogTitle>
          <DialogDescription>
            <div className="space-y-1">
              <p>For user: {recipientUserId || "Unknown"}</p>
              <p>Request ID: {helpRequestId || "N/A"}</p>
              {infoMissing && (
                <p className="text-xs text-muted-foreground">Some information is not available in this demo.</p>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <label className="block text-sm font-medium mb-2">Rating</label>
            <div className="flex items-center gap-2">
              {[1,2,3,4,5].map((value) => {
                const filled = (rating ?? 0) >= value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    className="p-2 rounded-md hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
                    aria-label={`Rate ${value} star${value>1?"s":""}`}
                  >
                    <Star className={`h-6 w-6 ${filled ? "text-warning fill-current" : "text-muted-foreground"}`} />
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Additional comments (optional)</label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write your comments here..."
              className="min-h-24"
            />
          </div>
        </div>

        <DialogFooter>
          <div className="flex w-full gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1" onClick={handleSubmit}>Submit Review</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SubmitReviewModal;


