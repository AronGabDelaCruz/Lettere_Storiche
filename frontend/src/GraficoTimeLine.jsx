// src/GraficoTimeline.jsx
import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function GraficoTimeline() {
  const [data, setData] = useState([]);
  const [fields, setFields] = useState([]);
  const [selectedField, setSelectedField] = useState(null);

  // 🔹 Carica lista campi/tag
  useEffect(() => {
    fetch("http://localhost:3001/fields-list")
      .then(res => res.json())
      .then(setFields)
      .catch(err => console.error(err));
  }, []);

  // 🔹 Carica dati lettere per anno
  useEffect(() => {
    const url = selectedField
      ? `http://localhost:3001/lettere-per-anno?field=${encodeURIComponent(selectedField)}`
      : "http://localhost:3001/lettere-per-anno";

    fetch(url)
      .then(res => res.json())
      .then(rawData => {
  const start = 1645;
  const end = 1680;

  // crea mappa anno → lettere
  const map = {};
  rawData.forEach(d => {
    map[d.anno] = d.lettere;
  });

  // riempi tutti gli anni
  const fullData = [];
  for (let year = start; year <= end; year++) {
    fullData.push({
      anno: year,
      lettere: map[year] || 0
    });
  }

  setData(fullData);
})
      .catch(err => console.error(err));
  }, [selectedField]);

  return (
    <div>
      <h2>Lettere per anno</h2>

      {/* 🔹 Bottoni filtro per campo/tag */}
      <div style={{ marginBottom: "20px" }}>
        {fields.map((f, i) => (
          <button
            key={i}
            onClick={() => setSelectedField(f)}
            style={{
              margin: "5px",
              padding: "5px 10px",
              backgroundColor: f === selectedField ? "red" : "#1f77b4",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* 🔹 Grafico a barre */}
      <BarChart
        width={800}
        height={400}
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="anno" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="lettere" fill="#82ca9d" />
      </BarChart>
    </div>
  );
}