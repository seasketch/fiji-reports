import {
  Sketch,
  SketchCollection,
  Polygon,
  MultiPolygon,
  GeoprocessingHandler,
  booleanOverlap,
  isSketch,
} from "@seasketch/geoprocessing";
import {
  Feature,
  FeatureCollection,
  LineString,
  toSketchArray,
} from "@seasketch/geoprocessing/client-core";
import graphlib from "graphlib";
import graphFile from "../../data/bin/network.01.json" with { type: "json" };
import landFile from "../../data/bin/landShrunk.01.json" with { type: "json" };
import {
  bboxPolygon,
  bbox,
  featureCollection,
  point,
  simplify,
  centroid,
  distance,
  lineString,
  polygon,
  booleanIntersects,
  multiPolygon,
} from "@turf/turf";

// Spacing function calculates distance between habitat replicates
export async function connectivity(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
): Promise<{
  sketch: Sketch<Polygon | MultiPolygon>[];
  paths: {
    path: Feature<LineString>;
    distance: number;
  }[];
}> {
  console.log(sketch.properties.name);
  if (isSketch(sketch)) return { sketch: [sketch], paths: [] };

  const sketchArray = toSketchArray(sketch);

  // Load graph from file
  const graph = graphlib.json.read(graphFile);

  // Adds sketches to the graph and calculates distances
  const finalGraph = await addSketchesToGraph(sketch, graph);

  // Calculate centroids of sketches for MST
  const sketchCentroids = sketchArray.map((sketch) => ({
    sketch,
    id: sketch.properties!.id as string,
    centroid: centroid(sketch!).geometry.coordinates as [number, number],
  }));

  // Create a graph for the MST
  const mstGraph = new graphlib.Graph();
  sketchCentroids.forEach((sketch) => {
    mstGraph.setNode(sketch.id, sketch.centroid);
  });
  await Promise.all(
    sketchCentroids.map((sourceSketch, i) =>
      sketchCentroids.slice(i + 1).map(async (targetSketch) => {
        const dist = distance(
          point(sourceSketch.centroid),
          point(targetSketch.centroid),
        );
        mstGraph.setEdge(sourceSketch.id, targetSketch.id, dist);
        mstGraph.setEdge(targetSketch.id, sourceSketch.id, dist);
      }),
    ),
  );
  const mst = graphlib.alg.prim(mstGraph, (edge) => mstGraph.edge(edge));

  const paths: {
    path: Feature<LineString>;
    distance: number;
  }[] = [];

  // Iterate over MST edges and calculate paths between replicates
  await Promise.all(
    mst.edges().map(async (edge) => {
      const sourceSketch = sketchCentroids.find((s) => s.id === edge.v);
      const targetSketch = sketchCentroids.find((s) => s.id === edge.w);

      if (sourceSketch && targetSketch) {
        const { path, totalDistance } = findShortestPath(
          finalGraph.graph,
          sourceSketch.sketch,
          targetSketch.sketch,
          finalGraph.sketchNodes,
        );

        const nodes = path.map(
          (node) => finalGraph.graph.node(node) as [number, number],
        );
        paths.push({
          path: lineString(nodes),
          distance: totalDistance,
        });
      }
    }),
  );

  return {
    sketch: sketchArray.map((sketch) => simplify(sketch, { tolerance: 0.005 })),
    paths,
  };
}

