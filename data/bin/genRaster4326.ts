import { $ } from "zx";
import {
  Datasource,
  ImportRasterDatasourceConfig,
  isInternalRasterDatasource,
  isRasterDatasource,
} from "@seasketch/geoprocessing";
import datasources from "../../project/datasources.json" with { type: "json" };

export async function genCog(config: ImportRasterDatasourceConfig) {
  const warpDst = "data/dist/" + config.datasourceId + "_4326" + ".tif";
  const dst = "data/dist/" + config.datasourceId + ".tif";
  await $`rm ${dst}`;
  // reprojection
  await $`gdalwarp -t_srs "EPSG:4326" -dstnodata ${config.noDataValue} --config GDAL_PAM_ENABLED NO --config GDAL_CACHEMAX 500 -wm 500 -multi -wo NUM_THREADS=ALL_CPUS ${config.src} ${warpDst}`;
  // cloud-optimize
  await $`gdal_translate -b ${config.band} -r nearest --config GDAL_PAM_ENABLED NO --config GDAL_CACHEMAX 500 -co COMPRESS=LZW -co NUM_THREADS=ALL_CPUS -of COG -stats ${warpDst} ${dst}`;
  await $`rm ${warpDst}`;
}

const config = (datasources as Datasource[]).find(
  (d) => d.datasourceId === "gfw_purseseine",
);
if (isRasterDatasource(config) && isInternalRasterDatasource(config)) {
  genCog(config);
}
