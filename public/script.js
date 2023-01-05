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
    const el = document.getElementById("speedInput");
    console.log(el);
    el.addEventListener("keyup", function(event) {
        event.preventDefault();
        if (event.keyCode === 13) {
            document.getElementById("speedInputButton").click();
        }
    });
};



function updateSlider(){
    document.getElementById('speedSlider').value = document.getElementById('speedInput').value;
    document.getElementById('currentSpeed').innerHTML = document.getElementById('speedInput').value;
}

function onSliderInput() {
	document.getElementById('currentSpeed').innerText = document.getElementById('speedSlider').value;

	const value = parseInt(document.getElementById('currentSpeed').innerText);
	const message = {command: "set", value: value};
	ws.send(JSON.stringify(message));
}
