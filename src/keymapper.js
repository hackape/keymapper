'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _keycodes = require('./keycodes');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _keymaps = { global: {} };
var _commandHandlers = {};
var _lastTimeoutId;
var _combinator = '+';
var _context = 'global';
var _commandBuffer = {
  keys: [],
  command: null,
  reset: function () {
    this.keys.length = 0;
    this.command = null;
  },
  setCommand: function (command) {
    this.command = command;
  }
};
var _modifiersList = ['cmd', 'ctrl', 'shift', 'alt'];
var _modifiers = {
  cmd: false,
  ctrl: false,
  shift: false,
  alt: false,
  reset: function () {
    this.cmd = this.ctrl = this.shift = this.alt = false;
  },
  toString: modifiersToString
};

function modifiersToString(e) {
  var _this = e || this;
  var modifiers = _modifiersList.reduce(function (ret, modifier) {
    var modKey = e ? modifier + 'Key' : modifier;
    if (modKey === 'cmdKey') modKey = 'metaKey';
    if (_this[modKey]) ret.push(modifier);
    return ret;
  }, []);
  return modifiers.join(_combinator);
}

function keyEventToKeyCombination(e) {
  var modString = modifiersToString(e);
  if (!modString) modString = _modifiers.toString();
  _modifiers.reset();
  if (modString) {
    return [modString, _keycodes.keyCodeToKey[e.keyCode]].join(_combinator);
  } else {
    return _keycodes.keyCodeToKey[e.keyCode];
  }
}

function handleKeyEvent(e) {
  clearTimeout(_lastTimeoutId);

  switch (e.key) {
    case 'Meta' || 'OS':
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

  _lastTimeoutId = setTimeout(function () {
    consumeCommandBuffer();
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
  var keys = command.keys;
  var context = command.context;

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
  var handler = command.type ? _commandHandlers[command.type] : command.$$handler;
  if (!handler) return;
  handler(command);
}

function normalizeKeys(keys) {
  keys = keys.toLowerCase().replace(/\s/g, '');
  var keyCombos = keys.split(',');
  return keyCombos.map(function (keyCombo) {
    var pseudoKeyEvent = {};
    keyCombo.split(_combinator).forEach(function (key) {
      if (_modifiersList.indexOf(key) > -1) {
        if (key == 'cmd') key = 'meta';
        pseudoKeyEvent[key + 'Key'] = true;
      } else {
        pseudoKeyEvent.keyCode = _keycodes.keyToKeyCode[key];
      }
    });
    if (typeof pseudoKeyEvent.keyCode != 'number') throw Error('Keymapper: Unrecognized key combination `' + keyCombo + '`');
    return keyEventToKeyCombination(pseudoKeyEvent);
  }).join(',');
}

var Keymapper = function () {
  _createClass(Keymapper, null, [{
    key: 'setContext',
    value: function setContext(context) {
      _context = context;
    }
  }]);

  function Keymapper() {
    var config = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, Keymapper);

    this.setContext = Keymapper.setContext;

    if (!Keymapper.$$singleton) {
      var combinator = config.combinator;

      if (combinator && typeof combinator === 'string') {
        if (combinator !== '+' && combinator !== '-') {
          throw Error('Keymapper: ' + 'Unrecognized combinator, only "+" or "-" is supported.');
        }
        _combinator = combinator;
      }

      this.add = this.map;

      window.addEventListener('keydown', handleKeyEvent);
      Object.defineProperty(Keymapper, '$$singleton', { value: this });
    } else {
      return Keymapper.$$singleton;
    }
  }

  _createClass(Keymapper, [{
    key: 'map',
    value: function map(keys, descriptor) {
      if (typeof descriptor === 'string') {
        var commandType = descriptor;
        descriptor = { command: commandType, context: 'global' };
      } else if (typeof descriptor === 'function') {
        var handler = descriptor;
        descriptor = { command: handler, context: 'global' };
      }
      if (!descriptor.command || !descriptor.context) return;
      keys = normalizeKeys(keys);
      if (!_keymaps[descriptor.context]) _keymaps[descriptor.context] = {};
      _keymaps[descriptor.context][keys] = descriptor.command;
    }
  }, {
    key: 'loadKeymaps',
    value: function loadKeymaps(keymaps) {}
  }, {
    key: 'addCommandHandler',
    value: function addCommandHandler(commandType, commandHandler) {
      _commandHandlers[commandType] = commandHandler;
    }
  }, {
    key: 'loadCommandHandlers',
    value: function loadCommandHandlers(commandHandlers, override) {
      _commandHandlers = override ? commandHandlers : Object.assign(_commandHandlers, commandHandlers);
    }
  }]);

  return Keymapper;
}();

exports.default = Keymapper;