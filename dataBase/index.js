const http = require("http");
const PORT = 1500;
const statusCodeServerError = 500;
const statusCodeSucess = 200;
const statusCodeNotFound = 404;
const routeNotFoundMesage = "Route not found!";
const incompletSendSucessMessage = " sended with sucess!";
const middlewares = require("./middlewares/dataBaseMiddlewares.js");
const { format, parse_url, end_request, pipeReadableAndLogRequestEnd } = require("../globalMiddlewares/globalMiddlewares.js");
const { body_parser } = require("../body-parser/body-parser.js");







const server = http.createServer((req, res) => {
    const reqNumber = format.log_requisition_start();
    const clientIp = req.socket.localAddress + ":" + req.socket.remotePort;
    parse_url(req);
    format.log_data(req.url, req.method, req.headers.host, clientIp);
    if (req.method == "GET" && req.url == "/getData/") {
        middlewares.readFile("data.txt", res).then(data => {
            res.end(data);
        });
        return;
    }
    if (req.method == "POST" && req.url == "/postData/") {
        middlewares.format_log_route(req.url);
        body_parser(req).then(() => {
            let data = "\n" + req.body;
            middlewares.appendFile("data.txt", data, res);
        })
        return;
    }
    if (req.method == "POST" && req.url == "/uploadFile/") {
        const fileName = req.headers.filename;
        const encoding = req.headers.encoding;
        middlewares.saveFile(req, fileName, encoding)
            .then(msg => {
                end_request(res, statusCodeSucess, msg, reqNumber);
            })
            .catch(err => {
                end_request(res, statusCodeServerError, err, reqNumber);
            })
        return;
    }
    if (req.method == "GET" && req.url == "/downloadFile/") {
        const filename = req.headers.filename;
        const sucessMessage = filename + incompletSendSucessMessage;
        middlewares.createStreamForDownloadFile(filename)
        .then(fileStream => {
            pipeReadableAndLogRequestEnd(fileStream,res,sucessMessage,reqNumber);
        })
        .catch(err => {
            end_request(res,statusCodeServerError,err,reqNumber);
        })
        return;
    }
    if (req.method == "GET" && req.url == "/availableFiles/") {
        middlewares.getFilesList()
            .then(files => {
                res.write(JSON.stringify(files));
                end_request(res,statusCodeSucess,"List of available files" + incompletSendSucessMessage);
            })
            .catch(err => {
                end_request(res,statusCodeServerError,err,reqNumber);
            })
        return;
    }
    if (req.method == "DELETE" && req.url == "/deleteData/") {
        middlewares.clearFile("data.txt", res);
        return;
    }
    end_request(res, statusCodeNotFound, routeNotFoundMesage, reqNumber);
})






server.listen(PORT, error => {
    if (error)
        console.log(error)
    else
        console.log("server running on port ", PORT);
})








