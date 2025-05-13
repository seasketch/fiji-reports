import {
  createMetric,
  Feature,
  FeatureCollection,
  GeoprocessingHandler,
  Metric,
  MultiPolygon,
  Point,
  Polygon,
  Sketch,
  SketchCollection,
  toSketchArray,
} from "@seasketch/geoprocessing";
import landIn from "../../data/bin/land.01.1000000.json" with { type: "json" };
import { booleanDisjoint, point, pointToPolygonDistance } from "@turf/turf";

export async function distanceToShore(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
): Promise<Metric[]> {
  const fijiLand = landIn as FeatureCollection<Polygon>;

  const sketchArray = toSketchArray(sketch);

  const metrics: Metric[] = sketchArray.map((sk) => {
    const dist = (() => {
      // If sketch touches land, distance 0
      for (const landPoly of fijiLand.features) {
        if (!booleanDisjoint(sk, landPoly)) return 0;
      }

      // Extract vertices from sketch
      const pts: Feature<Point>[] = [];
      const coordSets =
        sk.geometry.type === "Polygon"
          ? [sk.geometry.coordinates]
          : sk.geometry.coordinates;
      for (const poly of coordSets) {
        for (const ring of poly) {
          for (const coord of ring) pts.push(point(coord));
        }
      }

      // Calculate distance to land for each point
      let min = Infinity;
      for (const pt of pts) {
        for (const poly of fijiLand.features) {
          const d = pointToPolygonDistance(pt, poly, { units: "kilometers" });
          if (d < min) min = d;
          if (min === 0) return 0;
        }
      }

      return min === Infinity ? -1 : min;
    })();

    return createMetric({
      metricId: "distanceToShore",
      sketchId: sk.properties.id,
      value: dist,
      extra: {
        sketchName: sk.properties.name,
      },
    });
  });

  return metrics;
}

export default new GeoprocessingHandler(distanceToShore, {
  title: "distanceToShore",
  description: "distanceToShore",
  timeout: 500, // seconds
  memory: 2048, // megabytes
  executionMode: "async",
  // Specify any Sketch Class form attributes that are required
  requiresProperties: [],
  workers: [],
});
