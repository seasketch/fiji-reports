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
import { Point, toSketchArray } from "@seasketch/geoprocessing/client-core";
import { booleanPointInPolygon } from "@turf/turf";
import { Station } from "../util/station.js";
import { splitSketchAntimeridian } from "../util/antimeridian.js";

/**
 * juvenileCoralDensity: A geoprocessing function that calculates overlap metrics for vector datasources
 * @param sketch - A sketch or collection of sketches
 * @param extraParams
 * @returns Calculated metrics and a null sketch
 */
export async function juvenileCoralDensity(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
): Promise<Station[]> {
  const splitSketch = splitSketchAntimeridian(sketch);
  const sketchArray = toSketchArray(splitSketch);

  // Calculate overlap metrics for each class in metric group
  const metricGroup = project.getMetricGroup("juvenileCoralDensity");
  const ds = project.getMetricGroupDatasource(metricGroup);
  if (!isVectorDatasource(ds))
    throw new Error(`Expected vector datasource for ${ds.datasourceId}`);
  const url = project.getDatasourceUrl(ds);
  const features = (await getFeaturesForSketchBBoxes(
    splitSketch,
    url,
  )) as Feature<Point, Station>[];
  const finalFeatures = features.filter((feature) =>
    sketchArray.some((sk) =>
      booleanPointInPolygon(feature.geometry, sk.geometry),
    ),
  );

  const metrics = await (async () => {
    // Calculate averages for each class
    const classAverages = await Promise.all(
      metricGroup.classes.map(async (curClass) => {
        const propName = curClass.classId;
        const classValues = finalFeatures.map((feature) =>
          Number(feature.properties[propName]),
        );

        const average =
          classValues.reduce((sum, value) => sum + value, 0) /
          classValues.length;

        return {
          classId: curClass.classId,
          value: average,
        };
      }),
    );

    // Create individual stations
    const individualStations = finalFeatures.map((feature) => {
      const station: Station = {
        station_id: `station:${feature.properties.station_id}`,
      };

      // Add all class values from the metric group
      metricGroup.classes.forEach((curClass) => {
        station[curClass.classId] = feature.properties[curClass.classId];
      });

      return station;
    });

    // Create per-sketch averages
    const perSketchAverages = sketchArray.map((sketch) => {
      // Filter features within this sketch
      const featuresInSketch = finalFeatures.filter((feature) =>
        booleanPointInPolygon(feature.geometry, sketch.geometry),
      );
      const station: Station = {
        station_id: `sketch:${sketch.properties?.name || sketch.properties?.id || "unknown_sketch"}`,
      };
      metricGroup.classes.forEach((curClass) => {
        const classValues = featuresInSketch.map((feature) =>
          Number(feature.properties[curClass.classId]),
        );
        const average =
          classValues.length > 0
            ? classValues.reduce((sum, value) => sum + value, 0) /
              classValues.length
            : "";
        station[curClass.classId] = average;
      });
      return station;
    });

    // Create overall averages station
    const overallAveragesStation: Station = {
      station_id: "averages",
    };

    // Add all class averages
    classAverages.forEach((avg) => {
      overallAveragesStation[avg.classId] = avg.value;
    });

    return [
      ...individualStations,
      ...perSketchAverages,
      overallAveragesStation,
    ];
  })();

  return metrics;
}

export default new GeoprocessingHandler(juvenileCoralDensity, {
  title: "juvenileCoralDensity",
  description: "",
  timeout: 500, // seconds
  memory: 1024, // megabytes
  executionMode: "async",
});
