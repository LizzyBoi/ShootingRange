const SegfaultHandler = require('segfault-handler');
SegfaultHandler.registerHandler('crash.log');
const express = require('express');
const { Server } = require('ws');
const MotorController = require('./motor_controller.js');

const hostname = "127.0.0.1";
const port = 3000;

const ws_server = new Server({ port: 7071 });
let frontend_ws;

ws_server.on('connection', (ws) => {
	console.log('New client connected');

	frontend_ws = ws;
	ws.send(JSON.stringify({command: "pid_values", value: controller_get_pid_values()}));

	ws.on('message', (messageString) => {
		const message = JSON.parse(messageString);

		if (message.command === "change") {
			console.log("change");
			change_duty_cycle(message.value);
		} else if (message.command === "set") {
			console.log("set");
			console.log(message.value);
			set_duty_cycle(message.value);
		} else if (message.command === "goto") {
			console.log("goto");
			go_to_position(message.value);
		} else if (message.command === "stop") {
			console.log("stop");
			controller_stop();
		} else if (message.command === "start") {
			console.log("start");
			controller_start();	
		} else if (message.command === "set_pid_values") {
			console.log("set_pid_values");
			controller_set_pid_values(message.value);
		}
	});

	ws.on('close', () => {console.log('Client has disconnected')});
});

var app = express()
	.use(express.static('./public'))
	.get('/', (req, res) => {res.send('Hello World')})
	.listen(port, () => {console.log(`Listening on port ${port}`)});

function send_to_frontend(object) {
	if (frontend_ws) {
		frontend_ws.send(JSON.stringify(object));
	}
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

function controller_start() {
	motorController.start();
}

function controller_stop() {
	motorController.stop();
}

function controller_set_pid_values(valueObj) {
	motorController.set_pid_values(valueObj);
}

function controller_get_pid_values() {
	return motorController.get_pid_values();
}

function distance_to_frontend(int_distance) {
	const message = {command: "range_data", value: int_distance}
	//console.log(message);
	send_to_frontend(message);
}

const pwm_pin_numbers = [6,13,19,26,12,16];
const rotation_pin_number = 20;
const direction_pin_number = 21;
const enable_pin_number = 7;
const emergency_brake_pin_number = 5; 
var motorController = new MotorController(pwm_pin_numbers, rotation_pin_number, direction_pin_number, enable_pin_number, emergency_brake_pin_number, distance_to_frontend);


