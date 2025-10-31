import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Paperclip } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SubmitReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUserId?: string | null;
  helpRequestId?: string | null;
}

const SubmitReportModal: React.FC<SubmitReportModalProps> = ({ isOpen, onClose, reportedUserId, helpRequestId }) => {
  const [reason, setReason] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!reason) {
      toast({
        title: "Reason required",
        description: "Please select a reason for your report.",
        variant: "destructive",
      });
      return;
    }
    // Demo-only: log
    // eslint-disable-next-line no-console
    console.log("Submitting report", { reportedUserId, helpRequestId, reason, description, file });
    toast({
      title: "Report submitted",
      description: "Thank you for keeping the community safe.",
    });
    onClose();
    // Reset form
    setReason("");
    setDescription("");
    setFile(null);
  };

  const handleFileRemove = () => {
    setFile(null);
  };

  const infoMissing = !reportedUserId || !helpRequestId;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report User</DialogTitle>
          <DialogDescription>
            <div className="space-y-1">
              <p>Reporting user: {reportedUserId || "Unknown"}</p>
              <p>Related request: {helpRequestId || "N/A"}</p>
              {infoMissing && (
                <p className="text-xs text-muted-foreground">Some information is not available in this demo.</p>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <label className="block text-sm font-medium mb-2">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-12 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Select a reason</option>
              <option value="Inappropriate behavior">Inappropriate behavior</option>
              <option value="Safety concern">Safety concern</option>
              <option value="Harassment">Harassment</option>
              <option value="Fraud / scam">Fraud / scam</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description (optional)</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide more details if helpful..."
              className="min-h-24"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Attach evidence (optional)</label>
            <div className="space-y-3">
              <label className="flex items-center justify-center w-full h-24 px-4 transition-colors border-2 border-dashed rounded-lg cursor-pointer border-input hover:border-primary/50 hover:bg-accent/50">
                <div className="flex flex-col items-center space-y-2">
                  <Paperclip className="w-6 h-6 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Click to upload file
                  </span>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>
              {file ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-secondary/50 rounded-lg">
                  <Paperclip className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm text-foreground truncate flex-1">{file.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleFileRemove}
                    className="h-6 w-6 p-0 hover:bg-destructive/10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Screenshots or photos are helpful.
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <div className="flex w-full gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1" onClick={handleSubmit}>Submit Report</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SubmitReportModal;


