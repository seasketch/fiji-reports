import React from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  ClassTable,
  Collapse,
  Column,
  DataDownload,
  LayerToggle,
  ReportError,
  ResultsCard,
  SketchClassTableStyled,
  Table,
  ToolbarCard,
  useSketchProperties,
} from "@seasketch/geoprocessing/client-ui";
import { MetricGroup } from "@seasketch/geoprocessing/client-core";
import project from "../../project/projectClient.js";
import { Station } from "../util/station.js";
import { Download } from "@styled-icons/bootstrap/Download";

/**
 * BenthicCover component
 */
export const BenthicCover: React.FunctionComponent = () => {
  const { t } = useTranslation();
  const [{ isCollection }] = useSketchProperties();

  // Metrics
  const metricGroup = project.getMetricGroup("benthicCover", t);

  // Labels
  const titleLabel = t("Benthic Cover");
  const mapLabel = t("Map");
  const averageLabel = t("Average Benthic Cover %");

  return (
    <ResultsCard title={titleLabel} functionName="benthicCover" useChildCard>
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
                <>
                  <DataDownload
                    filename="BenthicCover"
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
                </>
              }
            >
              <Trans i18nKey="BenthicCover 1">
                This report estimates the percentage of benthic habitats within
                this area of interest.
              </Trans>

              <LayerToggle
                layerId={
                  metricGroup.classes.find(
                    (curClass) => curClass.classId === "total",
                  )?.layerId
                }
                label="Show Total Fish Biomass On Map"
              />

              <ClassTable
                rows={averageMetrics}
                metricGroup={metricGroup}
                columnConfig={[
                  {
                    columnLabel: titleLabel,
                    type: "class",
                    width: 30,
                  },
                  {
                    columnLabel: averageLabel,
                    type: "metricValue",
                    metricId: metricGroup.metricId,
                    valueFormatter: (value) =>
                      (typeof value === "number" ? value.toFixed(2) : value) +
                      "%",
                    chartOptions: {
                      showTitle: true,
                    },
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
        return Number(row[curClass.classId]).toFixed(1) + "%";
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
