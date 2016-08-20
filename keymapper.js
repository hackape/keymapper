// Polyfill from https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent
(function () {
  if ( typeof window.CustomEvent === "function" ) return false;
  function CustomEvent ( event, params ) {
    params = params || { bubbles: false, cancelable: false, detail: undefined };
    var evt = document.createEvent( 'CustomEvent' );
    evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
    return evt;
   }

  CustomEvent.prototype = window.Event.prototype;

  window.CustomEvent = CustomEvent;
})();

const KEYCODE = {
  backspace: 8, tab: 9, clear: 12,
  enter: 13, 'return': 13,
  esc: 27, escape: 27, space: 32,
  left: 37, up: 38,
  right: 39, down: 40,
  del: 46, 'delete': 46,
  home: 36, end: 35,
  pageup: 33, pagedown: 34,
  ',': 188, '.': 190, '/': 191,
  '`': 192, '-': 189, '=': 187,
  ';': 186, '\'': 222,
  '[': 219, ']': 221, '\\': 220
};
for(let k=1;k<20;k++) {KEYCODE['f'+k] = 111+k;} // f1 - f20


var _lastTimeoutId;
var _keyBuffer = [];
const _modifiers = {
  meta: false,
  control: false,
  shift: false,
  alt: false
};

const _resetModifers = () => {
  let m = _modifiers;
  m.meta = m.control = m.shift = m.alt = false;
}

export default class Keymapper {
  static preferredCombinator = '+';

  constructor(config={}) {
    if (!Keymapper.$$singleton) {
      const {combinator} = config;
      if (combinator && typeof combinator === 'string') {
        if (combinator!=='+' && combinator!=='-'){ throw Error('Keymapper: '+
          'Unrecognized combinator, only "+" or "-" is supported.')}
        Keymapper.preferredCombinator = combinator;
      }

      this.add = this.map;

      window.addEventListener('keydown', e => this.handleKeyEvent(e));
      Object.defineProperty(Keymapper, '$$singleton', {value: this});
    } else {
      return Keymapper.$$singleton;
    }
  }

  handleKeyEvent(e) {
    clearTimeout(_lastTimeoutId);
    _keyBuffer.push(e)

    switch (e.key) {
      case 'Meta' || 'OS' :
        _modifiers.meta = true;
        break;
      case 'Control':
        _modifiers.control = true;
        break;
      case 'Shift':
        _modifiers.shift = true;
        break;
      case 'Alt':
        _modifiers.alt = true;
        break;
      default:
        _keyBuffer.push(e);
    }

    _lastTimeoutId = setTimeout(()=>{
      this.consumeKeyBuffer()
      _keyBuffer.length = 0;
    }, 500);
  }

  consumeKeyBuffer() {
    _resetModifers();
    _keyBuffer.length = 0;
  }

  map(keymap, eventOrHandler) {
    if (typeof eventOrHandler === 'string') {
      var event = eventOrHandler;
    } else if (typeof eventOrHandler === 'function') {
      var handler = eventOrHandler;
    } else {
      return;
    }
    window.addEventListener(event, handler);
  }

  registerKeymap(keymap) {
    const combinator = Keymapper.preferredCombinator;
    keymap = keymap.toLowerCase().replace(/\s/g, '');
  }

  consumeKeymap(keymap) {
    var keyCombos = keymap.split(',');
    keyCombos.forEach( keyCombo => {
      var keys = keyCombo.split(combinator);
      keys.forEach()
    })
  }

  loadKeymap() {}
}
