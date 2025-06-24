# Copyright Sierra

import json
import argparse
from enum import Enum
from pydantic import BaseModel
from tau_bench.model_utils import default_api_from_args, API
from tau_bench.envs.airline.tasks_test import TASKS as AIRLINE_TASKS
from tau_bench.envs.retail.tasks_test import TASKS_TEST as RETAIL_TASKS
from tau_bench.model_utils.args import api_parser
from tau_bench.types import Task, Action
from typing import List, Dict, Any
from concurrent.futures import ThreadPoolExecutor
from tau_bench.envs.retail.wiki import WIKI as RETAIL_WIKI
from tau_bench.envs.airline.wiki import WIKI as AIRLINE_WIKI

def get_args() -> argparse.Namespace:
    parser = api_parser()
    parser.add_argument("--env", type=str, default="retail", choices=["airline", "retail"], help="The environment that the original trajectories are from (used to fetch the user instructions)")
    parser.add_argument("-r", "--results-path", type=str, default="visualize_results/uploads/agent-gpt-4.1-mini_user-gemini-2.5-flash-preview-04-17-llm_range-0-10_0522050804.json", help="Path to the results file")
    parser.add_argument("--max-concurrency", type=int, default=1, help="Maximum number of concurrent API calls")
    parser.add_argument("-o", "--output-path", type=str, required=True, help="Path to the output file")
    parser.add_argument("--max-num-failed-results", "-n", type=int, help="Maximum number of failed results to analyze")
    parser.add_argument("-t", "--task-ids", type=int, nargs="+", help="Space-separated task IDs, such as 7 13 56.")
    return parser.parse_args()

class OriginalResult(BaseModel):
    task_id: int
    user_instruction: str
    traj: List[Dict[str, Any]]
    ground_truth_actions: List[Action]
    ground_truth_outputs: List[str]

class FaultAuthor(Enum):
    USER = "user"
    AGENT = "agent"
    ENVIRONMENT = "environment"

class GoalCompletionResult(BaseModel):
    task_id: int
    goal_completed: bool
    rationale: str

    def model_dump(self) -> Dict[str, Any]:
        return {
            "task_id": self.task_id,
            "goal_completed": self.goal_completed,
            "rationale": self.rationale,
        }


class FaultAssignmentResult(BaseModel):
    task_id: int
    authors: List[FaultAuthor] 
    descriptions: List[str]

    def model_dump(self) -> Dict[str, Any]:
        return {
            "task_id": self.task_id,
            "author": [author.value for author in self.authors],
            "description": [description for description in self.descriptions],
        }

class FaultType(Enum):
    CALLED_WRONG_TOOL = "called_wrong_tool"
    USED_WRONG_TOOL_ARGUMENT = "used_wrong_tool_argument"
    GOAL_PARTIALLY_COMPLETED = "goal_partially_completed"
    OTHER = "other"

class FaultTypeResult(BaseModel):
    task_id: int
    fault_type: FaultType
    description: str

    def model_dump(self) -> Dict[str, Any]:
        return {
            "task_id": self.task_id,
            "fault_type": self.fault_type.value,
            "description": self.description,
        }

class GradingStrategy(Enum):
    ACTIONS = "actions"
    OUTPUTS = "outputs"


def context_description(grading_strategy: GradingStrategy) -> str:
#     if grading_strategy == GradingStrategy.ACTIONS:
#         return """You will be given a user instruction, the ground truth action sequence, and a trajectory.
# - The user instruction is the instruction given to the simulated user.
# - The ground truth action sequence is one example of a valid sequence of actions that lead to the goal state (the sequence of actions could be empty, meaning that no action should have been taken).
# - The trajectory is the sequence of messages between the user and the agent.
# - The trajectory has been determined to have a fault."""
    return """You will be given the ground truth action sequence, the set of required agent response outputs, and a trajectory.
- The ground truth action sequence is one example of a valid sequence of actions that lead to the goal state (the sequence of actions could be empty, meaning that no action should have been taken).
- The required agent response outputs are the set of outputs that the agent is expected to communicate to the user.
- The trajectory is the sequence of messages between the user and the agent.
- The trajectory has been determined to have a fault."""

def display_traj(traj: List[Dict[str, Any]]) -> str:
    if len(traj) == 0:
        raise ValueError("Trajectory is empty")
    stripped_traj = [item for item in traj if item["role"] != "system"]
    return "\n".join([f"{item['role'].capitalize()}: {item['content']}" for item in stripped_traj])

