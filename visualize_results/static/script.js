// Global variables
let currentTaskData = null;
let allTaskIds = [];
let filteredTaskIds = [];
let currentTaskIndex = -1;

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    loadStats();
});

// File upload functionality
async function uploadFile() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    
    if (!file) {
        showStatus('Please select a file first.', 'danger');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    // Show loading state
    document.getElementById('upload-btn-text').textContent = 'Uploading...';
    document.getElementById('upload-spinner').classList.remove('d-none');
    
    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showStatus(`File uploaded successfully! Loaded ${result.total_tasks} tasks.`, 'success');
            allTaskIds = result.task_ids;
            filteredTaskIds = [...allTaskIds];
            populateTaskSelect();
            showMainInterface();
            loadStats();
            // Apply default filter to show task details
            applyFilter();
        } else {
            showStatus(`Error: ${result.error}`, 'danger');
        }
    } catch (error) {
        showStatus(`Error uploading file: ${error.message}`, 'danger');
    } finally {
        // Reset loading state
        document.getElementById('upload-btn-text').textContent = 'Upload File';
        document.getElementById('upload-spinner').classList.add('d-none');
    }
}

// Load available files from server
async function loadAvailableFiles() {
    try {
        const response = await fetch('/available-files');
        const result = await response.json();
        
        if (response.ok) {
            populateFileSelect(result.files);
        } else {
            showStatus(`Error loading files: ${result.error}`, 'danger');
        }
    } catch (error) {
        showStatus(`Error loading files: ${error.message}`, 'danger');
    }
}

// Populate the existing files dropdown
function populateFileSelect(files) {
    const select = document.getElementById('existingFileSelect');
    select.innerHTML = '<option value="">Choose a file...</option>';
    
    files.forEach(file => {
        const option = document.createElement('option');
        option.value = file.filename;
        
        // Format file size
        const sizeKB = Math.round(file.size / 1024);
        const sizeStr = sizeKB > 1024 ? `${(sizeKB/1024).toFixed(1)}MB` : `${sizeKB}KB`;
        
        // Format date
        const date = new Date(file.modified * 1000);
        const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        
        option.textContent = `${file.filename} (${sizeStr}, ${dateStr})`;
        select.appendChild(option);
    });
    
    // Enable/disable load button based on selection
    select.addEventListener('change', function() {
        const loadBtn = document.getElementById('load-existing-btn');
        loadBtn.disabled = !this.value;
    });
}

// Load existing file functionality
async function loadExistingFile() {
    const fileSelect = document.getElementById('existingFileSelect');
    const filename = fileSelect.value;
    
    if (!filename) {
        showStatus('Please select a file first.', 'danger');
        return;
    }
    
    // Show loading state
    document.getElementById('load-btn-text').textContent = 'Loading...';
    document.getElementById('load-spinner').classList.remove('d-none');
    
    try {
        const response = await fetch('/load-existing', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ filename: filename })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showStatus(`File loaded successfully! Loaded ${result.total_tasks} tasks.`, 'success');
            allTaskIds = result.task_ids;
            filteredTaskIds = [...allTaskIds];
            populateTaskSelect();
            showMainInterface();
            loadStats();
            // Apply default filter to show task details
            applyFilter();
        } else {
            showStatus(`Error: ${result.error}`, 'danger');
        }
    } catch (error) {
        showStatus(`Error loading file: ${error.message}`, 'danger');
    } finally {
        // Reset loading state
        document.getElementById('load-btn-text').textContent = 'Load File';
        document.getElementById('load-spinner').classList.add('d-none');
    }
}

