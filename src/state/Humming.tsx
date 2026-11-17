import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

const Context = createContext({
  start: (_reset: boolean) => {},
  stop: () => {},
  setLevel: (_level: number) => {},
});

/** Sound belongs to animation lifecycles, never to the reading pages. */
export function HummingProvider({ children }: { children: ReactNode }) {
  const audio = useRef<HTMLAudioElement>(null);
  const wanted = useRef(false);
  const level = useRef(1);
  const channel = useRef<BroadcastChannel | null>(null);
  const stop = useCallback(() => {
    wanted.current = false;
    const track = audio.current;
    if (track) {
      track.muted = true;
      track.pause();
    }
  }, []);
  const play = useCallback(() => {
    const track = audio.current;
    if (!wanted.current || !track) return;
    track.volume = 0.3 * level.current;
    track.muted = false;
    void track
      .play()
      .then(() => {
        if (!wanted.current) track.pause();
      })
      .catch(() => {
        // Autoplay may be blocked. The next interaction retries while animation is active.
      });
  }, []);
  const start = useCallback(
    (reset: boolean) => {
      wanted.current = true;
      if (reset && audio.current) audio.current.currentTime = 0;
      channel.current?.postMessage("playing");
      play();
    },
    [play],
  );
  const setLevel = useCallback((value: number) => {
    level.current = Math.max(0, Math.min(1, value));
    if (audio.current) audio.current.volume = 0.3 * level.current;
  }, []);
  useEffect(() => {
    const bus =
      typeof BroadcastChannel !== "undefined"
        ? new BroadcastChannel("ijabah-nasheed")
        : null;
    channel.current = bus;
    if (bus)
      bus.onmessage = (e) => {
        if (e.data === "playing" || e.data === "pause") stop();
      };
    const retry = () => {
      if (wanted.current && audio.current?.paused) play();
    };
    document.addEventListener("pointerdown", retry, true);
    document.addEventListener("keydown", retry, true);
    window.addEventListener("pagehide", stop);
    return () => {
      stop();
      bus?.close();
      channel.current = null;
      document.removeEventListener("pointerdown", retry, true);
      document.removeEventListener("keydown", retry, true);
      window.removeEventListener("pagehide", stop);
    };
  }, [play, stop]);
  return (
    <Context.Provider value={{ start, stop, setLevel }}>
      <audio
        ref={audio}
        src="/audio/nasheed-humming.mp3"
        loop
        preload="none"
        onPlaying={() => {
          if (!wanted.current) audio.current?.pause();
        }}
      />
      {children}
    </Context.Provider>
  );
}

export function useAnimationNasheed(active: boolean, replay = 0, level = 1) {
  const { start, stop, setLevel } = useContext(Context);
  const previousReplay = useRef<number | null>(null);
  useEffect(() => {
    setLevel(level);
  }, [level, setLevel]);
  useEffect(() => {
    if (active) {
      start(previousReplay.current !== replay);
      previousReplay.current = replay;
    } else stop();
    return stop;
  }, [active, replay, start, stop]);
}
