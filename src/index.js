import EventEmitter from 'eventemitter3';
import { merge, initial, partial } from "lodash"

// modules
import createDeviceList from 'midi-ports';
import { isEqual, convertOptions, arraysToObject, helpObject } from './lib/utilities'
import deviceData from './lib/device-data';
import kmixDefaults from "./lib/kmix-defaults";
import midiMessageHandler from "./lib/midiMessageHandler";
import controlMessageFromOptions from './lib/control-message-from-options';
import { default as controlMessage, getControlType, findControl, findBank, findIndex } from "./lib/control-message";
import help from "./lib/help";

let device = 'k-mix', options = {},
		ports = ['k-mix-audio-control', 'k-mix-control-surface', 'k-mix-expander'],
		names = ['bank_1', 'bank_2', 'bank_3', 'mode']

export default class KMIX extends EventEmitter {
	constructor(midi, userOptions = {}, debug = false){
		super()
		this.midi = midi
		this._debug = debug

		this.banks = initial(names)

		let newOptions = convertOptions(userOptions, names)
		// make options
		this.options = merge(kmixDefaults, newOptions)
		// make devices object
		this.devices = createDeviceList(this.midi, deviceData)
		// set message handlers
		this.input = this.midi.inputs.get(this.devices[device][ports[1]].inputID)
		this.output = this.midi.outputs.get(this.devices[device][ports[1]].outputID)

		this.audioControl = {
			input : this.midi.inputs.get(this.devices[device][ports[0]].inputID),
			output : this.midi.outputs.get(this.devices[device][ports[0]].outputID)
		}
		this.controlSurface = {
			input : this.midi.inputs.get(this.devices[device][ports[1]].inputID),
			output : this.midi.outputs.get(this.devices[device][ports[1]].outputID)
		}
		this.expander = {
			input : this.midi.inputs.get(this.devices[device][ports[2]].inputID),
			output : this.midi.outputs.get(this.devices[device][ports[2]].outputID)
		}

		// debug
		if(this._debug){
			this.inputDebug = this.midi.inputs.get(this.devices[device][ports[0]].inputID)
			this.inputDebug.onmidimessage = (e) => {
				// add formatted console logging
				midiMessageHandler(e, this)
			}
		} else {
			this.input.onmidimessage = (e) => {
				// add formatted console logging
				midiMessageHandler(e, this)
			}
		}
	}

	send(control, value, bank = 1, time = 0) {
		let output, message, sendTime,
				port = ports[0],
				controlType = getControlType(control);

		sendTime = time

		switch(controlType){
			case 'raw':
				// raw : send([176,1,127], time)
				message = control
				time = value || 0
				port = ports[0];

				break;

			case 'raw-control':
				// raw-control : send('control',[176,1,127], time)
				message = value
				port = ports[1];

				break;

			case 'control':
				// to control-surface : send('control:button-vu',0), send('control:fader-1', 64)
				port = ports[1];
				control = control.split(':')[1]
				message = controlMessageFromOptions(control, value, bank, options)

				break;

			case 'raw-expander':
				port = ports[2]
				control = control.split(':')[1]
				message = value

			case 'expander':
				port = ports[2]
				control = control.split(':')[1]
				message = value

			default: // 'input', 'main', 'misc', 'preset'
				// to audio control : send('fader:1', value, time)
				message = controlMessage(control, value, controlType)

				break;
		}

		if(message.length < 3 && controlType !== 'preset') {
			console.log('Please check control name');
		} else {
			this.output.send(message,  window.performance.now() + sendTime)
		}
	}

	help = (() => partial(help, options))()
}
