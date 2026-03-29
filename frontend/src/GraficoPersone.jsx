import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function GraficoLettere() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3001/lettere-per-persona")
      .then(res => res.json())
      .then(setData)
      .catch(err => console.error(err));
  }, []);

  // Componente personalizzato per tick verticale
  const CustomizedAxisTick = ({ x, y, payload }) => {
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={16} textAnchor="end" transform="rotate(-90)">
          {payload.value}
        </text>
      </g>
    );
  };

  return (
    <BarChart
      width={Math.max(800, data.length * 50)} // aumenta larghezza se tanti nomi
      height={400}
      data={data}
      margin={{ top: 20, right: 30, left: 20, bottom: 100 }} // spazio per etichette
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis
        dataKey="persona"
        interval={0} // mostra tutte le etichette
        tick={<CustomizedAxisTick />} // verticale
        height={100} // spazio sotto per le etichette
      />
      <YAxis />
      <Tooltip />
      <Bar dataKey="lettere_inviate" fill="#82ca9d" />
    </BarChart>
  );
}