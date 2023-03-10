const Gpio = require('onoff').Gpio;
let PidController = require('node-pid-controller'); 

class MotorController {
	constructor(pwm_pin_numbers, rotation_pin_number, direction_pin_number, enable_pin_number, emergency_pin_number, distance_callback) {
		this.pwm_pins = [];
		for (const pwm_pin_number of pwm_pin_numbers) {
			this.pwm_pins.push(new Gpio(pwm_pin_number, 'out'));	
		}
		this.rotation_pin = new Gpio(rotation_pin_number, 'in', 'both');
		this.rotation_pin.watch(this.rotation_trigger.bind({"caller": this}));
		this.direction_pin = new Gpio(direction_pin_number, 'in');
		this.distance_callback = distance_callback;

		//set to watch on both edges
		this.emergency_pin = new Gpio(emergency_pin_number, 'in');;

		this.curr_rotation_index = 0;
		this.curr_duty_cycle = 32;

		this.pulse_per_rotation = 2;
		this.rotation_per_cm = 7.15;
		this.pulse_per_cm = this.pulse_per_rotation * this.rotation_per_cm;
		this.deceleration_rotation_distance = 5 * this.pulse_per_cm;
		this.moving_leeway = 0.2 * this.pulse_per_cm;
		this.still_leeway = 0.3 * this.pulse_per_cm;

		this.end_rotation_index = 0 * this.pulse_per_cm;
		this.reached_position = 0;
		this.time_since_trigger = Date.now();;

		this.max_pwm = 54;
		this.min_pwm = 10;
		this.lower_dead = 28;
		this.upper_dead = 36;

		this.stopped = 1;
		this.pid_domain = 20 * this.pulse_per_cm;
		this.accel_time_ms = 200;
		this.last_pwm_inc_time = Date.now();
		this.ctr = new PidController({
			k_p: 0.065, 
			k_i: 0.01, 
			k_d: 0.00, 
			i_max: 5
		});
		this.interval = setInterval(this.controller_update.bind({"caller": this}), 25); 

		this.set_duty_cycle(32);

	}

	brake() {}

	enable() {}

	set_pid_values(values) {
		this.ctr.k_p = values.k_p
		this.ctr.k_i = values.k_i
		this.ctr.k_d = values.k_d
		this.ctr.i_max = values.i_max

		//console.log("updated pid values");
	}

	get_pid_values() {
		return {k_p: this.ctr.k_p, k_i: this.ctr.k_i, k_d: this.ctr.k_d, i_max: this.ctr.i_max}
	}

	start() {
		/*
		this.end_rotation_index = this.curr_rotation_index;
		this.interval = setInterval(this.pid_update, 50, this);
		*/
		this.stopped = 0;
		//console.log(this.stopped);
	}

	stop() {
		/*
		if(this.interval) {
			clearInterval(this.interval);
		}
		*/
		this.stopped = 1;
		//console.log(this.stopped);
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
		caller.time_since_trigger = Date.now();

		if(direction === 1) {
			caller.curr_rotation_index++;
		} else if (direction === 0) {
			caller.curr_rotation_index--;
		}

		if(Math.round(caller.curr_rotation_index % caller.pulse_per_cm) === 0) {
			let int_distance = Math.round(caller.curr_rotation_index / caller.pulse_per_cm);	
			caller.distance_callback({dist: int_distance, dir: direction});
		}


		console.log(`rotation: ${caller.curr_rotation_index}`);
	}

	write_pwm_duty_cycle(duty_cycle) {
		let duty_cycle_int = Math.ceil(duty_cycle)
		for (let i = 0; i < this.pwm_pins.length; i++) {
			const mask = 1 << i;

			if (duty_cycle_int & mask) {
				this.pwm_pins[i].writeSync(1);
			} else {
				this.pwm_pins[i].writeSync(0);
			}
		}
	}

	controller_update() {
		let caller = this.caller;
		let now = Date.now();
		let timediff = now - caller.last_pwm_inc_time;

		if(now - caller.time_since_trigger > caller.accel_time_ms) {
			let int_distance = Math.round(caller.curr_rotation_index / caller.pulse_per_cm);
			caller.distance_callback({dist: int_distance, dir: -1});
		}

		if (caller.stopped) {
			return
		}
		let error = caller.end_rotation_index - caller.curr_rotation_index;

		if (error < 2 && error > -2) {
			caller.set_duty_cycle(32);
			//console.log(`duty_cycle ${caller.curr_duty_cycle} rotation_index ${caller.curr_rotation_index} distance ${caller.curr_rotation_index/caller.pulse_per_cm}`);
			//console.log(`sumError: ${caller.ctr.sumError}`);
			//console.log(`lastError: ${caller.ctr.lastError}`);
			//console.log(`lastTime: ${caller.ctr.lastTime}`);
			return
		};

		if (error < caller.pid_domain && error > -1 * caller.pid_domain) {
			let pid_output = caller.ctr.update(caller.curr_rotation_index);
			let pwm_output = caller.pid_output_to_pwm(pid_output);
			//console.log(`error: ${error}`);
			//console.log(`pid_input: ${pwm_output}`);
			//console.log(`curr_input: ${caller.curr_duty_cycle}`);
			//console.log(`timediff: ${timediff}`);
			if(error > 0 && pwm_output > caller.curr_duty_cycle) {
				if(timediff > caller.accel_time_ms) {
					caller.change_duty_cycle(1);
					caller.last_pwm_inc_time = now;
				}
			} else if (error < 0 && pwm_output < caller.curr_duty_cycle) {
				if(timediff > caller.accel_time_ms) {
					caller.change_duty_cycle(-1);
					caller.last_pwm_inc_time = now;
				}
			} else {
				caller.set_duty_cycle(pwm_output);
			}
			
		} else {
			if (timediff > caller.accel_time_ms) {
				if (error > 0) {
					caller.change_duty_cycle(1);
				} else {
					caller.change_duty_cycle(-1);
				}
				
				caller.last_pwm_inc_time = now;
			}
		}
		//console.log(`duty_cycle ${caller.curr_duty_cycle} rotation_index ${caller.curr_rotation_index} distance ${caller.curr_rotation_index/caller.pulse_per_cm}`);
		//console.log(`sumError: ${caller.ctr.sumError}`);
		//console.log(`lastError: ${caller.ctr.lastError}`);
		//console.log(`lastTime: ${caller.ctr.lastTime}`);
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

		return offset;
	}

	calibrate_distance(distance_cm) {
		let distance_pulse = distance_cm * this.pulse_per_cm;
		let this.curr_rotation_index = Math.floor(distance_pulse);

		let int_distance = Math.round(this.curr_rotation_index / this.pulse_per_cm);
		this.distance_callback({dist: int_distance, dir: -1});
	}
}

module.exports = MotorController;
