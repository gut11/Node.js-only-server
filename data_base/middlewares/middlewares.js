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


function saveFiles(form, header, body) {
    let i = 0;
    let encoding;
    if (body) {
        let filename = header["filename"];
        let type = getDataType(header);
        if (type == "text") {
            encoding = "utf8";
        }
        else {
            encoding = "hex";
        }
        fs.writeFile("./files/" + filename, body, encoding, error => {
            if (error)
                console.log(error);
            else
                console.log("Arquivo salvo com sucesso");
        })
        return;
    }
    if (form) {
        form.subHeader.forEach(subHeader => {
            if (subHeader.filename) {
                if (form.dataType == "text")
                    encoding = "utf8";
                else
                    encoding = "hex";
                fs.writeFile("./files/" + subHeader.filename, form.body[i], encoding, error => {
                    if (error)
                        console.log(error);
                    else
                        console.log("Arquivo salvo com sucesso");
                })
            }
            i++;
        })
    }
}


module.exports = { readFile, clearFile, appendFile, saveFiles }