// Show status messages
function showStatus(message, type) {
    const statusDiv = document.getElementById('upload-status');
    statusDiv.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>`;
}

// Show main interface after successful upload
function showMainInterface() {
    document.getElementById('main-interface').classList.remove('d-none');
}

// Populate task selection dropdown
function populateTaskSelect() {
    const select = document.getElementById('taskSelect');
    select.innerHTML = '<option value="">Choose a task...</option>';
    
    filteredTaskIds.forEach(taskId => {
        const option = document.createElement('option');
        option.value = taskId;
        option.textContent = `Task ${taskId}`;
        select.appendChild(option);
    });
}

// Populate task selection dropdown with task details
function populateTaskSelectWithDetails(tasks) {
    const select = document.getElementById('taskSelect');
    select.innerHTML = '<option value="">Choose a task...</option>';
    
    tasks.forEach(task => {
        const option = document.createElement('option');
        option.value = task.task_id;
        const status = task.success ? '✅' : '❌';
        const reward = task.reward.toFixed(3);
        option.textContent = `${status} Task ${task.task_id} (${task.user_id}) - Reward: ${reward}`;
        select.appendChild(option);
    });
}

// Apply filter to task list
async function applyFilter() {
    const filter = document.getElementById('filterSelect').value;
    
    try {
        const response = await fetch(`/tasks/filtered/${filter}`);
        const data = await response.json();
        
        if (response.ok) {
            filteredTaskIds = data.tasks.map(task => task.task_id);
            populateTaskSelectWithDetails(data.tasks);
        } else {
            showStatus(`Error filtering tasks: ${data.error}`, 'danger');
        }
    } catch (error) {
        showStatus(`Error filtering tasks: ${error.message}`, 'danger');
    }
    
    // Clear current selection
    document.getElementById('taskSelect').value = '';
    clearDisplay();
}

// Load and display a specific task
async function loadTask() {
    const taskId = document.getElementById('taskSelect').value;
    
    if (!taskId) {
        clearDisplay();
        return;
    }
    
    try {
        const response = await fetch(`/task/${taskId}`);
        const data = await response.json();
        
        if (response.ok) {
            currentTaskData = data;
            currentTaskIndex = filteredTaskIds.indexOf(parseInt(taskId));
            displayTask(data);
        } else {
            showStatus(`Error loading task: ${data.error}`, 'danger');
        }
    } catch (error) {
        showStatus(`Error loading task: ${error.message}`, 'danger');
    }
}

// Display task information and conversation
function displayTask(data) {
    const { task_id, result, ground_truth } = data;
    
    // Show task info card
    document.getElementById('task-info-card').style.display = 'block';
    
    // Update task information
    document.getElementById('task-id-display').textContent = task_id;
    document.getElementById('user-id-display').textContent = ground_truth.user_id;
    document.getElementById('reward-display').textContent = result.reward.toFixed(4);
    document.getElementById('instruction-display').textContent = ground_truth.instruction;
    
    // Update status badge
    const statusBadge = document.getElementById('task-status-badge');
    const isSuccess = result.reward > 0.001;
    statusBadge.textContent = isSuccess ? 'SUCCESS' : 'FAILED';
    statusBadge.className = `badge ${isSuccess ? 'status-success' : 'status-failed'}`;
    
    // Add output matching summary if outputs exist
    let outputMatches = null;
    
    if (ground_truth.outputs && ground_truth.outputs.length > 0) {
        // Check different possible paths for output matching data
        if (result.info && result.info.reward_info && result.info.reward_info.info && result.info.reward_info.info.outputs) {
            outputMatches = result.info.reward_info.info.outputs;
        } else if (result.reward_info && result.reward_info.info && result.reward_info.info.outputs) {
            outputMatches = result.reward_info.info.outputs;
        }
        
        if (outputMatches) {
            const totalOutputs = Object.keys(outputMatches).length;
            const matchedOutputs = Object.values(outputMatches).filter(matched => matched).length;
            const outputScore = totalOutputs > 0 ? (matchedOutputs / totalOutputs * 100).toFixed(0) : 0;
            
            // Add output matching info to reward display
            const rewardDisplay = document.getElementById('reward-display');
            const rewardContainer = rewardDisplay.parentElement;
            
            // Check if output info already exists, if not create it
            let outputInfo = rewardContainer.querySelector('.output-info');
            if (!outputInfo) {
                outputInfo = document.createElement('div');
                outputInfo.className = 'output-info';
                rewardContainer.appendChild(outputInfo);
            }
            
            outputInfo.innerHTML = `<strong>Outputs:</strong> ${matchedOutputs}/${totalOutputs} matched (${outputScore}%)`;
        }
    } else {
        // Remove output info if it exists but no outputs
        const rewardContainer = document.getElementById('reward-display').parentElement;
        const outputInfo = rewardContainer.querySelector('.output-info');
        if (outputInfo) {
            outputInfo.remove();
        }
    }
    
    // Calculate action matching for highlighting
    const actionMatching = calculateActionMatching(ground_truth.actions, result);
    
    // Display conversation with highlighting info
    displayConversation(result.traj || result.messages || [], actionMatching);
    
    // Update ground truth if visible
    if (document.getElementById('showGroundTruth').checked) {
        displayGroundTruth(ground_truth, actionMatching);
    }
}

// Display conversation messages
function displayConversation(messages, actionMatching = null) {
    const container = document.getElementById('conversation-display');
    container.innerHTML = '';
    
    if (!messages || messages.length === 0) {
        container.innerHTML = '<div class="text-center text-muted">No conversation data available</div>';
        return;
    }
    
    let actualActionIndex = 0; // Track position in actual actions for highlighting
    
    messages.forEach((message, index) => {
        const messageElement = createMessageElement(message, index, actionMatching, actualActionIndex);
        container.appendChild(messageElement);
        
        // Increment action index if this message contains tool calls
        if (message.tool_calls && message.tool_calls.length > 0) {
            actualActionIndex += message.tool_calls.length;
        }
    });
    
    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

// Create a message element
function createMessageElement(message, index, actionMatching = null, actualActionIndex = 0) {
    const div = document.createElement('div');
    const role = message.role || 'unknown';
    
    // Handle system messages with collapsible content and Markdown rendering
    if (role === 'system') {
        div.className = 'message message-system system-message-left';
        const content = message.content || '';
        const lines = content.split('\n');
        const isLong = lines.length > 3 || content.length > 200;
        
        if (isLong) {
            const preview = lines.slice(0, 2).join('\n');
            const systemId = `system-message-${index}`;
            
            div.innerHTML = `
                <div class="message-role">System</div>
                <div class="message-content">
                    <div class="system-message-preview" onclick="toggleSystemMessage('${systemId}')" style="cursor: pointer;">
                        <div id="${systemId}-preview" class="system-markdown-content">Loading preview...</div>
                        <div class="system-expand-hint" id="${systemId}-hint">
                            <small class="text-muted">Click to expand full system message</small>
                        </div>
                    </div>
                    <div class="system-message-full collapsible-content" id="${systemId}-full" onclick="toggleSystemMessage('${systemId}')" style="cursor: pointer;">
                        <div id="${systemId}-full-content" class="system-markdown-content">Loading...</div>
                        <div class="system-expand-hint">
                            <small class="text-muted">Click to collapse</small>
                        </div>
                    </div>
                </div>
            `;
            
            // Render Markdown for both preview and full content
            renderMarkdownAsync(preview + '...', `${systemId}-preview`);
            renderMarkdownAsync(content, `${systemId}-full-content`);
        } else {
            const systemId = `system-message-${index}`;
            div.innerHTML = `
                <div class="message-role">System</div>
                <div class="message-content">
                    <div id="${systemId}-content" class="system-markdown-content">Loading...</div>
                </div>
            `;
            
            // Render Markdown for short content
            renderMarkdownAsync(content, `${systemId}-content`);
        }
        return div;
    }
    
    div.className = `message message-${role}`;
    
    // Handle tool calls with highlighting
    if (message.tool_calls && message.tool_calls.length > 0) {
        const showGroundTruth = document.getElementById('showGroundTruth').checked;
        let toolCallsHtml = '';
        
        message.tool_calls.forEach((call, callIndex) => {
            const currentActionIndex = actualActionIndex + callIndex;
            const actionInfo = actionMatching && actionMatching.actual[currentActionIndex];
            let highlightClass = '';
            
            if (showGroundTruth && actionInfo) {
                if (actionInfo.type === 'matched' && actionInfo.matchType === 'perfect') {
                    highlightClass = 'action-highlight-matched';
                } else if (actionInfo.type === 'partial' && actionInfo.matchType === 'name_only') {
                    highlightClass = 'action-highlight-partial';
                } else if (actionInfo.type === 'extra') {
                    highlightClass = 'action-highlight-extra';
                } else {
                    highlightClass = 'action-highlight-unmatched';
                }
            }
            
            toolCallsHtml += createToolCallElement(call, highlightClass, actionInfo);
        });
        
        div.innerHTML = `
            <div class="message-role">Agent (Tool Call)</div>
            <div class="message-content">
                ${toolCallsHtml}
            </div>
        `;
    } 
    // Handle tool responses
    else if (role === 'tool') {
        const toolResultId = `tool-result-${index}`;
        const jsonResult = formatToolResultAsJson(message.content || '');
        
        div.innerHTML = `
            <div class="message-role">Tool Response</div>
            <div class="message-content">
                <div class="tool-result">
                    <a href="#" class="show-result-link" onclick="toggleToolResult('${toolResultId}'); return false;">
                        Show Result
                    </a>
                    <div id="${toolResultId}" class="tool-result-content collapsible-content" style="display: none;">
                        ${jsonResult}
                    </div>
                </div>
            </div>
        `;
    }
    // Regular messages
    else {
        div.innerHTML = `
            <div class="message-role">${role.charAt(0).toUpperCase() + role.slice(1)}</div>
            <div class="message-content">${escapeHtml(message.content || '')}</div>
        `;
    }
    
    return div;
}

// Create tool call element
function createToolCallElement(toolCall, highlightClass = '', actionInfo = null) {
    const callId = `tool-call-${Math.random().toString(36).substr(2, 9)}`;
    const args = toolCall.function?.arguments || '{}';
    const functionName = toolCall.function?.name || 'unknown';
    
    let formattedArgs;
    try {
        const parsed = JSON.parse(args);
        formattedArgs = JSON.stringify(parsed, null, 2);
    } catch {
        formattedArgs = args;
    }
    
    // Add match status label for partial matches
    let matchStatusLabel = '';
    if (actionInfo && actionInfo.type === 'partial' && actionInfo.matchType === 'name_only') {
        matchStatusLabel = '<div class="match-status-label">⚠️ Mismatched Arguments</div>';
    }
    
    return `
        <div class="tool-call ${highlightClass}">
            <div class="tool-call-header" onclick="toggleToolCall('${callId}')">
                <span class="tool-call-name">🔧 ${functionName}</span>
                <span class="tool-call-toggle" id="${callId}-toggle">Show Details</span>
            </div>
            ${matchStatusLabel}
            <div class="tool-call-details collapsible-content" id="${callId}-details">
                <div><strong>Arguments:</strong></div>
                <div class="tool-arguments">${formattedArgs}</div>
            </div>
        </div>
    `;
}

// Toggle tool call details
function toggleToolCall(callId) {
    const details = document.getElementById(`${callId}-details`);
    const toggle = document.getElementById(`${callId}-toggle`);
    
    if (details.classList.contains('show')) {
        details.classList.remove('show');
        toggle.textContent = 'Show Details';
    } else {
        details.classList.add('show');
        toggle.textContent = 'Hide Details';
    }
}

// Toggle system message visibility
function toggleSystemMessage(systemId) {
    const preview = document.getElementById(`${systemId}-preview`);
    const hint = document.getElementById(`${systemId}-hint`);
    const full = document.getElementById(`${systemId}-full`);
    
    if (full.classList.contains('show')) {
        // Show preview, hide full
        full.classList.remove('show');
        preview.style.display = 'block';
        hint.style.display = 'block';
    } else {
        // Hide preview, show full
        full.classList.add('show');
        preview.style.display = 'none';
        hint.style.display = 'none';
    }
}

// Toggle tool result visibility
function toggleToolResult(resultId) {
    const resultDiv = document.getElementById(resultId);
    const linkElement = resultDiv?.parentElement.querySelector('.show-result-link');
    
    if (resultDiv && linkElement) {
        const isVisible = resultDiv.style.display !== 'none';
        
        if (isVisible) {
            resultDiv.style.display = 'none';
            linkElement.textContent = 'Show Result';
        } else {
            resultDiv.style.display = 'block';
            linkElement.textContent = 'Hide Result';
        }
    }
}

// Toggle ground truth display
function toggleGroundTruth() {
    const checkbox = document.getElementById('showGroundTruth');
    const column = document.getElementById('ground-truth-column');
    const conversationColumn = document.getElementById('conversation-column');
    
    if (checkbox.checked) {
        column.classList.remove('d-none');
        conversationColumn.className = 'col-lg-8';
        
        if (currentTaskData) {
            // Recalculate highlighting and refresh both displays
            const actionMatching = calculateActionMatching(currentTaskData.ground_truth.actions, currentTaskData.result);
            displayGroundTruth(currentTaskData.ground_truth, actionMatching);
            displayConversation(currentTaskData.result.traj || currentTaskData.result.messages || [], actionMatching);
        }
    } else {
        column.classList.add('d-none');
        conversationColumn.className = 'col-lg-12';
        
        // Refresh conversation without highlighting
        if (currentTaskData) {
            displayConversation(currentTaskData.result.traj || currentTaskData.result.messages || []);
        }
    }
}

// Display ground truth with action matching
function displayGroundTruth(groundTruth, actionMatching = null) {
    const container = document.getElementById('ground-truth-display');
    container.innerHTML = '';
    
    // Display expected actions
    const actionsSection = document.createElement('div');
    actionsSection.className = 'ground-truth-section';
    actionsSection.innerHTML = '<h6>Expected Actions:</h6>';
    
    const actionsList = document.createElement('ol');
    groundTruth.actions.forEach((action, index) => {
        const actionItem = document.createElement('li');
        let className = 'expected-action';
        
        // Add highlighting based on matching
        if (actionMatching && actionMatching.expected[index]) {
            const matchInfo = actionMatching.expected[index];
            if (matchInfo.type === 'matched' && matchInfo.matchType === 'perfect') {
                className += ' action-highlight-matched';
            } else if (matchInfo.type === 'partial' && matchInfo.matchType === 'name_only') {
                className += ' action-highlight-partial';
            } else if (matchInfo.type === 'missing') {
                className += ' action-highlight-missing';
            } else if (matchInfo.type === 'unmatched') {
                className += ' action-highlight-unmatched';
            }
        }
        
        actionItem.className = className;
        actionItem.innerHTML = `<strong>${action.name}</strong>`;
        
        // Add arguments
        if (action.kwargs && Object.keys(action.kwargs).length > 0) {
            const args = document.createElement('div');
            args.className = 'action-args';
            args.innerHTML = `<pre>${JSON.stringify(action.kwargs, null, 2)}</pre>`;
            actionItem.appendChild(args);
        }
        
        actionsList.appendChild(actionItem);
    });
    
    actionsSection.appendChild(actionsList);
    container.appendChild(actionsSection);
    
    // Add output matching results if available
    displayOutputMatching(currentTaskData);
}

// Add new function to display output matching results
function displayOutputMatching(taskData) {
    console.log('displayOutputMatching called with:', taskData); // Debug log
    
    if (!taskData || !taskData.result) {
        console.log('No taskData or result found');
        return;
    }
    
    // Check different possible paths for output matching data
    let outputMatches = null;
    
    if (taskData.result.info && taskData.result.info.reward_info && taskData.result.info.reward_info.info && taskData.result.info.reward_info.info.outputs) {
        outputMatches = taskData.result.info.reward_info.info.outputs;
        console.log('Found outputs in info.reward_info.info.outputs:', outputMatches);
    } else if (taskData.result.reward_info && taskData.result.reward_info.info && taskData.result.reward_info.info.outputs) {
        outputMatches = taskData.result.reward_info.info.outputs;
        console.log('Found outputs in reward_info.info.outputs:', outputMatches);
    } else if (taskData.result.info && taskData.result.info.outputs) {
        outputMatches = taskData.result.info.outputs;
        console.log('Found outputs in info.outputs:', outputMatches);
    } else if (taskData.result.outputs) {
        outputMatches = taskData.result.outputs;
        console.log('Found outputs in outputs:', outputMatches);
    }
    
    if (!outputMatches) {
        console.log('No output matching data found. Available paths:', Object.keys(taskData.result));
        if (taskData.result.info) {
            console.log('Available paths in result.info:', Object.keys(taskData.result.info));
            if (taskData.result.info.reward_info) {
                console.log('Available paths in result.info.reward_info:', Object.keys(taskData.result.info.reward_info));
                if (taskData.result.info.reward_info.info) {
                    console.log('Available paths in result.info.reward_info.info:', Object.keys(taskData.result.info.reward_info.info));
                }
            }
        }
        return;
    }
    
    const container = document.getElementById('ground-truth-display');
    
    // Add output matching section
    const matchingSection = document.createElement('div');
    matchingSection.className = 'ground-truth-section mt-3';
    matchingSection.innerHTML = '<h6>Output Matching Results:</h6>';
    
    const matchingList = document.createElement('ul');
    matchingList.className = 'output-matching-list';
    
    Object.entries(outputMatches).forEach(([output, matched]) => {
        const matchItem = document.createElement('li');
        matchItem.className = `output-match-item ${matched ? 'output-matched' : 'output-unmatched'}`;
        
        const icon = matched ? '✅' : '❌';
        const status = matched ? 'Matched' : 'Not Matched';
        
        matchItem.innerHTML = `
            <span class="output-match-icon">${icon}</span>
            <code class="output-value">${escapeHtml(output)}</code>
            <span class="output-match-status">${status}</span>
        `;
        
        matchingList.appendChild(matchItem);
    });
    
    matchingSection.appendChild(matchingList);
    container.appendChild(matchingSection);
    
    // Calculate and display output score
    const totalOutputs = Object.keys(outputMatches).length;
    const matchedOutputs = Object.values(outputMatches).filter(matched => matched).length;
    const outputScore = totalOutputs > 0 ? (matchedOutputs / totalOutputs * 100).toFixed(1) : 0;
    
    const scoreDiv = document.createElement('div');
    scoreDiv.className = 'output-score mt-2';
    scoreDiv.innerHTML = `<strong>Output Score:</strong> ${matchedOutputs}/${totalOutputs} (${outputScore}%)`;
    matchingSection.appendChild(scoreDiv);
    
    console.log('Output matching section added successfully');
}

// Navigation functions
function previousTask() {
    if (currentTaskIndex > 0) {
        currentTaskIndex--;
        const taskId = filteredTaskIds[currentTaskIndex];
        document.getElementById('taskSelect').value = taskId;
        loadTask();
    }
}

function nextTask() {
    if (currentTaskIndex < filteredTaskIds.length - 1) {
        currentTaskIndex++;
        const taskId = filteredTaskIds[currentTaskIndex];
        document.getElementById('taskSelect').value = taskId;
        loadTask();
    }
}

// Jump to first failed task
async function jumpToFirstFailed() {
    try {
        const response = await fetch('/tasks/filtered/failed');
        const data = await response.json();
        
        if (response.ok && data.tasks.length > 0) {
            const firstFailedTask = data.tasks[0];
            document.getElementById('taskSelect').value = firstFailedTask.task_id;
            
            // Update filter to show failed tasks
            document.getElementById('filterSelect').value = 'failed';
            await applyFilter();
            
            // Load the task
            await loadTask();
        } else {
            showStatus('No failed tasks found!', 'info');
        }
    } catch (error) {
        showStatus(`Error finding failed tasks: ${error.message}`, 'danger');
    }
}

// Load and display statistics
async function loadStats() {
    try {
        const response = await fetch('/stats');
        if (response.ok) {
            const stats = await response.json();
            document.getElementById('stats-display').innerHTML = `
                📊 ${stats.total_tasks} tasks | 
                ✅ ${stats.successful_tasks} success | 
                ❌ ${stats.failed_tasks} failed | 
                📈 ${stats.success_rate.toFixed(1)}% success rate
            `;
        }
    } catch (error) {
        console.log('Stats not available yet');
    }
}

// Clear display
function clearDisplay() {
    document.getElementById('task-info-card').style.display = 'none';
    document.getElementById('conversation-display').innerHTML = 
        '<div class="text-center text-muted">Select a task to view the conversation</div>';
    document.getElementById('ground-truth-display').innerHTML = '';
    currentTaskData = null;
    currentTaskIndex = -1;
}

// Generate action comparison between expected and actual
function generateActionComparison(expectedActions, result) {
    const actualActions = extractActualActions(result);
    
    // Create detailed comparison
    let comparisonHtml = '<h6>🔍 Action Analysis:</h6><div class="task-summary">';
    
    if (expectedActions.length === 0 && actualActions.length === 0) {
        comparisonHtml += '<div class="summary-item summary-success">✅ No actions needed and none taken</div>';
    } else if (expectedActions.length === 0 && actualActions.length > 0) {
        comparisonHtml += `<div class="summary-item summary-error">❌ Unexpected actions taken (${actualActions.length})</div>`;
    } else if (expectedActions.length > 0 && actualActions.length === 0) {
        comparisonHtml += `<div class="summary-item summary-error">❌ Missing all expected actions (${expectedActions.length})</div>`;
    } else {
        // Improved matching algorithm with argument comparison
        const comparison = compareActionSequences(expectedActions, actualActions);
        
        if (comparison.exactMatch) {
            comparisonHtml += '<div class="summary-item summary-success">✅ Perfect action sequence match</div>';
        } else {
            if (comparison.perfectMatches > 0) {
                comparisonHtml += `<div class="summary-item summary-success">✅ ${comparison.perfectMatches} actions perfectly matched</div>`;
            }
            if (comparison.nameOnlyMatches > 0) {
                comparisonHtml += `<div class="summary-item summary-warning">⚠️ ${comparison.nameOnlyMatches} actions matched by name only (mismatched arguments)</div>`;
            }
            if (comparison.missing > 0) {
                comparisonHtml += `<div class="summary-item summary-error">❌ ${comparison.missing} actions missing</div>`;
            }
            if (comparison.extra > 0) {
                comparisonHtml += `<div class="summary-item summary-warning">⚠️ ${comparison.extra} extra actions</div>`;
            }
            if (comparison.wrongOrder && comparison.matched > 0) {
                comparisonHtml += '<div class="summary-item summary-warning">⚠️ Actions in wrong order</div>';
            }
        }
        
        // Show conversation length
        const messages = result.traj || result.messages || [];
        const conversationLength = messages.filter(m => m.role !== 'system').length;
        comparisonHtml += `<div class="summary-item">💬 ${conversationLength} messages</div>`;
    }
    
    comparisonHtml += '</div>';
    return comparisonHtml;
}

// Extract actual actions from result trajectory
function extractActualActions(result) {
    const actions = [];
    const messages = result.traj || result.messages || [];
    
    messages.forEach(message => {
        if (message.tool_calls && message.tool_calls.length > 0) {
            message.tool_calls.forEach(call => {
                if (call.function && call.function.name) {
                    actions.push({
                        name: call.function.name,
                        args: call.function.arguments
                    });
                }
            });
        }
    });
    
    return actions;
}

// Compare action sequences with better matching (including arguments)
function compareActionSequences(expected, actual) {
    // Helper function to normalize arguments for comparison
    function normalizeArgs(args) {
        if (typeof args === 'string') {
            try {
                return JSON.parse(args);
            } catch {
                return {};
            }
        }
        return args || {};
    }
    
    // Helper function to deeply compare two objects
    function deepEqual(obj1, obj2) {
        return JSON.stringify(sortObjectKeys(obj1)) === JSON.stringify(sortObjectKeys(obj2));
    }
    
    // Helper function to sort object keys recursively for consistent comparison
    function sortObjectKeys(obj) {
        if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
            return obj;
        }
        const sorted = {};
        Object.keys(obj).sort().forEach(key => {
            sorted[key] = sortObjectKeys(obj[key]);
        });
        return sorted;
    }
    
    // Create normalized versions for comparison
    const expectedNormalized = expected.map(a => ({
        name: a.name,
        args: normalizeArgs(a.kwargs)
    }));
    
    const actualNormalized = actual.map(a => ({
        name: a.name,
        args: normalizeArgs(a.args)
    }));
    
    // Check for exact match (both names and arguments)
    const exactMatch = JSON.stringify(expectedNormalized.map(a => ({name: a.name, args: sortObjectKeys(a.args)}))) === 
                      JSON.stringify(actualNormalized.map(a => ({name: a.name, args: sortObjectKeys(a.args)})));
    
    // Count different types of matches
    let perfectMatches = 0;  // Both name and args match
    let nameOnlyMatches = 0; // Name matches but args don't
    let totalMatched = 0;    // Any kind of match
    
    const expectedCopy = [...expectedNormalized];
    const actualCopy = [...actualNormalized];
    const matchedIndices = new Set();
    
    // First pass: find perfect matches (name + args)
    actualCopy.forEach((actualAction, actualIndex) => {
        const perfectMatchIndex = expectedCopy.findIndex((expectedAction, expectedIndex) => 
            !matchedIndices.has(expectedIndex) &&
            actualAction.name === expectedAction.name && 
            deepEqual(actualAction.args, expectedAction.args)
        );
        
        if (perfectMatchIndex !== -1) {
            perfectMatches++;
            totalMatched++;
            matchedIndices.add(perfectMatchIndex);
        }
    });
    
    // Second pass: find name-only matches for remaining actions
    actualCopy.forEach((actualAction, actualIndex) => {
        // Skip if this actual action already had a perfect match
        const alreadyPerfectMatch = expectedCopy.some((expectedAction, expectedIndex) => 
            matchedIndices.has(expectedIndex) &&
            actualAction.name === expectedAction.name && 
            deepEqual(actualAction.args, expectedAction.args)
        );
        
        if (!alreadyPerfectMatch) {
            const nameMatchIndex = expectedCopy.findIndex((expectedAction, expectedIndex) => 
                !matchedIndices.has(expectedIndex) &&
                actualAction.name === expectedAction.name
            );
            
            if (nameMatchIndex !== -1) {
                nameOnlyMatches++;
                totalMatched++;
                matchedIndices.add(nameMatchIndex);
            }
        }
    });
    
    const missing = expectedNormalized.length - totalMatched;
    const extra = actualNormalized.length - totalMatched;
    
    // Check if order is wrong (if we have matches but not exact sequence)
    const wrongOrder = totalMatched > 0 && !exactMatch && missing === 0 && extra === 0;
    
    return {
        exactMatch,
        matched: totalMatched,
        perfectMatches,
        nameOnlyMatches,
        missing,
        extra,
        wrongOrder
    };
}

// Calculate detailed action matching for highlighting
function calculateActionMatching(expectedActions, result) {
    const actualActions = extractActualActions(result);
    
    // Helper function to normalize arguments for comparison
    function normalizeArgs(args) {
        if (typeof args === 'string') {
            try {
                return JSON.parse(args);
            } catch {
                return {};
            }
        }
        return args || {};
    }
    
    // Helper function to deeply compare two objects
    function deepEqual(obj1, obj2) {
        return JSON.stringify(sortObjectKeys(obj1)) === JSON.stringify(sortObjectKeys(obj2));
    }
    
    // Helper function to sort object keys recursively for consistent comparison
    function sortObjectKeys(obj) {
        if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
            return obj;
        }
        const sorted = {};
        Object.keys(obj).sort().forEach(key => {
            sorted[key] = sortObjectKeys(obj[key]);
        });
        return sorted;
    }
    
    // Create detailed matching maps
    const expectedMatching = {};
    const actualMatching = {};
    
    // Mark all as unmatched initially
    expectedActions.forEach((action, index) => {
        expectedMatching[index] = { 
            matched: false, 
            actionName: action.name, 
            type: 'missing',
            matchType: 'none'
        };
    });
    
    actualActions.forEach((action, index) => {
        actualMatching[index] = { 
            matched: false, 
            actionName: action.name, 
            type: 'extra',
            matchType: 'none'
        };
    });
    
    // First pass: find perfect matches (name + arguments)
    expectedActions.forEach((expectedAction, expectedIndex) => {
        if (expectedMatching[expectedIndex].matched) return;
        
        const matchingActualIndex = actualActions.findIndex((actualAction, actualIndex) => 
            !actualMatching[actualIndex].matched &&
            actualAction.name === expectedAction.name && 
            deepEqual(normalizeArgs(actualAction.args), normalizeArgs(expectedAction.kwargs))
        );
        
        if (matchingActualIndex !== -1) {
            expectedMatching[expectedIndex].matched = true;
            expectedMatching[expectedIndex].type = 'matched';
            expectedMatching[expectedIndex].matchType = 'perfect';
            actualMatching[matchingActualIndex].matched = true;
            actualMatching[matchingActualIndex].type = 'matched';
            actualMatching[matchingActualIndex].matchType = 'perfect';
        }
    });
    
    // Second pass: find name-only matches for remaining actions
    expectedActions.forEach((expectedAction, expectedIndex) => {
        if (expectedMatching[expectedIndex].matched) return;
        
        const matchingActualIndex = actualActions.findIndex((actualAction, actualIndex) => 
            !actualMatching[actualIndex].matched &&
            actualAction.name === expectedAction.name
        );
        
        if (matchingActualIndex !== -1) {
            expectedMatching[expectedIndex].matched = true;
            expectedMatching[expectedIndex].type = 'partial';
            expectedMatching[expectedIndex].matchType = 'name_only';
            actualMatching[matchingActualIndex].matched = true;
            actualMatching[matchingActualIndex].type = 'partial';
            actualMatching[matchingActualIndex].matchType = 'name_only';
        }
    });
    
    return {
        expected: expectedMatching,
        actual: actualMatching,
        expectedActions,
        actualActions
    };
}

// Export conversation functionality
function exportConversation() {
    if (!currentTaskData) {
        showStatus('No task selected to export', 'warning');
        return;
    }
    
    const { task_id, result, ground_truth } = currentTaskData;
    const messages = result.traj || result.messages || [];
    
    let exportText = `=== TASK ${task_id} EXPORT ===\n\n`;
    exportText += `User ID: ${ground_truth.user_id}\n`;
    exportText += `Reward: ${result.reward}\n`;
    exportText += `Status: ${result.reward > 0.001 ? 'SUCCESS' : 'FAILED'}\n\n`;
    
    exportText += `User Instruction:\n${ground_truth.instruction}\n\n`;
    
    exportText += `=== CONVERSATION ===\n`;
    messages.forEach((message, index) => {
        if (message.role === 'system') return; // Skip system messages
        
        exportText += `[${message.role.toUpperCase()}]: `;
        
        if (message.tool_calls && message.tool_calls.length > 0) {
            exportText += `TOOL CALLS:\n`;
            message.tool_calls.forEach(call => {
                exportText += `  - ${call.function?.name || 'unknown'}\n`;
                exportText += `    Args: ${call.function?.arguments || '{}'}\n`;
            });
        } else {
            exportText += `${message.content || ''}\n`;
        }
        
        exportText += '\n';
    });
    
    exportText += `=== GROUND TRUTH ===\n`;
    exportText += `Expected Actions:\n`;
    ground_truth.actions.forEach((action, index) => {
        exportText += `${index + 1}. ${action.name}\n`;
        exportText += `   Args: ${JSON.stringify(action.kwargs, null, 2)}\n`;
    });
    
    if (ground_truth.outputs && ground_truth.outputs.length > 0) {
        exportText += `\nExpected Outputs:\n`;
        ground_truth.outputs.forEach((output, index) => {
            exportText += `${index + 1}. ${output}\n`;
        });
    }
    
    // Download the text file
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `task_${task_id}_export.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showStatus(`Task ${task_id} exported successfully!`, 'success');
}

