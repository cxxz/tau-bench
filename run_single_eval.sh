#!/bin/bash

# AGENT_MODEL="Qwen3-235B-A22B"
# AGENT_PROVIDER="hosted_vllm"

# USER_MODEL="gpt-4.1"
# USER_PROVIDER="azure"

AGENT_MODEL="gpt-4.1-mini"
AGENT_PROVIDER="azure"
USER_MODEL="gemini-2.5-flash-preview-04-17"
USER_PROVIDER="gemini"

USER_STRATEGY="llm"
ENV="retail"
MAX_CONCURRENCY=8

# export AGENT_MODEL_REASONING_EFFORT="high"
# export DISABLE_USER_MODEL_THINK="true"
# export DISABLE_AGENT_MODEL_THINK="true"
export HOSTED_VLLM_API_BASE="http://xxx.yyy.zzz.net:8715/v1"

export AZURE_API_KEY="your_key"
export AZURE_API_BASE="https://xxx.openai.azure.com/"
export AZURE_API_VERSION="2025-01-01-preview"

LOG_DIR="./run_logs/${ENV}-tool-calling"
if [ ! -d "$LOG_DIR" ]; then
  mkdir "$LOG_DIR"
fi
DATETIME_STR=$(date +"%Y%m%d_%H%M%S")
AGENT_MODEL_NAME=$(basename "$AGENT_MODEL")
LOG_FILE="${LOG_DIR}/agent-${AGENT_MODEL}_user-${USER_MODEL}-${USER_STRATEGY}_${DATETIME_STR}.txt"

set -e
set -x

python -u run.py \
  --agent-strategy tool-calling \
  --env "$ENV" \
  --model "$AGENT_MODEL" \
  --model-provider "$AGENT_PROVIDER" \
  --max-concurrency "$MAX_CONCURRENCY" \
  --user-model "$USER_MODEL" \
  --user-model-provider "$USER_PROVIDER" \
  --user-strategy "$USER_STRATEGY" \
  --task-ids 3 6 9 \
  | tee "$LOG_FILE"
