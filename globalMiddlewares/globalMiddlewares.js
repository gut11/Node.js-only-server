const url = require("url");
const separator = "-----------------------------------\n";
const smallSeparator = "---------\n";
const statusCodeServerError = 500;
const statusCodeSucess = 200;
let cont = 0;





function log_data(route,method,hostIp,clientIp){
    req_route(route);
    req_method(method);
    req_host_ip(hostIp);
    req_client_ip(clientIp);
}


function log_requisition_end(msg,status,reqNumber){
    requisition_end(reqNumber);
    res_status(msg,status);
}


function log_requisition_start(){
    cont++;
    console.log(separator + "REQUISITION " + cont + " RECEIVED!\n");
    return cont;
}


function requisition_end(reqNumber){
    console.log(separator + "REQUISITION " + reqNumber + " ENDED!\n");
}


function req_route(route){
    console.log(smallSeparator + "ROUTE: " + route);
}


function req_method(method){
    console.log("METHOD: " + method);
}


function req_host_ip(hostIp){
    console.log("HOST IP: " + hostIp);
}


function req_client_ip(clientIp){
    console.log("CLIENT IP: " + clientIp + "\n" + smallSeparator + "\n" + separator);
}


function res_status(msg,status){
    if(status < 200 || status > 299)
        console.log(smallSeparator + "STATUS CODE: " + status + "\n" + "RESULT: ERROR\n" + msg);
    else
        console.log(smallSeparator + "STATUS CODE: " + status + "\n" + "RESULT: SUCESS\n" + msg);
    console.log(smallSeparator+ "\n" + separator);
}


function parse_url(req) {
    const parsedUrl = url.parse(req.url, true);
    req.query = parsedUrl.query;
    req.url = parsedUrl.pathname;
    if(req.url[req.url.length - 1] != "/")
        req.url = req.url + "/";
}


function end_request(res,statusCode,msg,reqNumber){
    if(statusCode < 200 || statusCode > 299){
        res.statusCode = statusCode;
        res.end(String(msg));
        log_requisition_end(msg,statusCode,reqNumber);
    }
    else{
        res.end();
        log_requisition_end(msg,statusCode,reqNumber);
    }
}


function pipeReadableAndLogRequestEnd(read_stream,res,sucessMessage,reqNumber){
    read_stream.on("data", chunk => {
        res.statusCode = statusCodeSucess;
        res.write(chunk);
    })
    read_stream.on("end", () => {
        end_request(res, res.statusCode, sucessMessage,reqNumber);
    });
    read_stream.on("error", error => {
        end_request(res, statusCodeServerError, error,reqNumber);
    })
}




module.exports = {
    format: {
        log_requisition_start,
        log_data,
        log_requisition_end,
    },
    pipeReadableAndLogRequestEnd,
    parse_url,
    end_request
};