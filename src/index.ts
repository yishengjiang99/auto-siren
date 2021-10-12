import { mkdiv } from "mkdiv";
import { mkcanvas, chart } from "mk-60fps";
const fftSize = 1 << 5;
declare interface AutoSirenOptions {
  container?: HTMLElement;
  sirenBaseFreq?: number;
  sirenDuration?: number;
  detectSoundFFT?: Float32Array;
  sirenFlashColors?: [string, string, string, string];
  sirenLFOFrequency?: number;
  sirenCSS?: string;
}
const defaultOptions: AutoSirenOptions = {
  container: document.body,
  sirenBaseFreq: 440,
  sirenDuration: 2.0,
  detectSoundFFT: new Float32Array(fftSize).fill(1),
  sirenFlashColors: ["red", "blue", "red", "blue"],
  sirenLFOFrequency: 5,
  sirenCSS:
    "z-index:-1;position:fixed;width:100vw;height:100vh;display:grid;grid-template-columns:1fr 1fr 1fr;justify-content:stretch",
};

export async function autoSiren(params: AutoSirenOptions) {
  const {
    container,
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
    fftSize: 1024,
    smoothingTimeConstant: 0.01,
  });
  const fftBuffer = new Float32Array(fft.fftSize);
  mic.connect(fft);
  const zeros = new Float32Array(2).fill(0);
  function checkLoop() {
    fft.getFloatFrequencyData(fftBuffer);
    const normalized = fftBuffer.slice(10, 110).map((v) => v * 0.01);
    const indexVal = normalized.reduce((sum, v) => sum + v);
    chart(
      canvasCtx,
      normalized.map((v) => v - 0.05)
    );

    canvasCtx.strokeText("waaa index: " + indexVal, 10, 120, 130);
    canvasCtx.strokeText("siren: " + siren, 10, 200, 130);
    if (!siren && indexVal > -70) {
      siren = 60;
      startSiren();
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
      setTimeout(checkLoop, 2000);
      stopSiren();
    } else {
      requestAnimationFrame(checkLoop);
    }
  }

  checkLoop();
}
