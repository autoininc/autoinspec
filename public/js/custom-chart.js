function createRatingChart(list, val, id, type) {

    //뭔지는 모르겠다. 근데 이게 없으면 게이지 차트가 안나온다
    if (typeof Object.assign != 'function') {
        // Must be writable: true, enumerable: false, configurable: true
        Object.defineProperty(Object, "assign", {
          value: function assign(target, varArgs) { // .length of function is 2
            'use strict';
            if (target == null) { // TypeError if undefined or null
              throw new TypeError('Cannot convert undefined or null to object');
            }
      
            var to = Object(target);
      
            for (var index = 1; index < arguments.length; index++) {
              var nextSource = arguments[index];
      
              if (nextSource != null) { // Skip over if undefined or null
                for (var nextKey in nextSource) {
                  // Avoid bugs when hasOwnProperty is shadowed
                  if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                    to[nextKey] = nextSource[nextKey];
                  }
                }
              }
            }
            return to;
          },
          writable: true,
          configurable: true
        });
      }

    if (val == '' || val == undefined) {
        return;
    }

    var color = [];
    var value = [];
   
    var index, j = 0;
    if(list != undefined) {
        if (list.length > 0) {
            //색상들 담는 for문
            for (var i=0; i<list.length; i++) {

                //type == 2: 항목들
                if (list[i].type == type) {

                    if (list[i].id == val) {
                        index = j;
                        // 항목은 진하게
                        color.push(hexToRGB(list[i].color, 0))

                    } else {
                        //다른 색들은 연하게
                        color.push(hexToRGB(list[i].color, 0.1))
                    }
                    j++;
                }
            }
        }
    }

    var sum = 100 / color.length;
    for (var i=0; i<color.length; i++) {
        value.push(sum)
        sum += (100 / color.length);
    }

    //needle 위치 값 (중간에 needle이 위치..)
    var position = (value[index] + (value[index] - (100 / color.length))) /2; 

    value.splice(color.length-1, 1)
    // Properties of the gauge
    let options = {
        hasNeedle: true,
        needleColor: 'black',
        arcColors: color,
        arcDelimiters: value,
        rangeLabel: ['', ''],
      }

    
    // Drawing and updating the chart
    GaugeChart.gaugeChart(document.querySelector('#' + id + "-chart"), 550, options).updateNeedle(position)

    var doc = $('#' + id + "-chart").find('svg');
    doc.attr("viewBox", "0 0 520 338")
}

function createDoughnutChart(id, pos) {
    console.log(id)
    console.log(pos)
    var label_arr = [];
    var data_arr = [];
    var sum = 0;
    var length = $('#' + id + '-table tr:gt(0)').length;
    if ( length == 0 ) { return; } 

    $('#' + id + '-table tr:gt(0)').each(function(index) {
        var tr = $(this);
        var company = tr.find('td:eq(0)').text();   //기업명 DB에서 읽어오는걸로 수정
        var rate = parseInt(replaceAll(tr.find('td:eq(' + pos + ')').text(), "%", ""));   // 추정거래비중 DB에서 읽어오는걸로 수정
        sum += rate;

        label_arr.push(company);
        data_arr.push(rate);
    })

    var tmp = 100;
    if (sum != 100) {
        for ( var i = 0; i<data_arr.length; i++) {
            var data = Math.round(data_arr[i] * 100 / sum);
            if (tmp < data) {
                data -= (data - tmp);
            } else {
                tmp -= data;
            }
            data_arr[i] = data; 
        }
    }  


    var ctxP = document.getElementById(id + '-chart').getContext('2d');
    var myPieChart = new Chart(ctxP, {
        type: 'doughnut',
        data: {
        labels: label_arr, //이름..
        datasets: [{
            data:  data_arr, //비유,,ㄹ,,
            backgroundColor: ["#F7464A", "#46BFBD", "#FDB45C","#4D5360", "#949FB1"],
            hoverBackgroundColor: ["#FF5A5E", "#5AD3D1", "#FFC870", "#616774", "#A8B3C5"]
        }]
        },
        options: {
            responsive: true,
            dynamicDisplay : false,
            cutoutPercentage: 80,
            legend: {
                    display: false,
            },
            animation: {
                    animateScale: true,
                    animateRotate: true
            },
            plugins: {
                datalabels: {
                    display: false,
                    align: 'center',
                    anchor: 'center'
                }
            }                                                                           	
        }
    });
}  

