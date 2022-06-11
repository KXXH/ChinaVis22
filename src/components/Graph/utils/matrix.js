import * as d3 from "d3";
// import { emit } from "process";
import * as reorder from "reorder.js";
export function draw(d, caiyang) {



    var margin = { top: 40, right: 0, bottom: 0, left: 0 },
        width = 720,
        height = 720;

    var x = d3.scaleBand().range([0, width]),
        z = d3.scaleLinear().domain([0, 1]).clamp(true),
        c = d3.schemeCategory10;
    var svg = d3.select(".svgdiv").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .style("margin-left", -margin.left + "px")
        .style("font", "10px sans-serif")
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    d3.json("../public/miserables.json").then(d => { loadJson(d) });
    // loadJson(d)


    function matrix(json) {
        var matrix = [],
            nodes = json.nodes,
            n = nodes.length;

        // Compute index per node.
        nodes.forEach(function (node, i) {
            node.index = i;
            node.count = 0;
            matrix[i] = d3.range(n).map(function (j) { return { x: j, y: i, z: 0 }; });
        });

        // Convert links to matrix; count character occurrences.
        json.links.forEach(function (link) {
            matrix[link.source][link.target].z += link.value;
            matrix[link.target][link.source].z += link.value;
            matrix[link.source][link.source].z += link.value;
            matrix[link.target][link.target].z += link.value;
            nodes[link.source].count += link.value;
            nodes[link.target].count += link.value;
        });
        var adjacency = matrix.map(function (row) {
            return row.map(function (c) { return c.z; });
        });

        var graph = reorder.graph()
            .nodes(json.nodes)
            .links(json.links)
            .init();

        var dist_adjacency;

        var leafOrder = reorder.optimal_leaf_order()
            .distance(reorder.distance.manhattan);

        function computeLeaforder() {
            var order = leafOrder(adjacency);

            order.forEach(function (lo, i) {
                nodes[i].leafOrder = lo;
            });
            return nodes.map(function (n) { return n.leafOrder; });
        }

        function computeLeaforderDist() {
            if (!dist_adjacency)
                dist_adjacency = reorder.graph2valuemats(graph);

            var order = reorder.valuemats_reorder(dist_adjacency,
                leafOrder);

            order.forEach(function (lo, i) {
                nodes[i].leafOrderDist = lo;
            });
            return nodes.map(function (n) { return n.leafOrderDist; });

        }

        function computeBarycenter() {
            var barycenter = reorder.barycenter_order(graph),
                improved = reorder.adjacent_exchange(graph,
                    barycenter[0],
                    barycenter[1]);

            improved[0].forEach(function (lo, i) {
                nodes[i].barycenter = lo;
            });

            return nodes.map(function (n) { return n.barycenter; });
        }

        function computeRCM() {
            var rcm = reorder.reverse_cuthill_mckee_order(graph);
            rcm.forEach(function (lo, i) {
                nodes[i].rcm = lo;
            });

            return nodes.map(function (n) { return n.rcm; });
        }

        function computeSpectral() {
            var spectral = reorder.spectral_order(graph);

            spectral.forEach(function (lo, i) {
                nodes[i].spectral = lo;
            });

            return nodes.map(function (n) { return n.spectral; });
        }

        // Precompute the orders.
        //数组，输入：位置，输出：节点在文件中的原排序
        var orders = {
            name: d3.range(n).sort(function (a, b) { return d3.ascending(nodes[a].name, nodes[b].name); }),
            count: d3.range(n).sort(function (a, b) { return nodes[b].count - nodes[a].count; }),
            // group: d3.range(n).sort(function (a, b) {
            //     var x = nodes[b].group - nodes[a].group;
            //     return (x != 0) ? x : d3.ascending(nodes[a].name, nodes[b].name);
            // }),
            leafOrder: computeLeaforder,
            leafOrderDist: computeLeaforderDist,
            barycenter: computeBarycenter,
            rcm: computeRCM,
            spectral: computeSpectral
        };

        // The default sort order.
        //输入：id，输出：像素位置
        // x.domain(orders.name);
        var noworder = "name";
        var noworderA = orders.name;

        function get2darray(num) {
            let res = [];
            for (let i = 0; i < num; i++) {
                let tmp = []
                for (let j = 0; j < num; j++)
                    tmp.push(0)
                res.push(tmp)
            }
            return res;
        }
        let nodecnt = matrix.length;
        let step = Math.ceil(nodecnt / caiyang);//节点总数，采样后数目
        function caiynag(matrix, orderarray) {

            if (typeof orderarray === "function") {
                console.log("start reorder")
                orderarray = orderarray.call();
                console.log("end reorder")
            }
            console.log(orderarray)
            let newmatrix = get2darray(matrix.length);
            for (let i = 0; i < matrix.length; i++) {
                for (let j = 0; j < matrix.length; j++)
                    newmatrix[i][j] = matrix[orderarray[i]][orderarray[j]]
            }
            
            
            let caryangm = []
            for (let i = 0; i < nodecnt; i += step) {
                let tmp = []
                // newnodes.push({"id":i/step})
                for (let j = 0; j < nodecnt; j += step) {
                    let newr = 0;
                    for (let ii = i; ii < Math.min(nodecnt, i + step); ii++) {
                        for (let jj = j; jj < Math.min(nodecnt, j + step); jj++) {
                            newr += newmatrix[ii][jj].z;
                            // console.log(newmatrix[ii][jj])
                        }
                    }
                    // newlinks.push({"source":i/step,"target":j/step,"value":newr/step})
                    tmp.push({ "y": i / step, "x": j / step, "z": newr / step })
                }
                caryangm.push(tmp)
            }
            console.log(caryangm)
            return caryangm;
        }
        let cmatrix = caiynag(matrix, orders.name, caiyang)
        var datal = d3.range(cmatrix.length);
        //输入：id，输出：像素位置
        x.domain(datal);





        svg.append("rect")
            .style("fill", "#eee")
            .attr("width", width)
            .attr("height", height)

        drawRowAndColumn(cmatrix)
        function drawRowAndColumn(matrix) {
            var row = svg.selectAll(".row")
                .data(matrix.filter(function (d) { return d.z != 0 }))
                .enter().append("g")
                .attr("id", function (d, i) { return "row" + i; })
                .attr("class", "row")
                .attr("transform", function (d, i) { return "translate(0," + x(i) + ")"; })
                .each(row);

            // row.append("line")
            //     .attr("x2", width);

            row.append("text")
                .attr("x", -6)
                .attr("y", x.bandwidth() / 2)
                .attr("dy", ".32em")
                .attr("text-anchor", "end")
                .attr("class", "notsee")
                .text(function (d, i) { return nodes[i].name; });

            var column = svg.selectAll(".column")
                .data(matrix)
                .enter().append("g")
                .attr("id", function (d, i) { return "col" + i; })
                .attr("class", "column")
                .attr("transform", function (d, i) { return "translate(" + x(i) + ")rotate(-90)"; });

            // column.append("line")
            //     .attr("x1", -width);

            column.append("text")
                .attr("x", 6)
                .attr("y", x.bandwidth() / 2)
                .attr("dy", ".32em")
                .attr("text-anchor", "start")
                .attr("class", "notsee")
                .text(function (d, i) { return nodes[i].name; });

            function row(row) {
                var cell = d3.select(this).selectAll(".cell")
                    .data(row)
                    .enter().append("rect")
                    .attr("class", "cell")
                    .attr("x", function (d) { return x(d.x); })
                    .attr("width", x.bandwidth())
                    .attr("height", x.bandwidth())
                    .style("fill-opacity", function (d) { return z(d.z); })
                    .style("fill", function (d) { return d3.interpolateBlues(d.z / 40) })
                // .on("mouseover", mouseover)
                // .on("mouseout", mouseout);
            }
            svg.append("g")
                .attr("class", "brush")
                .call(d3.brush().on("brush", brushed))
                .on("mousemove", (e,) => {
                    if (d3.pointer(e)[0] > 0 && d3.pointer(e)[1] > 0) {
                        let xnode = nodes[noworderA[Math.floor(d3.pointer(e)[0] / x.bandwidth())]].name;
                        let ynode = nodes[noworderA[Math.floor(d3.pointer(e)[1] / x.bandwidth())]].name;
                    }
                });

            function brushed(e) {
                const selection = e.selection;
                let w = x.bandwidth()
                let xx = [Math.floor(e.selection[0][0] / w), Math.floor(e.selection[1][0] / w)]
                let yy = [Math.floor(e.selection[0][1] / w), Math.floor(e.selection[1][1] / w)]

                // let o=orders[noworder]
                // if (typeof o === "function") {
                //     o = o.call();
                // }
                let brushnode = new Set();
                for (let i = xx[0]*step; i <= Math.min(xx[1]*step,nodecnt); i++) {
                    // brushnode.push(nodes[o[i]])
                    brushnode.add(nodes[noworderA[i]])
                }
                for (let i = yy[0]*step; i <= Math.min(yy[1]*step,nodecnt); i++) {
                    // brushnode.push(nodes[o[i]])
                    brushnode.add(nodes[noworderA[i]])
                }
                emit("brushMatrix",brushnode)
                console.log(brushnode)
            }

            function mouseover(d, p) {
                d3.selectAll(".row text").classed("active", function (d, i) { return i == p.y; });
                d3.selectAll(".column text").classed("active", function (d, i) { return i == p.x; });
                d3.select(this).insert("title").text(nodes[p.y].name + "--" + nodes[p.x].name);
                d3.select(this.parentElement)
                    .append("rect")
                    .attr("class", "highlight")
                    .attr("width", width)
                    .attr("height", x.bandwidth());
                d3.select("#col" + p.x)
                    .append("rect")
                    .attr("class", "highlight")
                    .attr("x", -width)
                    .attr("width", width)
                    .attr("height", x.bandwidth());
            }

            function mouseout(d, p) {
                d3.selectAll("text").classed("active", false);
                d3.select(this).select("title").remove();
                d3.selectAll(".highlight").remove();
            }
        }






        var currentOrder = 'name';

        function order(value) {
            var o = orders[value];
            currentOrder = value;

            if (typeof o === "function") {
                orders[value] = o.call();
            }
            // x.domain(orders[value]);

            cmatrix = caiynag(matrix, orders[value], caiyang)
            var datal = d3.range(cmatrix.length);
            //输入：id，输出：像素位置
            x.domain(datal);

            svg.selectAll(".row").remove();
            svg.selectAll(".column").remove();
            svg.select(".brush").remove();

            drawRowAndColumn(cmatrix)

            // var t = svg.transition().duration(1500);

            // t.selectAll(".row")
            //     .delay(function (d, i) { return x(i) * 4; })
            //     .attr("transform", function (d, i) { return "translate(0," + x(i) + ")"; })
            //     .selectAll(".cell")
            //     .delay(function (d) { return x(d.x) * 4; })
            //     .attr("x", function (d) { return x(d.x); });

            // t.selectAll(".column")
            //     .delay(function (d, i) { return x(i) * 4; })
            //     .attr("transform", function (d, i) { return "translate(" + x(i) + ")rotate(-90)"; });

            noworder = value
            noworderA = orders[value]
        }

        function distance(value) {
            leafOrder.distance(reorder.distance[value]);

            if (currentOrder == 'leafOrder') {
                orders.leafOrder = computeLeaforder;
                order("leafOrder");
                //d3.select("#order").property("selectedIndex", 3);
            }
            else if (currentOrder == 'leafOrderDist') {
                orders.leafOrderDist = computeLeaforderDist;
                order("leafOrderDist");
                //d3.select("#order").property("selectedIndex", 4);
            }

            // leafOrder.forEach(function(lo, i) {
            // 	    nodes[lo].leafOrder = i;
            // 	});
            // 	orders.leafOrder = d3.range(n).sort(function(a, b) {
            // 	    return nodes[b].leafOrder - nodes[a].leafOrder; });
        }

        matrix.order = order;
        matrix.distance = distance;

        var timeout = setTimeout(function () { }, 1000);
        matrix.timeout = timeout;

        return matrix;
    }


    function loadJson(json) {
        var mat = matrix(json);
        //    mat.timeout = setTimeout(function() {
        //	mat.order("group");
        //	d3.select("#order").property("selectedIndex", 2).node().focus();
        //    }, 5000);

        d3.select("#order").on("change", function () {
            //	clearTimeout(mat.timeout);
            mat.order(this.value);
        });

        d3.select("#distance").on("change", function () {
            //	clearTimeout(mat.timeout);
            mat.distance(this.value);

        });
    }

}
