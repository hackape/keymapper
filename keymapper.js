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
var _combinator = '+';
var _context = 'global';
var _commandBuffer = {
  keys: [],
  command: null,
};
const _modifiersList = ['cmd','ctrl','shift','alt'];
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
  let _this = e || this;
  let modifiers = _modifiersList.reduce(function(ret, modifier) {
    var modKey = e ? modifier+'Key' : modifier;
    if (modKey === 'cmdKey') modKey = 'metaKey';
    if (_this[modKey]) ret.push(modifier);
    return ret;
  }, []);
  return modifiers.join(_combinator);
}

function keyEventToKeyCombination (e) {
  let modString = modifiersToString(e);
  if (!modString) modString = _modifiers.toString();
  _modifiers.reset();
  if (modString) {
    return [modString, keyCodeToKey[e.keyCode]].join(_combinator);
  } else {
    return keyCodeToKey[e.keyCode];
  }
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
      _commandBuffer.keys.push(keyEventToKeyCombination(e));
      _commandBuffer.command = {
        keyboardEvent: e,
        context: Keymapper.context || 'global'
      };
  }

  _lastTimeoutId = setTimeout(()=>{
    consumeCommandBuffer()
  }, 500);
}

function consumeCommandBuffer() {
  if (_commandBuffer.keys.length) {
    _commandBuffer.command.keys = _commandBuffer.keys.join(',');
    console.log(_commandBuffer.command.keys);
  }
  _modifiers.reset();
  _commandBuffer.keys.length = 0;
  _commandBuffer.command = null;
}

function normalizeKeyCombination (keyCombination) {
  keyCombination = keyCombination.toLowerCase().replace(/\s/g, '');
  const keyCombos = keyCombination.split(',');
  return keyCombos.map( keyCombo => {
    var pseudoKeyEvent = {};
    keyCombo.split(_combinator).forEach( key => {
      if (_modifiersList.indexOf(key) > -1) {
        if (key == 'cmd') key = 'meta';
        pseudoKeyEvent[`${key}Key`] = true;
      } else {
        pseudoKeyEvent.keyCode = keyToKeyCode[key];
      }
    });
    keyEventToKeyCombination(pseudoKeyEvent);
  }).join(_combinator);
}

export default class Keymapper {
  constructor(config={}) {
    if (!Keymapper.$$singleton) {
      const {combinator} = config;
      if (combinator && typeof combinator === 'string') {
        if (combinator!=='+' && combinator!=='-'){ throw Error('Keymapper: '+
          'Unrecognized combinator, only "+" or "-" is supported.')}
        _combinator = combinator;
      }

      this.add = this.map;
      this.keymaps = [];

      window.addEventListener('keydown', handleKeyEvent);
      Object.defineProperty(Keymapper, '$$singleton', {value: this});
    } else {
      return Keymapper.$$singleton;
    }
  }

  map(keyCombination, eventOrHandler) {
    if (typeof eventOrHandler === 'string') {
      var event = eventOrHandler;
    } else if (typeof eventOrHandler === 'function') {
      var handler = eventOrHandler;
    } else {
      return;
    }
  }

  registerKeymap(keyCombination) {
    keyCombination = normalizeKeyCombination(keyCombination);
  }

  loadKeymap() {}
}

