// Todo App Implementation
const todoApp = {
    // Properties to store DOM elements and state
    elements: {},
    storageKey: 'myTodoAppItems',
    draggedItem: null,

    // Initialize the application
    init() {
        console.log('Todo App initialized');
        this.cacheDomElements();
        this.bindEvents();
        this.loadTodosFromStorage();
        this.updateTodoCount();
        this.updateItemNumbers();
    },

    // Cache DOM elements for better performance
    cacheDomElements() {
        console.log('Caching DOM elements');
        
        // Store elements we need for adding todos
        this.elements = {
            form: document.querySelector('#todoForm'),
            input: document.querySelector('.todo-input'),
            list: document.querySelector('.todo-list'),
            todoTemplate: document.querySelector('.todo-item-container.template'),
            counter: document.querySelector('#itemsRemaining')
        };

        // Log elements to verify they're found
        console.log('Cached elements:', this.elements);
    },

    // Load todos from localStorage
    loadTodosFromStorage() {
        console.log('Loading todos from storage');
        
        const savedTodos = localStorage.getItem(this.storageKey);
        if (savedTodos) {
            const todos = JSON.parse(savedTodos);
            todos.forEach(todo => {
                this.createTodoItem(todo.text, todo.completed);
            });
            // Update item numbers after loading
            this.updateItemNumbers();
        }
    },

    // Save todos to localStorage
    saveTodosToStorage() {
        console.log('Saving todos to storage');
        
        // Get all non-template todos
        const todoElements = Array.from(this.elements.list.querySelectorAll('.todo-item-container:not(.template)'));
        
        // Convert to simple objects for storage
        const todos = todoElements.map(todoElement => ({
            text: todoElement.querySelector('.todo-item-label').textContent,
            completed: todoElement.querySelector('.todo-check').checked
        }));
        
        // Save to localStorage
        localStorage.setItem(this.storageKey, JSON.stringify(todos));
    },

    // Bind event listeners
    bindEvents() {
        console.log('Binding events');
        
        // Bind form submit event
        this.elements.form.addEventListener('submit', this.handleSubmit.bind(this));

        // Bind todo list events using event delegation
        this.elements.list.addEventListener('click', this.handleTodoClick.bind(this));
        this.elements.list.addEventListener('dblclick', this.handleTodoDoubleClick.bind(this));

        // Bind drag and drop events using event delegation
        this.elements.list.addEventListener('dragstart', this.handleDragStart.bind(this));
        this.elements.list.addEventListener('dragend', this.handleDragEnd.bind(this));
        this.elements.list.addEventListener('dragover', this.handleDragOver.bind(this));
        this.elements.list.addEventListener('drop', this.handleDrop.bind(this));
        this.elements.list.addEventListener('dragenter', this.handleDragEnter.bind(this));
        this.elements.list.addEventListener('dragleave', this.handleDragLeave.bind(this));
    },

    // Handle drag start
    handleDragStart(event) {
        const todoItem = event.target.closest('.todo-item-container');
        if (!todoItem || todoItem.classList.contains('template')) return;

        this.draggedItem = todoItem;
        todoItem.classList.add('dragging');
        
        // Required for Firefox
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', ''); // Required for Firefox
    },

    // Handle drag end
    handleDragEnd(event) {
        if (this.draggedItem) {
            this.draggedItem.classList.remove('dragging');
            this.draggedItem = null;

            // Remove all drag-over classes
            const dragOverItems = this.elements.list.querySelectorAll('.drag-over');
            dragOverItems.forEach(item => item.classList.remove('drag-over'));
        }
    },

    // Handle drag over
    handleDragOver(event) {
        event.preventDefault(); // Required for drop to work
        const todoItem = event.target.closest('.todo-item-container');
        if (!todoItem || todoItem.classList.contains('template')) return;

        event.dataTransfer.dropEffect = 'move';

        // Remove drag-over class from all items
        const dragOverItems = this.elements.list.querySelectorAll('.drag-over');
        dragOverItems.forEach(item => {
            if (item !== todoItem) {
                item.classList.remove('drag-over');
            }
        });

        // Add drag-over class to current item if it's not the dragged item
        if (todoItem !== this.draggedItem) {
            todoItem.classList.add('drag-over');
        }
    },

    // Handle drag enter
    handleDragEnter(event) {
        const todoItem = event.target.closest('.todo-item-container');
        if (!todoItem || todoItem.classList.contains('template') || todoItem === this.draggedItem) return;

        // Remove drag-over class from all items except current
        const dragOverItems = this.elements.list.querySelectorAll('.drag-over');
        dragOverItems.forEach(item => {
            if (item !== todoItem) {
                item.classList.remove('drag-over');
            }
        });

        todoItem.classList.add('drag-over');
    },

    // Handle drag leave
    handleDragLeave(event) {
        const todoItem = event.target.closest('.todo-item-container');
        const relatedTarget = event.relatedTarget?.closest('.todo-item-container');
        
        // Only remove the class if we're not entering another part of the same todo item
        if (todoItem && !todoItem.contains(relatedTarget)) {
            todoItem.classList.remove('drag-over');
        }
    },

    // Handle drop
    handleDrop(event) {
        event.preventDefault();
        const dropTarget = event.target.closest('.todo-item-container');
        
        if (!dropTarget || !this.draggedItem || dropTarget === this.draggedItem || dropTarget.classList.contains('template')) {
            return;
        }

        // Remove drag-over class
        dropTarget.classList.remove('drag-over');

        // Get all todo items for calculating position
        const todos = Array.from(this.elements.list.querySelectorAll('.todo-item-container:not(.template)'));
        const fromIndex = todos.indexOf(this.draggedItem);
        const toIndex = todos.indexOf(dropTarget);

        // Reorder elements
        if (fromIndex < toIndex) {
            dropTarget.parentNode.insertBefore(this.draggedItem, dropTarget.nextElementSibling);
        } else {
            dropTarget.parentNode.insertBefore(this.draggedItem, dropTarget);
        }

        // Update item numbers
        this.updateItemNumbers();

        // Save the new order
        this.saveTodosToStorage();
    },

    // Handle form submission
    handleSubmit(event) {
        // Prevent form from submitting to server
        event.preventDefault();
        
        // Get input value and trim whitespace
        const todoText = this.elements.input.value.trim();
        
        // Validate input
        if (todoText === '') {
            console.log('Empty input, not creating todo');
            return; // Exit if empty
        }

        // Create and add the new todo
        this.createTodoItem(todoText, false);
        
        // Clear input field
        this.elements.input.value = '';
        
        // Focus back on input for next entry
        this.elements.input.focus();

        // Update the counter and storage
        this.updateTodoCount();
        this.saveTodosToStorage();
    },

    // Create new todo item
    createTodoItem(todoText, completed = false) {
        console.log('Creating new todo:', todoText, 'completed:', completed);

        // Clone the template
        const newTodo = this.elements.todoTemplate.cloneNode(true);
        
        // Remove template class
        newTodo.classList.remove('template');
        
        // Update the todo text
        const todoLabel = newTodo.querySelector('.todo-item-label');
        const editInput = newTodo.querySelector('.todo-edit-input');
        todoLabel.textContent = todoText;
        editInput.value = todoText;
        
        // Set initial state
        const checkbox = newTodo.querySelector('.todo-check');
        checkbox.checked = completed;
        todoLabel.classList.toggle('line-through', completed);
        
        // Add the new todo to the list
        this.addTodoToList(newTodo);
        
        // Update item numbers
        this.updateItemNumbers();
    },

    // Add todo item to the list
    addTodoToList(todoItem) {
        console.log('Adding todo to list');
        
        // Add to the list
        this.elements.list.appendChild(todoItem);
    },

    // Handle clicks within todo list (event delegation)
    handleTodoClick(event) {
        const target = event.target;

        // Check if clicked element is a checkbox
        if (target.classList.contains('todo-check')) {
            this.toggleTodo(target);
        }
        // Check if clicked element is a delete button
        else if (target.classList.contains('x-button')) {
            // Don't allow deleting the template
            const todoItem = target.closest('.todo-item-container');
            if (!todoItem.classList.contains('template')) {
                this.deleteTodo(target);
            }
        }
    },

    // Handle double-click for editing
    handleTodoDoubleClick(event) {
        const target = event.target;
        
        // Only handle double-clicks on the label
        if (target.classList.contains('todo-item-label')) {
            const todoItem = target.closest('.todo-item-container');
            if (!todoItem.classList.contains('template')) {
                this.startEditing(todoItem);
            }
        }
    },

    // Start editing a todo item
    startEditing(todoItem) {
        // Add editing class to show input
        todoItem.classList.add('editing');
        
        // Get the edit input
        const editInput = todoItem.querySelector('.todo-edit-input');
        
        // Focus and select all text
        editInput.focus();
        editInput.select();
        
        // Handle saving on enter and canceling on escape
        const handleKeyDown = (event) => {
            if (event.key === 'Enter') {
                this.saveEdit(todoItem);
            } else if (event.key === 'Escape') {
                this.cancelEdit(todoItem);
            }
        };
        
        // Handle saving on blur
        const handleBlur = () => {
            this.saveEdit(todoItem);
        };
        
        // Add event listeners
        editInput.addEventListener('keydown', handleKeyDown);
        editInput.addEventListener('blur', handleBlur);
        
        // Store listeners for cleanup
        editInput._handleKeyDown = handleKeyDown;
        editInput._handleBlur = handleBlur;
    },

    // Save todo edit
    saveEdit(todoItem) {
        const editInput = todoItem.querySelector('.todo-edit-input');
        const todoLabel = todoItem.querySelector('.todo-item-label');
        const newText = editInput.value.trim();
        
        if (newText !== '') {
            todoLabel.textContent = newText;
            this.saveTodosToStorage();
        }
        
        // Remove editing class
        todoItem.classList.remove('editing');
        
        // Clean up event listeners
        editInput.removeEventListener('keydown', editInput._handleKeyDown);
        editInput.removeEventListener('blur', editInput._handleBlur);
    },

    // Cancel todo edit
    cancelEdit(todoItem) {
        const editInput = todoItem.querySelector('.todo-edit-input');
        const todoLabel = todoItem.querySelector('.todo-item-label');
        
        // Restore original text
        editInput.value = todoLabel.textContent;
        
        // Remove editing class
        todoItem.classList.remove('editing');
        
        // Clean up event listeners
        editInput.removeEventListener('keydown', editInput._handleKeyDown);
        editInput.removeEventListener('blur', editInput._handleBlur);
    },

    // Toggle todo completion state
    toggleTodo(checkbox) {
        console.log('Toggling todo completion');
        
        // Get the todo text element
        const todoLabel = checkbox.nextElementSibling;
        
        // Toggle strike-through class based on checkbox state
        todoLabel.classList.toggle('line-through', checkbox.checked);

        // Update the counter and storage
        this.updateTodoCount();
        this.saveTodosToStorage();
    },

    // Delete todo item
    deleteTodo(deleteButton) {
        console.log('Deleting todo');
        
        // Find the todo item container (li element)
        const todoItem = deleteButton.closest('.todo-item-container');
        
        // Verify we found the todo item and it's not the template
        if (todoItem && !todoItem.classList.contains('template')) {
            // Remove the todo item with a fade-out effect
            todoItem.style.opacity = '0';
            todoItem.style.transition = 'opacity 0.3s ease';
            
            // Wait for animation to complete before removing
            setTimeout(() => {
                todoItem.remove();
                // Update the counter and storage after removal
                this.updateTodoCount();
                this.saveTodosToStorage();
                // Update item numbers
                this.updateItemNumbers();
            }, 300);
        }
    },

    // Update item numbers
    updateItemNumbers() {
        const todoItems = this.elements.list.querySelectorAll('.todo-item-container:not(.template)');
        todoItems.forEach((item, index) => {
            const numberSpan = item.querySelector('.item-number');
            numberSpan.textContent = `${index + 1}.`;
        });
    },

    // Calculate and update remaining todos count
    updateTodoCount() {
        console.log('Updating todo count');
        
        // Get all todo labels except the template
        const todoLabels = this.elements.list.querySelectorAll('.todo-item-label:not(.template *)');
        
        // Count items that aren't completed (don't have line-through)
        const remainingCount = Array.from(todoLabels)
            .filter(label => !label.classList.contains('line-through'))
            .length;
        
        // Update the counter display
        this.elements.counter.textContent = remainingCount;
        
        console.log('Remaining todos:', remainingCount);
    }
};

// Start the application
todoApp.init();