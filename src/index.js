import EventEmitter from 'eventemitter3';
import { merge, initial, partial } from "lodash"

// modules
import createDeviceList from 'midi-ports';
import { storePortConnections, isEqual, convertOptions, arraysToObject, helpObject } from './lib/utilities'
import deviceData from './lib/device-data';
import kmixDefaults from "./lib/kmix-defaults";
import midiMessageHandler from "./lib/midiMessageHandler";
import stateChangeHandler from "./lib/stateChangeHandler";
import controlMessageFromOptions from './lib/control-message-from-options';
import { default as controlMessage, getControlType, findControl, findBank, findIndex } from "./lib/control-message";
import help from "./lib/help";

let device = 'k-mix', options = {},
		ports = ['k-mix-audio-control', 'k-mix-control-surface', 'k-mix-expander'],
		names = ['bank_1', 'bank_2', 'bank_3', 'mode']

export default class KMIX extends EventEmitter {
	constructor(midi, userOptions = {}, debug = false){
		super()

		this.deviceName = 'K-Mix'
		this._debug = debug
		// store port connection status
		this.connections = {
			audioControl: {input: false, output: false},
			controlSurface: {input: false, output: false},
			expander: {input: false, output: false}
		}

		this.audioControl = {input: null, output: null}
		this.controlSurface = {input: null, output: null}
		this.expander = {input: null, output: null}

		this.midi = midi
		// set statechange handler
		this.midi.onstatechange = (e) => stateChangeHandler(e, this)

		this.banks = initial(names)

		let newOptions = convertOptions(userOptions, names)
		// make options
		this.options = merge(kmixDefaults, newOptions)
		// make devices object
		this.devices = createDeviceList(this.midi, deviceData)

		// store ports and connecitons
		this.midi.inputs.forEach(input => storePortConnections(input, this))
		this.midi.outputs.forEach(output => storePortConnections(output, this))

		if(!this.controlSurface.input) return

		// set main ports
		this.input = this.controlSurface.input
		this.output = this.audioControl.output

		// debug
		if(this._debug){
			this.inputDebug = this.audioControl.input
			this.inputDebug.onmidimessage = (e) => {
				// add formatted console logging
				midiMessageHandler(e, this)
			}
		} else { // set event handler
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
			console.warn('>> K-Mix: Please check control name');
		} else {
			this.output.send(message,  window.performance.now() + sendTime)
		}
	}

	isConnected = (port = 'all') => {
		switch (port) {
			case 'all':
				return Object.values(this.connections).every(port => port.input && port.output)
			case 'audio-control':
				return Object.values(this.connections).every(port => {
					if(port !== 'audioControl') return
					return port.input && port.output
				})
			case 'control-surface':
			return Object.values(this.connections).every(port => {
				if(port !== 'controlSurface') return
				return port.input && port.output
			})
			case 'expander':
			return Object.values(this.connections).every(port => {
				if(port !== 'expander') return
				return port.input && port.output
			})
			default:
				return false
		}
	}

	help = (() => partial(help, options))()
}
