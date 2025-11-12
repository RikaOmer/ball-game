from flask import Flask
from config import Config
from routes import bpv1
from main_routes import main
from flask_cors import CORS

def create_app(config_class=Config):
    # Initialize Flask app
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Enable CORS
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
        port=Config.FLASK_PORT,
    )
 
