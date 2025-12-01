import {
  Sketch,
  SketchCollection,
  Polygon,
  MultiPolygon,
  GeoprocessingHandler,
  parseLambdaResponse,
  runLambdaWorker,
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
import { benthicACAWorker } from "./benthicACAWorker.js";

// Overlap benthic map from Allen Coral Atlas
export async function benthicACA(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
  extraParams: DefaultExtraParams = {},
  request?: GeoprocessingRequestModel<Polygon | MultiPolygon>,
): Promise<ReportResult> {
  const splitSketch = splitSketchAntimeridian(sketch);
  const metricGroup = project.getMetricGroup("benthicACA");

  const metrics = (
    await Promise.all(
      metricGroup.classes.map(async (curClass) => {
        const parameters = {
          classId: curClass.classId,
          metricGroup,
        };

        return process.env.NODE_ENV === "test"
          ? benthicACAWorker(splitSketch, parameters)
          : runLambdaWorker(
              splitSketch,
              project.package.name,
              "benthicACAWorker",
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

export default new GeoprocessingHandler(benthicACA, {
  title: "benthicACA",
  description: "",
  timeout: 500, // seconds
  memory: 1024, // megabytes
  executionMode: "async",
  workers: ["benthicACAWorker"],
});
