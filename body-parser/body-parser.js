const fs = require("fs");



//missing backup






function body_parser(req) {
    return new Promise((resolve, reject) => {
        if (req.headers["content-type"] == "application/x-www-form-urlencoded") {
            req.setEncoding("utf8");
            concatenateChuncksOnReq(resolve, reject, req);
        }
        else if (req.headers["content-type"].includes("image/")) {
            req.setEncoding("hex");
            concatenateChuncksOnReq(resolve, reject, req);
        }
        else if (req.headers["content-type"].includes("multipart/form-data")) {
            let boundaryText = getBoundary(req);
            let boundaryBuffer = CreateBoundaryBuffer(boundaryText);
            multipartParser(req, boundaryText, boundaryBuffer, resolve, reject);
        }
    })
}


function CreateBoundaryBuffer(boundary) {
    boundary = Buffer.from(boundary, "utf-8");
    return boundary;
}


function multipartParser(req, boundaryText, boundaryBuffer, resolve, reject) {
    req.form = {};
    req.form.subHeader = [];
    req.form.body = [];
    req.form.dataType = [];
    let subHeaderBrokenInTwoChuncks = false;
    let isBoundaryBroken = false;
    let dataFromLastChunckBoundary = {};
    let readingSubHeader = true;
    let isFirstTime = true;
    let readingData = false;
    req.on("data", chunck => {
        let i = 0;
        while (i < chunck.length) {
            let getSubHeaderReturn;
            if (readingSubHeader) {
                if (subHeaderBrokenInTwoChuncks) {
                    getSubHeaderReturn = getSubHeader(chunck, i, isFirstTime, boundaryText.length, subHeaderBrokenInTwoChuncks);
                    subHeaderBrokenInTwoChuncks = false;
                } 
                else {
                    getSubHeaderReturn = getSubHeader(chunck, i, isFirstTime, boundaryText.length, false);
                }
                if (getSubHeaderReturn.broken) {
                    subHeaderBrokenInTwoChuncks = getSubHeaderReturn;
                    break;
                } 
                else {
                    let subHeader = getSubHeaderReturn.subHeader;
                    i = getSubHeaderReturn.i;
                    req.form.subHeader.push(ConvertSubheaderToObject(subHeader));
                    req.form.dataType.push(getDataType(req.form.subHeader[req.form.subHeader.length - 1]));
                    readingSubHeader = false;
                    readingData = true;
                    isFirstTime = false;
                    req.form.body.push("");
                }
            }
            let body = "";
            while (readingData) {
                let isBoundaryReturn;
                if (boundaryBuffer.includes(chunck[i]) || isBoundaryBroken) {
                    if (isBoundaryBroken) {
                        isBoundaryReturn = isBoundary(chunck, boundaryBuffer, i, dataFromLastChunckBoundary);
                        req.form.body[req.form.body.length - 1] = req.form.body[req.form.body.length - 1].substring(0, req.form.body[req.form.body.length - 1].length - dataFromLastChunckBoundary.numberCharsInHexSavedOnReq);
                        isBoundaryBroken = false;
                    }
                    else {
                        isBoundaryReturn = isBoundary(chunck, boundaryBuffer, i);
                    }
                    if (isBoundaryReturn.broken) {
                        console.log("broken 2")
                        isBoundaryBroken = true;
                        dataFromLastChunckBoundary = isBoundaryReturn.dataFromLastChunckBoundary;
                        applyEncodingBodyAndSaveOnReq(req, body);
                        break;
                    }
                    if (isBoundaryReturn.boolean) {
                        if (isBoundaryReturn.numberCharsInHexSavedBody)
                            body = body.substring(0, body.length - isBoundaryReturn.numberCharsInHexSavedBody);
                        i = isBoundaryReturn.boundaryEnd;
                        if (chunck[i] == 45 && chunck[i + 1] == 45) { // 45 is "-" in utf-8 encoding
                            applyEncodingBodyAndSaveOnReq(req, body);
                            return;
                        }
                        else {
                            readingSubHeader = true;
                            readingData = false;
                        }
                    }
                } if (readingData) {
                    let readChunckReturn = readChunckAndSaveOnBody(chunck, boundaryBuffer, i);
                    body += readChunckReturn.body;
                    i = readChunckReturn.i;
                }
                if (i >= chunck.length || !readingData) {
                    applyEncodingBodyAndSaveOnReq(req, body);
                    break;
                }
            }
        }
    })

    req.on("end", error => {
        if (error) {
            console.log("deu erro em td:", error);
            reject();
        }
        else {
            console.log("deu td certo, pelo menos em teoria");
            resolve();
        }
    })
}



