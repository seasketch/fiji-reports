#! ./node_modules/.bin/ts-node
import inquirer from "inquirer";
import { readDatasources } from "../src/util/datasources/datasources";
import { formatDescriptions } from "../src/util/datasources/formats";
import { importDatasource } from "../src/util/datasources/importDatasource";
import {
  importVectorDatasourceOptionsSchema,
  ImportVectorDatasourceOptions,
  Datasources,
  ImportRasterDatasourceOptions,
  importRasterDatasourceOptionsSchema,
} from "../src/util/datasources/types";
import path from "path";

import dsConfig from "../src/util/datasources/config";
import project from "../project";

interface ImportVectorDatasourceAnswers
  extends Pick<
    ImportVectorDatasourceOptions,
    "src" | "datasourceId" | "layerName" | "geo_type" | "formats"
  > {
  classKeys: string;
  propertiesToKeep: string;
}

interface ImportRasterDatasourceAnswers
  extends Pick<
    ImportRasterDatasourceOptions,
    "src" | "datasourceId" | "band" | "geo_type" | "formats" | "noDataValue"
  > {}

// Main function, wrapped in an IIFE to avoid top-level await
if (typeof require !== "undefined" && require.main === module) {
  void (async function () {
    const datasources = readDatasources();
    const geoTypeAnswer = await geoTypeQuestion(datasources);

    const config = await (async () => {
      if (geoTypeAnswer.geo_type === "vector") {
        // vector
        const inputAnswers = await inputQuestions(datasources);
        const layerNameAnswer = await layerNameQuestion(
          path.basename(
            inputAnswers.src,
            "." + path.basename(inputAnswers.src).split(".").pop()
          )
        );
        const detailedVectorAnswers = await detailedVectorQuestions(
          datasources
        );

        const config = vectorMapper({
          ...geoTypeAnswer,
          ...inputAnswers,
          ...layerNameAnswer,
          ...detailedVectorAnswers,
        });
        return config;
      } else {
        // raster
        const inputAnswers = await inputQuestions(datasources);
        const rasterBandAnswer = await rasterBandQuestion(
          inputAnswers.datasourceId
        );
        const detailedRasterAnswers = await detailedRasterQuestions(
          datasources
        );

        const config = rasterMapper({
          ...geoTypeAnswer,
          ...inputAnswers,
          ...rasterBandAnswer,
          ...detailedRasterAnswers,
        });
        return config;
      }
    })();

    await importDatasource(config, { srcUrl: project.dataBucketUrl() });
  })();
}

/** Maps answers object to options */
function vectorMapper(
  answers: ImportVectorDatasourceAnswers
): ImportVectorDatasourceOptions {
  const options: ImportVectorDatasourceOptions = {
    ...answers,
    classKeys: answers.classKeys.length > 0 ? answers.classKeys.split(",") : [],
    propertiesToKeep:
      answers.propertiesToKeep.length > 0
        ? answers.propertiesToKeep.split(",")
        : [],
  };

  const validOptions = importVectorDatasourceOptionsSchema.parse(options);
  return validOptions;
}

/** Maps answers object to options */
function rasterMapper(
  answers: ImportRasterDatasourceAnswers
): ImportRasterDatasourceOptions {
  let options: ImportRasterDatasourceOptions = {
    ...answers,
  };
  // a blank noDataValue will end up as nan, so just remove it as its optional
  if (isNaN(parseFloat(`${answers.noDataValue}`))) {
    delete options.noDataValue;
  }

  const validOptions = importRasterDatasourceOptionsSchema.parse(options);
  return validOptions;
}

async function geoTypeQuestion(
  datasources: Datasources
): Promise<Pick<ImportVectorDatasourceAnswers, "geo_type">> {
  return inquirer.prompt<Pick<ImportVectorDatasourceAnswers, "geo_type">>([
    {
      type: "list",
      name: "geo_type",
      message: "Type of data?",
      choices: [
        {
          value: "vector",
          name: "Vector",
        },
        {
          value: "raster",
          name: "Raster",
        },
      ],
    },
  ]);
}

