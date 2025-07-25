import {
  Sketch,
  SketchCollection,
  Polygon,
  MultiPolygon,
  GeoprocessingHandler,
  Feature,
  isVectorDatasource,
  getFeaturesForSketchBBoxes,
} from "@seasketch/geoprocessing";
import project from "../../project/projectClient.js";
import {
  Point,
  ReportResult,
  createMetric,
  rekeyMetrics,
  sortMetrics,
  toSketchArray,
} from "@seasketch/geoprocessing/client-core";
import { booleanPointInPolygon } from "@turf/turf";
import { splitSketchAntimeridian } from "../util/antimeridian.js";

interface WaterQualityProperties {
  station_id?: string;
  d15n?: number;
}

interface WaterQualityReportResult extends ReportResult {
  stations: {
    station_id: string;
    d15n: number;
  }[];
  perSketchAverages: {
    sketchId: string;
    sketchName: string;
    average: number;
  }[];
}

/**
 * waterQuality: A geoprocessing function that calculates overlap metrics for vector datasources
 * @param sketch - A sketch or collection of sketches
 * @param extraParams
 * @returns Calculated metrics and a null sketch
 */
export async function waterQuality(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
): Promise<WaterQualityReportResult> {
  const splitSketch = splitSketchAntimeridian(sketch);
  const sketchArray = toSketchArray(splitSketch);

  // Calculate overlap metrics for each class in metric group
  const metricGroup = project.getMetricGroup("waterQuality");
  const ds = project.getMetricGroupDatasource(metricGroup);
  if (!isVectorDatasource(ds))
    throw new Error(`Expected vector datasource for ${ds.datasourceId}`);
  const url = project.getDatasourceUrl(ds);
  const features = (await getFeaturesForSketchBBoxes(
    splitSketch,
    url,
  )) as Feature<Point, WaterQualityProperties>[];
  const finalFeatures = features.filter((feature) =>
    sketchArray.some((sk) =>
      booleanPointInPolygon(feature.geometry, sk.geometry),
    ),
  );

  // Metrics are the average percent 15N
  const metrics = (
    await Promise.all(
      metricGroup.classes.map(async (curClass) => {
        const classValues = finalFeatures.map((feature) =>
          feature.properties.d15n !== undefined ? feature.properties.d15n : NaN,
        );

        const average =
          classValues.reduce((sum, value) => sum + value, 0) /
          classValues.length;

        return createMetric({
          metricId: metricGroup.metricId,
          classId: curClass.classId,
          value: average,
        });
      }),
    )
  ).flat();

  // Also want to get an array of the sites and classValues
  const stations = finalFeatures.map((feature) => ({
    station_id: feature.properties.station_id || "",
    d15n: feature.properties.d15n !== undefined ? feature.properties.d15n : NaN,
  }));

  // Calculate per sketch averages
  const perSketchAverages = sketchArray.map((sketch) => {
    // Find features that intersect with this specific sketch
    const sketchFeatures = finalFeatures.filter((feature) =>
      booleanPointInPolygon(feature.geometry, sketch.geometry),
    );

    // Calculate ratios for features in this sketch
    const sketchRatios = sketchFeatures
      .map((feature) =>
        feature.properties.d15n !== undefined ? feature.properties.d15n : NaN,
      )
      .filter((ratio) => !isNaN(ratio));

    // Calculate average for this sketch
    const sketchAverage =
      sketchRatios.length > 0
        ? sketchRatios.reduce((sum, ratio) => sum + ratio, 0) /
          sketchRatios.length
        : 0;

    return {
      sketchId: sketch.properties.id,
      sketchName: sketch.properties.name,
      average: sketchAverage,
    };
  });

  return {
    metrics: sortMetrics(rekeyMetrics(metrics)),
    stations,
    perSketchAverages,
  };
}

export default new GeoprocessingHandler(waterQuality, {
  title: "waterQuality",
  description: "",
  timeout: 500, // seconds
  memory: 1024, // megabytes
  executionMode: "async",
});
