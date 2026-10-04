"""Check recorded reviews and image versions. NOT a visual or factual judge."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys

from bridge import digest

STAGES = {'source', 'design', 'pilot', 'slides', 'deck'}


def resolve(base: Path, value: object) -> Path:
    if not isinstance(value, str) or not value.strip():
        raise ValueError('Missing input path')
    path = Path(value)
    return (base / path).resolve() if not path.is_absolute() else path.resolve()


def entry_key(base: Path, entry: dict) -> tuple[str, str]:
    if not isinstance(entry, dict):
        raise ValueError('Each input must be an object')
    path = resolve(base, entry.get('path'))
    sha = entry.get('sha256')
    if not path.is_file() or not isinstance(sha, str) or digest(path) != sha:
        raise ValueError(f'Missing or changed input: {path}')
    return str(path), sha


def check(manifest_file: Path, log_file: Path) -> list[str]:
    manifest_file, log_file = manifest_file.resolve(), log_file.resolve()
    errors: list[str] = []
    try:
        manifest = json.loads(manifest_file.read_text(encoding='utf-8'))
        log = json.loads(log_file.read_text(encoding='utf-8'))
        if not isinstance(manifest, dict) or not isinstance(log, dict):
            raise ValueError('Manifest and review log must be objects')
        pages = manifest.get('pages')
        if not isinstance(pages, list) or not pages:
            raise ValueError('Manifest needs a non-empty pages list')
        entry_key(manifest_file.parent, manifest['input'])
        required = [entry_key(manifest_file.parent, p) for p in pages]
        if len(set(required)) != len(required):
            raise ValueError('Duplicate pages in manifest')
        overview = entry_key(manifest_file.parent, manifest['overview'])
        reviews = log.get('reviews')
        if not isinstance(reviews, list) or not reviews:
            raise ValueError('Review log needs a non-empty reviews list')
    except (OSError, ValueError, KeyError, TypeError) as exc:
        return [str(exc)]

    latest_stage: dict[str, str] = {}
    latest_image: dict[tuple[str, tuple[str, str]], str] = {}
    for i, review in enumerate(reviews, 1):
        try:
            if not isinstance(review, dict) or review.get('stage') not in STAGES:
                raise ValueError('Unknown or missing stage')
            for field in ('reviewer', 'call_ref', 'observation'):
                value = review.get(field)
                if not isinstance(value, str) or not value.strip():
                    raise ValueError(f'Missing {field}')
            decision = review.get('decision')
            if decision not in ('pass', 'revise', 'blocked'):
                raise ValueError('Invalid decision')
            issues = review.get('issues')
            if not isinstance(issues, list) or any(not isinstance(x, str) for x in issues):
                raise ValueError('issues must be a list of strings')
            if decision == 'pass' and issues:
                raise ValueError('Cannot pass with unresolved issues')
            inputs = review.get('inputs')
            if not isinstance(inputs, list) or not inputs:
                raise ValueError('Review needs actual input files')
            keys = [entry_key(log_file.parent, item) for item in inputs]
            stage = review['stage']
            latest_stage[stage] = decision
            for key in keys:
                latest_image[(stage, key)] = decision
        except (OSError, ValueError, KeyError, TypeError) as exc:
            errors.append(f'Review {i}: {exc}')
    for stage in sorted(STAGES):
        if latest_stage.get(stage) != 'pass':
            errors.append(f'Stage missing or not passed: {stage}')
    for key in required:
        if latest_image.get(('slides', key)) != 'pass':
            errors.append(f'Current page not reviewed/passed: {key[0]}')
    if latest_image.get(('deck', overview)) != 'pass':
        errors.append('Final overview not reviewed/passed')
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('manifest', type=Path)
    parser.add_argument('log', type=Path)
    args = parser.parse_args()
    errors = check(args.manifest, args.log)
    print(json.dumps({'record_consistency': 'fail' if errors else 'pass',
                      'errors': errors,
                      'notice': 'Checks records only; cannot authenticate model calls or judge visual/factual quality.'},
                     ensure_ascii=False, indent=2))
    return 1 if errors else 0


if __name__ == '__main__':
    sys.exit(main())
