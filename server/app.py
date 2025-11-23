from flask import Flask, request, jsonify, make_response
from config import Config
from routes import bpv1
from main_routes import main
from flask_cors import CORS
import sqlite3
import json
import os
import uuid
from typing import Dict, Any

DATA_FILE = os.path.join(os.path.dirname(__file__), "data.json")

def _load_data() -> Dict[str, Any]:
    if not os.path.exists(DATA_FILE):
        data = {"users": {}, "sessions": {}, "states": {}, "histories": {}}
        _save_data(data)
        return data
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def _save_data(data: Dict[str, Any]):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Ensure data file exists
    _load_data()

    # ---------- ROUTES ----------

    def _get_username_from_request():
        token = request.cookies.get("session_token")
        if not token:
            return None
        data = _load_data()
        return data.get("sessions", {}).get(token)

    @app.post("/signin")
    def signin():
        try:
            payload = request.get_json() or {}
            username = (payload.get("username") or "").strip()
            if not username:
                return jsonify({"error": "username required"}), 400

            data = _load_data()
            # create user if not exists
            if username not in data["users"]:
                data["users"][username] = {"created_at": "now"}
                # initialize state
                data["states"][username] = {"x": 100, "y": 50, "color": "white", "timestamp": "now"}
                data["histories"][username] = [data["states"][username]]

            # create session token
            token = uuid.uuid4().hex
            data["sessions"][token] = username
            _save_data(data)

            resp = make_response(jsonify({"message": "signed in", "username": username}), 200)
            resp.set_cookie("session_token", token, httponly=True, samesite="Lax")
            return resp
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.post("/signout")
    def signout():
        try:
            token = request.cookies.get("session_token")
            if token:
                data = _load_data()
                data.get("sessions", {}).pop(token, None)
                _save_data(data)
            resp = make_response(jsonify({"message": "signed out"}), 200)
            resp.set_cookie("session_token", "", expires=0)
            return resp
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.get("/state")
    def get_state():
        username = _get_username_from_request()
        if not username:
            return jsonify({"error": "unauthorized"}), 401
        data = _load_data()
        state = data.get("states", {}).get(username)
        if not state:
            return jsonify({"error": "no state for user"}), 404
        return jsonify({"username": username, **state}), 200

    @app.post("/state")
    def update_state():
        username = _get_username_from_request()
        if not username:
            return jsonify({"error": "unauthorized"}), 401
        try:
            data_payload = request.get_json() or {}
            if not all(k in data_payload for k in ("x", "y", "color")):
                return jsonify({"error": "Missing x, y, or color"}), 400
            x = data_payload["x"]
            y = data_payload["y"]
            color = data_payload["color"]

            data = _load_data()
            data.setdefault("states", {})[username] = {"x": x, "y": y, "color": color, "timestamp": "now"}
            data.setdefault("histories", {}).setdefault(username, []).append({"x": x, "y": y, "color": color, "timestamp": "now"})
            _save_data(data)
            return jsonify({"message": "state updated"}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.get("/history")
    def get_history():
        username = _get_username_from_request()
        if not username:
            return jsonify({"error": "unauthorized"}), 401
        data = _load_data()
        history = data.get("histories", {}).get(username, [])
        return jsonify({"history": history}), 200

    @app.post("/history/clear")
    def clear_history():
        username = _get_username_from_request()
        if not username:
            return jsonify({"error": "unauthorized"}), 401
        try:
            data = _load_data()
            data.setdefault("histories", {})[username] = []
            _save_data(data)
            return jsonify({"message": "History cleared"}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    # ---------- CORS ----------
    CORS(app,
        supports_credentials=True,
        origins='*',
        allow_headers=['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
        methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        expose_headers=['Content-Range', 'X-Content-Range']
    )

    app.register_blueprint(bpv1, url_prefix='/api')
    app.register_blueprint(main)

    return app


if __name__ == '__main__':
    app = create_app(Config)
    app.run(
        debug=Config.DEBUG,
        host=Config.SERVER_HOST,
        port=Config.FLASK_PORT
    )
