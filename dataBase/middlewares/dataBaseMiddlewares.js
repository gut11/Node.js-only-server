const fs = require("fs");
const filesDir = "./files/";
const txtFile = "./data.txt";



function createWritableForTxtFile() {
    return new Promise((resolve, reject) => {
        const writable = fs.createWriteStream(txtFile, {flags: "a"});
        writable.on("error", err => {
            reject(err);
        })
        writable.on("open", () => {
            console.log("bom dia")
            resolve(writable);
        })
        console.log("oi");
    })
}


function clearFile(fileName, res) {
    fileName = "./" + fileName;
    const data = "";
    const sucessMessage = "File cleared with sucess!";
    return new Promise((resolve,reject) => {
        fs.writeFile(fileName, data, error => {
            if (error) {
                reject(error)
            }
            else {
                resolve(sucessMessage);
            }
        });
    })
}


function getFilesList() {
    return new Promise((resolve, reject) => {
        fs.readdir(filesDir, (err, files) => {
            if (err) {
                reject(err)
            }
            else {
                files = remove_git_ignore_from_list(files);
                resolve(files);
            }
        })
    })
}


function remove_git_ignore_from_list(files) {
    let index = files.indexOf(".gitignore");
    if (index > -1)
        files.splice(index, 1);
    return files;
}


function createReadableForTxtFile() {
    return new Promise((resolve, reject) => {
        const fileStream = fs.createReadStream(txtFile);
        fileStream.on("error", err => {
            reject(err);
        })
        fileStream.on("open", () => {
            resolve(fileStream);
        })
    })
}


function createStreamForDownloadFile(filename) {
    return new Promise((resolve, reject) => {
        const fileStream = fs.createReadStream(filesDir + filename);
        fileStream.on("error", err => {
            reject(err);
        })
        fileStream.on("open", () => {
            resolve(fileStream);
        })
    })
}





function saveFile(req, fileName, encoding) {
    const sucessMessage = fileName + " saved!";
    return new Promise((resolve, reject) => {
        const fileWriteStream = fs.createWriteStream(filesDir + fileName,encoding);
        fileWriteStream.on("error", err => {
            reject(err);
        })
        fileWriteStream.on("drain", () => {
            req.resume();
        })
        fileWriteStream.on("open", () => {
            req.on("data", chunk => {
                if(!fileWriteStream.write(chunk,encoding)){
                    req.pause();
                }
            });
            req.on("end", () => {
                resolve(sucessMessage);
            })
        })
    });
}





module.exports = {
    createReadableForTxtFile,
    clearFile,
    createWritableForTxtFile,
    saveFile,
    getFilesList,
    createStreamForDownloadFile
};