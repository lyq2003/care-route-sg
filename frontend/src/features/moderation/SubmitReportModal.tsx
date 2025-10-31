import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

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

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!reason) {
      alert("Please select a reason.");
      return;
    }
    // Demo-only: log and alert
    // eslint-disable-next-line no-console
    console.log("Submitting report", { reportedUserId, helpRequestId, reason, description, file });
    alert("Report submitted. Thank you for keeping the community safe.");
    onClose();
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
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-secondary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-secondary-foreground hover:file:bg-secondary/90"
            />
            {file && (
              <p className="mt-2 text-sm text-muted-foreground">Selected: {file.name}</p>
            )}
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


