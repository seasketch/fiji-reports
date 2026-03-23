import {
  Sketch,
  SketchCollection,
  Polygon,
  MultiPolygon,
  GeoprocessingHandler,
  area,
} from "@seasketch/geoprocessing";
import project from "../../project/projectClient.js";
import {
  ReportResult,
  rekeyMetrics,
  sortMetrics,
} from "@seasketch/geoprocessing/client-core";

/**
 * Calculates the size of a sketch or sketch collection in square meters.
 * Display in hectares via value / 10000 (1 ha = 10,000 m²).
 */
export async function size(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
): Promise<ReportResult> {
  const metricGroup = project.getMetricGroup("size");

  const metrics = (await area(sketch, { metricId: metricGroup.metricId })).map(
    (metric) => ({
      ...metric,
      classId: metricGroup.classes[0].classId,
    }),
  );

  return {
    metrics: sortMetrics(rekeyMetrics(metrics)),
  };
}

export default new GeoprocessingHandler(size, {
  title: "size",
  description: "",
  timeout: 500, // seconds
  memory: 1024, // megabytes
  executionMode: "async",
});
