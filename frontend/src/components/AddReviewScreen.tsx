import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, AlertTriangle, Clock, Upload, Phone, MessageSquare, Star } from "lucide-react";
import { axiosInstance as axios } from "./axios";
import { useNavigate, useLocation  } from "react-router-dom";




export default function AddReviewScreen() {
    const navigate = useNavigate();
    const location = useLocation();

    const [formData, setFormData] = useState({
        rating: "",
        description: ""
    });

    const onBack = () => {
        navigate(`/elderly_dashboard`);
    }





    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Get reviewer ID
        var token = localStorage.getItem("auth-storage");

        var tokenJSON = JSON.parse(token);

        var userID = tokenJSON.state.authUser.id;

        // Get help request ID passed in as state from elderly dashboard

        // get userId
        var helpRequestID = location.state.helpRequestID;

        console.log(helpRequestID);
        

        try {
            const response = await axios.post("/elderly/",
                {
                    rating: formData.rating,
                    reviewText: formData.description,
                    authorID: userID,
                    helpRequestID: helpRequestID
                },
                { withCredentials: true }
            );



        } catch (error: any) {
            console.error(error);
        } finally {
            navigate(`/elderly_dashboard`);
        }

    };


    const validateRatingInput = (event) => {

        var inputValue = event.target.value;

        if (inputValue < 0) {
            event.target.value = 0;
        } else if (inputValue > 5) {
            event.target.value = 5;
        }

    }

    return (
        <div className="min-h-screen bg-background px-6 py-8">
            <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" size="icon" onClick={onBack}>
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-2xl font-bold text-foreground">Add Review</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="rating" className="text-lg font-medium">
                        Rating
                    </Label>
                    <div className="relative">
                        <Star className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            id="rating"
                            type="number"
                            value={formData.rating}
                            onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                            className="h-14 text-lg pl-12"
                            placeholder="Enter rating between 0 and 5"
                            min="0"
                            max="5"
                            onKeyUp={validateRatingInput}
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description" className="text-lg font-medium">
                        Description
                    </Label>
                    <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="min-h-24 text-lg resize-none"
                        placeholder="Type your review..."
                        required
                    />
                </div>

                <Button type="submit" size="xl" className="w-full mt-8">
                    Submit Review
                </Button>
            </form>
        </div>
    );
}