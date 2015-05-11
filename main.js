var shpwrite = require('shp-write');

// $('.datepicker').datepicker()
$('#date-time').datetimepicker(
	// {showTodayButton: true}
);
var now = moment();
$('#date-time-input').attr('placeholder', now.format('MM/D/YYYY h:mm A'))
	serialize = function(obj) {
  var str = [];
  for(var p in obj)
    if (obj.hasOwnProperty(p)) {
      str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
    }
  return str.join("&");
};
	var map = L.map('map').setView([33.752110, -84.385770], 13);
	var defaultTravelTime = 15;
	var defaultMode = 'car';
	$('#travel-time').attr('placeholder', defaultTravelTime)
	// $('#mode').attr('placeholder', defaultMode)
L.tileLayer('https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {
	maxZoom: 18,
	attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
		'<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
		'Imagery © <a href="http://mapbox.com">Mapbox</a>',
	id: 'examples.map-i875mjb7'
}).addTo(map);



var popup = L.popup();
var markers = [];
var isochrones = [];
var lastParams;
var latlngs;
function downloadGeojson(){
	var data = isochrones[0].toGeoJSON();
	var fc = {
	    type: 'FeatureCollection',
	    features: [data]
	};
	console.log(data);
	data.properties = lastParams;
	if ($('input:radio[name=export-type-radio]:checked').val() === 'geojson'){
		download('isochrone.geojson', JSON.stringify(data));
	}
	else{
		// (optional) set names for feature types and zipped folder
		var options = {
			folder: 'isochrones',
			types: {
			    polygon: 'polygon'
			}
		};
		// a GeoJSON bridge for features
		shpwrite.download(fc, options);
		// triggers a download of a zip file with shapefiles contained within.
	}
	
}
function download(filename, text) {
  var pom = document.createElement('a');
  pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  pom.setAttribute('download', filename);

  pom.style.display = 'none';
  document.body.appendChild(pom);

  pom.click();

  document.body.removeChild(pom);
}
function onMapClick(e) {
	var latlng;
	console.log(e)
	if (typeof e.latlng == 'undefined'){
		latlng = e._latlng
	}
	else{
		latlng = e.latlng
	}
	if (markers.length > 0){
		for (var i = markers.length - 1; i >= 0; i--) {
			map.removeLayer(markers[i]);
		}
	}
	if (isochrones.length > 0){
		for (var i = isochrones.length - 1; i >= 0; i--) {
			map.removeLayer(isochrones[i]);
		}
	}
	var marker = L.marker(latlng).addTo(map);
	console.log(e.latlng);
	markers.push(marker);
	var time = $('#travel-time').val() || defaultTravelTime;
	var mode = $('#mode').val() || defaultMode;
	var traffic = $('#traffic').is(':checked') ? 'enabled' : 'disabled';
	var dateTime = $('#date-time').data("DateTimePicker").date() !== null ? $('#date-time').data("DateTimePicker").date().format() : now.format();
	var params = {
		point : [latlng.lat, latlng.lng].join(','),
		time : time,
		mode : mode,
		traffic : traffic,
		departure : dateTime
	};
	var params2 = {
		start : 'geo!' + [latlng.lat, latlng.lng].join(','),
		range : time*60,
		rangetype : 'time',
		mode : 'fastest;'+mode+';traffic:'+traffic,
		departure : dateTime,
		app_id : 'DemoAppId01082013GAL',
		app_code : 'AJKnXv84fjrb0KIHawS0Tg'

	};
	lastParams = params;
	var url = ! $('#version').is(':checked') ? 'http://192.168.1.66:8080/?' + serialize(params) : 'http://isoline.route.cit.api.here.com/routing/7.2/calculateisoline.json?' + serialize(params2);
	console.log(url);
	d3.json(url, 
		function(error, json) {
	  if (error) return console.warn(error);
	  data = json;
	  console.log(data);
	  latlngs = typeof data.Response !== 'undefined' ? data.Response.isolines[0].value : data.response.isoline[0].component[0].shape;
	  var latlngArray = []
	  for (var i = latlngs.length - 1; i >= 0; i--) {
	  	latlngArray.push([+latlngs[i].split(',')[0], +latlngs[i].split(',')[1]])
	  	// console.log(+latlngs[i].split(',')[0]);
	  };
	  // console.log(latlngArray);
	  var iso = L.polygon(latlngArray, {fill:false}).addTo(map);
	  isochrones.push(iso);
	  map.fitBounds(iso.getBounds());
	});

	$('#export').prop('disabled', false);
	// d3.json('https://route.st.nlp.nokia.com/routing/6.2/calculateisoline.json?mode=fastest;car;traffic:enabled&start=33.767484,-84.415090&time=PT0H15M&app_id=q42UE6vR4QjdyVxOugG9&app_code=UBCs-SNSuThUgnM-6Dy6OA&jsonCallback=callback', function(error, json){
	// 	if (error) return console.warn(error);
	//   data = json;
	//   console.log(data.Response.isolines[0].value);
	//   latlngs = data.Response.isolines[0].value;
	//   var latlngArray = []
	//   for (var i = latlngs.length - 1; i >= 0; i--) {
	//   	latlngArray.push([+latlngs[i].split(',')[0], +latlngs[i].split(',')[1]])
	//   	console.log(+latlngs[i].split(',')[0]);
	//   };
	//   console.log(latlngArray);
	//   var iso = L.polyline(latlngArray).addTo(map);
	//   isochrones.push(iso);
	//   map.fitBounds(iso.getBounds());
	// });
}

map.on('click', onMapClick);
$('#route').on('click', function(){onMapClick(markers[0])});
$('#export').on('click', function(){downloadGeojson()});
