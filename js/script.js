function gaugesInit() {
    var rightwingGauge = gauge('#rightwing-ideologue', {
      minValue: 0,
      maxValue: 10,
      size: 280,
      clipWidth: 280,
      clipHeight: 180,
      ringWidth: 60,
      maxValue: 10,
      transitionMs: 4000,
      arcColorFn: d3.interpolateHsl(d3.rgb('#ffbf00'), d3.rgb('#997200'))
    });
    rightwingGauge.render();
    
    var racistGauge = gauge('#racist', {
      minValue: 0,
      maxValue: 10,
      size: 280,
      clipWidth: 280,
      clipHeight: 180,
      ringWidth: 60,
      maxValue: 10,
      transitionMs: 4000,
      arcColorFn: d3.interpolateHsl(d3.rgb('#ff8c00'), d3.rgb('#995400'))
    });
    racistGauge.render();
    
    var threatGauge = gauge('#threat-democracy', {
      minValue: 0,
      maxValue: 10,
      size: 280,
      clipWidth: 280,
      clipHeight: 180,
      ringWidth: 60,
      maxValue: 10,
      transitionMs: 4000,
    });
    threatGauge.render();
    
    var nepotisimGauge = gauge('#nepotisim-selfenricher', {
      minValue: 0,
      maxValue: 10,
      size: 280,
      clipWidth: 280,
      clipHeight: 180,
      ringWidth: 60,
      maxValue: 10,
      transitionMs: 4000,
      arcColorFn: d3.interpolateHsl(d3.rgb('#32cd32'), d3.rgb('#1e7b1e'))
    });
    nepotisimGauge.render();
    
    function updateReadings() {
      // just pump in random data here...
      var transform = gaugeData.model.transform;
      rightwingGauge.update(transform.ideology[transform.ideology.length-1]);
      racistGauge.update(transform.inclusiveness[transform.inclusiveness.length-1]);
      threatGauge.update(transform.democracy[transform.democracy.length-1]);
      nepotisimGauge.update(transform.selfinterest[transform.selfinterest.length-1]);
    }
    
    // every few seconds update reading values
    updateReadings();
  }

  var gauge = function(container, configuration) {
    var that = {};
    var config = {
      size                      : 200,
      clipWidth		              : 200,
      clipHeight	              : 110,
      ringInset		              : 20,
      ringWidth		              : 20,
      
      pointerWidth				      : 10,
      pointerTailLength		      : 5,
      pointerHeadLengthPercent	: 0.9,
      
      minValue					        : 0,
      maxValue					        : 10,
      
      minAngle					        : -60,
      maxAngle					        : 60,
      
      transitionMs				      : 750,
      
      majorTicks					      : 5,
      // labelFormat					      : d3.format(',g'),
      textInfo                  : 'text',
      textPosition              : 'inside',
      labelInset					      : 10,
      
      arcColorFn					      : d3.interpolateHsl(d3.rgb('#ffd9d9'), d3.rgb('#8b0000'))
    };
    var range = undefined;
    var r = undefined;
    var pointerHeadLength = undefined;
    var value = 0;
    
    var svg = undefined;
    var arc = undefined;
    var scale = undefined;
    var ticks = undefined;
    var tickData = undefined;
    var pointer = undefined;

    var donut = d3.layout.pie();
    
    function deg2rad(deg) {
      return deg * Math.PI / 180;
    }
    
    function newAngle(d) {
      var ratio = scale(d);
      var newAngle = config.minAngle + (ratio * range);
      return newAngle;
    }
    
    function configure(configuration) {
      var prop = undefined;
      for ( prop in configuration ) {
        config[prop] = configuration[prop];
      }
      
      range = config.maxAngle - config.minAngle;
      r = config.size / 2;
      pointerHeadLength = Math.round(r * config.pointerHeadLengthPercent);

      // a linear scale that maps domain values to a percent from 0..1
      scale = d3.scale.linear()
        .range([0,1])
        .domain([config.minValue, config.maxValue]);
        
      ticks = scale.ticks(config.majorTicks);
      tickData = d3.range(config.majorTicks).map(function() {return 1/config.majorTicks;});
      
      arc = d3.svg.arc()
        .innerRadius(r - config.ringWidth - config.ringInset)
        .outerRadius(r - config.ringInset)
        .startAngle(function(d, i) {
          var ratio = d * i;
          return deg2rad(config.minAngle + (ratio * range));
        })
        .endAngle(function(d, i) {
          var ratio = d * (i+1);
          return deg2rad(config.minAngle + (ratio * range));
        });
    }
    that.configure = configure;
    
    function centerTranslation() {
      return 'translate('+r +','+ r +')';
    }
    
    function isRendered() {
      return (svg !== undefined);
    }
    that.isRendered = isRendered;
    
    function render(newValue) {
      svg = d3.select(container)
        .append('svg:svg')
          .attr('class', 'gauge')
          .attr('width', config.clipWidth)
          .attr('height', config.clipHeight);
      
      var centerTx = centerTranslation();
      
      var arcs = svg.append('g')
          .attr('class', 'arc')
          .attr('transform', centerTx);
      
      arcs.selectAll('path')
          .data(tickData)
        .enter().append('path')
          .attr('fill', function(d, i) {
            return config.arcColorFn(d * i);
          })
          .attr('d', arc);
      
      var lg = svg.append('g')
          .attr('class', 'label')
          .attr('transform', centerTx);
      lg.selectAll('text')
          .data(ticks)
        .enter().append('text')
          .attr('transform', function(d) {
            var ratio = scale(d);
            var newAngle = config.minAngle + (ratio * range);
            return 'rotate(' +newAngle +') translate(0,' +(config.labelInset - r) +')';
          })
          .text(config.labelFormat);

      var lineData = [ [config.pointerWidth / 2, 0], 
              [0, -pointerHeadLength],
              [-(config.pointerWidth / 2), 0],
              [0, config.pointerTailLength],
              [config.pointerWidth / 2, 0] ];
      var pointerLine = d3.svg.line().interpolate('monotone');
      var pg = svg.append('g').data([lineData])
          .attr('class', 'pointer')
          .attr('transform', centerTx);
          
      pointer = pg.append('path')
        .attr('d', pointerLine/*function(d) { return pointerLine(d) +'Z';}*/ )
        .attr('transform', 'rotate(' +config.minAngle +')');
        
      update(newValue === undefined ? 0 : newValue);
    }
    that.render = render;
    
    function update(newValue, newConfiguration) {
      if ( newConfiguration  !== undefined) {
        configure(newConfiguration);
      }
      var ratio = scale(newValue);
      var newAngle = config.minAngle + (ratio * range);
      pointer.transition()
        .duration(config.transitionMs)
        .ease('elastic')
        .attr('transform', 'rotate(' +newAngle +')');
    }
    that.update = update;

    configure(configuration);
    
    return that;
  };
  
