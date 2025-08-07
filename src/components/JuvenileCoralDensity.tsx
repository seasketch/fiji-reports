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
import { MetricGroup } from "@seasketch/geoprocessing/client-core";
import project from "../../project/projectClient.js";
import { Station } from "../util/station.js";
import { Download } from "@styled-icons/bootstrap/Download";

/**
 * JuvenileCoralDensity component
 */
export const JuvenileCoralDensity: React.FunctionComponent = () => {
  const { t } = useTranslation();
  const [{ isCollection }] = useSketchProperties();

  // Metrics
  const metricGroup = project.getMetricGroup("juvenileCoralDensity", t);

  // Labels
  const titleLabel = t("Juvenile Coral Density");
  const coralLabel = t("Coral Genus");
  const mapLabel = t("Map");
  const averageLabel = t("Average Juvenile Coral Density");

  return (
    <ResultsCard
      title={titleLabel}
      functionName="juvenileCoralDensity"
      useChildCard
    >
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
                  filename="JuvenileCoralDensity"
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
                <Trans i18nKey="JuvenileCoralDensity 1">
                  This plan has an average juvenile coral density of{" "}
                  <Pill>{Number(averages?.total).toFixed(1)} indv/m²</Pill>
                </Trans>
              </KeySection>

              <LayerToggle
                layerId={
                  metricGroup.classes.find(
                    (curClass) => curClass.classId === "total",
                  )?.layerId
                }
                label="Show Total Juvenile Coral Density On Map"
              />

              <Collapse title={t("Show By Coral Genus")}>
                <ClassTable
                  rows={averageMetrics.filter((m) => m.classId !== "total")}
                  metricGroup={metricGroup}
                  columnConfig={[
                    {
                      columnLabel: coralLabel,
                      type: "class",
                      width: 20,
                    },
                    {
                      columnLabel: averageLabel,
                      type: "metricValue",
                      metricId: metricGroup.metricId,
                      valueFormatter: (val) => Number(val).toFixed(1),
                      chartOptions: {
                        showTitle: true,
                      },
                      valueLabel: "indv/m²",
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
                <Trans i18nKey="JuvenileCoralDensity - learn more">
                  <p>
                    ℹ️ Overview: Juvenile coral density, by site, from the Fiji
                    expedition.
                  </p>
                  <p>🗺️ Source Data: Fiji Expedition</p>
                  <p>
                    📈 Report: This report calculates the average juvenile coral
                    density within the plan by averaging the juvenile coral
                    density results of individual dive sites within the area.
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
        return Number(row[curClass.classId]).toFixed(1);
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
