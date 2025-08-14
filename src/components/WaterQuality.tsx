import React from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  ClassTable,
  Collapse,
  Column,
  DataDownload,
  ReportError,
  ResultsCard,
  SketchClassTableStyled,
  Table,
  ToolbarCard,
  useSketchProperties,
} from "@seasketch/geoprocessing/client-ui";
import {
  MetricGroup,
  ReportResult,
} from "@seasketch/geoprocessing/client-core";
import project from "../../project/projectClient.js";
import { Download } from "@styled-icons/bootstrap/Download";

interface WaterQualityReportResult extends ReportResult {
  stations: {
    station_id: string;
    d15n: number;
  }[];
  perSketchAverages: {
    sketchId: string;
    sketchName: string;
    average: number;
  }[];
}

/**
 * Water Quality report
 */
export const WaterQuality: React.FunctionComponent = () => {
  const { t } = useTranslation();
  const [{ isCollection }] = useSketchProperties();

  // Metrics
  const metricGroup = project.getMetricGroup("waterQuality", t);

  // Labels
  const titleLabel = t("Water Quality");
  const withinLabel = t("Average Within Area");
  const mapLabel = t("Map");

  return (
    <ResultsCard title={titleLabel} functionName="waterQuality" useChildCard>
      {(data: WaterQualityReportResult) => {
        const metrics = data.metrics;

        return (
          <ReportError>
            <ToolbarCard
              title={titleLabel}
              items={
                <DataDownload
                  filename="WaterQuality"
                  data={data.metrics}
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
              <p>
                <Trans i18nKey="WaterQuality 1">
                  This report estimates the average Nitrogen-15 (δ15N) value
                  within the area of interest.
                </Trans>
              </p>

              <ClassTable
                rows={metrics}
                metricGroup={metricGroup}
                columnConfig={[
                  {
                    columnLabel: " ",
                    type: "class",
                    width: 30,
                  },
                  {
                    columnLabel: withinLabel,
                    type: "metricValue",
                    metricId: metricGroup.metricId,
                    valueFormatter: (value) => Number(value).toFixed(2),
                    chartOptions: {
                      showTitle: true,
                    },
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

              <Collapse title={t("Show By Dive Site")}>
                {genSketchTable(data, metricGroup, t)}
              </Collapse>

              {isCollection && (
                <Collapse title={t("Show by Sketch")}>
                  {genPerSketchTable(data, t)}
                </Collapse>
              )}

              <Collapse title={t("Learn More")}>
                <Trans i18nKey="WaterQuality - learn more">
                  <p>🗺️ Source Data: Fiji Expedition</p>
                  <p>
                    📈 Report: This report calculates the average Nitrogen-15
                    (δ15N) value in the area of interest by averaging the δ15N
                    values of individual water quality values of dive sites
                    within the area.
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

const genPerSketchTable = (data: WaterQualityReportResult, t: any) => {
  const sketchLabel = t("Sketch");
  const averageLabel = t("Average δ15N");

  const columns: Column<Record<string, string | number>>[] = [
    {
      Header: sketchLabel,
      accessor: (row) => {
        return <div style={{ width: 120 }}>{row.sketchName}</div>;
      },
    },
    {
      Header: averageLabel,
      accessor: (row) => {
        return Number(row.average).toFixed(2);
      },
      style: { textAlign: "center" },
    },
  ];

  return (
    <SketchClassTableStyled>
      <Table
        className="styled"
        columns={columns}
        data={data.perSketchAverages.sort((a, b) =>
          (a.sketchName as string).localeCompare(b.sketchName as string),
        )}
      />
    </SketchClassTableStyled>
  );
};

const genSketchTable = (
  data: WaterQualityReportResult,
  metricGroup: MetricGroup,
  t: any,
) => {
  const stationLabel = t("Station ID");

  const classColumns: Column<Record<string, string | number>>[] =
    metricGroup.classes.map((curClass) => ({
      Header: curClass.display,
      accessor: (row) => {
        return Number(row["d15n"]).toFixed(2);
      },
      style: { textAlign: "center" },
    }));

  const columns: Column<Record<string, string | number>>[] = [
    {
      Header: stationLabel,
      accessor: (row) => {
        return <div style={{ width: 80 }}>{row.station_id}</div>;
      },
    },
    ...(classColumns as Column<any>[]),
  ];

  return (
    <SketchClassTableStyled>
      <Table
        className="styled"
        columns={columns}
        data={data.stations.sort((a, b) =>
          (a.station_id as string).localeCompare(b.station_id as string),
        )}
      />
    </SketchClassTableStyled>
  );
};
