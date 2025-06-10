#!/bin/bash

# Interactive script to run error_identification.py

# Prompt for input JSON file
read -p "Enter input results JSON file [visualize_results/uploads/agent-gpt-4.1-mini_user-gemini-2.5-flash-preview-04-17-llm_range-0-10_0522050804.json]: " INPUT_JSON
INPUT_JSON=${INPUT_JSON:-visualize_results/uploads/agent-gpt-4.1-mini_user-gemini-2.5-flash-preview-04-17-llm_range-0-10_0522050804.json}

# Prompt for model name
read -p "Enter model name [gpt-4.1-mini]: " MODEL
MODEL=${MODEL:-gpt-4.1-mini}

# Prompt for task IDs
read -p "Enter space-separated task IDs [0]: " TASK_IDS
TASK_IDS=${TASK_IDS:-0}

# Compose output file name
BASENAME=$(basename "$INPUT_JSON" .json)
TASK_IDS_CLEAN=$(echo "$TASK_IDS" | tr ' ' '-')
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_JSON="err_ana_${BASENAME}_tasks-${TASK_IDS_CLEAN}_judge-${MODEL}_${TIMESTAMP}.json"

export OPENAI_API_KEY="sk-yourkeyhere"  # Set your OpenAI API key here
export OPENAI_BASE_URL="http://ai06.labs.hpecorp.net:4000"  # Set your OpenAI API base URL here

set -e  # Exit on error
set -x # Enable debugging output

# Run the script
python error_identification.py --platform openai --model "$MODEL" -r "$INPUT_JSON" -o "$OUTPUT_JSON" -t $TASK_IDS

echo "Output written to $OUTPUT_JSON"
