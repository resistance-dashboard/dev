$(function() {
	
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
							console.log(row);
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
					$(gaugeData).trigger("dataReady");
				}).bind(this));	
			}
		}
	}
	
	$(gaugeData).on("dataReady",function() {
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
		        }
		    },
		    point: {
        		show: false
    		},
		    axis: {
		        x: {
		            type: 'timeseries',
		            tick: {
		                format: '%Y-%m-%d'
		            }
		        }
		    }
		})
	})
	
	gaugeData.model.prep();
})
