import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';

interface RoomLocationMapProps {
  latitude: number;
  longitude: number;
  title: string;
  area: string;
  city: string;
}

const RoomLocationMap = ({ latitude, longitude, title, area, city }: RoomLocationMapProps) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <MapContainer
        center={[latitude, longitude]}
        zoom={15}
        scrollWheelZoom={false}
        className="h-[320px] w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CircleMarker center={[latitude, longitude]} radius={10} pathOptions={{ color: '#00c2ff', fillColor: '#00c2ff', fillOpacity: 0.9 }}>
          <Popup>
            <div className="space-y-1">
              <p className="font-semibold">{title}</p>
              <p className="text-sm">{area}, {city}</p>
            </div>
          </Popup>
        </CircleMarker>
      </MapContainer>
      <div className="flex items-center justify-between gap-3 bg-secondary px-4 py-3 text-xs text-muted-foreground">
        <span>Location: {area}, {city} ({latitude.toFixed(4)}, {longitude.toFixed(4)})</span>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`}
          target="_blank"
          rel="noreferrer"
          className="text-primary hover:underline"
        >
          Open in Maps
        </a>
      </div>
    </div>
  );
};

export default RoomLocationMap;
