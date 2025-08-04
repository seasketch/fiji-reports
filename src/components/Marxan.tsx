import React from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  Collapse,
  Column,
  KeySection,
  LayerToggle,
  ReportError,
  ReportTableStyled,
  ResultsCard,
  Table,
  ToolbarCard,
  useSketchProperties,
  DataDownload,
  Pill,
} from "@seasketch/geoprocessing/client-ui";
import project from "../../project/projectClient.js";
import { SpRichnessResults } from "../util/overlapPolygonStats.js";
import { styled } from "styled-components";
import { TFunction } from "i18next";
import { Download } from "@styled-icons/bootstrap/Download";

/**
 * Marxan report
 */
export const Marxan: React.FunctionComponent = () => {
  const { t } = useTranslation();
  const [{ isCollection }] = useSketchProperties();
  const metricGroup = project.getMetricGroup("marxan", t);

  // Labels
  const titleLabel = t("Prioritization");
  const mapLabel = t("Show on Map");

  return (
    <ResultsCard title={titleLabel} functionName="marxan" useChildCard>
      {(metricResults: SpRichnessResults[]) => {
        const overallStats = isCollection
          ? metricResults.find((s) => s.isCollection)!
          : metricResults[0];

        return (
          <ReportError>
            <ToolbarCard
              title={titleLabel}
              items={
                <>
                  <DataDownload
                    filename="marxan"
                    data={metricResults}
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
              <p>
                This area of interest has an average prioritization score of{" "}
                <Pill>{overallStats.mean}</Pill>, and contains areas within the
                range of <Pill>{overallStats.min}</Pill> to{" "}
                <Pill>{overallStats.max}</Pill>.
              </p>

              <LayerToggle
                layerId={"aFSO2pWGP"}
                label={t("Show Inshore Priority Areas")}
              />
              <LayerToggle
                layerId={"thx4JZZtC"}
                label={t("Show Offshore Priority Areas")}
              />

              {isCollection && (
                <Collapse title={t("Show by Sketch")}>
                  {genRichnessTable(metricResults, t)}
                </Collapse>
              )}

              <Collapse title={t("Learn More")}>
                <Trans i18nKey="marxan - learn more">
                  <p>
                    📈 Report: Prioritization scores are calculated using the
                    Marxan software package, where the score shows the frequency
                    of an area being selected in the prioritization. The range
                    of scores is from 0 to 10, with 0 being the least
                    prioritized and 10 being the most prioritized.
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

export const RichnessTableStyled = styled(ReportTableStyled)`
  width: 100%;
  overflow-x: auto;
  font-size: 12px;

  th:first-child,
  td:first-child {
    min-width: 140px;
    position: sticky;
    left: 0;
    text-align: left;
    background: #efefef;
  }

  th,
  td {
    text-align: center;
    white-space: nowrap;
  }
`;

export const genRichnessTable = (data: SpRichnessResults[], t: TFunction) => (
  <RichnessTableStyled>
    <Table
      columns={[
        { Header: t("MPA"), accessor: "sketchName" },
        { Header: t("Min"), accessor: "min" },
        { Header: t("Avg"), accessor: "mean" },
        { Header: t("Max"), accessor: "max" },
      ]}
      data={data.filter((s) => !s.isCollection)}
    />
  </RichnessTableStyled>
);
