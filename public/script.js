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
};



function updateSpeed(){
    if(document.getElementById('speedInput').value > -1 && document.getElementById('speedInput').value < 64){
        document.getElementById('speedSlider').value = document.getElementById('speedInput').value;
        document.getElementById('currentSpeed').innerHTML = document.getElementById('speedInput').value;
        document.getElementById('speedInput').value = "";  

        const value = parseInt(document.getElementById('currentSpeed').innerText);
	    const message = {command: "set", value: value};
	    ws.send(JSON.stringify(message));
    } else {
        document.getElementById('speedInput').value = "";   
    }

}

function incrementSlider(x){
    var scalar = 2
    document.getElementById('speedSlider').value = document.getElementById('currentSpeed').innerHTML;
    document.getElementById('currentSpeed').innerHTML = parseInt(document.getElementById('currentSpeed').innerHTML) + scalar * x;
    
    const value = parseInt(document.getElementById('currentSpeed').innerText);
	const message = {command: "set", value: value};
	ws.send(JSON.stringify(message));
}

function onSliderInput() {
	document.getElementById('currentSpeed').innerText = document.getElementById('speedSlider').value;

	const value = parseInt(document.getElementById('currentSpeed').innerText);
	const message = {command: "set", value: value};
	ws.send(JSON.stringify(message));
}
