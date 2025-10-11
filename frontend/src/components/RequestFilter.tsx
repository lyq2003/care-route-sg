import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Clock, User, Filter, ArrowLeft, Check, Navigation } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "./axios";

export default function RequestsFilter() {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [filters, setFilters] = useState({
        distance: "",
        priority: "all",
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    // button to filter after clicking
    const searchRequests = async () =>{
        setLoading(true);
        setError(null);

        try{
        const params={};
        for (const key in filters){
            if (filters[key]) {
            // Handle arrays properly - send as actual arrays
            if (Array.isArray(filters[key]) && filters[key].length > 0) {
                params[key] = filters[key];
            } 
            else if (!Array.isArray(filters[key])) {
                params[key] = filters[key];
            }
            }
        }
        const response = await axiosInstance.get(
            "/volunteer/getFilteredRequests",
            { params }
        );
        setRequests(response.data.posts || []);
        } catch(err){
        setError(
            err.response?.data?.error ||
            err.message ||
            "An unexpected error occurred"
        );
        } finally{
        setLoading(false);
        }
    }
    // Real time filtering
    const fetchRequests = async () => {
        setLoading(true);
        setError(null);

        try {
        const params = {};

        for (const key in filters) {
            if (filters[key]) {
            // Handle arrays properly - send as actual arrays
            if (Array.isArray(filters[key]) && filters[key].length > 0) {
                params[key] = filters[key];
            } 
            else if (!Array.isArray(filters[key])) {
                params[key] = filters[key];
            }
            }
        }

        const response = await axiosInstance.get(
            "/volunteer/getFilteredRequests",
            { params }
        );
        setRequests(response.data.posts || []);
        } catch (err) {
        setError(
            err.response?.data?.error ||
            err.message ||
            "An unexpected error occurred"
        );
        } finally {
        setLoading(false);
        }
    };

    // Auto update posts when filter changes
    useEffect(() => {
        fetchRequests();
    }, [filters]);

    // set the filters
    const handleInputChange = (e) => {
        const {name, value} = e.target;
        setFilters({
        ...filters,
        [name]: value,
        });
    };

    // Reset function to clear all filters
    const handleReset = () => {
        setFilters({
            distance: "",
            priority: "all",
        });
    };

    // todo
    const handleAcceptRequest = (requestId: number) => {
        console.log("Accepting request:", requestId);
    };
    // todo
    const handleViewRoute = (requestId: number) => {
        console.log("Viewing route for request:", requestId);
    };

    return (
        <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-header-bg border-b border-border sticky top-0 z-10">
            <div className="px-6 py-4">
            <div className="flex items-center gap-3 mb-4">
                <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/volunteer_dashboard")}
                className="text-foreground hover:bg-primary/10"
                >
                <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                <h1 className="text-2xl font-bold text-foreground">Filter Requests</h1>
                <p className="text-sm text-muted-foreground">
                    {requests.length} requests available
                </p>
                </div>
            </div>

            {/* Filters */}
            <div className="space-y-3">
                <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium">
                    Location
                </Label>
                <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                    name="Distance"
                    value={filters.distance}
                    onChange={handleInputChange}
                    className="pl-10 bg-background"
                    placeholder="Search by location..."
                    />
                </div>
                </div>

                <div className="space-y-2">
                <Label htmlFor="priority" className="text-sm font-medium">
                    Priority
                </Label>
                <Select value={filters.priority} onValueChange={(value) => handleInputChange({ target: { name: 'priority', value } })}>
                    <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="low">Low Priority</SelectItem>
                    </SelectContent>
                </Select>
                </div>

                
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        handleReset();
                    }}
                    className="w-full"
                >
                    Clear Filters
                </Button>

            </div>
            </div>
        </div>

        {/* Results */}
        <div className="px-6 py-6 space-y-4">
            {requests.length > 0 ? (
            requests.map((request) => (
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
                        <span>{}</span>
                        {/* TODO: Add distance after calcuating here */}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>{request.user_profiles.username}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">Required Skills:</p>
                      <div className="flex flex-wrap gap-2">
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button 
                        onClick={() => handleAcceptRequest(request.id)}
                        className="flex-1 bg-success hover:bg-success/90"
                      >
                        <Check className="h-5 w-5 mr-2" />
                        Accept Request
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => handleViewRoute(request.id)}
                        className="flex-1 text-primary border-primary/50"
                      >
                        <Navigation className="h-5 w-5 mr-2" />
                        View Route
                      </Button>
                    </div>
                  </Card>
            ))
            ) : (
            <div className="text-center py-12">
                <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                No requests found
                </h3>
                <p className="text-muted-foreground mb-4">
                Try adjusting your filters to see more results
                </p>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        handleReset();
                    }}
                    className="w-full"
                >
                Clear Filters
                </Button>
            </div>
            )}
        </div>
        </div>
    );
}
