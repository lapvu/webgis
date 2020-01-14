const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", function(req, res, next) {
  db.query(
    `SELECT pm25,ST_AsGeoJson(geom) as geo FROM vn WHERE name_1 = 'Hà Nội'`,
    [],
    (err, result) => {
      if (err) {
        return next(err);
      }
      res.send(result.rows);
    }
  );
});

router.post("/", (req, res) => {
  const { lon, lat } = req.body;
  const sql = `select type_2,pm25,name_1,name_2, ST_AsGeoJson(geom) as geo from vn where ST_Within (ST_PointFromText('POINT(${lon} ${lat})', 4326),geom) and name_1 = 'Hà Nội';`;
  console.log(sql);
  db.query(sql, [], (err, result) => {
    if (err) {
      return console.log(err);
    }
    res.send(result.rows);
  });
});

module.exports = router;
