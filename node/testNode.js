const http = require("http");
const port = 8046;
const url = require("url");
const server = http.createServer();

const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(":memory:"); // for now in memory for easy testing
const execute = async (db, sql) => {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) reject(err);
      resolve();
    });
  });
};

const fs = require("fs");
{
  fs.readFile("dbdef.txt", (err, sql) => 
  {
    if(err)
    {
      console.error(err);
      return;
    }
    
    execute(db, sql.toString()).catch((err) =>
    {
      console.error(err);
    });
  });
}

server.on("request", (req, res) => 
{
  if (req.method === "GET")
  {
    var parsedUrl = url.parse(req.url, true);
    var objectUrl = parsedUrl.query;

    req.on("error", (err) => 
    {
      console.error(err);
      res.statusCode = 400;
      res.end();
    });

    res.on("error", (err) => 
    {
      console.error(err);
    });

    res.setHeader('Content-Type', 'text/plain');

    for (let key in objectUrl)
      res.write(`item: key="${key}" value="${objectUrl[key]}";\n`);
    res.end();
  }

  if (req.method === "POST")
  {
    var bodyArray = []; // variable to store posted data
    var body = ''; // variable to store posted data
    
    req.on("error", (err) => 
    {
      
    }).on("data", (chunk) => 
    {
      bodyArray.push(chunk);
    }).on("end", () =>
    {
      body = bodyArray.toString(); // incorrect!
    });
  }
});

server.listen(port);