def display_actions(actions: List[Action]) -> str:
    return json.dumps([action.model_dump() for action in actions], indent=4)

def get_fault_assignment_prompt(author: FaultAuthor) -> str:

    prompt = f"Determine if the {author.value} is responsible for the fault in the trajectory."

    if author == FaultAuthor.USER:
        prompt += "You are given a user instruction. The user instruction is the instruction given to the simulated user. The user is responsible for the fault if they caused an action that was not grounded in the user instruction."

    elif author == FaultAuthor.AGENT:
        prompt += "You are given an agent policy. The agent policy includes a set of rules and best practices based on which the agent operates. The agent is responsible for the fault if they took an action that was not correct or with the wrong arguments, or acted against the rules and best practices in the agent policy."

    else:
        prompt += "The environment is responsible for all other faults besides the user and the agent. The user is responsible for the fault if they caused an action that was not grounded in the user instruction. The agent is responsible for the fault if they took an action that was not correct (or took the action with the wrong arguments)."
    
    prompt += f'''Return your response as a JSON object with the following format:
{{ 
    "responsible_entity": "{author.value}",
    "is_responsible": "yes" | "no",
    "rationale": "Your detailed reasoning for why the {author.value} is responsible or not responsible for the fault."
}}'''

    return prompt


def display_context(user_instruction: str, agent_policy: str, ground_truth_actions: List[Action], ground_truth_outputs: List[str], trajectory: List[Dict[str, Any]], author: FaultAuthor) -> str:
    '''
    display the context for fault assignment analysis by authors
    '''
    traj_display = display_traj(trajectory)

    # For user faults, show the user instruction but do not show the agent policy wiki
    if author.value == "user":
        context = f"""----- start user instruction -----
    {user_instruction}
    ----- end user instruction -----"""
                
    # For agent faults, do not show the user instruction but show the agent policy wiki
    if author.value == "agent":
        context = f"""----- start agent policy -----
    {agent_policy}
    ----- end agent policy -----"""
        
    # For environment faults, show neither the user instruction and the agent policy wiki
    if author.value == "environment":
        context = ""
    
    # Add the ground truth outputs
    if len(ground_truth_outputs) > 0:
        context += f"""

----- start required outputs -----
{ground_truth_outputs}
----- end required outputs -----"""

    # Add the ground truth actions and trajectory
    context += f"""

----- start ground truth action sequence -----
{display_actions(ground_truth_actions)}
----- end ground truth action sequence -----

----- start trajectory -----
{traj_display}
----- end trajectory -----\n"""
    return context

def goal_completion_analysis(api: API, results: List[OriginalResult], max_concurrency: int) -> List[GoalCompletionResult]:
    def assign_fault(task_id: int, user_instruction: str, traj: List[Dict[str, Any]], ground_truth_actions: List[Action], ground_truth_outputs: List[str]) -> GoalCompletionResult:
        grading_strategy = GradingStrategy.OUTPUTS if len(ground_truth_outputs) > 0 else GradingStrategy.ACTIONS
        ctx_desc = context_description(grading_strategy)
        context = display_context(user_instruction=user_instruction,
                                  agent_policy="",
                                  ground_truth_actions = ground_truth_actions, 
                                  ground_truth_outputs = ground_truth_outputs, 
                                  trajectory=traj,
                                  author=FaultAuthor.USER)
        
        instruction = f"""{ctx_desc}
PLEASE NOTE that the ground truth action sequence is one example of a valid sequence that leads to the goal state. However, it MIGHT NOT be the only valid sequence.

Your task is to determine whether the Assistant completed the goal state. If the Assistant completed the goal state, return "yes". If the assistant did not complete the goal state, return "no".

Return your response as a JSON object with the following format:
{{
    "rationale": "Your detailed reasoning for why the goal state was completed or not completed.",
    "goal_completed": "yes" | "no"
}}"""
        
        # print(f"DEBUG full instruction: \n============\n{instruction}\n============\n")
        # print(f"DEBUG full context: \n============\n{context}\n============\n")

        response = api.generate(instruction=instruction, text=context)
        
        try:
            # Parse the JSON response
            result_json = json.loads(response)
            rationale = result_json.get("rationale", "No rationale provided")
            goal_completed = result_json.get("goal_completed", "no").lower()
            
            # Convert string to boolean
            goal_completed_bool = goal_completed == "yes"
            
        except (json.JSONDecodeError, KeyError) as e:
            rationale = f"Error parsing response: {str(e)}. Original response: {response}"
            goal_completed_bool = False
            
        return GoalCompletionResult(task_id=task_id, goal_completed=goal_completed_bool, rationale=rationale)
            
    with ThreadPoolExecutor(max_workers=max_concurrency) as executor:
        task_ids = [r.task_id for r in results]
        user_instructions = [r.user_instruction for r in results]
        trajs = [r.traj for r in results]
        ground_truth_actions = [r.ground_truth_actions for r in results]
        ground_truth_outputs = [r.ground_truth_outputs for r in results]
        results = list(executor.map(assign_fault, task_ids, user_instructions, trajs, ground_truth_actions, ground_truth_outputs))
    return results

