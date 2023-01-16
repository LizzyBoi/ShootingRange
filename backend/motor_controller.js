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
		this.reached_position = 0;

		this.max_pwm = 54;
		this.min_pwm = 10;
		this.lower_dead = 28;
		this.upper_dead = 36;

		this.stopped = 1;
		this.pid_domain = 10 * this.pulse_per_cm;
		this.accel_time_ms = 20;
		this.last_pwm_inc_time = Date.now();
		this.ctr = new PidController({
			k_p: 0.20, 
			k_i: 0.01, 
			k_d: 0.01, 
			i_max: 10});
		this.interval = setInterval(this.controller_update.bind({"caller": this}), 100); 

		this.set_duty_cycle(32);

	}

	brake() {}

	enable() {}

	set_pid_values(values) {
		this.ctr.k_p = values.k_p
		this.ctr.k_i = values.k_i
		this.ctr.k_d = values.k_d
		this.ctr.i_max = values.i_max
	}

	start() {
		/*
		this.end_rotation_index = this.curr_rotation_index;
		this.interval = setInterval(this.pid_update, 50, this);
		*/
		this.stopped = 0;
		console.log(this.stopped);
	}

	stop() {
		/*
		if(this.interval) {
			clearInterval(this.interval);
		}
		*/
		this.stopped = 1;
		console.log(this.stopped);
		this.set_duty_cycle(32);
	}
	
	change_duty_cycle(change_by) {
		this.curr_duty_cycle = this.curr_duty_cycle + change_by;
		if (this.curr_duty_cycle < this.min_pwm) {
			this.curr_duty_cycle = this.min_pwm;
		} else if (this.curr_duty_cycle > this.max_pwm) {
			this.curr_duty_cycle = this.max_pwm;
		}

		this.write_pwm_duty_cycle(this.curr_duty_cycle);
	}

	set_duty_cycle(new_duty_cycle) {
		this.curr_duty_cycle = new_duty_cycle;
		this.write_pwm_duty_cycle(this.curr_duty_cycle);
	}

	go_to_position(end_position) {
		this.end_rotation_index = end_position * this.pulse_per_cm; 
		this.ctr.setTarget(this.end_rotation_index);
	}

	rotation_trigger() {
		const caller = this.caller;
		const direction = caller.direction_pin.readSync();

		if(direction === 1) {
			caller.curr_rotation_index++;
		} else if (direction === 0) {
			caller.curr_rotation_index--;
		}

		console.log(`rotation: ${caller.curr_rotation_index}`);
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

	controller_update() {
		let caller = this.caller;
		if (caller.stopped) return;
		let error = caller.end_rotation_index - caller.curr_rotation_index;

		if (error < 3 && error > -3) {
			console.log("at position");
			caller.set_duty_cycle(32);
			return
		};

		if (error < caller.pid_domain && error > -1 * caller.pid_domain) {
			console.log("pid");
			let input = caller.ctr.update(caller.curr_rotation_index);
			caller.pid_output_to_pwm(input);
		} else {
			console.log("cool amazing stuff");
			let now = Date.now()
			let timediff = now - caller.last_pwm_inc_time;
			console.log(`timediff ${timediff}`);
			if (timediff > caller.accel_time_ms) {
				if (error > 0) {
					caller.change_duty_cycle(1);
				} else {
					caller.change_duty_cycle(-1);
				}
				
				caller.last_pwm_inc_time = now;
			}
		}
		console.log(`duty_cycle ${caller.curr_duty_cycle} rotation_index ${caller.curr_rotation_index} distance ${caller.curr_rotation_index/caller.pulse_per_cm}`);
	}

	pid_output_to_pwm(pid_output) {
		let offset;

		if (pid_output < 0) {
			offset = this.lower_dead + pid_output;
			if (offset < this.min_pwm) offset = this.min_pwm;
		} else if (pid_output > 0){
			offset = this.upper_dead + pid_output;
			if (offset > this.max_pwm) offset = this.max_pwm;
		} else {
			offset = 32;
		}

		this.set_duty_cycle(offset);	
	}
}

module.exports = MotorController;
