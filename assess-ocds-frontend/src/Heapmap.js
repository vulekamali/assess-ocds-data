import React from 'react';
import * as d3 from 'd3';
import {ScrollSync, ScrollSyncPane} from 'react-scroll-sync';

export default function Heatmap({data, rowKey, colKey, valKey}) {
    const [width, setWidth] = React.useState(0);
    const [legendHeight] = React.useState(200);

    const ref = React.useRef();

    // Resize
    React.useEffect(() => {
        const element = ref?.current;

        if (!element) return;

        const observer = new ResizeObserver((entries) => {
            entries.forEach(entry => {
                console.log("element resized", entry.contentRect.width);
                setWidth(entry.contentRect.width);
            })
        });

        observer.observe(element);

        return () => {
            // Cleanup the observer by unobserving all elements
            observer.disconnect();
        };
    }, [])

    React.useEffect(
        () => {
            const container = d3.select(ref.current);

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
            const yAxisWidth = width > 600 ? 170 : width / 3;
            const xAxisHeight = 20;
            const margin = 30,
                scrollContainerWidth = width - 2 * margin - yAxisWidth,
                height = plotHeight + margin * 2 + xAxisHeight * 2;


            container.style("height", `${height}px`);

            const horizontalScrollContainerEl = container.select(".horizontalScrollContainer").node();

            const svg = d3.select(horizontalScrollContainerEl)
                .style("width", `${scrollContainerWidth}px`)
                .style("height", `${plotHeight + xAxisHeight + margin}px`)
                .style("left", `${yAxisWidth + margin + 1}px`)
                .select("svg.main")
                .attr("width", plotWidth)
                .attr("height", plotHeight + xAxisHeight)
                .style("top", `${xAxisHeight}px`);

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
                .style("width", `${scrollContainerWidth}px`)
                .style("left", `${yAxisWidth + margin + 1 + 20}px`)
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
                .style("top", `${xAxisHeight + margin + legendHeight}px`)
                .select(".y-axis")
                .call(d3.axisLeft(y))
                .attr("transform", `translate(${margin + yAxisWidth}, 0)`);
            container.select(".yAxisContainer")
                .selectAll('text')
                .each(function (textValue, i) {
                    replaceTextElements(this, textValue, yAxisWidth);
                });
            container.select(".yAxisContainer")
                .selectAll('foreignObject')
                .each((function () {
                    updateForeignObject(d3.select(this), yAxisWidth);
                }));

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
                    .style("left", `${xBand(d.date) + margin + yAxisWidth + 0.5 * squareSize - horizontalScrollContainerEl.scrollLeft}px`)
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
                .style("fill", function (d) {
                    return myColor(d[valKey])
                })
                .on("mouseover", mouseover)
                .on("mousemove", mousemove)
                .on("mouseleave", mouseleave)
                .exit().remove();

            addLegend(container, myColor);

            horizontalScrollContainerEl.scrollLeft = horizontalScrollContainerEl.scrollWidth;

            return () => console.log("cleanup function");
        },
        [width, data, rowKey, colKey, valKey]
    );

    const addLegend = (container, myColor) => {
        const legendContainer = container.select(".legend-container");
        var keys = [{
            label: "Mister A",
            value: 4
        }, {
            label: "Mister B",
            value: 22
        }, {
            label: "Mister C",
            value: 42
        }, {
            label: "Mister D",
            value: 17
        }]
        // Add one dot in the legend for each name.
        var size = 20
        legendContainer.selectAll("mydots")
            .data(keys)
            .enter()
            .append("rect")
            .attr("x", 100)
            .attr("y", function (d, i) {
                return 100 + i * (size + 5)
            }) // 100 is where the first dot appears. 25 is the distance between dots
            .attr("width", size)
            .attr("height", size)
            .style("fill", function (d) {
                return myColor(d.value)
            })
        // Add one dot in the legend for each name.
        legendContainer.selectAll("mylabels")
            .data(keys)
            .enter()
            .append("text")
            .attr("x", 100 + size * 1.2)
            .attr("y", function (d, i) {
                return 100 + i * (size + 5) + (size / 2)
            }) // 100 is where the first dot appears. 25 is the distance between dots
            .style("fill", function (d) {
                return "#333"
            })
            .text(function (d) {
                return d.label
            })
            .attr("text-anchor", "left")
            .style("alignment-baseline", "middle")
    }

    return (
        <div ref={ref} className="container">
            <svg className="legend-container" style={{height: legendHeight}}></svg>

            <div className='yAxisContainer'>
                <svg>
                    <g className="y-axis"/>
                </svg>
            </div>
            <ScrollSync>
                <>
                    <div className="stickyXAxisContainer">
                        <ScrollSyncPane>
                            <div className='horizontalScrollXAxisContainer'>
                                <svg>
                                    <rect className='background'></rect>
                                    <g className="x-axis top"/>
                                </svg>
                            </div>
                        </ScrollSyncPane>
                    </div>
                    <ScrollSyncPane>
                        <div className="horizontalScrollContainer">
                            <svg className="main">
                                <g className="plot-area"/>
                                <g className="x-axis bottom"/>
                            </svg>
                        </div>
                    </ScrollSyncPane>
                </>
            </ScrollSync>
            <div className="tooltip"></div>
        </div>
    );
}

const replaceTextElements = function (textElement, textValue) {
    const el = d3.select(textElement);
    const p = d3.select(textElement.parentNode);
    const foreignObject = p.append("foreignObject");
    foreignObject.append("xhtml:p")
        .attr("class", "wrap-and-truncate")
        .html(textValue);
    el.remove();
};

const updateForeignObject = function (foreignObject, width) {
    const xpadding = 10;
    foreignObject.attr('x', -1 * (width + xpadding))
        .attr('y', -5)
        .attr("width", width)
        .attr("height", 25)
}