def fault_assignment_analysis_by_author(api: API, results: List[OriginalResult], max_concurrency: int, agent_policy: str, goal_completion_results: List[GoalCompletionResult]) -> List[FaultAssignmentResult]:
    def assign_fault_by_author(task_id: int, user_instruction: str, agent_policy: str, traj: List[Dict[str, Any]], ground_truth_actions: List[Action], ground_truth_outputs: List[str], extra_context: str) -> FaultAssignmentResult:
        str_to_author = {
            "user": FaultAuthor.USER,
            "agent": FaultAuthor.AGENT,
            "environment": FaultAuthor.ENVIRONMENT,
        }
        grading_strategy = GradingStrategy.OUTPUTS if len(ground_truth_outputs) > 0 else GradingStrategy.ACTIONS
        ctx_desc = context_description(grading_strategy)
        if extra_context:
            ctx_desc += f"\n\nYou are also given an additional analysis on whether the agent has completed the goal state. \
                Note that although the trajectory is determined to have a fault, the ground truth sequence may not be the only valid sequence to the goal state.\n{extra_context}\n"
        
        # Assign fault by author
        author_list = []
        rationale_list = []
        for author in FaultAuthor:
            context = display_context(user_instruction = user_instruction, 
                                      agent_policy=agent_policy, 
                                      ground_truth_actions = ground_truth_actions, 
                                      ground_truth_outputs = ground_truth_outputs, 
                                      trajectory= traj, 
                                      author = author)

            assignment_prompt = ctx_desc + get_fault_assignment_prompt(author)
            response = api.generate(
                instruction = assignment_prompt,
                text=context,
            )

            try:
                # Parse the JSON response
                result_json = json.loads(response)
                rationale = result_json.get("rationale", "No rationale provided")
                is_faulty = result_json.get("is_responsible", "no").lower() == "yes"
                responsible_entity = result_json.get("responsible_entity", "environment").lower()
                
                # Map string to enum, default to environment if invalid
                author = str_to_author.get(responsible_entity, FaultAuthor.ENVIRONMENT)
                
            except (json.JSONDecodeError, KeyError) as e:
                # Fallback: if JSON parsing fails, default to environment with error message
                author = FaultAuthor.ENVIRONMENT
                rationale = f"Error parsing response: {str(e)}. Original response: {response}"           
            
            # If the author is responsible for the fault, append to the lists
            if is_faulty:
                author_list.append(author)
            rationale_list.append(rationale)
            
        return FaultAssignmentResult(task_id=task_id, authors=author_list, descriptions=rationale_list)

    with ThreadPoolExecutor(max_workers=max_concurrency) as executor:
        task_ids = [r.task_id for r in results]
        user_instructions = [r.user_instruction for r in results]
        agent_policies = [agent_policy for _ in results]  # Use the same agent policy for all results
        trajs = [r.traj for r in results]
        ground_truth_actions = [r.ground_truth_actions for r in results]
        ground_truth_outputs = [r.ground_truth_outputs for r in results]
        if len(goal_completion_results)>0:
            extra_context = [f"{'Task goal completed:' if r.goal_completed else 'Task goal not completed'}\n Rationale: {r.rationale}" for r in goal_completion_results]
        else:
            extra_context = ["" for _ in results]  # Empty context if no goal completion results
        results = list(executor.map(assign_fault_by_author, task_ids, user_instructions,agent_policies, trajs, ground_truth_actions, ground_truth_outputs, extra_context))
    return results


