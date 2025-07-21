import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

export interface GfwPercentDatum {
  year: number;
  value: number;
}

interface GfwLineChartProps {
  data: GfwPercentDatum[];
  width?: number;
  height?: number;
}

export const GfwLineChart: React.FC<GfwLineChartProps> = ({
  data,
  width = 450,
  height = 300,
}) => {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!data || data.length === 0) return;
    const margin = { top: 10, right: 30, bottom: 40, left: 50 };
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
    // Calculate yMax as the greater of 1% or the max data value * 100
    const computedMax = d3.max(data, (d) => d.value) ?? 0.01;
    const yMax = Math.max(computedMax * 100, 1);
    const y = d3.scaleLinear().domain([0, yMax]).nice().range([h, 0]);

    // Line generator
    const line = d3
      .line<GfwPercentDatum>()
      .x((d) => x(d.year))
      .y((d) => y(d.value * 100));

    // Draw line
    svg
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#0073BC")
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

    // Axes
    const years = data.map((d) => d.year);
    svg
      .append("g")
      .attr("transform", `translate(0,${h})`)
      .call(
        d3.axisBottom(x).tickValues(years).tickFormat(d3.format("d")) as any,
      )
      .selectAll("text")
      .style("font-size", "12px");
    svg.append("g").call(d3.axisLeft(y).tickFormat((d) => `${d}%`));

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
      .attr("y", -margin.left + 10)
      .attr("fill", "#333")
      .style("font-size", "14px")
      .text("% Fishing Effort");

    // Draw dots
    svg
      .append("g")
      .attr("class", "dots-group")
      .selectAll(".dot")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", (d) => x(d.year))
      .attr("cy", (d) => y(d.value * 100))
      .attr("r", 4)
      .attr("fill", "#0073BC")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        if (tooltip && ref.current && parent) {
          tooltip.style.display = "block";
          tooltip.innerHTML = `<strong>${d.year}</strong>: ${(d.value * 100).toFixed(2)}%`;
          d3.select(this).attr("r", 7);
          const cx = x(d.year);
          const cy = y(d.value * 100);
          const left = margin.left + cx - tooltip.offsetWidth / 2;
          const top = margin.top + cy - tooltip.offsetHeight - 10;
          tooltip.style.left = `${left}px`;
          tooltip.style.top = `${top}px`;
          // Show LayerToggle if layerId exists
          // setLayerToggleState({
          //   visible: true,
          //   x: margin.left + cx + 20, // offset to the right of the dot
          //   y: margin.top + cy - 20, // slightly above the dot
          //   layerId: d.layerId,
          // });
        }
      })
      .on("mousemove", function (event, d) {
        if (tooltip && ref.current && parent) {
          const cx = x(d.year);
          const cy = y(d.value * 100);
          const left = margin.left + cx - tooltip.offsetWidth / 2;
          const top = margin.top + cy - tooltip.offsetHeight - 10;
          tooltip.style.left = `${left}px`;
          tooltip.style.top = `${top}px`;
          // Move LayerToggle with mouse
          // if (d.layerId) {
          //   setLayerToggleState((s) => ({
          //     ...s,
          //     x: margin.left + cx + 20,
          //     y: margin.top + cy - 20,
          //   }));
          // }
        }
      })
      .on("mouseout", function () {
        if (tooltip) tooltip.style.display = "none";
        d3.select(this).attr("r", 4);
        // setLayerToggleState((s) => ({ ...s, visible: false }));
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
