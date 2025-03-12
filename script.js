let checklist = [];
let draggedItem = null;
let isDirty = false;

// Проверяем, открыто ли окно как всплывающее
function isPopupWindow() {
    return window.opener !== null; // Если есть opener, значит это всплывающее окно
}

// Открываем страницу в новом окне с заданным размером
function openPageInNewWindow() {
    const width = 375; // Ширина окна
    const height = window.screen.availHeight; // Высота окна равна высоте экрана

    // Открываем страницу в новом окне
    const newWindow = window.open(
        window.location.href, // URL текущей страницы
        '_blank', // Открыть в новом окне
        `width=${width},height=${height},left=${(window.screen.availWidth - width) / 2},top=0` // Позиционируем окно по центру
    );

    // Если новое окно успешно открыто, закрываем текущее окно
    if (newWindow) {
        localStorage.setItem('popupOpened', 'true'); // Сохраняем флаг, что окно было открыто
        window.close();
    } else {
        alert('Пожалуйста, разрешите открытие всплывающих окон для этого сайта.');
    }
}

// Запускаем функцию только в основном окне и только при первом посещении
if (!isPopupWindow() && !localStorage.getItem('popupOpened')) {
    window.addEventListener('load', openPageInNewWindow);
}

function initialize() {
    // Проверяем наличие сохраненных данных
    const savedData = localStorage.getItem('checklist');
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            document.getElementById('header-text').innerText = data.title;
            if (data.title && data.title !== 'Мой Чек-лист') {
                document.getElementById('header').classList.remove('placeholder');
            }
            checklist = data.items;
            // Добавляем пустой элемент в конец, если его нет
            if (!checklist.length || checklist[checklist.length - 1].text) {
                checklist.push({ text: '', checked: false, subItems: [] });
            }
        } catch (e) {
            console.error('Ошибка при загрузке данных:', e);
            resetToDefault();
        }
    } else {
        resetToDefault();
    }
    renderChecklist();
}

function resetToDefault() {
    document.getElementById('header-text').innerText = 'Мой Чек-лист';
    document.getElementById('header').classList.add('placeholder');
    checklist = [{ text: '', checked: false, subItems: [] }];
}

function addItem() {
    checklist.push({ text: '', checked: false, subItems: [] });
    isDirty = true;
    renderChecklist();
}

function addSubItem(index) {
    const parentItem = checklist[index];
    parentItem.subItems.push({ 
        text: '', 
        checked: false 
    });
    updateParentCheckbox(index);
    isDirty = true;
    renderChecklist();
}

function deleteItem(index) {
    if (confirm('Вы уверены, что хотите удалить этот пункт?')) {
        checklist.splice(index, 1);
        isDirty = true;
        renderChecklist();
    }
}

function deleteSubItem(parentIndex, subIndex) {
    if (confirm('Вы уверены, что хотите удалить этот подпункт?')) {
        checklist[parentIndex].subItems.splice(subIndex, 1);
        updateParentCheckbox(parentIndex);
        isDirty = true;
        renderChecklist();
    }
}

function updateParentCheckbox(index) {
    const subItems = checklist[index].subItems;
    if (!subItems.length) return;

    // Проверяем, все ли дочерние пункты отмечены как marked
    const allMarked = subItems.length > 0 && subItems.every(sub => sub.marked);

    // Проверяем, все ли дочерние пункты отмечены как checked (и не marked)
    const allChecked = subItems.length > 0 && subItems.every(sub => sub.checked && !sub.marked);

    // Проверяем, есть ли хотя бы один marked или checked
    const anyMarked = subItems.some(sub => sub.marked);
    const anyChecked = subItems.some(sub => sub.checked && !sub.marked);

    if (allMarked) {
        // Если все дочерние пункты marked, родительский тоже marked
        checklist[index].marked = true;
        checklist[index].checked = false;
    } else if (allChecked) {
        // Если все дочерние пункты checked, родительский тоже checked
        checklist[index].checked = true;
        checklist[index].marked = false;
    } else if (anyMarked || anyChecked) {
        // Если есть хотя бы один marked или checked, родительский становится indeterminate
        checklist[index].checked = null;
        checklist[index].marked = false;
    } else {
        // Иначе родительский пункт не отмечен
        checklist[index].checked = false;
        checklist[index].marked = false;
    }

    isDirty = true;
    renderChecklist(); // Принудительно обновляем DOM
}

