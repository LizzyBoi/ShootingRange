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

		this.#rotation_index = 0;
		this.#curr_duty_cycle = 32;

		const pulse_per_rotation = 4;
		const rotation_per_cm = 7.5;
		const curr_position = rotation_index / pulse_per_rotation / rotation_per_cm;
		const deceleration_distance = 5;
		if (reached_position) leeway = 0.3;
		else leeway = 0.2;


		this.set_duty_cycle(32);
	}

	function brake() {}

	function enable() {}

	
	function change_duty_cycle(change_by) {
		this.#curr_duty_cycle = #curr_duty_cycle + change_by;
		if (this.#curr_duty_cycle < 1) {
			this.#curr_duty_cycle = 1;
		} else if (this.#curr_duty_cycle > 63) {
			this.#curr_duty_cycle = 63;
		}

		this.#pwmDutyCycle(this.#curr_duty_cycle);
	}

	function set_duty_cycle(new_duty_cycle) {
		this.#curr_duty_cycle = new_duty_cycle;
		this.#pwmDutyCycle(this.#curr_duty_cycle);
	}

	function go_to_position(end_position) {
		if(interval) {
			clearInterval(interval);
		}

		while(!cancel_move) {
			interval = setInterval(#set_pwm_controller, 10, end_position);
		}
	}

	function #rotation_trigger(){
		const direction = this.direction_pin.readSync() 

		if(direction === 1) {
			this.#rotation_index++;
			console.log(this.#rotation_index);
		} else if (direction === 0) {
			this.#rotation_index--;
			console.log(rotation_index);
		}
	}

	function #pwmDutyCycle(duty_cycle) {
		for (let i = 0; i < this.pwm_pins.length; i++) {
			const mask = 1 << i;

			if (duty_cycle & mask) {
				this.pwm_pins[i].writeSync(1);
			} else {
				this.pwm_pins[i].writeSync(0);
			}
		}
	}

	function #set_pwm_controller(end_position) {
		//TODO
		//acutally set enable signal low for breaking
		const pulse_per_rotation = 4;
		const rotation_per_cm = 7.5;
		const curr_position = rotation_index / pulse_per_rotation / rotation_per_cm;
		const deceleration_distance = 5;
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
		if (pwm_to_send > 29 && pwm_to_send < 32) pwm_to_send = 29;

		var pwm_diff = pwm_to_send - curr_duty_cycle;
		if(pwm_diff > 5) pwm_diff = 5;
		else if(pwm_diff < -5) pwm_diff = -5;

		change_duty_cycle(pwm_diff);

		console.log(`${Date.now()}\t${curr_duty_cycle}`);
	}
}
