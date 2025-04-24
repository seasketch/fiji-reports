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
 * gfw: A geoprocessing function that calculates overlap metrics for raster datasources
 * @param sketch - A sketch or collection of sketches
 * @param extraParams
 * @returns Calculated metrics and a null sketch
 */
export async function gfw(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
  extraParams: DefaultExtraParams = {},
): Promise<ReportResult> {
  // Check for client-provided geography, fallback to first geography assigned as default-boundary in metrics.json
  const geographyId = getFirstFromParam("geographyIds", extraParams);
  const curGeography = project.getGeographyById(geographyId, {
    fallbackGroup: "default-boundary",
  });

  // Split sketch as antimeridian
  const splitSketch = splitSketchAntimeridian(sketch);

  // Calculate overlap metrics for each class in metric group
  const metricGroup = project.getMetricGroup("gfw");
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
          stats: ["sum"],
        });

        return overlapResult.map(
          (metrics): Metric => ({
            ...metrics,
            classId: curClass.classId,
            geographyId: curGeography.geographyId,
          }),
        );
      }),
    )
  ).flat();

  return {
    metrics: sortMetrics(rekeyMetrics(metrics)),
  };
}

export default new GeoprocessingHandler(gfw, {
  title: "gfw",
  description: "",
  timeout: 500, // seconds
  memory: 1024, // megabytes
  executionMode: "async",
});