function handleRightClick(event, index, isSubItem = false, parentIndex = null) {
    event.preventDefault();
    const checkbox = event.target;

    if (checkbox.classList.contains('marked')) {
        // Если уже marked, снимаем отметку
        checkbox.classList.remove('marked');
        checkbox.checked = false;

        if (isSubItem) {
            checklist[parentIndex].subItems[index].checked = false;
            checklist[parentIndex].subItems[index].marked = false;
        } else {
            checklist[index].checked = false;
            checklist[index].marked = false;
            checklist[index].subItems.forEach(subItem => {
                subItem.checked = false;
                subItem.marked = false;
            });
        }
    } else {
        // Если не marked, отмечаем крестиком
        checkbox.classList.add('marked');
        checkbox.checked = false;

        if (isSubItem) {
            checklist[parentIndex].subItems[index].checked = false;
            checklist[parentIndex].subItems[index].marked = true;
        } else {
            checklist[index].checked = false;
            checklist[index].marked = true;
            checklist[index].subItems.forEach(subItem => {
                subItem.checked = false;
                subItem.marked = true;
            });
        }
    }

    isDirty = true;
    renderChecklist(); // Принудительно обновляем DOM

    // Обновляем родительский пункт, если это подпункт
    if (isSubItem) {
        updateParentCheckbox(parentIndex);
    } else {
        // Обновляем родительский пункт, даже если это не подпункт
        updateParentCheckbox(index);
    }
}

function editHeader() {
    const header = document.getElementById('header-text');
    header.setAttribute('contenteditable', 'true');
    
    // Временно убираем overflow: hidden и ellipsis при редактировании
    header.style.overflow = 'visible';
    header.style.textOverflow = 'clip';
    header.style.whiteSpace = 'normal';
    
    header.focus();
    
    // Выделяем весь текст при начале редактирования
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(header);
    selection.removeAllRanges();
    selection.addRange(range);
    
    header.addEventListener('blur', saveHeader);
    header.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            header.blur();
        }
    });
}

function saveHeader() {
    const header = document.getElementById('header-text');
    const text = header.innerText.trim();
    
    // Восстанавливаем первоначальные стили
    header.style.overflow = '';
    header.style.textOverflow = '';
    header.style.whiteSpace = '';
    
    if (text === '') {
        header.innerText = 'Мой Чек-лист'; // Возвращаем плейсхолдер, если текст пустой
        document.getElementById('header').classList.add('placeholder');
    } else {
        header.innerText = text;
        document.getElementById('header').classList.remove('placeholder');
    }
    header.removeAttribute('contenteditable');
    isDirty = true;
    saveToLocalStorage();
    
    // Удаляем обработчики событий для предотвращения множественного срабатывания
    header.removeEventListener('blur', saveHeader);
}

function editItemText(element, index, isSubItem = false, parentIndex = null) {
    element.setAttribute('contenteditable', 'true');
    element.focus();
    
    // Выделяем весь текст или устанавливаем курсор, если пустой
    if (element.innerText !== 'Новый пункт' && element.innerText !== 'Новый подпункт') {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);
    } else {
        element.innerText = ''; // Очищаем плейсхолдер при редактировании
    }
    
    const saveFunction = function() {
        saveItemText(element, index, isSubItem, parentIndex);
    };
    
    element.addEventListener('blur', saveFunction, { once: true });
    element.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            element.blur();
        }
    });
    
    // Отключаем drag-and-drop во время редактирования
    const container = element.closest('.item, .sub-item');
    if (container) {
        container.draggable = false;
    }
}

