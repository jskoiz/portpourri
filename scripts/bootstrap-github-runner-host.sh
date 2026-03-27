#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Bootstrap a fresh Ubuntu host for BRDG GitHub Actions runners.

This script is intended for a new dedicated CI runner host. It installs Docker,
creates a dedicated runner user, downloads the GitHub Actions runner binary, and
registers one or more runner services against a single repository.

Usage:
  sudo ./scripts/bootstrap-github-runner-host.sh --token <registration-token> [options]

Options:
  --repo <owner/name>          GitHub repository to register against. Default: jskoiz/brdg
  --labels <csv>               Extra runner labels. Default: brdg-ci,brdg
  --count <n>                  Number of runner services to install. Default: 3
  --prefix <name>              Runner name prefix. Default: brdg-ci
  --runner-user <name>         Local unix user for the runner services. Default: github-runner
  --runner-version <version>   Pin a runner version. Defaults to the latest GitHub release.
  --work-root <path>           Root directory for runner installs. Default: /opt/actions-runners

Example:
  token="$(gh api -X POST repos/jskoiz/brdg/actions/runners/registration-token --jq .token)"
  sudo ./scripts/bootstrap-github-runner-host.sh --token "$token"
EOF
}

repo="jskoiz/brdg"
labels="brdg-ci,brdg"
count="3"
prefix="brdg-ci"
runner_user="github-runner"
runner_version=""
work_root="/opt/actions-runners"
token=""

while [ "$#" -gt 0 ]; do
  case "$1" in
    --repo)
      repo="$2"
      shift 2
      ;;
    --labels)
      labels="$2"
      shift 2
      ;;
    --count)
      count="$2"
      shift 2
      ;;
    --prefix)
      prefix="$2"
      shift 2
      ;;
    --runner-user)
      runner_user="$2"
      shift 2
      ;;
    --runner-version)
      runner_version="$2"
      shift 2
      ;;
    --work-root)
      work_root="$2"
      shift 2
      ;;
    --token)
      token="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [ "$EUID" -ne 0 ]; then
  echo "Run this script as root, for example with sudo." >&2
  exit 1
fi

if [ -z "$token" ]; then
  echo "--token is required." >&2
  exit 1
fi

if ! [[ "$count" =~ ^[1-9][0-9]*$ ]]; then
  echo "--count must be a positive integer." >&2
  exit 1
fi

install_docker_repo() {
  apt-get update
  apt-get install -y ca-certificates curl gnupg jq git unzip postgresql-client
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable --now docker
}

install_aws_cli() {
  if command -v aws >/dev/null 2>&1; then
    return
  fi

  local tmpdir
  tmpdir="$(mktemp -d)"
  trap 'rm -rf "$tmpdir"' RETURN
  curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "${tmpdir}/awscliv2.zip"
  unzip -q "${tmpdir}/awscliv2.zip" -d "${tmpdir}"
  "${tmpdir}/aws/install" --update
}

ensure_runner_user() {
  if ! id -u "$runner_user" >/dev/null 2>&1; then
    useradd --create-home --shell /bin/bash "$runner_user"
  fi
  usermod -aG docker "$runner_user"
}

resolve_runner_version() {
  if [ -n "$runner_version" ]; then
    echo "$runner_version"
    return
  fi

  curl -fsSL https://api.github.com/repos/actions/runner/releases/latest \
    | jq -r '.tag_name' \
    | sed 's/^v//'
}

configure_runner() {
  local name="$1"
  local version="$2"
  local repo_url="https://github.com/${repo}"
  local archive="actions-runner-linux-x64-${version}.tar.gz"
  local download_url="https://github.com/actions/runner/releases/download/v${version}/${archive}"
  local runner_dir="${work_root}/${name}"

  if [ -e "$runner_dir" ]; then
    echo "Runner directory already exists: $runner_dir" >&2
    echo "This bootstrap script assumes a fresh host. Remove or rename the existing directory and retry." >&2
    exit 1
  fi

  install -d -o "$runner_user" -g "$runner_user" "$runner_dir"

  sudo -u "$runner_user" bash -lc "
    set -euo pipefail
    cd '$runner_dir'
    curl -fsSL '$download_url' -o '$archive'
    tar xzf '$archive'
    rm '$archive'
    ./config.sh --unattended --replace \
      --url '$repo_url' \
      --token '$token' \
      --name '$name' \
      --labels '$labels' \
      --work '_work'
  "

  (
    cd "$runner_dir"
    bash ./bin/installdependencies.sh
    bash ./svc.sh install "$runner_user"
    bash ./svc.sh start
  )
}

install_docker_repo
install_aws_cli
ensure_runner_user
install -d -o "$runner_user" -g "$runner_user" "$work_root"

runner_version="$(resolve_runner_version)"

for index in $(seq 1 "$count"); do
  runner_name="$prefix"
  if [ "$index" -gt 1 ]; then
    runner_name="${prefix}-${index}"
  fi
  configure_runner "$runner_name" "$runner_version"
done

systemctl --no-pager --full status 'actions.runner.*' || true
