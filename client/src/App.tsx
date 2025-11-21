import React from "react";
import "./style.css";
import Piece from "./components/Piece";
import Controls from "./components/Controls";
import Button from "./components/Button";

const SERVER_URL = "http://localhost:5000";

export default function App() {
  const init_pos = [100, 50];
  const [pos, setPos] = React.useState(init_pos);
  const [color, setColor] = React.useState("white");

  // Load state from server on mount
  React.useEffect(() => {
    const loadState = async () => {
      try {
        const response = await fetch(`${SERVER_URL}/state`);
        const data = await response.json();
        setPos([data.x, data.y]);
        setColor(data.color);
      } catch (error) {
        console.error("Failed to load state:", error);
      }
    };
    loadState();
  }, []);

  // Save state to server on each move
  const saveState = async (x: number, y: number, col: string) => {
    try {
      await fetch(`${SERVER_URL}/state`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ x, y, color: col }),
      });
    } catch (error) {
      console.error("Failed to save state:", error);
    }
  };

  function randPos() {
    return [Math.floor(Math.random() * 1000), Math.floor(Math.random() * 1000)];
  }

  const moveDelta = (dx: number, dy: number) => {
    let newX = pos[0] + dx;
    let newY = pos[1] + dy;
    if (newX < 0) return;
    if (newY < 0) newY = 0;
    setPos([newX, newY]);
    saveState(newX, newY, color);
  };

  const handleReset = () => {
    setPos(init_pos);
    saveState(init_pos[0], init_pos[1], color);
  };

  const handleRandom = () => {
    const newPos = randPos();
    setPos(newPos);
    saveState(newPos[0], newPos[1], color);
  };

  return (
    <div className="App">
      <Piece x={pos[0]} y={pos[1]} color={color} setColor={setColor} onColorChange={(newColor) => saveState(pos[0], pos[1], newColor)} />
      <Controls moveDelta={moveDelta} />
      <Button resetPos={handleReset} randomPos={handleRandom} />
    </div>
  );
}
