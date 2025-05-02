import graphlib from "graphlib";
import fs from "fs-extra";
import * as path from "path";
import {
  booleanIntersects,
  buffer,
  distance,
  lineString,
  multiPolygon,
  polygon,
} from "@turf/turf";
import {
  FeatureCollection,
  isFeatureCollection,
  Polygon,
} from "@seasketch/geoprocessing/client-core";
import coast from "./land.01.1000000.json" with { type: "json" };

// Setup directories and paths
const dataDir = "./data/bin";
const fullPath = (s: string) => path.join(dataDir, s);
const landShrunkOut = fullPath("landShrunk.01.json");
const jsonOut = fullPath("network.01.json");

// Extract vertices from polygons
export function extractVerticesFromPolygon(
  polygon: any,
  featureIndex: number,
  vertices: Map<string, number[]>,
): void {
  polygon.forEach((ring: any, ringIndex: number) => {
    ring.forEach((coord: [number, number], vertexIndex: number) => {
      const id = `node_${featureIndex}_${ringIndex}_${vertexIndex}`;
      vertices.set(id, coord);
    });
  });
}

// Create graph with vertices
function createGraph(watersData: any): graphlib.Graph {
  const G = new graphlib.Graph();
  const vertices: Map<string, number[]> = new Map();

  watersData.features.forEach((feature: any, featureIndex: number) => {
    if (feature.geometry.type === "Polygon") {
      extractVerticesFromPolygon(
        feature.geometry.coordinates,
        featureIndex,
        vertices,
      );
    } else if (feature.geometry.type === "MultiPolygon") {
      feature.geometry.coordinates.forEach((polygon: any) => {
        extractVerticesFromPolygon(polygon, featureIndex, vertices);
      });
    }
  });

  vertices.forEach((coord, id) => {
    G.setNode(id, coord);
  });

  return G;
}

// Check if a line between two coordinates is clear of land
export function isLineClear(
  coord1: number[],
  coord2: number[],
  landData: any,
): boolean {
  const line = lineString([coord1, coord2]);

  for (const feature of landData.features) {
    if (feature.geometry.type === "Polygon") {
      const poly = polygon(feature.geometry.coordinates);
      if (booleanIntersects(line, poly)) {
        return false;
      }
    } else if (feature.geometry.type === "MultiPolygon") {
      const multiPoly = multiPolygon(feature.geometry.coordinates);
      if (booleanIntersects(line, multiPoly)) {
        return false;
      }
    }
  }

  return true;
}

// Add ocean edges to the graph
async function addOceanEdgesComplete(
  graph: graphlib.Graph,
  landData: any,
  verbose: boolean,
): Promise<graphlib.Graph> {
  const t0 = Date.now();
  if (verbose) {
    console.log(
      `Starting at ${new Date().toISOString()} to add edges for ${graph.nodeCount()} nodes.`,
    );
    console.log(
      `We'll have to look at somewhere around ${(graph.nodeCount() * (graph.nodeCount() - 1)) / 2} edge possibilities.`,
    );
  }

  let nodes = graph.nodes();
  const edgePromises = [];

  while (nodes.length > 0) {
    const node = nodes.shift() as string;
    const nodeCoord = graph.node(node);

    if (!nodeCoord) {
      console.error(`Node ${node} does not have coordinates.`);
      continue;
    }

    edgePromises.push(
      new Promise<void>((resolve) => {
        nodes.forEach((otherNode: string) => {
          const otherNodeCoord = graph.node(otherNode);

          if (!otherNodeCoord) {
            console.error(`Other node ${otherNode} does not have coordinates.`);
            return;
          }

          const dist = distance(nodeCoord, otherNodeCoord, {
            units: "kilometers",
          });

          if (isLineClear(nodeCoord, otherNodeCoord, landData)) {
            graph.setEdge(node, otherNode, dist);
            graph.setEdge(otherNode, node, dist);
          }
        });

        if (verbose && nodes.length % 10 === 0) {
          console.log(`Remaining nodes: ${nodes.length}`);
        }

        resolve();
      }),
    );
  }

  await Promise.all(edgePromises);

  if (verbose) {
    console.log(
      `It took ${(Date.now() - t0) / 60000} minutes to load ${graph.edgeCount()} edges.`,
    );
  }

  return graph;
}

// Main function to generate the graph and save it
async function main() {
  if (!isFeatureCollection(coast))
    throw new Error("Expected a FeatureCollection");
  const land = buffer(coast as FeatureCollection<Polygon>, -0.01);
  fs.writeFileSync(landShrunkOut, JSON.stringify(land));
  let graph = createGraph(coast);
  graph = await addOceanEdgesComplete(graph, land, true);
  fs.writeFileSync(jsonOut, JSON.stringify(graphlib.json.write(graph)));
}

main().catch(console.error);