function saveItemText(element, index, isSubItem, parentIndex) {
    const text = element.innerText.trim();

    if (isSubItem) {
        if (text === '') {
            checklist[parentIndex].subItems[index].text = 'Новый подпункт'; // Возвращаем плейсхолдер, если текст пустой
        } else {
            checklist[parentIndex].subItems[index].text = text;
        }
    } else {
        if (text === '') {
            checklist[index].text = 'Новый пункт'; // Возвращаем плейсхолдер, если текст пустой
        } else {
            checklist[index].text = text;

            // Если это был последний пункт, добавляем новый пустой пункт в конец списка
            if (index === checklist.length - 1) {
                checklist.push({ text: '', checked: false, subItems: [] });
            }
        }
    }

    element.removeAttribute('contenteditable');
    isDirty = true;
    renderChecklist();
    
    // Включаем drag-and-drop обратно
    const container = element.closest('.item, .sub-item');
    if (container) {
        container.draggable = true;
    }
}

function getCheckboxState(item) {
    if (item.marked) return 'marked';
    if (item.checked === null) return 'indeterminate';
    if (item.checked) return 'checked';
    return '';
}

function getCheckboxAria(item) {
    if (item.marked || item.checked === null) return 'mixed';
    return item.checked ? 'true' : 'false';
}

// SVG-иконки для состояний чекбокса
const checkboxIcons = {
    checked: `<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#fff"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg>`,
    marked: `<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#fff"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>`,
    indeterminate: `<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#fff"><path d="M240-440v-80h480v80H240Z"/></svg>`
};

// Генератор HTML для кастомного чекбокса с встроенным SVG
const checkboxHTML = (item, index, isSubItem = false, parentIndex = null) => {
    const click = isSubItem ? `toggleCheck(${index}, true, ${parentIndex})` : `toggleCheck(${index})`;
    const rclick = isSubItem ? `handleRightClick(event, ${index}, true, ${parentIndex})` : `handleRightClick(event, ${index})`;
    const state = getCheckboxState(item);
    const aria = getCheckboxAria(item);
    const icon = checkboxIcons[state] || '';

    return `<div class="custom-checkbox ${state}" tabindex="0" role="checkbox" aria-checked="${aria}"
                onclick="${click}" oncontextmenu="${rclick}">${icon}</div>`;
};

