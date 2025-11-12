from flask import Blueprint
from flask import jsonify

bpv1 = Blueprint('v1', __name__)

# health
@bpv1.route('/health', methods=['GET'])
def health():
    return jsonify(
        message='Health check',
        data={}
    ).model_dump(), 200
