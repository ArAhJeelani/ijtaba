import {createContext, useContext, useEffect, useRef, useState, type ReactNode} from 'react';
import {Volume2, VolumeX} from 'lucide-react';
const Context = createContext<{enabled: boolean; toggle: () => Promise<void>; error: string}>({enabled: false, toggle: async () => {}, error: ''});

export function HummingProvider({children}: {children: ReactNode}) {
  const audio = useRef<HTMLAudioElement>(null);
  const channel = useRef<BroadcastChannel | null>(null);
  const wanted = useRef(false), remote = useRef(false), request = useRef(0);
  const [enabled, setEnabled] = useState(false), [error, setError] = useState('');
  function stopLocal() {
    wanted.current = false;
    request.current++;
    if (audio.current) { audio.current.muted = true; audio.current.pause(); }
  }
  useEffect(() => {
    const track = audio.current;
    if (track) track.volume = 0.3;
    const bus = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('ijabah-nasheed') : null;
    channel.current = bus;
    if (bus) bus.onmessage = event => {
      if (event.data === 'playing') {
        remote.current = true; stopLocal(); setEnabled(true);
      } else if (event.data === 'pause') {
        remote.current = false; stopLocal(); setEnabled(false);
      } else if (event.data === 'status' && wanted.current) bus.postMessage('playing');
    };
    const leavingPage = () => {
      if (wanted.current) bus?.postMessage('pause');
      remote.current = false; stopLocal(); setEnabled(false);
    };
    window.addEventListener('pagehide', leavingPage);
    bus?.postMessage('status');
    return () => {
      if (wanted.current) bus?.postMessage('pause');
      stopLocal(); bus?.close(); channel.current = null;
      window.removeEventListener('pagehide', leavingPage);
    };
  }, []);
  async function toggle() {
    const track = audio.current;
    if (!track) return;
    if (enabled || wanted.current) {
      remote.current = false; stopLocal(); setEnabled(false);
      channel.current?.postMessage('pause'); return;
    }
    remote.current = false; wanted.current = true;
    const attempt = ++request.current;
    track.muted = false; setEnabled(true); setError('');
    channel.current?.postMessage('playing');
    try {
      await track.play();
      if (!wanted.current) track.pause();
    } catch {
      if (attempt !== request.current) return;
      wanted.current = false; setEnabled(false);
      channel.current?.postMessage('pause');
      setError('The nasheed could not play. Tap again to retry.');
    }
  }
  return <Context.Provider value={{enabled, toggle, error}}>
    <audio ref={audio} src="/audio/nasheed-humming.mp3" loop preload="none"
      onPlaying={() => {if (!wanted.current) audio.current?.pause(); else {setEnabled(true); setError('');}}}
      onPause={() => setEnabled(remote.current)}
      onError={() => {wanted.current=false; setEnabled(false); channel.current?.postMessage('pause'); setError('The nasheed could not load. Please refresh and retry.');}}/>
    {children}
  </Context.Provider>;
}
export function HummingControl() {
  const {enabled, toggle, error} = useContext(Context);
  return <div className="humming-control"><button onClick={() => void toggle()} aria-pressed={enabled} title="Play or pause background nasheed">
    {enabled ? <Volume2 size={16}/> : <VolumeX size={16}/>}<span>{enabled ? 'Pause nasheed' : 'Play nasheed'}</span>
  </button>{error && <p role="alert">{error}</p>}</div>;
}
