import React, { useRef, useEffect } from "react";
import * as d3 from "d3";
import { DHWResults } from "../functions/dhw.js";

export interface DhwDatum {
  year: number;
  min: number | null;
  mean: number | null;
  max: number | null;
}

interface DhwLineChartProps {
  data: DhwDatum[];
  width?: number;
  height?: number;
}

export const DhwLineChart: React.FC<DhwLineChartProps> = ({
  data,
  width = 450,
  height = 300,
}) => {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Filter out data points with null values
    const validData = data.filter(
      (d) => d.min !== null && d.mean !== null && d.max !== null,
    ) as {
      year: number;
      min: number;
      mean: number;
      max: number;
    }[];

    if (validData.length === 0) return;

    const margin = { top: 30, right: 30, bottom: 40, left: 50 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    // Clear previous chart
    d3.select(ref.current).selectAll("*").remove();

    const svg = d3
      .select(ref.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const x = d3
      .scaleLinear()
      .domain(d3.extent(validData, (d) => d.year) as [number, number])
      .range([0, w]);
    const y = d3
      .scaleLinear()
      .domain([
        d3.min(validData, (d) => d.min) ?? 0,
        d3.max(validData, (d) => d.max) ?? 1,
      ])
      .nice()
      .range([h, 0]);

    // Area between min and max
    const area = d3
      .area<{ year: number; min: number; mean: number; max: number }>()
      .x((d) => x(d.year))
      .y0((d) => y(d.min))
      .y1((d) => y(d.max));

    svg
      .append("path")
      .datum(validData)
      .attr("fill", "#b3d8ff")
      .attr("opacity", 0.5)
      .attr("d", area);

    // Line generators
    const lineMin = d3
      .line<{ year: number; min: number; mean: number; max: number }>()
      .x((d) => x(d.year))
      .y((d) => y(d.min));
    const lineMean = d3
      .line<{ year: number; min: number; mean: number; max: number }>()
      .x((d) => x(d.year))
      .y((d) => y(d.mean));
    const lineMax = d3
      .line<{ year: number; min: number; mean: number; max: number }>()
      .x((d) => x(d.year))
      .y((d) => y(d.max));

    // Draw lines
    svg
      .append("path")
      .datum(validData)
      .attr("fill", "none")
      .attr("stroke", "#00A5E1")
      .attr("stroke-width", 2)
      .attr("d", lineMin);

    svg
      .append("path")
      .datum(validData)
      .attr("fill", "none")
      .attr("stroke", "#0073BC")
      .attr("stroke-width", 3)
      .attr("stroke-dasharray", "4 2")
      .attr("d", lineMean);

    svg
      .append("path")
      .datum(validData)
      .attr("fill", "none")
      .attr("stroke", "#00A5E1")
      .attr("stroke-width", 2)
      .attr("d", lineMax);

    // Axes
    svg
      .append("g")
      .attr("transform", `translate(0,${h})`)
      .call(d3.axisBottom(x).tickFormat(d3.format("d")) as any)
      .selectAll("text")
      .style("font-size", "12px");
    svg.append("g").call(d3.axisLeft(y));

    // Axis labels
    svg
      .append("text")
      .attr("text-anchor", "end")
      .attr("x", w / 2)
      .attr("y", h + margin.bottom - 5)
      .attr("fill", "#333")
      .style("font-size", "14px")
      .text("Year");
    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("x", -h / 2)
      .attr("y", -margin.left + 15)
      .attr("fill", "#333")
      .style("font-size", "14px")
      .text("Degree Heating Weeks");

    // Legend
    const legend = [
      { color: "#00A5E1", label: "Min/Max" },
      { color: "#0073BC", label: "Mean", dash: true },
    ];
    const legendItemWidth = 120;
    const legendWidth = legend.length * legendItemWidth;
    const legendOffset = (w - legendWidth) / 2;
    svg
      .selectAll(".legend")
      .data(legend)
      .enter()
      .append("g")
      .attr("class", "legend")
      .attr(
        "transform",
        (d, i) => `translate(${legendOffset + i * legendItemWidth},-15)`,
      )
      .each(function (d) {
        d3.select(this)
          .append("line")
          .attr("x1", 0)
          .attr("x2", 30)
          .attr("y1", 0)
          .attr("y2", 0)
          .attr("stroke", d.color)
          .attr("stroke-width", 3)
          .attr("stroke-dasharray", d.dash ? "4 2" : "none");
        d3.select(this)
          .append("text")
          .attr("x", 35)
          .attr("y", 5)
          .style("font-size", "13px")
          .attr("fill", "#333")
          .text(d.label);
      });

    // Draw dots and tooltips (move this after axes and legend)
    let tooltip: HTMLDivElement | null = null;
    const parent = ref.current?.parentElement;
    if (parent) {
      tooltip = document.createElement("div");
      tooltip.style.position = "absolute";
      tooltip.style.pointerEvents = "none";
      tooltip.style.background = "#fff";
      tooltip.style.border = "1px solid #ccc";
      tooltip.style.borderRadius = "4px";
      tooltip.style.padding = "4px 8px";
      tooltip.style.fontSize = "12px";
      tooltip.style.fontFamily = "'Inter', 'Segoe UI', Arial, sans-serif";
      tooltip.style.color = "#222";
      tooltip.style.boxShadow = "0 2px 8px #0002";
      tooltip.style.display = "none";
      parent.style.position = "relative";
      parent.appendChild(tooltip);
    }

    type DotDatum = {
      year: number;
      value: number;
      type: string;
      color: string;
    };
    const dotData: DotDatum[] = [];
    validData.forEach((d) => {
      dotData.push({
        year: d.year,
        value: d.min,
        type: "Min",
        color: "#00A5E1",
      });
      dotData.push({
        year: d.year,
        value: d.mean,
        type: "Mean",
        color: "#0073BC",
      });
      dotData.push({
        year: d.year,
        value: d.max,
        type: "Max",
        color: "#00A5E1",
      });
    });

    svg
      .append("g")
      .attr("class", "dots-group")
      .selectAll(".dot")
      .data(dotData)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", (d) => x(d.year))
      .attr("cy", (d) => y(d.value))
      .attr("r", 3.5)
      .attr("fill", (d) => d.color)
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.2)
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        if (tooltip && ref.current) {
          tooltip.style.display = "block";
          tooltip.innerHTML = `<strong>${d.type}</strong> (${d.year}): ${d.value.toFixed(2)}`;
          d3.select(this).attr("r", 6);
        }
      })
      .on("mousemove", function (event, d) {
        if (tooltip && ref.current) {
          const cx = x(d.year);
          const cy = y(d.value);
          const left = margin.left + cx - tooltip.offsetWidth / 2;
          const top = margin.top + cy - tooltip.offsetHeight - 10;
          tooltip.style.left = `${left}px`;
          tooltip.style.top = `${top}px`;
        }
      })
      .on("mouseout", function () {
        if (tooltip) tooltip.style.display = "none";
        d3.select(this).attr("r", 3.5);
      });

    // Clean up tooltip on unmount
    return () => {
      if (tooltip && tooltip.parentNode)
        tooltip.parentNode.removeChild(tooltip);
    };
  }, [data, width, height]);

  return (
    <div
      style={{
        background: "transparent",
        padding: 10,
        margin: "20px 0",
      }}
    >
      <svg ref={ref} style={{ width: "100%", height }} />
    </div>
  );
};
