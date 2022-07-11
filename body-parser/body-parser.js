const fs = require("fs");
let contBackup = 0;


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
    let readingSubHeader = true;
    let isFirstTime = true;
    let readingData = false;
    let j;
    req.on("data", chunck => {
        let i = 0;
        while (i < chunck.length) {
            if (readingSubHeader) {
                let getSubHeaderReturn = getSubHeader(chunck, i, isFirstTime, boundaryText.length);
                let subHeader = getSubHeaderReturn.subHeader;
                i = getSubHeaderReturn.i;
                req.form.subHeader.push(ConvertSubheaderToObject(subHeader));
                req.form.dataType.push(getDataType(req.form.subHeader[req.form.subHeader.length - 1]));
                readingSubHeader = false;
                readingData = true;
                isFirstTime = false;
                req.form.body.push("");
            }
            let body = "";
            while (readingData) {
                if (boundaryBuffer.includes(chunck[i])) {
                    let isBoundaryReturn = isBoundary(chunck, boundaryBuffer, i);
                    if (isBoundaryReturn.boolean) {
                        if (isBoundaryReturn.previousChars) {
                            body = body.substring(0, body.length - (isBoundaryReturn.previousChars + 3));
                        }
                        i = isBoundaryReturn.boundaryEnd;
                        if (chunck[i] == 45 && chunck[i + 1] == 45) { // 45 is "-" in utf-8 encoding
                            if (req.form.dataType[req.form.dataType.length - 1] == "text")
                                body = convertFromHexToUtf8(body);
                            req.form.body[req.form.body.length - 1] += body;
                            return;
                        }
                        else {
                            i = i + 2;
                            readingSubHeader = true;
                            readingData = false;
                        }
                    }
                } if (readingData) {
                    j = 0;
                    if (i + boundaryBuffer.length >= chunck.length) {
                        j = (i + boundaryBuffer.length - chunck.length) + 1;
                    }
                    while (j <= boundaryBuffer.length) {
                        body += chunck.toString("hex", i, i + 1);
                        i++;
                        j++;
                    }
                }
                if (i >= chunck.length || !readingData) {
                    if (req.form.dataType[req.form.dataType.length - 1] == "text")
                        body = convertFromHexToUtf8(body);
                    req.form.body[req.form.body.length - 1] += body;
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


function getSubHeader(chunck, i, isFirstTime, boundaryLength) {
    let subHeader = "";
    let nextChar = "";
    if (isFirstTime) {
        i = boundaryLength + 2;
    }
    while (true) {
        subHeader += toUtf8(chunck, i);
        nextChar = toUtf8(chunck, i + 1);
        if (nextChar == "\r") {
            let nextChars = toUtf8(chunck, i + 2) + toUtf8(chunck, i + 3) + toUtf8(chunck, i + 4);
            if (nextChars == "\n\r\n") {
                return { subHeader, i: i + 5 };
            }
        }
        i++;
    }
}


function toUtf8(chunck, i) {
    return chunck.toString("utf8", i, i + 1);
}


function toHex(chunck, i) {
    return chunck.toString("hex", i, i + 1);
}


function isBoundary(chunck, boundary, i) {
    let nextChar = chunck[i + 1];
    let previousChar = chunck[i - 1];
    let previousCharsAreBoundarys = 0;
    if (previousChar != undefined) {
        if (boundary.includes(previousChar)) {
            do {
                i--;
                previousChar = chunck[i - 1];
                previousCharsAreBoundarys += returnNumberCharsinHex(chunck, i);
            } while (boundary.includes(previousChar));
            return tryReadBoundary(chunck, i, boundary, previousCharsAreBoundarys);
        }
    }
    if (boundary.includes(nextChar)) {
        return tryReadBoundary(chunck, i, boundary, false);
    } else {
        return { boolean: false, i: i };
    }
}


function returnNumberCharsinHex(chunck, i) {
    let previousCharInHex;
    previousCharInHex = toHex(chunck, i - 1);
    return previousCharInHex.length;
}


function tryReadBoundary(chunck, i, boundary, previousChars) {
    let char = chunck[i];
    let cont = 0;
    let iWhereBoundaryStarts = i;
    if (contBackup) {
        cont = contBackup;
        contBackup = 0;
        console.log("fez backup");
    }
    do {
        cont++;
        i++;
        char = chunck[i];
    } while (boundary.includes(char))
    if (cont == boundary.length || cont == boundary.length + 2) {
        let iWhereBoundaryEnds = iWhereBoundaryStarts + boundary.length;
        if (previousChars)
            return { boolean: true, boundaryEnd: iWhereBoundaryEnds, previousChars };
        else
            return { boolean: true, boundaryEnd: iWhereBoundaryEnds, previousChars: false };
    }
    else {
        return { boolean: false, i: i };
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


module.exports = { body_parser }