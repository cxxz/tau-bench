# Copyright Sierra

import json
import os
from litellm import completion
from typing import List, Optional, Dict, Any

from tau_bench.agents.base import Agent
from tau_bench.envs.base import Env
from tau_bench.types import SolveResult, Action, RESPOND_ACTION_NAME


class ToolCallingAgent(Agent):
    def __init__(
        self,
        tools_info: List[Dict[str, Any]],
        wiki: str,
        model: str,
        provider: str,
        temperature: float = 0.0,
    ):
        self.tools_info = tools_info
        self.wiki = wiki
        self.model = model
        self.provider = provider
        self.temperature = temperature
        self.disable_thinking = True if os.getenv("DISABLE_AGENT_MODEL_THINK") == "true" else False
        self.reasoning_effort = os.getenv("AGENT_MODEL_REASONING_EFFORT", None)

    def solve(
        self, env: Env, task_index: Optional[int] = None, max_num_steps: int = 30
    ) -> SolveResult:
        total_cost = 0.0
        env_reset_res = env.reset(task_index=task_index)
        obs = env_reset_res.observation
        info = env_reset_res.info.model_dump()
        reward = 0.0
        messages: List[Dict[str, Any]] = [
            {"role": "system", "content": self.wiki},
            {"role": "user", "content": obs},
        ]
        for _ in range(max_num_steps):
            if self.disable_thinking:
                res = completion(
                    messages=messages,
                    model=self.model,
                    custom_llm_provider=self.provider,
                    tools=self.tools_info,
                    temperature=self.temperature,
                    extra_body={
                        "chat_template_kwargs": {"enable_thinking": False},
                    },
                )
            elif self.reasoning_effort is not None:
                res = completion(
                    messages=messages,
                    model=self.model,
                    custom_llm_provider=self.provider,
                    tools=self.tools_info,
                    reasoning_effort=self.reasoning_effort,
                )
            else:
                res = completion(
                    messages=messages,
                    model=self.model,
                    custom_llm_provider=self.provider,
                    tools=self.tools_info,
                    temperature=self.temperature,
                )

            next_message = res.choices[0].message.model_dump()
            try:
                if res.usage.completion_tokens_details.reasoning_tokens:
                    reasoning_token_count = res.usage.completion_tokens_details.reasoning_tokens
                    next_message['reasoning_token_count'] = reasoning_token_count
            except:
                if 'reasoning_content' in next_message and next_message['reasoning_content'] is not None:
                    reasoning_token_count = count_reasoning_tokens(next_message['reasoning_content'], self.model)
                    next_message['reasoning_token_count'] = reasoning_token_count
                else:
                    reasoning_content = parse_reasoning_content(next_message['content'])
                    reasoning_token_count = count_reasoning_tokens(reasoning_content, self.model)
                    next_message['reasoning_token_count'] = reasoning_token_count
                    
            if "response_cost" in res._hidden_params and res._hidden_params["response_cost"] is not None:
                total_cost += res._hidden_params["response_cost"]
            action = message_to_action(next_message)
            env_response = env.step(action)
            reward = env_response.reward
            info = {**info, **env_response.info.model_dump()}
            if action.name != RESPOND_ACTION_NAME:
                next_message["tool_calls"] = next_message["tool_calls"][:1]
                messages.extend(
                    [
                        next_message,
                        {
                            "role": "tool",
                            "tool_call_id": next_message["tool_calls"][0]["id"],
                            "name": next_message["tool_calls"][0]["function"]["name"],
                            "content": env_response.observation,
                        },
                    ]
                )
            else:
                messages.extend(
                    [
                        next_message,
                        {"role": "user", "content": env_response.observation},
                    ]
                )
            if env_response.done:
                break
        return SolveResult(
            reward=reward,
            info=info,
            messages=messages,
            total_cost=total_cost,
        )


def message_to_action(
    message: Dict[str, Any],
) -> Action:
    if "tool_calls" in message and message["tool_calls"] is not None and len(message["tool_calls"]) > 0 and message["tool_calls"][0]["function"] is not None:
        tool_call = message["tool_calls"][0]
        return Action(
            name=tool_call["function"]["name"],
            kwargs=json.loads(tool_call["function"]["arguments"]),
        )
    else:
        return Action(name=RESPOND_ACTION_NAME, kwargs={"content": message["content"]})


def parse_reasoning_content(response_text: str) -> str:
    """
    Parse the response content using <think>...</think> and return the reasoning content.
    Args:
        response_text (str): The response text from the model.
    Returns:
        reasoning_content (str): The parsed reasoning content.
    """
    # from transformers import AutoTokenizer

    # try:
    #     tokenizer = AutoTokenizer.from_pretrained(model_name)
    # except Exception as e:
    #     print(f"Error loading tokenizer for model {model_name}: {e}")
    #     return 0

    start_token = "<think>"
    end_token = "</think>"

    if start_token in response_text and end_token in response_text:
        start_idx = response_text.find(start_token) + len(start_token)
        end_idx = response_text.find(end_token, start_idx)
        if end_idx > start_idx:
            reasoning_content = response_text[start_idx:end_idx]
            # Use hf transformers for accurate tokenization
            # return len(tokenizer.encode(thinking_content))
            # Estimate the number of tokens based on word count
            return reasoning_content
    return ""

def count_reasoning_tokens(
    reasoning_content: str,
    model_name: str,
) -> int:
    """
    Count the number of tokens in the reasoning content of the response text.
    Args:
        reasoning_content (str): The reasoning content from the model.
        model_name (str): The name of the model used for tokenization.
    Returns:
        int: The number of tokens in the reasoning content.
    """
    # from transformers import AutoTokenizer

    # try:
    #     tokenizer = AutoTokenizer.from_pretrained(model_name)
    # except Exception as e:
    #     print(f"Error loading tokenizer for model {model_name}: {e}")
    #     return 0

    # Use hf transformers for accurate tokenization
    # return len(tokenizer.encode(thinking_content))


    # Estimate the number of tokens based on word count
    return int(len(reasoning_content.strip().split()) / 0.75)