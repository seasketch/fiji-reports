import React from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  Collapse,
  LayerToggle,
  Pill,
  ReportError,
  ResultsCard,
  SmallReportTableStyled,
  Table,
  ToolbarCard,
  DataDownload,
} from "@seasketch/geoprocessing/client-ui";
import { ReportResult } from "@seasketch/geoprocessing/client-core";
import { Download } from "@styled-icons/bootstrap/Download";

interface SiteReportResult extends ReportResult {
  stations: {
    station_id: string;
    island: string;
    sketchName: string;
  }[];
}

/**
 * Dive Sites component
 */
export const Sites: React.FunctionComponent = () => {
  const { t } = useTranslation();
  const titleLabel = t("Dive Sites");

  return (
    <ResultsCard title={titleLabel} functionName="sites" useChildCard>
      {(data: SiteReportResult) => {
        // Get metric values
        const stations =
          data.metrics.find((m) => m.metricId === "stations")?.value || 0;
        const islands =
          data.metrics.find((m) => m.metricId === "islands")?.value || 0;

        return (
          <ReportError>
            <ToolbarCard
              title={titleLabel}
              items={
                <DataDownload
                  filename="Sites"
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
                <Trans i18nKey="Sites 1">
                  This plan contains <Pill>{stations.toString()}</Pill> dive
                  site
                  {stations === 1 ? "" : "s"} by{" "}
                  <Pill>{islands.toString()}</Pill> island
                  {islands === 1 ? "" : "s"}.
                </Trans>
              </p>

              <LayerToggle
                layerId="pdZ8qAqGI"
                label={t("Show Dive Sites on Map")}
              />

              <Collapse title={t("Dive Sites")}>
                <SmallReportTableStyled>
                  <Table
                    data={data.stations}
                    columns={[
                      {
                        Header: t("Station ID"),
                        accessor: "station_id",
                      },
                      {
                        Header: t("Island"),
                        accessor: "island",
                      },
                      {
                        Header: t("Within Sketch"),
                        accessor: "sketchName",
                      },
                    ]}
                  />
                </SmallReportTableStyled>
              </Collapse>

              <Collapse title={t("Learn More")}>
                <Trans i18nKey="Sites - learn more">
                  <p>
                    ℹ️ Overview: This report shows the number of dive sites
                    within this plan.
                  </p>
                  <p>
                    🗺️ Source Data: The data comes from the dive sites dataset
                    which contains information about sampling dive sites across
                    Fiji.
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
