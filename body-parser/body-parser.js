const benchmarkMode = false;
const mb = 100;
let start;





function body_parser(req) {
    return new Promise((resolve, reject) => {
        if (req.headers["content-type"] != undefined) {
            if (req.headers["content-type"].includes("image/")) {
                concatenateChuncksOnReq(resolve, reject, req, "binary");
            }
            else if (req.headers["content-type"].includes("multipart/form-data")) {
                let boundaryText = getBoundary(req);
                let boundaryBuffer = CreateBoundaryBuffer(boundaryText);
                multipartParser(req, boundaryText, boundaryBuffer, resolve, reject);
            }
            else
                concatenateChuncksOnReq(resolve, reject, req, "utf8");

        }
        else
            concatenateChuncksOnReq(resolve, reject, req, "utf8");
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
    const dash = 45; // 45 is dash in utf-8 encoding
    let subHeaderBrokenInTwoChuncks = false;
    let isBoundaryBroken = false;
    let readingSubHeader = true;
    let isFirstTime = true;
    let readingData = false;
    let bytesRead = 0;
    let pieceFromChunckCanBeBoundary;
    let iWhereDataStarts;
    if (benchmarkMode)
        start = Date.now();
    req.on("data", chunck => {
        let i = 0;
        const chunckLength = chunck.length;
        const boundaryLength = boundaryBuffer.length;
        while (i < chunckLength) {
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
            iWhereDataStarts = i;
            while (readingData) {
                let isBoundaryReturn;
                if (boundaryBuffer.includes(chunck[i]) || isBoundaryBroken) {
                    if (isBoundaryBroken) {
                        isBoundaryReturn = isBoundary(chunck, boundaryBuffer, i, bytesRead);
                        if (!isBoundaryReturn.boolean)
                            saveDataOnReq(req, pieceFromChunckCanBeBoundary, 0, pieceFromChunckCanBeBoundary.length);
                        else
                            isBoundaryBroken = false;
                    }
                    else {
                        isBoundaryReturn = isBoundary(chunck, boundaryBuffer, i);
                    }
                    if (isBoundaryReturn.broken) {
                        isBoundaryBroken = true;
                        bytesRead = isBoundaryReturn.numberBytesReaded;
                        saveDataOnReq(req, chunck, iWhereDataStarts, i);
                        pieceFromChunckCanBeBoundary = chunck.slice(i, chunckLength);
                        break;
                    }
                    if (isBoundaryReturn.boolean) {
                        i = isBoundaryReturn.boundaryEnd;
                        if (chunck[i] == dash && chunck[i + 1] == dash) {
                            if (isBoundaryBroken) {
                                isBoundaryBroken = false;
                                return;
                            }
                            else {
                                saveDataOnReq(req, chunck, iWhereDataStarts, i - boundaryLength - 2); //-2 for the dash and the \r\n
                                return;
                            }
                        }
                        else {
                            readingSubHeader = true;
                            readingData = false;
                            if (isBoundaryBroken) {
                                isBoundaryBroken = false;
                                break;
                            }
                            else {
                                saveDataOnReq(req, chunck, iWhereDataStarts, i - boundaryLength - 1); //-1 for the \r\n
                                break;
                            }
                        }
                    }
                } if (readingData) {
                    i = skipChunckChars(chunckLength, boundaryLength, i);
                }
                if (i >= chunckLength) {
                    saveDataOnReq(req, chunck, iWhereDataStarts, i);
                    break;
                }
            }
        }
    })
    req.on("end", error => {
        if (benchmarkMode) {
            let duration = Date.now() - start;
            console.log("Mb/S:", mb / (duration / 1000));
        }
        if (error)
            reject(error);
        else
            resolve();
    })
}


function skipChunckChars(chunckLength, boundaryLength, i) {
    let skipableChars;
    if (i + boundaryLength >= chunckLength) {
        skipableChars = chunckLength - i;
    }
    else
        skipableChars = boundaryLength;
    i += skipableChars;
    return i;
}


function saveDataOnReq(req, chunck, iWhereDataStarts, end) {
    chunck = chunck.slice(iWhereDataStarts, end);
    if (req.form.dataType[req.form.dataType.length - 1] == "binary")
        req.form.body[req.form.body.length - 1] += chunck.toString("binary");
    else
        req.form.body[req.form.body.length - 1] += chunck.toString("utf8");
    return;
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
    if (textMimeTypes.includes(contentType) || contentType == undefined)
        return "text";
    else
        return "binary";
}


function ConvertSubheaderToObject(subHeader) {
    if (subHeader == "\n")
        return ""
    subHeader = jsonFormater(subHeader);
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
            if (nextChars == "\n\r\n")
                return { subHeader, i: i + 4 };
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


function isBoundary(chunck, boundary, i, bytesReededOnLastChunck) {
    let nextChar = chunck[i + 1];
    let previousChar = chunck[i - 1];
    if (bytesReededOnLastChunck != undefined) {
        let char = chunck[i];
        if (bytesReededOnLastChunck == boundary.length && !boundary.includes(char))
            return { boolean: true, boundaryEnd: i };
        else if (boundary.includes(char))
            return tryReadBoundary(chunck, i, boundary, bytesReededOnLastChunck);
        else
            return { boolean: false };
    }
    if (previousChar != undefined) {
        if (boundary.includes(previousChar)) {
            i = findBoundarystart(chunck, boundary, i);
            return tryReadBoundary(chunck, i, boundary, false);
        }
    }
    if (nextChar != undefined) {
        if (boundary.includes(nextChar))
            return tryReadBoundary(chunck, i, boundary, false);
        else
            return { boolean: false };
    }
    else
        return { numberBytesReaded: 0, broken: true };
}


function findBoundarystart(chunck, boundary, i) {
    let previousChar;
    do {
        i--;
        previousChar = chunck[i - 1];
    } while (boundary.includes(previousChar));
    return i;
}


function tryReadBoundary(chunck, i, boundary, bytesReededOnLastChunck) {
    let cont = 0;
    if (bytesReededOnLastChunck)
        cont = bytesReededOnLastChunck;
    let numberCharsReturn = NumberCharsMatchBoundaryCharsInSequence(chunck, i, boundary, cont);
    if (Number.isInteger(numberCharsReturn))
        return checkIfWasBoundaryAndReturn(numberCharsReturn, boundary, i);
    else
        return numberCharsReturn;
}


function NumberCharsMatchBoundaryCharsInSequence(chunck, i, boundary, cont) {
    let char;
    do {
        cont++;
        i++;
        char = chunck[i];
        if (char == undefined)  //if char is undefined that means that boundary is divided in two chuncks
            return checkIfBoundaryIsbrokenOrNotAndReturn(boundary, cont);
    } while (boundary.includes(char));
    return cont;
}


function checkIfBoundaryIsbrokenOrNotAndReturn(boundary, cont) {
    if (cont == boundary.length + 2)
        return cont;
    else
        return { numberBytesReaded: cont, broken: true };
}


function checkIfWasBoundaryAndReturn(cont, boundary, iWhereBoundarysubHeaderEnds) {
    if (cont == boundary.length || cont == boundary.length + 2) {
        let iWhereBoundaryEnds = iWhereBoundarysubHeaderEnds + boundary.length;
        return { boolean: true, boundaryEnd: iWhereBoundaryEnds };
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


function concatenateChuncksOnReq(resolve, reject, req, encoding) {
    req.body = "";
    req.on("data", chunck => {
        req.body += chunck.toString(encoding);
    })
    req.on("end", error => {
        if (error) {
            res.end("error");
            reject();
        }
        else
            resolve();
    })
}


module.exports = { body_parser, getDataType }