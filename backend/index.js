// backend
import express from 'express';
import neo4j from 'neo4j-driver';
import cors from 'cors';

// configurazione express
const app = express();
app.use(cors());
app.use(express.json());

// connesione a neo4j
const driver = neo4j.driver(
  "bolt://localhost:7687",     // bolt://localhost:7687 per locale
            // bolt://neo4j:7687 se usi Docker con nome servizio "neo4j"
  neo4j.auth.basic("neo4j", "Nov081995")
);

// Rotta di test
app.get("/", (req, res) => res.send("Backend attivo!"));

// Rotta per lettere inviate per persona
app.get("/lettere-per-persona", async (req, res) => {
  const session = driver.session({ database: "neo4j" }); // usa il tuo database
  try {
    const result = await session.run(`
MATCH (d:Document)-[:WRITTEN_BY]->(p:Person)
WITH p, COUNT(d) AS lettere_inviate
WHERE lettere_inviate > 30
RETURN p.name AS persona, lettere_inviate
ORDER BY lettere_inviate DESC;
    `);

    const data = result.records.map(r => ({
      persona: r.get("persona"),
      lettere_inviate: r.get("lettere_inviate").toNumber()
    }));

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore server");
  } finally {
    await session.close();
  }
});

import fetch from "node-fetch";

app.get("/citta-lettere", async (req, res) => {
  const session = driver.session({ database: "neo4j" });

  try {
    const result = await session.run(`
      MATCH (d:Document)-[:WRITTEN_FROM]->(l:Location)
WHERE l.point IS NOT NULL
RETURN 
  l.name AS city,
  COUNT(d) AS lettere,
  l.point.y AS lat,
  l.point.x AS lng
ORDER BY lettere DESC;
    `);

    const data = result.records.map(r => ({
      name: r.get("city"),
      lettere: r.get("lettere").toNumber(),
      lat: r.get("lat"),
      lng: r.get("lng")
    }));

    res.json(data);
  } finally {
    await session.close();
  }
});

app.get("/grafo-persona/:nome", async (req, res) => {
  const session = driver.session({ database: "neo4j" });
  const nome = req.params.nome;

  try {
    const result = await session.run(`
      MATCH (p1:Person {name: $nome})<-[:WRITTEN_BY]-(d:Document)-[:RECEIVED_BY]->(p2:Person)
      RETURN 
        p1.name AS source,
        p2.name AS target,
        COUNT(d) AS weight
      UNION
      MATCH (p2:Person)<-[:WRITTEN_BY]-(d:Document)-[:RECEIVED_BY]->(p1:Person {name: $nome})
      RETURN 
        p2.name AS source,
        p1.name AS target,
        COUNT(d) AS weight
    `, { nome });

    const data = result.records.map(r => ({
      source: r.get("source"),
      target: r.get("target"),
      weight: r.get("weight").toNumber()
    }));

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore server");
  } finally {
    await session.close();
  }
});

// backend/index.js
app.get("/person-list", async (req, res) => {
  const session = driver.session({ database: "neo4j" });
  try {
    const result = await session.run(`
MATCH (p:Person)<-[:WRITTEN_BY]-(d:Document)-[:RECEIVED_BY]->(:Person)
RETURN p.name AS name, COUNT(d) AS lettere_totali
ORDER BY lettere_totali DESC
    `);
    const data = result.records.map(r => r.get("name"));
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore server");
  } finally {
    await session.close();
  }
});

app.get("/lettere-per-anno", async (req, res) => {
  const { field } = req.query;
  const session = driver.session({ database: "neo4j" });

  try {
    // Query dinamica a seconda della presenza di `field`
    const query = field
      ? `
        MATCH (d:Document)-[:WRITTEN_IN_FIELD|TAGGED_WITH]->(f:Field)
        WHERE trim(toLower(f.name)) = trim(toLower($field))
        WITH d, split(d.date, "-")[0] AS annoStr
        WITH d, toInteger(annoStr) AS anno
        WHERE anno IS NOT NULL AND anno > 1400 AND anno < 1800
        RETURN anno, COUNT(d) AS lettere
        ORDER BY anno
      `
      : `
        MATCH (d:Document)
        WITH d, split(d.date, "-")[0] AS annoStr
        WITH d, toInteger(annoStr) AS anno
        WHERE anno IS NOT NULL AND anno > 1400 AND anno < 1800
        RETURN anno, COUNT(d) AS lettere
        ORDER BY anno
      `;


    const result = await session.run(query, { field });

    const data = result.records.map(r => ({
      anno: r.get("anno").toNumber(),   // ✅ FIX fondamentale
      lettere: r.get("lettere").toNumber()
    }));

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore server");
  } finally {
    await session.close();
  }
});

// Rotta per lista campi/tag
app.get("/fields-list", async (req, res) => {
  const session = driver.session({ database: "neo4j" });

  try {
    const result = await session.run(`
MATCH (d:Document)-[:TAGGED_WITH]->(f:Field)
RETURN f.name AS name, COUNT(d) AS lettere
ORDER BY lettere DESC
    `);
    res.json(result.records.map(r => r.get("name")));
  } finally {
    await session.close();
  }
});


app.get("/schema-grafo", async (req, res) => {
  const session = driver.session({ database: "neo4j" });

  try {
    const result = await session.run(`
      MATCH (a)-[r]->(b)
      WHERE 'Person' IN labels(a) OR 'Person' IN labels(b)
      RETURN DISTINCT 
        head(labels(a)) AS from,
        type(r) AS rel,
        head(labels(b)) AS to
      ORDER BY rel
    `);

    // Creiamo una mappa da coppia from-to a array di relazioni
    const map = {};

    result.records.forEach(record => {
      const from = record.get("from");
      const to = record.get("to");
      const rel = record.get("rel");

      const key = `${from},${to}`; // chiave "from,to"

      if (!map[key]) {
        map[key] = [];
      }

      map[key].push(rel);
    });

    res.json(map);
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore server");
  } finally {
    await session.close();
  }
});

app.get("/schema-relazioni", async (req, res) => {
  const session = driver.session();

  try {
    const result = await session.run(`
      MATCH (a)-[:SIMILAR_TO_QUOTED]->(b)
      UNWIND labels(a) AS labelA
      UNWIND labels(b) AS labelB
      RETURN DISTINCT labelA AS fromNodeType, labelB AS toNodeType
    `);

    const nodesSet = new Set();
    const edgesSet = new Set();
    const edges = [];

    result.records.forEach((record) => {
      const from = record.get("fromNodeType");
      const to = record.get("toNodeType");


      nodesSet.add(from);
      nodesSet.add(to);


      const edgeKey = `${from}->${to}`;
      if (!edgesSet.has(edgeKey)) {
        edgesSet.add(edgeKey);
        edges.push({
          from: from,
          to: to
        });
      }
    });

    // formato richiesto
    const nodes = Array.from(nodesSet).map((n) => ({
      id: n,
      label: n
    }));

    res.json({ nodes, edges });

  } catch (err) {
    console.error("Errore Neo4j:", err);
    res.status(500).send(err.message);
  } finally {
    await session.close();
  }
});

app.listen(3001, () => console.log("Server attivo su http://localhost:3001"));