def fault_type_analysis(api: API, results: List[OriginalResult], max_concurrency: int, agent_policy: str) -> List[FaultTypeResult]:
    def get_fault_type(task_id: int, user_instruction: str, agent_policy: str, traj: List[Dict[str, Any]], ground_truth_actions: List[Action], ground_truth_outputs: List[str]) -> FaultTypeResult:
        idx_to_fault_type = {
            0: FaultType.CALLED_WRONG_TOOL,
            1: FaultType.USED_WRONG_TOOL_ARGUMENT,
            2: FaultType.GOAL_PARTIALLY_COMPLETED,
            3: FaultType.OTHER,
        }
        grading_strategy = GradingStrategy.OUTPUTS if len(ground_truth_outputs) > 0 else GradingStrategy.ACTIONS
        ctx_desc = context_description(grading_strategy)
        context = display_context(user_instruction = user_instruction, 
                                  agent_policy=agent_policy, 
                                  ground_truth_actions = ground_truth_actions, 
                                  ground_truth_outputs = ground_truth_outputs, 
                                  trajectory= traj, 
                                  author = FaultAuthor.AGENT)
        res = api.classify(
            instruction=f"{ctx_desc}\n\nDetermine the type of fault of the first instance of the fault.",
            text=context,
            options=["The agent called the wrong tool", "The agent used the correct tool with a wrong argument", "The goal was only partially completed", "Other"],
        )
        fault_type = idx_to_fault_type[res]
        description = api.generate(
            instruction=f"{ctx_desc}\n\nDescribe the reason why the following trajectory contains a fault of type \"{fault_type.value}\". Be concise and only focus on the functional differences between the ground truth and the trajectory.",
            text=context,
        )
        return FaultTypeResult(task_id=task_id, fault_type=fault_type, description=description)

    with ThreadPoolExecutor(max_workers=max_concurrency) as executor:
        task_ids = [r.task_id for r in results]
        user_instructions = [r.user_instruction for r in results]
        agent_policies = [agent_policy for _ in results]  # Use the same agent policy for all results
        trajs = [r.traj for r in results]
        ground_truth_actions = [r.ground_truth_actions for r in results]
        ground_truth_outputs = [r.ground_truth_outputs for r in results]
        results = list(executor.map(get_fault_type, task_ids, user_instructions, agent_policies, trajs, ground_truth_actions, ground_truth_outputs))
    return results

