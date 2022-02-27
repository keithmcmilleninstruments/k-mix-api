// convert each to Map

/*
• MIDI Channel 1 = Input Channel 1 Settings
• MIDI Channel 2 = Input Channel 2 Settings
• MIDI Channel 3 = Input Channel 3 Settings
• MIDI Channel 4 = Input Channel 4 Settings
• MIDI Channel 5 = Input Channel 5 Settings
• MIDI Channel 6 = Input Channel 6 Settings
• MIDI Channel 7 = Input Channel 7 Settings
• MIDI Channel 8 = Input Channel 8 Settings
• MIDI Channel 9 = Main Output Settings
• MIDI Channel 10 = Misc. Settings (Reverb, Surround, Auxes)
*/
// INPUT CHANNEL PARAMETERS : sent to channels 1 - 9

/*
• Fader/Volume Level = CC 1
• Mute = CC 2
• EQ Bypass = CC 3
• EQ High Boost/Cut Level = CC 4
• EQ High Frequency = CC 5
• EQ Mid Boost/Cut Level = CC 6
• EQ Mid Frequency = CC 7
• EQ Mid Q = CC 8
• EQ Low Boost/Cut Level = CC 9
• EQ Low Frequency = CC 10
• Gate Bypass = CC 11
• Gate Threshold = CC 12
• Gate Attack Time = CC 13
• Gate Release Time = CC 14
• Gate Gain Reduction = CC 15
• Compressor Bypass = CC 16
• Compressor Threshold = CC 17
• Compressor Attack Time = CC 18
• Compressor Release Time = CC 19
• Compressor Ratio = CC 20
• Compressor Makeup Gain = CC 21
• Left/Right Panning (to Mains) = CC 22 
• Aux 1 Send Level = CC 23
• Aux 1 Panning = CC 24
• Aux 2 Send Level = CC 25
• Aux 2 Panning = CC 26
• Aux 3 Send Level = CC 27
• Aux 3 Panning = CC 28
• Input Trim = CC 29
*/
var input_channel_params = {
  "fader": 1,
  "mute": 2,
  "eq-bypass": 3,
  "eq-high-boost": 4,
  "eq-high-frequency": 5,
  "eq-mid-boost": 6,
  "eq-mid-frequency": 7,
  "eq-mid-q": 8,
  "eq-low-boost": 9,
  "eq-low-frequency": 10,
  "gate-bypass": 11,
  "gate-threshold": 12,
  "gate-attack-time": 13,
  "gate-release-time": 14,
  "gate-gain-reduction": 15,
  "compressor-bypass": 16,
  "compressor-threshold": 17,
  "compressor-attack-time": 18,
  "compressor-release-time": 19,
  "compressor-ratio": 20,
  "compressor-makeup-gain": 21,
  "pan-main": 22,
  "send-aux-1": 23,
  "pan-aux-1": 24,
  "send-aux-2": 25,
  "pan-aux-2": 26,
  "send-aux-3": 27,
  "pan-aux-3": 28,
  "trim": 29
}; // MAIN OUTPUT BUS PARAMETERS : sent to channel 9

/*
• Fader/Volume Level = CC 1
• Mute = CC 2
• EQ Bypass = CC 3
• EQ High Boost/Cut Level = CC 4
• EQ High Frequency = CC 5
• EQ Mid Boost/Cut Level = CC 6
• EQ Mid Frequency = CC 7
• EQ Mid Q = CC 8
• EQ Low Boost/Cut Level = CC 9
• EQ Low Frequency = CC 10
• Gate Bypass = CC 11
• Gate Threshold = CC 12
• Gate Attack Time = CC 13
• Gate Release Time = CC 14
• Gate Gain Reduction = CC 15
• Compressor Bypass = CC 16
• Compressor Threshold = CC 17
• Compressor Attack Time = CC 18 
• Compressor Release Time = CC 19 
• Compressor Ratio = CC 20
• Compressor Makeup Gain = CC 21
*/

var main_output_bus_params = {
  "fader": 1,
  "mute": 2,
  "eq-bypass": 3,
  "eq-high-boost": 4,
  "eq-high-frequency": 5,
  "eq-mid-boost": 6,
  "eq-mid-frequency": 7,
  "eq-mid-q": 8,
  "eq-low-boost": 9,
  "eq-low-frequency": 10,
  "gate-bypass": 11,
  "gate-threshold": 12,
  "gate-attack-time": 13,
  "gate-release-time": 14,
  "gate-gain-reduction": 15,
  "compressor-bypass": 16,
  "compressor-threshold": 17,
  "compressor-attack-time": 18,
  "compressor-release-time": 19,
  "compressor-ratio": 20,
  "compressor-makeup-gain": 21
}; // MISC. PARAMETERS (REVERB/SURROUND/AUXES) : sent to channel 10

/*
• Reverb Channel Send Levels 1–8 = CCs 1–8
• Reverb PreDelay = CC 9
• Reverb Decay Time = CC 10
• Reverb Damping = CC 11
• Reverb Diffusion = CC 12
• Reverb Level = CC 13
• Reverb Bypass = CC 14
• Surround Panner 1 X-axis = CC 15
• Surround Panner 1 Y-axis = CC 16
• Surround Panner 2 X-axis = CC 17
• Surround Panner 2 Y-axis = CC 18
• Surround Panner 3 X-axis = CC 19 
• Surround Panner 3 Y-axis = CC 20 
• Surround Panner 4 X-axis = CC 21 
• Surround Panner 4 Y-axis = CC 22 
• Aux 1 Fader/Output Level = CC 23 
• Aux 1 Mute = CC 24
• Aux 2 Fader/Output Level = CC 25 
• Aux 2 Mute = CC 26
• Aux 3 Fader/Output Level = CC 27 
• Aux 3 Mute = CC 28
*/

var misc_params = {
  "reverb-send-1": 1,
  "reverb-send-2": 2,
  "reverb-send-3": 3,
  "reverb-send-4": 4,
  "reverb-send-5": 5,
  "reverb-send-6": 6,
  "reverb-send-7": 7,
  "reverb-send-8": 8,
  "reverb-predelay": 9,
  "reverb-decay-time": 10,
  "reverb-damping": 11,
  "reverb-diffusion": 12,
  "reverb-level": 13,
  "reverb-bypass": 14,
  "surround-panner-1-x": 15,
  "surround-panner-1-y": 16,
  "surround-panner-2-x": 17,
  "surround-panner-2-y": 18,
  "surround-panner-3-x": 19,
  "surround-panner-3-y": 20,
  "surround-panner-4-x": 21,
  "surround-panner-4-y": 22,
  "aux-1-out": 23,
  "aux-1-mute": 24,
  "aux-2-out": 25,
  "aux-2-mute": 26,
  "aux-3-out": 27,
  "aux-3-mute": 28
}; // CHANGING PRESETS WITH PROGRAM CHANGE MESSAGES sent to any channel on  K-Mix Audio Control port
// Program Change : 0xCx; [C0,1] set preset 1

exports.input_channel_params = input_channel_params;
exports.main_output_bus_params = main_output_bus_params;
exports.misc_params = misc_params;