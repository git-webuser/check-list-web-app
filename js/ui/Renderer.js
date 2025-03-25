import ChecklistItem from '../core/ChecklistItem.js';

class Renderer {
  constructor(checklist) {
    this.checklist = checklist;
    this.container = document.getElementById('checklist-items');
    this.checkboxIcons = {
      checked: `<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#fff"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg>`,
      marked: `<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#fff"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>`,
      indeterminate: `<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#007bff"><path d="M240-440v-80h480v80H240Z"/></svg>`
    };
  }

  render() {
    this.container.innerHTML = '';
    this.checklist.items.forEach((item, index) => {
      if (index === this.checklist.items.length - 1) {
        this.renderAddItemButton(index);
      } else {
        this.renderItem(item, index);
      }
    });
  }

  renderItem(item, index) {
    const itemElement = document.createElement('div');
    itemElement.className = 'proto-item';
    itemElement.innerHTML = `
      <div class="item" draggable="true" data-index="${index}">
        <div class="drop-indicator drop-indicator--top"></div>
        ${this.renderCheckbox(item, index)}
        <div class="item__text ${!item.text ? 'item__text--placeholder' : ''}" 
             data-index="${index}">${item.text || 'Новый пункт'}</div>
        <div class="item__controls">
          <button class="item__control-button" data-action="add-subitem" data-index="${index}">
            <svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          </button>
          <button class="item__control-button" data-action="delete" data-index="${index}">
            <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px"><path d="m400-325 80-80 80 80 51-51-80-80 80-80-51-51-80 80-80-80-51 51 80 80-80 80 51 51Zm-88 181q-29.7 0-50.85-21.15Q240-186.3 240-216v-480h-48v-72h192v-48h192v48h192v72h-48v480q0 29.7-21.15 50.85Q698.85-144 648-144H312Zm336-552H312v480h336v-480Zm-336 0v480-480Z"/></svg>
          </button>
        </div>
        <div class="drop-indicator drop-indicator--bottom"></div>
      </div>
      ${item.subItems.length > 0 ? this.renderSubItems(item.subItems, index) : ''}
    `;
    this.container.appendChild(itemElement);
  }

  renderSubItems(subItems, parentIndex) {
    return `
      <div class="sub-items-container">
        ${subItems.map((subItem, subIndex) => `
          <div class="sub-item" draggable="true" data-parent-index="${parentIndex}" data-index="${subIndex}">
            <div class="drop-indicator drop-indicator--top"></div>
            ${this.renderCheckbox(subItem, subIndex, true, parentIndex)}
            <div class="sub-item__text ${!subItem.text ? 'sub-item__text--placeholder' : ''}" 
                 data-parent-index="${parentIndex}" data-index="${subIndex}">
              ${subItem.text || 'Новый подпункт'}
            </div>
            <div class="sub-item__controls">
              <button class="sub-item__control-button" data-action="delete-subitem" 
                      data-parent-index="${parentIndex}" data-index="${subIndex}">
                <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px"><path d="m400-325 80-80 80 80 51-51-80-80 80-80-51-51-80 80-80-80-51 51 80 80-80 80 51 51Zm-88 181q-29.7 0-50.85-21.15Q240-186.3 240-216v-480h-48v-72h192v-48h192v48h192v72h-48v480q0 29.7-21.15 50.85Q698.85-144 648-144H312Zm336-552H312v480h336v-480Zm-336 0v480-480Z"/></svg>
              </button>
            </div>
            <div class="drop-indicator drop-indicator--bottom"></div>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderCheckbox(item, index, isSubItem = false, parentIndex = null) {
    const state = item.marked ? 'marked' : 
                 item.checked === null ? 'indeterminate' : 
                 item.checked ? 'checked' : '';
    const icon = this.checkboxIcons[state] || '';
    
    return `
      <div class="custom-checkbox custom-checkbox--${state}" 
           data-index="${index}" 
           ${isSubItem ? `data-parent-index="${parentIndex}"` : ''}
           data-is-subitem="${isSubItem}">
        ${icon}
      </div>
    `;
  }

  renderAddItemButton() {
    const itemElement = document.createElement('div');
    itemElement.className = 'proto-item';
    itemElement.innerHTML = `
      <div class="item item--add">
        <div class="item__add-icon" data-action="add-item">
          <svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
        </div>
        <div class="item__text item__text--placeholder" data-action="add-item">Новый пункт</div>
      </div>
    `;
    this.container.appendChild(itemElement);
  }
}

export default Renderer;