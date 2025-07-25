import {
  Sketch,
  SketchCollection,
  Polygon,
  MultiPolygon,
  GeoprocessingHandler,
  Feature,
  isVectorDatasource,
  getFeaturesForSketchBBoxes,
  createMetric,
  toSketchArray,
  splitFeatureAntimeridian,
} from "@seasketch/geoprocessing";
import project from "../../project/projectClient.js";
import {
  Metric,
  Point,
  ReportResult,
  rekeyMetrics,
  sortMetrics,
} from "@seasketch/geoprocessing/client-core";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { splitSketchAntimeridian } from "../util/antimeridian.js";

interface SiteProperties {
  station_id?: string;
  island?: string;
}

interface SiteReportResult extends ReportResult {
  stations: {
    station_id: string;
    island: string;
    sketchName: string;
  }[];
}

/**
 * sites: A geoprocessing function that calculates overlap metrics for vector datasources
 * @param sketch - A sketch or collection of sketches
 * @param extraParams
 * @returns Calculated metrics and a null sketch
 */
export async function sites(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
): Promise<SiteReportResult> {
  const splitSketch = splitSketchAntimeridian(sketch);

  // Calculate overlap metrics for each class in metric group
  const metricGroup = project.getMetricGroup("sites");
  const curClass = metricGroup.classes[0];
  const ds = project.getMetricGroupDatasource(metricGroup, {
    classId: curClass.classId,
  });
  if (!isVectorDatasource(ds))
    throw new Error(`Expected vector datasource for ${ds.datasourceId}`);
  const url = project.getDatasourceUrl(ds);

  // Fetch features overlapping with sketch
  const features = (await getFeaturesForSketchBBoxes(
    splitSketch,
    url,
  )) as Feature<Point, SiteProperties>[];

  // Get unique counts and feature properties
  let stations = 0;
  const uniqueIslands = new Set<string>();
  const featureProperties: {
    station_id: string;
    island: string;
    sketchName: string;
  }[] = [];

  // Convert sketch to array of features for intersection testing
  const sketchArray = toSketchArray(splitSketch);

  // Process each feature to check intersection and get counts/properties
  features.forEach((feature) => {
    // Check if point is in any of the sketch polygons and get the containing sketch
    const containingSketch = sketchArray.find((sketchFeature) =>
      booleanPointInPolygon(feature.geometry, sketchFeature.geometry),
    );

    if (containingSketch) {
      const props = feature.properties || {};
      if (props.station_id) stations++;
      if (props.island) uniqueIslands.add(props.island);

      featureProperties.push({
        station_id: props.station_id || "",
        island: props.island || "",
        sketchName: containingSketch.properties?.name || "",
      });
    }
  });

  // Create metrics for the counts
  const metrics: Metric[] = [
    createMetric({
      metricId: "stations",
      value: stations,
    }),
    createMetric({
      metricId: "islands",
      value: uniqueIslands.size,
    }),
  ];

  return {
    metrics: sortMetrics(rekeyMetrics(metrics)),
    stations: featureProperties,
  };
}

export default new GeoprocessingHandler(sites, {
  title: "sites",
  description: "",
  timeout: 500, // seconds
  memory: 1024, // megabytes
  executionMode: "async",
});
