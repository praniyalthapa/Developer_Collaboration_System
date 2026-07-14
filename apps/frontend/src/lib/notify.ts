// Incoming-message feedback: a short chime plus an unread counter in the tab
// title (e.g. "(2) New messages · DevCollab"), so a message is noticeable even
// when the DevCollab tab is in the background.

const BASE_TITLE = "DevCollab";
let unread = 0;

export const bumpUnreadTitle = (): void => {
  unread += 1;
  document.title = `(${unread}) New message${unread > 1 ? "s" : ""} · ${BASE_TITLE}`;
};

export const clearUnreadTitle = (): void => {
  if (unread === 0) return;
  unread = 0;
  document.title = BASE_TITLE;
};

// A light two-note "ding-dong" via the Web Audio API — no audio asset needed.
export const playMessageChime = (): void => {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new AudioCtx();
    const start = ctx.currentTime;
    const notes: Array<[number, number]> = [
      [880, start],
      [1174.66, start + 0.11],
    ];
    for (const [freq, at] of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.18, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.16);
      osc.connect(gain).connect(ctx.destination);
      osc.start(at);
      osc.stop(at + 0.18);
    }
    // Release the context once the sound has finished.
    window.setTimeout(() => void ctx.close(), 600);
  } catch {
    /* audio unavailable (e.g. no user gesture yet) — ignore */
  }
};
