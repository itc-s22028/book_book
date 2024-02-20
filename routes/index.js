// import express from 'express'
// const router = express.Router();
//
// /* GET home page. */
// router.get('/', function(req, res, next) {
//   return res.status(200).json({message: "ok"});
// });
//
// module.exports = router;

const express = require("express");

const router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  return res.status(200).json({a: "hello"});
});

module.exports = router;