function createBarChart (symbol, data) {
    
    var label = data.label;
    var arr = data.arr;
    var item = data.item;
    var color = data.color;
    var id = data.id;

    //값 없음.. 가라
    if (label.length == 0) { return; }

    var ctx = document.getElementById(id + "-chart").getContext("2d");


    
    //data 조작
    var datasets = [];
    for (var i=0; i<arr.length; i++) {
        var obj = {};

        obj.label = item[i];
        obj.backgroundColor = color[i];
        obj.bolderColor = color[i];

        //값 세팅
        for (var j=0; j<arr[i].length; j++) {
            
            if (arr[i][j] == '') { arr[i][j] = '0'; }
            arr[i][j] = Number(replaceAll(replaceAll(arr[i][j],",", ""), symbol, ""));
        }
        obj.data = arr[i];

        datasets.push(obj)
    }
    
    var data = {
        labels: label,
        datasets: datasets
    };

    var chart = new Chart(ctx, {
        type: 'bar',
        data: data,
        options: {
            scales: {
				xAxes: [{
				barPercentage: 0.6,
				position: 'bottom',
				display: true,
				gridLines: {
					display: false,
					drawBorder: false,
				},
				ticks: {
					display: true, //this will remove only the label
                    stepSize: 300
				}
				}],
				yAxes: [{
					display: true,
					gridLines: {
						drawBorder: false,
						display: true,
						color: "#f0f3f6",
						borderDash: [8, 4],
					},
					ticks: {
						beginAtZero: true,
						callback: function(value, index, values) {
						return symbol + comma(value);
						}
					},
				}]
			},
			legend: {
                display: false
			},
			legendCallback: function(chart) {
				var text = [];
				text.push('<ul class="' + chart.id + '-legend">');
				for (var i = 0; i < chart.data.datasets.length; i++) {
					text.push('<li><span class="legend-box" style="background:' + chart.data.datasets[i].backgroundColor[i] + ';"></span><span class="legend-label text-dark">');
					if (chart.data.datasets[i].label) {
							text.push(chart.data.datasets[i].label);
					}
					text.push('</span></li>');
				}
				text.push('</ul>');
				return text.join("");
			},
			tooltips: {
                backgroundColor: 'rgba(0, 0, 0, 1)',
                callbacks: {
                    label: function(tooltipItem, data) {
                        var value = (tooltipItem.value).toString();
                        var length = value.length;
                        var start = value.indexOf(".");
                        if (start > -1) {
                            var front = comma(value.substr(0, start));
                            var back = value.substr( start, length - 1 );
                            return symbol + front + back;
                            
                        } else {
                            return symbol + comma(value);
                        }
                    }
                }
			},
			plugins: {
				datalabels: {
					display: false,
					align: 'center',
					anchor: 'center'
				}
            },
            animation: {
                animateScale: true,
                animateRotate: true
            }
        }
    });

    return chart;
}

function createLineChart(data) {

    var label = data.label;
    var arr = data.arr;
    var item = data.item;
    var color = data.color;
    var id = data.id;

    //값 없음.. 가라
    if (label.length == 0) { return; }

    //line
    var ctxL = document.getElementById(id + "-chart").getContext('2d');

    var datasets = [];
    for (var i=0; i<arr.length; i++) {

        var obj = {};

        obj.label = item[i];

        obj.borderColor = color[i];
        for (var j=0; j<arr[i].length; j++) {
            if (arr[i][j] == '' || arr[i][j] == '-') { arr[i][j] = '0'; }
            arr[i][j] = Number(replaceAll(arr[i][j], ",", ""));
        }
        obj.data = arr[i];
        obj.fill= false;
        obj.borderWidth= 2;
        obj.pointBorderWidth= 4;
        datasets.push(obj);
    }

    var myLineChart = new Chart(ctxL, {
        type: 'line',
        data: {
            labels: label,
            datasets: datasets
        },
        options: {
            showTooltips: true,
            scales: {
                yAxes: [{
                    display: true,
                    gridLines: {
                        drawBorder: true,
                        display: true,
                    },
                }],
                xAxes: [{
                    position: 'bottom',
                    gridLines: {
                        drawBorder: true,
                        display: true,
                    },
                    ticks: {
                        beginAtZero: true,
                        stepSize: 30
                    }
                }],

            },
            legend: {
                    display: false,
            },
            legendCallback: function(chart) {
                var text = [];
                text.push('<ul class="' + chart.id + '-legend">');
                for (var i = 0; i < chart.data.datasets.length; i++) {
                    text.push('<li><span class="legend-box" style="background:' + chart.data.datasets[i].borderColor + ';"></span><span class="legend-label" style="">');
                    if (chart.data.datasets[i].label) {
                            text.push(chart.data.datasets[i].label);
                    }
                    text.push('</span></li>');
                }
                text.push('</ul>');
                return text.join("");
            },
            elements: {
                line: {
                    tension: 0
                }
            },
            tooltips: {
                backgroundColor: 'rgba(2, 171, 254, 1)',
            },
            plugins: {
                datalabels: {
                    display: false,
                    align: 'center',
                    anchor: 'center'
                }
            },
            animation: {
                animateScale: true,
                animateRotate: true
            }
        }
    });

    return myLineChart;

}

