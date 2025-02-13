import { $ } from "zx";
import {
  Datasource,
  isInternalRasterDatasource,
} from "@seasketch/geoprocessing";
import datasources from "../../project/datasources.json" with { type: "json" };

const gfwDs = ["gfw_longline", "gfw_purseseine"];

gfwDs.forEach(async (ds) => {
  const config = (datasources as Datasource[]).find(
    (d) => d.datasourceId === ds,
  )!;

  if (!isInternalRasterDatasource(config))
    throw new Error("Expected internal raster datasource");

  const dst = "data/dist/" + config.datasourceId + ".tif";
  await $`rm ${dst}`;
  await $`gdal_translate -b ${config.band} -r nearest --config GDAL_PAM_ENABLED NO --config GDAL_CACHEMAX 500 -co COMPRESS=LZW -co NUM_THREADS=ALL_CPUS -of COG -stats ${config.src} ${dst}`;
});
