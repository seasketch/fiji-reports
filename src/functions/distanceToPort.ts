import {
  Sketch,
  SketchCollection,
  Polygon,
  MultiPolygon,
  GeoprocessingHandler,
  booleanOverlap,
  Point,
} from "@seasketch/geoprocessing";
import {
  Feature,
  FeatureCollection,
  toSketchArray,
} from "@seasketch/geoprocessing/client-core";
import graphlib from "graphlib";
import graphFile from "../../data/bin/network.01.json" with { type: "json" };
import landFile from "../../data/bin/landShrunk.01.json" with { type: "json" };
import ports from "./ports.json" with { type: "json" };
import {
  bboxPolygon,
  bbox,
  featureCollection,
  simplify,
  distance,
  lineString,
  polygon,
  booleanIntersects,
  multiPolygon,
} from "@turf/turf";

// Normalize longitude to handle antimeridian crossing - same as in pyriv.ts
function normalizeLongitude(coord: number[]): number[] {
  let lon = coord[0];
  if (lon < -160) {
    lon += 360;
  }
  return [lon, coord[1]];
}

// Normalize sketch coordinates
function normalizeSketch(sketch: Sketch<Polygon | MultiPolygon>): Sketch<Polygon | MultiPolygon> {
  if (sketch.geometry.type === "Polygon") {
    return {
      ...sketch,
      geometry: {
        ...sketch.geometry,
        coordinates: sketch.geometry.coordinates.map(ring =>
          ring.map(coord => normalizeLongitude(coord))
        )
      }
    };
  } else { // MultiPolygon
    return {
      ...sketch,
      geometry: {
        ...sketch.geometry,
        coordinates: sketch.geometry.coordinates.map(poly =>
          poly.map(ring =>
            ring.map(coord => normalizeLongitude(coord))
          )
        )
      }
    };
  }
}

