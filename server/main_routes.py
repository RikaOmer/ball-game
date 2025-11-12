from flask import Blueprint
from flask import jsonify

# Create a Blueprint for routes
main = Blueprint('main_routes', __name__)

@main.route('/')
def index():
    return jsonify(
        message='Two Steps Main',
        data={}
    ).model_dump(), 200