def main() -> None:
    args = get_args()
    api = default_api_from_args(args)
    with open(args.results_path, "r") as f:
        results = json.load(f)
    print(f"Loaded {len(results)} results")
    env = args.env
    if env == "airline":
        tasks: List[Task] = AIRLINE_TASKS
        wiki = AIRLINE_WIKI
    elif env == "retail":
        tasks: List[Task] = RETAIL_TASKS
        wiki = RETAIL_WIKI
    else:
        raise ValueError(f"Invalid environment: {env}")
    
    # Filter by task IDs if specified
    if args.task_ids:
        print(f"Filtering results by task IDs: {args.task_ids}")
        task_id_set = set(args.task_ids)
        filtered_results = []
        found_task_ids = set()
        
        for result in results:
            if result["task_id"] in task_id_set:
                filtered_results.append(result)
                found_task_ids.add(result["task_id"])
        
        # Check for missing task IDs
        missing_task_ids = task_id_set - found_task_ids
        if missing_task_ids:
            print(f"Warning: Task IDs not found in results: {sorted(missing_task_ids)}")
        
        results = filtered_results
        print(f"Filtered to {len(results)} results matching specified task IDs")
    
    failed_results = [r for r in results if r["reward"] <= 1e-3]
    print(f"Found {len(failed_results)} failed trajectories")
    if args.max_num_failed_results is not None and len(failed_results) > args.max_num_failed_results:
        print(f"Limiting to {args.max_num_failed_results} failed trajectories")
        failed_results = failed_results[:args.max_num_failed_results]
    original_results = []
    missing_task_records = []
    
    for result in failed_results:
        task_id: int = result["task_id"]
        task = tasks[task_id]
        user_instruction = task.instruction
        ground_truth_actions = task.actions
        ground_truth_outputs = task.outputs
        original_result = OriginalResult(task_id=task_id, user_instruction=user_instruction, traj=result["traj"], ground_truth_actions=ground_truth_actions, ground_truth_outputs=ground_truth_outputs)
        original_results.append(original_result)
    
    # Handle missing task IDs for output
    if args.task_ids:
        missing_task_ids = set(args.task_ids) - {r.task_id for r in original_results}
        for missing_id in missing_task_ids:
            missing_task_records.append({
                "task_id": missing_id,
                "status": "no task found"
            })
    print("Performing goal completion analysis on the original results...")
    goal_completion_results = goal_completion_analysis(api=api, results=original_results, max_concurrency=args.max_concurrency)
    print(f"Performing fault assignment analysis on {len(original_results)} failed trajectories with a max concurrency of {args.max_concurrency}...")
    fault_assignment_results = fault_assignment_analysis_by_author(api=api, 
                                                                   results=original_results, 
                                                                   max_concurrency=args.max_concurrency, 
                                                                   agent_policy=wiki, 
                                                                   goal_completion_results=goal_completion_results)
    failures_due_to_agent = [original_results[i] for i, r in enumerate(fault_assignment_results) if FaultAuthor.AGENT in r.authors]
    print(f"Performing fault type analysis on {len(failures_due_to_agent)} failures that have been marked as being caused by the agent with a max concurrency of {args.max_concurrency}...")
    fault_type_results = fault_type_analysis(api=api, results=failures_due_to_agent, max_concurrency=args.max_concurrency, agent_policy=wiki)
    print(f"Reviewed {len(fault_assignment_results)} trajectories:")
    
    if len(fault_assignment_results) > 0:
        print(f"""
Author fault distribution:
  - User: {sum(1 for r in fault_assignment_results if FaultAuthor.USER in r.authors)} ({round(sum(1 for r in fault_assignment_results if FaultAuthor.USER in r.authors) / len(fault_assignment_results) * 100, 2)}%)
  - Agent: {sum(1 for r in fault_assignment_results if FaultAuthor.AGENT in r.authors)} ({round(sum(1 for r in fault_assignment_results if FaultAuthor.AGENT in r.authors) / len(fault_assignment_results) * 100, 2)}%)
  - Environment (otherwise case): {sum(1 for r in fault_assignment_results if FaultAuthor.ENVIRONMENT in r.authors)} ({round(sum(1 for r in fault_assignment_results if FaultAuthor.ENVIRONMENT in r.authors) / len(fault_assignment_results) * 100, 2)}%)

Fault type distribution (only failures marked as being caused by the agent):""")
    else:
        print("\nNo trajectories found to analyze.")
        print("\nFault type distribution (only failures marked as being caused by the agent):")
    
    if len(fault_type_results) > 0:
        print(f"""  - Called wrong tool: {sum(1 for r in fault_type_results if r.fault_type == FaultType.CALLED_WRONG_TOOL)} ({round(sum(1 for r in fault_type_results if r.fault_type == FaultType.CALLED_WRONG_TOOL) / len(fault_type_results) * 100, 2)}%)
  - Used wrong tool argument: {sum(1 for r in fault_type_results if r.fault_type == FaultType.USED_WRONG_TOOL_ARGUMENT)} ({round(sum(1 for r in fault_type_results if r.fault_type == FaultType.USED_WRONG_TOOL_ARGUMENT) / len(fault_type_results) * 100, 2)}%)
  - Goal partially completed: {sum(1 for r in fault_type_results if r.fault_type == FaultType.GOAL_PARTIALLY_COMPLETED)} ({round(sum(1 for r in fault_type_results if r.fault_type == FaultType.GOAL_PARTIALLY_COMPLETED) / len(fault_type_results) * 100, 2)}%)
  - Other: {sum(1 for r in fault_type_results if r.fault_type == FaultType.OTHER)} ({round(sum(1 for r in fault_type_results if r.fault_type == FaultType.OTHER) / len(fault_type_results) * 100, 2)}%)""")
    else:
        print("  No failures were marked as being caused by the agent.")
    
    print()  # Add a blank line for better formatting
    output_data = {
        "goal_completion_analysis": [r.model_dump() for r in goal_completion_results],
        "fault_assignment_analysis": [r.model_dump() for r in fault_assignment_results],
        "fault_type_analysis": [r.model_dump() for r in fault_type_results],
    }
    
    # Add missing task records if any
    if missing_task_records:
        output_data["missing_tasks"] = missing_task_records
    
    with open(args.output_path, "w") as f:
        json.dump(output_data, f, indent=4)
    print(f"Saved results to {args.output_path}")

if __name__ == "__main__":
    main()
