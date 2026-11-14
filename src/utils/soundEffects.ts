// src/utils/soundEffects.ts
import { create } from 'zustand';

export const MUTE_STORAGE_KEY = 'heavy13_muted';

function getInitialMuted(): boolean {
  if (typeof window !== 'undefined') {
    try {
      return window.localStorage.getItem(MUTE_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }
  return false;
}

interface SoundStoreState {
  isMuted: boolean;
  setMuted: (muted: boolean) => void;
  toggleMute: () => void;
}

export const useSoundStore = create<SoundStoreState>((set, get) => ({
  isMuted: getInitialMuted(),
  setMuted: (muted: boolean) => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(MUTE_STORAGE_KEY, String(muted));
      } catch {
        // localStorage 접근 불가 시 무시
      }
    }
    set({ isMuted: muted });
  },
  toggleMute: () => {
    const next = !get().isMuted;
    get().setMuted(next);
  },
}));

/**
 * Web Audio API 싱글톤 컨텍스트 매니저
 * - iOS Safari 및 모바일 Chrome의 Autoplay Policy 대응을 위해
 *   첫 사용자 터치/클릭/키 입력 시 자동으로 `audioCtx.resume()`을 호출한다.
 */
class ProceduralSoundEngine {
  private ctx: AudioContext | null = null;
  private unlockListenersBound = false;

  constructor() {
    this.bindGlobalUnlockListeners();
  }

  private bindGlobalUnlockListeners(): void {
    if (typeof window === 'undefined' || this.unlockListenersBound) return;
    this.unlockListenersBound = true;

    const unlock = () => {
      try {
        const ctx = this.getContext();
        if (ctx && ctx.state === 'suspended') {
          void ctx.resume().catch(() => {});
        }
      } catch {
        // 무시
      }
    };

    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    }

    try {
      const AudioCtxConstructor =
        window.AudioContext ||
        (
          window as unknown as {
            webkitAudioContext?: typeof AudioContext;
          }
        ).webkitAudioContext;

      if (!AudioCtxConstructor) return null;
      this.ctx = new AudioCtxConstructor();
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  private createNoiseBuffer(ctx: AudioContext, durationSec: number): AudioBuffer {
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * durationSec));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  private canPlay(): AudioContext | null {
    if (useSoundStore.getState().isMuted) return null;
    return this.getContext();
  }

  /**
   * 1. 돌 안착음 (`playStonePlace(stoneValue: number)`)
   * - 돌이 짐꾼 받침대 위에 묵직하게 놓이는 타격감 있는 소리
   * - 낮은 주파수 트라이앵글/사인파 피치 드롭 + 짧은 로우패스 노이즈 틱
   * - 돌의 숫자(0~6)가 클수록 더 묵직하고 낮은 톤으로 피치 및 잔향을 미세 조절
   */
  public playStonePlace(stoneValue: number): void {
    try {
      const ctx = this.canPlay();
      if (!ctx) return;

      const clamped = Math.max(0, Math.min(6, stoneValue));
      const now = ctx.currentTime;

      // 숫자가 클수록(0 -> 6) 시작 주파수가 낮고 묵직해짐 (165Hz ~ 105Hz -> 58Hz ~ 36Hz)
      const startFreq = 165 - clamped * 10;
      const endFreq = 58 - clamped * 3.5;
      const duration = 0.16 + clamped * 0.015;

      // 저음 바디 임팩트 (Triangle + Sine)
      const bodyOsc = ctx.createOscillator();
      const bodyGain = ctx.createGain();
      bodyOsc.type = 'triangle';
      bodyOsc.frequency.setValueAtTime(startFreq, now);
      bodyOsc.frequency.exponentialRampToValueAtTime(
        Math.max(25, endFreq),
        now + duration
      );

      bodyGain.gain.setValueAtTime(0.001, now);
      bodyGain.gain.linearRampToValueAtTime(0.38, now + 0.012);
      bodyGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      bodyOsc.connect(bodyGain);
      bodyGain.connect(ctx.destination);
      bodyOsc.start(now);
      bodyOsc.stop(now + duration + 0.02);

      // 석재 표면 마찰 노이즈 틱 (White Noise + Bandpass Filter)
      const noiseDuration = 0.055;
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = this.createNoiseBuffer(ctx, noiseDuration);

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(950 - clamped * 70, now);
      filter.Q.setValueAtTime(1.8, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.24, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + noiseDuration);

      noiseSource.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noiseSource.start(now);
      noiseSource.stop(now + noiseDuration);
    } catch {
      // 오디오 예외 시 무시
    }
  }

