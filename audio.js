// Audio Manager for Block Blast
// All sounds generated procedurally using Web Audio API - no external files needed

class AudioManager {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.sfxGain = null;
        this.musicGain = null;

        this.sfxEnabled = false;
        this.musicEnabled = false;
        this.currentGenre = 'chiptune';

        this.musicEngine = null;
        this.isInitialized = false;

        // Load settings from localStorage
        this.loadSettings();
    }

    // Initialize audio context on first user interaction
    init() {
        if (this.isInitialized) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Master gain
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 0.7;
            this.masterGain.connect(this.audioContext.destination);

            // SFX gain
            this.sfxGain = this.audioContext.createGain();
            this.sfxGain.gain.value = this.sfxEnabled ? 0.5 : 0;
            this.sfxGain.connect(this.masterGain);

            // Music gain
            this.musicGain = this.audioContext.createGain();
            this.musicGain.gain.value = this.musicEnabled ? 0.3 : 0;
            this.musicGain.connect(this.masterGain);

            // Initialize music engine
            this.musicEngine = new MusicEngine(this.audioContext, this.musicGain);

            this.isInitialized = true;

            // Resume context if suspended
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            // Start music if enabled
            if (this.musicEnabled) {
                this.musicEngine.start(this.currentGenre);
            }
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
        }
    }

    loadSettings() {
        const settings = localStorage.getItem('blockBlastAudio');
        if (settings) {
            const parsed = JSON.parse(settings);
            this.sfxEnabled = parsed.sfxEnabled || false;
            this.musicEnabled = parsed.musicEnabled || false;
            this.currentGenre = parsed.genre || 'chiptune';
        }
    }

    saveSettings() {
        localStorage.setItem('blockBlastAudio', JSON.stringify({
            sfxEnabled: this.sfxEnabled,
            musicEnabled: this.musicEnabled,
            genre: this.currentGenre
        }));
    }

    toggleSFX() {
        this.init();
        this.sfxEnabled = !this.sfxEnabled;
        if (this.sfxGain) {
            this.sfxGain.gain.setTargetAtTime(
                this.sfxEnabled ? 0.5 : 0,
                this.audioContext.currentTime,
                0.1
            );
        }
        this.saveSettings();
        return this.sfxEnabled;
    }

    toggleMusic() {
        this.init();
        this.musicEnabled = !this.musicEnabled;

        if (this.musicEnabled) {
            this.musicGain.gain.setTargetAtTime(0.3, this.audioContext.currentTime, 0.3);
            this.musicEngine.start(this.currentGenre);
        } else {
            this.musicGain.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.3);
            setTimeout(() => this.musicEngine.stop(), 300);
        }

        this.saveSettings();
        return this.musicEnabled;
    }

    setGenre(genre) {
        this.currentGenre = genre;
        if (this.musicEnabled && this.musicEngine) {
            this.musicEngine.changeGenre(genre);
        }
        this.saveSettings();
    }

    playSound(type, param = null) {
        if (!this.sfxEnabled || !this.isInitialized) return;

        const now = this.audioContext.currentTime;

        switch(type) {
            case 'move':
                this.playMove(now);
                break;
            case 'rotate':
                this.playRotate(now);
                break;
            case 'hardDrop':
                this.playHardDrop(now);
                break;
            case 'lock':
                this.playLock(now);
                break;
            case 'lineClear':
                this.playLineClear(now, param || 1);
                break;
            case 'levelUp':
                this.playLevelUp(now);
                break;
            case 'gameOver':
                this.playGameOver(now);
                break;
            case 'gameStart':
                this.playGameStart(now);
                break;
        }
    }

    // Subtle tick for movement
    playMove(time) {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'sine';
        osc.frequency.value = 400;

        gain.gain.setValueAtTime(0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(time);
        osc.stop(time + 0.05);
    }

    // Snap sound for rotation
    playRotate(time) {
        const osc1 = this.audioContext.createOscillator();
        const osc2 = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc1.type = 'triangle';
        osc1.frequency.value = 300;
        osc2.type = 'sine';
        osc2.frequency.value = 600;

        gain.gain.setValueAtTime(0.4, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.06);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.sfxGain);

        osc1.start(time);
        osc2.start(time);
        osc1.stop(time + 0.06);
        osc2.stop(time + 0.06);
    }

    // Whoosh + impact for hard drop
    playHardDrop(time) {
        // Descending sweep
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(800, time);
        osc.frequency.exponentialRampToValueAtTime(200, time + 0.15);

        gain.gain.setValueAtTime(0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(time);
        osc.stop(time + 0.15);

        // Impact thud
        const osc2 = this.audioContext.createOscillator();
        const gain2 = this.audioContext.createGain();

        osc2.type = 'sine';
        osc2.frequency.value = 100;

        gain2.gain.setValueAtTime(0.5, time + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.01, time + 0.25);

        osc2.connect(gain2);
        gain2.connect(this.sfxGain);

        osc2.start(time + 0.12);
        osc2.stop(time + 0.25);
    }

    // Satisfying thunk for locking piece
    playLock(time) {
        const osc1 = this.audioContext.createOscillator();
        const osc2 = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc1.type = 'sawtooth';
        osc1.frequency.value = 150;
        osc2.type = 'triangle';
        osc2.frequency.value = 300;

        gain.gain.setValueAtTime(0.3, time);
        gain.gain.setValueAtTime(0.3, time + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.12);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.sfxGain);

        osc1.start(time);
        osc2.start(time);
        osc1.stop(time + 0.12);
        osc2.stop(time + 0.12);
    }

    // Escalating sounds for line clears
    playLineClear(time, lineCount) {
        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

        if (lineCount === 1) {
            // Simple ascending arpeggio
            notes.forEach((freq, i) => {
                this.playNote(freq, time + i * 0.08, 0.08, 'sine', 0.4);
            });
        } else if (lineCount === 2) {
            // Faster with octave
            notes.forEach((freq, i) => {
                this.playNote(freq, time + i * 0.05, 0.06, 'sine', 0.4);
                this.playNote(freq * 2, time + i * 0.05, 0.06, 'sine', 0.2);
            });
        } else if (lineCount === 3) {
            // Major chord progression
            this.playChord([523.25, 659.25, 783.99], time, 0.15, 'square', 0.3);
            this.playChord([587.33, 739.99, 880], time + 0.15, 0.15, 'square', 0.3);
        } else if (lineCount >= 4) {
            // Triumphant tetris fanfare
            this.playChord([523.25, 659.25, 783.99, 1046.5], time, 0.2, 'sawtooth', 0.25);
            this.playChord([587.33, 739.99, 880, 1174.66], time + 0.2, 0.2, 'sawtooth', 0.25);
            this.playChord([659.25, 783.99, 987.77, 1318.51], time + 0.4, 0.3, 'sawtooth', 0.3);
        }
    }

    // Level up fanfare
    playLevelUp(time) {
        const scale = [523.25, 587.33, 659.25, 783.99, 880]; // C5 to A5
        scale.forEach((freq, i) => {
            this.playNote(freq, time + i * 0.1, 0.15, 'triangle', 0.4);
        });
    }

    // Sad game over sound
    playGameOver(time) {
        // Minor chord descending
        const chord = [261.63, 311.13, 392]; // C4, Eb4, G4 (C minor)

        chord.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, time);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.5, time + 0.8);

            gain.gain.setValueAtTime(0.4, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.6 + i * 0.1);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(time);
            osc.stop(time + 0.8);
        });
    }

    // Uplifting game start
    playGameStart(time) {
        const notes = [261.63, 329.63, 392, 523.25]; // C4, E4, G4, C5
        notes.forEach((freq, i) => {
            this.playNote(freq, time + i * 0.06, 0.1, 'triangle', 0.35);
        });
    }

    // Helper: play a single note
    playNote(freq, time, duration, type = 'sine', volume = 0.3) {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = type;
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(volume, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + duration);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(time);
        osc.stop(time + duration);
    }

    // Helper: play a chord
    playChord(frequencies, time, duration, type = 'sine', volume = 0.3) {
        frequencies.forEach(freq => {
            this.playNote(freq, time, duration, type, volume / frequencies.length);
        });
    }

    stopMusic() {
        if (this.musicEngine) {
            this.musicEngine.stop();
        }
    }

    startMusic() {
        if (this.musicEnabled && this.musicEngine) {
            this.musicEngine.start(this.currentGenre);
        }
    }
}

