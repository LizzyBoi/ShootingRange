const express = require('express');
const { Server } = require('ws');
const Gpio = require('onoff').Gpio;
const lerp = require('lerp');

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
var curr_duty_cycle = 0;

var rotation_index = 0;
const rotation_signal = new Gpio(17, 'in', 'both');
const direction_signal = new Gpio(27, 'in');
disc_sensor.watch(rotation_signal_trigger);

const enable_signal = new Gpio(25, 'out');
var enabled = 0;

function send_to_frontend(object) {
	ws.send(JSON.stringify(object));
}

function brake_motor() {
	enable_signal.writeSync(0);	
	set_duty_cycle(0);
}

function enable_motor() {
	enable_signal.writeSync(1);
	set_duty_cycle(32);
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
	for (let i = 0; i < pwm_output.length; i++) {
		const mask = 1 << i;

		if (duty_cycle & mask) {
			pwm_output[i].writeSync(1);
		} else {
			pwm_output[i].writeSync(0);
		}
	}
}

function disc_sensor_trigger(err, value) {
	const direction = direction_signal.readSync() 
	if(direction === 1) {
		console.log("posistive direction");
		rotation_index++;
	} else if (direction === 0) {
		console.log("negative direction");
		rotation_index--;
	}

	ws.send({command: "rot", value: rotation_index});
}

//ramp up
//Idea: take error, and current speed, do some magic with that to either increase or decrease motor speed.

function go_to_position(end_position) {
	console.log(`${Date.now()}\t${curr_duty_cycle}`);
	while(1) {
		set_pwm_controller(end_position);
		console.log(`${Date.now()}\t${curr_duty_cycle}`);
	}
}

function set_pwm_controller (end_position){
	//TODO
	//convert rotation_index to cm
	//acutally set enable signal low for breaking
	const curr_position = rotation_index / 7.5;
	const leeway = 0.2;
	
	if(rotation_index != end_position && !enabled) {
		enable_motor();
	}

	if (curr_position - leeway < end_position) {
		set_duty_cycle(curr_duty_cycle++);
	} else if (curr_position + leeway > end_position) {
		set_duty_cycle(curr_duty_cycle--);
	} else {
		brake_motor();
		set_duty_cycle(0);
	}

}


brake_motor();




