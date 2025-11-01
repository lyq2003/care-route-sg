import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "../../components/axios";

interface SubmitReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientUserId?: string | null;
  recipientUsername?: string | null;
  helpRequestId?: string | null;
}

const SubmitReviewModal: React.FC<SubmitReviewModalProps> = ({ isOpen, onClose, recipientUserId, recipientUsername, helpRequestId }) => {
  const [rating, setRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [text, setText] = useState<string>("");
  const { toast } = useToast();

  if (!isOpen) return null;

  const handleSubmit = async () => {

    if (!rating || rating < 1 || rating > 5) {
      toast({
        title: "Rating required",
        description: "Please select a rating from 1 to 5 stars.",
        variant: "destructive",
      });
      return;
    }
    try{
      const response = await axiosInstance.post("/reviews/",
        {
          recipientUserId,
          helpRequestId,
          rating,
          text,
        },
        {
          withCredentials: true
        }
      )
      if (response.data.success){
        console.log("Submitting review", { recipientUserId, helpRequestId, rating, text });
        toast({
          title: "Review submitted!",
          description: "Thank you for your feedback.",
        });
        onClose();
        // Reset form
        setRating(null);
        setHoveredRating(null);
        setText("");
      } else{
        console.error("Failed to send review:", response.data.message);
        alert("Failed to submit review, please try again");
      }
    } catch(error){
      console.error("Error submitting review: ", error);
      alert("Error submitting review. Please try again.");
    }
  };

  const infoMissing = !recipientUserId || !helpRequestId;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Leave a Review</DialogTitle>
          <DialogDescription>
            <div className="space-y-1">
              <p>For user: {recipientUsername || "Unknown"}</p>
              <p>Request ID: {helpRequestId || "N/A"}</p>
              {infoMissing && (
                <p className="text-xs text-muted-foreground">Some information is not available in this demo.</p>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <label className="block text-sm font-medium mb-3">Rating</label>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map((value) => {
                  const displayRating = hoveredRating ?? rating ?? 0;
                  const filled = displayRating >= value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      onMouseEnter={() => setHoveredRating(value)}
                      onMouseLeave={() => setHoveredRating(null)}
                      className="p-1 rounded-md transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring"
                      aria-label={`Rate ${value} star${value>1?"s":""}`}
                    >
                      <Star 
                        className={`h-8 w-8 transition-colors ${
                          filled 
                            ? "text-yellow-500 fill-yellow-500" 
                            : "text-muted-foreground/40"
                        }`} 
                      />
                    </button>
                  );
                })}
              </div>
              {(rating || hoveredRating) && (
                <p className="text-sm text-muted-foreground">
                  {hoveredRating ?? rating} / 5 stars
                </p>
              )}
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


