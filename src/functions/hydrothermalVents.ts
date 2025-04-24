import {
  Sketch,
  SketchCollection,
  Polygon,
  MultiPolygon,
  GeoprocessingHandler,
  getFirstFromParam,
  DefaultExtraParams,
  isVectorDatasource,
  getFeaturesForSketchBBoxes,
  Point,
} from "@seasketch/geoprocessing";
import project from "../../project/projectClient.js";
import {
  Metric,
  ReportResult,
  rekeyMetrics,
  sortMetrics,
} from "@seasketch/geoprocessing/client-core";
import { overlapPoints } from "../util/overlapPoints.js";
import { splitSketchAntimeridian } from "../util/antimeridian.js";

/**
 * hydrothermalVents: A geoprocessing function that calculates overlap metrics for vector datasources
 * @param sketch - A sketch or collection of sketches
 * @param extraParams
 * @returns Calculated metrics and a null sketch
 */
export async function hydrothermalVents(
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
  const metricGroup = project.getMetricGroup("hydrothermalVents");
  const metrics = (
    await Promise.all(
      metricGroup.classes.map(async (curClass) => {
        const ds = project.getMetricGroupDatasource(metricGroup, {
          classId: curClass.classId,
        });
        if (!isVectorDatasource(ds))
          throw new Error(`Expected vector datasource for ${ds.datasourceId}`);
        const url = project.getDatasourceUrl(ds);

        // Fetch features overlapping with sketch, if not already fetched
        const features = await getFeaturesForSketchBBoxes<Point>(sketch, url);

        // Calculate overlap metrics
        const overlapResult = await overlapPoints(
          metricGroup.metricId,
          features,
          splitSketch,
        );

        return overlapResult.map(
          (metric): Metric => ({
            ...metric,
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

export default new GeoprocessingHandler(hydrothermalVents, {
  title: "hydrothermalVents",
  description: "",
  timeout: 500, // seconds
  memory: 1024, // megabytes
  executionMode: "async",
});
