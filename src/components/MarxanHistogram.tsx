import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

export interface MarxanHistogramData {
  rating: number;
  area: number;
}

interface MarxanHistogramProps {
  data: MarxanHistogramData[];
  average?: number;
  width?: number;
  height?: number;
}

export const MarxanHistogram: React.FC<MarxanHistogramProps> = ({
  data,
  average,
  width = 450,
  height = 200,
}) => {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Check if all areas are zero
    const totalArea = data.reduce((sum, d) => sum + d.area, 0);
    if (totalArea === 0) return;

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
      .domain(data.map((d) => d.rating.toString()))
      .range([0, w])
      .padding(0.1);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.area) ?? 0])
      .nice()
      .range([h, 0]);

    // X axis - position ticks at center of each bar
    const xAxis = svg.append("g").attr("transform", `translate(0,${h})`);

    // Add tick marks and labels for each data point
    data.forEach((d) => {
      const xPos = (x(d.rating.toString()) ?? 0) + x.bandwidth() / 2;

      // Tick line
      xAxis
        .append("line")
        .attr("x1", xPos)
        .attr("x2", xPos)
        .attr("y1", 0)
        .attr("y2", 6)
        .attr("stroke", "#000")
        .attr("opacity", 1);

      // Tick label
      xAxis
        .append("text")
        .attr("x", xPos)
        .attr("y", 9)
        .attr("dy", "0.71em")
        .attr("fill", "#000")
        .style("text-anchor", "middle")
        .style("font-size", "10px")
        .style("font-family", "sans-serif")
        .text(d.rating.toString());
    });

    // Add axis line (domain line)
    xAxis
      .append("line")
      .attr("x1", 0)
      .attr("x2", w)
      .attr("y1", 0)
      .attr("y2", 0)
      .attr("stroke", "#000")
      .attr("opacity", 1);

    // X axis label
    svg
      .append("text")
      .attr("transform", `translate(${w / 2},${h + margin.bottom - 5})`)
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Prioritization Score");

    // Bars
    svg
      .selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => x(d.rating.toString()) ?? 0)
      .attr("y", (d) => y(d.area))
      .attr("width", x.bandwidth())
      .attr("height", (d) => h - y(d.area))
      .attr("fill", "#A8D5F2")
      .attr("rx", 4)
      .attr("ry", 4)
      .attr("opacity", 0.9);

    // Draw average line if provided
    if (average !== undefined && average !== null && !isNaN(average)) {
      // Create a continuous scale for positioning the average line
      // Map from rating values to x positions (center of each bar)
      const ratingValues = data.map((d) => d.rating);
      const minRating = Math.min(...ratingValues);
      const maxRating = Math.max(...ratingValues);

      // Create positions array - center of each bar
      const positions = data.map(
        (d) => (x(d.rating.toString()) ?? 0) + x.bandwidth() / 2,
      );

      // Create linear scale for interpolation
      const xLinear = d3
        .scaleLinear()
        .domain([minRating, maxRating])
        .range([positions[0], positions[positions.length - 1]]);

      const avgX = xLinear(average);

      // Average line
      svg
        .append("line")
        .attr("x1", avgX)
        .attr("x2", avgX)
        .attr("y1", 0)
        .attr("y2", h)
        .attr("stroke", "grey")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "4,4");

      // Average label
      const labelText = `Average: ${average.toFixed(2)}`;
      const labelPadding = 10;
      const labelX = average < 5 ? avgX + labelPadding : avgX - labelPadding;
      const textAnchor = average < 5 ? "start" : "end";

      svg
        .append("text")
        .attr("x", labelX)
        .attr("y", 8)
        .attr("text-anchor", textAnchor)
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .style("fill", "grey")
        .text(labelText);
    }
  }, [data, average, width, height]);

  return <svg ref={ref}></svg>;
};
