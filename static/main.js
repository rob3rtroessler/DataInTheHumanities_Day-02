let keyword = document.querySelector('#keyword').value;

function getData(){
    keyword = document.querySelector('#keyword').value;
    console.log('current keyword', keyword);


    fetch(
        `/getLemma`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({keyword})
        }
    )
        .then((response) => response.json())
        .then((data) => {
            console.log(data);
            let wordsCount = calculate(data.freud);

            // draw concordances
            drawConcordances(data.freud);

            // draw barchart
            drawBarChart(wordsCount);
        });
}

function calculate(data) {

    // init helperDict
    let helperDict = {};

    // loop over all concordance lines
    data.forEach(function(concordanceLine){

        // loop through each concordance line
        concordanceLine.forEach(function (object) {

            // if the word is not yet in helperDict
            if (helperDict[object.vocabulary] === undefined ){

                // enter this word into the dictionary
                helperDict[object.vocabulary] = 1;
            } else {
                // else, increase the count of the word
                helperDict[object.vocabulary] += 1;
            }
        })
    });

    console.log(helperDict);

    // before sorting, create a helperArray since dictionaries can't be sorted
    let helperArray = Object.keys(helperDict).map(function(word) {
        return {'key': word, 'value': helperDict[word]};
    });

    // Sort the array based on the values
    helperArray.sort(function(b,a) {
        return a.value - b.value;
    });

    let returnArray = [];
    helperArray.forEach(function(d){
        if (d.value > 1){
            returnArray.push(d);
        }
    });

    // return
    return returnArray;
}

function drawConcordances(data) {

    // get width and height of parent container using jquery
    let htmlParent = $('#concordances');
    let width = htmlParent.width();
    let height = htmlParent.height();
    let rowCount = data.length;

    // reset
    htmlParent.html('');

    // create svg
    let svg = d3.select('#concordances').append('svg')
        .attr('width', width)
        .attr('height', height);

    // init rows, i.e. groups (g)
    let rows = svg.selectAll('.rect').data(data);

    // create the groups and translate them vertically
    let concordanceLines = rows.enter().append('g')
        .attr('class', 'concordanceLine')
        .attr('transform', function(d,i){
            return (`translate(0,${i*height/rowCount})`)
        })
        // on mouseover, show the entire sentence, on mouseout reset
        .on('mouseover', function(array){
            let html = '';
            array.forEach(function (object) {
               html += object['normal'] + ' ';
            });
            $('#sentence').html(html);
        })
        .on('mouseout', function () {
            $('#sentence').html('');
        });

    // init the actual concordance lines (i.e. the actual text)
    let filledConcordanceLines = concordanceLines.selectAll('.concordanceLine').data(function(d){return d});

    filledConcordanceLines.enter().append('rect')
        .attr('class', function (d) {
            return d.vocabulary
        })
        .attr('x', function(d,i){
            return i*width/15
        })
        .attr('y', 2)
        .attr('width', width/16)
        .attr('height', height/(rowCount+3))
        .attr('fill', function (d) {
            if (d.vocabulary === keyword) {
                return 'red'
            } else {
                return 'grey'
            }
        })
        .on('mouseover', function (d) {
            console.log(d);
            d3.selectAll(`.${d.vocabulary}`).attr('fill', 'blue')
        })
        .on('mouseout', function(d){
            d3.selectAll(`.${d.vocabulary}`).attr('fill', function (d) {
                if (d.vocabulary === keyword) {
                    return 'red'
                } else {
                    return 'grey'
                }
            })
        });

    console.log(filledConcordanceLines);

}

function drawBarChart(data) {

    console.log('stuff', data);
    document.querySelector('#hits').innerHTML = `${data.length} words > 1`;

    //
    let margin = {
            top: 20,
            right: 20,
            bottom: 80,
            left: 50
        };
    let htmlParent = $('#barChart');
    let width = htmlParent.width() - margin.left - margin.right;
    let height = htmlParent.height() - margin.top - margin.bottom;

    // reset
    htmlParent.html('');

    // pan & zoom

    let svg = d3.select("#barChart").append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    let x = d3.scaleBand()
        .rangeRound([0, width])
        .padding(0.1);

    let y = d3.scaleLinear()
        .rangeRound([height, 0]);

    x.domain(data.map(function (d) {
        return d.key;
    }));

    y.domain([0, d3.max(data, function (d) {
        return d.value;
    })]);

    svg.append("g")
        .attr('class', 'x-axis')
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("y", 0)
        .attr("x", 9)
        .attr("dy", ".35em")
        .attr("transform", "rotate(90)")
        .style("text-anchor", "start");

    svg.append("g")
        .call(d3.axisLeft(y))
        .append("text")
        .attr("fill", "#000")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", "0.71em")
        .attr("text-anchor", "end")
        .text("Speed");

    svg.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", function (d) {
            return d.key
        })
        .attr("x", function (d) {
            return x(d.key);
        })
        .attr("y", function (d) {
            console.log(d);
            return y(d.value);
        })
        .attr("width", x.bandwidth())
        .attr("height", function (d) {
            return height - y(d.value);
        })
        .attr('fill', function(d){
            if (d === keyword) {
                return 'red'
            } else {
                return 'grey'
            }
        })
        .on('mouseover', function (d) {
            d3.selectAll(`.${d.key}`).attr('fill', 'lightblue')
        })
        .on('mouseout', function(d){
            d3.selectAll(`.${d.key}`).attr('fill', function (d) {
                if (d === keyword) {
                    return 'red'
                } else {
                    return 'grey'
                }
            })
        });
}

