import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit3, Save, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import getProfile from "@/features/profile/getProfile";
import { axiosInstance } from "../../components/axios";

export default function VolunteerProfile() {
    const [isEditing, setIsEditing] = useState(false);
    const {profile} = getProfile();    
    const [username, setUsername] = useState(profile?.data?.name ?? "");
    const [phone_number, setPhoneNumber] = useState(profile?.data?.phone_number ?? "");
    
    console.log(profile);

    useEffect(()=>{
      if(!profile) return;
    },[profile]);

    const handleEdit = () => {
        setIsEditing(true);
        setUsername(profile?.data?.name ?? "");
        setPhoneNumber(profile?.data?.phone_number ?? "");
    };

    const handleCancel = () => {
        setIsEditing(false);
        setUsername(profile?.data?.name ?? "");
        setPhoneNumber(profile?.data?.phone_number ?? "");
    };

    const handleSave = () => {
        // TODO: Add API call to save profile data
        // Save the updated data here
        setIsEditing(false);
        toast({
            title: "Profile updated",
            description: "Your information has been saved successfully.",
        });
    };

    // If profile is still null, render a loading or error message
    if (!profile) {
        return <div>Loading profile...</div>; // Or handle with some error message
    }


    return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">Profile & Settings</h2>
        <p className="text-lg text-muted-foreground">Manage your volunteer account</p>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-foreground">Basic Information</h3>
          {!isEditing ? (
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Edit3 className="h-4 w-4" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Save className="h-4 w-4" />
                Save
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Full Name
            </Label>
            {isEditing ? (
              <Input
                id="name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-12 text-lg"
              />
            ) : (
              <div className="text-lg text-foreground">{profile.data.name}</div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium">
              Phone Number
            </Label>
            {isEditing ? (
              <Input
                id="phone"
                value={phone_number}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="h-12 text-lg"
                placeholder="+65 XXXX XXXX"
              />
            ) : (
              <div className="text-lg text-foreground">{profile.data.phone_number}</div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

