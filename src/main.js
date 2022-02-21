"use strict";
let xmlData;
let _DeleteList = [];
let fileName = "";
let chartData = [];
let myChart;

const infoLog =(string)=>{
    console.log(string);
    document.getElementById("info").textContent = string;
}

const getFileName =()=>{
    const input = document.getElementById("input-level-data");
    let name = input.value.substr(input.value.lastIndexOf("\\") + 1);
    //name = name.substr(0, name.lastIndexOf("."));
    console.log(name);
    return name;
}

const Destroy =(DOMObject)=>{
    DOMObject.parentNode.removeChild(DOMObject);
}

const reloadChartData =()=>{
    chartData = [];
    const objs = xmlData.getElementsByTagName("Object");
    for(let i=0; i<objs.length; i++){
        const pos = objs[i].querySelector("Position");
        chartData.push({
            x: Number(pos.getAttribute("x")),
            y:Number(pos.getAttribute("z")),
        })
    }
    myChart.data.datasets[0].data = chartData;
    myChart.update();
}

const decodeText =(text)=>{
    const parser = new window.DOMParser();
    const xmlData = parser.parseFromString(text, "text/xml");
    if(xmlData.getElementsByTagName("Level").length == 0){
        infoLog("This file is not a level file");
        return null;
    }
    return xmlData;
}

const loadFile =(e) => {
    if(e.target.files === null){
        infoLog("No file selected");
        return;
    }
    if(e.target.files === undefined){
        infoLog("Undifine file");
        return;
    }
    if(e.target.files.length > 2){
        infoLog("Multiple files are selected");
        return;
    }
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload =(e)=>{
        const data = decodeText(reader.result);
        if(data == null) return;
        infoLog("The file loaded successfully");
        document.getElementById("main-container").setAttribute("style", "");
        xmlData = data;
        myChart.resetZoom();
        reloadChartData();
    }
}

const selectObj =()=>{
    const setYAxis = document.getElementById("set-y-axis").checked;
    _DeleteList = [];
    const startPos = {
        x: document.getElementById("start-pos-x").value,
        y: document.getElementById("start-pos-y").value,
        z: document.getElementById("start-pos-z").value,
    }
    const endPos = {
        x: document.getElementById("end-pos-x").value,
        y: document.getElementById("end-pos-y").value,
        z: document.getElementById("end-pos-z").value,
    }
    const objects = xmlData.getElementsByTagName("Object");
    for(let i=0; i<objects.length; i++){
        const object = objects[i];
        const positionElem = object.querySelector("Position");
        const pos = {
            x: Number(positionElem.getAttribute("x")),
            y: Number(positionElem.getAttribute("y")),
            z: Number(positionElem.getAttribute("z")),
        }
        let flag = true;
        flag = flag && pos.x >= startPos.x && pos.x <= endPos.x;
        if(setYAxis){
            flag = flag && pos.y >= startPos.y && pos.y <= endPos.y;
        }
        flag = flag && pos.z >= startPos.z && pos.z <= endPos.z;
        if(flag){
            //console.log(pos);
            _DeleteList.push(object);
        }
    }
    if(_DeleteList.length !== 0){
        document.getElementById("delete-btn").setAttribute("style", "visibility: visible");
    }
    document.getElementById("all-object-count").textContent = `All:${objects.length} objects`;
    document.getElementById("select-object-count").textContent = `Selected:${_DeleteList.length} objects`;
    infoLog(`Select ${_DeleteList.length} objects`);
}
const resetDlt =()=>{
    document.getElementById("select-object-count").textContent = `Selected:`;
    _DeleteList = [];
    document.getElementById("delete-btn").setAttribute("style", "visibility: hidden");
    document.getElementById("start-pos-x").value = 0;
    document.getElementById("start-pos-y").value = 0;
    document.getElementById("start-pos-z").value = 0;
    document.getElementById("end-pos-x").value = 0;
    document.getElementById("end-pos-y").value = 0;
    document.getElementById("end-pos-z").value = 0;
    reloadChartData();
}
const deleteObj=()=>{
    if(_DeleteList.length === 0){
        infoLog("No object is selected");
        return;
    }
    _DeleteList.forEach((obj)=>{
        Destroy(obj);
    })
    infoLog(`Delete ${_DeleteList.length} objects`);
    resetDlt();
    console.log(xmlData);
}

const downloadXML =()=>{
    const serializer = new XMLSerializer();
    const str = serializer.serializeToString(xmlData);
    const link = document.createElement("a");
    link.href = "data:text/xml;," + encodeURIComponent(str);
    link.download = fileName;
    link.click();
    infoLog("Download");
}

const init =()=>{
    const fileInput = document.getElementById("input-level-data");
    fileInput.addEventListener("change", (e)=>{
        fileName = getFileName();
        loadFile(e);
    })
    const setYAxisBtn = document.getElementById("set-y-axis");
    setYAxisBtn.addEventListener("change", (e)=>{
        if(setYAxisBtn.checked){
            const elems = document.getElementsByClassName("y-axis");
            for(let i=0; i<elems.length; i++){
                elems[i].setAttribute("style", "visibility: visible");
            }
        }else{
            const elems = document.getElementsByClassName("y-axis");
            for(let i=0; i<elems.length; i++){
                elems[i].setAttribute("style", "visibility: hidden");
                elems[i].value = null;
            }
        }
    })
    const selectBtn = document.getElementById("select-btn");
    selectBtn.addEventListener("click", (e)=>{
        selectObj();
    })
    const deleteBtn = document.getElementById("delete-btn");
    deleteBtn.addEventListener("click", (e)=>{
        deleteObj();
    })
    const downloadBtn = document.getElementById("download-btn");
    downloadBtn.addEventListener("click", (e)=>{
        downloadXML();
    })
    const canvas = document.getElementById("canvas");
    myChart = new Chart(
        canvas,
        {
            type: "scatter",
            data:{
                datasets:[{
                    label:"Objects",
                    backgroundColor:"rgb{255, 99, 132}",
                    borderColor:"rgb{255, 99, 132}",
                    data:chartData,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio : false,
                plugins: {
                    zoom: {
                    pan: {
                        enabled: true,
                        mode: "xy"
                    },
                    zoom: {
                        wheel: {
                           enabled: true,
                        },
                        pinch: {
                            enabled: true
                        },
                        drag:{
                            enabled:false
                        },
                        mode: 'xy',
                    }
                    }
                }
            }
        }
    );
    // canvas.setAttribute("width", "500px");
    // canvas.setAttribute("height", "500px");
}