#!/usr/bin/env bash

set -e

echo "Running Docker image exivity/dex:$TAG with name dex"

docker run \
    --rm \
    --name dex \
    --mount type=bind,source="$GITHUB_WORKSPACE/$CWD",target=/home \
    $ENV_OPTIONS \
    exivity/dex:$TAG \
    "$@"