// Переопределённый renderChecklist
function renderChecklist() {
    const container = document.getElementById('checklist-items');
    container.innerHTML = '';

    checklist.slice(0, -1).forEach((item, index) => {
        container.innerHTML += `
            <div class="proto-item">
                <div class="item" draggable="true" ondragstart="dragStart(event, ${index}, null, false)" ondragover="dragOver(event, ${index}, null, false)" ondragend="dragEnd(event)" ondrop="drop(event, ${index}, null, false)">
                    <div class="drop-indicator top"></div>
                    ${checkboxHTML(item, index)}
                    <div class="text ${!item.text ? 'placeholder' : ''}" ondblclick="editItemText(this, ${index})">${item.text || 'Новый пункт'}</div>
                    <div class="controls">
                        <button onclick="addSubItem(${index})" title="Добавить подпункт">
                            <svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                        </button>
                        <button onclick="deleteItem(${index})" title="Удалить">
                            <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#e3e3e3"><path d="m400-325 80-80 80 80 51-51-80-80 80-80-51-51-80 80-80-80-51 51 80 80-80 80 51 51Zm-88 181q-29.7 0-50.85-21.15Q240-186.3 240-216v-480h-48v-72h192v-48h192v48h192v72h-48v479.57Q720-186 698.85-165T648-144H312Zm336-552H312v480h336v-480Zm-336 0v480-480Z"/>
                            </svg>
                        </button>
                    </div>
                    <div class="drop-indicator bottom"></div>
                </div>
                ${item.subItems.length > 0 ? `
                    <div class="sub-items-container">
                    ${item.subItems.map((subItem, subIndex) => `
                        <div class="sub-item" draggable="true" ondragstart="dragStart(event, ${index}, ${subIndex}, true)" ondragover="dragOver(event, ${index}, ${subIndex}, true)" ondragend="dragEnd(event)" ondrop="drop(event, ${index}, ${subIndex}, true)">
                            <div class="drop-indicator top"></div>
                            ${checkboxHTML(subItem, subIndex, true, index)}
                            <div class="text ${!subItem.text ? 'placeholder' : ''}" ondblclick="editItemText(this, ${subIndex}, true, ${index})">${subItem.text || 'Новый подпункт'}</div>
                            <div class="controls">
                                <button onclick="deleteSubItem(${index}, ${subIndex})" title="Удалить">
                                    <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#e3e3e3"><path d="m400-325 80-80 80 80 51-51-80-80 80-80-51-51-80 80-80-80-51 51 80 80-80 80 51 51Zm-88 181q-29.7 0-50.85-21.15Q240-186.3 240-216v-480h-48v-72h192v-48h192v48h192v72h-48v479.57Q720-186 698.85-165T648-144H312Zm336-552H312v480h336v-480Zm-336 0v480-480Z"/>
                                    </svg>
                                </button>
                            </div>
                            <div class="drop-indicator bottom"></div>
                        </div>
                    `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    });

    // Новый пункт
    const lastItem = checklist[checklist.length - 1];
    container.innerHTML += `
        <div class="proto-item">
            <div class="item">
                <div class="plus-icon" onclick="addNewItem()">
                    <svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                </div>
                <div class="text placeholder" ondblclick="editItemText(this, ${checklist.length - 1})">Новый пункт</div>
            </div>
        </div>
    `;
}

function toggleCheck(index, isSubItem = false, parentIndex = null) {
    if (isSubItem) {
        // Если это подпункт, обновляем его состояние
        checklist[parentIndex].subItems[index].checked = !checklist[parentIndex].subItems[index].checked;
        checklist[parentIndex].subItems[index].marked = false; // Снимаем marked при toggle
        updateParentCheckbox(parentIndex); // Обновляем родительский пункт
    } else {
        // Если это родительский пункт, обновляем его состояние и всех его подпунктов
        checklist[index].checked = !checklist[index].checked;
        checklist[index].marked = false; // Снимаем marked при toggle
        checklist[index].subItems.forEach(subItem => {
            subItem.checked = checklist[index].checked;
            subItem.marked = false; // Снимаем marked у всех подпунктов
        });
        updateParentCheckbox(index); // Обновляем родительский пункт
    }
    isDirty = true;
    renderChecklist(); // Принудительно обновляем DOM
}

// Функция для добавления нового пункта
function addNewItem() {
    const newItemIndex = checklist.length - 1;
    checklist[newItemIndex].text = 'Новый пункт';
    checklist.push({ text: '', checked: false, subItems: [] });
    isDirty = true;
    renderChecklist();
}

function dragStart(event, index, subIndex = null, isSubItem = false) {
    // Исключаем последний элемент из перетаскивания
    if (index === checklist.length - 1) {
        event.preventDefault();
        return;
    }
    
    draggedItem = { index, subIndex, isSubItem };
    event.dataTransfer.effectAllowed = 'move';
    event.currentTarget.classList.add('dragging');
}

function dragOver(event, index, subIndex = null, isSubItem = false) {
    // Исключаем последний элемент из перетаскивания
    if (index === checklist.length - 1) {
        event.preventDefault();
        return;
    }
    
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const offset = event.clientY - rect.top;
    const indicator = offset < rect.height / 2 ? 
        event.currentTarget.querySelector('.drop-indicator.top') : 
        event.currentTarget.querySelector('.drop-indicator.bottom');
        
    document.querySelectorAll('.drop-indicator').forEach(ind => ind.style.display = 'none');
    
    if (indicator) {
        indicator.style.display = 'block';
    }
}

function dragEnd(event) {
    event.currentTarget.classList.remove('dragging');
    document.querySelectorAll('.drop-indicator').forEach(ind => ind.style.display = 'none');
}

function drop(event, targetIndex, targetSubIndex = null, isTargetSubItem = false) {
    // Исключаем последний элемент из перетаскивания
    if (targetIndex === checklist.length - 1) {
        event.preventDefault();
        return;
    }
    
    event.preventDefault();
    if (draggedItem === null) return;
    
    const { index, subIndex, isSubItem } = draggedItem;
    
    // Предотвращаем перетаскивание элемента на самого себя
    if (index === targetIndex && subIndex === targetSubIndex && isSubItem === isTargetSubItem) {
        draggedItem = null;
        return;
    }
    
    // Перетаскивание основных пунктов
    if (!isSubItem && !isTargetSubItem) {
        const movedItem = checklist.splice(index, 1)[0];
        checklist.splice(targetIndex, 0, movedItem);
    } 
    // Перетаскивание подпунктов внутри одного родителя
    else if (isSubItem && isTargetSubItem && index === targetIndex) {
        const movedSubItem = checklist[index].subItems.splice(subIndex, 1)[0];
        checklist[index].subItems.splice(targetSubIndex, 0, movedSubItem);
        updateParentCheckbox(index);
    }
    // Перетаскивание подпункта в другой родительский пункт
    else if (isSubItem && isTargetSubItem && index !== targetIndex) {
        const movedSubItem = checklist[index].subItems.splice(subIndex, 1)[0];
        checklist[targetIndex].subItems.splice(targetSubIndex, 0, movedSubItem);
        updateParentCheckbox(index);
        updateParentCheckbox(targetIndex);
    }
    // Преобразование подпункта в основной пункт
    else if (isSubItem && !isTargetSubItem) {
        const movedSubItem = checklist[index].subItems.splice(subIndex, 1)[0];
        // Создаем новый основной пункт из подпункта
        const newItem = {
            text: movedSubItem.text,
            checked: movedSubItem.checked,
            subItems: []
        };
        checklist.splice(targetIndex, 0, newItem);
        updateParentCheckbox(index);
    }
    // Преобразование основного пункта в подпункт
    else if (!isSubItem && isTargetSubItem) {
        // Нельзя превратить пункт с подпунктами в подпункт
        if (checklist[index].subItems.length > 0) {
            alert('Нельзя превратить пункт с подпунктами в подпункт');
            draggedItem = null;
            return;
        }
        
        const movedItem = checklist.splice(index, 1)[0];
        // Создаем новый подпункт из основного пункта
        const newSubItem = {
            text: movedItem.text,
            checked: movedItem.checked
        };
        checklist[targetIndex].subItems.splice(targetSubIndex, 0, newSubItem);
        updateParentCheckbox(targetIndex);
    }
    
    isDirty = true;
    renderChecklist();
    draggedItem = null;
}

function saveToLocalStorage() {
    localStorage.setItem('checklist', JSON.stringify({
        title: document.getElementById('header-text').innerText,
        items: checklist
    }));
    isDirty = false;
}

function sanitizeFilename(filename) {
    return filename.replace(/[\\/:*?"<>|]/g, '_');
}

function saveToFile() {
    const title = document.getElementById('header-text').innerText.trim();
    const defaultFilename = 'Мой Чек-лист';
    const filename = title ? sanitizeFilename(title) : defaultFilename;

    const data = JSON.stringify({
        title: title || defaultFilename,
        items: checklist.slice(0, -1) // Не сохраняем последний пустой элемент
    }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    // Показываем уведомление
    showNotification('Чек-лист сохранен успешно!');
}

function showNotification(message) {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    // Добавляем в DOM
    document.body.appendChild(notification);
    
    // Показываем с анимацией
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Удаляем через 3 секунды
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function resetChecklist() {
    if (confirm('Вы уверены, что хотите сбросить все отметки?')) {
        checklist.forEach(item => {
            item.checked = false;
            item.marked = false;
            item.subItems.forEach(subItem => {
                subItem.checked = false;
                subItem.marked = false;
            });
        });
        isDirty = true;
        renderChecklist();
    }
}

function loadFromFile(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                document.getElementById('header-text').innerText = data.title || 'Мой Чек-лист';
                if (data.title && data.title !== 'Мой Чек-лист') {
                    document.getElementById('header').classList.remove('placeholder');
                } else {
                    document.getElementById('header').classList.add('placeholder');
                }
                
                // Загружаем данные и добавляем пустой элемент в конец
                checklist = data.items;
                if (!checklist.length || checklist[checklist.length - 1].text) {
                    checklist.push({ text: '', checked: false, subItems: [] });
                }
                
                isDirty = true;
                renderChecklist();
                
                // Показываем уведомление
                showNotification('Чек-лист загружен успешно!');
            } catch (e) {
                console.error('Ошибка при чтении файла:', e);
                alert('Ошибка при загрузке файла. Неверный формат.');
            }
        };
        reader.readAsText(file);
    }
}

// Обработчик перед закрытием страницы
window.addEventListener('beforeunload', function(event) {
    if (isDirty) {
        saveToLocalStorage();
    }
});

// Инициализация
window.addEventListener('load', initialize);