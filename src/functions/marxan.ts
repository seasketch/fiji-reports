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
 * Overlap with MARXAN solution
 */
export async function marxan(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
): Promise<ReportResult> {
  const splitSketch = splitSketchAntimeridian(sketch);
  const metricGroup = project.getMetricGroup("marxan");

  const ds = project.getMetricGroupDatasource(metricGroup);
  if (!isVectorDatasource(ds))
    throw new Error(`Expected vector datasource for ${ds.datasourceId}`);
  const url = project.getDatasourceUrl(ds);
  const features = await getFeaturesForSketchBBoxes<Polygon | MultiPolygon>(
    splitSketch,
    url,
  );
  const classKey = project.getMetricGroupClassKey(metricGroup);
  if (!classKey) throw new Error("No class key found");

  // Calculate overlap metrics for each class in metric group
  const metrics = (
    await Promise.all(
      metricGroup.classes.map(async (curClass) => {
        const finalFeatures = features.filter(
          (feat) =>
            feat.geometry &&
            feat.properties &&
            String(feat.properties[classKey]) === curClass.classId,
        );

        // Calculate overlap metrics
        const overlapResult = await overlapPolygonArea(
          metricGroup.metricId,
          finalFeatures,
          splitSketch,
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

export default new GeoprocessingHandler(marxan, {
  title: "marxan",
  description: "",
  timeout: 500, // seconds
  memory: 1024, // megabytes
  executionMode: "async",
});