function readChunckAndSaveOnBody(chunck, boundaryBuffer, i) {
    let j = 0;
    let body = "";
    if (i + boundaryBuffer.length >= chunck.length) {
        j = (i + boundaryBuffer.length - chunck.length) + 1;
    }
    while (j <= boundaryBuffer.length) {
        body += chunck.toString("hex", i, i + 1);
        i++;
        j++;
    }
    return { body, i };
}


function applyEncodingBodyAndSaveOnReq(req, body) {
    if (req.form.dataType[req.form.dataType.length - 1] == "text")
        body = convertFromHexToUtf8(body);
    req.form.body[req.form.body.length - 1] += body;
    return;
}


function convertFromHexToUtf8(hexString) {
    let buffer = Buffer.from(hexString, "hex");
    return buffer.toString("utf-8");
}


function getDataType(subHeader) {
    let contentType;
    let textMimeTypes = ["application/x-csh",
        "text/css",
        "text/csv",
        "text/html",
        "text/calendar",
        "text/javascript",
        "application/json",
        "text/javascript",
        "application/x-httpd-php",
        "application/rtf",
        "application/x-sh",
        "image/svg+xml",
        "text/plain",
        "application/xhtml+xml",
        "application/xml",
        "application/vnd.mozilla.xul+xml"];
    if (subHeader["Content-Type"]) {
        contentType = subHeader["Content-Type"];
    } else if (subHeader["content-type"]) {
        contentType = subHeader["content-type"];
    }
    if (textMimeTypes.includes(contentType) || !contentType)
        return "text";
    else
        return "binary";
}


function ConvertSubheaderToObject(subHeader) {
    if (subHeader == "\n")
        return ""
    subHeader = jsonFormater(subHeader);
    console.log(subHeader);
    return JSON.parse(subHeader);
}


function jsonFormater(subHeader) {
    let fields = subHeader.split("\r\n");
    let JsonStrings = [];
    let JsonString = "";
    fields.forEach(field => {
        field = `"` + field;
        if (field.indexOf(";") == -1) {
            field = field.slice(0, field.indexOf(":")) + `":"` + field.slice(field.indexOf(":") + 2, field.length) + `"`;
            JsonStrings.push(field);
        } else {
            let subFields = field.split("; ");
            subFields.forEach(subF => {
                if (subF[0] == `"`) {
                    JsonStrings.push(subF.slice(0, subF.indexOf(":")) + `":"` + subF.slice(subF.indexOf(":") + 2, subF.length) + `"`);
                }
                else {
                    let equalIndex = subF.indexOf("=");
                    if (subF[equalIndex + 1] == `"`)
                        JsonStrings.push(`"` + subF.slice(0, equalIndex) + `":` + subF.slice(equalIndex + 1, subF.length));
                    else
                        JsonStrings.push(`"` + subF.slice(0, equalIndex) + `":"` + subF.slice(equalIndex + 1, subF.length) + `"`);
                }
            })
        }
    })
    JsonStrings.forEach(string => {
        JsonString = JsonString + string + ",";
    })
    JsonString = "{" + JsonString.slice(0, JsonString.length - 1) + "}";
    return JsonString;
}


function getSubHeader(chunck, i, isFirstTime, boundaryLength, subHeaderFromLastChunck) {
    let subHeader = "";
    i += 2;
    if (isFirstTime)
        i += boundaryLength;
    if (subHeaderFromLastChunck) {
        subHeader = subHeaderFromLastChunck.subHeader;
        let nextChars = toUtf8(chunck, i) + toUtf8(chunck, i + 1) + toUtf8(chunck, i + 2);
        if (nextChars[0] == "\n" || nextChars[0] == "\r") {
            if (nextChars == "\n\r\n") {
                subHeader = subHeader.slice(0, subHeader.length - 1); E
            }
            if (subHeaderFromLastChunck.last2CharsFromPreviousChunck == "\n\r" && nextChars[0] == "\n") {
                subHeader = subHeader.slice(0, subHeader.length - 3);
                return { subHeader, i: i + 1 };
            }
        }
    }
    if (toUtf8(chunck, i + 2) != "\r") {
        if (toUtf8(chunck, i) == "\r")
            i++;
        if (toUtf8(chunck, i) == "\n")
            i++;
    }
    while (i < chunck.length) {
        if (toUtf8(chunck, i) == "\r") {
            let nextChars = toUtf8(chunck, i + 1) + toUtf8(chunck, i + 2) + toUtf8(chunck, i + 3);
            if (nextChars == "\n\r\n") {
                return { subHeader, i: i + 4 };
            }

        }
        subHeader += toUtf8(chunck, i);
        i++;
    }
    let last2CharsFromPreviousChunck = toUtf8(chunck, i - 1) + toUtf8(chunck, i - 2);
    return { subHeader, broken: true, last2CharsFromPreviousChunck };
}