// Music Engine - generates procedural looping music
class MusicEngine {
    constructor(audioContext, outputNode) {
        this.ctx = audioContext;
        this.output = outputNode;
        this.isPlaying = false;
        this.currentGenre = 'chiptune';
        this.schedulerInterval = null;
        this.nextNoteTime = 0;
        this.currentBeat = 0;
        this.tempo = 140;
        this.scheduleAheadTime = 0.1;
        this.lookahead = 25; // ms
    }

    start(genre) {
        if (this.isPlaying) this.stop();

        this.currentGenre = genre;
        this.isPlaying = true;
        this.currentBeat = 0;
        this.nextNoteTime = this.ctx.currentTime + 0.1;

        this.setTempoForGenre(genre);
        this.scheduler();
    }

    stop() {
        this.isPlaying = false;
        if (this.schedulerInterval) {
            clearInterval(this.schedulerInterval);
            this.schedulerInterval = null;
        }
    }

    changeGenre(genre) {
        this.currentGenre = genre;
        this.setTempoForGenre(genre);
    }

    setTempoForGenre(genre) {
        switch(genre) {
            case 'chiptune': this.tempo = 140; break;
            case 'ambient': this.tempo = 60; break;
            case 'techno': this.tempo = 128; break;
            case 'lofi': this.tempo = 85; break;
        }
    }

