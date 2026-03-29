// src/GrafoPersone.jsx
import React, { useEffect, useState } from "react";
import ReactFlow, { Background, Controls } from "reactflow";
import "reactflow/dist/style.css";

export default function GrafoPersone() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [persona, setPersona] = useState(null);
  const [personeDisponibili, setPersoneDisponibili] = useState([]);

  // 🔹 Carica lista persone
  useEffect(() => {
    fetch("http://localhost:3001/person-list")
      .then(res => res.json())
      .then(setPersoneDisponibili)
      .catch(err => console.error(err));
  }, []);

  // 🔹 Carica grafo per persona selezionata
  useEffect(() => {
    if (!persona) return;

    fetch(`http://localhost:3001/grafo-persona/${encodeURIComponent(persona)}`)
      .then(res => res.json())
      .then(data => {
        const nodesMap = {};
        const edgesArray = [];

        // 🔹 Creazione nodi e archi
        data.forEach((d, i) => {
          const sizeSource = Math.min(120, 80 + (d.sourceWeight || 1) * 2); // dimensione proporzionale lettere
          const sizeTarget = Math.min(120, 80 + (d.targetWeight || 1) * 2);

          if (!nodesMap[d.source]) {
            nodesMap[d.source] = {
              id: d.source,
              data: { label: d.source },
              style: {
                width: sizeSource,
                height: sizeSource,
                borderRadius: "50%",
                background: d.source === persona ? "red" : "#1f77b4",
                color: "white",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center",
                padding: "5px",
              }
            };
          }

          if (!nodesMap[d.target]) {
            nodesMap[d.target] = {
              id: d.target,
              data: { label: d.target },
              style: {
                width: sizeTarget,
                height: sizeTarget,
                borderRadius: "50%",
                background: d.target === persona ? "red" : "#1f77b4",
                color: "white",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center",
                padding: "5px",
              }
            };
          }

          edgesArray.push({
            id: `e-${i}`,
            source: d.source,
            target: d.target,
            label: `${d.weight} lettere`,
            animated: d.weight > 10
          });
        });

        // 🔹 Layout circolare dinamico
        const nodeKeys = Object.keys(nodesMap).filter(k => k !== persona);
        const total = nodeKeys.length;
        const radius = Math.max(200, total * 15);
        const center = { x: 400, y: 300 };

        nodeKeys.forEach((key, i) => {
          const angle = (i / total) * 2 * Math.PI;
          nodesMap[key].position = {
            x: center.x + radius * Math.cos(angle),
            y: center.y + radius * Math.sin(angle)
          };
        });

        if (nodesMap[persona]) {
          nodesMap[persona].position = center; // nodo centrale
        }

        setNodes(Object.values(nodesMap));
        setEdges(edgesArray);
      })
      .catch(err => console.error(err));
  }, [persona]);

  return (
    <div>
      <h2>Seleziona una persona</h2>

      {/* 🔹 Bottoni per selezione */}
      <div style={{ marginBottom: "20px" }}>
        {personeDisponibili.map((p, i) => (
          <button
            key={i}
            onClick={() => setPersona(p)}
            style={{
              margin: "5px",
              padding: "5px 10px",
              backgroundColor: p === persona ? "red" : "#1f77b4",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* 🔹 Grafo */}
      {persona && (
        <div style={{ height: "700px", width: "100%", border: "1px solid black" }}>
          <ReactFlow nodes={nodes} edges={edges} fitView>
            <Background />
            <Controls />
          </ReactFlow>
        </div>
      )}
    </div>
  );
}