from flask import Flask, request
from config import Config
from routes import bpv1
from main_routes import main
from flask_cors import CORS
import sqlite3

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # ---------- DB SETUP ----------
    def get_db():
        conn = sqlite3.connect("database.db")
        conn.row_factory = sqlite3.Row
        return conn

    # Create table + initial row
    with get_db() as db:
        db.execute("""
            CREATE TABLE IF NOT EXISTS game_state (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                x INTEGER NOT NULL,
                y INTEGER NOT NULL,
                color TEXT NOT NULL,
                timestamp TEXT NOT NULL
            );
        """)

        db.execute("""
            INSERT OR IGNORE INTO game_state (id, x, y, color, timestamp)
            VALUES (1, 0, 0, 'white', datetime('now'))
        """)

        db.commit()

    # ---------- ROUTES ----------

    @app.get("/state")
    def get_state():
        with get_db() as db:
            row = db.execute("SELECT * FROM game_state WHERE id = 1").fetchone()
            return dict(row)

    @app.post("/state")
    def update_state():
        data = request.json

        x = data["x"]
        y = data["y"]
        color = data["color"]

        with get_db() as db:
            db.execute("""
                UPDATE game_state
                SET x = ?, y = ?, color = ?, timestamp = datetime('now')
                WHERE id = 1
            """, (x, y, color))
            db.commit()

        return {"message": "State updated"}

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
