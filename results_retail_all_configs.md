## Trial #1
AGENT_MODEL="gpt-4.1-mini"
AGENT_PROVIDER="openai"
USER_MODEL="gpt-4.1-mini"
USER_PROVIDER="openai"

USER_STRATEGY="llm"
ENV="retail"
MAX_CONCURRENCY=6

-----
🏆 Average reward: 0.365
📈 Pass^k
  k=1: 0.365

📄 Results saved to results/tool-calling-gpt-4.1-mini-0.0_range_0--1_user-gpt-4.1-mini-llm_0519185554.json

-----
Token consuming by agent model:
key_R8FzHdGmsUi9kZ34
input tokens: 7,109,179
key_R8FzHdGmsUi9kZ34
output tokens: 103,581

-----
Token consuming by user model:
key_QECNndTXKzXIpa3I
input tokens: 682,628
key_QECNndTXKzXIpa3I
output tokens: 32,190

## Trial #2
AGENT_MODEL="gpt-4.1-mini"
AGENT_PROVIDER="azure"
USER_MODEL="gpt-4.1-mini"
USER_PROVIDER="openai"

USER_STRATEGY="reflection"
ENV="retail"
MAX_CONCURRENCY=6

-----
🏆 Average reward: 0.391304347826087
📈 Pass^k
  k=1: 0.391304347826087

📄 Results saved to results/tool-calling-gpt-4.1-mini-0.0_range_0--1_user-gpt-4.1-mini-reflection_0519191219.json
-----
Token consuming by user model:
key_4wnb5kIdISuie36G
input tokens: 1,458,511
key_4wnb5kIdISuie36G
output tokens: 38,269

## Trial #3
AGENT_MODEL="gpt-4.1-mini"
AGENT_PROVIDER="openai"
USER_MODEL="gpt-4.1"
USER_PROVIDER="openai"

USER_STRATEGY="llm"
ENV="retail"
MAX_CONCURRENCY=30

-----
🏆 Average reward: 0.6782608695652174
📈 Pass^k
  k=1: 0.6782608695652174

📄 Results saved to results/tool-calling-gpt-4.1-mini-0.0_range_0--1_user-gpt-4.1-llm_0519163041.json

## Trial #4
AGENT_MODEL="Qwen3-235B-A22B-thinking"
AGENT_PROVIDER="hosted_vllm"
USER_MODEL="Qwen3-235B-A22B-thinking"
USER_PROVIDER="hosted_vllm"

USER_STRATEGY="llm"
ENV="retail"
MAX_CONCURRENCY=10

-----

🏆 Average reward: 0.3652173913043478
📈 Pass^k
  k=1: 0.3652173913043478

📄 Results saved to results/tool-calling-Qwen3-235B-A22B0-thinking-0.0_range_0--1_user-Qwen3-235B-A22B-thinking-llm_0519151808.json

## Trial #5
AGENT_MODEL="Qwen3-235B-A22B-thinking-no-parser"
AGENT_PROVIDER="hosted_vllm"
USER_MODEL="gpt-4.1"
USER_PROVIDER="openai"

USER_STRATEGY="llm"
ENV="retail"
MAX_CONCURRENCY=16

-----
🏆 Average reward: 0.5217391304347826
📈 Pass^k
  k=1: 0.5217391304347826

📄 Results saved to results/tool-calling-Qwen3-235B-A22B-0.0_range_0--1_user-gpt-4.1-llm_0519165147.json

## Trial #6
AGENT_MODEL="Qwen3-235B-A22B-thinking-no-parser"
AGENT_PROVIDER="hosted_vllm"
USER_MODEL="gpt-4.1-mini"
USER_PROVIDER="openai"

USER_STRATEGY="llm"
ENV="retail"
MAX_CONCURRENCY=16

-----
🏆 Average reward: 0.4434782608695652
📈 Pass^k
  k=1: 0.4434782608695652

📄 Results saved to results/tool-calling-Qwen3-235B-A22B-0.0_range_0--1_user-gpt-4.1-mini-llm_0519172044.json

