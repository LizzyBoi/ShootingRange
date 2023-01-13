const express = require('express');
const { Server } = require('ws');
const { MotorController } = require('./motorController.js');

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
		} else if (message.command === "goto") {
			go_to_position(message.value);
		} else if (message.command === "stop") {
			motor_stop();
		} else if (message.command === "start") {
			motor_start();	
		}
	});

	ws.on('close', () => {console.log('Client has disconnected')});
});


var app = express()
	.use(express.static('../public'))
	.get('/', (req, res) => {res.send('Hello World')})
	.listen(port, () => {console.log(`Listening on port ${port}`)});

const pwm_pin_numbers = [6,13,19,26,12,16];
const rotation_pin_number = 20;
const direction_pin_number = 21;
const enable_pin_number = 7;
const emergency_brake_pin_number = 5; 
var motorController = new MotorController(pwm_pin_numbers, rotation_pin_number, direction_pin_number, enable_pin_number, emergency_brake_pin_number);


function send_to_frontend(object) {
	frontend_ws.send(JSON.stringify(object));
}

function change_duty_cycle(value) {
	motorController.change_duty_cycle(value);	
}

function set_duty_cycle(value) {
	motorController.set_duty_cycle(value);
}

function go_to_position(value) {
	motorController.go_to_position(value);
}

