import { useD3 } from './hooks/useD3';
import React from 'react';
import * as d3 from 'd3';

export default function Heatmap({ data, rowKey, colKey, valKey }) {

  const ref = useD3(
    (container) => {

      // Labels of row and columns
      const cols = [...new Set(data.map((d) => d[colKey]))];
      const rows = [...new Set(data.map((d) => d[rowKey]))];
      cols.sort();
      rows.sort();

      const squareSize = 40;
      const plotWidth = cols.length * squareSize;
      const plotHeight = rows.length * squareSize;
      const yAxisWidth = 170;
      const xAxisHeight = 20;
      const margin = 30,
        width = plotWidth + margin * 2 + yAxisWidth,
        height = plotHeight + margin * 2 + xAxisHeight * 2;

      const svg = container.select("svg.main")
        .attr("width", width)
        .attr("height", height);

      const plotArea = svg.select(".plot-area")
        .attr("transform", `translate(${margin + yAxisWidth}, 0)`);


      // Build X scales and axis:
      const x = d3.scaleBand()
        .range([0, plotWidth])
        .domain(cols)
        .padding(0.05);

      container.select(".stickyXAxisContainer")
        .style("top", `${margin}px`)
        .select("svg")
        .attr("width", plotWidth)
        .attr("height", xAxisHeight)
        .style("left", `${margin + yAxisWidth}px`)
        .select(".x-axis.top")
        .attr("transform", `translate(0, ${xAxisHeight - 2})`)
        .call(d3.axisTop(x));

      container.select(".stickyXAxisContainer")
        .select("svg")
        .select("rect.background")
        .attr("width", plotWidth)
        .attr("height", xAxisHeight)
        .attr("fill", "#fff");

      svg.select(".x-axis.bottom")
        .attr("transform", `translate(${margin + yAxisWidth}, ${plotHeight})`)
        .call(d3.axisBottom(x));

      // Build y scales and axis:
      const y = d3.scaleBand()
        .range([plotHeight, 0])
        .domain(rows.reverse())
        .padding(0.05);
      svg.select(".y-axis")
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
          .style("left", (x(d[colKey]) + margin + yAxisWidth + 0.5 * squareSize) + "px")
          .style("top", (y(d[rowKey]) - squareSize - 10) + "px");
      };
      var mouseleave = function (e, d) {
        tooltip.style("display", "none")
      }

      plotArea.selectAll()
        .data(data, function (d) { return d[colKey] + ':' + d[rowKey]; })
        .join("rect")
        .attr("x", function (d) { return x(d[colKey]) })
        .attr("y", function (d) { return y(d[rowKey]) })
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .style("fill", function (d) { return myColor(d[valKey]) })
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave)
        .exit().remove();


      //console.log(stickyXAxisContainer);
      const options = { transition: 240, offset: 0, ease: "ease-in-out" };
      //const unstick = makeSticky(container.node(), stickyXAxisContainer.node(), options);
    },
    []
  );

  return (
    <div ref={ref} className="container">
      <div className="stickyXAxisContainer">
        <svg>
          <rect className='background'></rect>
          <g className="x-axis top" />
        </svg>
      </div>
      <svg className="main">
        <g className="plot-area" />
        <g className="x-axis bottom" />
        <g className="y-axis" />
      </svg>
      <div className="tooltip"></div>
    </div>
  );
}

// https://observablehq.com/@mootari/sticky-positioning
function makeSticky(context, element, { transition = 75, offset = 0, ease = 'ease-in' } = {}) {
  element.style.position = 'absolute';
  element.style.transition = `top ${transition}ms ${ease}`;

  return observeViewport((top, bottom) => {
    const rc = context.getBoundingClientRect();
    const rs = element.getBoundingClientRect();
    element.style.top = clamp(0, rc.height - rs.height, top - rc.top + offset) + 'px';
  });
}

function observeViewport(callback) {
  let top = -1, bottom = -1, raf;
  const observer = new IntersectionObserver(([e]) => {
    const t = e.intersectionRect.top;
    const b = e.intersectionRect.bottom;
    if (t !== top || b !== bottom) {
      top = t;
      bottom = b;
      callback(top, bottom);
    }
    observer.unobserve(target);
    raf = requestAnimationFrame(observe);
    console.log("observed", target, t, b)

  });
  const target = document.documentElement;
  const observe = () => observer.observe(target);
  observe();

  // Disconnect callback.
  return () => {
    cancelAnimationFrame(raf);
    observer.disconnect();
  }
}

function clamp(a, b, v) {
  return v < a ? a : v > b ? b : v;
}