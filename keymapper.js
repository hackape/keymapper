import {keyCodeToKey, keyToKeyCode} from './keyCodeMap';

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

var _lastTimeoutId;
var _preferredCombinator = '+';
var _keysBuffer = [];

const _modifiers = {
  cmd: false,
  ctrl: false,
  shift: false,
  alt: false,
  reset: function() {
    this.cmd = this.ctrl = this.shift = this.alt = false;
  },
  toString: modifiersToString
};

function modifiersToString(e) {
  let _this = e || _modifiers;
  let modifiers = ['cmd','ctrl','shift','alt'].reduce((ret, modifier) => {
    var modKey = e ? modifier+'Key' : modifier;
    if (modKey === 'cmdKey') modKey = 'metaKey';
    if (_this[modKey]) ret.push(modifier);
    return ret;
  }, []);
  return modifiers.join(_preferredCombinator);
}
function handleKeyEvent(e) {
  clearTimeout(_lastTimeoutId);

  switch (e.key) {
    case 'Meta' || 'OS' :
      _modifiers.cmd = true;
      break;
    case 'Control':
      _modifiers.ctrl = true;
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
    consumeKeyBuffer()
  }, 0);
}

function consumeKeyBuffer() {
  _modifiers.reset();
  _keyBuffer.length = 0;
}



export default class Keymapper {
  static preferredCombinator = '+';

  constructor(config={}) {
    if (!Keymapper.$$singleton) {
      const {combinator} = config;
      if (combinator && typeof combinator === 'string') {
        if (combinator!=='+' && combinator!=='-'){ throw Error('Keymapper: '+
          'Unrecognized combinator, only "+" or "-" is supported.')}
        _preferredCombinator = combinator;
      }

      this.add = this.map;

      window.addEventListener('keydown', handleKeyEvent);
      Object.defineProperty(Keymapper, '$$singleton', {value: this});
    } else {
      return Keymapper.$$singleton;
    }
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
    const combinator = _preferredCombinator;
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
