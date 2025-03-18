import React from "react";
import {
  ResultsCard,
  KeySection,
  Collapse,
  ToolbarCard,
  useSketchProperties,
  Column,
  Table,
  ReportTableStyled,
  LayerToggle,
  DataDownload,
  VerticalSpacer,
} from "@seasketch/geoprocessing/client-ui";
import { BathymetryResults } from "../functions/bathymetry.js";
import { Trans, useTranslation } from "react-i18next";
import { styled } from "styled-components";
import projectClient from "../../project/projectClient.js";

const formatDepth = (val: number) => {
  if (!val || val > 0) return "0m";
  const baseVal = Math.round(Math.abs(val));
  return `-${baseVal}m`;
};

export const Depth: React.FunctionComponent = () => {
  const { t } = useTranslation();
  const [{ isCollection }] = useSketchProperties();
  const mg = projectClient.getMetricGroup("bathymetry", t);
  const mapLabel = t("Show On Map");
  const title = t("Depth");

  return (
    <div style={{ breakInside: "avoid" }}>
      <ResultsCard title={title} functionName="bathymetry" useChildCard>
        {(data: BathymetryResults[]) => {
          const overallStats = isCollection
            ? data.find((s) => s.isCollection)
            : data[0];

          return (
            <ToolbarCard
              title={title}
              items={[
                <LayerToggle layerId={mg.layerId} label={mapLabel} simple />,
              ]}
            >
              <VerticalSpacer />
              <KeySection
                style={{ display: "flex", justifyContent: "space-around" }}
              >
                <span>
                  {t("Min")}: <b>{formatDepth(overallStats!.max)}</b>
                </span>
                {overallStats!.mean && (
                  <span>
                    {t("Avg")}: <b>{formatDepth(overallStats!.mean)}</b>
                  </span>
                )}
                <span>
                  {t("Max")}: <b>{formatDepth(overallStats!.min)}</b>
                </span>
              </KeySection>

              {isCollection && (
                <Collapse title={t("Show by MPA")}>
                  {genBathymetryTable(data)}
                </Collapse>
              )}

              <Collapse title={t("Learn More")}>
                <Trans i18nKey="Depth Card - Learn more">
                  <p>🗺️ Source Data: GEBCO</p>
                  <p>
                    📈 Report: Calculates the minimum, average, and maximum
                    ocean depth within the selected MPA(s).
                  </p>
                </Trans>
              </Collapse>
            </ToolbarCard>
          );
        }}
      </ResultsCard>
    </div>
  );
};

export const BathyTableStyled = styled(ReportTableStyled)`
  & {
    width: 100%;
    overflow-x: scroll;
    font-size: 12px;
  }

  & th:first-child,
  & td:first-child {
    min-width: 140px;
    position: sticky;
    left: 0;
    text-align: left;
    background: #efefef;
  }

  th,
  tr,
  td {
    text-align: center;
  }

  td:not(:first-child),
  th {
    white-space: nowrap;
  }
`;

export const genBathymetryTable = (data: BathymetryResults[]) => {
  const sketchMetrics = data.filter((s) => !s.isCollection);

  const columns: Column<BathymetryResults>[] = [
    {
      Header: "MPA",
      accessor: (row) => row.sketchName,
    },
    {
      Header: "Min",
      accessor: (row) => formatDepth(row.max),
    },
    {
      Header: "Mean",
      accessor: (row) => formatDepth(row.mean!),
    },
    {
      Header: "Max",
      accessor: (row) => formatDepth(row.min),
    },
  ];

  return (
    <BathyTableStyled>
      <Table columns={columns} data={sketchMetrics} />
    </BathyTableStyled>
  );
};
