const http = require("http");
const PORT = 1500;
const middlewares = require("./middlewares/middlewares.js");
const { body_parser } = require("../body-parser/body-parser.js");
const { setTimeout } = require("timers/promises");




const server = http.createServer((req, res) => {
    if (req.method == "GET" && req.url == "/getData") {
        res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
        middlewares.readFile("data.txt", res).then(data => {
            res.end(data);
        });
    }
    if (req.method == "POST" && req.url == "/postData") {
        body_parser(req).then(() => {
            let data = "\n" + req.body;
            middlewares.appendFile("data.txt", data, res);
        })
    }
    if (req.method == "POST" && req.url == "/uploadFile") {
        console.log("bom dia");
        let data = "";
        let teste = 1;
        const encoding = req.headers.encoding;
        const fileName = req.headers.filename;
        req.on("data", chunck => {
            console.log("teve data");
            data += chunck.toString(encoding);
            console.log("data do lado de fora",data)
        })
        setTimeout(() => {console.log(req.read());},5000)
        req.on("end", () => {
            teste = 0;
            console.log("entrou no end",data);
            res.end("banana");
        })
    }
    if (req.method == "GET" && req.url == "/downloadFile") {
        console.log(req, "bananas")
    }
    if (req.method == "DELETE" && req.url == "/deleteData") {
        middlewares.clearFile("data.txt", res);
    }
})






server.listen(PORT, error => {
    if (error)
        console.log(error)
    else
        console.log("server running on port ", PORT);
})