  /**
   * 2. 카드/칩 클릭음 (`playChipSelect()`)
   * - UI에서 바위 카드나 색깔 칩을 선택할 때 나는 가볍고 경쾌한 짧은 틱(Click) 소리
   */
  public playChipSelect(): void {
    try {
      const ctx = this.canPlay();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.035);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.16, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.045);
    } catch {
      // 무시
    }
  }

  /**
   * 3. 패스 효과음 (`playPass()`)
   * - 턴을 패스할 때 나는 부드러운 하강 2음계 소리
   */
  public playPass(): void {
    try {
      const ctx = this.canPlay();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [523.25, 392.0]; // C5 -> G4 하강 2음계

      notes.forEach((freq, idx) => {
        const start = now + idx * 0.095;
        const stop = start + 0.13;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(0.2, start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, stop);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(stop + 0.01);
      });
    } catch {
      // 무시
    }
  }

  /**
   * 4. 13 폭발 벌점음 (`playOverload()`)
   * - 받침대 합계가 13 이상이 되어 폭발할 때 나는 긴장감 있는 저음 럼블 + 경고 부저(Sawtooth/Square 디튠)
   */
  public playOverload(): void {
    try {
      const ctx = this.canPlay();
      if (!ctx) return;

      const now = ctx.currentTime;
      const duration = 0.58;

      // 디튠된 듀얼 경고 부저 (Sawtooth + Square)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const buzzerGain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'square';

      osc1.frequency.setValueAtTime(145, now);
      osc1.frequency.exponentialRampToValueAtTime(62, now + duration);

      osc2.frequency.setValueAtTime(152, now); // 불협화음 디튠
      osc2.frequency.exponentialRampToValueAtTime(58, now + duration);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(720, now);
      filter.frequency.exponentialRampToValueAtTime(180, now + duration);

      buzzerGain.gain.setValueAtTime(0.001, now);
      buzzerGain.gain.linearRampToValueAtTime(0.28, now + 0.02);
      buzzerGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(buzzerGain);
      buzzerGain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + duration + 0.02);
      osc2.stop(now + duration + 0.02);

      // 석재 붕괴 저음 럼블 노이즈 (Lowpass White Noise)
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = this.createNoiseBuffer(ctx, duration);

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(340, now);
      noiseFilter.frequency.exponentialRampToValueAtTime(85, now + duration);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.32, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noiseSource.start(now);
      noiseSource.stop(now + duration);
    } catch {
      // 무시
    }
  }

  /**
   * 5. 내 턴 알림음 (`playTurnAlert()`)
   * - 다른 플레이어나 AI 봇의 턴이 끝나고 내 차례가 되었을 때 주의 환기를 위한 맑은 차임벨(Bell) 소리
   */
  public playTurnAlert(): void {
    try {
      const ctx = this.canPlay();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [587.33, 880.0]; // D5 -> A5 맑은 5도 상행 벨

      notes.forEach((freq, idx) => {
        const start = now + idx * 0.11;
        const stop = start + 0.34;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(0.22, start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, stop);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(stop + 0.02);
      });
    } catch {
      // 무시
    }
  }
}

const soundEngine = new ProceduralSoundEngine();

export function playStonePlace(stoneValue: number): void {
  soundEngine.playStonePlace(stoneValue);
}

export function playChipSelect(): void {
  soundEngine.playChipSelect();
}

export function playPass(): void {
  soundEngine.playPass();
}

export function playOverload(): void {
  soundEngine.playOverload();
}

export function playTurnAlert(): void {
  soundEngine.playTurnAlert();
}
