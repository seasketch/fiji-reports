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
import {
  overlapPolygonStats,
  SpRichnessResults,
} from "../util/overlapPolygonStats.js";
import { splitSketchAntimeridian } from "../util/antimeridian.js";

/**
 * Overlap polygons for benthic richness
 */
export async function benthicRichness(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
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

        const features = await getFeaturesForSketchBBoxes<
          Polygon | MultiPolygon
        >(splitSketch, url);

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
