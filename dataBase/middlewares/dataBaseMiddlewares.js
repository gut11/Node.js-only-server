const fs = require("fs");
const { resolve } = require("path");
const filesDir = "./files/";




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


function getFilesList(){
    return new Promise((resolve,reject) => {
        fs.readdir(filesDir, (err,files) => {
            if(err){
                reject(err)
            }
            else{
                files = remove_git_ignore_from_list(files);
                resolve(files);
            }
        })
    })
}


function remove_git_ignore_from_list(files){
    let index = files.indexOf(".gitignore");
    if(index > -1)
        files.splice(index,1);
    return files;
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


function createStreamForDownloadFile(filename){
    return new Promise((resolve,reject) => {
        const fileStream = fs.createReadStream(filesDir + filename);
        fileStream.on("error", err => {
            reject(err);
        })
        fileStream.on("open", () => {
            resolve(fileStream);
        })
    })
}





function saveFile(req, fileName,encoding) {
    const sucessMessage = fileName + " saved!";
    return new Promise((resolve,reject) => {
        const fileWriteStream = fs.createWriteStream(filesDir + fileName);
        fileWriteStream.on("error", err => {
            reject(err);
        })
        req.on("data", chunk => {
            fileWriteStream.write(chunk,encoding);
        });
        req.on("end", () => {
            resolve(sucessMessage);
        })
    });
}





module.exports = { 
    readFile, 
    clearFile, 
    appendFile, 
    saveFile,
    getFilesList,
    createStreamForDownloadFile
};