# ==========================================
# Sample Test Script for Credential Scanner
# ==========================================
# This file contains various code logic and mock configuration variables
# with multiple test API keys and secret patterns.

import os
import sys
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AppLogger")

class DatabaseConnector:
    def __init__(self):
        # Database connection strings with credentials
        self.db_uri = "postgresql://admin:SecretPass123!@db.production.internal.net:5432/finance_db"
        self.read_replica = "mysql://user_rw:P@ssw0rd2022!@10.0.0.45:3306/analytics"

    def connect(self):
        logger.info("Connecting to database using URI...")
        return True

class AWSStorageManager:
    def __init__(self):
        # Hardcoded AWS Credentials
        self.aws_access_key = "AKIAIOSFODNN7EXAMPLE"
        self.aws_secret_key = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
        self.region = "us-east-1"

    def upload_file(self, filename, bucket):
        logger.info(f"Uploading {filename} to S3 bucket {bucket}...")
        return True

class PaymentGateway:
    def __init__(self):
        # Hardcoded Stripe Live Secret Key
        self.stripe_key = "sk_live_51M0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

    def process_payment(self, amount, currency="USD"):
        logger.info(f"Processing {amount} {currency} payment...")
        return {"status": "success", "tx_id": "tx_9988776655"}

class NotificationService:
    def __init__(self):
        # Slack bot token & webhook URL
        self.slack_bot_token = "xoxb-123456789012-345678901234-abcdefghijklmnopqrstuvwx"
        self.slack_webhook_url = "https://hooks.slack.com/services/T12345678/B12345678/123456789012345678901234"

    def send_alert(self, message):
        logger.info(f"Sending Slack alert: {message}")
        return True

class AIServiceIntegration:
    def __init__(self):
        # Hardcoded OpenAI API Key
        self.openai_api_key = "sk-proj-492049204920492049204920492049204920"

    def generate_completion(self, prompt):
        logger.info("Calling OpenAI API...")
        return "Generated response"

class GitHubSyncTool:
    def __init__(self):
        # GitHub Personal Access Token
        self.github_pat = "ghp_1234567890abcdefghijklmnopqrstuvwx"

    def sync_repo(self, repo_url):
        logger.info(f"Syncing repository {repo_url}...")
        return True

# Authentication Tokens & JWTs
AUTH_JWT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
SESSION_SECRET_KEY = "super_secret_session_pass_key_123"

# RSA Private Key Header Sample
RSA_PRIVATE_KEY_HEADER = """-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA0Z1234567890abcdefghijklmnopqrstuvwxyz1234567890
abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqrstuvwxyz12
-----END RSA PRIVATE KEY-----"""

def calculate_metrics(data_list):
    """
    Utility function for metrics calculation
    """
    if not data_list:
        return 0
    total = sum(data_list)
    average = total / len(data_list)
    return {
        "total": total,
        "average": average,
        "count": len(data_list)
    }

def main():
    print("Initializing Application Services...")
    db = DatabaseConnector()
    db.connect()

    aws = AWSStorageManager()
    aws.upload_file("report.pdf", "finance-reports")

    payment = PaymentGateway()
    payment.process_payment(150.00)

    notifier = NotificationService()
    notifier.send_alert("System batch job completed successfully.")

    ai = AIServiceIntegration()
    result = ai.generate_completion("Summarize log files")
    print("AI Result:", result)

    github = GitHubSyncTool()
    github.sync_repo("https://github.com/myorg/myrepo")

    metrics = calculate_metrics([10, 20, 30, 40, 50])
    print("Metrics:", metrics)

if __name__ == "__main__":
    main()
