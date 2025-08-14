import React from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  ClassTable,
  Collapse,
  Column,
  KeySection,
  LayerToggle,
  Pill,
  ReportError,
  ResultsCard,
  SketchClassTableStyled,
  Table,
  useSketchProperties,
  ToolbarCard,
  DataDownload,
} from "@seasketch/geoprocessing/client-ui";
import { MetricGroup, roundLower } from "@seasketch/geoprocessing/client-core";
import project from "../../project/projectClient.js";
import { Station } from "../util/station.js";
import { Download } from "@styled-icons/bootstrap/Download";

const trophicGroups = [
  "Herbivore/Detritivore",
  "Lower-carnivore",
  "Planktivore",
  "Shark",
  "Top-predator",
];

/**
 * Fish Biomass report
 */
export const FishBiomass: React.FunctionComponent = () => {
  const { t } = useTranslation();
  const [{ isCollection }] = useSketchProperties();

  // Metrics
  const metricGroup = project.getMetricGroup("fishBiomass", t);

  // Labels
  const titleLabel = t("Fish Biomass");
  const fishLabel = t("Fish Family");
  const trophicLabel = t("Trophic Group");
  const mapLabel = t("Map");
  const averageLabel = t("Average Fish Biomass");

  return (
    <ResultsCard title={titleLabel} functionName="fishBiomass" useChildCard>
      {(data: Station[]) => {
        const averages = data.find((s) => s.station_id === "averages");
        const averageMetrics = averages
          ? Object.entries(averages)
              .filter(([key]) => key !== "station_id")
              .map(([classId, value]) => ({
                value: value as number,
                classId,
                metricId: metricGroup.metricId,
                geographyId: null,
                sketchId: null,
                groupId: null,
              }))
          : [];

        return (
          <ReportError>
            <ToolbarCard
              title={titleLabel}
              items={
                <DataDownload
                  filename="FishBiomass"
                  data={data}
                  formats={["csv", "json"]}
                  placement="left-start"
                  titleElement={
                    <Download
                      size={18}
                      color="#999"
                      style={{ cursor: "pointer" }}
                    />
                  }
                />
              }
            >
              <KeySection>
                <Trans i18nKey="FishBiomass 1">
                  This area of interest has an average total fish biomass of{" "}
                  <Pill>
                    {Number(averages?.total_fish_biomass) &&
                      roundLower(Number(averages?.total_fish_biomass))}{" "}
                    kg/ha
                  </Pill>
                </Trans>
              </KeySection>

              <LayerToggle
                layerId={
                  metricGroup.classes.find(
                    (curClass) => curClass.classId === "total_fish_biomass",
                  )?.layerId
                }
                label="Show Total Fish Biomass On Map"
              />

              <ClassTable
                rows={averageMetrics.filter((m) =>
                  trophicGroups.includes(m.classId),
                )}
                metricGroup={metricGroup}
                columnConfig={[
                  {
                    columnLabel: trophicLabel,
                    type: "class",
                    width: 30,
                  },
                  {
                    columnLabel: averageLabel,
                    type: "metricValue",
                    metricId: metricGroup.metricId,
                    valueFormatter: (val) =>
                      Number(val) && roundLower(Number(val)),
                    chartOptions: {
                      showTitle: true,
                    },
                    valueLabel: "kg/ha",
                    colStyle: { textAlign: "center" },
                    width: 40,
                  },
                  {
                    columnLabel: mapLabel,
                    type: "layerToggle",
                    width: 10,
                  },
                ]}
              />

              <Collapse title={t("Show By Family")}>
                <ClassTable
                  rows={averageMetrics.filter(
                    (m) =>
                      m.classId !== "total_fish_biomass" &&
                      !trophicGroups.includes(m.classId),
                  )}
                  metricGroup={metricGroup}
                  columnConfig={[
                    {
                      columnLabel: fishLabel,
                      type: "class",
                      width: 20,
                    },
                    {
                      columnLabel: averageLabel,
                      type: "metricValue",
                      metricId: metricGroup.metricId,
                      valueFormatter: (val) =>
                        Number(val) && roundLower(Number(val)),
                      chartOptions: {
                        showTitle: true,
                      },
                      valueLabel: "kg/ha",
                      colStyle: { textAlign: "center" },
                      width: 50,
                    },
                    {
                      columnLabel: mapLabel,
                      type: "layerToggle",
                      width: 10,
                    },
                  ]}
                />
              </Collapse>

              <Collapse title={t("Show by Dive Site")}>
                {genSketchTable(
                  data.filter(
                    (s) => s.station_id && s.station_id.startsWith("station:"),
                  ),
                  metricGroup,
                  t,
                )}
              </Collapse>

              {isCollection && (
                <Collapse title={t("Show by Sketch")}>
                  {genSketchTable(
                    data.filter(
                      (s) => s.station_id && s.station_id.startsWith("sketch:"),
                    ),
                    metricGroup,
                    t,
                  )}
                </Collapse>
              )}

              <Collapse title={t("Learn More")}>
                <Trans i18nKey="FishBiomass - learn more">
                  <p>
                    ℹ️ Overview: Total fish biomass, by site, from the Fiji
                    expedition.
                  </p>
                  <p>🗺️ Source Data: Fiji Expedition</p>
                  <p>
                    📈 Report: This report calculates the average fish biomass
                    within the plan by averaging the fish biomass results of
                    individual dive sites within the area.
                  </p>
                </Trans>
              </Collapse>
            </ToolbarCard>
          </ReportError>
        );
      }}
    </ResultsCard>
  );
};

const genSketchTable = (data: Station[], metricGroup: MetricGroup, t: any) => {
  const stations = data.filter((s) => s.station_id !== "averages");

  const classColumns: Column<Record<string, string | number>>[] =
    metricGroup.classes.map((curClass) => ({
      Header: curClass.display,
      accessor: (row) => {
        return (
          Number(row[curClass.classId]) &&
          roundLower(Number(row[curClass.classId]))
        );
      },
      style: { textAlign: "center" },
    }));

  const columns: Column<Record<string, string | number>>[] = [
    {
      Header: " ",
      accessor: (row) => {
        const id =
          typeof row.station_id === "string"
            ? row.station_id.replace(/^sketch:|^station:/, "")
            : row.station_id;
        return <b>{id}</b>;
      },
    },
    ...(classColumns as Column<any>[]),
  ];

  return (
    <SketchClassTableStyled>
      <Table
        className="styled"
        columns={columns}
        data={stations.sort((a, b) =>
          (a.station_id as string).localeCompare(b.station_id as string),
        )}
      />
    </SketchClassTableStyled>
  );
};
