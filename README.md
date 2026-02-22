# auto-siren

A browser-based automatic siren detector and flasher built with TypeScript and the Web Audio API.

## How it works

The app listens to your microphone using `getUserMedia` and analyzes the incoming audio with a Fast Fourier Transform (FFT) via the Web Audio `AnalyserNode`. When the detected energy exceeds a threshold the siren activates: an oscillator with a triangle-wave LFO starts playing and coloured panels flash in the browser window.

## Usage

Open the deployed page in a browser (Chrome / Edge recommended), press any key, and grant microphone access when prompted. The app will start listening for loud sounds and trigger the siren effect automatically.

## Local development

```bash
npm install
npm run build      # produces dist/main.js via webpack
```

Open `dist/index.html` in a browser after building (the `public/index.html` source file is copied into `dist/` automatically by the CI workflow; for local development you can copy it manually: `cp public/index.html dist/`).

## Deployment

Pushes to the `main` branch automatically build the project and deploy the `dist/` directory to **GitHub Pages** via the included workflow (`.github/workflows/deploy.yml`).

## License

ISC
