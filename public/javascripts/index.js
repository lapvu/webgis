const format = "image/png";
let map;
let layerVn;
let stillMoving = [];
let pmLayer;
function initialize_map() {
  layerBG = new ol.layer.Tile({
    source: new ol.source.OSM({})
  });

  layerVn = new ol.layer.Image({
    source: new ol.source.ImageWMS({
      ratio: 1,
      url: "http://localhost:8080/geoserver/webgis/wms?",
      params: {
        FORMAT: format,
        LAYERS: "vn"
      },
      serverType: "geoserver"
    })
  });

  const viewMap = new ol.View({
    center: [11854155.519330788, 1981739.4575941544],
    zoom: 5
  });

  map = new ol.Map({
    target: "map",
    layers: [layerBG, layerVn],
    view: viewMap
  });

  // map.on('click', (e) => {
  //     console.log(e.coordinate)
  // })

  const popper = document.getElementById("info");

  const virtualElement = {
    getBoundingClientRect: generateGetBoundingClientRect()
  };

  const instance = Popper.createPopper(virtualElement, popper);

  function delayPopup(x, y, lon, lat) {
    stillMoving.push(true);
    setTimeout(function() {
      stillMoving.shift();
      if (stillMoving[0]) {
        return;
      } else {
        if (pmLayer) {
          map.removeLayer(pmLayer);
        }
        axios
          .post("/api", {
            lon,
            lat
          })
          .then(res => {
            if (res.data.length != 0) {
              virtualElement.getBoundingClientRect = generateGetBoundingClientRect(
                x,
                y
              );
              instance.update();
              let vectorSource = new ol.source.Vector({});
              let geojsonFormat = new ol.format.GeoJSON();
              let features = geojsonFormat.readFeatures(res.data[0].geo, {
                dataProjection: "EPSG:4326",
                featureProjection: "EPSG:3857"
              });
              vectorSource.addFeatures(features);
              pmLayer = new ol.layer.Vector({
                title: "test",
                source: vectorSource,
                style: new ol.style.Style({
                  fill: new ol.style.Fill({
                    color: [255, 255, 255, 0.4]
                  })
                })
              });
              map.addLayer(pmLayer);
              $("#info").html(
                `<div>${res.data[0].type_2} : ${res.data[0].name_2}</div><div>Chỉ số ô nhiễm : ${res.data[0].pm25}</div><div>Tình trạng : <span id="type"></span></div>`
              );
              setStyleInfo(res.data[0].pm25);
            } else {
              virtualElement.getBoundingClientRect = generateGetBoundingClientRect(
                0,
                0
              );
              instance.update();
            }
          })
          .catch(e => console.log(e));
      }
    }, 100);
  }
  map.on("pointermove", e => {
    const { x, y } = e.pointerEvent;
    let lonlat = ol.proj.transform(e.coordinate, "EPSG:3857", "EPSG:4326");
    let lon = lonlat[0];
    let lat = lonlat[1];
    delayPopup(x, y, lon, lat);
  });
}

let data;

const zoomToHaNoi = () => {
  let vectorSource = new ol.source.Vector({});

  axios
    .get("/api")
    .then(res => {
      let geojsonFormat = new ol.format.GeoJSON();
      data = res.data;
      res.data.forEach((e, i) => {
        let features = geojsonFormat.readFeatures(e.geo, {
          dataProjection: "EPSG:4326",
          featureProjection: "EPSG:3857"
        });
        features[0].id = i;
        vectorSource.addFeatures(features);
      });
    })
    .catch(e => console.log(e));

  let hnLayer = new ol.layer.Vector({
    title: "ha noi",
    source: vectorSource,
    style: styleFunction
  });

  map.removeLayer(layerVn);

  map.addLayer(hnLayer);

  map.setView(
    new ol.View({
      center: [11769773.615351439, 2389192.1931097545],
      zoom: 10
    })
  );
};

function generateGetBoundingClientRect(x = 0, y = 0) {
  return () => ({
    width: 0,
    height: 0,
    top: y,
    right: x,
    bottom: y,
    left: x
  });
}

let styles = {
  good: new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: "black",
      width: 1
    }),
    fill: new ol.style.Fill({
      color: [166, 204, 61, 1]
    })
  }),
  average: new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: "black",
      width: 1
    }),
    fill: new ol.style.Fill({
      color: [248, 238, 31, 1]
    })
  }),
  notgood: new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: "black",
      width: 1
    }),
    fill: new ol.style.Fill({
      color: [245, 144, 34, 1]
    })
  }),
  bad: new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: "black",
      width: 1
    }),
    fill: new ol.style.Fill({
      color: [235, 33, 40, 1]
    })
  }),
  verybad: new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: "black",
      width: 1
    }),
    fill: new ol.style.Fill({
      color: [162, 28, 77, 1]
    })
  }),
  dangerous: new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: "black",
      width: 1
    }),
    fill: new ol.style.Fill({
      color: [138, 27, 30, 1]
    })
  })
};
var styleFunction = function(feature) {
  let type = "";
  let index = feature.id;
  if (0 <= data[index].pm25 && data[index].pm25 <= 50) {
    type = "good";
  } else if (51 <= data[index].pm25 && data[index].pm25 <= 100) {
    type = "average";
  } else if (101 <= data[index].pm25 && data[index].pm25 <= 150) {
    type = "notgood";
  } else if (151 <= data[index].pm25 && data[index].pm25 <= 200) {
    type = "bad";
  } else if (201 <= data[index].pm25 && data[index].pm25 <= 300) {
    type = "verybad";
  } else if (301 <= data[index].pm25 && data[index].pm25 <= 500) {
    type = "dangerous";
  }
  if (index < 29) {
    index++;
  }
  return styles[type];
};

const setStyleInfo = pm25 => {
  if (0 <= pm25 && pm25 <= 50) {
    $("#type").html(
      "<span style='background:rgba(166, 204, 61, 1);color:#fff'>Tốt</span>"
    );
  } else if (51 <= pm25 && pm25 <= 100) {
    $("#type").html(
      "<span style='background:rgba(248, 238, 31, 1);color:#fff'>Trung bình</span>"
    );
  } else if (101 <= pm25 && pm25 <= 150) {
    $("#type").html(
      "<span style='background:rgba(245, 144, 34, 1);color:#fff'>Không lành mạnh cho các nhóm nhạy cảm</span>"
    );
  } else if (151 <= pm25 && pm25 <= 200) {
    $("#type").html(
      "<span style='background:rgba(235, 33, 40, 1);color:#fff'>Không lành mạnh</span>"
    );
  } else if (201 <= pm25 && pm25 <= 300) {
    $("#type").html(
      "<span style='background:rgba(162, 28, 77, 1);color:#fff'>Rất không lành mạnh </span>"
    );
  } else if (301 <= pm25 && pm25 <= 500) {
    $("#type").html(
      "<span style='background:rgba(138, 27, 30, 1);color:#fff'>Nguy hiểm </span>"
    );
  }
};
