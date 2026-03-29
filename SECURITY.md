# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Portpourri, please report it responsibly.

**Do not open a public GitHub issue for security vulnerabilities.**

Instead, please email **jerry@skoczylas.dev** with:

- A description of the vulnerability
- Steps to reproduce
- Potential impact

You should receive a response within 48 hours. We will work with you to understand and address the issue before any public disclosure.

## Scope

Portpourri runs locally on macOS and interacts with the system through:

- `lsof` — to probe TCP listeners
- `ps` — to gather process metadata
- Process working directory resolution via `/proc` equivalents

The app does **not**:

- Make network requests
- Collect or transmit any data
- Require elevated privileges (no `sudo`)
- Expose any network services

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | Yes       |

## Design Principles

- The app is deliberately conservative about destructive actions
- Force-kill is never exposed without explicit user intent
- System processes cannot be terminated through the UI
- All process interaction uses standard POSIX signals (`SIGTERM`)
