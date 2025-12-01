import {
  Sketch,
  SketchCollection,
  Polygon,
  MultiPolygon,
  GeoprocessingHandler,
  overlapPolygonArea,
  getFeaturesForSketchBBoxes,
} from "@seasketch/geoprocessing";
import project from "../../project/projectClient.js";
import {
  Metric,
  MetricGroup,
  isVectorDatasource,
  rekeyMetrics,
  sortMetrics,
} from "@seasketch/geoprocessing/client-core";

/**
 * Overlap with mangrove areas
 */
export async function mangrovesWorker(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
  extraParams: { classId: string; metricGroup: MetricGroup },
): Promise<Metric[]> {
  const ds = project.getMetricGroupDatasource(extraParams.metricGroup, {
    classId: extraParams.classId,
  });
  if (!isVectorDatasource(ds))
    throw new Error(`Expected vector datasource for ${ds.datasourceId}`);

  const url = project.getDatasourceUrl(ds);

  const features = await getFeaturesForSketchBBoxes<Polygon | MultiPolygon>(
    sketch,
    url,
  );

  // Run raster analysis
  const overlapResult = await overlapPolygonArea(
    extraParams.metricGroup.metricId,
    features,
    sketch,
  );

  const metrics = overlapResult.map(
    (metrics): Metric => ({
      ...metrics,
      classId: extraParams.classId,
    }),
  );

  return sortMetrics(rekeyMetrics(metrics));
}

export default new GeoprocessingHandler(mangrovesWorker, {
  title: "mangrovesWorker",
  description: "",
  timeout: 500, // seconds
  memory: 4096, // megabytes
  executionMode: "sync",
});
