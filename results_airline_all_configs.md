## Trial #1

AGENT_MODEL="gpt-4.1-mini"
AGENT_PROVIDER="azure"
USER_MODEL="gpt-4.1-mini"
USER_PROVIDER="openai"

USER_STRATEGY="llm"
ENV="airline"
MAX_CONCURRENCY=6

-----
🏆 Average reward: 0.24
📈 Pass^k
  k=1: 0.24

📄 Results saved to results/tool-calling-gpt-4.1-mini-0.0_range_0--1_user-gpt-4.1-mini-llm_0519181222.json

-----
Token consuming by user model:
key_go7NTqANve0suBy1
input tokens: 301,120
key_go7NTqANve0suBy1
output tokens: 13,699

## Trial #2
AGENT_MODEL="gpt-4.1-mini"
AGENT_PROVIDER="azure"
USER_MODEL="gpt-4.1"
USER_PROVIDER="azure"

USER_STRATEGY="llm"
ENV="airline"
MAX_CONCURRENCY=8

-----
🏆 Average reward: 0.38
📈 Pass^k
  k=1: 0.38

📄 Results saved to results/tool-calling-gpt-4.1-mini-0.0_range_0--1_user-gpt-4.1-llm_0519174417.json

## Trial #3
AGENT_MODEL="Qwen3-235B-A22B-thinking-no-parser"
AGENT_PROVIDER="hosted_vllm"
USER_MODEL="gpt-4.1"
USER_PROVIDER="azure"

USER_STRATEGY="llm"
ENV="airline"
MAX_CONCURRENCY=8
-----
🏆 Average reward: 0.3
📈 Pass^k
  k=1: 0.3

📄 Results saved to results/tool-calling-Qwen3-235B-A22B-0.0_range_0--1_user-gpt-4.1-llm_0520024007.json

# Trial #4
AGENT_MODEL="Qwen3-235B-A22B-thinking"
AGENT_PROVIDER="hosted_vllm"
USER_MODEL="gpt-4.1"
USER_PROVIDER="openai"

USER_STRATEGY="llm"
ENV="airline"
MAX_CONCURRENCY=16

-----
🏆 Average reward: 0.26
📈 Pass^k
  k=1: 0.26

📄 Results saved to results/tool-calling-Qwen3-235B-A22B-thinking-0.0_range_0--1_user-gpt-4.1-llm_0519135110.json

# Trial #5
AGENT_MODEL="Qwen3-235B-A22B-thinking"
AGENT_PROVIDER="hosted_vllm"
USER_MODEL="gpt-4.1-mini"
USER_PROVIDER="openai"

USER_STRATEGY="reflection"
ENV="airline"
MAX_CONCURRENCY=16

-----
🏆 Average reward: 0.28
📈 Pass^k
  k=1: 0.28

📄 Results saved to results/tool-calling-Qwen3-235B-A22B-thinking-0.0_range_0--1_user-gpt-4.1-mini-reflection_0519114908.json


# Trial #6
AGENT_MODEL="Qwen3-235B-A22B-thinking"
AGENT_PROVIDER="hosted_vllm"
USER_MODEL="gpt-4.1-mini"
USER_PROVIDER="openai"

USER_STRATEGY="llm"
ENV="airline"
MAX_CONCURRENCY=16

-----
🏆 Average reward: 0.24
📈 Pass^k
  k=1: 0.24

📄 Results saved to results/tool-calling-Qwen3-235B-A22B-thinking-0.0_range_0--1_user-gpt-4.1-mini-llm_0519122459.json
