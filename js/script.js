$(function() {
	$("#nav-toggle-primary").click(function() {
		$(this).add("#nav-primary").toggleClass("inactive");
	})
})

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
}

angular.module("resistanceApp",[function() {
	
}]).controller("gaugeCtrl",["$scope","$http","$sce","$filter",function($scope,$http,$sce,$filter) {
	$scope.sources = {
		meta: "2",
		data: "od6"
	}
	$scope.driveURL = function(snippet) {
		return $sce.trustAsResourceUrl("https://spreadsheets.google.com/feeds/list/19okQyC_t4_WsT-W5kpmwpfTdYM3pGq3Aga8mswxrnDY/"+snippet+"/public/basic?alt=json-in-script");
	}
	$scope.gauges = {};
	$scope.model = {
		pending:true
	}
	$scope.$on("dataReady",function() {
		$scope.model.pending = false;
	})
	$http.jsonp($scope.driveURL($scope.sources.meta)).then(function(result) {
		$scope.gauges = $filter("googleDriveToObject")(result.data);
		$http.jsonp($scope.driveURL($scope.sources.data)).then(function(result) {
			$scope.gaugeData = $filter("googleDriveToObject")(result.data);
			$.each($scope.gaugeData,function(d,datum) {
				$.each(datum,function(key,value) {
					if ($scope.gauges[key]) {
						if (!$scope.gauges[key].model) $scope.gauges[key].model = [];
						datum.date = new Date(datum.id);
						datum[key] = parseInt(value);
						$scope.gauges[key].model.push({
							date:datum.date,
							value:datum[key],
							whathappened:datum.whathappened
						})
					}
				})
				delete datum.id;
				
			})
			$scope.$broadcast("dataReady");
		})
	})
}]).directive("gaugePanel",function() {
	function link(scope,element,attrs) {
		scope.type = attrs.type;
		scope.chart;
		if (scope.type) {
			scope.$on("dataReady",function() {
				scope.gauges = (function() {
					var filtered = {};
					$.each(scope.gauges,function(g,gauge) {
						if (gauge.type == scope.type) {
							filtered[g] = gauge;
						}
					})
					return filtered;
				})()
				var raw = $.map(scope.gaugeData,function(value) {
					return value;
				})
				raw.sort(function(a,b) {
					var aTime = a.date.getTime();
					var bTime = b.date.getTime();
					if (aTime < bTime) return -1;
					if (aTime > bTime) return 1;
					return 0;
				})
				var transform = {};
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
					if (scope.gauges[i]) {
						item.unshift((function() {
							return scope.gauges[i].label;
						})());
						output.push(item);
					}
				})
				
				if (output && output.length > 1) {
					scope.chart = c3.generate({
						bindto:$(element[0]).find(".timeseries")[0],
						size: {
							height:400
						},
					    data: {
					        x: 'x',
					        xFormat: '%Y-%m-%d',
					        columns: output,
					        colors: (function() {
					        	var colors = {};
					        	$.each(scope.gauges,function(g,gauge) {
					        		colors[gauge.label] = gauge.color
					        	})
					        	return colors;
					        })(),
					        types: (function() {
					        	var types = {};
					        	$.each(scope.gauges,function(g,gauge) {
					        		types[gauge.label] = "spline"
					        	})
					        	return types;
					        })()
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
					        },
					        y: {
					        	show: false,
					        	min: 0,
					        	max: 10
					        }
					    }
					})
				}
			})
			
			setTimeout(function() {
				$(element[0]).find(".timeseries").addClass("inactive");
				$(element[0]).find(".timeseries-toggle").click(function() {
					$(this).siblings(".timeseries").toggleClass("inactive");
				})
			},2000);
		}
	}
	return {
		link:link,
		templateUrl:jekyll.site.baseurl+"/js/ng-layouts/gaugepanel.html",
		replace:true,
		transclude:true,
		restrict:"E",
		scope:true
	}
}).directive("gauge",["$timeout",function($timeout) {
	function link(scope,element,attrs) {
		var opts = {
	      minValue: 0,
	      maxValue: 10,
	      size: 280,
	      clipWidth: 280,
	      clipHeight: 180,
	      ringWidth: 60,
	      maxValue: 10,
	      transitionMs: 4000
	    }
	    scope.$on("dataReady",function() {
	    
    		opts.arcColorFn = d3.interpolateHsl("#fff",scope.gauge.color);
    		$timeout(function() {
    			var gaugeEl = gauge(element[0], opts);
	    		gaugeEl.render();
	    		if (scope.gauge.model) {
	    			gaugeEl.update(scope.gauge.model[scope.gauge.model.length-1].value);
	    		}
    		})
    		
    	})
	}
	return {
		link:link,
		template:"<div></div>",
		replace:true,
		transclude:true,
		restrict:"E",
		scope:{
			gauge:"="
		}
	}
}]).filter("googleDriveToObject",function() {
	return function(input) {
		if (input.feed) {
			var output = {};
			$.each(input.feed.entry,function(r,row) {
				var name = row.title.$t;
				row = row.content.$t.split(",");
				if (row && row.length && row[0].length) {
					if (!output[name]) output[name] = {
						id:name
					};
					$.each(row,function(c,cell) {
						cell = cell.split(": ");
						if (cell[0] && cell[1]) {
							var key = $.trim(cell[0]);
							var val = $.trim(cell[1]);
							output[name][key] = val;
						}
					})
				}
			})
			return output;
		} else {
			return [];
		}
	}
})

