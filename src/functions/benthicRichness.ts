import {
  Sketch,
  SketchCollection,
  Polygon,
  MultiPolygon,
  GeoprocessingHandler,
  DefaultExtraParams,
  isVectorDatasource,
  getFeaturesForSketchBBoxes,
  splitSketchAntimeridian,
} from "@seasketch/geoprocessing";
import project from "../../project/projectClient.js";
import {
  rekeyMetrics,
  sortMetrics,
} from "@seasketch/geoprocessing/client-core";
import {
  overlapPolygonStats,
  SpRichnessResults,
} from "../util/overlapPolygonStats.js";

/**
 * benthicRichness: A geoprocessing function that calculates overlap metrics for vector datasources
 * @param sketch - A sketch or collection of sketches
 * @param extraParams
 * @returns Calculated metrics and a null sketch
 */
export async function benthicRichness(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
  extraParams: DefaultExtraParams = {},
): Promise<SpRichnessResults[]> {
  const splitSketch = splitSketchAntimeridian(sketch);

  // Calculate overlap metrics for each class in metric group
  const metricGroup = project.getMetricGroup("benthicRichness");
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
        const features = await getFeaturesForSketchBBoxes<
          Polygon | MultiPolygon
        >(sketch, url);

        // Calculate overlap metrics
        const overlapResult = await overlapPolygonStats(features, splitSketch, {
          featProperty: "DeepSpCoun",
        });

        return overlapResult;
      }),
    )
  ).flat();

  return metrics;
}

export default new GeoprocessingHandler(benthicRichness, {
  title: "benthicRichness",
  description: "",
  timeout: 500, // seconds
  memory: 1024, // megabytes
  executionMode: "async",
});
