/**
 * Hermes 严格模式下 bare `window` 可能不可用；确保 global.window 在 RN 初始化前存在。
 */
'use strict';

if (typeof global.window === 'undefined') {
  global.window = global;
}

if (typeof global.self === 'undefined') {
  global.self = global;
}
