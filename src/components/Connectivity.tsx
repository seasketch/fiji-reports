import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  ReportError,
  ResultsCard,
  useSketchProperties,
} from "@seasketch/geoprocessing/client-ui";
import { select, scaleLinear, extent, geoTransform, geoPath, line } from "d3";
import {
  Feature,
  FeatureCollection,
  LineString,
  MultiPolygon,
  Polygon,
  Sketch,
} from "@seasketch/geoprocessing/client-core";
import { bbox, featureCollection } from "@turf/turf";
import landData from "../../data/bin/landShrunk.01.json" with { type: "json" };
import { styled } from "styled-components";

interface ConnectivityMapProps {
  sketch: Sketch<Polygon | MultiPolygon>[];
  paths: {
    path: Feature<LineString>;
    distance: number;
  }[];
}

export const Connectivity: React.FunctionComponent<any> = (props) => {
  const { t } = useTranslation();
  const [{ isCollection }] = useSketchProperties();
  const titleLabel = t("Connectivity");

  return !isCollection ? (
    <></>
  ) : (
    <ReportError>
      <ResultsCard title={titleLabel} functionName="connectivity">
        {(data: ConnectivityMapProps) => (
          <ConnectivityMap sketch={data.sketch} paths={data.paths} />
        )}
      </ResultsCard>
    </ReportError>
  );
};

const Container = styled.div`
  position: relative;
`;

const colors = {
  link: "#6C7282",
  landFill: "#f2f2f2",
  landStroke: "#aaa",
  mpaFill: "#d8ebf7",
  mpaStroke: "#608ba6",
};

const Tooltip = styled.div`
  position: absolute;
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid ${colors.link};
  border-radius: 8px;
  padding: 5px 10px;
  font-size: 12px;
  text-align: center;
  color: #333;
  pointer-events: none;
  visibility: hidden;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition:
    visibility 0.2s,
    top 0.2s,
    left 0.2s;
`;

export const ConnectivityMap: React.FC<ConnectivityMapProps> = ({
  sketch,
  paths,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const svg = select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 430;
    const height = calcHeight(featureCollection(sketch), width);
    svg.attr("width", width).attr("height", height);

    const nodes = sketch.flatMap((sk) =>
      sk.geometry.type === "Polygon"
        ? sk.geometry.coordinates.flat(1)
        : sk.geometry.coordinates.flat(2),
    );
    const [xMin, xMax] = extent(nodes, (d: number[]) => d[0]) as [
      number,
      number,
    ];
    const [yMin, yMax] = extent(nodes, (d: number[]) => d[1]) as [
      number,
      number,
    ];
    const xPad = (xMax - xMin) * 0.1;
    const yPad = (yMax - yMin) * 0.1;

    const xScale = scaleLinear()
      .domain([xMin - xPad, xMax + xPad])
      .range([0, width]);
    const yScale = scaleLinear()
      .domain([yMin - yPad, yMax + yPad])
      .range([height, 0]);

    const projection = geoTransform({
      point(x, y) {
        // @ts-ignore
        this.stream.point(xScale(x), yScale(y));
      },
    });
    const pathGen = geoPath().projection(projection);

    // Land
    svg
      .append("g")
      .selectAll("path")
      .data(landData.features)
      .enter()
      .append("path")
      .attr("d", pathGen as any)
      .attr("fill", colors.landFill)
      .attr("stroke", colors.landStroke)
      .attr("stroke-width", 1);

    // Tooltip
    const tooltip = select(tooltipRef.current);
    const showTooltip = (text: string) =>
      tooltip.text(text).style("visibility", "visible");
    const moveTooltip = (e: MouseEvent) => {
      const { left, top } = svgRef.current!.getBoundingClientRect();
      tooltip
        .style("left", `${e.clientX - left + 10}px`)
        .style("top", `${e.clientY - top + 10}px`);
    };
    const hideTooltip = () => tooltip.style("visibility", "hidden");

    // Paths
    const overlay = svg.append("g");
    paths.forEach(({ path, distance }) => {
      overlay
        .append("path")
        .attr(
          "d",
          line()(
            path.geometry.coordinates.map(([x, y]: number[]) => [
              xScale(x),
              yScale(y),
            ]),
          ) as string,
        )
        .attr("fill", "none")
        .attr("stroke", colors.link)
        .attr("stroke-width", 3)
        .on("mouseover", () => showTooltip(`${distance.toFixed(0)} km`))
        .on("mousemove", moveTooltip)
        .on("mouseout", hideTooltip);
    });

    // Sketches
    featureCollection(sketch).features.forEach((sk) => {
      svg
        .append("g")
        .selectAll<SVGPathElement, number[][]>("path")
        .data(
          sk.geometry.type === "Polygon"
            ? sk.geometry.coordinates
            : sk.geometry.coordinates.flat(),
        )
        .enter()
        .append("path")
        .attr(
          "d",
          (coords: number[][]) =>
            line()(coords.map(([x, y]) => [xScale(x), yScale(y)])) as string,
        )
        .attr("fill", colors.mpaFill)
        .attr("stroke", colors.mpaStroke)
        .attr("stroke-width", 2)
        .attr("stroke-linejoin", "round")
        .on("mouseover", () => showTooltip(sk.properties.name))
        .on("mousemove", moveTooltip)
        .on("mouseout", hideTooltip);
    });
  }, [sketch, paths]);

  return (
    <Container>
      <svg ref={svgRef} />
      <Tooltip ref={tooltipRef} />
    </Container>
  );
};

function calcHeight(
  featureCollection: FeatureCollection<Polygon | MultiPolygon>,
  fixedWidth: number = 430,
): number {
  const [minX, minY, maxX, maxY] = bbox(featureCollection);
  const bboxWidth = maxX - minX;
  const bboxHeight = maxY - minY;
  const aspectRatio = bboxWidth / bboxHeight;
  return fixedWidth / aspectRatio;
}
