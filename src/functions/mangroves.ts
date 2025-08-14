import {
  Sketch,
  SketchCollection,
  Polygon,
  MultiPolygon,
  GeoprocessingHandler,
  getFirstFromParam,
  DefaultExtraParams,
  rasterMetrics,
  isRasterDatasource,
  loadCog,
  overlapPolygonArea,
  getFeaturesForSketchBBoxes,
} from "@seasketch/geoprocessing";
import project from "../../project/projectClient.js";
import {
  Metric,
  ReportResult,
  isVectorDatasource,
  rekeyMetrics,
  sortMetrics,
} from "@seasketch/geoprocessing/client-core";
import { splitSketchAntimeridian } from "../util/antimeridian.js";

/**
 * Overlap with mangrove areas
 */
export async function mangroves(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
): Promise<ReportResult> {
  const splitSketch = splitSketchAntimeridian(sketch);

  // Calculate overlap metrics for each class in metric group
  const metricGroup = project.getMetricGroup("mangroves");
  const metrics: Metric[] = (
    await Promise.all(
      metricGroup.classes.map(async (curClass) => {
        const ds = project.getMetricGroupDatasource(metricGroup, {
          classId: curClass.classId,
        });
        if (!isVectorDatasource(ds))
          throw new Error(`Expected vector datasource for ${ds.datasourceId}`);

        const url = project.getDatasourceUrl(ds);

        const features = await getFeaturesForSketchBBoxes<
          Polygon | MultiPolygon
        >(splitSketch, url);

        // Run raster analysis
        const overlapResult = await overlapPolygonArea(
          metricGroup.metricId,
          features,
          splitSketch,
        );

        return overlapResult.map(
          (metrics): Metric => ({
            ...metrics,
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

export default new GeoprocessingHandler(mangroves, {
  title: "mangroves",
  description: "",
  timeout: 500, // seconds
  memory: 1024, // megabytes
  executionMode: "async",
});