// Format tool result content (handle JSON/dict vs string)
function formatToolResult(content) {
    if (!content) return '<em class="text-muted">No result</em>';
    
    // Try to parse as JSON
    try {
        const parsed = JSON.parse(content);
        
        // If it's an object or array, format it nicely
        if (typeof parsed === 'object' && parsed !== null) {
            return formatObjectResult(parsed);
        } else {
            // If it's a simple value (string, number, boolean), display as-is
            return `<span class="simple-result">${escapeHtml(String(parsed))}</span>`;
        }
    } catch (e) {
        // Not valid JSON, treat as plain text
        return `<span class="simple-result">${escapeHtml(content)}</span>`;
    }
}

// Format tool result as JSON for collapsed display
function formatToolResultAsJson(content) {
    if (!content) return '<em class="text-muted">No result</em>';
    
    // Try to parse as JSON first to validate and pretty-print
    try {
        const parsed = JSON.parse(content);
        // Pretty-print the JSON with 2-space indentation
        const prettyJson = JSON.stringify(parsed, null, 2);
        return `<pre class="json-result"><code>${escapeHtml(prettyJson)}</code></pre>`;
    } catch (e) {
        // Not valid JSON, treat as plain text but still wrap in code block
        return `<pre class="json-result"><code>${escapeHtml(content)}</code></pre>`;
    }
}

