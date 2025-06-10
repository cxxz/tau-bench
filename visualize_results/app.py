from flask import Flask, render_template, request, jsonify, redirect, url_for
import json
import os
from werkzeug.utils import secure_filename
import sys
import importlib.util
import markdown

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max file size

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Global variables to store current data
current_results = None
ground_truth_tasks = None

def load_ground_truth():
    """Load ground truth tasks from tasks_test.py"""
    try:
        from tau_bench.envs.retail.tasks_test import TASKS_TEST
        return TASKS_TEST
    except Exception as e:
        print(f"Error loading ground truth: {e}")
        return None

def parse_results_file(filepath):
    """Parse the results JSON file"""
    try:
        with open(filepath, 'r') as f:
            results = json.load(f)
        return results
    except Exception as e:
        print(f"Error parsing results file: {e}")
        return None

def validate_filename(filename):
    """Validate that filename is a JSON file"""
    return filename.lower().endswith('.json')

def get_available_files():
    """Get list of available JSON files in uploads folder"""
    try:
        files = []
        upload_path = app.config['UPLOAD_FOLDER']
        
        if os.path.exists(upload_path):
            for filename in os.listdir(upload_path):
                if validate_filename(filename):
                    filepath = os.path.join(upload_path, filename)
                    if os.path.isfile(filepath):
                        # Get file size and modification time
                        stat = os.stat(filepath)
                        files.append({
                            'filename': filename,
                            'size': stat.st_size,
                            'modified': stat.st_mtime
                        })
        
        # Sort by modification time (newest first)
        files.sort(key=lambda x: x['modified'], reverse=True)
        return files
    except Exception as e:
        print(f"Error getting available files: {e}")
        return []

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/available-files')
def available_files():
    """Get list of available files in uploads folder"""
    files = get_available_files()
    return jsonify({
        'success': True,
        'files': files
    })

@app.route('/load-existing', methods=['POST'])
def load_existing_file():
    """Load an existing file from uploads folder"""
    global current_results, ground_truth_tasks
    
    data = request.get_json()
    if not data or 'filename' not in data:
        return jsonify({'error': 'No filename provided'}), 400
    
    filename = data['filename']
    
    # Validate filename for security
    if not validate_filename(filename):
        return jsonify({'error': 'Invalid file type. Only JSON files are allowed.'}), 400
    
    # Secure the filename and construct path
    secure_name = secure_filename(filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], secure_name)
    
    # Check if file exists
    if not os.path.exists(filepath):
        return jsonify({'error': 'File not found'}), 404
    
    # Parse results
    current_results = parse_results_file(filepath)
    if current_results is None:
        return jsonify({'error': 'Failed to parse results file'}), 400
    
    # Load ground truth
    ground_truth_tasks = load_ground_truth()
    if ground_truth_tasks is None:
        return jsonify({'error': 'Failed to load ground truth tasks'}), 400
    
    # Get available task IDs
    task_ids = [result['task_id'] for result in current_results]
    
    return jsonify({
        'success': True,
        'task_ids': task_ids,
        'total_tasks': len(current_results),
        'filename': filename,
        'source': 'existing'
    })

@app.route('/upload', methods=['POST'])
def upload_file():
    global current_results, ground_truth_tasks
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file selected'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not validate_filename(file.filename):
        return jsonify({'error': 'Invalid file type. Only JSON files are allowed.'}), 400
    
    # Save uploaded file
    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)
    
    # Parse results
    current_results = parse_results_file(filepath)
    if current_results is None:
        return jsonify({'error': 'Failed to parse results file'}), 400
    
    # Load ground truth
    ground_truth_tasks = load_ground_truth()
    if ground_truth_tasks is None:
        return jsonify({'error': 'Failed to load ground truth tasks'}), 400
    
    # Get available task IDs
    task_ids = [result['task_id'] for result in current_results]
    
    return jsonify({
        'success': True,
        'task_ids': task_ids,
        'total_tasks': len(current_results),
        'filename': filename,
        'source': 'upload'
    })

@app.route('/task/<int:task_id>')
def get_task(task_id):
    global current_results, ground_truth_tasks
    
    if current_results is None or ground_truth_tasks is None:
        return jsonify({'error': 'No data loaded'}), 400
    
    # Find the result for this task_id
    task_result = None
    for result in current_results:
        if result['task_id'] == task_id:
            task_result = result
            break
    
    if task_result is None:
        return jsonify({'error': f'Task {task_id} not found in results'}), 404
    
    # Get ground truth for this task
    if task_id >= len(ground_truth_tasks):
        return jsonify({'error': f'Task {task_id} not found in ground truth'}), 404
    
    ground_truth = ground_truth_tasks[task_id]
    
    # Prepare response data
    response_data = {
        'task_id': task_id,
        'result': task_result,
        'ground_truth': {
            'user_id': ground_truth.user_id,
            'instruction': ground_truth.instruction,
            'actions': [action.model_dump() for action in ground_truth.actions],
            'outputs': ground_truth.outputs
        }
    }
    
    return jsonify(response_data)

@app.route('/stats')
def get_stats():
    global current_results
    
    if current_results is None:
        return jsonify({'error': 'No data loaded'}), 400
    
    total_tasks = len(current_results)
    successful_tasks = sum(1 for result in current_results if result.get('reward', 0) > 0.001)
    failed_tasks = total_tasks - successful_tasks
    
    return jsonify({
        'total_tasks': total_tasks,
        'successful_tasks': successful_tasks,
        'failed_tasks': failed_tasks,
        'success_rate': (successful_tasks / total_tasks * 100) if total_tasks > 0 else 0
    })

@app.route('/tasks/filtered/<filter_type>')
def get_filtered_tasks(filter_type):
    global current_results
    
    if current_results is None:
        return jsonify({'error': 'No data loaded'}), 400
    
    if filter_type == 'all':
        filtered_results = current_results
    elif filter_type == 'failed':
        filtered_results = [r for r in current_results if r.get('reward', 0) <= 0.001]
    elif filter_type == 'success':
        filtered_results = [r for r in current_results if r.get('reward', 0) > 0.001]
    else:
        return jsonify({'error': 'Invalid filter type'}), 400
    
    task_data = []
    for result in filtered_results:
        task_id = result['task_id']
        if task_id < len(ground_truth_tasks):
            ground_truth = ground_truth_tasks[task_id]
            task_data.append({
                'task_id': task_id,
                'reward': result.get('reward', 0),
                'user_id': ground_truth.user_id,
                'success': result.get('reward', 0) > 0.001
            })
    
    return jsonify({
        'tasks': task_data,
        'total': len(task_data)
    })

@app.route('/render-markdown', methods=['POST'])
def render_markdown():
    """Render Markdown content to HTML"""
    try:
        data = request.get_json()
        if not data or 'content' not in data:
            return jsonify({'error': 'No content provided'}), 400
        
        markdown_content = data['content']
        
        # Configure markdown with safe extensions
        md = markdown.Markdown(extensions=['fenced_code', 'tables', 'nl2br'])
        html_content = md.convert(markdown_content)
        
        return jsonify({
            'success': True,
            'html': html_content
        })
    except Exception as e:
        return jsonify({'error': f'Failed to render markdown: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(host="0.0.0.0", debug=True, port=5678) 
