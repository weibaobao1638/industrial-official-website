#!/usr/bin/env python3
import json
from pathlib import Path
from _directus_api import request, wait_until_ready

ROOT = Path(__file__).resolve().parents[1]
BLUEPRINT = json.loads((ROOT / 'schema-blueprint.json').read_text())


TEXT_FIELDS = {'content', 'description', 'summary', 'background', 'solution', 'result', 'message', 'spec_requirements', 'social_links'}
JSON_FIELDS = {'gallery', 'spec_table', 'social_links'}
BOOL_FIELDS = {'is_featured', 'is_new', 'is_hot', 'indexable'}
INT_FIELDS = {'sort_order'}
DATETIME_FIELDS = {'published_at', 'valid_until', 'created_at'}


def infer_type(field):
    if field in INT_FIELDS:
        return 'integer'
    if field in BOOL_FIELDS:
        return 'boolean'
    if field in DATETIME_FIELDS:
        return 'dateTime'
    if field in JSON_FIELDS:
        return 'json'
    if any(token in field for token in ['content', 'description', 'summary', 'background', 'solution', 'result', 'message', 'notes']):
        return 'text'
    if field.startswith('features_') or field.startswith('applications_'):
        return 'text'
    return 'string'


def ensure_collection(collection):
    existing = request('GET', '/collections')
    names = {item['collection'] for item in existing.get('data', [])}
    if collection['name'] in names:
        print(f"Collection exists: {collection['name']}")
        return

    payload = {
        'collection': collection['name'],
        'meta': {
            'singleton': collection.get('singleton', False),
            'note': f"Bootstrapped for industrial-official-website ({collection['name']})",
        },
        'schema': {
            'name': collection['name'],
        },
    }
    request('POST', '/collections', payload)
    print(f"Created collection: {collection['name']}")


def ensure_fields(collection):
    existing = request('GET', f"/fields/{collection['name']}")
    names = {item['field'] for item in existing.get('data', [])}
    for field in collection.get('fields', []):
        if field == 'id' or field in names:
            continue
        payload = {
            'field': field,
            'type': infer_type(field),
            'meta': {
                'interface': 'input',
                'note': f"Bootstrapped field {field}",
            },
        }
        try:
            request('POST', f"/fields/{collection['name']}", payload)
            print(f"  + field {collection['name']}.{field}")
        except Exception as exc:
            print(f"  ! failed field {collection['name']}.{field}: {exc}")


def main():
    if not wait_until_ready():
        raise SystemExit('Directus not ready in time')

    for collection in BLUEPRINT['collections']:
        ensure_collection(collection)
        ensure_fields(collection)


if __name__ == '__main__':
    main()
