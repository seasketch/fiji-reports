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
} from "@seasketch/geoprocessing/client-ui";
import project from "../../project/projectClient.js";
import { SpRichnessResults } from "../util/overlapPolygonStats.js";
import { styled } from "styled-components";
import { TFunction } from "i18next";

/**
 * BenthicRichnessCard component
 *
 * @param props - geographyId
 * @returns A react component which displays an overlap report
 */
export const BenthicRichnessCard: React.FunctionComponent = () => {
  const { t } = useTranslation();
  const [{ isCollection }] = useSketchProperties();

  // Metrics
  const metricGroup = project.getMetricGroup("benthicRichness", t);

  // Labels
  const titleLabel = t("Benthic Species Richness");
  const mapLabel = t("Show on Map");
  const unitLabel = t("spp.");

  return (
    <ResultsCard title={titleLabel} functionName="benthicRichness" useChildCard>
      {(metricResults: SpRichnessResults[]) => {
        const overallStats = isCollection
          ? metricResults.find((s) => s.isCollection)!
          : metricResults[0];

        return (
          <ReportError>
            <ToolbarCard
              title={titleLabel}
              items={
                <LayerToggle
                  layerId={metricGroup.classes[0].layerId}
                  label={mapLabel}
                  simple
                />
              }
            >
              <p>
                <Trans i18nKey="BenthicRichnessCard 1">
                  This report summarizes species richness within this plan.
                </Trans>
              </p>

              <KeySection
                style={{ display: "flex", justifyContent: "space-around" }}
              >
                <span>
                  {t("Min")}:{" "}
                  <b>
                    {overallStats.min} {unitLabel}
                  </b>
                </span>
                {overallStats!.mean && (
                  <span>
                    {t("Avg")}:{" "}
                    <b>
                      {overallStats.mean} {unitLabel}
                    </b>
                  </span>
                )}
                <span>
                  {t("Max")}:{" "}
                  <b>
                    {overallStats.max} {unitLabel}
                  </b>
                </span>
              </KeySection>

              {isCollection && (
                <Collapse title={t("Show by Sketch")}>
                  {genRichnessTable(metricResults, t)}
                </Collapse>
              )}

              <Collapse title={t("Learn More")}>
                <Trans i18nKey="BenthicRichnessCard - learn more">
                  <p>ℹ️ Overview:</p>
                  <p>
                    🗺️ Source Data:{" "}
                    <a
                      href="https://iucn.org/our-work/region/oceania"
                      target="_blank"
                    >
                      IUCN
                    </a>
                  </p>
                  <p>
                    📈 Report: This report calculates the minimum, mean, and
                    maximum benthic species within the plan. If the plan
                    includes multiple areas that overlap, the overlap is only
                    counted once.
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

export const genRichnessTable = (data: SpRichnessResults[], t: TFunction) => {
  const sketchMetrics = data.filter((s) => !s.isCollection);
  const columns: Column<SpRichnessResults>[] = [
    {
      Header: t("MPA"),
      accessor: (row) => row.sketchName,
    },
    {
      Header: t("Min"),
      accessor: (row) => row.min,
    },
    {
      Header: t("Avg"),
      accessor: (row) => row.mean,
    },
    {
      Header: t("Max"),
      accessor: (row) => row.max,
    },
  ];

  return (
    <RichnessTableStyled>
      <Table columns={columns} data={sketchMetrics} />
    </RichnessTableStyled>
  );
};
