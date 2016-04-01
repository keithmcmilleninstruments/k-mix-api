# k-mix-api
Javascript API for fully controlling Keith McMillen Instruments [K-Mix](https://www.keithmcmillen.com/products/k-mix/) digital audio mixer / control surface. With the exceptions of channel soloing, fader grouping, and Aux Pre/Post switches, nearly all K-Mix parameters that can be controlled from the hardware can be controlled via MIDI messages sent to K-Mix. 

K-Mix has 3 MIDI Bank modes in addition to the main Mix Bank, which gives you a total of 32 faders, 12 rotaries, and 87 buttons of assignable controls.

##Install
```bash
npm install k-mix-api --save
```

##Usage
```js
import KMIX from 'k-mix-api'

let midi, kmix
// get our midiAccess object and assign to 'midi'.
navigator.requestMIDIAccess()
	.then((midiAccess) => midi = midiAccess)

// pass our midi object to KMIX
// KMIX(midi [, options = {}, debug = false])
kmix = KMIX(midi)
```

##Options
The options object is a reflection of your K-Mix settings in the MIDI tab of the [K-Mix Editor](https://www.keithmcmillen.com/downloads#kmix), allowing you to specify what midi channels you want to use with K-Mix and what CC messages each fader, rotary, and button outputs on a per bank level. Please consult the [K-Mix Manual](https://files.keithmcmillen.com/products/k-mix/documentation/kmix-manual.pdf) Section 5.2.4.

Any fader, rotary, and button that is in the default setting can be ommited from the options object. Only add what you have changed. 

*A complete list of options is at the bottom of this README.

```js
/* every button on K-Mix can either be set to behave like 
	a normal button (button down = on, button up = off), or
	a toggle button (button down #1 = on, button down #2 = off)
	Note: this must be set in the K-Mix Editor MIDI tab
*/
let options = {
	"midi-channels": [1,2,3],
	"fader-1": {"bank_1": 1, "bank_2": 1, "bank_3": 1},
	"fader-master": {"bank_1": 9, "bank_2": 9, "bank_3": 9},
	"rotary-1": {"bank_1": 10, "bank_2": 10, "bank_3": 10},
	"button-preset": {"bank_1": 13, "bank_2": 13, "bank_3": 13, "mode": "momentary"},
	"channel-select-1": {"bank_1": 1, "bank_2": 1, "bank_3": 1, "mode": "momentary"},
	"diamond-up": {"bank_1": 26, "bank_2": 26, "bank_3": 26, "mode": "toggle"}
}
```

You can also use a more terse syntax which requires you to specify midi channels for all 3 MIDI Banks. 

```js
let options = {
	"midi-channels": [1,2,3],
	"fader-1": [1,1,1],
	"fader-master": [9,9,9],
	"rotary-1": [10,10,10],
	"button-preset": [13,13,13,"momentary"],
	"channel-select-1": [1,1,1,"momentary"],
	"diamond-up": [26,26,26,"toggle"]
}
```
##Mix Bank and MIDI Banks
To use K-Mix as a MIDI controller with this API, you must put K-Mix into 1 of 3 MIDI Bank modes by pressing the shift button and selecting a diamond button with a number next to it. The MIDI Channel, CC/Note messages sent by K-Mix are configured in the K-Mix Editor's MIDI tab and passed into this API as an options object as discussed above. 

No MIDI data is sent from K-Mix when it is in the default 'Mix Mode'. 

You can still control K-Mix's audio parameteres regardless of which mode you're in as long as you are sending the correct message type.

##Events

When K-Mix is in one of 3 MIDI Bank modes it sends out events named for the control that is sending out data. For example, if you move the master fader, an event of 'fader:master' is sent out along with the fader data for that event.

```js
// fader-1
kmix.on('fader-1', (data) => console.log('fader-1', data))
 
 // listen for on/144 button messages. default
kmix.on('button-vu', (data) => console.log('button-vu', data))
 
 // listen for off/128 button messages
kmix.on('button-vu:off', (data) => console.log('button-vu:off', data))
```
If you want to listen to events from a large number of controls, you can listen to the 'any' event and build the logic of how to handle the data with conditional / switch statements.

```js
 // returns a data object with the name of the control and the raw MIDI message
kmix.on('any', (data) => {
	console.log('control-name', data.control, 'control-data', data.raw)
	// data.control == 'fader-1'
	// data.raw == [176,1,67]
	switch(data.control){
		case 'fader-1':
			console.log('fader-1', data.raw)
			break;
		case 'button-vu':
			console.log('button-vu', data.raw)
			break;
		case 'button-vu:off':
			console.log('button-vu:off', data.raw)
			break;
	}
})
```
##Sending* 
**Sending data to K-Mix will be supported very soon.*

There are 3 different send modes with K-Mix:


####_k-mix-audio-control; default_

Sending to the 'k-mix-audio-control' port controls the K-Mix Mix Bank, which controls all of the audio features of K-Mix like changing fader levels, EQ, and spatialization in addition to sending preset change messages.

_**Inputs 1 - 8**_: 
All of the per input channel [1-8] automatable control parameteres are listed in section 4.3.3 of the Manual. The input channel is denoted by ':channel', so for controlling input channel 3's fader level, you would use 'fader:3'.

_**Main/Master Fader**_:
In order to control the main fader, send to 'main:fader', which controls the main fader level

**_Misc (reverb/surround/auxes)_**:
To control K-Mix's miscellaneous features (reverb/surround/auxes), covered in section 4.3.3.4 in the Manual, send to 'misc:reverb-level', which controls the K-Mix's main reverb level

_**Presets**_:
To change a preset on K-Mix, just send a message to 'preset'. K-Mix has 12 on board presets.

```js
// inputs 1-8
kmix.send('fader:1', 127)
kmix.send('fader:1', 127, time) // with time
// control input 1 high-frequency EQ parameter
kmix.send('eq-high-frequency:1', 127)

// Main Fader
kmix.send('main:mute', 11) // auto channel 9

// Misc
kmix.send('misc:reverb-level', 100) // auto channel 10

// load preset #2
kmix.send('preset', 2)
```

####_k-mix-control-surface_

If you wish to control the K-Mix's 3 MIDI Banks, covered in section 4.3.4 of the Manual, you send to the 'k-mix-control-surface' port, refered to in this API as 'control'. The main purpose of sending to the 'control' port is for K-Mix LED control.
As seen below, the desired control must be prepended by 'control:'. The optional 'time' and 'bank' [1-3] parameters follow, 'bank' defaults to 1. If you wish to send to a different bank, you must set the time argument to either 0 or millisecond value before the bank argument.

If you wish to control buttons, it **must** be in 'toggle' mode, otherwise the 

```js
kmix.send('control:fader-3', 127 [, time, bank]) // control, value, time, bank
// if you wish to send to a different bank, you must set the time argument to either 0 or millisecond value 
kmix.send('control:rotary-1', 64, time, 2) // set rotary-1 to 64 in bank 2
// in order to control buttons, a button must be in 'toggle' mode
kmix.send('control:button-vu', 127) // turn button-vu on; any value > 0
kmix.send('control:button-vu', 0) // turn button-vu off
```
####_raw MIDI messages_

If you think in midi messages, you can send raw midi messages to K-Mix. You pass in the byte array with optional time and the port you want to send to, which defaults to 'k-mix-audio-control'. If you want to send to the 'k-mix-control-surface', add 'control' after time.

```js
kmix.send([176, 1, 127] [, time])
kmix.send('control', [176, 1, 127] [, time]) // send to 'k-mix-control-surface'
// you can also use hex values [0xB0,1,0x7F]

/*
	Note: all faders and rotaries are of type 176 + channel, 
			  all buttons are of type 144 for on and 128 for off.
*/
```

####Time
You can specify when the message should be sent by including a [DOMHighResTimeStamp](https://developer.mozilla.org/en-US/docs/Web/API/DOMHighResTimeStamp), specified in _*milliseconds*_, just as you would with the Web MIDI API. For example, if you wanted a message sent in one second, you would use 1000 as the send time:

```js
let time = 1000.0
kmix.send('fader:1', 127, time)
```
The default send time in this API is always *window.performance.now()* which schedules a message to be immediately sent. *Passing in window.performance.now() as the time would produce undesired send times, since then 'time' would equal window.performance.now() + window.performance.now()

##Help
If you want a reference for any of the names or CC/note messages of all of K-Mix's controllable parameters call 'help' on your 'kmix' variable and pass in what you're looking for and the parameteres will be to your browser's console. The 4 options are: 

'control': default/your options object. MIDI tab of the K-Mix Editor. Section 5.2.4
'input': input channel parameters. Section 4.3.3.2
'main': main output bus parameters. Section 4.3.3.3
'misc': reverb/surround/auxes. Section 4.3.3.4

```js
// Help
kmix.help('control') // 'control', 'input', 'main', 'misc'
```
Refer to the manual sections listed above for more info.

###Debug
If the debug boolean is true, every message from K-Mix is logged into the browser console.
You can also add an html element with the ID of 'kmixlog' to your markup to get message details directly in your page.

```html
<div id="kmixlog">
rotary-1
from K-Mix Control Surface
port -526462756
176,10,53
channel 1
</div>
```

##* MIDI Bank Option names
```js

// faders and rotaries
"fader-1"
"fader-2"
"fader-3"
"fader-4"
"fader-5"
"fader-6"
"fader-7"
"fader-8"
"fader-master"
"rotary-1"
"rotary-2"
"rotary-3"
"rotary-4"
// buttons
"button-byps"
"button-fine"
"button-vu"
"button-main"
"button-aux-1"
"button-aux-2"
"button-aux-3"
"button-comp"
"button-gate"
"button-pan"
"button-eq"
"button-verb"
"button-trim"
"button-48v"
"button-headphones"
"button-preset"
"channel-select-1"
"channel-select-2"
"channel-select-3"
"channel-select-4"
"channel-select-5"
"channel-select-6"
"channel-select-7"
"channel-select-8"
"channel-select-master"
"diamond-up"
"diamond-down"
"diamond-left"
"diamond-right"
```