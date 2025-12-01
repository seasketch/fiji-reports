import {
  Sketch,
  SketchCollection,
  Polygon,
  MultiPolygon,
  GeoprocessingHandler,
  runLambdaWorker,
  parseLambdaResponse,
} from "@seasketch/geoprocessing";
import project from "../../project/projectClient.js";
import {
  DefaultExtraParams,
  GeoprocessingRequestModel,
  Metric,
  ReportResult,
  isMetricArray,
  rekeyMetrics,
  sortMetrics,
} from "@seasketch/geoprocessing/client-core";
import { splitSketchAntimeridian } from "../util/antimeridian.js";
import { geomorphACAWorker } from "./geomorphACAWorker.js";

// Overlap geomorphic map from Allen Coral Atlas
export async function geomorphACA(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
  extraParams: DefaultExtraParams = {},
  request?: GeoprocessingRequestModel<Polygon | MultiPolygon>,
): Promise<ReportResult> {
  const splitSketch = splitSketchAntimeridian(sketch);
  const metricGroup = project.getMetricGroup("geomorphACA");

  const metrics = (
    await Promise.all(
      metricGroup.classes.map(async (curClass) => {
        const parameters = {
          classId: curClass.classId,
          metricGroup,
        };

        return process.env.NODE_ENV === "test"
          ? geomorphACAWorker(splitSketch, parameters)
          : runLambdaWorker(
              splitSketch,
              project.package.name,
              "geomorphACAWorker",
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

export default new GeoprocessingHandler(geomorphACA, {
  title: "geomorphACA",
  description: "",
  timeout: 500, // seconds
  memory: 1024, // megabytes
  executionMode: "async",
  workers: ["geomorphACAWorker"],
});
