const fs = require("fs");
const getDataType = require("../../body-parser/body-parser.js").getDataType;





function appendFile(fileName, data, res) {
    fileName = "./" + fileName;
    fs.appendFile(fileName, data, error => {
        if (error) {
            dealError(error, res);
        } else {
            res.writeHead(200, { "content-type": "text/plain" });
            res.end("Dados salvos com sucesso");
        }
    })
}


function clearFile(fileName, res) {
    fileName = "./" + fileName;
    let data = "";
    fs.writeFile(fileName, data, error => {
        if (error) {
            dealError(error, res);
        }
        else {
            res.writeHead(200, { "content-type": "text/plain" });
            res.end("Banco de dados deletado com sucesso");
        }
    });
}


function dealError(error, res) {
    console.log(error);
    res.writeHead(500, { "content-type": "text/plain" });
    res.end(error);
}


function readFile(fileName) {
    return new Promise((resolve, reject) => {
        fileName = "./" + fileName;
        fs.readFile(fileName, "utf8", (error, data) => {
            if (error)
                reject(error);
            else {
                resolve(data);
            }
        })
    })
}


function saveFile(data, fileName,encoding) {
    const dir = "./files/";
    fs.writeFile(dir + fileName,data,encoding, err => {
        if(err){
            console.log(err)
            return err;
        }
        else{
            const msg = "Arquivo salvo com sucesso!";
            console.log(msg);
            return msg;
        }
    });
}


module.exports = { readFile, clearFile, appendFile, saveFile }