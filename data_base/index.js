const http = require("http");
const fs = require("fs");
const PORT = 1500;
const middlewares = require("./middlewares/middlewares.js");
const bodyParser = require("../body-parser/body-parser.js");




const server = http.createServer((req, res) => {
    if (req.method == "GET" && req.url == "/getData") {
        res.writeHead(200, { "content-type": "text/plain; charset=utf-8" })
        middlewares.readFile("data.txt", res).then(data => {
            res.end(data);
        });
    }
    if (req.method == "POST" && req.url == "/postData") {
        bodyParser.body_parser(req).then(() => {
            let data = "\n" + req.body;
            middlewares.appendFile("data.txt", data, res);
        })
    }
    if (req.method == "POST" && req.url == "/uploadFile") {
        bodyParser.body_parser(req).then(() => {
            if (req.headers["content-type"].includes("multipart/form-data"))
                middlewares.saveFiles(req.form, req.headers, false, false);
            else if (req.headers["content-type"].includes("image/"))
                middlewares.saveFiles(false, req.headers, req.body);
        }).catch(error => {
            console.log("almofada", error);
        })
        res.end("bananas");
    }
    if (req.method == "DELETE" && req.url == "/deleteData") {
        let data = "";
        middlewares.clearFile("data.txt", res);
    }
})


server.listen(PORT, error => {
    if (error)
        console.log(error)
    else
        console.log("server running on port ", PORT);
})


