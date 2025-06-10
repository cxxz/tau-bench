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
                if (actionInfo.matched) {
                    highlightClass = 'action-highlight-matched';
                } else if (actionInfo.type === 'extra') {
                    highlightClass = 'action-highlight-extra';
                } else {
                    highlightClass = 'action-highlight-unmatched';
                }
            }
            
            toolCallsHtml += createToolCallElement(call, highlightClass);
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
function createToolCallElement(toolCall, highlightClass = '') {
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
    
    return `
        <div class="tool-call ${highlightClass}">
            <div class="tool-call-header" onclick="toggleToolCall('${callId}')">
                <span class="tool-call-name">🔧 ${functionName}</span>
                <span class="tool-call-toggle" id="${callId}-toggle">Show Details</span>
            </div>
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

// Display ground truth information
function displayGroundTruth(groundTruth, actionMatching = null) {
    const container = document.getElementById('ground-truth-display');
    
    // Generate action comparison if we have current task data
    let comparisonHtml = '';
    if (currentTaskData && currentTaskData.result) {
        comparisonHtml = generateActionComparison(groundTruth.actions, currentTaskData.result);
    }
    
    let actionsHtml = '';
    if (groundTruth.actions && groundTruth.actions.length > 0) {
        actionsHtml = groundTruth.actions.map((action, index) => {
            const actionInfo = actionMatching && actionMatching.expected[index];
            let highlightClass = '';
            
            if (actionInfo) {
                if (actionInfo.matched) {
                    highlightClass = 'action-highlight-matched';
                } else if (actionInfo.type === 'missing') {
                    highlightClass = 'action-highlight-missing';
                } else {
                    highlightClass = 'action-highlight-unmatched';
                }
            }
            
            return `
                <div class="ground-truth-action ${highlightClass}">
                    <div class="ground-truth-action-name">🔧 ${index + 1}. ${action.name}</div>
                    <div class="ground-truth-args">${JSON.stringify(action.kwargs, null, 2)}</div>
                </div>
            `;
        }).join('');
    } else {
        actionsHtml = '<div class="text-muted">No actions expected</div>';
    }
    
    let outputsHtml = '';
    if (groundTruth.outputs && groundTruth.outputs.length > 0) {
        outputsHtml = `
            <div class="expected-outputs">
                <div class="expected-outputs-title">📤 Expected Outputs:</div>
                ${groundTruth.outputs.map(output => `
                    <div class="expected-output">${escapeHtml(output)}</div>
                `).join('')}
            </div>
        `;
    }
    
    container.innerHTML = `
        <div>
            ${comparisonHtml}
            
            <h6>⚙️ Expected Actions:</h6>
            ${actionsHtml}
            
            ${outputsHtml}
        </div>
    `;
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
        // Improved matching algorithm
        const comparison = compareActionSequences(expectedActions, actualActions);
        
        if (comparison.exactMatch) {
            comparisonHtml += '<div class="summary-item summary-success">✅ Perfect action sequence match</div>';
        } else {
            if (comparison.matched > 0) {
                comparisonHtml += `<div class="summary-item summary-success">✅ ${comparison.matched} actions matched</div>`;
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

// Compare action sequences with better matching
function compareActionSequences(expected, actual) {
    const expectedNames = expected.map(a => a.name);
    const actualNames = actual.map(a => a.name);
    
    // Check for exact match
    const exactMatch = JSON.stringify(expectedNames) === JSON.stringify(actualNames);
    
    // Count matches
    let matched = 0;
    const expectedCopy = [...expectedNames];
    const actualCopy = [...actualNames];
    
    // Remove matched actions
    actualCopy.forEach(name => {
        const index = expectedCopy.indexOf(name);
        if (index !== -1) {
            expectedCopy.splice(index, 1);
            matched++;
        }
    });
    
    const missing = expectedCopy.length;
    const extra = actualNames.length - matched;
    
    // Check if order is wrong (if we have matches but not exact)
    const wrongOrder = matched > 0 && !exactMatch && missing === 0 && extra === 0;
    
    return {
        exactMatch,
        matched,
        missing,
        extra,
        wrongOrder
    };
}

// Calculate detailed action matching for highlighting
function calculateActionMatching(expectedActions, result) {
    const actualActions = extractActualActions(result);
    const expectedNames = expectedActions.map(a => a.name);
    const actualNames = actualActions.map(a => a.name);
    
    // Create detailed matching maps
    const expectedMatching = {};
    const actualMatching = {};
    
    // Mark all as unmatched initially
    expectedActions.forEach((action, index) => {
        expectedMatching[index] = { matched: false, actionName: action.name, type: 'missing' };
    });
    
    actualActions.forEach((action, index) => {
        actualMatching[index] = { matched: false, actionName: action.name, type: 'extra' };
    });
    
    // Find matches (simple name-based matching)
    expectedActions.forEach((expectedAction, expectedIndex) => {
        const matchingActualIndex = actualActions.findIndex((actualAction, actualIndex) => 
            actualAction.name === expectedAction.name && !actualMatching[actualIndex].matched
        );
        
        if (matchingActualIndex !== -1) {
            expectedMatching[expectedIndex].matched = true;
            expectedMatching[expectedIndex].type = 'matched';
            actualMatching[matchingActualIndex].matched = true;
            actualMatching[matchingActualIndex].type = 'matched';
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