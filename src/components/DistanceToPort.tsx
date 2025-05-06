import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Collapse,
  KeySection,
  ReportError,
  ReportTableStyled,
  ResultsCard,
  Table,
  useSketchProperties,
  VerticalSpacer,
} from "@seasketch/geoprocessing/client-ui";
import { select, scaleLinear, extent, geoTransform, geoPath, line } from "d3";
import {
  FeatureCollection,
  MultiPolygon,
  Point,
  Polygon,
  Sketch,
} from "@seasketch/geoprocessing/client-core";
import { bbox, featureCollection } from "@turf/turf";
import landData from "../../data/bin/landShrunk.01.json" with { type: "json" };
import ports from "../functions/ports.json" with { type: "json" };
import { styled } from "styled-components";

interface DistanceToPortMapProps {
  sketch: Sketch<Polygon | MultiPolygon>[];
  portDistances: {
    sketchId: string;
    distance: number;
    port: string;
    path: any; // This is the path data returned by findShortestPath
  }[];
}

export const DistanceToPort: React.FunctionComponent<any> = (props) => {
  const { t } = useTranslation();
  const [{ isCollection }] = useSketchProperties();
  const titleLabel = t("Distance To Port");

  return (
    <ReportError>
      <ResultsCard title={titleLabel} functionName="distanceToPort">
        {(data: DistanceToPortMapProps) => {
          const furthestMpa = data.portDistances.reduce((prev, current) =>
            prev.distance > current.distance ? prev : current,
          );

          return (
            <>
              Reducing the distance to the nearest port can help improve
              enforcibility and compliance.
              <VerticalSpacer />
              {!isCollection ? (
                <KeySection>
                  This MPA is{" "}
                  <b>~{data.portDistances[0].distance.toFixed(0)} km</b> from
                  the nearest port <b>{data.portDistances[0].port}</b>
                </KeySection>
              ) : (
                <KeySection>
                  The furthest MPA,{" "}
                  <b>
                    {
                      data.sketch.find(
                        (sk) => sk.properties.id === furthestMpa.sketchId,
                      )?.properties.name
                    }
                  </b>
                  , is <b>~{furthestMpa.distance.toFixed(0)} km</b> from the
                  port <b>{furthestMpa.port}</b>.
                </KeySection>
              )}
              <Collapse title="Show Map">
                <DistanceToPortMap
                  sketch={data.sketch}
                  portDistances={data.portDistances}
                />
              </Collapse>
              <Collapse title="Show by MPA">{genDistanceTable(data)}</Collapse>
            </>
          );
        }}
      </ResultsCard>
    </ReportError>
  );
};

const Container = styled.div`
  position: relative;
`;

const colors = {
  link: "rgba(0, 0, 0, 0.5)",
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

export const DistanceToPortMap: React.FC<DistanceToPortMapProps> = ({
  sketch,
  portDistances,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const svg = select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 430;
    const height = calcHeight(
      featureCollection(sketch),
      ports as FeatureCollection<Point>,
      width,
    );
    svg.attr("width", width).attr("height", height);

    const nodes = sketch.flatMap((sk) =>
      sk.geometry.type === "Polygon"
        ? sk.geometry.coordinates.flat(1)
        : sk.geometry.coordinates.flat(2),
    );
    const portNodes = (ports as FeatureCollection<Point>).features.map(
      (port) => port.geometry.coordinates,
    );

    const allNodes = [...nodes, ...portNodes];

    const [xMin, xMax] = extent(allNodes, (d: number[]) => d[0]) as [
      number,
      number,
    ];
    const [yMin, yMax] = extent(allNodes, (d: number[]) => d[1]) as [
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

    // Land - make "unclean" to plot across antimeridian
    svg
      .append("g")
      .selectAll("path")
      .data(
        (landData as FeatureCollection<Polygon>).features.map((feature) => {
          feature.geometry.coordinates = feature.geometry.coordinates.map(
            (ring) =>
              ring.map(
                ([x, y]) =>
                  [x < -150 ? x + 360 : x > 180 ? x - 360 : x, y] as [
                    number,
                    number,
                  ],
              ),
          );
          return feature;
        }),
      )
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

    // Paths (distance to closest port)
    const overlay = svg.append("g");
    portDistances.forEach(({ path, distance, port }) => {
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
        .attr("stroke-dasharray", "4 4")
        .on("mouseover", () =>
          showTooltip(`Distance to ${port}: ${distance.toFixed(0)} km`),
        )
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

    // Ports
    (ports as FeatureCollection<Point>).features.forEach((port) => {
      const [x, y] = port.geometry.coordinates;
      svg
        .append("circle")
        .attr("cx", xScale(x))
        .attr("cy", yScale(y))
        .attr("r", 5)
        .attr("fill", "black")
        .on("mouseover", () =>
          showTooltip(`Port: ${port?.properties?.PORT_NAME}`),
        )
        .on("mousemove", moveTooltip)
        .on("mouseout", hideTooltip);
    });
  }, [sketch, portDistances]);

  return (
    <Container>
      <svg ref={svgRef} />
      <Tooltip ref={tooltipRef} />
    </Container>
  );
};

function calcHeight(
  sketches: FeatureCollection<Polygon | MultiPolygon>,
  ports: FeatureCollection<Point>,
  fixedWidth: number = 430,
): number {
  const combinedCollection = featureCollection<Point | Polygon | MultiPolygon>([
    ...sketches.features,
    ...ports.features,
  ]);
  const [minX, minY, maxX, maxY] = bbox(combinedCollection);
  const bboxWidth = maxX - minX;
  const bboxHeight = maxY - minY;
  const aspectRatio = bboxWidth / bboxHeight;
  return fixedWidth / aspectRatio;
}

export const DistanceTableStyled = styled(ReportTableStyled)`
  width: 100%;
  overflow-x: auto;
  font-size: 12px;

  th:first-child,
  td:first-child {
    min-width: 140px;
    position: sticky;
    left: 0;
    text-align: left;
    background: #efefef;
  }

  th,
  td {
    text-align: center;
    white-space: nowrap;
  }
`;

export const genDistanceTable = (data: DistanceToPortMapProps) => (
  <DistanceTableStyled>
    <Table
      columns={[
        { Header: "MPA", accessor: "sketchName" },
        {
          Header: "Distance",
          accessor: "distance",
        },
        { Header: "Port", accessor: "port" },
      ]}
      data={data.portDistances.map((d) => ({
        ...d,
        sketchName: data.sketch.find((sk) => sk.properties.id === d.sketchId)
          ?.properties.name,
        distance: String(d.distance.toFixed(1)) + " km",
      }))}
    />
  </DistanceTableStyled>
);
