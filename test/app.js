const express = require("express");
const app = express();

app.get("/", (req, res) => 
{
  res.setHeader('Content-Type', 'text/plain');

  var body = "";

  for (let key in req.query)
    body += `item: key="${key}" value="${req.query[key]}";\n`;

  res.send(body);
});

app.listen(8046);