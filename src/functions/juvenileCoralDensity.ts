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
  isSketchCollection,
  Point,
  toSketchArray,
} from "@seasketch/geoprocessing/client-core";
import { booleanPointInPolygon } from "@turf/turf";
import { Station } from "../util/station.js";
import { splitSketchAntimeridian } from "../util/antimeridian.js";

/**
 * Overlap with juvenile coral density
 */
export async function juvenileCoralDensity(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
): Promise<Station[]> {
  const splitSketch = splitSketchAntimeridian(sketch);
  const sketchArray = toSketchArray(splitSketch);

  const metricGroup = project.getMetricGroup("juvenileCoralDensity");

  // Get features within sketches
  const ds = project.getMetricGroupDatasource(metricGroup);
  if (!isVectorDatasource(ds))
    throw new Error(`Expected vector datasource for ${ds.datasourceId}`);
  const url = project.getDatasourceUrl(ds);
  const features = (
    (await getFeaturesForSketchBBoxes(splitSketch, url)) as Feature<
      Point,
      Station
    >[]
  ).filter((feature) =>
    sketchArray.some((sk) =>
      booleanPointInPolygon(feature.geometry, sk.geometry),
    ),
  );

  // Individual station metrics
  const individualStations: Station[] = features.map((feature) => ({
    station_id: `station:${feature.properties.station_id}`,
    ...Object.fromEntries(
      metricGroup.classes.map((c) => [
        c.classId,
        feature.properties[c.classId],
      ]),
    ),
  }));

  // Calculate averages
  const classAverages = metricGroup.classes.map((curClass) => {
    const values = features.map((feature) =>
      Number(feature.properties[curClass.classId]),
    );
    const average =
      values.reduce((sum, value) => sum + value, 0) / values.length;

    return {
      classId: curClass.classId,
      value: average,
    };
  });

  // Overall averages station
  const overallAveragesStation: Station = {
    station_id: "averages",
    ...Object.fromEntries(classAverages.map((avg) => [avg.classId, avg.value])),
  };

  // By-Sketch averages
  const perSketchAverages: Station[] = isSketchCollection(sketch)
    ? sketchArray.map((sketch) => {
        const station: Station = {
          station_id: `sketch:${sketch.properties?.name || sketch.properties?.id || "unknown_sketch"}`,
        };

        metricGroup.classes.forEach((curClass) => {
          const values = features
            .filter((feature) =>
              booleanPointInPolygon(feature.geometry, sketch.geometry),
            )
            .map((f) => Number(f.properties[curClass.classId]));

          station[curClass.classId] = values.length
            ? values.reduce((sum, val) => sum + val, 0) / values.length
            : "";
        });

        return station;
      })
    : [];

  return [...individualStations, ...perSketchAverages, overallAveragesStation];
}

export default new GeoprocessingHandler(juvenileCoralDensity, {
  title: "juvenileCoralDensity",
  description: "",
  timeout: 500, // seconds
  memory: 1024, // megabytes
  executionMode: "async",
});
