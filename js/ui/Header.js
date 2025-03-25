import Checklist from '../core/Checklist.js';
import Modal from './Modal.js';
import Notification from './Notification.js';

class Header {
  constructor(checklist, { onSave, onLoad, onReset, onPopup }) {
    this.checklist = checklist;
    this.onSave = onSave;
    this.onLoad = onLoad;
    this.onReset = onReset;
    this.onPopup = onPopup;
    
    // Элементы DOM
    this.element = document.getElementById('header');
    this.textElement = document.getElementById('header-text');
    this.buttonsContainer = document.getElementById('header-buttons');
    this.fileInput = document.getElementById('file-input');
    
    // Инициализация
    this.init();
  }

  init() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    this.textElement.textContent = this.checklist.title;
    this.element.classList.toggle('header--placeholder', this.checklist.title === 'Мой Чек-лист');
  }

  setupEventListeners() {
    // Редактирование заголовка по двойному клику
    this.element.addEventListener('dblclick', () => this.startEditing());
    
    // Обработка кликов по кнопкам через делегирование
    this.buttonsContainer.addEventListener('click', (e) => this.handleButtonClick(e));
    
    // Загрузка файла
    this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
  }

  handleButtonClick(event) {
    const button = event.target.closest('.button');
    if (!button) return;
    
    const action = button.dataset.action;
    
    switch(action) {
      case 'save':
        this.handleSave();
        break;
      case 'load':
        this.handleLoad();
        break;
      case 'reset':
        this.handleReset();
        break;
      case 'popup':
        this.handlePopup();
        break;
    }
  }

  handleSave() {
    try {
      this.onSave();
    } catch (error) {
      console.error('Ошибка при сохранении:', error);
      this.notification.show('Ошибка при сохранении', 'error');
    }
  }

  handleLoad() {
    this.fileInput.click();
  }

  handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      this.onLoad(file);
    } catch (error) {
      console.error('Ошибка при загрузке файла:', error);
      this.notification.show('Ошибка при загрузке файла', 'error');
    } finally {
      // Сброс значения input для возможности повторной загрузки того же файла
      event.target.value = '';
    }
  }

  handleReset() {
    try {
      this.onReset();
    } catch (error) {
      console.error('Ошибка при сбросе:', error);
      this.notification.show('Ошибка при сбросе', 'error');
    }
  }

  handlePopup() {
    try {
      this.onPopup();
    } catch (error) {
      console.error('Ошибка при открытии в новом окне:', error);
      this.notification.show('Браузер заблокировал всплывающее окно', 'warning');
    }
  }

  startEditing() {
    this.textElement.contentEditable = true;
    this.textElement.style.overflow = 'visible';
    this.textElement.style.textOverflow = 'clip';
    this.textElement.style.whiteSpace = 'normal';
    this.textElement.focus();

    // Выделяем весь текст
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(this.textElement);
    selection.removeAllRanges();
    selection.addRange(range);

    // Обработчики для завершения редактирования
    const finishEditing = () => this.finishEditing();
    this.textElement.addEventListener('blur', finishEditing, { once: true });
    this.textElement.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.textElement.blur();
      }
    });
  }

  finishEditing() {
    this.textElement.contentEditable = false;
    
    // Восстанавливаем стили
    this.textElement.style.overflow = '';
    this.textElement.style.textOverflow = '';
    this.textElement.style.whiteSpace = '';
    
    // Сохраняем изменения
    const newTitle = this.textElement.textContent.trim();
    this.checklist.title = newTitle || 'Мой Чек-лист';
    this.checklist.isDirty = true;
    this.checklist.save();
    
    // Обновляем отображение
    this.render();
  }
}

export default Header;