## Trial #7
AGENT_MODEL="Qwen3-235B-A22B-thinking-no-parser"
AGENT_PROVIDER="hosted_vllm"
USER_MODEL="gpt-4.1-mini"
USER_PROVIDER="openai"

USER_STRATEGY="reflection"
ENV="retail"
MAX_CONCURRENCY=16

-----
🏆 Average reward: 0.5043478260869565
📈 Pass^k
  k=1: 0.5043478260869565

📄 Results saved to results/tool-calling-Qwen3-235B-A22B-0.0_range_0--1_user-gpt-4.1-mini-reflection_0519175910.json


## Trial #8
AGENT_MODEL="Qwen3-235B-A22B-thinking"
AGENT_PROVIDER="hosted_vllm"
USER_MODEL="gpt-4.1"
USER_PROVIDER="openai"

USER_STRATEGY="llm"
ENV="retail"
MAX_CONCURRENCY=16

-----
🏆 Average reward: 0.43478260869565216
📈 Pass^k
  k=1: 0.43478260869565216

📄 Results saved to results/tool-calling-Qwen3-235B-A22B-thinking-0.0_range_0--1_user-gpt-4.1-llm_0519103628.json



## Trial #9
AGENT_MODEL="Qwen3-235B-A22B-no-think"
AGENT_PROVIDER="hosted_vllm"
USER_MODEL="gpt-4.1"
USER_PROVIDER="openai"

USER_STRATEGY="llm"
ENV="retail"
MAX_CONCURRENCY=16

-----
🏆 Average reward: 0.5739130434782609
📈 Pass^k
  k=1: 0.5739130434782609

📄 Results saved to results/tool-calling-Qwen3-235B-A22B-no-think-0.0_range_0--1_user-gpt-4.1-llm_0519184712.json

## Trial #10
AGENT_MODEL="Qwen3-235B-A22B-no-think"
AGENT_PROVIDER="hosted_vllm"
USER_MODEL="gpt-4.1-mini"
USER_PROVIDER="openai"

USER_STRATEGY="llm"
ENV="retail"
MAX_CONCURRENCY=16

-----
🏆 Average reward: 0.41739130434782606
📈 Pass^k
  k=1: 0.41739130434782606

📄 Results saved to results/tool-calling-Qwen3-235B-A22B-no-think-0.0_range_0--1_user-gpt-4.1-mini-llm_0519190842.json

## Trial #11
AGENT_MODEL="Qwen3-235B-A22B-no-think"
AGENT_PROVIDER="hosted_vllm"
USER_MODEL="gpt-4.1-mini"
USER_PROVIDER="openai"

USER_STRATEGY="reflection"
ENV="retail"
MAX_CONCURRENCY=16
-----
🏆 Average reward: 0.46956521739130436
📈 Pass^k
  k=1: 0.46956521739130436

📄 Results saved to results/tool-calling-Qwen3-235B-A22B-no-think-0.0_range_0--1_user-gpt-4.1-mini-reflection_0519185905.json

## Trial #12

AGENT_MODEL="gpt-4.1-mini"
AGENT_PROVIDER="azure"
USER_MODEL="DeepSeek-V3"
USER_PROVIDER="hosted_vllm"

USER_STRATEGY="llm"
ENV="retail"
MAX_CONCURRENCY=8

🏆 Average reward: 0.16521739130434782
📈 Pass^k
  k=1: 0.16521739130434782

📄 Results saved to results/tool-calling-gpt-4.1-mini-0.0_range_0--1_user-DeepSeek-V3-llm_0520035925.json

## Trial #13
AGENT_MODEL="gpt-4.1-mini"
AGENT_PROVIDER="azure"
USER_MODEL="gemini-2.5-flash-preview-04-17"
USER_PROVIDER="gemini"

USER_STRATEGY="llm"
ENV="retail"
MAX_CONCURRENCY=8

-----
🏆 Average reward: 0.6086956521739131
📈 Pass^k
  k=1: 0.6086956521739131

