import Checklist from './core/Checklist.js';
import ChecklistItem from './core/ChecklistItem.js';
import Header from './ui/Header.js';
import Modal from './ui/Modal.js';
import Notification from './ui/Notification.js';
import Renderer from './ui/Renderer.js';

class ChecklistApp {
  constructor() {
    // Инициализация основных компонентов
    this.checklist = new Checklist();
    this.modal = new Modal();
    this.notification = new Notification();
    this.renderer = new Renderer(this.checklist);
    
    // Инициализация header с колбэками
    this.header = new Header(this.checklist, {
      onSave: () => this.saveToFile(),
      onLoad: (file) => this.loadFromFile(file),
      onReset: () => this.handleResetRequest(),
      onPopup: () => this.openInPopup()
    });
    
    // Настройка приложения
    this.initEventListeners();
    this.renderer.render();
    
    // Проверка, нужно ли открывать popup
    this.checkPopupWindow();
  }

  // Инициализация обработчиков событий
  initEventListeners() {
    // Обработчики для checklist
    document.getElementById('checklist-items').addEventListener('click', (e) => this.handleChecklistClick(e));
    document.getElementById('checklist-items').addEventListener('dblclick', (e) => this.handleItemDoubleClick(e));
    document.getElementById('checklist-items').addEventListener('contextmenu', (e) => this.handleRightClick(e));
    
    // Drag and drop
    document.getElementById('checklist-items').addEventListener('dragstart', (e) => this.handleDragStart(e));
    document.getElementById('checklist-items').addEventListener('dragover', (e) => this.handleDragOver(e));
    document.getElementById('checklist-items').addEventListener('dragend', (e) => this.handleDragEnd(e));
    document.getElementById('checklist-items').addEventListener('drop', (e) => this.handleDrop(e));

    // Перед закрытием страницы
    window.addEventListener('beforeunload', () => {
      if (this.checklist.isDirty) {
        this.checklist.save();
      }
    });

    // Обработчики для модальных окон
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-modal-confirm]')) {
        this.handleModalConfirm(e.target.dataset.modalConfirm);
      }
      if (e.target.matches('[data-modal-close]')) {
        this.modal.close(e.target.dataset.modalClose);
      }
    });
  }

  // === Методы для работы с файлами ===
  saveToFile() {
    try {
      const title = this.checklist.title.trim();
      const defaultFilename = 'Мой Чек-лист';
      const filename = title ? this.sanitizeFilename(title) : defaultFilename;

      const data = JSON.stringify({
        title: title || defaultFilename,
        items: this.checklist.items.filter(item => item.text)
      }, null, 2);

      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.json`;
      a.click();
      
      URL.revokeObjectURL(url);
      this.notification.show('Чек-лист сохранен успешно!');
    } catch (error) {
      console.error('Ошибка при сохранении файла:', error);
      this.notification.show('Ошибка при сохранении файла', 'error');
    }
  }

  loadFromFile(file) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        this.checklist.title = data.title || 'Мой Чек-лист';
        this.checklist.items = data.items.map(item => new ChecklistItem(item));
        this.checklist.addEmptyItemIfNeeded();
        this.checklist.isDirty = true;
        
        this.header.render();
        this.renderer.render();
        this.notification.show('Чек-лист загружен успешно!');
      } catch (error) {
        console.error('Ошибка при загрузке файла:', error);
        this.notification.show('Ошибка: неверный формат файла', 'error');
      }
    };
    
    reader.onerror = () => {
      this.notification.show('Ошибка при чтении файла', 'error');
    };
    
    reader.readAsText(file);
  }

  // === Методы для работы с модальными окнами ===
  handleResetRequest() {
    this.modal.open('reset');
  }

  handleModalConfirm(action) {
    switch(action) {
      case 'delete':
        this.checklist.deleteItem(window.deleteIndex);
        break;
      case 'delete-subitem':
        this.checklist.items[window.deleteSubItemParentIndex]
          .deleteSubItem(window.deleteSubItemIndex);
        break;
      case 'reset':
        this.checklist.resetAllChecks();
        break;
    }
    
    this.renderer.render();
    this.modal.close(`${action}-modal`);
  }

  // === Вспомогательные методы ===
  sanitizeFilename(filename) {
    return filename.replace(/[\\/:*?"<>|]/g, '_');
  }

  openInPopup() {
    const width = 375;
    const height = window.screen.availHeight;
    const left = (window.screen.availWidth - width) / 2;
    
    const newWindow = window.open(
      window.location.href,
      '_blank',
      `width=${width},height=${height},left=${left},top=0`
    );

    if (!newWindow) {
      this.notification.show('Разрешите всплывающие окна для этого сайта', 'warning');
    }
  }

  checkPopupWindow() {
    if (!window.opener && !localStorage.getItem('popupOpened')) {
      this.openInPopup();
      localStorage.setItem('popupOpened', 'true');
    }
  }

  // === Методы для работы с чек-листом ===
  handleChecklistClick(e) {
    // Обработка кликов по чекбоксам
    if (e.target.closest('.custom-checkbox')) {
      const checkbox = e.target.closest('.custom-checkbox');
      const index = parseInt(checkbox.dataset.index);
      const isSubItem = checkbox.dataset.isSubitem === 'true';
      const parentIndex = isSubItem ? parseInt(checkbox.dataset.parentIndex) : null;
      
      this.toggleCheck(index, isSubItem, parentIndex);
      return;
    }
    
    // Обработка кликов по кнопкам
    const button = e.target.closest('[data-action]');
    if (!button) return;
    
    const action = button.dataset.action;
    const index = parseInt(button.dataset.index);
    const parentIndex = button.dataset.parentIndex ? parseInt(button.dataset.parentIndex) : null;
    
    switch(action) {
      case 'add-item':
        this.checklist.addItem('Новый пункт');
        break;
      case 'add-subitem':
        this.checklist.items[index].addSubItem('Новый подпункт');
        break;
      case 'delete':
        window.deleteIndex = index;
        this.modal.open('delete-modal');
        break;
      case 'delete-subitem':
        window.deleteSubItemParentIndex = parentIndex;
        window.deleteSubItemIndex = index;
        this.modal.open('delete-subitem-modal');
        break;
    }
    
    this.renderer.render();
  }

  toggleCheck(index, isSubItem, parentIndex) {
    if (isSubItem) {
      this.checklist.items[parentIndex].subItems[index].toggleCheck();
      this.checklist.items[parentIndex].updateState();
    } else {
      this.checklist.items[index].toggleCheck();
    }
    
    this.checklist.isDirty = true;
    this.renderer.render();
  }

  handleItemDoubleClick(e) {
    const textElement = e.target.closest('.item__text, .sub-item__text');
    if (!textElement) return;

    textElement.contentEditable = true;
    textElement.focus();

    // Выделяем весь текст или очищаем плейсхолдер
    if (textElement.textContent === 'Новый пункт' || textElement.textContent === 'Новый подпункт') {
      textElement.textContent = '';
    } else {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(textElement);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    const finishEditing = () => this.finishItemEditing(textElement);
    textElement.addEventListener('blur', finishEditing, { once: true });
    textElement.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        textElement.blur();
      }
    });
  }

  finishItemEditing(textElement) {
    textElement.contentEditable = false;
    const newText = textElement.textContent.trim();
    const index = parseInt(textElement.dataset.index);
    const isSubItem = textElement.classList.contains('sub-item__text');
    const parentIndex = isSubItem ? parseInt(textElement.dataset.parentIndex) : null;

    if (isSubItem) {
      this.checklist.items[parentIndex].subItems[index].text = newText || 'Новый подпункт';
    } else {
      this.checklist.items[index].text = newText || 'Новый пункт';
      // Если редактировали последний пункт, добавляем новый
      if (index === this.checklist.items.length - 1) {
        this.checklist.addItem('');
      }
    }

    this.checklist.isDirty = true;
    this.renderer.render();
  }

  handleRightClick(e) {
    e.preventDefault();
    const checkbox = e.target.closest('.custom-checkbox');
    if (!checkbox) return;

    const index = parseInt(checkbox.dataset.index);
    const isSubItem = checkbox.dataset.isSubitem === 'true';
    const parentIndex = isSubItem ? parseInt(checkbox.dataset.parentIndex) : null;

    if (isSubItem) {
      this.checklist.items[parentIndex].subItems[index].toggleMark();
      this.checklist.items[parentIndex].updateState();
    } else {
      this.checklist.items[index].toggleMark();
    }

    this.checklist.isDirty = true;
    this.renderer.render();
  }

  handleDragStart(e) {
    const item = e.target.closest('.item, .sub-item');
    if (!item || item.classList.contains('item--add')) {
      e.preventDefault();
      return;
    }

    const index = parseInt(item.dataset.index);
    const isSubItem = item.classList.contains('sub-item');
    const parentIndex = isSubItem ? parseInt(item.dataset.parentIndex) : null;

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({
      index,
      isSubItem,
      parentIndex
    }));

    item.classList.add('dragging');
    this.draggedItem = { index, isSubItem, parentIndex };
  }

  handleDragOver(e) {
    e.preventDefault();
    const targetItem = e.target.closest('.item, .sub-item');
    if (!targetItem || targetItem.classList.contains('item--add')) return;

    const rect = targetItem.getBoundingClientRect();
    const offset = e.clientY - rect.top;
    const isTopHalf = offset < rect.height / 2;

    // Скрываем все индикаторы
    document.querySelectorAll('.drop-indicator').forEach(ind => {
      ind.style.display = 'none';
    });

    // Показываем нужный индикатор
    const indicator = isTopHalf 
      ? targetItem.querySelector('.drop-indicator--top')
      : targetItem.querySelector('.drop-indicator--bottom');
    
    if (indicator) {
      indicator.style.display = 'block';
    }
  }

  handleDragEnd(e) {
    const item = e.target.closest('.item, .sub-item');
    if (item) item.classList.remove('dragging');
    document.querySelectorAll('.drop-indicator').forEach(ind => {
      ind.style.display = 'none';
    });
    this.draggedItem = null;
  }

  handleDrop(e) {
    e.preventDefault();
    const targetItem = e.target.closest('.item, .sub-item');
    if (!targetItem || !this.draggedItem) return;

    // Получаем данные о перетаскиваемом элементе
    const { index: fromIndex, isSubItem: fromIsSubItem, parentIndex: fromParentIndex } = this.draggedItem;
    
    // Определяем позицию вставки
    const rect = targetItem.getBoundingClientRect();
    const offset = e.clientY - rect.top;
    const isTopHalf = offset < rect.height / 2;
    
    // Получаем данные о целевой позиции
    const targetIndex = parseInt(targetItem.dataset.index);
    const targetIsSubItem = targetItem.classList.contains('sub-item');
    const targetParentIndex = targetIsSubItem ? parseInt(targetItem.dataset.parentIndex) : null;

    // Скрываем индикаторы
    document.querySelectorAll('.drop-indicator').forEach(ind => {
      ind.style.display = 'none';
    });

    // Обработка разных сценариев перетаскивания
    try {
      // 1. Перемещение основного пункта
      if (!fromIsSubItem && !targetIsSubItem) {
        this.checklist.moveItem(fromIndex, isTopHalf ? targetIndex : targetIndex + 1);
      }
      // 2. Перемещение подпункта внутри одного родителя
      else if (fromIsSubItem && targetIsSubItem && fromParentIndex === targetParentIndex) {
        const subItems = this.checklist.items[fromParentIndex].subItems;
        const fromSubIndex = fromIndex;
        const toSubIndex = isTopHalf ? targetIndex : targetIndex + 1;
        
        if (fromSubIndex !== toSubIndex) {
          const [movedItem] = subItems.splice(fromSubIndex, 1);
          subItems.splice(toSubIndex, 0, movedItem);
          this.checklist.items[fromParentIndex].updateState();
        }
      }
      // 3. Перемещение подпункта в другой родительский пункт
      else if (fromIsSubItem && targetIsSubItem && fromParentIndex !== targetParentIndex) {
        const fromSubItems = this.checklist.items[fromParentIndex].subItems;
        const toSubItems = this.checklist.items[targetParentIndex].subItems;
        const toSubIndex = isTopHalf ? targetIndex : targetIndex + 1;
        
        const [movedItem] = fromSubItems.splice(fromIndex, 1);
        toSubItems.splice(toSubIndex, 0, movedItem);
        
        this.checklist.items[fromParentIndex].updateState();
        this.checklist.items[targetParentIndex].updateState();
      }
      // 4. Преобразование подпункта в основной пункт
      else if (fromIsSubItem && !targetIsSubItem) {
        const fromSubItems = this.checklist.items[fromParentIndex].subItems;
        const [movedSubItem] = fromSubItems.splice(fromIndex, 1);
        
        const newItem = new ChecklistItem({
          text: movedSubItem.text,
          checked: movedSubItem.checked,
          marked: movedSubItem.marked
        });
        
        this.checklist.items.splice(isTopHalf ? targetIndex : targetIndex + 1, 0, newItem);
        this.checklist.items[fromParentIndex].updateState();
      }
      // 5. Преобразование основного пункта в подпункт
      else if (!fromIsSubItem && targetIsSubItem) {
        // Нельзя преобразовать пункт с подпунктами
        if (this.checklist.items[fromIndex].subItems.length > 0) {
          this.modal.open('warning-modal');
          return;
        }
        
        const [movedItem] = this.checklist.items.splice(fromIndex, 1);
        const toSubItems = this.checklist.items[targetParentIndex].subItems;
        const toSubIndex = isTopHalf ? targetIndex : targetIndex + 1;
        
        toSubItems.splice(toSubIndex, 0, new ChecklistSubItem({
          text: movedItem.text,
          checked: movedItem.checked,
          marked: movedItem.marked
        }));
        
        this.checklist.items[targetParentIndex].updateState();
      }

      this.checklist.isDirty = true;
      this.renderer.render();
    } catch (error) {
      console.error('Ошибка при обработке перетаскивания:', error);
      this.notification.show('Ошибка при перемещении элемента', 'error');
    }
  }
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', () => {
  new ChecklistApp();
});