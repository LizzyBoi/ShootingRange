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
		} else if (message.command === "goto") {
			go_to_position(message.value);
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
var curr_duty_cycle = 32;

var rotation_index = 0;

const enable_signal = new Gpio(7, 'out');
var enabled = 0;

var  rotation_signal = new Gpio(20, 'in', 'both');
var direction_signal = new Gpio(21, 'in');
rotation_signal.watch(rotation_signal_trigger);

function send_to_frontend(object) {
	frontend_ws.send(JSON.stringify(object));
}

function brake_motor() {
	enabled = 0;
	enable_signal.writeSync(0);	
	set_duty_cycle(0);
}

function enable_motor() {
	enabled = 1;
	enable_signal.writeSync(1);
	set_duty_cycle(32);
}

function change_duty_cycle(change_by) {
	curr_duty_cycle = curr_duty_cycle + change_by;
	if (curr_duty_cycle < 1) {
		curr_duty_cycle = 1;
	} else if (curr_duty_cycle > 63) {
		curr_duty_cycle = 63;
	}

	pwmDutyCycle(curr_duty_cycle);
}

function set_duty_cycle(new_duty_cycle) {
	curr_duty_cycle = new_duty_cycle;
	pwmDutyCycle(curr_duty_cycle);
}

function pwmDutyCycle(duty_cycle) {
	for (let i = 0; i < pwm_output.length; i++) {
		const mask = 1 << i;

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

//ramp up
//Idea: take error, and current speed, do some magic with that to either increase or decrease motor speed.
var interval;
var running = 0;

function go_to_position(end_position) {
	console.log(`${Date.now()}\t${curr_duty_cycle}`);
	if (running) {
		clearInterval(interval);
	} else {
		running = 1;
	}

	interval = setInterval(set_pwm_controller, 250, end_position);
}

var reached_position = 0;
function set_pwm_controller (end_position){
	//TODO
	//convert rotation_index to cm
	//acutally set enable signal low for breaking
	const pulse_per_rotation = 2;
	const rotation_per_cm = 7.5;
	const curr_position = rotation_index / pulse_per_rotation / rotation_per_cm;
	const deceleration_distance = 15;
	if (reached_position) leeway = 0.3;
	else leeway = 0.2;

	if(end_position + leeway > curr_position && end_position - leeway < curr_position) {
		console.log("reached approx position");
		reached_position = 1;
		set_duty_cycle(32);
	}
	
	var pwm_modifier = (end_position - curr_position) / deceleration_distance;
	if (pwm_modifier < -1) pwm_modifier = -1;
	else if (pwm_modifier > 1) pwm_modifier = 1;
	var pwm_to_send = 32 + Math.ceil(25 * pwm_modifier);
	if (pwm_to_send > 32 && pwm_to_send < 35) pwm_to_send = 35;
	if (pwm_to_send > 29 && pwm_to_send < 32) pwm_to_send = 27;

	var pwm_diff = pwm_to_send - curr_duty_cycle;
	if(pwm_diff > 1) pwm_diff = 1;
	else if(pwm_diff < -1) pwm_diff = -1;
	
	change_duty_cycle(pwm_diff);

	console.log(`${Date.now()}\t${curr_duty_cycle}`);
}




set_duty_cycle(32);
