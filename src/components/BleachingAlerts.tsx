import React, { useRef, useEffect } from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  Collapse,
  LayerToggle,
  ReportError,
  ResultsCard,
  ToolbarCard,
  useSketchProperties,
} from "@seasketch/geoprocessing/client-ui";
import { ReportResult } from "@seasketch/geoprocessing/client-core";
import projectClient from "../../project/projectClient.js";
import * as d3 from "d3";

const displayMap: Record<string, string> = {
  0: "No Stress",
  1: "Bleaching Watch",
  2: "Bleaching Warning",
  3: "Bleaching Alert Level 1",
  4: "Bleaching Alert Level 2",
  5: "Bleaching Alert Level 3",
  6: "Bleaching Alert Level 4",
  7: "Bleaching Alert Level 5",
};

const colorMap: Record<string, string> = {
  0: "#C8FAFA",
  1: "#FFF000",
  2: "#FAAA0A",
  3: "#F00000",
  4: "#960000",
  5: "#A05024",
  6: "#F000F0",
  7: "#6E006E",
};

interface PieChartProps {
  data: { classId: string; value: number; display: string; color: string }[];
  width?: number;
  height?: number;
}

const BleachingAlertsPieChart: React.FC<PieChartProps> = ({
  data,
  width = 250,
  height = 250,
}) => {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!data || data.length === 0) return;
    const radius = 110;
    d3.select(ref.current).selectAll("*").remove();

    const svg = d3
      .select(ref.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    // Pie generator
    const pie = d3.pie<(typeof data)[0]>().value((d) => d.value);

    // Arc generator
    const arc = d3
      .arc<d3.PieArcDatum<(typeof data)[0]>>()
      .innerRadius(0)
      .outerRadius(radius);

    // Pie chart
    svg
      .selectAll("path")
      .data(pie(data))
      .enter()
      .append("path")
      .attr("d", arc)
      .attr("fill", (d) => d.data.color)
      .attr("stroke", "#fff")
      .attr("stroke-width", 3)
      .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.1))");

    // Percentage labels
    svg
      .selectAll("text")
      .data(pie(data))
      .enter()
      .append("text")
      .attr("transform", (d) => `translate(${arc.centroid(d)})`)
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .style("font-size", "14px")
      .style("font-weight", "600")
      .style("fill", "#fff")
      .text((d) => {
        const percentage = Math.round(
          (d.value / d3.sum(data, (d) => d.value)) * 100,
        );
        return percentage > 0 ? percentage + "%" : "";
      });
  }, [data, width, height]);

  // Create legend data with all alert levels (including those with 0%)
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const allAlertLevels = Object.keys(displayMap).map((classId) => {
    const existingData = data.find((d) => d.classId === classId);
    const value = existingData ? existingData.value : 0;
    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

    return {
      classId,
      value,
      display: displayMap[classId],
      color: colorMap[classId],
      percentage,
    };
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "15px",
        margin: "20px 0",
        maxWidth: "450px",
      }}
    >
      {/* Pie Chart */}
      <div style={{ flex: "0 0 auto" }}>
        <svg ref={ref} style={{ width: width, height: height }} />
      </div>

      {/* Legend */}
      <div
        style={{
          flex: "1",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          fontSize: "12px",
          minWidth: "140px",
        }}
      >
        {allAlertLevels.map((item) => (
          <div
            key={item.classId}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "4px 6px",
              borderRadius: "4px",
              backgroundColor: item.value > 0 ? "#f8f9fa" : "#f1f3f4",
              opacity: item.value > 0 ? 1 : 0.6,
            }}
          >
            <div
              style={{
                width: "12px",
                height: "12px",
                backgroundColor: item.color,
                borderRadius: "50%",
                border: "2px solid #fff",
                boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontWeight: item.value > 0 ? "500" : "400",
                flex: "1",
                fontSize: "11px",
              }}
            >
              {item.display}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Bleaching Alerts component
 */
export const BleachingAlerts: React.FunctionComponent<{ printing: boolean }> = (
  props,
) => {
  const { t } = useTranslation();

  // Labels
  const titleLabel = t("Bleaching Alert Areas (2024)");
  const mapLabel = t("Show On Map");
  const metricGroup = projectClient.getMetricGroup("bleachingAlerts");

  const [{ id }] = useSketchProperties();

  return (
    <div style={{ breakInside: "avoid" }}>
      <ResultsCard
        title={titleLabel}
        functionName="bleachingAlerts"
        useChildCard
      >
        {(data: ReportResult) => {
          // Filter out metrics with zero values and prepare data for pie chart
          const pieData = data.metrics
            .filter((m) => m.value > 0 && m.sketchId === id)
            .map((m) => ({
              classId: m.classId!,
              value: m.value,
              display: displayMap[m.classId!],
              color: colorMap[m.classId!],
            }));

          return (
            <ToolbarCard
              title={titleLabel}
              items={
                <LayerToggle
                  label={mapLabel}
                  layerId={metricGroup.layerId}
                  simple
                />
              }
            >
              <ReportError>
                <p>
                  <Trans i18nKey="BleachingAlerts 1">
                    The following figure shows the area breakdown of maximum
                    bleaching alert levels in your area of interest in 2024.
                  </Trans>
                </p>

                {pieData.length > 0 ? (
                  <BleachingAlertsPieChart data={pieData} />
                ) : (
                  <p
                    style={{
                      color: "#888",
                      fontStyle: "italic",
                      margin: "20px 0",
                    }}
                  >
                    No bleaching alert data in area of interest
                  </p>
                )}

                <Collapse
                  title={t("Learn More")}
                  key={props.printing + "BleachingAlerts Learn More Collapse"}
                  collapsed={!props.printing}
                >
                  <Trans i18nKey="BleachingAlerts - learn more">
                    <p>
                      ℹ️ Overview: The NOAA Coral Reef Watch (CRW) coral
                      bleaching Bleaching Alert Area (BAA) values are coral
                      bleaching heat stress levels. In the annual product, each
                      pixel is given its maximum alert warning from 2024.
                    </p>
                    <img
                      src="https://coralreefwatch.noaa.gov/product/5km/tutorial/media/baa_bleaching_alert_levels_updated_20240201.png"
                      alt="NOAA Coral Reef Watch Bleaching Alert Levels"
                      style={{
                        maxWidth: "100%",
                        height: "auto",
                        margin: "20px 0",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                      }}
                    />
                    <p>🗺️ Source Data: NOAA Coral Reef Watch</p>
                    <p>
                      📈 Report: This report summarizes the varying Bleaching
                      Alert Areas within the area of interest.
                    </p>
                  </Trans>
                </Collapse>
              </ReportError>
            </ToolbarCard>
          );
        }}
      </ResultsCard>
    </div>
  );
};
