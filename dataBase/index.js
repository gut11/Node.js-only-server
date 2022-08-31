const http = require("http");
const PORT = 1500;
const statusCodeServerError = 500;
const statusCodeSucess = 200;
const statusCodeNotFound = 404;
const routeNotFoundMesage = "Route not found!";
const incompletSendSucessMessage = " sended with sucess!";
const middlewares = require("./middlewares/dataBaseMiddlewares.js");
const { format, parse_url, end_request, pipeReadableAndLogRequestEnd } = require("../globalMiddlewares/globalMiddlewares.js");








const server = http.createServer((req, res) => {
    const reqNumber = format.log_requisition_start();
    const clientIp = req.socket.localAddress + ":" + req.socket.remotePort;
    parse_url(req);7
    format.log_data(req.url, req.method, req.headers.host, clientIp);
    if (req.method == "GET" && req.url == "/getData/") {
        middlewares.createReadableForTxtFile()
        .then(fileStream => {
            const sucessMessage = "Data from text file" + incompletSendSucessMessage;
            pipeReadableAndLogRequestEnd(fileStream,res,sucessMessage,reqNumber);
        })
        .catch(err => {
            end_request(res,statusCodeServerError,err,reqNumber);
        })
        return;
    }
    if (req.method == "POST" && req.url == "/postData/") {
        const sucessMessage = "Data saved to text file with sucess!";
            middlewares.createWritableForTxtFile()
            .then(writable => {
                writable.on("finish", () => {
                    end_request(res,statusCodeSucess,sucessMessage,reqNumber);
                })
                req.pipe(writable);
            })
            .catch(err => {
                end_request(res,statusCodeServerError,err,reqNumber);
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
        const sucessMessage = "List of available files" + incompletSendSucessMessage;
        middlewares.getFilesList()
            .then(files => {
                res.write(JSON.stringify(files));
                end_request(res,statusCodeSucess,sucessMessage,reqNumber);
            })
            .catch(err => {
                end_request(res,statusCodeServerError,err,reqNumber);
            })
        return;
    }
    if (req.method == "DELETE" && req.url == "/deleteData/") {
        middlewares.clearFile("data.txt", res)
        .then(sucessMessage => {
            end_request(res,statusCodeSucess,sucessMessage,reqNumber);
        })
        .catch(err => {
            end_request(res,statusCodeServerError,err,reqNumber);
        })
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








