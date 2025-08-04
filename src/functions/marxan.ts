import {
  Sketch,
  SketchCollection,
  Polygon,
  MultiPolygon,
  GeoprocessingHandler,
  isVectorDatasource,
  getFeaturesForSketchBBoxes,
} from "@seasketch/geoprocessing";
import project from "../../project/projectClient.js";
import { splitSketchAntimeridian } from "../util/antimeridian.js";
import {
  overlapPolygonStats,
  SpRichnessResults,
} from "../util/overlapPolygonStats.js";

/**
 * marxan: A geoprocessing function that calculates overlap metrics for vector datasources
 * @param sketch - A sketch or collection of sketches
 * @param extraParams
 * @returns Calculated metrics and a null sketch
 */
export async function marxan(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
): Promise<SpRichnessResults[]> {
  const splitSketch = splitSketchAntimeridian(sketch);

  // Calculate overlap metrics for each class in metric group
  const metricGroup = project.getMetricGroup("marxan");
  const metrics = (
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

        // Calculate overlap metrics
        const overlapResult = await overlapPolygonStats(features, splitSketch, {
          featProperty: "SSOLN",
        });

        return overlapResult;
      }),
    )
  ).flat();

  return metrics;
}

export default new GeoprocessingHandler(marxan, {
  title: "marxan",
  description: "",
  timeout: 500, // seconds
  memory: 1024, // megabytes
  executionMode: "async",
});