function toUtf8(chunck, i) {
    return chunck.toString("utf8", i, i + 1);
}


function toHex(chunck, i) {
    return chunck.toString("hex", i, i + 1);
}


function isBoundary(chunck, boundary, i, dataFromLastChunckBoundary) {
    let nextChar = chunck[i + 1];
    let previousChar = chunck[i - 1];
    if (dataFromLastChunckBoundary != undefined){
        let char = chunck[i];
        if (dataFromLastChunckBoundary.numberBytesReaded == boundary.length && !boundary.includes(char))
            return { boolean: true, boundaryEnd: i, numberCharsInHexSavedBody: false };
        else if(boundary.includes(char))
            return tryReadBoundary(chunck, i, boundary, false, dataFromLastChunckBoundary);
        else
            return { boolean: false };
    }
    if (previousChar != undefined) {
        if (boundary.includes(previousChar)) {
            let goBackReturn = goBackToLatestCharMatchesAnyBoundaryChar(chunck, boundary, i);
            return tryReadBoundary(chunck, goBackReturn.i, boundary, goBackReturn.numberCharsInHex, false);
        }
    }
    if (nextChar != undefined) {
        if (boundary.includes(nextChar)) 
            return tryReadBoundary(chunck, i, boundary, false, false);
        else
            return { boolean: false };
    }
    else
        return { dataFromLastChunckBoundary: { numberBytesReaded: 1 }, broken: true };
}


function goBackToLatestCharMatchesAnyBoundaryChar(chunck, boundary, i) {
    let previousChar;
    let numberCharsInHex = 4; //starts in 4 for \r and \n in hex
    do {
        i--;
        numberCharsInHex += returnNumberCharsinHex(chunck, i);
        previousChar = chunck[i - 1];
    } while (boundary.includes(previousChar));
    return { i, numberCharsInHex }
}


function returnNumberCharsinHex(chunck, i) {
    let previousCharInHex;
    previousCharInHex = toHex(chunck, i - 1);
    return previousCharInHex.length;
}


function tryReadBoundary(chunck, i, boundary, numberCharsInHex, dataFromLastChunckBoundary) {
    let cont = 0;
    let iWhereBoundaryStarts = i;
    if (dataFromLastChunckBoundary) {
        cont = dataFromLastChunckBoundary.numberBytesReaded;
        iWhereBoundaryStarts = i - cont;
    }
    let numberCharsReturn = NumberCharsMatchBoundaryCharsInSequence(chunck, i, boundary, numberCharsInHex, cont);
    if (Number.isInteger(numberCharsReturn))
        return checkIfWasBoundaryAndReturn(numberCharsReturn, boundary, numberCharsInHex, iWhereBoundaryStarts);
    else
        return numberCharsReturn;
}


function NumberCharsMatchBoundaryCharsInSequence(chunck, i, boundary, numberCharsInHex, cont) {
    let char;
    do {
        cont++;
        i++;
        char = chunck[i];
        if (char == undefined)  //if char is undefined that means that boundary is divided in two chuncks
            return checkIfBoundaryIsbrokenOrNotAndReturn(boundary, cont, numberCharsInHex);
    } while (boundary.includes(char));
    return cont;
}


function checkIfBoundaryIsbrokenOrNotAndReturn(boundary, cont, numberCharsInHexSavedOnReq) {
    if (cont == boundary.length + 2)
        return cont;
    else
        return { dataFromLastChunckBoundary: { numberBytesReaded: cont, numberCharsInHexSavedOnReq }, broken: true };
}


function checkIfWasBoundaryAndReturn(cont, boundary, numberCharsInHex, iWhereBoundaryStarts) {
    if (cont == boundary.length || cont == boundary.length + 2) {
        let iWhereBoundaryEnds = iWhereBoundaryStarts + boundary.length;
        if (numberCharsInHex)
            return { boolean: true, boundaryEnd: iWhereBoundaryEnds, numberCharsInHexSavedBody: numberCharsInHex };
        else
            return { boolean: true, boundaryEnd: iWhereBoundaryEnds, numberCharsInHexSavedBody: false };
    }
    else {
        return { boolean: false };
    }
}


function getBoundary(req) {
    let splited;
    splited = req.headers["content-type"].split("boundary=");
    splited[1] = "--" + splited[1];
    return splited[1];
}


function concatenateChuncksOnReq(resolve, reject, req) {
    req.body = "";
    req.on("data", chunck => {
        req.body += chunck;
    })
    req.on("end", error => {
        if (error) {
            res.end("error");
            reject();
        }
        else {
            resolve();
        }
    })
}


module.exports = { body_parser, getDataType }