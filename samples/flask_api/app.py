from flask import Flask, jsonify
import stripe

app = Flask(__name__)

# Hardcoded Stripe Live Secret Key
stripe.api_key = "sk_live_51Mz1234567890123456789012345678"

# RSA Private Key stored inline
RSA_PRIVATE_KEY = """-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA3Tz2mr7SZiAMfQySWA+4/1w9S60I5379eY0U7C/w
-----END RSA PRIVATE KEY-----"""

@app.route('/checkout', methods=['POST'])
def checkout():
    return jsonify({"status": "payment processed"})

if __name__ == '__main__':
    app.run(port=5000)
