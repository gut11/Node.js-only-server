const http = require("http");
const fs = require("fs");
const PORT = 5000;


//Server


const server = http.createServer((req,res) => {
    if(req.method == "GET" && req.url == "/style.css"){
        send_static_file("style.css",res);
    }
    if(req.method == "GET" && req.url == "/"){
        send_static_file("index.html",res);
    }
    body_parser(req);
    
})


server.listen(PORT, error => {
    if(error)
        console.log(error);
    else
        console.log("Server running on port",PORT);
});




//Functions


function body_parser(req){
    req.body = "";
    req.on("data", chunk => {
        console.log((req.on.toString()))
        req.body += chunk;
    }).on("error", error => {
        console.log("ERRO: ",error);
    }).on("end", () => {
        console.log("\n\nreq finalizado:\n\n",req.body);
    })
}



function send_static_file(file_name,res){
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



/* 
           COISAS QUE QUERO FAZER NESSE PROJETO ✔
        
    -Prover arquivos estaticos ✔

    -Prover o download de um arquivo 

    -Receber upload de arquivos ✔

    -Receber dados tanto por forms quanto pelas querys na url ✔

    -Receber dados e salva-los sem usar um bodyparser ✔

*/