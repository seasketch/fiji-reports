import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

export interface MangrovesLineDatum {
  year: number;
  area: number;
}

interface MangrovesLineChartProps {
  data: MangrovesLineDatum[];
  width?: number;
  height?: number;
}

export const MangrovesLineChart: React.FC<MangrovesLineChartProps> = ({
  data,
  width = 450,
  height = 300,
}) => {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!data || data.length === 0) return;
    const margin = { top: 30, right: 30, bottom: 40, left: 60 };
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
      .domain(d3.extent(data, (d) => d.year) as [number, number])
      .range([0, w]);
    const minArea = 0;
    const maxArea = d3.max(data, (d) => d.area) ?? 1;
    // Add a small buffer below the minimum for clarity
    const yMin = minArea;
    const y = d3.scaleLinear().domain([yMin, maxArea]).nice().range([h, 0]);

    // Line generator
    const line = d3
      .line<MangrovesLineDatum>()
      .x((d) => x(d.year))
      .y((d) => y(d.area));

    // Draw line
    svg.selectAll(".mangrove-line").remove();
    svg.selectAll(".mangrove-dot").remove();

    svg
      .append("path")
      .datum(data)
      .attr("class", "mangrove-line")
      .attr("fill", "none")
      .attr("stroke", "#00A65A")
      .attr("stroke-width", 3)
      .attr("d", line);

    // Draw dots and tooltips
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

    // Draw dots with tooltip events
    svg
      .selectAll(".mangrove-dot")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "mangrove-dot")
      .attr("cx", (d) => x(d.year))
      .attr("cy", (d) => y(d.area))
      .attr("r", 4)
      .attr("fill", "#00A65A")
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .on("mouseover", function (event, d) {
        if (tooltip && ref.current) {
          tooltip.style.display = "block";
          tooltip.innerHTML = `<b>Year:</b> ${d.year}<br/><b>Area:</b> ${d.area.toFixed(2)} ha`;
          d3.select(this).attr("fill", "#007a3d");
        }
      })
      .on("mousemove", function (event, d) {
        if (tooltip && ref.current) {
          const cx = x(d.year);
          const cy = y(d.area);
          const left = margin.left + cx - tooltip.offsetWidth / 2;
          const top = margin.top + cy + 120;
          tooltip.style.left = `${left}px`;
          tooltip.style.top = `${top}px`;
        }
      })
      .on("mouseout", function () {
        if (tooltip) tooltip.style.display = "none";
        d3.select(this).attr("fill", "#00A65A");
      });

    // Calculate x-axis ticks every 4 years
    const years = data.map((d) => d.year);
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    const tickStart = Math.ceil(minYear / 4) * 4;
    const tickEnd = Math.floor(maxYear / 4) * 4;
    const xTicks: number[] = [];
    for (let y = tickStart; y <= tickEnd; y += 4) {
      xTicks.push(y);
    }

    // Render y axis first (so dots/line are above it)
    svg.append("g").call(d3.axisLeft(y));

    // Render x axis and labels last (so they are above line, but below dots)
    svg
      .append("g")
      .attr("transform", `translate(0,${h})`)
      .call(
        d3
          .axisBottom(x)
          .tickValues(xTicks.length > 0 ? xTicks : years)
          .tickFormat(d3.format("d")) as any,
      )
      .selectAll("text")
      .style("font-size", "12px");

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
      .attr("y", -margin.left + 18)
      .attr("fill", "#333")
      .style("font-size", "14px")
      .text("Mangrove Area (ha)");
  }, [data, width, height]);

  return <svg ref={ref} />;
};
