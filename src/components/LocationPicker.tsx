import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Locate } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LocationPickerProps {
  onLocationSelect: (latitude: number, longitude: number, address?: string) => void;
  initialLatitude?: number;
  initialLongitude?: number;
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  initialLatitude,
  initialLongitude
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [isTokenSet, setIsTokenSet] = useState(false);
  const [coordinates, setCoordinates] = useState<{lat: number, lng: number} | null>(
    initialLatitude && initialLongitude 
      ? { lat: initialLatitude, lng: initialLongitude }
      : null
  );
  const { toast } = useToast();

  useEffect(() => {
    // Check if we have a Mapbox token in environment or ask user to provide it
    const token = process.env.MAPBOX_PUBLIC_TOKEN || '';
    if (token) {
      setMapboxToken(token);
      setIsTokenSet(true);
    }
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !isTokenSet || !mapboxToken) return;

    // Initialize map
    mapboxgl.accessToken = mapboxToken;
    
    const defaultCenter: [number, number] = initialLatitude && initialLongitude 
      ? [initialLongitude, initialLatitude]
      : [36.8219, -1.2921]; // Nairobi, Kenya

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: defaultCenter,
      zoom: initialLatitude && initialLongitude ? 15 : 10,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add initial marker if coordinates provided
    if (initialLatitude && initialLongitude) {
      marker.current = new mapboxgl.Marker({ color: '#3B82F6' })
        .setLngLat([initialLongitude, initialLatitude])
        .addTo(map.current);
    }

    // Add click listener to map
    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      setCoordinates({ lat, lng });

      // Remove existing marker
      if (marker.current) {
        marker.current.remove();
      }

      // Add new marker
      marker.current = new mapboxgl.Marker({ color: '#3B82F6' })
        .setLngLat([lng, lat])
        .addTo(map.current!);

      // Reverse geocoding to get address
      fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}`)
        .then(response => response.json())
        .then(data => {
          const address = data.features?.[0]?.place_name || '';
          onLocationSelect(lat, lng, address);
        })
        .catch(() => {
          onLocationSelect(lat, lng);
        });
    });

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [isTokenSet, mapboxToken, onLocationSelect, initialLatitude, initialLongitude]);

  const handleTokenSubmit = () => {
    if (mapboxToken.trim()) {
      setIsTokenSet(true);
      toast({
        title: "Mapbox token set",
        description: "You can now select a location on the map.",
      });
    } else {
      toast({
        title: "Invalid token",
        description: "Please enter a valid Mapbox public token.",
        variant: "destructive",
      });
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates({ lat: latitude, lng: longitude });

        if (map.current) {
          map.current.flyTo({
            center: [longitude, latitude],
            zoom: 15
          });

          // Remove existing marker
          if (marker.current) {
            marker.current.remove();
          }

          // Add new marker
          marker.current = new mapboxgl.Marker({ color: '#3B82F6' })
            .setLngLat([longitude, latitude])
            .addTo(map.current);

          // Get address for current location
          fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxToken}`)
            .then(response => response.json())
            .then(data => {
              const address = data.features?.[0]?.place_name || '';
              onLocationSelect(latitude, longitude, address);
            })
            .catch(() => {
              onLocationSelect(latitude, longitude);
            });
        }
      },
      (error) => {
        toast({
          title: "Location access denied",
          description: "Please allow location access or click on the map to select a location.",
          variant: "destructive",
        });
      }
    );
  };

  if (!isTokenSet) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Set Location
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-real-estate-gray">
            To use the location picker, please enter your Mapbox public token. 
            You can get one from <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-real-estate-blue hover:underline">mapbox.com</a>
          </div>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter your Mapbox public token"
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
            />
            <Button onClick={handleTokenSubmit}>Set Token</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Property Location
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 mb-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={getCurrentLocation}
            className="flex items-center gap-2"
          >
            <Locate className="h-4 w-4" />
            Use Current Location
          </Button>
          {coordinates && (
            <div className="text-sm text-real-estate-gray flex items-center">
              Selected: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
            </div>
          )}
        </div>
        <div 
          ref={mapContainer} 
          className="w-full h-64 rounded-lg border border-border" 
        />
        <div className="text-sm text-real-estate-gray">
          Click on the map to pin the exact location of your property, or use "Current Location" to use your GPS coordinates.
        </div>
      </CardContent>
    </Card>
  );
};

export default LocationPicker;