📄 Results saved to results/tool-calling-gpt-4.1-mini-0.0_range_0--1_user-gemini-2.5-flash-preview-04-17-llm_0520042046.json

## Trial #14
AGENT_MODEL="gpt-4.1-mini"
AGENT_PROVIDER="azure"
USER_MODEL="gemini-2.5-flash-preview-05-20"
USER_PROVIDER="gemini"

USER_STRATEGY="llm"
ENV="retail"
MAX_CONCURRENCY=8

-----
🏆 Average reward: 0.41739130434782606
📈 Pass^k
  k=1: 0.41739130434782606
📄 Results saved to results/tool-calling-gpt-4.1-mini-0.0_range_0--1_user-gemini-2.5-flash-preview-05-20-llm_0521004313.json

## Trial #15
AGENT_MODEL="gpt-4.1-mini"
AGENT_PROVIDER="azure"
USER_MODEL="gemini-2.5-flash-preview-04-17-no-think"
USER_PROVIDER="gemini"

USER_STRATEGY="llm"
ENV="retail"
MAX_CONCURRENCY=8

-----
🏆 Average reward: 0.5826086956521739
📈 Pass^k
  k=1: 0.5826086956521739

📄 Results saved to results/tool-calling-gpt-4.1-mini-0.0_range_0--1_user-gemini-2.5-flash-preview-04-17-llm_0520205319.json

## Trial #16
AGENT_MODEL="gpt-4.1-mini"
AGENT_PROVIDER="azure"
USER_MODEL="gemini-2.5-flash-preview-04-17-no-think"
USER_PROVIDER="gemini"

USER_STRATEGY="reflection"
ENV="retail"
MAX_CONCURRENCY=8

-----
🏆 Average reward: 0.5652173913043478
📈 Pass^k
  k=1: 0.5652173913043478

📄 Results saved to results/tool-calling-gpt-4.1-mini-0.0_range_0--1_user-gemini-2.5-flash-preview-04-17-reflection_0520070107.json


## Trial #17
AGENT_MODEL="Qwen3-235B-A22B-no-think"
AGENT_PROVIDER="hosted_vllm"
USER_MODEL="gemini-2.5-flash-preview-04-17"
USER_PROVIDER="gemini"

USER_STRATEGY="llm"
ENV="retail"
MAX_CONCURRENCY=8

-----
🏆 Average reward: 0.5043478260869565
📈 Pass^k
  k=1: 0.5043478260869565

📄 Results saved to results/tool-calling-Qwen3-235B-A22B-0.0_range_0--1_user-gemini-2.5-flash-preview-04-17-llm_0520182236.json


## Trial #18
AGENT_MODEL="o4-mini-high"
AGENT_PROVIDER="azure"
USER_MODEL="gemini-2.5-flash-preview-04-17"
USER_PROVIDER="gemini"

USER_STRATEGY="llm"
ENV="retail"
MAX_CONCURRENCY=8

-----
🏆 Average reward: 0.6782608695652174
📈 Pass^k
  k=1: 0.6782608695652174
📄 Results saved to results/tool-calling-o4-mini-0.0_range_0--1_user-gemini-2.5-flash-preview-04-17-llm_0521070848.json
-----

Token consumption by agent model:
key_YJSKjUwTJ4L6u3MD
input tokens: 7,545,399
key_YJSKjUwTJ4L6u3MD
output tokens: 1,095,530



## Trail #19
AGENT_MODEL="Qwen3-235B-A22B-no-think"
AGENT_PROVIDER="hosted_vllm"
USER_MODEL="gemini-2.5-flash-preview-04-17-no-think"
USER_PROVIDER="gemini"

USER_STRATEGY="llm"
ENV="retail"
MAX_CONCURRENCY=8

-----
🏆 Average reward: 0.40869565217391307
📈 Pass^k
  k=1: 0.40869565217391307

📄 Results saved to results/tool-calling-Qwen3-235B-A22B-0.0_range_0--1_user-gemini-2.5-flash-preview-04-17-llm_0520153910.json

