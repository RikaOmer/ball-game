import React from "react";
import "./style.css";
import Piece from "./components/Piece";
import Controls from "./components/Controls";
import Button from "./components/Button";

const SERVER_URL = "http://localhost:8080";
const MAX_HISTORY = 10;

interface GameState {
  x: number;
  y: number;
  color: string;
}

export default function App() {
  const init_pos = [100, 50];
  const [pos, setPos] = React.useState(init_pos);
  const [color, setColor] = React.useState("white");
  const [history, setHistory] = React.useState<GameState[]>([{ x: 100, y: 50, color: "white" }]);
  const [historyIndex, setHistoryIndex] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [signedIn, setSignedIn] = React.useState(false);
  const [username, setUsername] = React.useState("");
  const [runtimeError, setRuntimeError] = React.useState<string | null>(null);
  const nameRef = React.useRef<HTMLInputElement | null>(null);

  // Load state from server on mount (checks session cookie)
  React.useEffect(() => {
    const loadState = async () => {
      console.log('loadState: attempting to fetch server state...');
      try {
        const stateResponse = await fetch(`${SERVER_URL}/state`, { credentials: 'include' });
        console.log('loadState: /state response', stateResponse.status);
        if (stateResponse.status === 401) {
          setSignedIn(false);
          return;
        }
        if (!stateResponse.ok) {
          console.warn('loadState: /state not ok', stateResponse.status);
          setSignedIn(false);
          return;
        }
        const stateData = await stateResponse.json();
        console.log('loadState: state data', stateData);
        setPos([stateData.x, stateData.y]);
        setColor(stateData.color);
        setSignedIn(true);
        setUsername(stateData.username || "");

        // Get full history for this user
        const historyResponse = await fetch(`${SERVER_URL}/history`, { credentials: 'include' });
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          if (historyData.history && historyData.history.length > 0) {
            const loadedHistory = historyData.history.map((h: any) => ({ x: h.x, y: h.y, color: h.color }));
            setHistory(loadedHistory.slice(-MAX_HISTORY));
            setHistoryIndex(Math.max(0, loadedHistory.slice(-MAX_HISTORY).length - 1));
          }
        } else {
          console.warn('loadState: /history not ok', historyResponse.status);
        }
      } catch (error) {
        console.error("Failed to load state:", error);
      }
    };
    loadState();
  }, []);

  // Capture runtime errors to surface them in the UI (helps debugging blank screen)
  React.useEffect(() => {
    const onError = (event: any) => {
      try {
        const msg = event && (event.message || event.reason && event.reason.message) ? (event.message || (event.reason && event.reason.message)) : String(event);
        console.error('Runtime error captured:', event);
        setRuntimeError(msg);
      } catch (e) {
        setRuntimeError('Unknown runtime error');
      }
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onError);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onError);
    };
  }, []);

  // Sign in with username (no password for exercise)
  const signIn = async (name: string) => {
    if (!name) return;
    try {
      const res = await fetch(`${SERVER_URL}/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: name })
      });
      if (res.ok) {
        setSignedIn(true);
        setUsername(name);
        // reload state
        setLoading(true);
        const stateRes = await fetch(`${SERVER_URL}/state`, { credentials: 'include' });
        const stateData = await stateRes.json();
        setPos([stateData.x, stateData.y]);
        setColor(stateData.color);
        const historyRes = await fetch(`${SERVER_URL}/history`, { credentials: 'include' });
        const historyData = await historyRes.json();
        const loadedHistory = historyData.history || [];
        setHistory(loadedHistory.slice(-MAX_HISTORY));
        setHistoryIndex(Math.max(0, loadedHistory.slice(-MAX_HISTORY).length - 1));
        setLoading(false);
      } else {
        const err = await res.json().catch(() => ({}));
        alert('Sign-in failed: ' + (err.error || res.status));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const signOut = async () => {
    await fetch(`${SERVER_URL}/signout`, { method: 'POST', credentials: 'include' });
    setSignedIn(false);
    setUsername("");
    setHistory([{ x: 100, y: 50, color: 'white' }]);
    setHistoryIndex(0);
  };

  // Save state to server on each move
  const saveState = async (x: number, y: number, col: string) => {
    try {
      await fetch(`${SERVER_URL}/state`, {
        method: "POST",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ x, y, color: col }),
      });
    } catch (error) {
      console.error("Failed to save state:", error);
    }
  };

  // Add state to history (local view)
  const addToHistory = (x: number, y: number, col: string) => {
    const newState: GameState = { x, y, color: col };
    let newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    if (newHistory.length > MAX_HISTORY) {
      newHistory = newHistory.slice(-MAX_HISTORY);
    }
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  function randPos() {
    return [Math.floor(Math.random() * 1000), Math.floor(Math.random() * 1000)];
  }

  const moveDelta = (dx: number, dy: number) => {
    if (!signedIn) { alert('Please sign in first'); return; }
    let newX = pos[0] + dx;
    let newY = pos[1] + dy;
    if (newX < 0) return;
    if (newY < 0) newY = 0;
    setPos([newX, newY]);
    addToHistory(newX, newY, color);
    saveState(newX, newY, color);
  };

  const handleReset = () => {
    if (!signedIn) { alert('Please sign in first'); return; }
    setPos(init_pos);
    addToHistory(init_pos[0], init_pos[1], color);
    saveState(init_pos[0], init_pos[1], color);
  };

  const handleRandom = () => {
    if (!signedIn) { alert('Please sign in first'); return; }
    const newPos = randPos();
    setPos(newPos);
    addToHistory(newPos[0], newPos[1], color);
    saveState(newPos[0], newPos[1], color);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const state = history[newIndex];
      setPos([state.x, state.y]);
      setColor(state.color);
      setHistoryIndex(newIndex);
      saveState(state.x, state.y, state.color);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const state = history[newIndex];
      setPos([state.x, state.y]);
      setColor(state.color);
      setHistoryIndex(newIndex);
      saveState(state.x, state.y, state.color);
    }
  };

  if (loading) {
    return <div className="App">Loading...</div>;
  }

  if (!signedIn) {
    // Simple sign-in UI
    return (
      <div className="App">
        <div style={{ maxWidth: 360, margin: '40px auto', padding: 20, border: '1px solid #ccc', borderRadius: 8, background: '#f9f9f9' }}>
          <h3 style={{ marginTop: 0 }}>Sign in (username only)</h3>
          <input ref={nameRef} placeholder="username" style={{ width: '100%', padding: 8, marginBottom: 8 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-action" onClick={() => signIn(nameRef.current ? nameRef.current.value.trim() : "")}>Sign In</button>
            <button className="btn-action" onClick={() => { nameRef.current && (nameRef.current.value = ''); }}>Clear</button>
          </div>
          <p style={{ fontSize: 13, color: '#666', marginTop: 12 }}>Open a second browser session (incognito) to sign in as a different user.</p>
        </div>
      </div>
    );
  }

  if (runtimeError) {
    return (
      <div className="App" style={{ padding: 20 }}>
        <h3>App error</h3>
        <pre style={{ whiteSpace: 'pre-wrap', color: 'red' }}>{String(runtimeError)}</pre>
        <p>Open DevTools Console for more details.</p>
      </div>
    );
  }

  return (
    <div className="App">
      <div style={{ position: 'absolute', left: 12, top: 8 }}>
        <span style={{ marginRight: 8 }}>Signed in: {username}</span>
      </div>
      <Piece x={pos[0]} y={pos[1]} color={color} setColor={(c) => { setColor(c); addToHistory(pos[0], pos[1], c); saveState(pos[0], pos[1], c); }} onColorChange={(newColor) => { setColor(newColor); addToHistory(pos[0], pos[1], newColor); saveState(pos[0], pos[1], newColor); }} />
      <Controls moveDelta={moveDelta} />
      <Button resetPos={handleReset} randomPos={handleRandom} undo={handleUndo} redo={handleRedo} canUndo={historyIndex > 0} canRedo={historyIndex < history.length - 1} signOut={signOut} />
    </div>
  );
}
