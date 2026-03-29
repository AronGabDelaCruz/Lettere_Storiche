import React, { useEffect, useState } from "react";
import ReactFlow, { ReactFlowProvider } from "reactflow";
import "reactflow/dist/style.css";

// ---- La tua funzione di trasformazione ----
const transformToGraph = (data) => {
  if (!data || Object.keys(data).length === 0) return { nodes: [], edges: [] };

  const nodesMap = new Map();
  const edges = [];

  const mainNodeId = Object.keys(data)[0].split(",")[0]; // primo nodo come centrale

  Object.entries(data).forEach(([key, rels], index) => {
    const [from, to] = key.split(",");

    // nodi
    if (!nodesMap.has(from)) {
      nodesMap.set(from, {
        id: from,
        data: { label: from },
        style: {
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: from === mainNodeId ? "red" : "#1f77b4",
          color: "white",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          padding: "5px"
        }
      });
    }
    if (!nodesMap.has(to)) {
      nodesMap.set(to, {
        id: to,
        data: { label: to },
        style: {
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: to === mainNodeId ? "red" : "#1f77b4",
          color: "white",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          padding: "5px"
        }
      });
    }

    // edges
    edges.push({
      id: `e${index}`,
      source: from,
      target: to,
      label: rels,
      style: { strokeWidth: 2 },
    });
  });

  // layout circolare
  const nodeKeys = Array.from(nodesMap.keys()).filter(k => k !== mainNodeId);
  const total = nodeKeys.length;
  const radius = Math.max(200, total * 30);
  const center = { x: 400, y: 300 };

  nodeKeys.forEach((key, i) => {
    const angle = (i / total) * 2 * Math.PI;
    nodesMap.get(key).position = {
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle)
    };
  });

  nodesMap.get(mainNodeId).position = center;

  return {
    nodes: Array.from(nodesMap.values()),
    edges
  };
};

// ---- Componente ReactFlow completo ----
const SchemaGraph = () => {
  const [elements, setElements] = useState({ nodes: [], edges: [] });

  useEffect(() => {
    fetch("http://localhost:3001/schema-grafo")
      .then(res => res.json())
      .then(data => {
        console.log("Dati dal server:", data); 
        setElements(transformToGraph(data));
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div style={{ width: "100%", height: "600px" }}>
      <ReactFlowProvider>
        <ReactFlow
          nodes={elements.nodes}
          edges={elements.edges}
          fitView
          nodesDraggable={true}
          nodesConnectable={false}
          panOnScroll={true}
        />
      </ReactFlowProvider>
    </div>
  );
};

export default SchemaGraph;