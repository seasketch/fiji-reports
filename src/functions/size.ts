import {
  Sketch,
  SketchCollection,
  Polygon,
  MultiPolygon,
  GeoprocessingHandler,
  isVectorDatasource,
  getFeaturesForSketchBBoxes,
  overlapPolygonArea,
} from "@seasketch/geoprocessing";
import project from "../../project/projectClient.js";
import {
  Metric,
  ReportResult,
  rekeyMetrics,
  sortMetrics,
} from "@seasketch/geoprocessing/client-core";
import { splitSketchAntimeridian } from "../util/antimeridian.js";

/**
 * Calculates the size of a sketch or sketch collection in square kilometers
 */
export async function size(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
): Promise<ReportResult> {
  const splitSketch = splitSketchAntimeridian(sketch);

  // Calculate overlap metrics for each class in metric group
  const metricGroup = project.getMetricGroup("size");
  const metrics = (
    await Promise.all(
      metricGroup.classes.map(async (curClass) => {
        const ds = project.getMetricGroupDatasource(metricGroup, {
          classId: curClass.classId,
        });
        if (!isVectorDatasource(ds))
          throw new Error(`Expected vector datasource for ${ds.datasourceId}`);
        const url = project.getDatasourceUrl(ds);

        // Fetch features overlapping with sketch
        const features = await getFeaturesForSketchBBoxes<
          Polygon | MultiPolygon
        >(splitSketch, url);

        // Calculate overlap metrics
        const overlapResult = await overlapPolygonArea(
          metricGroup.metricId,
          features,
          splitSketch,
          { solveOverlap: false },
        );

        return overlapResult.map(
          (metric): Metric => ({
            ...metric,
            classId: curClass.classId,
          }),
        );
      }),
    )
  ).flat();

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
