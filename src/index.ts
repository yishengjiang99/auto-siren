import { mkdiv } from "mkdiv";
import { mkcanvas, chart } from "mk-60fps";
declare interface AutoSirenOptions {
  container?: HTMLElement;
  sirenBaseFreq?: number;
  sirenDuration?: number;
  detectSoundFFT?: Float32Array;
  sirenFlashColors?: [string, string, string, string];
  sirenLFOFrequency?: number;
  fftSize?: number;
  sirenCSS?: string;
}
const defaultOptions: AutoSirenOptions = {
  container: document.body,
  fftSize: 1 << 9,
  sirenBaseFreq: 440,
  sirenDuration: 2.0,
  detectSoundFFT: new Float32Array(1 << 9).fill(1),
  sirenFlashColors: ["red", "blue", "red", "blue"],
  sirenLFOFrequency: 5,
  sirenCSS:
    "margin-top:100px;z-index:-1;position:fixed;width:100vw;height:100vh;display:grid;grid-template-columns:1fr 1fr 1fr;justify-content:stretch",
};

async function autoSiren(params: AutoSirenOptions = defaultOptions) {
  const {
    container,
    fftSize,
    sirenBaseFreq,
    sirenFlashColors,
    sirenDuration,
    sirenCSS,
    detectSoundFFT,
  } = Object.assign(params, defaultOptions, {});

  function mkSiren(ctx: AudioContext) {
    const tone = new OscillatorNode(ctx, {
      type: "sine",
      frequency: sirenBaseFreq,
    });
    const lfo = new OscillatorNode(ctx, { frequency: 5, type: "triangle" });
    const lpf = new BiquadFilterNode(ctx, {
      type: "highpass",
      frequency: sirenBaseFreq,
    });
    const volume = new GainNode(ctx, { gain: 0 });
    lfo.connect(new GainNode(ctx, { gain: 119 })).connect(tone.frequency);
    tone.connect(lpf).connect(volume).connect(ctx.destination);
    tone.start();
    lfo.start();
    return {
      startSiren: () => volume.gain.linearRampToValueAtTime(0.1, 0.1),
      stopSiren: () => volume.gain.linearRampToValueAtTime(0, 1),
    };
  }

  container.style.background = "black";
  const sirenBar = mkdiv(
    "div",
    {
      style: sirenCSS,
    },
    [mkdiv("div"), mkdiv("div"), mkdiv("div"), mkdiv("div")]
  );
  container.append(sirenBar);
  const bars = sirenBar.querySelectorAll("div");
  let siren = 0.0;
  const canvasCtx: CanvasRenderingContext2D = mkcanvas({
    container: document.body,
    width: document.body.clientWidth,
  });

  const ctx = new AudioContext();
  const { startSiren, stopSiren } = mkSiren(ctx);
  const mic = ctx.createMediaStreamSource(
    await navigator.mediaDevices.getUserMedia({ audio: true })
  );
  const fft = new AnalyserNode(ctx, {
    fftSize: fftSize,
    smoothingTimeConstant: 0.01,
  });
  const fftBuffer = new Float32Array(fftSize);
  mic.connect(fft);
  const zeros = new Float32Array(2).fill(0);
  function checkLoop() {
    fft.getFloatFrequencyData(fftBuffer);
    const normalized = fftBuffer
      .slice(0, fftSize / 2)
      .map((v, idx) => ((v * detectSoundFFT[idx]) / fftSize) * 2);

    const indexVal = normalized.reduce((sum, v) => sum + v);
    chart(
      canvasCtx,
      normalized.map((v) => v - 0.05)
    );

    canvasCtx.strokeText("waaa index: " + indexVal, 10, 120, 130);
    canvasCtx.strokeText("siren: " + siren, 10, 200, 130);
    if (!siren && indexVal > -10) {
      siren = 60;
      //startSiren();
    }
    if (siren > 0) {
      siren -= 1.1;
      for (let index = 0; index < bars.length; index++) {
        const flashIndex: number = (siren * 31.0 + index) | 0;
        bars[index].style.backgroundColor = sirenFlashColors[flashIndex & 0x4];
      }
    }
    /* ghetto hysteresis */
    if (siren < 0) {
      siren = 0;
      for (const bar of bars) {
        bar.style.backgroundColor = "black";
      }
      chart(canvasCtx, zeros);
      //   stopSiren();
      setTimeout(checkLoop, 2000);
    } else {
      requestAnimationFrame(checkLoop);
    }
  }

  checkLoop();
}

async function recordDetectFFT(){
  const ctx=
}
const fftProfile = new Float32Array(1 << 9);
const [startBtn, recordBtn] = [
  mkdiv("button", { onclick: () => autoSiren() }, "start"),
  mkdiv("button", { onclick: () => autoSiren }, "recordBtn"),
];
addEventListener("click", () => autoSiren(), { once: true });
