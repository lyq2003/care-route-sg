import { useState, useEffect, useRef } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Locate } from "lucide-react";
import useLocation from "./locationTracking";
import VolunteerRoute from "@/components/VolunteerRoute";

export default function ChasLocation() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("Chas_map");
    const [clinics, setClinics] = useState<any[]>([]);
    const [selectedRoute, setSelectedRoute] = useState<{ from: any; to: any } | null>(null);
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<google.maps.Map | null>(null);
    const [googleLoaded, setGoogleLoaded] = useState(false);
    
    // getting user live location from useLocation
    const { location, error: locationError } = useLocation();

    useEffect(() => {
        let cancelled = false;
        const initGoogle = async () => {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
            console.error(" Missing Google Maps API key");
            return;
        }

        try {
            setOptions({ key: apiKey, v: "weekly", libraries: ["places", "geometry"] });
            // Import libraries — ensures google.maps.* are defined
            await importLibrary("places");
            await importLibrary("geometry");
            if (!cancelled) setGoogleLoaded(true);
        } catch (err) {
            console.error("Failed to load Google Maps API", err);
        }
        };
        initGoogle();
        return () => { cancelled = true; };
    }, []);

    const handleViewRoute = (latitude: number, longitude: number) => {
        console.log("HandleVIewRoute in process");
        if (!location) {
        alert("Unable to get your current location.");
        return;
        }

        setSelectedRoute({
        from: { lat: location.latitude, lng: location.longitude },
        to: { lat: latitude, lng: longitude },
        });

        setActiveTab("route");
    };

    // Fetch CHAS Clinic dataset from data.gov.sg
    useEffect(() => {
        const fetchChasData = async () => {
        const datasetId = "d_548c33ea2d99e29ec63a7cc9edcccedc";
        const url = `https://api-open.data.gov.sg/v1/public/api/datasets/${datasetId}/poll-download`;

        try {
            let response = await fetch(url);
            if (!response.ok) throw new Error("Failed to fetch poll-download data");
            const jsonData = await response.json();
            if (jsonData.code !== 0) throw new Error(jsonData.errMsg);

            const fetchUrl = jsonData.data.url;
            response = await fetch(fetchUrl);
            if (!response.ok) throw new Error("Failed to fetch inner data");

            const data = await response.json();
            const features = data.features || [];

            // Extract useful info
            const parsedClinics = features.map((f: any) => {
            const desc = f.properties.Description;
            const nameMatch = desc.match(/<th>HCI_NAME<\/th>\s*<td>(.*?)<\/td>/);
            const postalMatch = desc.match(/<th>POSTAL_CD<\/th>\s*<td>(.*?)<\/td>/);
            const phoneMatch = desc.match(/<th>HCI_TEL<\/th>\s*<td>(.*?)<\/td>/);
            const addressMatch = desc.match(/<th>STREET_NAME<\/th>\s*<td>(.*?)<\/td>/);
            const coords = f.geometry.coordinates; // [lon, lat]

            return {
                name: nameMatch ? nameMatch[1] : "Unknown Clinic",
                postal: postalMatch ? postalMatch[1] : "-",
                phone: phoneMatch ? phoneMatch[1] : "-",
                address: addressMatch ? addressMatch[1] : "",
                lat: coords[1],
                lng: coords[0],
            };
            });

            setClinics(parsedClinics);
        } catch (e) {
            console.error("Error fetching CHAS data:", e);
        }
        };

        fetchChasData();
    }, []);

    // Initialize Map and Plot Markers when loaded
    useEffect(() => {
        if (!googleLoaded || clinics.length === 0 || activeTab !== "Chas_map") return;

        // Initialize the map
        const map = new google.maps.Map(mapContainerRef.current as HTMLElement, {
            center: { lat: 1.3521, lng: 103.8198 }, // Singapore
            zoom: 11,
        });
        mapRef.current = map;

        // Store all markers so we can clean them up later
        const markers: google.maps.Marker[] = [];

        clinics.forEach((clinic) => {
            const marker = new google.maps.Marker({
            position: { lat: clinic.lat, lng: clinic.lng },
            map,
            title: clinic.name,
            });
            markers.push(marker);

            // Create InfoWindow
            const container = document.createElement("div");
            container.style.fontSize = "14px";
            container.style.lineHeight = "1.4";

            const title = document.createElement("div");
            title.innerHTML = `<strong>${clinic.name}</strong>`;
            container.appendChild(title);

            const addr = document.createElement("div");
            addr.textContent = clinic.address || "";
            container.appendChild(addr);

            const postal = document.createElement("div");
            postal.textContent = `Postal: ${clinic.postal || "-"}`;
            container.appendChild(postal);

            const tel = document.createElement("div");
            tel.textContent = `Tel: ${clinic.phone || "-"}`;
            container.appendChild(tel);

            const btn = document.createElement("button");
            btn.textContent = "View Route";
            btn.style.backgroundColor = "#2563eb";
            btn.style.color = "white";
            btn.style.border = "none";
            btn.style.borderRadius = "6px";
            btn.style.padding = "6px 10px";
            btn.style.cursor = "pointer";
            btn.style.fontSize = "13px";
            btn.style.marginTop = "8px";
            btn.style.display = "block";
            btn.style.width = "100%";
            btn.addEventListener("click", (e) => {
            e.stopPropagation();
            handleViewRoute(clinic.lat, clinic.lng);
            });

            container.appendChild(btn);

            const infoWindow = new google.maps.InfoWindow({ content: container });
            marker.addListener("click", () => infoWindow.open(map, marker));
        });

        // leanup when effect re-runs or component unmounts
        return () => {
            markers.forEach((marker) => marker.setMap(null));
        };
        }, [googleLoaded, clinics, activeTab]);


    const renderTabContent = () => {
        switch (activeTab) {
            case "Chas_map":
                return (
                <div className="flex flex-col h-screen w-full">
                <div className="flex items-center p-3 bg-white shadow">
                    <Button onClick={() => navigate(-1)} variant="outline" size="sm">
                    <MapPin className="w-4 h-4 mr-1" /> Back
                    </Button>
                    <h1 className="text-lg font-semibold ml-3">CHAS Clinics in Singapore</h1>
                </div>

                <div ref={mapContainerRef} className="flex-1 w-full h-full" />

                <div className="p-3 bg-white shadow">
                    <Badge variant="outline">Total Clinics: {clinics.length}</Badge>
                </div>
                </div>
            )

            case "route":
                console.log(selectedRoute);
                if (!selectedRoute) return null;
        
                return (
                    <VolunteerRoute
                    selectedRoute={selectedRoute}
                    from={selectedRoute.from}
                    to={selectedRoute.to}
                    onBack={() => setActiveTab("Chas_map")}
                    />
                );
            default:
                return null;
            }
        };
    return (
    <div className="flex flex-col h-screen w-full">
        {renderTabContent()}
    </div>
    );
}
