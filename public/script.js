let ws;
(async function() {
	ws = await connectToServer();

	ws.onmessage = (wsMessage) => {
		msg_obj = JSON.parse(wsMessage.data);
		
		if(msg_obj.command === "range_data") {
			let last_position = document.getElementById("positionSlider").value;
			document.getElementById("positionSlider").value = msg_obj.value.dist;
			document.getElementById("motorDir").value = msg_obj.value.dir;
			if(last_position != document.getElementById("positionSlider").value){
				document.getElementById("movementCheck").value = 1
			} else{
				document.getElementById("movementCheck").value = 0
			}
			// here motorDir is just a hidden input value in the html code that keeps track of direction with 1=forward -1=backward 0=still
			updateDir()
		}
		 else if(msg_obj.command === "pid_values") {
			document.getElementById("PID_p").value = msg_obj.value.k_p;
			document.getElementById("PID_i").value = msg_obj.value.k_i;
			document.getElementById("PID_d").value = msg_obj.value.k_d;
			document.getElementById("PID_i_max").value = msg_obj.value.i_max;
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
        if(slider != 'sliderPosition'){
			document.getElementById(slider).value = document.getElementById(input).value;
		}
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
	sendCommandToSocket('start');
}

function stopButton(){
	sendCommandToSocket('stop',);
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
	if(document.getElementById("movementCheck").value === 0){
		document.getElementById("triDirUp").style.borderColor = 'transparent transparent #d1d5db';
		document.getElementById("triDirDown").style.borderColor = 'transparent transparent #d1d5db';
	} else if(parseInt(document.getElementById("motorDir").value) === 1){
		document.getElementById("triDirUp").style.borderColor = 'transparent transparent #FF4C29';
		document.getElementById("triDirDown").style.borderColor = 'transparent transparent #d1d5db';
	} else if (parseInt(document.getElementById("motorDir").value) === 0){
		document.getElementById("triDirDown").style.borderColor = 'transparent transparent #FF4C29';
		document.getElementById("triDirUp").style.borderColor = 'transparent transparent #d1d5db';
	}
}

function onSliderInput(command, id, slider) {
	document.getElementById(id).innerText = document.getElementById(slider).value;

	sendPublicToSocket(command, id);
}

function sendCommandToSocket(command) {
	const message = {command: command};
	ws.send(JSON.stringify(message));
}

function PID_onchange(){
	p_value = parseFloat(document.getElementById("PID_p").value);
        i_value = parseFloat(document.getElementById("PID_i").value);
        d_value = parseFloat(document.getElementById("PID_d").value);
	i_max_value = parseFloat(document.getElementById("PID_i_max").value);

	const message = {command: "set_pid_values", value: {k_p: p_value, k_i: i_value, k_d: d_value, i_max: i_max_value} }
	ws.send(JSON.stringify(message));
}

function sendPublicToSocket(command, elemID) {
	const value = parseFloat(document.getElementById(elemID).innerText);
	const message = {command: command, value: value};
	ws.send(JSON.stringify(message));
}
