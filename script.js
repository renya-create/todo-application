document.addEventListener('DOMContentLoaded', () => {
    // DOM要素
    const todoInput = document.getElementById('todo-input');
    const addButton = document.getElementById('add-button');
    const todoList = document.getElementById('todo-list');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const tasksCounter = document.getElementById('tasks-counter');
    const clearCompletedBtn = document.getElementById('clear-completed');

    // ローカルストレージからタスクを読み込む
    let todos = JSON.parse(localStorage.getItem('todos')) || [];
    let currentFilter = 'all';

    // タスクの初期表示
    renderTodos();
    updateTasksCounter();

    // タスク追加ボタンのイベントリスナー
    addButton.addEventListener('click', addTodo);
    
    // 入力フィールドでEnterキーを押したときのイベントリスナー
    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTodo();
        }
    });

    // フィルターボタンのイベントリスナー
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            document.querySelector('.filter-btn.active').classList.remove('active');
            button.classList.add('active');
            currentFilter = button.getAttribute('data-filter');
            renderTodos();
        });
    });

    // 完了したタスクをクリアするボタンのイベントリスナー
    clearCompletedBtn.addEventListener('click', () => {
        todos = todos.filter(todo => !todo.completed);
        saveTodos();
        renderTodos();
        updateTasksCounter();
    });

    // タスク追加関数
    function addTodo() {
        const text = todoInput.value.trim();
        if (text) {
            const todo = {
                id: Date.now(),
                text: text,
                completed: false
            };
            todos.push(todo);
            saveTodos();
            renderTodos();
            updateTasksCounter();
            todoInput.value = '';
            todoInput.focus();
        }
    }

    // タスク削除関数
    function deleteTodo(id) {
        todos = todos.filter(todo => todo.id !== id);
        saveTodos();
        renderTodos();
        updateTasksCounter();
    }

    // タスク完了状態切り替え関数
    function toggleComplete(id) {
        todos = todos.map(todo => {
            if (todo.id === id) {
                todo.completed = !todo.completed;
            }
            return todo;
        });
        saveTodos();
        renderTodos();
        updateTasksCounter();
    }

    // タスク表示関数
    function renderTodos() {
        todoList.innerHTML = '';
        
        // フィルタリング
        const filteredTodos = todos.filter(todo => {
            if (currentFilter === 'active') return !todo.completed;
            if (currentFilter === 'completed') return todo.completed;
            return true; // 'all'
        });

        // 各タスクの表示
        filteredTodos.forEach(todo => {
            const li = document.createElement('li');
            li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = todo.completed;
            checkbox.addEventListener('change', () => toggleComplete(todo.id));
            
            const span = document.createElement('span');
            span.className = 'todo-text';
            span.textContent = todo.text;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = '削除';
            deleteBtn.addEventListener('click', () => deleteTodo(todo.id));
            
            li.appendChild(checkbox);
            li.appendChild(span);
            li.appendChild(deleteBtn);
            todoList.appendChild(li);
        });
    }

    // 残りタスク数更新関数
    function updateTasksCounter() {
        const remainingTasks = todos.filter(todo => !todo.completed).length;
        tasksCounter.textContent = `${remainingTasks} タスク残っています`;
    }

    // ローカルストレージにタスクを保存
    function saveTodos() {
        localStorage.setItem('todos', JSON.stringify(todos));
    }
});