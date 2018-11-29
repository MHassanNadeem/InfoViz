
// Global Variables
var data = null;
var colormap = d3.scaleOrdinal(d3.schemeCategory10);

function removeSpaces(str){
    return str.replace(/\s/g, '');
}

var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

d3.selection.prototype.moveToFront = function() {  
    return this.each(function(){
    var line = this.parentNode;
    var parent = line.parentNode;
    line.remove()
    parent.appendChild(line);
    });
};

// Set the dimensions of the canvas / graph
var margin = {top: 10, right: 10, bottom: 10, left: 10},
    width = 700 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

var x = d3.scaleLinear().range([0, width]);
var y = d3.scaleLinear().range([height, 0]);

var xAxis = d3.axisBottom(x).ticks(10);
var yAxis = d3.axisLeft(y).ticks(10);


function mapX(p){
    return x(p)
}

function mapY(p){
    return y(p)
}

// D3 code can go here ...
// var svg = d3.select("svg");

var svg = d3.select("#svgcolumn")
    .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .attr("style", "border:1px solid black")
    .append("g")
        .attr("transform", 
                "translate(" + margin.left + "," + margin.top + ")");

String.prototype.format = function() {
    var formatted = this;
    for (var i = 0; i < arguments.length; i++) {
        var regexp = new RegExp('\\{'+i+'\\}', 'gi');
        formatted = formatted.replace(regexp, arguments[i]);
    }
    return formatted;
};

function getPolyLine(a,b,c,d){
    coor = [
        [0, a],
        [b, 0],
        [0, -c],
        [-d, 0],
        [0, a]
    ]

    line = '';
    for(var i=0; i<coor.length; i++){
        line += mapX(coor[i][0]) + ',' + mapY(coor[i][1]) + ' '
    }

    return line
}

d3.csv("data_full.csv").then(
// d3.csv("data.csv").then(
    function(csv_data){
        data = csv_data;
        // console.log(data);

        y_min = -d3.max(data, d => +d.Deccel_Measure)
        y_max = d3.max(data, d =>  +d.Accel_Measure)
        y_abs = Math.max( Math.abs(y_min), Math.abs(y_max) )
        y.domain([-y_abs, y_abs])

        x_min = -d3.max(data, d => +d.LatNeg_Measure)
        x_max = d3.max(data, d =>  +d.LatPos_Measure)
        x_abs = Math.max( Math.abs(x_min), Math.abs(x_max) )
        x.domain([-x_abs, x_abs])

        // console.log( -d3.max(data, d => +d.Deccel_Measure) )
        // console.log( d3.max(data, d =>  +d.Accel_Measure) )

        // readFormRender(data);

        // Add the X Axis
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height/2 + ")")
            .call(xAxis);

        // Add the Y Axis
        svg.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(" + width/2 + ",0)")
            .call(yAxis);       
        
        readFormRender(data);
    }
)

function render(data, color){
    colormap = d3.scaleOrdinal(d3.schemeCategory10);

    svg.selectAll('.plot').remove();
    var plot = svg.append("g").attr("class", "plot");

    var g = plot.selectAll("plot")
        .data(data, d => d.DRIVER_ID)
        .enter()
        .append("g")
        .attr("class", data => removeSpaces(data[color]))

        g.append("polyline")
            .attr("points", data => getPolyLine(+data.Accel_Measure, +data.LatPos_Measure, +data.Deccel_Measure, +data.LatNeg_Measure))
            .attr("fill", "none")
            .attr("stroke", data => colormap(data[color]))
            .attr('opacity', 0.5)
            .attr('stroke-width', 1)

        // Highlight
        g.append("polyline")
            .attr("points", data => getPolyLine(+data.Accel_Measure, +data.LatPos_Measure, +data.Deccel_Measure, +data.LatNeg_Measure))
            .attr("fill", "none")
            .attr("stroke", data => colormap(data[color]))
            .attr('opacity', 0)
            .attr('stroke-width', 4)
            .on('mouseover', function(d){
                d3.select(this)
                .attr('opacity', 0.95)

                // this.parentNode.appendChild(this);
                d3.select(this).moveToFront();
                // d3.select(this).remove();

                tooltip.transition()
                    .duration(1000)
                    .style("opacity", .9);
                tooltip.html(d.Gender + ' - ' + d.LocationCode + "<br/>"
                    + d.VehicleClass + ' - ' + d.AgeRange)
                    .style("left", (d3.event.pageX + 15) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");
            })
            .on('mouseout', function(node){
                d3.select(this)
                .attr('opacity', 0)

                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        // Draw Legend
        var legend = plot.selectAll(".legend")
            .data(colormap.domain())
            .enter().append("g")
            .attr("class", "legend")
            .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; })
            .on('click', function(d){
                var oldState = d3.select(this).classed("greyedout");
                var newState = !oldState;
                d3.select(this).classed("greyedout", newState);
                d3.selectAll('.' + removeSpaces(d)).classed("greyedoutlines", newState);
            });

        // draw legend colored rectangles
        legend.append("rect")
            .attr("x", width - 18)
            .attr("width", 18)
            .attr("height", 18)
            .style("fill", colormap);

        // draw legend text
        legend.append("text")
            .attr("x", width - 24)
            .attr("y", 9)
            .attr("dy", ".35em")
            .style("text-anchor", "end")
            .text( d => d);
}

function readFormRender() {
    var form = new FormData(document.getElementById("myForm"));

    genders = form.getAll('GenderChoices')
    ages = form.getAll('AgeChoices')
    vecicles = form.getAll('VehicleChoices')
    locations = form.getAll('LocChoices')
    color = form.get('color')

    function filter_func(elem){
        var match = 0;
        for (i = 0; i < genders.length; i++) {
            if((elem.Gender === genders[i])){
                match++;
                break;
            }
        }

        if(match != 1) return false;

        for (i = 0; i < vecicles.length; i++) {
            if((elem.VehicleClass === vecicles[i])){
                match++;
                break;
            }
        }

        if(match != 2) return false;

        for (i = 0; i < locations.length; i++) {
            if((elem.LocationCode === locations[i])){
                match++;
                break;
            }
        }

        if(match != 3) return false;

        return true;
    }

    filtered_data = data.filter( e => filter_func(e) );

    // console.log(filtered_data)

    // console.log( genders )
    // console.log( locations )
    // console.log( vecicles )
    // console.log( ages )
    // console.log( color )

    render(filtered_data, color);
}