// Define the function to calculate the distance to the nearest port
export async function distanceToPort(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
): Promise<{
  sketch: Sketch<Polygon | MultiPolygon>[];
  portDistances: {
    sketchId: string;
    distance: number;
    port: string;
    path: any;
  }[]; // Store sketchId and the min distance to a port
}> {
  console.log(sketch.properties.name);

  // Normalize sketch coordinates
  const sketchArray = toSketchArray(sketch).map(sk => normalizeSketch(sk));

  // Load the graph
  const graph = graphlib.json.read(graphFile);

  // Adds sketches to the graph and calculates distances
  const finalGraph = await addSketchesToGraph(
    sketchArray,
    graph,
    (ports as FeatureCollection<Point>).features,
  );

  const portDistances: {
    sketchId: string;
    distance: number;
    port: string;
    path: any;
  }[] = [];

  // Calculate shortest path from each sketch to the closest port
  await Promise.all(
    sketchArray.map(async (sketch) => {
      let minDist = Infinity;
      let closestPort = null;
      let closestPath = null;

      // Iterate over all ports to find the closest one using findShortestPath
      for (const port of (ports as FeatureCollection<Point>).features) {
        console.log(
          `Finding shortest path from ${sketch.properties.name} to port ${port.properties?.PORT_NAME}`,
        );
        const { path, totalDistance } = findShortestPath(
          finalGraph.graph,
          sketch,
          port,
          finalGraph.sketchNodes,
        );
        console.log(`Shortest distance: ${totalDistance}`);

        if (totalDistance < minDist) {
          minDist = totalDistance;
          closestPort = port;

          const nodes = path.map(
            (node) => finalGraph.graph.node(node) as [number, number],
          );
          closestPath = lineString(nodes);
        }
      }

      // Store the distance to the closest port
      portDistances.push({
        sketchId: sketch.properties.id as string,
        port: closestPort?.properties?.PORT_NAME,
        path: closestPath,
        distance: minDist,
      });
    }),
  );

  return {
    sketch: sketchArray.map((sketch) => simplify(sketch, { tolerance: 0.005 })),
    portDistances,
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

async function addSketchesToGraph(
  sketches: Sketch<Polygon | MultiPolygon>[],
  graph: graphlib.Graph,
  ports: Feature<Point>[], // Ports as an array of points
): Promise<{
  graph: graphlib.Graph;
  sketchNodes: Record<string, string[]>;
}> {
  const sketchesSimplified = sketches.map((sk) =>
    simplify(sk, { tolerance: 0.005 }),
  );

  const land = featureCollection(
    (landFile as FeatureCollection).features.filter((land) =>
      booleanOverlap(bboxPolygon(bbox(land)), bboxPolygon(bbox(featureCollection(sketches)))),
    ),
  );

  const sketchNodes: Record<string, string[]> = {};
  const allNodes: { node: string; coord: number[]; sketchId: any }[] = [];

  // Add sketches as nodes to the graph
  sketchesSimplified.forEach((sketch, sketchIndex) => {
    const vertices: Map<string, number[]> = new Map();
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
    vertices.forEach((coord, node) => {
      allNodes.push({ node, coord, sketchId: sketch.properties.id });
      graph.setNode(node, coord);
    });
  });

  // Create edges between nodes
  const edges: { node1: string; node2: string; dist: number }[] = [];

  // Then, connect with wider graph
  allNodes.forEach((node1) => {
    const node1Coord = graph.node(node1.node);
    if (!node1Coord) throw new Error(`Node ${node1.node} w/o coordinates`);

    graph.nodes().forEach((node2) => {
      const node2Coord = graph.node(node2);

      const dist = distance(node1Coord, node2Coord, { units: "kilometers" });
      if (isLineClear(node1Coord, node2Coord, land)) {
        edges.push({ node1: node1.node, node2: node2, dist });
        edges.push({ node1: node2, node2: node1.node, dist });
      }
    });
  });

  edges.forEach((edge) => graph.setEdge(edge.node1, edge.node2, edge.dist));

  // Add ports as nodes to the graph
  ports.forEach((port) => {
    const portNodeId = `port_${port.properties?.PORT_NAME}`;
    const portCoord = port.geometry.coordinates as [number, number];
    graph.setNode(portNodeId, portCoord);
  });

  // Create edges between sketches and ports based on minimum distance (avoiding land)
  graph.nodes().forEach((node1) => {
    const v1Coord = graph.node(node1);
    ports.forEach((port) => {
      const portNodeId = `port_${port.properties?.PORT_NAME}`;
      const portCoord = graph.node(portNodeId);

      const dist = distance(v1Coord, portCoord, { units: "kilometers" });
      if (isLineClear(v1Coord, portCoord, land)) {
        graph.setEdge(node1, portNodeId, dist);
        graph.setEdge(portNodeId, node1, dist);
      }
    });
  });

  return {
    graph,
    sketchNodes,
  };
}

// Modified findShortestPath to handle port node input
function findShortestPath(
  graph: graphlib.Graph,
  currentSketch: Sketch<Polygon | MultiPolygon>,
  port: Feature<Point>, // Port as the target point
  sketchNodes: Record<string, string[]>,
): {
  path: string[];
  totalDistance: number;
} {
  const nodes0 = sketchNodes[currentSketch.properties.id];
  const portNodeId = `port_${port.properties?.PORT_NAME}`;

  if (nodes0.length === 0 || !graph.node(portNodeId)) {
    throw new Error("No valid nodes found or port missing.");
  }

  let shortestPath: string[] = [];
  let minTotalDistance = Infinity;

  nodes0.forEach((node0) => {
    const pathResults = graphlib.alg.dijkstra(graph, node0, (edge) =>
      graph.edge(edge),
    );

    const resultNode = pathResults[portNodeId];

    if (!resultNode || !resultNode.predecessor) {
      return;
    }

    const totalDistance = resultNode.distance;

    if (totalDistance < minTotalDistance) {
      minTotalDistance = totalDistance;
      const tempPath: string[] = [];
      let currentNode = portNodeId;

      while (currentNode !== node0) {
        const predecessor = pathResults[currentNode].predecessor;
        tempPath.unshift(currentNode);
        currentNode = predecessor;
      }
      tempPath.unshift(node0); // Add the starting node
      shortestPath = tempPath;
    }
  });

  return {
    path: shortestPath,
    totalDistance: minTotalDistance,
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

export default new GeoprocessingHandler(distanceToPort, {
  title: "distanceToPort",
  description: "distanceToPort",
  timeout: 500, // seconds
  memory: 2048, // megabytes
  executionMode: "async",
  // Specify any Sketch Class form attributes that are required
  requiresProperties: [],
  workers: [],
});
