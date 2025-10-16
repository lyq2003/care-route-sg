import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Clock, User, Filter, ArrowLeft, Check, Navigation, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "./axios";
import useLocation from "@/features/location/locationTracking";
import getProfile from "@/features/profile/getProfile";

export default function AccepetedRequest() {
    const navigate = useNavigate();
    const [request, setRequests] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    const handleCancelRequest =async (requestId: number) => {
        try{
            const response = await axiosInstance.put("/volunteer/acceptRequest",
            {params: {requestId}},
            {withCredentials: true,}
            )
            console.log("response is:",response);
            if (response.data.success) {
                navigate("/volunteer_dashboard")
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
    const handleViewRoute = (requestId: number) => {
        console.log("Viewing route for request:", requestId);
    };

    const fetchAcceptedRequest = async () =>{
        try{
            const response = await axiosInstance.get("/volunteer/getAcceptedRequest",
                {
                    withCredentials: true,
                }
            )
            console.log("respone is:",response.data.data);
            if(response.data.success){
                setRequests(response.data.data || null)
            }

            console.log("Accepted request fetched:", request);
        } catch(error){
            console.error("Error getting accpted request:", error);
        }
    }
    useEffect(() =>{
        fetchAcceptedRequest();
    }, []);

    if (error) return <p>Error loading accepted request.</p>;
    if (!request) return <p>No accepted request at the moment.</p>;

    return (
        <Card key={request.id} className="p-6 space-y-4">
        <h4 className="text-lg font-semibold text-foreground">{request.title}</h4>

        <div className="flex gap-2">
            <Badge className={getPriorityColor(request.urgency)}>
            {request.urgency} Priority
            </Badge>
        </div>

        <p className="text-foreground">{request.description}</p>

        <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{request.address}</span>
            {request.distance_meters && (
                <span className="ml-2">
                Distance: {Math.round(request.distance_meters)}m
                </span>
            )}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{request.username}</span>
            </div>
        </div>

        <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Required Skills:</p>
            <div className="flex flex-wrap gap-2">{/* add skill tags later */}</div>
        </div>

        <div className="flex gap-3 pt-2">
            <Button
            onClick={() => handleCancelRequest(request.id)}
            className="flex-1 bg-success hover:bg-success/90"
            >
            <Check className="h-5 w-5 mr-2" />
            Cancel Request
            </Button>
            <Button
            variant="outline"
            onClick={() => navigate(`/route/${request.id}`)}
            className="flex-1 text-primary border-primary/50"
            >
            <Navigation className="h-5 w-5 mr-2" />
            View Route
            </Button>
        </div>
        </Card>
    );
}
