import React from "react";
import {
  ResultsCard,
  KeySection,
  Collapse,
  ToolbarCard,
  useSketchProperties,
  LayerToggle,
  VerticalSpacer,
  SketchClassTable,
  ReportError,
  DataDownload,
} from "@seasketch/geoprocessing/client-ui";
import { BathymetryResults } from "../functions/bathymetry.js";
import { Trans, useTranslation } from "react-i18next";
import projectClient from "../../project/projectClient.js";
import { MetricGroup } from "@seasketch/geoprocessing";
import { Download } from "@styled-icons/bootstrap/Download";

const formatDepth = (val: number) => {
  if (!val || val > 0) return "0m";
  const baseVal = Math.round(Math.abs(val));
  return `-${baseVal}m`;
};

export const Depth: React.FunctionComponent<{ printing: boolean }> = (
  props,
) => {
  const { t } = useTranslation();
  const [{ isCollection }] = useSketchProperties();
  const mg = projectClient.getMetricGroup("bathymetry", t);
  const title = t("Depth");
  const mapLabel = t("Show On Map");

  return (
    <div style={{ breakInside: "avoid" }}>
      <ResultsCard title={title} functionName="bathymetry" useChildCard>
        {(data: BathymetryResults[]) => {
          const overallStats = isCollection
            ? data.find((s) => s.isCollection)
            : data[0];

          return (
            <ReportError>
              <ToolbarCard
                title={title}
                items={
                  <>
                    <LayerToggle layerId={mg.layerId} label={mapLabel} simple />
                    <DataDownload
                      filename="Depth"
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
                <VerticalSpacer />
                <KeySection
                  style={{ display: "flex", justifyContent: "space-around" }}
                >
                  <span>
                    {t("Min")}:{" "}
                    <b>
                      {overallStats ? formatDepth(overallStats.max) : t("N/A")}
                    </b>
                  </span>
                  {overallStats && overallStats?.mean ? (
                    <span>
                      {t("Avg")}: <b>{formatDepth(overallStats.mean)}</b>
                    </span>
                  ) : (
                    <></>
                  )}
                  <span>
                    {t("Max")}:{" "}
                    <b>
                      {overallStats ? formatDepth(overallStats.min) : t("N/A")}
                    </b>
                  </span>
                </KeySection>

                {isCollection && (
                  <Collapse
                    title={t("Show by MPA")}
                    key={props.printing + "Depth MPA Collapse"}
                    collapsed={!props.printing}
                  >
                    {genBathymetryTable(data, mg)}
                  </Collapse>
                )}

                <Collapse
                  title={t("Learn More")}
                  key={props.printing + "Depth Learn More Collapse"}
                  collapsed={!props.printing}
                >
                  <Trans i18nKey="Depth Card - Learn more">
                    <p>🗺️ Source Data: GEBCO 2024</p>
                    <p>
                      📈 Report: Calculates the minimum, average, and maximum
                      ocean depth within the selected MPA(s).
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

export const genBathymetryTable = (
  data: BathymetryResults[],
  mg: MetricGroup,
) => {
  const sketchMetrics = data.filter((s) => !s.isCollection);

  const rows = sketchMetrics.map((metric) => ({
    sketchName: metric.sketchName!,
    min: formatDepth(metric.max),
    mean: formatDepth(metric.mean!),
    max: formatDepth(metric.min),
  }));

  return <SketchClassTable rows={rows} metricGroup={mg} />;
};
