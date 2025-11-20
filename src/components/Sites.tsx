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
  Skeleton,
} from "@seasketch/geoprocessing/client-ui";
import { ReportResult } from "@seasketch/geoprocessing/client-core";
import { Download } from "@styled-icons/bootstrap/Download";

interface SiteReportResult extends ReportResult {
  stations: {
    station_id: string;
    province: string;
    sketchName: string;
  }[];
}

/**
 * Dive Sites component
 */
export const Sites: React.FunctionComponent<{ printing: boolean }> = (
  props,
) => {
  const { t } = useTranslation();
  const titleLabel = t("Dive Sites");

  return (
    <div style={{ breakInside: "avoid" }}>
      <ResultsCard title={titleLabel} functionName="sites" useChildCard>
        {(result: SiteReportResult) => {
          if (!result || !result.metrics || !Array.isArray(result.metrics))
            return <Skeleton />;

          // Get metric values
          const stations =
            result.metrics.find((m) => m.metricId === "stations")?.value || 0;
          const provinces =
            result.metrics.find((m) => m.metricId === "provinces")?.value || 0;

          return (
            <ReportError>
              <ToolbarCard
                title={titleLabel}
                items={
                  <DataDownload
                    filename="Sites"
                    data={result.metrics}
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
                    {stations === 1 ? "" : "s"} in{" "}
                    <Pill>{provinces.toString()}</Pill> province
                    {provinces === 1 ? "" : "s"}.
                  </Trans>
                </p>

                <LayerToggle
                  layerId="pdZ8qAqGI"
                  label={t("Show Dive Sites on Map")}
                />

                <Collapse
                  title={t("Dive Sites")}
                  key={props.printing + "Sites Dive Sites Collapse"}
                  collapsed={!props.printing}
                >
                  <SmallReportTableStyled>
                    <Table
                      data={result.stations}
                      columns={[
                        {
                          Header: t("Dive Site"),
                          accessor: "station_id",
                        },
                        {
                          Header: t("Province"),
                          accessor: "province",
                        },
                        {
                          Header: t("Within Sketch"),
                          accessor: "sketchName",
                        },
                      ]}
                    />
                  </SmallReportTableStyled>
                </Collapse>

                <Collapse
                  title={t("Learn More")}
                  key={props.printing + "Sites Learn More Collapse"}
                  collapsed={!props.printing}
                >
                  <Trans i18nKey="Sites - learn more">
                    <p>
                      ℹ️ Overview: This report shows the number of dive sites
                      within this plan.
                    </p>
                    <p>
                      🗺️ Source Data: The data comes from the dive sites dataset
                      which contains information about sampling dive sites
                      across Fiji.
                    </p>
                  </Trans>
                </Collapse>
              </ToolbarCard>
            </ReportError>
          );
        }}
      </ResultsCard>
    </div>
  );
};