// Format object/array results in human-friendly way
function formatObjectResult(obj) {
    if (Array.isArray(obj)) {
        if (obj.length === 0) {
            return '<em class="text-muted">Empty list</em>';
        }
        
        let html = '<div class="object-result"><strong>List:</strong><ul class="result-list">';
        obj.forEach((item, index) => {
            if (typeof item === 'object' && item !== null) {
                html += `<li><strong>Item ${index + 1}:</strong> ${formatNestedObject(item)}</li>`;
            } else {
                html += `<li>${escapeHtml(String(item))}</li>`;
            }
        });
        html += '</ul></div>';
        return html;
    } else {
        // It's an object
        const keys = Object.keys(obj);
        if (keys.length === 0) {
            return '<em class="text-muted">Empty object</em>';
        }
        
        let html = '<div class="object-result"><dl class="result-properties">';
        keys.forEach(key => {
            const value = obj[key];
            html += `<dt>${escapeHtml(key)}:</dt>`;
            
            if (typeof value === 'object' && value !== null) {
                html += `<dd>${formatNestedObject(value)}</dd>`;
            } else {
                html += `<dd>${escapeHtml(String(value))}</dd>`;
            }
        });
        html += '</dl></div>';
        return html;
    }
}

// Format nested objects (simplified for readability)
function formatNestedObject(obj) {
    if (Array.isArray(obj)) {
        if (obj.length === 0) return '<em>[]</em>';
        if (obj.length <= 3) {
            return `[${obj.map(item => escapeHtml(String(item))).join(', ')}]`;
        } else {
            return `[${obj.slice(0, 3).map(item => escapeHtml(String(item))).join(', ')}, ... (+${obj.length - 3} more)]`;
        }
    } else {
        const keys = Object.keys(obj);
        if (keys.length === 0) return '<em>{}</em>';
        if (keys.length <= 2) {
            return `{${keys.map(key => `${escapeHtml(key)}: ${escapeHtml(String(obj[key]))}`).join(', ')}}`;
        } else {
            const preview = keys.slice(0, 2).map(key => `${escapeHtml(key)}: ${escapeHtml(String(obj[key]))}`).join(', ');
            return `{${preview}, ... (+${keys.length - 2} more)}`;
        }
    }
}

// Async function to render Markdown content
async function renderMarkdownAsync(content, elementId) {
    try {
        const response = await fetch('/render-markdown', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content: content })
        });
        
        const data = await response.json();
        const element = document.getElementById(elementId);
        
        if (response.ok && element) {
            element.innerHTML = data.html;
        } else {
            // Fallback to escaped HTML if markdown rendering fails
            if (element) {
                element.innerHTML = escapeHtml(content);
            }
        }
    } catch (error) {
        // Fallback to escaped HTML on error
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = escapeHtml(content);
        }
    }
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
} 