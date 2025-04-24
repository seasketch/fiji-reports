import {
  Sketch,
  SketchCollection,
  Polygon,
  MultiPolygon,
  GeoprocessingHandler,
  getFirstFromParam,
  DefaultExtraParams,
  Feature,
  isVectorDatasource,
  getFeaturesForSketchBBoxes,
  overlapPolygonArea,
  isSketchCollection,
} from "@seasketch/geoprocessing";
import project from "../../project/projectClient.js";
import {
  Metric,
  rekeyMetrics,
  sortMetrics,
} from "@seasketch/geoprocessing/client-core";
import { splitSketchAntimeridian } from "../util/antimeridian.js";

/**
 * suma: A geoprocessing function that calculates overlap metrics for vector datasources
 * @param sketch - A sketch or collection of sketches
 * @param extraParams
 * @returns Calculated metrics and a null sketch
 */
export async function suma(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
  extraParams: DefaultExtraParams = {},
): Promise<{ totalValue: number; metrics: Metric[] }> {
  // Check for client-provided geography, fallback to first geography assigned as default-boundary in metrics.json
  const geographyId = getFirstFromParam("geographyIds", extraParams);
  const curGeography = project.getGeographyById(geographyId, {
    fallbackGroup: "default-boundary",
  });

  // Split sketch as antimeridian
  const splitSketch = splitSketchAntimeridian(sketch);

  // First, get total value
  const totalDs = project.getDatasourceById("suma_dissolved");
  if (!isVectorDatasource(totalDs))
    throw new Error(`Expected vector datasource for ${totalDs.datasourceId}`);
  const totalUrl = project.getDatasourceUrl(totalDs);
  const totalFeatures = await getFeaturesForSketchBBoxes<
    Polygon | MultiPolygon
  >(splitSketch, totalUrl);
  const totalMetric = (
    await overlapPolygonArea(
      "sumaTotal",
      totalFeatures,
      splitSketch,
      isSketchCollection(sketch) ? { includeChildMetrics: false } : {},
    )
  )[0];

  const metricGroup = project.getMetricGroup("suma");
  const dsId = metricGroup.datasourceId;
  if (!dsId)
    throw new Error(`Expected datasourceId for ${metricGroup.metricId}`);
  const ds = project.getDatasourceById(dsId);
  if (!isVectorDatasource(ds))
    throw new Error(`Expected vector datasource for ${ds.datasourceId}`);
  const url = project.getDatasourceUrl(ds);
  const features = await getFeaturesForSketchBBoxes<Polygon | MultiPolygon>(
    splitSketch,
    url,
  );

  const metrics = (
    await Promise.all(
      metricGroup.classes.map(async (curClass) => {
        // Get classKey for current data class
        const classKey = project.getMetricGroupClassKey(metricGroup, {
          classId: curClass.classId,
        });

        let finalFeatures: Feature<Polygon | MultiPolygon>[] = [];
        if (classKey === undefined) finalFeatures = features;
        else {
          // Filter to features that are a member of this class
          finalFeatures = features.filter(
            (feat) =>
              feat.geometry &&
              feat.properties &&
              feat.properties[classKey] === curClass.classId,
          );
        }

        // Calculate overlap metrics
        const overlapResult = await overlapPolygonArea(
          metricGroup.metricId,
          finalFeatures,
          splitSketch,
          { solveOverlap: false },
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
    totalValue: totalMetric.value,
    metrics: sortMetrics(rekeyMetrics(metrics)),
  };
}

export default new GeoprocessingHandler(suma, {
  title: "suma",
  description: "",
  timeout: 500, // seconds
  memory: 1024, // megabytes
  executionMode: "async",
});
