import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function LocationMarker({ position, setPosition, disabled }: { position: L.LatLng | null, setPosition: (pos: L.LatLng) => void, disabled?: boolean }) {
  const map = useMapEvents({
    click(e) {
      if (disabled) return;
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

interface LocationPickerProps {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
  disabled?: boolean;
}

export function LocationPicker({ lat, lng, onChange, disabled }: LocationPickerProps) {
  const [position, setPosition] = useState<L.LatLng | null>(
    lat && lng ? new L.LatLng(lat, lng) : null
  );

  const defaultCenter = new L.LatLng(-28.4695, -65.7795); // Plaza Principal San Fernando del Valle de Catamarca

  const handleSetPosition = (pos: L.LatLng) => {
    if (disabled) return;
    setPosition(pos);
    onChange(pos.lat, pos.lng);
  };

  return (
    <div className={`h-[250px] w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 relative z-0 ${disabled ? 'opacity-70 pointer-events-none' : ''}`}>
      <MapContainer 
        center={position || defaultCenter} 
        zoom={position ? 15 : 10} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={position} setPosition={handleSetPosition} disabled={disabled} />
      </MapContainer>
    </div>
  );
}
