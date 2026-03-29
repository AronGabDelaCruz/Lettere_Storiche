import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ✅ FIX icone leaflet (problema quadrato)
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png"
});

// ✅ dimensione marker dinamica
const getSize = (n) => {
  return Math.max(20, Math.min(60, n));
};

// ✅ icona personalizzata (cerchio)
const customIcon = (size) =>
  L.divIcon({
    html: `<div style="
      background: red;
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      opacity: 0.6;
      border: 2px solid white;
    "></div>`,
    className: ""
  });

export default function GraficoMappa() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3001/citta-lettere")
      .then(res => res.json())
      .then(data => {
        console.log(data); // 🔍 debug
        setData(data);
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <MapContainer
      center={[45, 10]}
      zoom={4}
      style={{ height: "600px", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* ✅ marker */}
      {data
        .filter(c => c && c.lat && c.lng) // evita errori
        .map((c, i) => (
          <Marker
            key={i}
            position={[c.lat, c.lng]}
            icon={customIcon(getSize(c.lettere))}
          >
            <Popup>
              <strong>{c.name}</strong><br />
              📩 {c.lettere} lettere
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}