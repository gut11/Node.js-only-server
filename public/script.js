



function checkIfThereisFileSelected(){
    let fileUploadForm = document.querySelector("#up-file-container form");
    let fileUploadInput = document.querySelector("#upload-file-background input");
    if(fileUploadInput.files.length){
        const formData = new FormData(fileUploadForm);
        sendFile(formData)
    }
    else
        insertUploadMessage("Erro: Selecione um arquivo",false);
}



function sendFile(data){
    const req = {method: "POST", body: data};
    fetch("/uploadFile", req).then(res => {
        if(res.status == 200)
            insertUploadMessage("Arquivo subido com sucesso!",true);
        else
            insertUploadMessage("Ocorreu um erro no servidor!",false);
    })
}


function insertUploadMessage(msg,UpStatus){
    let uploadParagraph = document.getElementById("upload-msg");
    let color;
    if(UpStatus)
         color = "chartreuse";
    else
         color = "red";
    uploadParagraph.innerHTML = msg;
    uploadParagraph.style.color = color;
}




function changeButtonTypeOnFileSelection(){
    let fileUploadInput = document.querySelector("#upload-file-background input");
    let fileUploadButton = document.getElementById("upload-button");
    fileUploadInput.addEventListener("input", () => {
        if(fileUploadInput.files.length)
            fileUploadButton.type = "submit";
        else
            fileUploadButton.type = "button";
    })
}



function fetchAndInsertFilesNames(){
    let down_screen = document.getElementById("down-screen");
    return new Promise((resolve,reject) => {
        fetch("/files-name").then(res => {
            res.json().then(names =>{
                names.forEach(name => {
                    down_screen.innerHTML += `<div class="file-selector">`+ name + `</div>`;
                });
                resolve();
            })
        })
    })
}


fetchAndInsertFilesNames().then(() => {
    let files_buttons = Array.from(document.getElementsByClassName("file-selector"));
    let lastFileButton = undefined;
    let down_file_anchor = document.getElementById("down-file-anchor");
    files_buttons.forEach(file_button => {
        file_button.addEventListener("click", () => {
            if(lastFileButton != undefined)
                lastFileButton.style.backgroundColor = "cornflowerblue"
            file_button.style.backgroundColor = "green";
            lastFileButton = file_button;
            down_file_anchor.href = "/download?filename=" + lastFileButton.innerHTML;
        })
    })
})


function addEventListeners(){
    let fileUploadButton = document.getElementById("upload-button");
    fileUploadButton.addEventListener("click", checkIfThereisFileSelected);
}


addEventListeners()