var gaugeData = {
	model: {
		source:"https://spreadsheets.google.com/feeds/list/19okQyC_t4_WsT-W5kpmwpfTdYM3pGq3Aga8mswxrnDY/od6/public/basic?alt=json-in-script",
		values:{},
		prep:function() {
			$.ajax({
				url:this.source,
				jsonp:"callback",
				dataType:"jsonp"
			}).done((function(data){
				var model = this;
				$.each(data.feed.entry,function(r,row) {
					var name = row.title.$t;
					row = row.content.$t.split(",");
					
					if (row && row.length && row[0].length) {
						if (!gaugeData.model.values[name]) gaugeData.model.values[name] = {};
						gaugeData.model.values[name].date = new Date(name);
						$.each(row,function(c,cell) {
							cell = cell.split(": ");
							if (cell[0] && cell[1]) {
								var key = $.trim(cell[0]);
								var val = $.trim(cell[1]);
								if (!isNaN(val)) {
									gaugeData.model.values[name][key] = parseInt(val);
								}
							}
						})
					}
				})
				$listener.trigger("dataReady");
			}).bind(this));	
		}
	}
}

var $listener = $(gaugeData);

$listener.on("dataReady",function() {
	this.model.transform = {
		date:[]
	};
	var raw = $.map(this.model.values,function(value) {
		return value;
	})
	raw.sort(function(a,b) {
		var aTime = a.date.getTime();
		var bTime = b.date.getTime();
		if (aTime < bTime) return -1;
		if (aTime > bTime) return 1;
		return 0;
	})
	var transform = this.model.transform;
	$.each(raw,function(r,row) {
		$.each(row,function(v,val) {
			if (!transform[v]) transform[v] = [];
			if (v != "date" || transform[v].indexOf(val) === -1) {
				transform[v].push(val);
			}
		})
	})
	var output = [];
	$.each(transform.date,function(d,date) {
		var day = date.getDate();
		if (day < 10) day = "0"+day;
		var month = date.getMonth()+1;
		if (month < 10) month = "0"+month;
		transform.date[d] = date.getFullYear()+"-"+month+"-"+day;
	})
	transform.date.unshift("x");
	output.push(transform.date);
	delete transform.date;

	$.each(transform,function(i,item) {
		item.unshift((function() {
			if (i === "ideology") {
				return "Ideology"
			} else if (i === "inclusiveness") {
				return "Inclusiveness"
			} else if (i === "democracy") {
				return "Threat to Democracy"
			} else if (i === "selfinterest") {
				return "Self-Interest"
			}
		})());
		output.push(item);
	})
	
	var chart = c3.generate({
		bindto:"#timeseries",
	    data: {
	        x: 'x',
	        xFormat: '%Y-%m-%d',
	        columns: output,
	        colors: {
	        	"Ideology":"rgb(255, 191, 0)",
	        	"Inclusiveness":"rgb(255, 140, 0)",
	        	"Threat to Democracy":"rgb(206, 0, 0)",
	        	"Self-Interest":"rgb(50, 205, 50)",
	        },
	        types: {
	        	"Ideology":"spline",
	        	"Inclusiveness":"spline",
	        	"Threat to Democracy":"spline",
	        	"Self-Interest":"spline"
	        }
	    },
	    point: {
    		show: false
		},
	    axis: {
	        x: {
	            type: 'timeseries',
	            tick: {
	                format: '%m/%d/%y',
	                values:[output[0][1],output[0][output[0].length-1]]
	            }
	        }
	    }
	})
	gaugesInit();
})

$(function() {
	gaugeData.model.prep();
})