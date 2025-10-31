import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, User, Filter, ArrowLeft, Check, Navigation, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "../../components/axios";
import useLocation from "@/features/location/locationTracking";
import SubmitReviewModal from "@/features/moderation/SubmitReviewModal";
import SubmitReportModal from "@/features/moderation/SubmitReportModal";

export default function CompletedRequest({ setActiveTab}) {
    const navigate = useNavigate();
    const [request, setRequests] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    // color of the priority
    const getPriorityColor = (priority: string) => {
        switch (priority) {
        case "high":
            return "bg-destructive text-destructive-foreground";
        case "medium":
            return "bg-warning text-warning-foreground";
        case "low":
            return "bg-success text-success-foreground";
        default:
            return "bg-muted text-muted-foreground";
        }
    };

    // getting user live location from useLocation
    const { location, error: locationError } = useLocation();

    const fetchFinishedRequest = async () =>{
        try{
            const response = await axiosInstance.get("/volunteer/getCompletedRequest",
                {
                    withCredentials: true,
                }
            )
            console.log("respone is:",response.data.data);
            if(response.data.success){
                setRequests(response.data.data || null)
            }
;
        } catch(error){
            console.error("Error getting accpted request:", error);
        }
    }
    useEffect(() =>{
        fetchFinishedRequest();
    }, [location]);

    if (error) return <p>Error loading accepted request.</p>;

    if (!request) return <p>No accepted request at the moment.</p>;

    if (!request.length) return <p>No completed requests yet.</p>;

    return (
        <div className="space-y-4">
      {request.map((req) => (
        <Card key={req.id} className="p-6 space-y-4">
          <h4 className="text-lg font-semibold text-foreground">{req.title}</h4>

          <div className="flex gap-2">
            <Badge className={getPriorityColor(req.urgency)}>
              {req.urgency} Priority
            </Badge>
          </div>

          <p className="text-foreground">{req.description}</p>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{req.address}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{req.requester?.username || "Unknown user"}</span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Required Skills:</p>
            <div className="flex flex-wrap gap-2">{/* add skill tags later */}</div>
          </div>

          <div className="flex gap-3 pt-2">
            {!req.reviewedVolunteer ? (
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => {
                  setSelectedRequest(req);
                  setIsReviewOpen(true);
                }}
              >
                Leave Review
              </Button>
            ) : (
              <span className="flex-1 text-center text-black font-semibold">
                Review Sent
              </span>
            )}

            <Button
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                setSelectedRequest(req);
                setIsReportOpen(true);
              }}
            >
              Report User
            </Button>
          </div>
        </Card>
      ))}

      {/* Shared modals that open with the selected request */}
      <SubmitReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        recipientUserId={selectedRequest?.requester?.user_id ?? null}
        recipientUsername={selectedRequest?.requester?.username ?? null}
        helpRequestId={selectedRequest?.id ?? null}
      />

      <SubmitReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        reportedUserId={selectedRequest?.requester?.user_id ?? null}
        reportedUsername={selectedRequest?.requester?.username ?? null}
        helpRequestId={selectedRequest?.id ?? null}
      />
    </div>
  );
}