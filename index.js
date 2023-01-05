const express = require('express');
const { Server } = require('ws');
const Gpio = require('onoff').Gpio;

const hostname = "127.0.0.1";
const port = 3000;


const ws_server = new Server({ port: 7071 });

ws_server.on('connection', (ws) => {
	console.log('New client connected');

	ws.on('message', (messageString) => {
		const message = JSON.parse(messageString);

		if (message.command === "change") {
			change_duty_cycle(message.value);
		} else if (message.command === "set") {
			set_duty_cycle(message.value);
		}
	});

	ws.on('close', () => console.log('Client has disconnected'));
});


var app = express()
	.use(express.static('public'))
	.get('/', (req, res) => {res.send('Hello World')})
	.listen(port, () => {console.log(`Listening on port ${port}`)});

var pwm_output = [];
for (const gpio of [6,13,19,26,12,16]) {
	pwm_output.push(new Gpio(gpio, 'out'));	
}

var disc_position = 0;
var disc_sensor = new Gpio(17, 'in', 'both');
var disc_sensor_dir = new Gpio(27, 'in', 'both');
disc_sensor.watch(disc_sensor_trigger);

var curr_duty_cycle = 0;

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

function disc_sensor_trigger(err, value) {
	if(value === disc_sensor_dir.readSync()) {
		console.log("posistive direction");
		disc_position--;
	} else {
		console.log("negative direction");
		disc_position--;
	}
}
