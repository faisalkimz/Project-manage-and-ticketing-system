import os
import ssl
import subprocess
import sys
import datetime
from pathlib import Path
from django.core.management.base import BaseCommand
from django.core.management import execute_from_command_line

CERT_DIR = Path(__file__).resolve().parent.parent.parent.parent
CERT_FILE = CERT_DIR / 'cert.pem'
KEY_FILE = CERT_DIR / 'key.pem'


def generate_cert():
    cert_dir = CERT_DIR
    cert_file = CERT_DIR / 'cert.pem'
    key_file = CERT_DIR / 'key.pem'

    # Try openssl first
    try:
        subprocess.run([
            'openssl', 'req', '-x509', '-newkey', 'rsa:2048', '-keyout', str(key_file),
            '-out', str(cert_file), '-days', '365', '-nodes',
            '-subj', '/CN=localhost',
            '-addext', 'subjectAltName=DNS:localhost,IP:127.0.0.1',
        ], check=True, capture_output=True)
        print("Certificate generated with openssl.")
        return True
    except (FileNotFoundError, subprocess.CalledProcessError):
        pass

    # Try PowerShell (Windows)
    try:
        subprocess.run([
            'powershell', '-Command',
            f'New-SelfSignedCertificate -DnsName localhost -CertStoreLocation Cert:\\CurrentUser\\My | Export-Certificate -FilePath "{cert_file}" -Type CERT; '
            f'openssl pkcs12 -in "{cert_file}" -nocerts -nodes -out "{key_file}" -password pass:'
        ], check=True, capture_output=True)
        print("Certificate generated with PowerShell.")
        return True
    except (FileNotFoundError, subprocess.CalledProcessError):
        pass

    # Fallback: use Python to create a self-signed cert via cryptography
    try:
        from cryptography import x509
        from cryptography.x509.oid import NameOID
        from cryptography.hazmat.primitives import hashes, serialization
        from cryptography.hazmat.primitives.asymmetric import rsa

        key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        subject = issuer = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, 'localhost')])
        cert = (
            x509.CertificateBuilder()
            .subject_name(subject)
            .issuer_name(issuer)
            .public_key(key.public_key())
            .serial_number(x509.random_serial_number())
            .not_valid_before(datetime.datetime.utcnow())
            .not_valid_after(datetime.datetime.utcnow() + datetime.timedelta(days=365))
            .add_extension(x509.SubjectAlternativeName([x509.DNSName('localhost')]), critical=False)
            .sign(key, hashes.SHA256())
        )
        with open(cert_file, 'wb') as f:
            f.write(cert.public_bytes(serialization.Encoding.PEM))
        with open(key_file, 'wb') as f:
            f.write(key.private_bytes(
                serialization.Encoding.PEM,
                serialization.PrivateFormat.TraditionalOpenSSL,
                serialization.NoEncryption(),
            ))
        print("Certificate generated with Python cryptography.")
        return True
    except ImportError:
        print("ERROR: Could not generate certificate. Install openssl or run: pip install cryptography")
        return False


class Command(BaseCommand):
    help = 'Run the development server with HTTPS'

    def add_arguments(self, parser):
        parser.add_argument('addrport', nargs='?', default='8443', help='Port to listen on')
        parser.add_argument('--cert', default=str(CERT_FILE), help='Path to SSL certificate file')
        parser.add_argument('--key', default=str(KEY_FILE), help='Path to SSL key file')

    def handle(self, *args, **options):
        cert_file = Path(options['cert'])
        key_file = Path(options['key'])
        addrport = options['addrport']

        if ':' in addrport:
            host, port = addrport.split(':', 1)
        else:
            host, port = '0.0.0.0', addrport

        if not cert_file.exists() or not key_file.exists():
            self.stdout.write(self.style.WARNING('No SSL certificate found. Generating...'))
            if not generate_cert():
                self.stdout.write(self.style.ERROR(
                    'Could not generate certificate. Install cryptography:\n'
                    '  pip install cryptography\n'
                    'Or provide your own: python manage.py runhttps --cert path/to/cert.pem --key path/to/key.pem'
                ))
                return

        self.stdout.write(self.style.SUCCESS(f'Starting HTTPS server on https://{host}:{port}'))

        from django.core.wsgi import get_wsgi_application
        from wsgiref.simple_server import make_server

        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core_api.settings')
        app = get_wsgi_application()

        httpd = make_server(host, int(port), app)
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.load_cert_chain(str(cert_file), str(key_file))
        httpd.socket = context.wrap_socket(httpd.socket, server_side=True)

        self.stdout.write(f'Quit the server with CTRL-BREAK.')
        httpd.serve_forever()
