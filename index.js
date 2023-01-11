const express = require('express');
const { Server } = require('ws');
const Gpio = require('onoff').Gpio;

const hostname = "127.0.0.1";
const port = 3000;


const ws_server = new Server({ port: 7071 });
let frontend_ws;

ws_server.on('connection', (ws) => {
	console.log('New client connected');

	frontend_ws = ws;
	ws.on('message', (messageString) => {
		const message = JSON.parse(messageString);

		if (message.command === "change") {
			change_duty_cycle(message.value);
		} else if (message.command === "set") {
			set_duty_cycle(message.value);
		}
	});

	ws.on('close', () => {console.log('Client has disconnected')});
});


var app = express()
	.use(express.static('public'))
	.get('/', (req, res) => {res.send('Hello World')})
	.listen(port, () => {console.log(`Listening on port ${port}`)});

var pwm_output = [];
for (const gpio of [6,13,19,26,12,16]) {
	pwm_output.push(new Gpio(gpio, 'out'));	
}

var rotation_index = 0;
var  rotation_signal = new Gpio(20, 'in', 'both');
var direction_signal = new Gpio(21, 'in');
rotation_signal.watch(rotation_signal_trigger);

var curr_duty_cycle = 0;

function send_to_frontend(object) {
	frontend_ws.send(JSON.stringify(object));
}

function change_duty_cycle(change_by) {
	curr_duty_cycle = curr_duty_cycle + change_by;
	if (curr_duty_cycle < 0) {
		curr_duty_cycle = 0;
	} else if (curr_duty_cycle > 255) {
		curr_duty_cycle = 255;
	}

	pwmDutyCycle(curr_duty_cycle);
}

function set_duty_cycle(new_duty_cycle) {
	curr_duty_cycle = new_duty_cycle;
	pwmDutyCycle(curr_duty_cycle);
}

function pwmDutyCycle(duty_cycle) {
	for (var i = 0; i < pwm_output.length; i++) {
		var mask = 1 << i;
		if (duty_cycle & mask) {
			pwm_output[i].writeSync(1);
		} else {
			pwm_output[i].writeSync(0);
		}
	}
}

function rotation_signal_trigger(err, value) {
	const direction = direction_signal.readSync() 

	if(direction === 1) {
		rotation_index++;
		console.log(rotation_index);
	} else if (direction === 0) {
		rotation_index--;
		console.log(rotation_index);
	}
}
