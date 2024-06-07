const electron = require("electron");
const { ipcRenderer } = require('electron')
const { desktopCapturer } = require("electron");
const remote = require('@electron/remote');
const { dialog } = remote;
const { Menu } = remote;
const { writeFile } = require("fs");

ipcRenderer.on("ListenOpenBtn", (event, data) => {
	  const playBtn = document.getElementById("playBtn");
	  const videoElementPlay = document.querySelector("video");
	  var status = 'stop'

	  async function openVideo() {
	  	const {filePaths} = await dialog.showOpenDialog({properties:['openFile'], filters: [{name:"video", extensions: ["mp4", "mov", "avi", "wmv", "webm", "flv"] }]});
	  	return filePaths
	  }

	  playBtn.onclick = e => {
	  	async function playVideo() {
	  		ipcRenderer.send("OpenVideoFile", null)
	  		filePath = await openVideo()
		  	videoSelectBtn.innerText = filePath;
		  	videoElementPlay.src = filePath;
		  	videoElementPlay.play();
		  	status = 'play'
		  	playBtn.innerText = "Пауза";
		}

		switch (status) {
		  case 'stop':
		  	playVideo();
		    break;
		  case 'play':
		  	videoElementPlay.pause(); 
		  	status = 'paus';
		  	playBtn.innerText = "Продовжити";
		    break;
		  case 'paus':
		  	videoElementPlay.play(); 
		  	status = 'play';
		  	playBtn.innerText = "Пауза";
		    break;
		}

	};
});

ipcRenderer.on("ListenVideoSelectBtn", (event, data) => {
	const videoSelectBtn = document.getElementById("videoSelectBtn");
	videoSelectBtn.onclick = function () {
	    ipcRenderer.send("videoSelectBtnActivate", null)
	}
});

ipcRenderer.on("showVideoSources", (event, data) => {
    const videoOptionsMenu = Menu.buildFromTemplate(
      data.map(source => {
        return {
          label: source.name,
          click: () => selectSource(source)
        };
      })
    );
    videoOptionsMenu.popup();

    let mediaRecorder;
		const recordedChunks = [];
    const videoElement = document.querySelector("video");
		async function selectSource(source) {
		  videoSelectBtn.innerText = source.name;
		  const constraints = {
		    audio: false,
		    video: {
		      mandatory: {
		        chromeMediaSource: "desktop",
		        chromeMediaSourceId: source.id
		      }
		    }
		  };

		document.getElementById("startBtn").style.display = "inline"
		document.getElementById("stopBtn").style.display = "inline"
	  document.getElementById("playBtn").style.display = "none"

	  const stream = await navigator.mediaDevices.getUserMedia(constraints);
	  videoElement.srcObject = stream;
	  videoElement.play();

	  const options = { mimeType: 'video/webm; codecs=vp9' };
	  mediaRecorder = new MediaRecorder(stream, options);
	  mediaRecorder.ondataavailable = handleDataAvailable;
	  mediaRecorder.onstop = handleStop;

	  const startBtn = document.getElementById("startBtn");
	  startBtn.onclick = e => {
	    mediaRecorder.start();
	    startBtn.classList.add("is-danger");
	    startBtn.innerText = "Запис...";
	  };
	  const stopBtn = document.getElementById("stopBtn");
	  stopBtn.onclick = e => {
	    mediaRecorder.stop();
	    startBtn.classList.remove("is-danger");
	    startBtn.innerText = "Почати";
	  };

	  function handleDataAvailable(e) {
	    recordedChunks.push(e.data);
	  }

	  async function handleStop(e) {
	    const blob = new Blob(recordedChunks, {
	      type: "video/webm; codecs=vp9"
	    });
	    const buffer = Buffer.from(await blob.arrayBuffer());
	    const { filePath } = await dialog.showSaveDialog({
	      buttonLabel: "Зберегти відео",
	      defaultPath: `recording_${Date.now()}.webm`
	    });
	    writeFile(filePath, buffer, () => console.log("success"));
	  }
  }
});