let ws;
(async function() {
	ws = await connectToServer();

	ws.onmessage = (wsMessage) => {
		console.log('recieved message');
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

function updateSubmit(input, value, slider, min, max){
    if(document.getElementById(input).value >= min && document.getElementById(input).value <= max){
        document.getElementById(slider).value = document.getElementById(input).value;
        document.getElementById(value).innerHTML = document.getElementById(input).value;
        document.getElementById(input).value = "";  

    	sendPublicToSocket(value)
    } else {
        document.getElementById(input).value = "";   
    }
}

function halt(){
	document.getElementById('currentSpeed').innerHTML = 32;
	document.getElementById('speedSlider').value = document.getElementById('currentSpeed').innerHTML;

	sendPublicToSocket('currentSpeed');
}

function incrementSlider(x, value, slider, min, max){
    var scalar = 10
	var previousValue = parseInt(document.getElementById(value).innerHTML)
	if(parseInt(document.getElementById(value).innerHTML) >= min && parseInt(document.getElementById(value).innerHTML)  <= max){
    	document.getElementById(value).innerHTML = parseInt(document.getElementById(value).innerHTML) + scalar * x;
    	document.getElementById(slider).value = document.getElementById(value).innerHTML;
	}
	if(parseInt(document.getElementById(value).innerHTML) < min || parseInt(document.getElementById(value).innerHTML)  > max){
		document.getElementById(value).innerHTML = previousValue;
	}
    sendPublicToSocket(value);
}

function incrementDir(id, altId, dir){

	document.getElementById(id).style.borderColor = 'transparent transparent #FF4C29';
	document.getElementById(altId).style.borderColor = 'transparent transparent #d1d5db';
}

function onSliderInput(value, slider) {
	document.getElementById(value).innerText = document.getElementById(slider).value;

	sendPublicToSocket(value);
}

function sendPublicToSocket(elemID) {
	const value = parseInt(document.getElementById(elemID).innerText);
	const message = {command: "set", value: value};
	ws.send(JSON.stringify(message));
}