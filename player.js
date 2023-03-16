var WIDTH = 640;
var HEIGHT = 360;

// Interesting parameters to tweak!
var SMOOTHING = 0.8;
var FFT_SIZE = 2048;

var URLS = {
  1: 'audios/1.mp3',
  2: 'audios/2.mp3',
  3: 'audios/3.mp3',
  4: 'audios/4.mp3',
  5: 'audios/5.mp3',
  6: 'audios/6.mp3',
  7: 'audios/7.mp3',
  8: 'audios/8.mp3',
  9: 'audios/9.mp3',
  10: 'audios/10.mp3',
  11: 'audios/11.mp3',
  12: 'audios/12.mp3',
  13: 'audios/13.mp3',
  14: 'audios/14.mp3',
  15: 'audios/15.mp3',
  16: 'audios/16.mp3',
}

function VisualizerSample() {
  this.analyser = context.createAnalyser();

  this.analyser.connect(context.destination);
  this.analyser.minDecibels = -140;
  this.analyser.maxDecibels = 0;

  loadSounds(this, URLS, onLoaded);

  this.freqs = new Uint8Array(this.analyser.frequencyBinCount);
  this.times = new Uint8Array(this.analyser.frequencyBinCount);

  function onLoaded() {
    var button = document.querySelector('button');
    button.removeAttribute('disabled');
    button.innerHTML = 'Play/pause';
    document.querySelector('#loading').style.display = 'none';
  };

  this.isPlaying = false;
  this.startTime = 0;
  this.startOffset = 0;
  this.soundNo = 1
}


// Toggle playback
VisualizerSample.prototype.togglePlayback = function() {
  if (this.isPlaying) {
    // Stop playback
    this.source[this.source.stop ? 'stop': 'noteOff'](0);
    this.startOffset += context.currentTime - this.startTime;
    console.log('paused at', this.startOffset);
    // Save the position of the play head.
  } else {
    // console.log(this.buffer)
    this.playSound()
  }
  this.isPlaying = !this.isPlaying;
}

VisualizerSample.prototype.playSound = function(){
    this.startTime = context.currentTime;
    console.log('started at', this.startOffset);
    this.source = context.createBufferSource();
    // Connect graph
    this.source.connect(this.analyser);
    this.source.buffer = this[this.soundNo];
    this.source.loop = false;
    // Start playback, but make sure we stay in bound of the buffer.
    this.source[this.source.start ? 'start' : 'noteOn'](0, this.startOffset % this[this.soundNo].duration);
    // Start visualizer.
    requestAnimFrame(this.draw.bind(this));

    this.source.onended = () => {
        if(context.currentTime >= this[this.soundNo].duration) {
            this.soundNo++;

            if(this[this.soundNo])
                setTimeout(() => {
                    this.playSound();
                }, 4000);
        }
    }
}


VisualizerSample.prototype.draw = function() {
  this.analyser.smoothingTimeConstant = SMOOTHING;
  this.analyser.fftSize = FFT_SIZE;

  // Get the frequency data from the currently playing music
  this.analyser.getByteFrequencyData(this.freqs);
  this.analyser.getByteTimeDomainData(this.times);

  var width = Math.floor(1/this.freqs.length, 10);

  var canvas = document.querySelector('canvas');
  var drawContext = canvas.getContext('2d');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  // Draw the frequency domain chart.
  for (var i = 0; i < this.analyser.frequencyBinCount; i++) {
    var value = this.freqs[i];
    var percent = value / 256;
    var height = HEIGHT * percent;
    var offset = HEIGHT - height - 1;
    var barWidth = WIDTH/this.analyser.frequencyBinCount;
    var hue = i/this.analyser.frequencyBinCount * 360;
    drawContext.fillStyle = 'hsl(' + hue + ', 100%, 50%)';
    drawContext.fillRect(i * barWidth, offset, barWidth, height);
  }

  // Draw the time domain chart.
  for (var i = 0; i < this.analyser.frequencyBinCount; i++) {
    var value = this.times[i];
    var percent = value / 256;
    var height = HEIGHT * percent;
    var offset = HEIGHT - height - 1;
    var barWidth = WIDTH/this.analyser.frequencyBinCount;
    drawContext.fillStyle = 'white';
    drawContext.fillRect(i * barWidth, offset, 1, 2);
  }

  if (this.isPlaying) {
    requestAnimFrame(this.draw.bind(this));
  }
}

VisualizerSample.prototype.getFrequencyValue = function(freq) {
  var nyquist = context.sampleRate/2;
  var index = Math.round(freq/nyquist * this.freqs.length);
  return this.freqs[index];
}