let ws;
(async function() {
	ws = await connectToServer();

	ws.onmessage = (wsMessage) => {
		console.log(wsMessage.data);
		msg_obj = JSON.parse(wsMessage.data);

		console.log(msg_obj);
		
		if(msg_obj.command === "rot") {
			console.log(msg_obj.value);
			document.getElementById("positionValue").innerText = msg_obj.value;
		} else if(msg_obj.command === "dir"){
			console.log(msg_obj.value);
			document.getElementById("motorDir").value = msg_obj.value;
			// here motorDir is just a hidden input value in the html code that keeps track of direction with 1=forward -1=backward 0=still
			updateDir()
		} else if(msg_obj.command === "lerp") {
			console.log(msg_obj.value);
			document.getElementById("lerpValue").innerHTML = msg_obj.value
			document.getElementById("lerpTempSlider").innerHTML = msg_obj.value
		}
	};

	async function connectToServer() {
		const ws = new WebSocket('ws://localhost:7071');
		return new Promise((resolve, reject) => {
			const timer = setInterval(() => {
				if(ws.readyState === 1) {
					clearInterval(timer);
					resolve(ws);
				}
			}, 10);
		});
	}
})();

window.onload = function(){
    document.getElementById("speedInput")
    .addEventListener("keyup", function(event) {
        event.preventDefault();
        if (event.keyCode === 13) {
            document.getElementById("speedInputButton").click();
        }
    });
	document.getElementById("positionInput")
    .addEventListener("keyup", function(event) {
        event.preventDefault();
        if (event.keyCode === 13) {
            document.getElementById("positionSubmitButton").click();
        }
    });
};

function updateSubmit(input, id, slider, min, max, command){
    if(document.getElementById(input).value >= min && document.getElementById(input).value <= max){
        document.getElementById(slider).value = document.getElementById(input).value;
        document.getElementById(id).innerHTML = document.getElementById(input).value;
        document.getElementById(input).value = "";  

    	sendPublicToSocket(command, id)
    } else {
        document.getElementById(input).value = "";   
    }
}

function halt(){
	document.getElementById('currentSpeed').innerHTML = 32;
	document.getElementById('speedSlider').value = document.getElementById('currentSpeed').innerHTML;

	sendPublicToSocket('set', 'currentSpeed');
}

function startButton(){
	sendPublicToSocket('start');
}

function stopButton(){
	sendPublicToSocket('stop')
}

function incrementSlider(x, id, slider, min, max, command){
    var scalar = 10
	var previousValue = parseInt(document.getElementById(id).innerHTML)
	if(parseInt(document.getElementById(id).innerHTML) >= min && parseInt(document.getElementById(id).innerHTML)  <= max){
    	document.getElementById(id).innerHTML = parseInt(document.getElementById(id).innerHTML) + scalar * x;
    	document.getElementById(slider).value = document.getElementById(id).innerHTML;
	}
	if(parseInt(document.getElementById(id).innerHTML) < min || parseInt(document.getElementById(id).innerHTML)  > max){
		document.getElementById(id).innerHTML = previousValue;
	}
    sendPublicToSocket(command, id);
}

function incrementDir(dir){
	document.getElementById("motorDir").value = dir;
	updateDir();
}

function updateDir(){
	if(parseInt(document.getElementById("motorDir").value) === 1){
		document.getElementById("triDirUp").style.borderColor = 'transparent transparent #FF4C29';
		document.getElementById("triDirDown").style.borderColor = 'transparent transparent #d1d5db';
	} else if (parseInt(document.getElementById("motorDir").value) === -1){
		document.getElementById("triDirDown").style.borderColor = 'transparent transparent #FF4C29';
		document.getElementById("triDirUp").style.borderColor = 'transparent transparent #d1d5db';
	} else {
		document.getElementById("triDirUp").style.borderColor = 'transparent transparent #d1d5db';
		document.getElementById("triDirDown").style.borderColor = 'transparent transparent #d1d5db';
	}
}

function onSliderInput(command, id, slider) {
	document.getElementById(id).innerText = document.getElementById(slider).value;

	sendPublicToSocket(command, id);
}


function sendPublicToSocket(command, elemID) {
	const value = parseInt(document.getElementById(elemID).innerText);
	const message = {command: command, value: value};
	ws.send(JSON.stringify(message));
}
