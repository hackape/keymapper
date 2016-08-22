import {keyCodeToKey, keyToKeyCode} from './keycodes';

var _keymaps = {global:{}};
var _commandHandlers = {};
var _lastTimeoutId;
var _combinator = '+';
var _context = 'global';
var _commandBuffer = {
  keys: [],
  command: null,
  reset: function() {
    this.keys.length = 0;
    this.command = null;
  },
  setCommand: function (command) {
    this.command = command;
  }
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
      _commandBuffer.setCommand({
        keyboardEvent: e,
        context: _context || 'global'
      });
  }

  _lastTimeoutId = setTimeout(()=>{
    consumeCommandBuffer()
  }, 500);
}

function consumeCommandBuffer() {
  if (_commandBuffer.keys.length) {
    _commandBuffer.command.keys = _commandBuffer.keys.join(',');
    dispatchCommand(_commandBuffer.command);
  }
  _modifiers.reset();
  _commandBuffer.reset();
}

function dispatchCommand(command) {
  var {keys, context} = command;
  if (!_keymaps[context]) context = 'global';
  if (!_keymaps[context][keys]) return;
  command.type = _keymaps[context][keys];
  if (typeof command.type === 'function') {
    command.$$handler = command.type;
    command.type = null;
  }
  handleCommand(command);
}

function handleCommand(command) {
  var handler = (command.type) ? _commandHandlers[command.type] : command.$$handler;
  if (!handler) return;
  handler(command);
}

function normalizeKeys (keys) {
  keys = keys.toLowerCase().replace(/\s/g, '');
  const keyCombos = keys.split(',');
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
    if (typeof pseudoKeyEvent.keyCode != 'number')
      throw Error(`Keymapper: Unrecognized key combination \`${keyCombo}\``);
    return keyEventToKeyCombination(pseudoKeyEvent);
  }).join(',');
}

export default class Keymapper {
  static setContext(context) {
    _context = context;
  }

  constructor(config={}) {
    if (!Keymapper.$$singleton) {
      const {combinator} = config;
      if (combinator && typeof combinator === 'string') {
        if (combinator!=='+' && combinator!=='-'){ throw Error('Keymapper: '+
          'Unrecognized combinator, only "+" or "-" is supported.')}
        _combinator = combinator;
      }

      this.add = this.map;

      window.addEventListener('keydown', handleKeyEvent);
      Object.defineProperty(Keymapper, '$$singleton', {value: this});
    } else {
      return Keymapper.$$singleton;
    }
  }

  map(keys, descriptor) {
    if (typeof descriptor === 'string') {
      var commandType = descriptor;
      descriptor = {command: commandType, context: 'global'};
    } else if (typeof descriptor === 'function') {
      var handler = descriptor;
      descriptor = {command: handler, context: 'global'};
    }
    if (!descriptor.command || !descriptor.context) return;
    keys = normalizeKeys(keys);
    if (!_keymaps[descriptor.context]) _keymaps[descriptor.context] = {};
    _keymaps[descriptor.context][keys] = descriptor.command;
  }

  loadKeymaps(keymaps) {}

  addCommandHandler(commandType, commandHandler) {
    _commandHandlers[commandType] = commandHandler;
  }

  loadCommandHandlers(commandHandlers, override) {
    _commandHandlers = override ? commandHandlers
      : Object.assign(_commandHandlers, commandHandlers);
  }

  setContext = Keymapper.setContext

}

