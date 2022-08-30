const http = require("http");
const fs = require("fs");
const { body_parser } = require("../body-parser/body-parser.js");
const { format, parse_url, end_request, pipeReadableAndLogRequestEnd } = require("../globalMiddlewares/globalMiddlewares.js");
const PORT = 5000;
const dataBaseIp = "127.0.0.1";
const dataBasePort = 1500;
const statusCodeServerError = 500;
const statusCodeSucess = 200;
const statusCodeNotFound = 404;
const genericSucessMessage = "Operation completed with sucess!";
const incompletSendSucessMessage = " sended with sucess!";
const incompletDownloadSucessMessage = " downloaded with sucess!";
const incompletUploadSucessMessage = " uploaded with sucess!";
const routeNotFoundMesage = "Route not found!";





//Server


const server = http.createServer((req, res) => {
    const clientIp = req.socket.localAddress + ":" + req.socket.remotePort;
    const reqNumber = format.log_requisition_start();
    parse_url(req);
    format.log_data(req.url, req.method, req.headers.host, clientIp);
    if (req.method == "GET" && req.url == "/") {
        send_static_file("index.html", res, reqNumber);
        return;
    }
    if (req.method == "GET" && req.url == "/style.css/") {
        send_static_file("style.css", res, reqNumber);
        return;
    }
    if (req.method == "GET" && req.url == "/script.js/") {
        send_static_file("script.js", res, reqNumber);
        return;
    }
    if (req.method == "POST" && req.url == "/uploadFile/") {
        body_parser(req)
            .then(() => {
                upload_file(req, req.form.body[0])
                    .then(msg => {
                        end_request(res, statusCodeSucess, msg,reqNumber);
                    })
                    .catch(err => {
                        end_request(err, statusCodeServerError, err,reqNumber);
                    })
            })
        return;
    }
    if (req.method == "GET" && req.url == "/download/") {
        const filename = req.query.filename;
        get_file_data_base(filename)
        .then(file_stream => {
            const sucessMessage = filename + incompletDownloadSucessMessage;
            setHeadersForDownload(res,filename);
            pipeReadableAndLogRequestEnd(file_stream,res,sucessMessage,reqNumber);
        })
        .catch(err => {
            end_request(res,statusCodeServerError,err,reqNumber);
        })
        return;
    }
    if (req.method == "GET" && req.url == "/files-name/") {
        get_list_available_files_data_base()
        .then(list => {
            res.write(list);
            end_request(res,statusCodeSucess,genericSucessMessage,reqNumber);
        })
        .catch(err => {
            end_request(res,statusCodeServerError,err,reqNumber);
        });
        return;
    }
    if(req.method == "GET" && req.url == "/get-txt-data/"){
        
    }
    if(req.method == "POST" && req.url == "/save-txt-data/"){

    }
    if(req.method == "DEL" && req.url == "/del-txt-data/"){

    }
    end_request(res,statusCodeNotFound,routeNotFoundMesage,reqNumber);
})


server.listen(PORT, error => {
    if (error)
        console.log(error);
    else
        console.log("Server running on port", PORT);
});






//Functions


function getTxtDataFromDataBase(){
    const options = {
        host: dataBaseIp,
        port: dataBasePort,
        path: "/getData/",
    }
    const dataBaseReq = http.request(options, dataBaseRes => {
        
    })
}


function setHeadersForDownload(res,filename){
    const headerName =  "Content-Disposition";
    const headerValue = "attachment; filename=" + filename;
    res.setHeader(headerName,headerValue);
}



function get_list_available_files_data_base() {
    const options = {
        host: dataBaseIp,
        port: dataBasePort,
        path: "/availableFiles",
    }
    return new Promise((resolve,reject) => {
        const dataBaseReq = http.request(options, dataBaseRes => {
            let data = "";
            dataBaseRes.on("data", chunk => {
                data = chunk.toString();
            })
            dataBaseRes.on("end", () => {
                if(dataBaseRes.statusCode > 199 && dataBaseRes.statusCode < 300)
                    resolve(data);
                else
                    reject(data);
            })
        })
        dataBaseReq.on("error", err => {
            reject(err);
        })
        dataBaseReq.end(); 
    })
}




function get_file_data_base(filename) {
    const options = {
        host: dataBaseIp,
        port: dataBasePort,
        path: "/downloadFile",
        headers: { filename: filename },
    }
    return new Promise((resolve, reject) => {
        const dataBaseReq = http.request(options, dataBaseRes => {
            if (dataBaseRes.statusCode > 199 && dataBaseRes.statusCode < 300)
                resolve(dataBaseRes);
            else{
                let error = dataBaseRes.read();
                reject(error);
            }
        });
        dataBaseReq.on("error", err => {
            reject({ msg: err, statusCode: 500 });
        })
        dataBaseReq.end();
    })
}




function upload_file(clientReq, data) {
    const filename = clientReq.form.subHeader[0].filename;
    const encoding = get_file_encoding(clientReq);
    const sucessMessage = filename + incompletUploadSucessMessage;
    const options = {
        host: dataBaseIp,
        port: dataBasePort,
        path: "/uploadFile/",
        method: "POST",
        headers: { encoding, filename },
    };
    return new Promise((resolve, reject) => {
        const dataBaseReq = http.request(options, dataBaseRes => {
            if (dataBaseRes.statusCode > 199 && dataBaseRes.statusCode < 300)
                resolve(sucessMessage);
            else{
                let error = dataBaseRes.read();
                reject(error);
            }
        })
        dataBaseReq.on("error", err => {
            reject(err);
        })
        dataBaseReq.write(data, encoding);
        dataBaseReq.end();
    })

}



function log_req_finish_request(operationRes) {
    format.log_requisition_end(operationRes.msg, operationRes.statusCode);
    end_request(operationRes, operationRes.msg, operationRes.statusCode);
}


function log_req_finish_and_pipe_client() {

}


function get_file_encoding(req) {
    if (req.form.dataType[0] == "binary")
        return "binary";
    else
        return "utf8";
}





function send_static_file(file_name, res,reqNumber) {
    const public_folder_adress = "./public/";
    const file_adress = public_folder_adress + file_name;
    const sucessMessage = file_name + incompletSendSucessMessage;
    const read_stream = fs.createReadStream(file_adress);
    pipeReadableAndLogRequestEnd(read_stream,res,sucessMessage,reqNumber);
}









/* 
           COISAS QUE QUERO FAZER NESSE PROJETO ✔
        
    -Prover arquivos estaticos ✔

    -Prover o download de um arquivo 

    -Receber upload de arquivos ✔

    -Receber dados tanto por forms quanto pelas querys na url ✔

    -Receber dados e salva-los sem usar um bodyparser ✔

*/