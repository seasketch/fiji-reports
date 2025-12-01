import {
  Sketch,
  SketchCollection,
  Polygon,
  MultiPolygon,
  GeoprocessingHandler,
  DefaultExtraParams,
  runLambdaWorker,
  parseLambdaResponse,
} from "@seasketch/geoprocessing";
import project from "../../project/projectClient.js";
import {
  GeoprocessingRequestModel,
  Metric,
  ReportResult,
  isMetricArray,
  rekeyMetrics,
  sortMetrics,
} from "@seasketch/geoprocessing/client-core";
import { splitSketchAntimeridian } from "../util/antimeridian.js";
import { mangrovesWorker } from "./mangrovesWorker.js";

/**
 * Overlap with mangrove areas
 */
export async function mangroves(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
  extraParams: DefaultExtraParams = {},
  request?: GeoprocessingRequestModel<Polygon | MultiPolygon>,
): Promise<ReportResult> {
  const splitSketch = splitSketchAntimeridian(sketch);
  const metricGroup = project.getMetricGroup("mangroves");

  const metrics = (
    await Promise.all(
      metricGroup.classes.map(async (curClass) => {
        const parameters = {
          classId: curClass.classId,
          metricGroup,
        };

        return process.env.NODE_ENV === "test"
          ? mangrovesWorker(splitSketch, parameters)
          : runLambdaWorker(
              splitSketch,
              project.package.name,
              "mangrovesWorker",
              project.geoprocessing.region,
              parameters,
              request!,
            );
      }),
    )
  ).reduce<Metric[]>(
    (metrics, result) =>
      metrics.concat(
        isMetricArray(result)
          ? result
          : (parseLambdaResponse(result) as Metric[]),
      ),
    [],
  );

  return {
    metrics: sortMetrics(rekeyMetrics(metrics)),
  };
}

export default new GeoprocessingHandler(mangroves, {
  title: "mangroves",
  description: "",
  timeout: 500, // seconds
  memory: 1024, // megabytes
  executionMode: "async",
  workers: ["mangrovesWorker"],
});
