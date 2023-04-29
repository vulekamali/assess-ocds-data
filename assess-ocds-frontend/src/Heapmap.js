import { useD3 } from './hooks/useD3';
import React from 'react';
import * as d3 from 'd3';

function Heatmap({ data, rowKey, colKey, valKey }) {
  console.log([data.length]);
  const ref = useD3(
    (svg) => {

      // Labels of row and columns
      const cols = [...new Set(data.map((d) => d[colKey]))];
      const rows = [...new Set(data.map((d) => d[rowKey]))];
      cols.sort();
      rows.sort();

      const squareSize = 40;
      const plotWidth = cols.length * squareSize;
      const plotHeight = rows.length * squareSize;
      const margin = { top: 30, right: 30, bottom: 30, left: 200 },
        width = plotWidth - margin.left - margin.right,
        height = plotHeight - margin.top - margin.bottom;

      svg.attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

      const plotArea = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`)
        .attr("class", "plotArea");


      // Build X scales and axis:
      const x = d3.scaleBand()
        .range([0, plotWidth])
        .domain(cols);

      svg.append("g")
        .attr("transform", `translate(0, ${plotHeight})`)
        .attr("class", "xAxis")
        .call(d3.axisBottom(x))

      // Build y scales and axis:
      const y = d3.scaleBand()
        .range([plotHeight, 0])
        .domain(rows);

      svg.append("g")
        .attr("class", "yAxis")
        .call(d3.axisLeft(y));

      const values = data.map((d) => d[valKey]);
      const max = d3.max(values);

      // Build color scale
      const myColor = d3.scaleLinear()
        .range(["#eee", "#000"])
        .domain([0, max])

      plotArea.selectAll()
        .data(data, function (d) { return d[colKey] + ':' + d[rowKey]; })
        .join("rect")
        .attr("x", function (d) { return x(d[colKey]) })
        .attr("y", function (d) { return y(d[rowKey]) })
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .style("fill", function (d) { return myColor(d[valKey]) });

    },
    [data.length]
  );

  return (
    <svg
      ref={ref}
      style={{}}
    >
    </svg>
  );
}

export default Heatmap;