async function inputQuestions(
  datasources: Datasources
): Promise<Pick<ImportVectorDatasourceAnswers, "src" | "datasourceId">> {
  const datasourceIds = datasources.map((ds) => ds.datasourceId);
  return inquirer.prompt<
    Pick<ImportVectorDatasourceAnswers, "src" | "datasourceId">
  >([
    {
      type: "input",
      name: "src",
      message: "Enter path to src file (with filename)",
    },
    {
      type: "input",
      name: "datasourceId",
      message:
        "Choose unique datasource name (use letters, numbers, -, _ to ensure will work)",
      validate: (value) =>
        value === "" ||
        (!datasourceIds.includes(value) &&
          (/^[a-zA-Z0-9-_]+$/.test(value)
            ? true
            : "Invalid datasource name. Leave it blank or use alphanumeric strings with dash or underscore and separate with commas")),
    },
  ]);
}

async function layerNameQuestion(
  layerName: string
): Promise<Pick<ImportVectorDatasourceAnswers, "layerName">> {
  return inquirer.prompt<Pick<ImportVectorDatasourceAnswers, "layerName">>([
    {
      type: "input",
      name: "layerName",
      message: "Enter layer name, defaults to filename",
      default: layerName,
    },
  ]);
}

async function rasterBandQuestion(
  datasourceId: string
): Promise<Pick<ImportRasterDatasourceAnswers, "band">> {
  return inquirer.prompt<Pick<ImportRasterDatasourceAnswers, "band">>([
    {
      type: "input",
      name: "band",
      message: "Enter band number to import, defaults to 0",
      default: 0,
      validate: (value) => (isNaN(parseInt(value)) ? "Not a number!" : true),
      filter: (value) => (isNaN(parseInt(value)) ? value : parseInt(value, 10)),
    },
  ]);
}

async function detailedVectorQuestions(
  datasources: Datasources
): Promise<
  Pick<
    ImportVectorDatasourceAnswers,
    "classKeys" | "propertiesToKeep" | "formats"
  >
> {
  return inquirer.prompt<
    Pick<
      ImportVectorDatasourceAnswers,
      "classKeys" | "propertiesToKeep" | "formats"
    >
  >([
    {
      type: "input",
      name: "classKeys",
      message:
        "Enter feature property names that you want to group metrics by (separated by a comma e.g. prop1,prop2,prop3)",
      validate: (value) =>
        value === "" ||
        (/^[a-zA-Z0-9-, _]+$/.test(value)
          ? true
          : "Invalid property names. Leave it blank or use alphanumeric strings with dash or underscore and separate with commas"),
    },
    {
      type: "input",
      name: "propertiesToKeep",
      message:
        "Enter additional feature property names to keep in final datasource (separated by a comma e.g. prop1,prop2,prop3). All others will be filtered out",
      validate: (value) =>
        value === "" ||
        (/^[a-zA-Z0-9-, _]+$/.test(value)
          ? true
          : "Invalid property names. Leave it blank or use alphanumeric strings with dash or underscore and separate with commas"),
    },
    {
      type: "checkbox",
      name: "formats",
      message:
        "What formats would you like published to S3?  Suggested formats already selected",
      choices: dsConfig.importSupportedVectorFormats.map((name) => ({
        value: name,
        name: `${name} - ${formatDescriptions[name]}`,
        checked: dsConfig.importDefaultVectorFormats.includes(name),
      })),
    },
  ]);
}

async function detailedRasterQuestions(
  datasources: Datasources
): Promise<Pick<ImportRasterDatasourceAnswers, "formats" | "noDataValue">> {
  return inquirer.prompt<
    Pick<ImportRasterDatasourceAnswers, "formats" | "noDataValue">
  >([
    {
      type: "checkbox",
      name: "formats",
      message:
        "What formats would you like published to S3?  Suggested formats already selected",
      choices: dsConfig.importSupportedRasterFormats.map((name) => ({
        value: name,
        name: `${name} - ${formatDescriptions[name]}`,
        checked: dsConfig.importDefaultRasterFormats.includes(name),
      })),
    },
    {
      type: "input",
      name: "noDataValue",
      message: "Enter nodata value for raster or leave blank",
      validate: (value) =>
        value !== "" && isNaN(parseFloat(value)) ? "Not a number!" : true,
      filter: (value) => (isNaN(parseFloat(value)) ? value : parseFloat(value)),
    },
  ]);
}
