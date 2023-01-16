const Gpio = require('onoff').Gpio;
let PidController = require('node-pid-controller'); 

class MotorController {
	constructor(pwm_pin_numbers, rotation_pin_number, direction_pin_number, enable_pin_number, emergency_pin_number) {
		this.pwm_pins = [];
		for (const pwm_pin_number of pwm_pin_numbers) {
			this.pwm_pins.push(new Gpio(pwm_pin_number, 'out'));	
		}
		this.rotation_pin = new Gpio(rotation_pin_number, 'in', 'both');
		this.rotation_pin.watch(this.rotation_trigger.bind({"caller": this}));
		this.direction_pin = new Gpio(direction_pin_number, 'in');
		console.log(this.direction_pin);
		console.log(this.direction_pin.readSync());

		//set to watch on both edges
		this.emergency_pin = new Gpio(emergency_pin_number, 'in');;

		this.curr_rotation_index = 0;
		this.curr_duty_cycle = 32;

		this.pulse_per_rotation = 2;
		this.rotation_per_cm = 7.5;
		this.pulse_per_cm = this.pulse_per_rotation * this.rotation_per_cm;
		this.deceleration_rotation_distance = 5 * this.pulse_per_cm;
		this.moving_leeway = 0.2 * this.pulse_per_cm;
		this.still_leeway = 0.3 * this.pulse_per_cm;

		this.end_rotation_index = 0 * this.pulse_per_cm;
		this.interval = null;
		this.reached_position = 0;

		this.ctr = new PidController(0.25, 0.01, 0.01);

		this.set_duty_cycle(32);

	}

	brake() {}

	enable() {}

	start() {
		this.end_rotation_index = this.curr_rotation_index;
		this.interval = setInterval(this.control_pwm, 10, this);
	}

	stop() {
		if(this.interval) {
			clearInterval(this.interval);
		}
		this.set_duty_cycle(0);
	}
	
	change_duty_cycle(change_by) {
		this.curr_duty_cycle = this.curr_duty_cycle + change_by;
		if (this.curr_duty_cycle < 1) {
			this.curr_duty_cycle = 1;
		} else if (this.curr_duty_cycle > 63) {
			this.curr_duty_cycle = 63;
		}

		this.write_pwm_duty_cycle(this.curr_duty_cycle);
	}

	set_duty_cycle(new_duty_cycle) {
		this.curr_duty_cycle = new_duty_cycle;
		this.write_pwm_duty_cycle(this.curr_duty_cycle);
	}

	go_to_position(end_position) {
		this.end_rotation_index = end_position * this.pulse_per_cm; 
	}

	rotation_trigger() {
		const caller = this.caller;
		const direction = caller.direction_pin.readSync();

		if(direction === 1) {
			caller.curr_rotation_index++;
			console.log(caller.curr_rotation_index);
		} else if (direction === 0) {
			caller.curr_rotation_index--;
			console.log(caller.curr_rotation_index);
		}

		caller.ctr.update(caller.curr_rotation_index);
	}

	write_pwm_duty_cycle(duty_cycle) {
		for (let i = 0; i < this.pwm_pins.length; i++) {
			const mask = 1 << i;

			if (duty_cycle & mask) {
				this.pwm_pins[i].writeSync(1);
			} else {
				this.pwm_pins[i].writeSync(0);
			}
		}
	}

	control_pwm(caller) {
		//TODO
		//acutally set enable signal low for breaking
		
		var leeway = caller.moving_leeway;

		if(caller.end_rotation_index + leeway > caller.curr_rotation_index && caller.end_rotation_index - leeway < caller.curr_rotation_index) {
			console.log("reached approx position");
			caller.set_duty_cycle(32);
		}

		var pwm_modifier = (caller.end_rotation_index - caller.curr_rotation_index) / caller.deceleration_rotation_distance;
		if (pwm_modifier < -1) pwm_modifier = -1;
		else if (pwm_modifier > 1) pwm_modifier = 1;

		var pwm_to_send = 32 + Math.ceil(25 * pwm_modifier);
		if (pwm_to_send > 32 && pwm_to_send < 35) pwm_to_send = 35;
		if (pwm_to_send > 29 && pwm_to_send < 32) pwm_to_send = 29;

		var pwm_diff = pwm_to_send - caller.curr_duty_cycle;
		if(pwm_diff > 2) pwm_diff = 2;
		else if(pwm_diff < -2) pwm_diff = -2;

		caller.change_duty_cycle(pwm_to_send);

		console.log(`${Date.now()}\t${caller.curr_duty_cycle}`);
	}
}

module.exports = MotorController;
