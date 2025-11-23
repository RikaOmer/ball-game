import React from "react";

interface ButtonProps {
  resetPos: () => void;
  randomPos: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  signOut?: () => Promise<void> | void;
}

export default function Button(props: ButtonProps) {
  const { resetPos, randomPos, undo, redo, canUndo, canRedo, signOut } = props;
  return (
    <div id="button-wrapper">
      <button
        id="btn-reset"
        className="btn-action"
        onClick={resetPos}
      >
        Reset
      </button>
      {signOut && (
        <button
          id="btn-signout"
          className="btn-action"
          onClick={signOut}
        >
          Sign out
        </button>
      )}
      <button
        id="btn-random"
        className="btn-action"
        onClick={randomPos}
      >
        Random
      </button>
      <button
        id="btn-undo"
        className="btn-action"
        onClick={undo}
        disabled={!canUndo}
        style={{ opacity: canUndo ? 1 : 0.5, cursor: canUndo ? "pointer" : "not-allowed" }}
      >
        ↶ Undo
      </button>
      <button
        id="btn-redo"
        className="btn-action"
        onClick={redo}
        disabled={!canRedo}
        style={{ opacity: canRedo ? 1 : 0.5, cursor: canRedo ? "pointer" : "not-allowed" }}
      >
        ↷ Redo
      </button>
    </div>
  );
}