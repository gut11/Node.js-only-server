const greenScreen = document.getElementById("txt-text-area");



function checkIfThereisFileSelected() {
    let fileUploadForm = document.querySelector("#up-file-container form");
    let fileUploadInput = document.querySelector("#upload-file-background input");
    const uploadParagraph = document.getElementById("upload-msg");
    if (fileUploadInput.files.length) {
        const formData = new FormData(fileUploadForm);
        sendFile(formData)
    }
    else
        insertFeedbackMessage(uploadParagraph, "Erro: Selecione um arquivo", false);
}



function sendFile(data) {
    const uploadParagraph = document.getElementById("upload-msg");
    const req = { method: "POST", body: data };
    fetch("/uploadFile", req).then(res => {
        if (res.status == 200)
            insertFeedbackMessage(uploadParagraph, "Arquivo subido com sucesso!", true);
        else
            insertFeedbackMessage(uploadParagraph, "Ocorreu um erro no servidor!", false);
    })
}


function insertFeedbackMessage(insertLocation, msg, UpStatus) {
    let color;
    if (UpStatus)
        color = "chartreuse";
    else
        color = "red";
    insertLocation.innerHTML = msg;
    insertLocation.style.color = color;
}




function changeButtonTypeOnFileSelection() {
    let fileUploadInput = document.querySelector("#upload-file-background input");
    let fileUploadButton = document.getElementById("upload-button");
    fileUploadInput.addEventListener("input", () => {
        if (fileUploadInput.files.length)
            fileUploadButton.type = "submit";
        else
            fileUploadButton.type = "button";
    })
}



function fetchAndInsertFilesNames() {
    let down_screen = document.getElementById("down-screen");
    return new Promise((resolve, reject) => {
        fetch("/files-name").then(res => {
            res.json().then(names => {
                names.forEach(name => {
                    down_screen.innerHTML += `<div class="file-selector">` + name + `</div>`;
                });
                resolve();
            })
        })
    })
}



function AddEventListenersToFilesNames() {
    let files_buttons = Array.from(document.getElementsByClassName("file-selector"));
    let lastFileButton = undefined;
    let down_file_anchor = document.getElementById("down-file-anchor");
    files_buttons.forEach(file_button => {
        file_button.addEventListener("click", () => {
            if (lastFileButton != undefined)
                lastFileButton.style.backgroundColor = "cornflowerblue"
            file_button.style.backgroundColor = "green";
            lastFileButton = file_button;
            down_file_anchor.href = "/download?filename=" + lastFileButton.innerHTML;
        })
    })
}


function fetchDataFromTxtFile() {
    const sucessMessage = "Texto do arquivo pego com sucesso!";
    const failMessage = "A operacão de pegar texto do arquivo falhou!";
    fetch("/get-txt-data/")
        .then(res => {
            if (res.status > 199 && res.status < 300)
                insertFeedbackMessage(feedbackP,sucessMessage,true);
            else
                insertFeedbackMessage(feedbackP,failMessage,false);
            res.text()
                .then(text => {
                    greenScreen.innerHTML += text;
                })
        })
}


function sendDataToTxtFile() {
    const data = greenScreen.innerHTML;
    const feedbackP = document.getElementById("txt-update-feedback");
    const sucessMessage = "Texto salvo com sucesso!";
    const failMessage = "Upload do texto falhou!"
    const req = { method: "POST", body: data }
    fetch("/save-txt-data/", req)
        .then(res => {
            if (res.status > 199 && res.status < 300)
                insertFeedbackMessage(feedbackP,sucessMessage,true);
            else
                insertFeedbackMessage(feedbackP,failMessage,false);
    })
}



function deleteTxtData(){
    const sucessMessage = "Texto deletado com sucesso!";
    const failMessage = "A operacão de deletar o texto falhou!"
    const req = { method: "DEL" }
    fetch("/del-txt-data/",req)
    .then(res => {
        if (res.status > 199 && res.status < 300)
                insertFeedbackMessage(feedbackP,sucessMessage,true);
            else
                insertFeedbackMessage(feedbackP,failMessage,false);
    })
}





function addEventListeners() {
    let fileUploadButton = document.getElementById("upload-button");
    let sendDataButton = document.getElementById("send-data-button");
    let deleteDataButton = document.getElementById("delete-data-button");
    let showDataButton = document.getElementById("show-data-button");
    fileUploadButton.addEventListener("click", checkIfThereisFileSelected);
    sendDataButton.addEventListener("click", sendDataToTxtFile);
    deleteDataButton.addEventListener("click", deleteTxtData);
    showDataButton.addEventListener("click", fetchDataFromTxtFile);
}




fetchAndInsertFilesNames().then(AddEventListenersToFilesNames);
addEventListeners()







