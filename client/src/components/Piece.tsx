import React from "react";
import { useEffect } from "react";

interface PieceProps {
  x: number;
  y: number;
  color: string;
  setColor: (color: string) => void;
  onColorChange: (color: string) => void;
}

export default function Piece({ x, y, color, setColor, onColorChange }: PieceProps) {

  async function fetchWeather() {
    try {
      const response = await fetch(
        `http://api.weatherapi.com/v1/current.json?key=f601bcbc440a474ba3d120742251711&q=tel aviv&aqi=yes`
      );

      if (!response.ok) {
        throw new Error("Weather API error");
      }

      const data = await response.json();
      console.log("response", data.current.temp_c);
      const newColor = PieceColorChange(data.current.temp_c);
      setColor(newColor);
      onColorChange(newColor);

    } catch (error) {
      console.error("Fetch error:", error);
    }
  }
  function PieceColorChange (degree: number)
  {
    if (degree < 10)
      return "blue";
    if (degree >= 10 && degree < 20)
      return "green";
   if (degree >= 20 && degree <30)
      return "yellow";
   if (degree >=30)
      return "red";

   return "white";

  }

  useEffect(() => {
    fetchWeather();
  }, []);

  return (
    <div
      id="piece"
      className="circle"
      style={{
        left: x,
        top: y,
        ['--piece-color' as any]: color,
      } as React.CSSProperties}
    ></div>
  );
}
