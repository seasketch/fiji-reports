import {
  Sketch,
  SketchCollection,
  Polygon,
  MultiPolygon,
  GeoprocessingHandler,
  Feature,
  loadFgb,
} from "@seasketch/geoprocessing";
import project from "../../project/projectClient.js";
import { Point, toSketchArray } from "@seasketch/geoprocessing/client-core";
import { bbox, booleanPointInPolygon } from "@turf/turf";
import { splitSketchAntimeridian } from "../util/antimeridian.js";

interface Pt {
  id: string;
  [key: string]: string | number;
}

/**
 * Overlap with invertebrate presence expedition data
 */
export async function invertPresence(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
): Promise<Pt[]> {
  const splitSketch = splitSketchAntimeridian(sketch);
  const sketchArray = toSketchArray(splitSketch);

  const metricGroup = project.getMetricGroup("invertPresence");

  const ds = project.getMetricGroupDatasource(metricGroup);
  const url = project.getDatasourceUrl(ds);
  const features = ((await loadFgb(url)) as Feature<Point, Pt>[]).filter(
    (feature) =>
      sketchArray.some((sk) =>
        booleanPointInPolygon(feature.geometry, sk.geometry),
      ),
  );

  console.log(features);

  // Overall presence
  const overall: Pt = { id: "total" };
  metricGroup.classes.forEach((curClass) => {
    overall[curClass.classId] = features.some(
      (f) => f.properties[curClass.classId] === "present",
    )
      ? "true"
      : "false";
  });

  // Per province
  const provinceRows: Pt[] = features.map((feature) => {
    const row: Pt = { id: `province:${feature.properties.province}` };
    metricGroup.classes.forEach((curClass) => {
      row[curClass.classId] =
        feature.properties[curClass.classId] === "present" ? "true" : "false";
    });
    return row;
  });

  // Per sketch
  let sketchRows: Pt[] = [];
  if (sketch.type === "FeatureCollection" && Array.isArray(sketch.features)) {
    sketchRows = sketch.features.map((sk) => {
      const sketchId =
        sk.properties?.name || sk.properties?.id || "unknown_sketch";
      // Features in this sketch
      const featuresInThisSketch = features.filter((f) =>
        booleanPointInPolygon(f.geometry, sk.geometry),
      );
      const row: Pt = { id: `sketch:${sketchId}` };
      metricGroup.classes.forEach((curClass) => {
        const present = featuresInThisSketch.some(
          (f) => f.properties[curClass.classId] === "present",
        );
        row[curClass.classId] = present ? "true" : "false";
      });
      return row;
    });
  }

  return [...provinceRows, ...sketchRows, overall];
}

export default new GeoprocessingHandler(invertPresence, {
  title: "invertPresence",
  description: "",
  timeout: 500, // seconds
  memory: 1024, // megabytes
  executionMode: "async",
});
