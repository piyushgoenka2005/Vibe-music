import * as Tone from "tone";
import { createLayer, type SoundLayerId } from "./midlife-sounds";

const BEAT_PATTERNS: boolean[][] = [
  [true, false, false, false, true, false, false, false],
  [true, false, true, false, true, false, true, false],
  [false, true, false, true, false, true, true, false],
  [true, true, false, true, false, true, false, true],
];

export class MidlifeAudioEngine {
  private static instance: MidlifeAudioEngine | null = null;

  private ready = false;
  private masterVolume!: Tone.Volume;
  private filter!: Tone.Filter;
  private reverb!: Tone.Reverb;
  private bus!: Tone.Gain;
  private layers = new Map<SoundLayerId, ReturnType<typeof createLayer>>();
  private kick!: Tone.MembraneSynth;
  private snare!: Tone.NoiseSynth;
  private hat!: Tone.MetalSynth;
  private beatSequence: Tone.Sequence | null = null;
  private barLength = 1;
  private recorder: MediaRecorder | null = null;
  private recordChunks: Blob[] = [];

  static getInstance() {
    if (!MidlifeAudioEngine.instance) {
      MidlifeAudioEngine.instance = new MidlifeAudioEngine();
    }
    return MidlifeAudioEngine.instance;
  }

  private initNodes() {
    if (this.ready) return;

    this.masterVolume = new Tone.Volume(-8);
    this.filter = new Tone.Filter(6000, "lowpass");
    this.reverb = new Tone.Reverb({ decay: 3.5, wet: 0.25 });
    this.bus = new Tone.Gain(0.85);

    this.bus.chain(this.reverb, this.filter, this.masterVolume, Tone.getDestination());

    this.kick = new Tone.MembraneSynth({ pitchDecay: 0.02, octaves: 4 }).connect(this.bus);
    this.snare = new Tone.NoiseSynth({ envelope: { attack: 0.001, decay: 0.12, sustain: 0 } }).connect(this.bus);
    this.hat = new Tone.MetalSynth({ envelope: { attack: 0.001, decay: 0.04, release: 0.01 } }).connect(this.bus);
    this.hat.volume.value = -18;
    this.snare.volume.value = -14;
    this.kick.volume.value = -10;
  }

  async ensureStarted() {
    if (typeof window === "undefined") return;
    this.initNodes();
    if (this.ready) return;
    await Tone.start();
    this.ready = true;
  }

  setMasterVolume(value: number) {
    if (!this.ready) return;
    this.masterVolume.volume.rampTo(Tone.gainToDb(value), 0.05);
  }

  setFilterCutoff(value: number) {
    if (!this.ready) return;
    const freq = 200 + value * 11800;
    this.filter.frequency.rampTo(freq, 0.05);
  }

  setReverbMix(value: number) {
    if (!this.ready) return;
    this.reverb.wet.rampTo(value * 0.65, 0.05);
  }

  setModulation(value: number) {
    if (!this.ready) return;
    this.bus.gain.rampTo(0.5 + value * 0.8, 0.05);
  }

  toggleSound(id: SoundLayerId, active: boolean) {
    if (!this.ready) return;
    if (active) {
      if (!this.layers.has(id)) {
        this.layers.set(id, createLayer(id, this.bus));
      }
      this.layers.get(id)?.start();
      return;
    }
    this.layers.get(id)?.stop();
  }

  setBeatPattern(index: number) {
    if (!this.ready) return;
    this.clearBeat();
    const pattern = BEAT_PATTERNS[Math.max(0, Math.min(3, index))];
    this.beatSequence = new Tone.Sequence(
      (time, step) => {
        const idx = step as number;
        if (!pattern[idx]) return;
        this.kick.triggerAttackRelease("C1", "8n", time);
        if (idx % 2 === 1) this.snare.triggerAttackRelease("8n", time);
        this.hat.triggerAttackRelease("32n", time, 0.12);
      },
      [0, 1, 2, 3, 4, 5, 6, 7],
      "16n"
    );
    this.beatSequence.start(0);
    Tone.Transport.loop = true;
    Tone.Transport.loopEnd = `${this.barLength}m`;
    if (Tone.Transport.state !== "started") {
      Tone.Transport.start();
    }
  }

  clearBeat() {
    this.beatSequence?.stop();
    this.beatSequence?.dispose();
    this.beatSequence = null;
  }

  stopTransport() {
    this.clearBeat();
    Tone.Transport.stop();
    Tone.Transport.cancel();
  }

  setBarLength(bars: 1 | 4) {
    this.barLength = bars;
    if (!this.ready) return;
    Tone.Transport.loop = true;
    Tone.Transport.loopEnd = `${bars}m`;
  }

  isTransportRunning() {
    return this.ready && Tone.Transport.state === "started";
  }

  async startRecording(onComplete: (url: string) => void) {
    await this.ensureStarted();
    const dest = Tone.getContext().createMediaStreamDestination();
    this.masterVolume.connect(dest);

    this.recordChunks = [];
    this.recorder = new MediaRecorder(dest.stream);
    this.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.recordChunks.push(e.data);
    };
    this.recorder.onstop = () => {
      const blob = new Blob(this.recordChunks, { type: "audio/webm" });
      onComplete(URL.createObjectURL(blob));
      this.masterVolume.disconnect(dest);
    };
    this.recorder.start();
  }

  stopRecording() {
    this.recorder?.stop();
    this.recorder = null;
  }

  dispose() {
    if (!this.ready) return;
    this.stopTransport();
    this.layers.forEach((layer) => layer.dispose());
    this.layers.clear();
    this.kick.dispose();
    this.snare.dispose();
    this.hat.dispose();
    this.reverb.dispose();
    this.filter.dispose();
    this.masterVolume.dispose();
    this.bus.dispose();
    this.ready = false;
    MidlifeAudioEngine.instance = null;
  }
}