// Add sketches to the graph
async function addSketchesToGraph(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
  graph: graphlib.Graph,
): Promise<{
  graph: graphlib.Graph;
  sketchNodes: Record<string, string[]>;
}> {
  const sketchesSimplified = toSketchArray(sketch).map((sk) =>
    simplify(sk, { tolerance: 0.005 }),
  );

  // Only land features that overlap with the sketch
  const land = featureCollection(
    (landFile as FeatureCollection).features.filter((land) =>
      booleanOverlap(bboxPolygon(bbox(land)), bboxPolygon(bbox(sketch))),
    ),
  );

  // Add each sketch node to the graph
  const sketchNodes: Record<string, string[]> = {};
  const allNodes: { node: string; coord: number[]; sketchId: any }[] = [];
  sketchesSimplified.forEach((sketch, sketchIndex) => {
    const vertices: Map<string, number[]> = new Map();

    // Extract exterior ring vertices
    if (sketch.geometry.type === "Polygon") {
      extractVerticesFromPolygon(
        sketch.geometry.coordinates,
        sketchIndex,
        vertices,
      );
    } else if (sketch.geometry.type === "MultiPolygon") {
      sketch.geometry.coordinates.forEach((polygon: any) => {
        extractVerticesFromPolygon(polygon, sketchIndex, vertices);
      });
    }
    sketchNodes[sketch.properties.id] = Array.from(vertices.keys());

    // Add nodes to graph
    vertices.forEach((coord, node) => {
      allNodes.push({ node, coord, sketchId: sketch.properties.id });
      graph.setNode(node, coord);
    });
  });

  // Create edges between nodes
  const edges: { node1: string; node2: string; dist: number }[] = [];

  // First, connect sketches directly
  allNodes.forEach((node1) => {
    const v1Coord = graph.node(node1.node);
    allNodes.forEach((node2) => {
      if (node1.sketchId === node2.sketchId) return; // Don't connect intra-sketch nodes
      const v2Coord = graph.node(node2.node);
      if (!v2Coord) {
        console.error(`Other node ${v2Coord} does not have coordinates.`);
        return;
      }
      const dist = distance(v1Coord, v2Coord, { units: "kilometers" });
      if (isLineClear(v1Coord, v2Coord, land) || dist < 0.5) {
        edges.push({ node1: node1.node, node2: node2.node, dist });
      }
    });
  });
  console.log("Directly connected sketches with", edges.length, "edges");

  // Then, connect with wider graph
  allNodes.forEach((node1) => {
    const node1Coord = graph.node(node1.node);
    if (!node1Coord) throw new Error(`Node ${node1.node} w/o coordinates`);

    graph.nodes().forEach((node2) => {
      const node2Coord = graph.node(node2);

      const dist = distance(node1Coord, node2Coord, { units: "kilometers" });
      if (isLineClear(node1Coord, node2Coord, land) || dist < 0.5) {
        edges.push({ node1: node1.node, node2: node2, dist });
        edges.push({ node1: node2, node2: node1.node, dist });
      }
    });
  });

  edges.forEach((edge) => graph.setEdge(edge.node1, edge.node2, edge.dist));

  console.log("Connected sketches to graph with", edges.length, "edges total");

  return {
    graph,
    sketchNodes,
  };
}

// Extract exterior vertices
function extractVerticesFromPolygon(
  polygon: any,
  featureIndex: number,
  vertices: Map<string, number[]>,
): void {
  const exteriorRing = polygon[0];
  exteriorRing.forEach((coord: [number, number], vertexIndex: number) => {
    const id = `polynode_${featureIndex}_0_${vertexIndex}`;
    vertices.set(id, coord);
  });
}

// Find the shortest path between two sketches
function findShortestPath(
  graph: graphlib.Graph,
  currentSketch: Sketch<Polygon | MultiPolygon>,
  nextSketch: Sketch<Polygon | MultiPolygon>,
  sketchNodes: Record<string, string[]>,
): {
  path: string[];
  totalDistance: number;
  possibleNodes: string[];
} {
  const nodes0 = sketchNodes[currentSketch.properties.id];
  const nodes1 = sketchNodes[nextSketch.properties.id];

  if (nodes0.length === 0 || nodes1.length === 0)
    throw new Error("No valid nodes found within one or both sketches.");

  let shortestPath: string[] = [];
  let minTotalDistance = Infinity;

  // Iterate over all nodes in nodes0
  nodes0.forEach((node0) => {
    // Run Dijkstra's algorithm for node0
    const pathResults = graphlib.alg.dijkstra(graph, node0, (edge) =>
      graph.edge(edge),
    );

    // Check the distance to each node in nodes1
    nodes1.forEach((node1) => {
      if (node0 === node1) {
        // Early exit if nodes are the same (sketches are touching)
        return {
          path: [node0],
          edges: [],
          totalDistance: 0,
          possibleNodes: nodes0.concat(nodes1),
        };
      }

      const resultNode = pathResults[node1];

      // If no path to node1, skip
      if (!resultNode || !resultNode.predecessor) {
        return;
      }

      const totalDistance = resultNode.distance;

      if (totalDistance < minTotalDistance) {
        minTotalDistance = totalDistance;

        // Reconstruct the shortest path and edges
        const tempPath: string[] = [];
        let currentNode = node1;

        while (currentNode !== node0) {
          const predecessor = pathResults[currentNode].predecessor;
          tempPath.unshift(currentNode);
          currentNode = predecessor;
        }

        tempPath.unshift(node0); // Add the starting node

        shortestPath = tempPath;
      }
    });
  });

  if (minTotalDistance === Infinity)
    throw new Error(
      `No path found between ${currentSketch.properties.name} and ${nextSketch.properties.name}`,
    );

  return {
    path: shortestPath,
    totalDistance: minTotalDistance,
    possibleNodes: nodes0.concat(nodes1),
  };
}

// Check if a line between two coordinates is clear of land
function isLineClear(
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

export default new GeoprocessingHandler(connectivity, {
  title: "connectivity",
  description: "connectivity",
  timeout: 500, // seconds
  memory: 2048, // megabytes
  executionMode: "async",
  // Specify any Sketch Class form attributes that are required
  requiresProperties: [],
  workers: ["spacingGraphWorker"],
});
