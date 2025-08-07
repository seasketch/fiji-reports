import React from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  ClassTable,
  Collapse,
  Column,
  ReportError,
  ResultsCard,
  SketchClassTableStyled,
  Table,
  useSketchProperties,
} from "@seasketch/geoprocessing/client-ui";
import {
  MetricGroup,
  ReportResult,
} from "@seasketch/geoprocessing/client-core";
import project from "../../project/projectClient.js";

interface RichnessReportResult extends ReportResult {
  stations: {
    station_id: string;
    coral_genus_richness: number;
    fish_family_richness: number;
    invert_genus_richness: number;
  }[];
  perSketch: {
    sketchId: string;
    sketchName: string;
    coral_genus_richness: number;
    fish_family_richness: number;
    invert_genus_richness: number;
  }[];
}

/**
 * TaxaRichness component
 */
export const TaxaRichness: React.FunctionComponent = () => {
  const { t } = useTranslation();
  const [{ isCollection }] = useSketchProperties();

  // Metrics
  const metricGroup = project.getMetricGroup("taxaRichness", t);

  // Labels
  const titleLabel = t("Taxa Richness");
  const taxaLabel = t("Taxa");
  const mapLabel = t("Map");
  const withinLabel = t("Average Richness");

  return (
    <ResultsCard title={titleLabel} functionName="taxaRichness">
      {(data: RichnessReportResult) => {
        return (
          <ReportError>
            <p>
              <Trans i18nKey="Richness 1">
                This report summarizes the richness of coral genera, fish
                families, and invertebrate species within the area of interest.
              </Trans>
            </p>

            <ClassTable
              rows={data.metrics}
              metricGroup={metricGroup}
              columnConfig={[
                {
                  columnLabel: taxaLabel,
                  type: "class",
                  width: 30,
                },
                {
                  columnLabel: withinLabel,
                  type: "metricValue",
                  metricId: metricGroup.metricId,
                  valueFormatter: (val) => Number(val).toFixed(1),
                  chartOptions: {
                    showTitle: true,
                  },
                  colStyle: { textAlign: "center" },
                  width: 20,
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
              <Collapse title={t("Show By Sketch")}>
                {genPerSketchTable(data, metricGroup, t)}
              </Collapse>
            )}

            <Collapse title={t("Learn More")}>
              <Trans i18nKey="Richness - learn more">
                <p>
                  ℹ️ Overview: This report summarizes the richness of coral
                  genera, fish families, and invertebrate species within the
                  area of interest.
                </p>
                <p>🗺️ Source Data: Fiji Expedition</p>
                <p>
                  📈 Report: This report calculates the average richness of
                  coral genera, fish families, and invertebrate genera within
                  the area of interest by averaging the richness results of
                  individual dive sites within the area.
                </p>
              </Trans>
            </Collapse>
          </ReportError>
        );
      }}
    </ResultsCard>
  );
};

const genSketchTable = (
  data: RichnessReportResult,
  metricGroup: MetricGroup,
  t: any,
) => {
  const stationLabel = t("Station ID");

  const classColumns: Column<Record<string, string | number>>[] =
    metricGroup.classes.map((curClass) => ({
      Header: curClass.display,
      accessor: (row) => {
        return row[curClass.classId];
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

const genPerSketchTable = (
  data: RichnessReportResult,
  metricGroup: MetricGroup,
  t: any,
) => {
  const sketchLabel = t("Sketch Name");

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
      Header: sketchLabel,
      accessor: (row) => {
        return <div style={{ width: 120 }}>{row.sketchName}</div>;
      },
    },
    ...(classColumns as Column<any>[]),
  ];

  return (
    <SketchClassTableStyled>
      <Table
        className="styled"
        columns={columns}
        data={data.perSketch.sort((a, b) =>
          (a.sketchName as string).localeCompare(b.sketchName as string),
        )}
      />
    </SketchClassTableStyled>
  );
};
