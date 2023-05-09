
import { useD3 } from './hooks/useD3';
import React from 'react';
import * as d3 from 'd3';

export default function Heatmap({ data, rowKey, colKey, valKey }) {

  const ref = useD3(
    (container) => {

      data.forEach(d => d.date = new Date(`${d[colKey]}-01T00:00:00`));

      // Labels of row and columns
      const cols = [...new Set(data.map((d) => d.date))];

      // Generate values for each month in the range available in the data
      const filledCols = d3.scaleTime()
        .domain(d3.extent(cols))
        .ticks(d3.timeMonth);

      const rows = [...new Set(data.map((d) => d[rowKey]))];
      rows.sort();

      const squareSize = 40;
      const plotWidth = (filledCols.length + 1) * squareSize;

      const plotHeight = rows.length * squareSize;
      const yAxisWidth = 170;
      const xAxisHeight = 20;
      const margin = 30,
        width = plotWidth + margin * 2 + yAxisWidth,
        height = plotHeight + margin * 2 + xAxisHeight * 2;

      const svg = container.style("height", `${height}px`)
        .select(".horizontalScrollContainer")
        .style("width", "500px")
        .style("left", `${yAxisWidth + margin + 1}px`)
        .select("svg.main")
        .attr("width", plotWidth)
        .attr("height", plotHeight + xAxisHeight*2);

      const plotArea = svg.select(".plot-area")
        .attr("transform", `translate(0, 0)`);

      // Build x band scale to determine square layout
      const xBand = d3.scaleBand()
        .range([0, plotWidth])
        .domain(filledCols)
        .padding(0.05);

      const xAxisTickFormat = (value, i) => {
        return i % 3 === 2 ? d3.timeFormat("%b %Y")(value) : "";
      };

      // Create sticky x axis at the top
      container.select(".stickyXAxisContainer")
        .style("top", `0px`)
        .select("svg")
        .attr("width", plotWidth)
        .attr("height", xAxisHeight + margin)
        .style("top", "0px")
        .select(".x-axis.top")
        .attr("transform", `translate(0, ${xAxisHeight - 2 + margin})`)
        .call(d3.axisTop(xBand)
          .tickFormat(xAxisTickFormat)
        );
      container.select(".stickyXAxisContainer")
        .select("svg")
        .select("rect.background")
        .attr("width", plotWidth)
        .attr("height", xAxisHeight + margin)
        .attr("fill", "#fff");

      // Create x axis at the bottom
      svg.select(".x-axis.bottom")
        .attr("transform", `translate(0, ${plotHeight})`)
        .call(d3.axisBottom(xBand)
          .tickFormat(xAxisTickFormat)
        );

      // Build y scales and axis:
      const y = d3.scaleBand()
        .range([plotHeight, 0])
        .domain(rows.reverse())
        .padding(0.05);
      container.select(".yAxisContainer")
        .select("svg")
        .attr("width", margin + yAxisWidth + 2)
        .attr("height", height)
        .style("position", "relative")
        .style("top", `${xAxisHeight + margin}px`)
        .select(".y-axis")
        .call(d3.axisLeft(y))
        .attr("transform", `translate(${margin + yAxisWidth}, 0)`);

      const values = data.map((d) => d[valKey]);
      const max = d3.max(values);

      // Build color scale
      const myColor = d3.scaleLinear()
        .range(["#eee", "#000"])
        .domain([0, max]);

      // create a tooltip
      var tooltip = container.select(".tooltip")


      // Three function that change the tooltip when user hover / move / leave a cell
      var mouseover = function (e, d) {
        tooltip.style("display", "block")
      };
      var mousemove = function (e, d) {
        tooltip
          .html(`${d[rowKey]}<br>${d[colKey]}<br><b>${d[valKey]}`)
          .style("left", `${xBand(d.date) + margin + yAxisWidth + 0.5 * squareSize}px`)
          .style("top", (y(d[rowKey]) - squareSize) + "px");
      };
      var mouseleave = function (e, d) {
        tooltip.style("display", "none")
      }

      plotArea.selectAll()
        .data(data)
        .join("rect")
        .attr("x", (d) => xBand(d.date))
        .attr("y", (d) => y(d[rowKey]))
        .attr("width", xBand.bandwidth())
        .attr("height", y.bandwidth())
        .style("fill", function (d) { return myColor(d[valKey]) })
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave)
        .exit().remove();

        const horizontalScrollContainerEl = container.select(".horizontalScrollContainer").node();
        horizontalScrollContainerEl.scrollLeft = horizontalScrollContainerEl.scrollWidth;
    },
    []
  );

  return (
    <div ref={ref} className="container">
      <div className='yAxisContainer'>
        <svg>
          <g className="y-axis" />
        </svg>
      </div>
      <div className="horizontalScrollContainer">
        <div className="stickyXAxisContainer">
          <svg>
            <rect className='background'></rect>
            <g className="x-axis top" />
          </svg>
        </div>
        <svg className="main">
          <g className="plot-area" />
          <g className="x-axis bottom" />
        </svg>
      </div>
      <div className="tooltip"></div>
    </div>
  );
}

const yearMonthToDate = (yearMonth) => {
  return new Date(yearMonth);
}