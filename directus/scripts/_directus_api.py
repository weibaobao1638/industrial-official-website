#!/usr/bin/env python3
import json
import os
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = ROOT / '.env'


def load_env():
    env = {}
    if ENV_PATH.exists():
        for line in ENV_PATH.read_text().splitlines():
            if not line or line.startswith('#') or '=' not in line:
                continue
            key, value = line.split('=', 1)
            env[key.strip()] = value.strip()
    return env


ENV = load_env()
BASE_URL = os.environ.get('DIRECTUS_URL', 'http://localhost:8055').rstrip('/')
TOKEN = os.environ.get('DIRECTUS_ADMIN_TOKEN') or ENV.get('ADMIN_TOKEN', '')


def request(method, path, data=None):
    headers = {'Content-Type': 'application/json'}
    if TOKEN:
        headers['Authorization'] = f'Bearer {TOKEN}'
    body = None if data is None else json.dumps(data).encode('utf-8')
    req = urllib.request.Request(f'{BASE_URL}{path}', data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            text = resp.read().decode('utf-8')
            return json.loads(text) if text else None
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode('utf-8', errors='ignore')
        raise RuntimeError(f'{method} {path} failed: {exc.code} {detail}') from exc


def wait_until_ready(timeout=120):
    start = time.time()
    while time.time() - start < timeout:
        try:
            with urllib.request.urlopen(f'{BASE_URL}/server/health') as resp:
                if resp.status == 200:
                    return True
        except Exception:
            time.sleep(2)
    return False
