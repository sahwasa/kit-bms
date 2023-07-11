const properties = [
	'direction',
	'boxSizing',
	'width',
	'height',
	'overflowX',
	'overflowY',

	'borderTopWidth',
	'borderRightWidth',
	'borderBottomWidth',
	'borderLeftWidth',
	'borderStyle',

	'paddingTop',
	'paddingRight',
	'paddingBottom',
	'paddingLeft',

	'fontStyle',
	'fontVariant',
	'fontWeight',
	'fontStretch',
	'fontSize',
	'fontSizeAdjust',
	'lineHeight',
	'fontFamily',

	'textAlign',
	'textTransform',
	'textIndent',
	'textDecoration',

	'letterSpacing',
	'wordSpacing',

	'tabSize',
	'MozTabSize',
]

const isFirefox = typeof window !== 'undefined' && window['mozInnerScreenX'] != null

/**
 * @param {HTMLTextAreaElement} element
 * @param {number} position
 */
function getDivSelectionStart(element) {
    let start = 0;
    if (typeof window.getSelection !== 'undefined') {
      const range = window.getSelection().getRangeAt(0);
      const preSelectionRange = range.cloneRange();
      preSelectionRange.selectNodeContents(element);
      preSelectionRange.setEnd(range.startContainer, range.startOffset);
      start = preSelectionRange.toString().length;
    }
    return start;
}
function setDivSelectionRange(element, start, end) {
  const range = document.createRange();
  range.setStart(element.firstChild, start);
  range.setEnd(element.firstChild, end);
  
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

function getCaretCoordinates(element, position) {
	const div = document.createElement('div')
	document.body.appendChild(div)

	const style = div.style
	const computed = getComputedStyle(element)

	style.whiteSpace = 'pre-wrap'
	style.wordWrap = 'break-word'
	style.position = 'absolute'
	style.visibility = 'hidden'

	properties.forEach(prop => {
		style[prop] = computed[prop]
	})

	if (isFirefox) {
		if (element.scrollHeight > parseInt(computed.height))
			style.overflowY = 'scroll'
	} else {
		style.overflow = 'hidden'
	}

  const elContent= element.innerText;
	// div.textContent = element.value.substring(0, position)
	div.textContent = elContent.substring(0, position)
	const span = document.createElement('span')
	span.textContent = elContent.substring(position) || '.'
	// span.textContent = element.value.substring(position) || '.'
	div.appendChild(span)

	const coordinates = {
		top: span.offsetTop + parseInt(computed['borderTopWidth']),
		left: span.offsetLeft + parseInt(computed['borderLeftWidth']),
		// height: parseInt(computed['lineHeight'])
		height: span.offsetHeight
	}

	div.remove()

	return coordinates
}

class Mentionify {
  constructor(ref, menuRef, resolveFn, replaceFn, menuItemFn) {
    this.ref = ref
    this.menuRef = menuRef
    this.resolveFn = resolveFn
    this.replaceFn = replaceFn
    this.menuItemFn = menuItemFn
    this.options = []
    
    this.makeOptions = this.makeOptions.bind(this)
    this.closeMenu = this.closeMenu.bind(this)
    this.selectItem = this.selectItem.bind(this)
    this.onInput = this.onInput.bind(this)
    this.onKeyDown = this.onKeyDown.bind(this)
    this.renderMenu = this.renderMenu.bind(this)
    
    this.ref.addEventListener('input', this.onInput)
    this.ref.addEventListener('keydown', this.onKeyDown)
  }
  
  async makeOptions(query) {
    const options = await this.resolveFn(query)
    if (options.lenght !== 0) {
      this.options = options
      this.renderMenu()
    } else {
      this.closeMenu()
    }
  }
  
  closeMenu() {
    setTimeout(() => {
      this.options = []
      this.left = undefined
      this.top = undefined
      this.triggerIdx = undefined
      this.renderMenu()
    }, 0)
  }
  
  selectItem(active) {
    return () => {
      var refVal = this.ref.innerText; //this.ref.value 대체
      const preMention = refVal.substr(0, this.triggerIdx)
      const option = this.options[active]
      const mention = this.replaceFn(option, refVal[this.triggerIdx])
      // const postMention = refVal.substr(this.ref.selectionStart)
      const postMention = refVal.substr(getDivSelectionStart(this.ref))
      const newValue = `${preMention}${mention}${postMention}`
      this.ref.innerText = newValue
      const caretPosition = this.ref.innerText.length - postMention.length
      // this.ref.setSelectionRange(caretPosition, caretPosition)
      setDivSelectionRange(this.ref,caretPosition, caretPosition)
      this.closeMenu()
      this.ref.focus()
    }
  }
  
  onInput(ev) {
    // const positionIndex = this.ref.selectionStart
    const positionIndex = getDivSelectionStart(this.ref)
    // const textBeforeCaret = this.ref.value.slice(0, positionIndex)
    const textBeforeCaret = this.ref.innerText.slice(0, positionIndex)
    const tokens = textBeforeCaret.split(/\s/)
    const lastToken = tokens[tokens.length - 1]
    const triggerIdx = textBeforeCaret.endsWith(lastToken)
      ? textBeforeCaret.length - lastToken.length
      : -1
    const maybeTrigger = textBeforeCaret[triggerIdx]
    const keystrokeTriggered = maybeTrigger === '@'
    
    if (!keystrokeTriggered) {
      this.closeMenu()
      return
    }
    
    const query = textBeforeCaret.slice(triggerIdx + 1)
    this.makeOptions(query)
    
    const coords = getCaretCoordinates(this.ref, positionIndex)
    const { top, left } = this.ref.getBoundingClientRect()
    
    setTimeout(() => {
      this.active = 0
      this.left = window.scrollX  + coords.left + left + this.ref.scrollLeft
      this.top = window.scrollY +  coords.top + top + coords.height - this.ref.scrollTop
      this.triggerIdx = triggerIdx
      this.renderMenu()
    }, 0)
  }
  
  onKeyDown(ev) {
    let keyCaught = false
    if (this.triggerIdx !== undefined) {
      switch (ev.key) {
        case 'ArrowDown':
          this.active = Math.min(this.active + 1, this.options.length - 1)
          this.renderMenu()
          keyCaught = true
          break
        case 'ArrowUp':
          this.active = Math.max(this.active - 1, 0)
          this.renderMenu()
          keyCaught = true
          break
        case 'Enter':
        case 'Tab':
          this.selectItem(this.active)()
          keyCaught = true
          break
      }
    }
    
    if (keyCaught) {
      ev.preventDefault()
    }
  }
  
  renderMenu() {  
    if (this.top === undefined) {
      this.menuRef.hidden = true
      return
    }
    
    this.menuRef.style.left = this.left + 'px'
    this.menuRef.style.top = this.top + 'px'
    this.menuRef.innerHTML = ''
    
    this.options.forEach((option, idx) => {
      this.menuRef.appendChild(this.menuItemFn(
        option,
        this.selectItem(idx),
        this.active === idx))
    })
    
    this.menuRef.hidden = false
  }
}

const users = [
  { username: '김길동' },
  { username: '이개발' },
  { username: '산토끼' },
]

const resolveFn = prefix => prefix === ''
  ? users
  : users.filter(user => user.username.startsWith(prefix))

const replaceFn = (user, trigger) => `${trigger}${user.username}`

const menuItemFn = (user, setItem, selected) => {
  const div = document.createElement('div')
  div.setAttribute('role', 'option')
  div.className = 'menu-item'
  if (selected) {
    div.classList.add('selected')
    div.setAttribute('aria-selected', '')
  }
  div.textContent = user.username
  div.onclick = setItem
  return div
}

new Mentionify(
  document.getElementById('textarea'),
  document.getElementById('menu'),
  resolveFn,
  replaceFn,
  menuItemFn
)