    scheduler() {
        this.schedulerInterval = setInterval(() => {
            if (!this.isPlaying) return;

            while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
                this.scheduleNote(this.currentBeat, this.nextNoteTime);
                this.nextBeat();
            }
        }, this.lookahead);
    }

    nextBeat() {
        const secondsPerBeat = 60.0 / this.tempo;
        this.nextNoteTime += secondsPerBeat / 4; // 16th notes
        this.currentBeat = (this.currentBeat + 1) % 64; // 4 bar loop
    }

    scheduleNote(beat, time) {
        switch(this.currentGenre) {
            case 'chiptune': this.playChiptune(beat, time); break;
            case 'ambient': this.playAmbient(beat, time); break;
            case 'techno': this.playTechno(beat, time); break;
            case 'lofi': this.playLofi(beat, time); break;
        }
    }

    // Chiptune: 8-bit style with square waves
    playChiptune(beat, time) {
        const bassNotes = [65.41, 65.41, 87.31, 87.31, 73.42, 73.42, 82.41, 82.41]; // C2, G2, D2, E2 pattern
        const melodyNotes = [523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 493.88]; // C5 scale pattern

        // Bass on beats 0, 4, 8, 12
        if (beat % 4 === 0) {
            const bassNote = bassNotes[Math.floor(beat / 8) % bassNotes.length];
            this.playSquare(bassNote, time, 0.15, 0.25);
        }

        // Melody pattern
        if (beat % 8 === 0 || beat % 8 === 3 || beat % 8 === 6) {
            const melodyNote = melodyNotes[(beat / 2) % melodyNotes.length];
            this.playTriangle(melodyNote, time, 0.1, 0.15);
        }

        // Arpeggio flourish
        if (beat % 16 === 0) {
            [523.25, 659.25, 783.99].forEach((note, i) => {
                this.playSquare(note, time + i * 0.05, 0.05, 0.1);
            });
        }
    }

    // Ambient: slow evolving pads
    playAmbient(beat, time) {
        const chords = [
            [261.63, 329.63, 392], // C major
            [293.66, 369.99, 440], // D major
            [329.63, 415.30, 493.88], // E major
            [349.23, 440, 523.25] // F major
        ];

        // Change chord every 16 beats
        if (beat % 16 === 0) {
            const chord = chords[Math.floor(beat / 16) % chords.length];
            chord.forEach(freq => {
                this.playPad(freq, time, 2.0, 0.08);
                this.playPad(freq * 1.002, time, 2.0, 0.06); // Slight detune
            });
        }
    }

    // Techno: driving bass and hi-hats
    playTechno(beat, time) {
        // Kick on 1, 5, 9, 13
        if (beat % 4 === 0) {
            this.playKick(time);
        }

        // Hi-hat on every beat
        if (beat % 2 === 0) {
            this.playHiHat(time, beat % 4 === 2 ? 0.08 : 0.04);
        }

        // Bass line
        const bassPattern = [55, 55, 55, 55, 73.42, 73.42, 82.41, 82.41];
        if (beat % 2 === 0) {
            const bassNote = bassPattern[Math.floor(beat / 2) % bassPattern.length];
            this.playSaw(bassNote, time, 0.1, 0.2);
        }
    }

    // Lo-fi: jazzy chords and mellow bass
    playLofi(beat, time) {
        // Jazz chord progression (ii-V-I-vi)
        const chords = [
            [293.66, 349.23, 440, 523.25], // Dm7
            [392, 493.88, 587.33, 698.46], // G7
            [261.63, 329.63, 392, 493.88], // Cmaj7
            [440, 523.25, 659.25, 783.99]  // Am7
        ];

        // Chord hits
        if (beat % 16 === 0 || beat % 16 === 6 || beat % 16 === 10) {
            const chord = chords[Math.floor(beat / 16) % chords.length];
            chord.forEach(freq => {
                this.playTriangle(freq, time, 0.4, 0.06);
            });
        }

        // Walking bass
        if (beat % 4 === 0) {
            const bassNotes = [65.41, 73.42, 82.41, 87.31];
            const bassNote = bassNotes[(beat / 4) % bassNotes.length];
            this.playTriangle(bassNote, time, 0.25, 0.15);
        }
    }

    // Sound generators
    playSquare(freq, time, duration, volume) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(volume, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
        osc.connect(gain);
        gain.connect(this.output);
        osc.start(time);
        osc.stop(time + duration);
    }

    playTriangle(freq, time, duration, volume) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(volume, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
        osc.connect(gain);
        gain.connect(this.output);
        osc.start(time);
        osc.stop(time + duration);
    }

    playSaw(freq, time, duration, volume) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        filter.Q.value = 5;

        gain.gain.setValueAtTime(volume, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.output);
        osc.start(time);
        osc.stop(time + duration);
    }

    playPad(freq, time, duration, volume) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;

        // Slow attack and release for pad sound
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(volume, time + 0.5);
        gain.gain.linearRampToValueAtTime(volume, time + duration - 0.5);
        gain.gain.linearRampToValueAtTime(0, time + duration);

        osc.connect(gain);
        gain.connect(this.output);
        osc.start(time);
        osc.stop(time + duration + 0.1);
    }

    playKick(time) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(50, time + 0.1);

        gain.gain.setValueAtTime(0.4, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

        osc.connect(gain);
        gain.connect(this.output);
        osc.start(time);
        osc.stop(time + 0.15);
    }

    playHiHat(time, volume = 0.05) {
        const bufferSize = this.ctx.sampleRate * 0.05;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        noise.buffer = buffer;
        filter.type = 'highpass';
        filter.frequency.value = 7000;

        gain.gain.setValueAtTime(volume, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.output);
        noise.start(time);
    }
}

// Global audio manager instance
const audioManager = new AudioManager();

// Initialize on first user interaction
document.addEventListener('click', () => audioManager.init(), { once: true });
document.addEventListener('keydown', () => audioManager.init(), { once: true });
