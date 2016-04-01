# k-mix-api
Javascript API for fully controlling Keith McMillen Instruments [K-Mix](https://www.keithmcmillen.com/products/k-mix/) digital audio mixer.

##Install
```bash
npm install k-mix-api --save
```

##Usage
```js
import KMIX from 'k-mix-api'

let midi, kmix
// get our midiAccess object and assign to 'midi'. Note: sysex must be set to true for full functionality.
navigator.requestMIDIAccess({sysex: true})
	.then((midiAccess) => midi = midiAccess)

// pass our midi object to KMIX
kmix = KMIX(midi [, options = {}, debug = false])
```

##Options
The options object is a reflection of your K-Mix settings in the MIDI tab of the K-Mix Editor allowing you to specify what midi channels you want to use with K-Mix and what CC messages each fader, rotary, and button outputs on a per bank level. Please consult the [K-Mix Manual](https://files.keithmcmillen.com/products/k-mix/documentation/kmix-manual.pdf) section 4.3.

Any fader, rotary, and button that is in the default setting can be ommited from the options object. Only add what you have changed. 

*A complete list of options is at the bottom of this README.

```js
/* every button on K-Mix can either be set to behave like 
	a normal button (button down = on, button up = off), or
	a toggle button (button down #1 = on, button down #2 = off)
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

// You can also use a more terse syntax

let options = {
	"midi-channels": [1,2,3],
	"fader-1": [1,1,1],
	"fader-master": [9,9,9],
	"rotary-1": [10,10,10],
	"button-preset": [13,13,13,"momentary"],
	"channel-select-1": [1,1,1,"momentary"],
	"diamond-up": [26,26,26,"toggle"]
}

/*
	Note: all faders and rotaries output CC messages, type 176, 
	while all buttons output standard note messages of type 144 for on and 128 for off.
*/
```
##Events
Listening to what messages K-Mix is sending 

```js
// fader-1
kmix.on('fader-1', callback)
 
 // listen for on/144 button messages. default
kmix.on('button-vu', callback)
 
 // listen for off/128 button messages
kmix.on('button-vu:off', callback)
```
If you want to listen to events from a large number of controls, you can listen to the 'any' event and build the logic of what to do with conditional / switch statements.

```js
 // returns a data object with the name of the control and the raw MIDI message
kmix.on('any', callback)
// data.control == 'fader-1'
// data.raw == [176,1,67]
```
##Sending* 
**Sending data to K-Mix will be supported soon.*
There are 3 different send modes with K-Mix:


_k-mix-audio-control_; default
Sending to the 'k-mix-audio-control' port controls the K-Mix Mix Bank, which control all of the audio features of K-Mix like changing fader levels, EQ, and spatialization in addition to sending preset change messages.

All of the per input channel [1-9] automatable control parameteres are listed in section 4.3.3 of the Manual. The input channel is denoted by ':channel', so for controlling input channel 3's fader level, you would use 'fader:3'.

```js
kmix.send('preset', 2)
// set fader 1 to 127, max.
kmix.send('fader:1', 127)
kmix.send('fader:1', 127, 'input', time) // with time
// control fader 1 high-frequency eq setting
kmix.send('eq-high-frequency:1', 127)
kmix.send('mute', 11, 'main_out') // auto channel 9
kmix.send('reverb-bypass', 11, 'misc') // auto channel 10
```
_k-mix-control-surface_
If you wish to control the K-Mix's 3 MIDI Banks, covered in section 4.3.4 of the Manual, you send to the 'k-mix-control-surface' port, refered to in this API as 'control'. As seen below the desired control must be prepended by 'control:'. time and bank [1-3], default is bank 1, settings follow. 

```js
kmix.send('control:fader-3', 127, 'cc'[, time, bank]) // control, value, type['cc', 'on', 'off'], time, bank
kmix.send('control:rotary-1', 64, 'cc', time, 2) // set rotary to 64 in bank 2
kmix.send('control:button-vu', 127, 'on') // turn button-vu on
kmix.send('control:button-vu', 0, 'off') // turn button-vu off
```

_raw MIDI messages_
If you have midi message types and message memorized, you can send raw midi messages to K-Mix. You pass in the byte array with optional time and type of messages you want to send. 'control', 'input', 'main_out', 'misc'

```js
kmix.send([176, 1, 127] [, time, 'control'])
```

####Time
You can specify when the message should be sent by including a [DOMHighResTimeStamp](https://developer.mozilla.org/en-US/docs/Web/API/DOMHighResTimeStamp) just as you would with the Web MIDI API. For instance, if you wanted a message sent in one second, *time = window.performance.now() + 1000.0*. the defualt send time is 0, or immediately, but if you wish to set your own send time, you must include the control type before the time argument. The four types are: 'control', 'input', 'main_out', 'misc'

##Help
If you want a reference for any of the names or CC/note messages of all of K-Mix's controllable parameters call 'help' on your 'kmix' variable and pass in what you're looking for and the parameteres will be to your browser's console. The 4 options are: 

'control': default/your options object. MIDI tab of the K-Mix Editor
'input': input channel parameters. Section 4.3.3.2
'main_out': main output bus parameters. Section 4.3.3.3
'misc': reverb/surround/auxes. Section 4.3.3.4

```js
// Help
kmix.help('control') // 'control', 'input', 'main_out', 'misc'
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