function createComponentDoughnutChart(id) {

    var label_arr = [];
    var data_arr = [];
    var sum = 0;
    var sample_bc = ["#F7464A", "#46BFBD", "#FDB45C","#4D5360", "#949FB1"];
    var sample_hbc = ["#F7464A", "#46BFBD", "#FDB45C","#4D5360", "#949FB1"]
    var bc = [];
    var hbc = [];

    var length = $('#' + id + '-table tr:gt(0)').length;
    if ( length == 0 ) { return; } 


    $('#' + id + '-table tr:gt(0)').each(function(index) {
        var tr = $(this);
        var company = tr.find('td:eq(0)').text();   //기업명 DB에서 읽어오는걸로 수정
        var rate = parseInt(replaceAll(tr.find('td:eq(1)').text(), "%", ""));   // 추정거래비중 DB에서 읽어오는걸로 수정
        sum += rate;

        label_arr.push(company);
        data_arr.push(rate);
        bc.push(sample_bc[index]);
        hbc.push(sample_hbc[index]);
    })

    if (sum < 100) {
        var etc_rate = 100 - sum;
        label_arr.push('ETC')
        data_arr.push(etc_rate);
        $("#"+ id + "-ul").append("<li><span class='bg' style='background-color:gray' ></span>ETC</li>");
        bc.push('gray');
        hbc.push('gray');
    }


    var ctxP = document.getElementById(id + '-chart').getContext('2d');
    var myPieChart = new Chart(ctxP, {
        type: 'doughnut',
        data: {
        labels: label_arr, //이름..
        datasets: [{
            data:  data_arr, //비유,,ㄹ,,
            backgroundColor: bc,
            hoverBackgroundColor: hbc
        }]
        },
        options: {
            responsive: true,
            cutoutPercentage: 80,
            legend: {
                    display: false,
            },
            animation: {
                    animateScale: true,
                    animateRotate: true
            },
            plugins: {
                datalabels: {
                    display: false,
                    align: 'center',
                    anchor: 'center'
                }
            }                                                                           	
        }
    });
}  

function createForChart(data) {

    console.log(data)

    var label = [];
    var label_arr = [];
    var data_arr = [];
    var sample_bc = ["#F7464A", "#46BFBD", "#FDB45C","#4D5360", "#949FB1"];
    var sample_hbc = ["#F7464A", "#46BFBD", "#FDB45C","#4D5360", "#949FB1"]
    var bc = [];
    var hbc = [];

    var for_ = data;    
    if (for_ != '' && for_ != undefined) {
        
        for (var i=0; i<for_.length; i++) {

            label.push(for_[i].title)
            var value = for_[i].value;
            var value2 = for_[i].value2;
            var rate = (value2/value) * 100;
            rate = Math.floor(rate * 100)/100;

            label_arr.push('Process operation rate');
            data_arr.push(rate);
            if (rate < 60) {
                bc.push(sample_bc[0]);
                hbc.push(sample_hbc[0]);
            } else {
                bc.push(sample_bc[2]);
                hbc.push(sample_hbc[2]);
            }
            

            /*if (rate < 100) {
                var etc_rate = 100 - rate;
                label_arr.push('Defect')
                data_arr.push(etc_rate);
                $("#for-" + i + "-ul").append("<li><span class='bg' style='background-color:gray' ></span>Defect: " + etc_rate + " %</li>");
                bc.push('gray');
                hbc.push('gray');
            }*/

            /*var ctxP = document.getElementById('for-' + i + '-chart').getContext('2d');
            var myPieChart = new Chart(ctxP, {
                type: 'doughnut',
                data: {
                labels: label_arr, //이름..
                datasets: [{
                    data:  data_arr, //비유,,ㄹ,,
                    backgroundColor: bc,
                    hoverBackgroundColor: hbc
                }]
                },
                options: {
                    responsive: true,
                    cutoutPercentage: 80,
                    legend: {
                            display: false,
                    },
                    animation: {
                            animateScale: true,
                            animateRotate: true
                    },
                    plugins: {
                        datalabels: {
                            display: false,
                            align: 'center',
                            anchor: 'center'
                        }
                    }                                                                           	
                }
            });*/

            label_arr = [];

        }

        var salesDifferencedata = {
            labels: label,
            datasets: [{
                data: data_arr,
                backgroundColor: bc,
                borderColor: hbc,
                borderWidth: 2,
                fill: false
            }],
        };

        var salesDifferenceOptions = {
            scales: {
                xAxes: [{
                    position: 'bottom',
                    display: false,
                    gridLines: {
                            display: false,
                            drawBorder: true,
                    },
                    ticks: {
                            display: false ,//this will remove only the label
                            beginAtZero: true
                    }
                }],
                yAxes: [{
                    display: true,
                    gridLines: {
                        drawBorder: true,
                        display: false,
                    },
                    ticks: {
                        beginAtZero: true
                    },
                }]
            },
            legend: {
                display: false
            },
            tooltips: {
                enabled: false,
                show: false,
                backgroundColor: 'rgba(31, 59, 179, 1)',
            },
            plugins: {
            datalabels: {
                    display: true,
                    align: 'center',
                    color: 'white',
                }
            },
            layout: {
                padding: {
                   right: 25  //set that fits the best
                }
             },				
    
        };

        
        var barChartCanvas = $("#for-chart").get(0).getContext("2d");
        // This will get the first returned node in the jQuery collection.
        var barChart = new Chart(barChartCanvas, {
            type: 'horizontalBar',
            data: salesDifferencedata,
            options: salesDifferenceOptions,

        });
		
    }

}  

