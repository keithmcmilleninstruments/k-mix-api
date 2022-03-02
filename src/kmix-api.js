import EventEmitter from 'eventemitter3';
import merge from "lodash.merge"
import initial from "lodash.initial"

// modules
import { storePortConnections, convertOptions } from './lib/utilities'
import kmixDefaults from "./lib/kmix-defaults";
import midiMessageHandler from "./lib/midiMessageHandler";
import stateChangeHandler from "./lib/stateChangeHandler";
import controlMessageFromOptions from './lib/control-message-from-options';
import { controlMessage, getControlType } from "./lib/control-message";
import helpRequest from "./lib/help";

let names = ['bank_1', 'bank_2', 'bank_3', 'mode']

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

		// ports
		this.audioControl = {input: null, output: null}
		this.controlSurface = {input: null, output: null}
		this.expander = {input: null, output: null}

		this.midi = midi
		// set statechange handler
		this.midi.addEventListener('statechange', (e) => stateChangeHandler(e, this))

		this.banks = initial(names)

		let newOptions = convertOptions(userOptions, names)
		// make options
		this.options = merge(kmixDefaults, newOptions)

		// store ports and connecitons
		this.midi.inputs.forEach(input => storePortConnections(input, this))
		this.midi.outputs.forEach(output => storePortConnections(output, this))

		if(!this.controlSurface.input) {
			console.error('> K-Mix API: Control Surface Port not connected')
			return
		}

		// set default ports
		this.input = this.controlSurface.input
		this.output = this.audioControl.output

		// set listener for messages
		this.input.onmidimessage = (e) => {
			// add formatted console logging
			midiMessageHandler(e, this)
		}
	}

	send(control, value, bank = 1, time = 0) {
		let output, message, sendTime,
			controlType = getControlType(control);

		sendTime = parseInt(time)

		switch(controlType){
			case 'raw':
				// raw : send([176,1,127], time)
				message = control
				time = value || 0
				output = this.audioControl.output

				break;

			case 'raw-control':
				// raw-control : send('control',[176,1,127], time)
				message = value
				output = this.controlSurface.output

				break;

			case 'control':
				// to control-surface : send('control:button-vu',0), send('control:fader-1', 64)
				control = control.split(':')[1]
				message = controlMessageFromOptions(control, value, bank, this.options)
				output = this.controlSurface.output
				
				break;

			case 'raw-expander':
				control = control.split(':')[1]
				message = value
				output = this.expander.output
				
				break;

			case 'expander':
				control = control.split(':')[1]
				message = value
				output = this.expander.output
				
				break;

			default: // 'input', 'main', 'misc', 'preset'
				// to audio control : send('fader:1', value, time)
				message = controlMessage(control, value, controlType)
				output = this.audioControl.output
				break;
		}

		if(message.length < 3 && controlType !== 'preset') {
			console.warn('>> K-Mix: Please check control name');
		} else {
			output.send(message,  window.performance.now() + sendTime)
		}
	}

	isConnected = (port = 'all') => {
		switch (port) {
			case 'all':
				return Object.values(this.connections).every(port => port.input && port.output)
			case 'audio-control':
				return Object.values(this.connections.audioControl).every(Boolean)
			case 'control-surface':
				return Object.values(this.connections.controlSurface).every(Boolean)
			case 'expander':
				return Object.values(this.connections.expander).every(Boolean)
			default:
				return false
		}
	}

	help = (request) => {
		helpRequest(this.options, request)
	}
}