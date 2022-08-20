const http = require("http");
const fs = require("fs");
const url = require("url");
const PORT = 5000;
const downloadsDir = "./public/downloads";
const dataBaseIp = "127.0.0.1"
const dataBasePort = 1500;
const { body_parser } = require("./body-parser/body-parser.js");


//Server


const server = http.createServer((req, res) => {
    parseUrl(req);
    if (req.method == "GET" && req.url == "/") {
        send_static_file("index.html", res);
    }
    if (req.method == "GET" && req.url == "/style.css") {
        send_static_file("style.css", res);
    }
    if (req.method == "GET" && req.url == "/script.js") {
        send_static_file("script.js", res);
    }
    if (req.method == "POST" && req.url == "/uploadFile") {
        body_parser(req).then(() => {
            console.log("voltei do body parser")
            httpReq(req,req.form.body[0]);
            res.end("banana");
        })
    }
    if (req.method == "GET" && req.url == "/download") {
        const file_name = req.query.filename;
        get_file_data_base(req, res);
        res.end("chocolate");
    }
    if (req.method == "GET" && req.url == "/files-name") {
        let names = get_files_name(downloadsDir);
        res.end(JSON.stringify(names));
    }
    if (req.method == "GET" && req.url == "/test") {
        httpReq(req);
    }
})


server.listen(PORT, error => {
    if (error)
        console.log(error);
    else
        console.log("Server running on port", PORT);
});


function httpReq(clientReq,data) {
    let encoding;
    let filename = clientReq.form.subHeader[0].filename;
    if(clientReq.form.dataType[0] == "binary")
        encoding = "binary";
    else
        encoding = "utf8";
        encoding = "utf8";
        filename = "cabeca da minha pika.txt"
    
    const headers = clientReq.headers;
    const options = {
        host: dataBaseIp,
        port: dataBasePort,
        path: "/uploadFile",
        method: "POST",
        headers: headers,
    };
    let dataReq = http.request(options, dataRes => {
        console.log("comeco callback");
        console.log();
    })
    dataReq.write("bananana")
    dataReq.end();
}



function httpGet() {
    const req = http.get("http://" + dataBaseIp + ":" + dataBasePort + "/test", res => {
        console.log("respondido");
        res.on("data", chunk => {
            console.log("dados na res");
            console.log(chunk.toString());
        })
    })
}




//Functions



function get_files_name(dir) {
    return fs.readdirSync(dir);
}


function saveFile(dir, data) {
}



function send_static_file(file_name, res) {
    const public_folder_adress = "./public/";
    const file_adress = public_folder_adress + file_name;
    // Create the file stream
    const read_stream = fs.createReadStream(file_adress);
    // Wait for the moment when the stream is created
    read_stream.on("open", () => {
        // Pipe that stream to the client
        read_stream.pipe(res);
    })
    read_stream.on("error", error => {
        // show errors
        console.log(error);
    })
}

function send_download_file(file_name, res) {
    const public_folder_adress = "./public/downloads/";
    const file_adress = public_folder_adress + file_name;
    const statusOk = 200;
    const statusEr = 500;
    const header = { "Content-Disposition": "attachment; filename=" + file_name };
    // Create the file stream
    const read_stream = fs.createReadStream(file_adress);
    // Wait for the moment when the stream is created
    read_stream.on("open", () => {
        // Pipe that stream to the client
        res.writeHead(statusOk, header);
        read_stream.pipe(res);
    })
    read_stream.on("error", error => {
        // show errors
        res.writeHead(statusEr);
        res.end(JSON.stringify(error));
        console.log(error);
    })
}


function get_file_data_base(req, res) {
    http.get("http://localhost:1500/downloadFile",);
    console.log("amendoas")
}


function parseUrl(req) {
    const parsedUrl = url.parse(req.url, true);
    req.query = parsedUrl.query;
    req.url = parsedUrl.pathname;
}



/* 
           COISAS QUE QUERO FAZER NESSE PROJETO ✔
        
    -Prover arquivos estaticos ✔

    -Prover o download de um arquivo 

    -Receber upload de arquivos ✔

    -Receber dados tanto por forms quanto pelas querys na url ✔

    -Receber dados e salva-los sem usar um bodyparser ✔

*/