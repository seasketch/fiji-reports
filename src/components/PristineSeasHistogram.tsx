import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { HistogramData } from "../functions/pristineSeas.js";

interface PristineSeasHistogramProps {
  data: HistogramData[];
  width?: number;
  height?: number;
}

export const PristineSeasHistogram: React.FC<PristineSeasHistogramProps> = ({
  data,
  width = 450,
  height = 200,
}) => {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    const margin = { top: 20, right: 20, bottom: 50, left: 20 };
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
      .scaleBand()
      .domain(data.map((d) => d.value.toString()))
      .range([0, w])
      .padding(0.1);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.count) ?? 0])
      .nice()
      .range([h, 0]);

    // Create a linear scale for the x-axis ticks (0 to 1)
    const xLinear = d3.scaleLinear().domain([0, 1]).range([0, w]);

    // X axis - show ticks at every 0.1
    svg
      .append("g")
      .attr("transform", `translate(0,${h})`)
      .call(
        d3
          .axisBottom(xLinear)
          .ticks(10)
          .tickFormat((d) => Number(d).toFixed(1)),
      )
      .selectAll("text")
      .style("text-anchor", "middle");

    // X axis label
    svg
      .append("text")
      .attr("transform", `translate(${w / 2},${h + margin.bottom - 5})`)
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Triple-Benefit Score");

    // Bars
    svg
      .selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => x(d.value.toString()) ?? 0)
      .attr("y", (d) => y(d.count))
      .attr("width", x.bandwidth())
      .attr("height", (d) => h - y(d.count))
      .attr("fill", "#A8D5F2")
      .attr("rx", 4)
      .attr("ry", 4)
      .attr("opacity", 0.9);
  }, [data, width, height]);

  return <svg ref={ref}></svg>;
};
