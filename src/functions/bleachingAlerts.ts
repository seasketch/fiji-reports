import {
  Sketch,
  SketchCollection,
  Polygon,
  MultiPolygon,
  GeoprocessingHandler,
  rasterMetrics,
  isRasterDatasource,
  loadCog,
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
 * bleachingAlerts: A geoprocessing function that calculates overlap metrics for raster datasources
 * @param sketch - A sketch or collection of sketches
 * @param extraParams
 * @returns Calculated metrics and a null sketch
 */
export async function bleachingAlerts(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
): Promise<ReportResult> {
  const splitSketch = splitSketchAntimeridian(sketch);
  // Calculate overlap metrics for each class in metric group
  const metricGroup = project.getMetricGroup("bleachingAlerts");
  const metrics: Metric[] = (
    await Promise.all(
      metricGroup.classes.map(async (curClass) => {
        const ds = project.getMetricGroupDatasource(metricGroup, {
          classId: curClass.classId,
        });
        if (!isRasterDatasource(ds))
          throw new Error(`Expected raster datasource for ${ds.datasourceId}`);

        const url = project.getDatasourceUrl(ds);

        // Load raster metadata
        const raster = await loadCog(url);

        // Run raster analysis
        const overlapResult = await rasterMetrics(raster, {
          metricId: metricGroup.metricId,
          feature: splitSketch,
          ...(ds.measurementType === "quantitative" && { stats: ["valid"] }),
          ...(ds.measurementType === "categorical" && {
            categorical: true,
            categoryMetricValues: [curClass.classId],
          }),
        });

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

export default new GeoprocessingHandler(bleachingAlerts, {
  title: "bleachingAlerts",
  description: "",
  timeout: 500, // seconds
  memory: 1024, // megabytes
  executionMode: "async",
});
