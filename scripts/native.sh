#!/usr/bin/env bash
set -euo pipefail

# Keep machine-specific toolchain fixes inside this process, never in shell files.
if [[ "$(uname)" == Darwin ]]; then
  if [[ -z "${ANDROID_HOME:-}" && -d "$HOME/Library/Android/sdk" ]]; then
    export ANDROID_HOME="$HOME/Library/Android/sdk"
  fi
  if [[ "${2:-}" == ios ]] && command -v brew >/dev/null 2>&1; then
    # Inspect installed opt links without asking Homebrew to refresh its API.
    vena_prefix="$(cd "$(dirname "$(command -v brew)")/.." && pwd -P)"
    vena_ruby="$vena_prefix/opt/ruby"
    vena_pods="$vena_prefix/opt/cocoapods"
    if [[ -x "$vena_ruby/bin/ruby" && -d "$vena_pods/libexec" ]]; then
      # Homebrew CocoaPods must use the gems from its current Ruby, not an older
      # Ruby directory left in GEM_PATH after a Homebrew upgrade.
      vena_gems="$("$vena_ruby/bin/ruby" -rrubygems -e 'print Gem.default_dir')"
      vena_ruby_api="$("$vena_ruby/bin/ruby" -rrbconfig -e 'print RbConfig::CONFIG["ruby_version"]')"
      export GEM_PATH="$vena_pods/libexec:$vena_ruby/lib/ruby/gems/$vena_ruby_api:$vena_gems"
    fi
  fi
fi

exec ns "$@"