function createEsChart(data) {

        var color = ['#08ffc8', '#fff7f7', '#dadada', '#204969', '#ffb6b9', '#fae3d9', '#bbded6', '#8ac6d1', '#d9d9f3', '#9dd3a8' ];

        var label_arr = [];
        var data_arr = [];
        var bc = [];
        var hbc = [];

        var es = data;    
        if (es != '' && es != undefined) {
        
            for (var i=0; i<1; i++) {

                var total = Number(es[i].total);
                var operator = Number(es[i].operator) / total * 100;
                var maintenance = Number(es[i].maintenance) / total * 100;
                var supervisor = Number(es[i].supervisor) / total * 100;
                var accountant = Number(es[i].accountant) / total * 100;
                var sales = Number(es[i].sales) / total * 100;
                var logistic = Number(es[i].logistic) / total * 100;
                var material = Number(es[i].material) / total * 100;
                var quality = Number(es[i].quality) / total * 100;
                var r_d = Number(es[i].r_d) / total * 100;
                var logistic_sales = Number(es[i].logistic_sales) / total * 100;
                


                label_arr.push('Operator');
                data_arr.push(Math.floor(operator * 100)/100);
                bc.push(color[0]); hbc.push(color[0]);

                label_arr.push('Maintenance');
                data_arr.push(Math.floor(maintenance * 100)/100);
                bc.push(color[1]); hbc.push(color[1]);

                label_arr.push('Supervisor');
                data_arr.push(Math.floor(supervisor * 100)/100);
                bc.push(color[2]); hbc.push(color[2]);

                label_arr.push('Accountant');
                data_arr.push(Math.floor(accountant * 100)/100);
                bc.push(color[3]); hbc.push(color[3]);

                label_arr.push('Sales');
                data_arr.push(Math.floor(sales * 100)/100);
                bc.push(color[4]); hbc.push(color[4]);

                label_arr.push('Logistic');
                data_arr.push(Math.floor(logistic * 100)/100);
                bc.push(color[5]); hbc.push(color[5]);

                label_arr.push('Material');
                data_arr.push(Math.floor(material * 100)/100);
                bc.push(color[6]); hbc.push(color[6]);

                label_arr.push('Quality');
                data_arr.push(Math.floor(quality * 100)/100);
                bc.push(color[7]); hbc.push(color[7]);

                label_arr.push('R&D');
                data_arr.push(Math.floor(r_d * 100)/100);
                bc.push(color[8]); hbc.push(color[8]);

                label_arr.push('Logistic/Sales');
                data_arr.push(Math.floor(logistic_sales * 100)/100);
                bc.push(color[9]); hbc.push(color[9]);

                var ctxP = document.getElementById('es-chart').getContext('2d');
                var myPieChart = new Chart(ctxP, {
                    type: 'pie',
                    data: {
                    labels: label_arr, //이름..
                    datasets: [{
                        data:  data_arr, //비유,,ㄹ,,
                        backgroundColor: bc,
                        hoverBackgroundColor: hbc
                    }]
                    },
                    options: {
                        responsive: true,
                        legend: {
                                display: false,
                        },
                        animation: {
                                animateScale: true,
                                animateRotate: true
                        },
                        plugins: {
                            datalabels: {
                                display: false,
                                align: 'center',
                                anchor: 'center'
                            }
                        }                                                                           	
                    }
            });

        }
    }

}   
