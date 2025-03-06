document.addEventListener('DOMContentLoaded', () => {
    // DOM要素
    const todoInput = document.getElementById('todo-input');
    const addButton = document.getElementById('add-button');
    const todoList = document.getElementById('todo-list');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const tasksCounter = document.getElementById('tasks-counter');
    const clearCompletedBtn = document.getElementById('clear-completed');
    const loginButton = document.getElementById('login-button');
    const logoutButton = document.getElementById('logout-button');
    const userInfo = document.getElementById('user-info');
    const loginContainer = document.getElementById('login-container');
    const userName = document.getElementById('user-name');


    const db = firebase.database();
    const auth = firebase.auth();
    const provider = new firebase.auth.GoogleAuthProvider();

    // ユーザーデータ
    let currentUser = null;
    let todos = [];
    let currentFilter = 'all';

    // 認証状態の監視
    auth.onAuthStateChanged(user => {
        if (user) {
            // ユーザーがログインしている場合
            currentUser = user;
            loginContainer.style.display = 'none';
            userInfo.style.display = 'block';
            userName.textContent = `${user.displayName || 'ユーザー'}さん`;
            
            // ユーザー固有のデータを読み込む
            loadTodos(user.uid);
        } else {
            // ユーザーがログアウトしている場合
            currentUser = null;
            loginContainer.style.display = 'block';
            userInfo.style.display = 'none';
            todos = [];
            renderTodos();
            updateTasksCounter();
        }
    });

    // ログインボタンのイベントリスナー
    loginButton.addEventListener('click', () => {
        auth.signInWithPopup(provider).catch(error => {
            console.error('ログインエラー:', error);
            alert('ログインに失敗しました。');
        });
    });

    // ログアウトボタンのイベントリスナー
    logoutButton.addEventListener('click', () => {
        auth.signOut().catch(error => {
            console.error('ログアウトエラー:', error);
        });
    });

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
        if (!currentUser) return;

        todos = todos.filter(todo => !todo.completed);
        saveTodos();
        renderTodos();
        updateTasksCounter();
    });

    // Firebase からタスクを読み込む
    function loadTodos(userId) {
        const userTodosRef = db.ref(`todos/${userId}`);
        
        userTodosRef.on('value', snapshot => {
            const data = snapshot.val();
            todos = data ? Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            })) : [];
            
            renderTodos();
            updateTasksCounter();
        });
    }

    // タスク追加関数
    function addTodo() {
        if (!currentUser) {
            alert('タスクを追加するにはログインしてください。');
            return;
        }
        
        const text = todoInput.value.trim();
        if (text) {
            // Firebase に新しいタスクを追加
            const newTodoRef = db.ref(`todos/${currentUser.uid}`).push();
            
            newTodoRef.set({
                text: text,
                completed: false,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });
            
            todoInput.value = '';
            todoInput.focus();
        }
    }

    // タスク削除関数
    function deleteTodo(id) {
        if (!currentUser) return;
        
        db.ref(`todos/${currentUser.uid}/${id}`).remove();
    }

    // タスク完了状態切り替え関数
    function toggleComplete(id) {
        if (!currentUser) return;
        
        const todoRef = db.ref(`todos/${currentUser.uid}/${id}`);
        const todo = todos.find(t => t.id === id);
        
        if (todo) {
            todoRef.update({
                completed: !todo.completed
            });
        }
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
        tasksCounter.textContent = `${remainingTasks} タスク残っています。`;
    }

    // Firebase にタスクを保存する関数（一括更新用）
    function saveTodos() {
        if (!currentUser) return;
        
        const updates = {};
        todos.forEach(todo => {
            updates[todo.id] = {
                text: todo.text,
                completed: todo.completed,
                createdAt: todo.createdAt || firebase.database.ServerValue.TIMESTAMP
            };
        });
        
        db.ref(`todos/${currentUser.uid}`).set(updates);
    }
});