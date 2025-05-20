#!/bin/bash

AGENT_MODEL="Qwen3-235B-A22B"
AGENT_PROVIDER="hosted_vllm"
USER_MODEL="gpt-4.1"
USER_PROVIDER="azure"

USER_STRATEGY="llm"
ENV="retail"
MAX_CONCURRENCY=8

export AGENT_MODEL_THINK="false"
export HOSTED_VLLM_API_BASE="http://xxx.yyy.zzz.net:8715/v1"

export AZURE_API_KEY="your_key"
export AZURE_API_BASE="https://xxx.openai.azure.com/"
export AZURE_API_VERSION="2025-01-01-preview"

set -e
set -x

python run.py \
  --agent-strategy tool-calling \
  --env "$ENV" \
  --model "$AGENT_MODEL" \
  --model-provider "$AGENT_PROVIDER" \
  --max-concurrency "$MAX_CONCURRENCY" \
  --user-model "$USER_MODEL" \
  --user-model-provider "$USER_PROVIDER" \
  --user-strategy "$USER_STRATEGY"
  # --task-ids 1
