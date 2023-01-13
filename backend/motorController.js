const Gpio = require('onoff').Gpio;

const MotorController {
	constructor(pwm_pin_numbers, rotation_pin_number, direction_pin_number, enable_pin_number, emergency_pin_number) {
		var this.pwm_pins = [];
		for (const pwm_pin_number of pwm_pin_numbers) {
			this.pwm_pins.push(new Gpio(pwm_pin_number, 'out'));	
		}
		this.rotation_pin = new Gpio(rotation_pin_number, 'in', 'both');
		this.rotation_pin.watch(#rotation_trigger);
		this.direction_pin = new Gpio(direction_pin_pin_number, 'in');

		//set to watch on both edges
		this.emergency_pin = new Gpio(emergency_pin_number, 'in');;

		this.#curr_rotation_index = 0;
		this.#curr_duty_cycle = 32;

		this.#pulse_per_rotation = 2;
		this.#rotation_per_cm = 7.5;
		this.#pulse_per_cm = this.#pulse_per_rotation * this.#rotation_per_cm;
		this.#deceleration_rotation_distance = 5 * this.#pulse_per_cm;
		this.#moving_leeway = 0.2 * this.#pulse_per_cm;
		this.#still_leeway = 0.3 * this.#pulse_per_cm;

		this.#end_rotation_index = 0 * this.#pulse_per_cm;
		this.#interval = null;
		this.#reached_position = 0;


		this.set_duty_cycle(32);
	}

	function brake() {}

	function enable() {}

	function start() {
		this.#end_rotation_index = this.#curr_rotation_index;
		this.#interval = setInterval(this.#control_pwm, 10);
	}

	function stop() {
		if(this.#interval) {
			clearInterval(this.#interval);
		}
		this.set_duty_cycle(32);
	}
	
	function change_duty_cycle(change_by) {
		this.#curr_duty_cycle = #curr_duty_cycle + change_by;
		if (this.#curr_duty_cycle < 1) {
			this.#curr_duty_cycle = 1;
		} else if (this.#curr_duty_cycle > 63) {
			this.#curr_duty_cycle = 63;
		}

		this.#write_pwm_duty_cycle(this.#curr_duty_cycle);
	}

	function set_duty_cycle(new_duty_cycle) {
		this.#curr_duty_cycle = new_duty_cycle;
		this.#write_pwm_duty_cycle(this.#curr_duty_cycle);
	}

	function go_to_position(end_position) {
		this.#end_rotation_index = end_position * this.#pulse_per_cm; 
	}

	function #rotation_trigger(){
		const direction = this.direction_pin.readSync() 

		if(direction === 1) {
			this.#curr_rotation_index++;
			console.log(this.#curr_rotation_index);
		} else if (direction === 0) {
			this.#curr_rotation_index--;
			console.log(this.#curr_rotation_index);
		}
	}

	function #write_pwm_duty_cycle(duty_cycle) {
		for (let i = 0; i < this.pwm_pins.length; i++) {
			const mask = 1 << i;

			if (duty_cycle & mask) {
				this.pwm_pins[i].writeSync(1);
			} else {
				this.pwm_pins[i].writeSync(0);
			}
		}
	}

	function #control_pwm() {
		//TODO
		//acutally set enable signal low for breaking
		
		var leeway;
		if (reached_position) leeway = this.#still_leeway;
		else leeway = this.#moving_leeway;

		if(this.#end_rotation_index + leeway > this.#curr_rotation_index && this.#end_rotation_index - leeway < this.#curr_rotation_index) {
			console.log("reached approx position");
			this.set_duty_cycle(32);
		}

		var pwm_modifier = (this.#end_rotation_index - this.#curr_rotation_index) / this.#deceleration_rotation_distance);
		if (pwm_modifier < -1) pwm_modifier = -1;
		else if (pwm_modifier > 1) pwm_modifier = 1;

		var pwm_to_send = 32 + Math.ceil(25 * pwm_modifier);
		if (pwm_to_send > 32 && pwm_to_send < 35) pwm_to_send = 35;
		if (pwm_to_send > 29 && pwm_to_send < 32) pwm_to_send = 29;

		var pwm_diff = pwm_to_send - this.#curr_duty_cycle;
		if(pwm_diff > 2) pwm_diff = 2;
		else if(pwm_diff < -2) pwm_diff = -2;

		change_duty_cycle(pwm_diff);

		console.log(`${Date.now()}\t${curr_duty_cycle}`);
	}
}
