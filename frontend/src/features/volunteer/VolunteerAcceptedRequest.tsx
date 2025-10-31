import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Clock, User, Filter, ArrowLeft, Check, Navigation, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "../../components/axios";
import useLocation from "@/features/location/locationTracking";
import getProfile from "@/features/profile/getProfile";
import SubmitReviewModal from "@/features/moderation/SubmitReviewModal";
import SubmitReportModal from "@/features/moderation/SubmitReportModal";

export default function AccepetedRequest({ setActiveTab, setSelectedRoute }) {
    const navigate = useNavigate();
    const [request, setRequests] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [isReportOpen, setIsReportOpen] = useState(false);

    // getting user info from getProfile
    //const {profile} = getProfile();

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

    const handleCancelRequest =async (requestId: number, elderlyId) => {
        try{
            const response = await axiosInstance.put("/volunteer/cancelRequest",
            {params: {requestId, elderlyId}},
            {withCredentials: true,}
            )
            
            if (response.data.success) {
                setActiveTab("dashboard");
        } else {
            console.error("Failed to accept the request:", response.data.message);
            alert("Failed to accept the request. Please try again.");
        }
        } catch (error) {
        console.error("Error accepting request:", error);
        alert("Error accepting request. Please try again.");
        }
    };


    // todo
    const handleViewRoute = (latitude: number, longitude: number) => {
        if (!location) {
            alert("Unable to get your current location.");
            return;
        }

        console.log(location,latitude,longitude);  // Check if this is correct.

        setSelectedRoute({
            from: { lat: location.latitude, lng: location.longitude },
            to: { lat: latitude, lng: longitude },
        });

        setActiveTab("route");
    };

    const fetchAcceptedRequest = async (latitude,longitude) =>{
        try{
            const response = await axiosInstance.get("/volunteer/getAcceptedRequest",
                {
                    params:{latitude,longitude},
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
        if(!location) return;

        fetchAcceptedRequest(location.latitude,location.longitude);
    }, [location]);

    if (error) return <p>Error loading accepted request.</p>;

    if (!request) return <p>No accepted request at the moment.</p>;

    return (
        <Card key={request[0].id} className="p-6 space-y-4">
        <h4 className="text-lg font-semibold text-foreground">{request[0].title}</h4>

        <div className="flex gap-2">
            <Badge className={getPriorityColor(request[0].urgency)}>
            {request.urgency} Priority
            </Badge>
        </div>

        <p className="text-foreground">{request[0].description}</p>

        <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{request[0].address}</span>
            {request[0].distance_meters && (
                <span className="ml-2">
                Distance: {Math.round(request[0].distance_meters)}m
                </span>
            )}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{request[0].username}</span>
            </div>
        </div>

        <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Required Skills:</p>
            <div className="flex flex-wrap gap-2">{/* add skill tags later */}</div>
        </div>

        <div className="flex gap-3 pt-2">
            <Button
            onClick={() => handleCancelRequest(request[0].id, request[0].requesterid)}
            className="flex-1 bg-success hover:bg-success/90"
            >
            <Check className="h-5 w-5 mr-2" />
            Cancel Request
            </Button>
            <Button
            variant="outline"
            onClick={() => handleViewRoute(request[0].latitude, request[0].longitude)}
            className="flex-1 text-primary border-primary/50"
            >
            <Navigation className="h-5 w-5 mr-2" />
            View Route
            </Button>
        </div>
        {request && request[0] && (
            <div className="flex gap-3 pt-2">
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => setIsReviewOpen(true)}
                >
                  Leave Review
                </Button>

                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => setIsReportOpen(true)}
                >
                  Report User
                </Button>
            </div>
        )}
        <SubmitReviewModal
          isOpen={isReviewOpen}
          onClose={() => setIsReviewOpen(false)}
          recipientUserId={request && request[0] ? request[0].requesterid : null}
          recipientUsername={request && request[0] ? request[0].username: null}
          helpRequestId={request && request[0] ? request[0].id : null}
        />

        <SubmitReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          reportedUserId={request && request[0] ? request[0].requesterid : null}
          reportedUsername={request && request[0] ? request[0].username: null}
          helpRequestId={request && request[0] ? request[0].id : null}
        />
        </Card>
    );
}
