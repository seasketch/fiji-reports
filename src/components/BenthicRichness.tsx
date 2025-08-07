import React from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  Collapse,
  KeySection,
  LayerToggle,
  ReportError,
  ReportTableStyled,
  ResultsCard,
  Table,
  ToolbarCard,
  useSketchProperties,
  DataDownload,
} from "@seasketch/geoprocessing/client-ui";
import project from "../../project/projectClient.js";
import { SpRichnessResults } from "../util/overlapPolygonStats.js";
import { styled } from "styled-components";
import { TFunction } from "i18next";
import { Download } from "@styled-icons/bootstrap/Download";

/**
 * Benthic Richness report
 */
export const BenthicRichness: React.FunctionComponent = () => {
  const { t } = useTranslation();
  const [{ isCollection }] = useSketchProperties();
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
                <>
                  <LayerToggle
                    layerId={metricGroup.layerId}
                    label={mapLabel}
                    simple
                  />
                  <DataDownload
                    filename="BenthicRichness"
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
                <Trans i18nKey="BenthicRichness 1">
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
                <Trans i18nKey="BenthicRichness - learn more">
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
                    maximum benthic species counts within the plan. If the plan
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
