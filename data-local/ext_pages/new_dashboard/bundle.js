var Ka = (e) => {
  throw TypeError(e);
};
var ul = (e, t, r) => t.has(e) || Ka("Cannot " + r);
var f = (e, t, r) => (ul(e, t, "read from private field"), r ? r.call(e) : t.get(e)), F = (e, t, r) => t.has(e) ? Ka("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, r), j = (e, t, r, n) => (ul(e, t, "write to private field"), n ? n.call(e, r) : t.set(e, r), r), A = (e, t, r) => (ul(e, t, "access private method"), r);
var Uo = (e, t, r, n) => ({
  set _(o) {
    j(e, t, o, r);
  },
  get _() {
    return f(e, t, n);
  }
});
function wp(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var Lc = { exports: {} }, $ = {};
/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Fo = Symbol.for("react.element"), kp = Symbol.for("react.portal"), bp = Symbol.for("react.fragment"), Sp = Symbol.for("react.strict_mode"), Cp = Symbol.for("react.profiler"), Ep = Symbol.for("react.provider"), Np = Symbol.for("react.context"), jp = Symbol.for("react.forward_ref"), _p = Symbol.for("react.suspense"), Pp = Symbol.for("react.memo"), zp = Symbol.for("react.lazy"), Ga = Symbol.iterator;
function Mp(e) {
  return e === null || typeof e != "object" ? null : (e = Ga && e[Ga] || e["@@iterator"], typeof e == "function" ? e : null);
}
var Ic = { isMounted: function() {
  return !1;
}, enqueueForceUpdate: function() {
}, enqueueReplaceState: function() {
}, enqueueSetState: function() {
} }, Dc = Object.assign, $c = {};
function Tn(e, t, r) {
  this.props = e, this.context = t, this.refs = $c, this.updater = r || Ic;
}
Tn.prototype.isReactComponent = {};
Tn.prototype.setState = function(e, t) {
  if (typeof e != "object" && typeof e != "function" && e != null) throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
  this.updater.enqueueSetState(this, e, t, "setState");
};
Tn.prototype.forceUpdate = function(e) {
  this.updater.enqueueForceUpdate(this, e, "forceUpdate");
};
function Ac() {
}
Ac.prototype = Tn.prototype;
function Vs(e, t, r) {
  this.props = e, this.context = t, this.refs = $c, this.updater = r || Ic;
}
var Ks = Vs.prototype = new Ac();
Ks.constructor = Vs;
Dc(Ks, Tn.prototype);
Ks.isPureReactComponent = !0;
var qa = Array.isArray, Uc = Object.prototype.hasOwnProperty, Gs = { current: null }, Qc = { key: !0, ref: !0, __self: !0, __source: !0 };
function Bc(e, t, r) {
  var n, o = {}, i = null, l = null;
  if (t != null) for (n in t.ref !== void 0 && (l = t.ref), t.key !== void 0 && (i = "" + t.key), t) Uc.call(t, n) && !Qc.hasOwnProperty(n) && (o[n] = t[n]);
  var s = arguments.length - 2;
  if (s === 1) o.children = r;
  else if (1 < s) {
    for (var a = Array(s), u = 0; u < s; u++) a[u] = arguments[u + 2];
    o.children = a;
  }
  if (e && e.defaultProps) for (n in s = e.defaultProps, s) o[n] === void 0 && (o[n] = s[n]);
  return { $$typeof: Fo, type: e, key: i, ref: l, props: o, _owner: Gs.current };
}
function Rp(e, t) {
  return { $$typeof: Fo, type: e.type, key: t, ref: e.ref, props: e.props, _owner: e._owner };
}
function qs(e) {
  return typeof e == "object" && e !== null && e.$$typeof === Fo;
}
function Tp(e) {
  var t = { "=": "=0", ":": "=2" };
  return "$" + e.replace(/[=:]/g, function(r) {
    return t[r];
  });
}
var Ya = /\/+/g;
function cl(e, t) {
  return typeof e == "object" && e !== null && e.key != null ? Tp("" + e.key) : t.toString(36);
}
function ai(e, t, r, n, o) {
  var i = typeof e;
  (i === "undefined" || i === "boolean") && (e = null);
  var l = !1;
  if (e === null) l = !0;
  else switch (i) {
    case "string":
    case "number":
      l = !0;
      break;
    case "object":
      switch (e.$$typeof) {
        case Fo:
        case kp:
          l = !0;
      }
  }
  if (l) return l = e, o = o(l), e = n === "" ? "." + cl(l, 0) : n, qa(o) ? (r = "", e != null && (r = e.replace(Ya, "$&/") + "/"), ai(o, t, r, "", function(u) {
    return u;
  })) : o != null && (qs(o) && (o = Rp(o, r + (!o.key || l && l.key === o.key ? "" : ("" + o.key).replace(Ya, "$&/") + "/") + e)), t.push(o)), 1;
  if (l = 0, n = n === "" ? "." : n + ":", qa(e)) for (var s = 0; s < e.length; s++) {
    i = e[s];
    var a = n + cl(i, s);
    l += ai(i, t, r, a, o);
  }
  else if (a = Mp(e), typeof a == "function") for (e = a.call(e), s = 0; !(i = e.next()).done; ) i = i.value, a = n + cl(i, s++), l += ai(i, t, r, a, o);
  else if (i === "object") throw t = String(e), Error("Objects are not valid as a React child (found: " + (t === "[object Object]" ? "object with keys {" + Object.keys(e).join(", ") + "}" : t) + "). If you meant to render a collection of children, use an array instead.");
  return l;
}
function Qo(e, t, r) {
  if (e == null) return e;
  var n = [], o = 0;
  return ai(e, n, "", "", function(i) {
    return t.call(r, i, o++);
  }), n;
}
function Fp(e) {
  if (e._status === -1) {
    var t = e._result;
    t = t(), t.then(function(r) {
      (e._status === 0 || e._status === -1) && (e._status = 1, e._result = r);
    }, function(r) {
      (e._status === 0 || e._status === -1) && (e._status = 2, e._result = r);
    }), e._status === -1 && (e._status = 0, e._result = t);
  }
  if (e._status === 1) return e._result.default;
  throw e._result;
}
var Pe = { current: null }, ui = { transition: null }, Op = { ReactCurrentDispatcher: Pe, ReactCurrentBatchConfig: ui, ReactCurrentOwner: Gs };
function Hc() {
  throw Error("act(...) is not supported in production builds of React.");
}
$.Children = { map: Qo, forEach: function(e, t, r) {
  Qo(e, function() {
    t.apply(this, arguments);
  }, r);
}, count: function(e) {
  var t = 0;
  return Qo(e, function() {
    t++;
  }), t;
}, toArray: function(e) {
  return Qo(e, function(t) {
    return t;
  }) || [];
}, only: function(e) {
  if (!qs(e)) throw Error("React.Children.only expected to receive a single React element child.");
  return e;
} };
$.Component = Tn;
$.Fragment = bp;
$.Profiler = Cp;
$.PureComponent = Vs;
$.StrictMode = Sp;
$.Suspense = _p;
$.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = Op;
$.act = Hc;
$.cloneElement = function(e, t, r) {
  if (e == null) throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + e + ".");
  var n = Dc({}, e.props), o = e.key, i = e.ref, l = e._owner;
  if (t != null) {
    if (t.ref !== void 0 && (i = t.ref, l = Gs.current), t.key !== void 0 && (o = "" + t.key), e.type && e.type.defaultProps) var s = e.type.defaultProps;
    for (a in t) Uc.call(t, a) && !Qc.hasOwnProperty(a) && (n[a] = t[a] === void 0 && s !== void 0 ? s[a] : t[a]);
  }
  var a = arguments.length - 2;
  if (a === 1) n.children = r;
  else if (1 < a) {
    s = Array(a);
    for (var u = 0; u < a; u++) s[u] = arguments[u + 2];
    n.children = s;
  }
  return { $$typeof: Fo, type: e.type, key: o, ref: i, props: n, _owner: l };
};
$.createContext = function(e) {
  return e = { $$typeof: Np, _currentValue: e, _currentValue2: e, _threadCount: 0, Provider: null, Consumer: null, _defaultValue: null, _globalName: null }, e.Provider = { $$typeof: Ep, _context: e }, e.Consumer = e;
};
$.createElement = Bc;
$.createFactory = function(e) {
  var t = Bc.bind(null, e);
  return t.type = e, t;
};
$.createRef = function() {
  return { current: null };
};
$.forwardRef = function(e) {
  return { $$typeof: jp, render: e };
};
$.isValidElement = qs;
$.lazy = function(e) {
  return { $$typeof: zp, _payload: { _status: -1, _result: e }, _init: Fp };
};
$.memo = function(e, t) {
  return { $$typeof: Pp, type: e, compare: t === void 0 ? null : t };
};
$.startTransition = function(e) {
  var t = ui.transition;
  ui.transition = {};
  try {
    e();
  } finally {
    ui.transition = t;
  }
};
$.unstable_act = Hc;
$.useCallback = function(e, t) {
  return Pe.current.useCallback(e, t);
};
$.useContext = function(e) {
  return Pe.current.useContext(e);
};
$.useDebugValue = function() {
};
$.useDeferredValue = function(e) {
  return Pe.current.useDeferredValue(e);
};
$.useEffect = function(e, t) {
  return Pe.current.useEffect(e, t);
};
$.useId = function() {
  return Pe.current.useId();
};
$.useImperativeHandle = function(e, t, r) {
  return Pe.current.useImperativeHandle(e, t, r);
};
$.useInsertionEffect = function(e, t) {
  return Pe.current.useInsertionEffect(e, t);
};
$.useLayoutEffect = function(e, t) {
  return Pe.current.useLayoutEffect(e, t);
};
$.useMemo = function(e, t) {
  return Pe.current.useMemo(e, t);
};
$.useReducer = function(e, t, r) {
  return Pe.current.useReducer(e, t, r);
};
$.useRef = function(e) {
  return Pe.current.useRef(e);
};
$.useState = function(e) {
  return Pe.current.useState(e);
};
$.useSyncExternalStore = function(e, t, r) {
  return Pe.current.useSyncExternalStore(e, t, r);
};
$.useTransition = function() {
  return Pe.current.useTransition();
};
$.version = "18.3.1";
Lc.exports = $;
var I = Lc.exports;
const Xa = /* @__PURE__ */ wp(I);
var Wc = { exports: {} }, Ve = {}, Vc = { exports: {} }, Kc = {};
/**
 * @license React
 * scheduler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
(function(e) {
  function t(E, O) {
    var L = E.length;
    E.push(O);
    e: for (; 0 < L; ) {
      var B = L - 1 >>> 1, se = E[B];
      if (0 < o(se, O)) E[B] = O, E[L] = se, L = B;
      else break e;
    }
  }
  function r(E) {
    return E.length === 0 ? null : E[0];
  }
  function n(E) {
    if (E.length === 0) return null;
    var O = E[0], L = E.pop();
    if (L !== O) {
      E[0] = L;
      e: for (var B = 0, se = E.length, Ot = se >>> 1; B < Ot; ) {
        var wt = 2 * (B + 1) - 1, $e = E[wt], Ge = wt + 1, Lt = E[Ge];
        if (0 > o($e, L)) Ge < se && 0 > o(Lt, $e) ? (E[B] = Lt, E[Ge] = L, B = Ge) : (E[B] = $e, E[wt] = L, B = wt);
        else if (Ge < se && 0 > o(Lt, L)) E[B] = Lt, E[Ge] = L, B = Ge;
        else break e;
      }
    }
    return O;
  }
  function o(E, O) {
    var L = E.sortIndex - O.sortIndex;
    return L !== 0 ? L : E.id - O.id;
  }
  if (typeof performance == "object" && typeof performance.now == "function") {
    var i = performance;
    e.unstable_now = function() {
      return i.now();
    };
  } else {
    var l = Date, s = l.now();
    e.unstable_now = function() {
      return l.now() - s;
    };
  }
  var a = [], u = [], g = 1, h = null, v = 3, y = !1, w = !1, x = !1, S = typeof setTimeout == "function" ? setTimeout : null, p = typeof clearTimeout == "function" ? clearTimeout : null, d = typeof setImmediate < "u" ? setImmediate : null;
  typeof navigator < "u" && navigator.scheduling !== void 0 && navigator.scheduling.isInputPending !== void 0 && navigator.scheduling.isInputPending.bind(navigator.scheduling);
  function m(E) {
    for (var O = r(u); O !== null; ) {
      if (O.callback === null) n(u);
      else if (O.startTime <= E) n(u), O.sortIndex = O.expirationTime, t(a, O);
      else break;
      O = r(u);
    }
  }
  function k(E) {
    if (x = !1, m(E), !w) if (r(a) !== null) w = !0, ct(C);
    else {
      var O = r(u);
      O !== null && xt(k, O.startTime - E);
    }
  }
  function C(E, O) {
    w = !1, x && (x = !1, p(P), P = -1), y = !0;
    var L = v;
    try {
      for (m(O), h = r(a); h !== null && (!(h.expirationTime > O) || E && !Y()); ) {
        var B = h.callback;
        if (typeof B == "function") {
          h.callback = null, v = h.priorityLevel;
          var se = B(h.expirationTime <= O);
          O = e.unstable_now(), typeof se == "function" ? h.callback = se : h === r(a) && n(a), m(O);
        } else n(a);
        h = r(a);
      }
      if (h !== null) var Ot = !0;
      else {
        var wt = r(u);
        wt !== null && xt(k, wt.startTime - O), Ot = !1;
      }
      return Ot;
    } finally {
      h = null, v = L, y = !1;
    }
  }
  var _ = !1, N = null, P = -1, R = 5, T = -1;
  function Y() {
    return !(e.unstable_now() - T < R);
  }
  function U() {
    if (N !== null) {
      var E = e.unstable_now();
      T = E;
      var O = !0;
      try {
        O = N(!0, E);
      } finally {
        O ? Ee() : (_ = !1, N = null);
      }
    } else _ = !1;
  }
  var Ee;
  if (typeof d == "function") Ee = function() {
    d(U);
  };
  else if (typeof MessageChannel < "u") {
    var Me = new MessageChannel(), Br = Me.port2;
    Me.port1.onmessage = U, Ee = function() {
      Br.postMessage(null);
    };
  } else Ee = function() {
    S(U, 0);
  };
  function ct(E) {
    N = E, _ || (_ = !0, Ee());
  }
  function xt(E, O) {
    P = S(function() {
      E(e.unstable_now());
    }, O);
  }
  e.unstable_IdlePriority = 5, e.unstable_ImmediatePriority = 1, e.unstable_LowPriority = 4, e.unstable_NormalPriority = 3, e.unstable_Profiling = null, e.unstable_UserBlockingPriority = 2, e.unstable_cancelCallback = function(E) {
    E.callback = null;
  }, e.unstable_continueExecution = function() {
    w || y || (w = !0, ct(C));
  }, e.unstable_forceFrameRate = function(E) {
    0 > E || 125 < E ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : R = 0 < E ? Math.floor(1e3 / E) : 5;
  }, e.unstable_getCurrentPriorityLevel = function() {
    return v;
  }, e.unstable_getFirstCallbackNode = function() {
    return r(a);
  }, e.unstable_next = function(E) {
    switch (v) {
      case 1:
      case 2:
      case 3:
        var O = 3;
        break;
      default:
        O = v;
    }
    var L = v;
    v = O;
    try {
      return E();
    } finally {
      v = L;
    }
  }, e.unstable_pauseExecution = function() {
  }, e.unstable_requestPaint = function() {
  }, e.unstable_runWithPriority = function(E, O) {
    switch (E) {
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
        break;
      default:
        E = 3;
    }
    var L = v;
    v = E;
    try {
      return O();
    } finally {
      v = L;
    }
  }, e.unstable_scheduleCallback = function(E, O, L) {
    var B = e.unstable_now();
    switch (typeof L == "object" && L !== null ? (L = L.delay, L = typeof L == "number" && 0 < L ? B + L : B) : L = B, E) {
      case 1:
        var se = -1;
        break;
      case 2:
        se = 250;
        break;
      case 5:
        se = 1073741823;
        break;
      case 4:
        se = 1e4;
        break;
      default:
        se = 5e3;
    }
    return se = L + se, E = { id: g++, callback: O, priorityLevel: E, startTime: L, expirationTime: se, sortIndex: -1 }, L > B ? (E.sortIndex = L, t(u, E), r(a) === null && E === r(u) && (x ? (p(P), P = -1) : x = !0, xt(k, L - B))) : (E.sortIndex = se, t(a, E), w || y || (w = !0, ct(C))), E;
  }, e.unstable_shouldYield = Y, e.unstable_wrapCallback = function(E) {
    var O = v;
    return function() {
      var L = v;
      v = O;
      try {
        return E.apply(this, arguments);
      } finally {
        v = L;
      }
    };
  };
})(Kc);
Vc.exports = Kc;
var Lp = Vc.exports;
/**
 * @license React
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Ip = I, We = Lp;
function b(e) {
  for (var t = "https://reactjs.org/docs/error-decoder.html?invariant=" + e, r = 1; r < arguments.length; r++) t += "&args[]=" + encodeURIComponent(arguments[r]);
  return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
}
var Gc = /* @__PURE__ */ new Set(), ao = {};
function Ur(e, t) {
  Nn(e, t), Nn(e + "Capture", t);
}
function Nn(e, t) {
  for (ao[e] = t, e = 0; e < t.length; e++) Gc.add(t[e]);
}
var zt = !(typeof window > "u" || typeof window.document > "u" || typeof window.document.createElement > "u"), Dl = Object.prototype.hasOwnProperty, Dp = /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/, Za = {}, Ja = {};
function $p(e) {
  return Dl.call(Ja, e) ? !0 : Dl.call(Za, e) ? !1 : Dp.test(e) ? Ja[e] = !0 : (Za[e] = !0, !1);
}
function Ap(e, t, r, n) {
  if (r !== null && r.type === 0) return !1;
  switch (typeof t) {
    case "function":
    case "symbol":
      return !0;
    case "boolean":
      return n ? !1 : r !== null ? !r.acceptsBooleans : (e = e.toLowerCase().slice(0, 5), e !== "data-" && e !== "aria-");
    default:
      return !1;
  }
}
function Up(e, t, r, n) {
  if (t === null || typeof t > "u" || Ap(e, t, r, n)) return !0;
  if (n) return !1;
  if (r !== null) switch (r.type) {
    case 3:
      return !t;
    case 4:
      return t === !1;
    case 5:
      return isNaN(t);
    case 6:
      return isNaN(t) || 1 > t;
  }
  return !1;
}
function ze(e, t, r, n, o, i, l) {
  this.acceptsBooleans = t === 2 || t === 3 || t === 4, this.attributeName = n, this.attributeNamespace = o, this.mustUseProperty = r, this.propertyName = e, this.type = t, this.sanitizeURL = i, this.removeEmptyString = l;
}
var xe = {};
"children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(e) {
  xe[e] = new ze(e, 0, !1, e, null, !1, !1);
});
[["acceptCharset", "accept-charset"], ["className", "class"], ["htmlFor", "for"], ["httpEquiv", "http-equiv"]].forEach(function(e) {
  var t = e[0];
  xe[t] = new ze(t, 1, !1, e[1], null, !1, !1);
});
["contentEditable", "draggable", "spellCheck", "value"].forEach(function(e) {
  xe[e] = new ze(e, 2, !1, e.toLowerCase(), null, !1, !1);
});
["autoReverse", "externalResourcesRequired", "focusable", "preserveAlpha"].forEach(function(e) {
  xe[e] = new ze(e, 2, !1, e, null, !1, !1);
});
"allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(e) {
  xe[e] = new ze(e, 3, !1, e.toLowerCase(), null, !1, !1);
});
["checked", "multiple", "muted", "selected"].forEach(function(e) {
  xe[e] = new ze(e, 3, !0, e, null, !1, !1);
});
["capture", "download"].forEach(function(e) {
  xe[e] = new ze(e, 4, !1, e, null, !1, !1);
});
["cols", "rows", "size", "span"].forEach(function(e) {
  xe[e] = new ze(e, 6, !1, e, null, !1, !1);
});
["rowSpan", "start"].forEach(function(e) {
  xe[e] = new ze(e, 5, !1, e.toLowerCase(), null, !1, !1);
});
var Ys = /[\-:]([a-z])/g;
function Xs(e) {
  return e[1].toUpperCase();
}
"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(e) {
  var t = e.replace(
    Ys,
    Xs
  );
  xe[t] = new ze(t, 1, !1, e, null, !1, !1);
});
"xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(e) {
  var t = e.replace(Ys, Xs);
  xe[t] = new ze(t, 1, !1, e, "http://www.w3.org/1999/xlink", !1, !1);
});
["xml:base", "xml:lang", "xml:space"].forEach(function(e) {
  var t = e.replace(Ys, Xs);
  xe[t] = new ze(t, 1, !1, e, "http://www.w3.org/XML/1998/namespace", !1, !1);
});
["tabIndex", "crossOrigin"].forEach(function(e) {
  xe[e] = new ze(e, 1, !1, e.toLowerCase(), null, !1, !1);
});
xe.xlinkHref = new ze("xlinkHref", 1, !1, "xlink:href", "http://www.w3.org/1999/xlink", !0, !1);
["src", "href", "action", "formAction"].forEach(function(e) {
  xe[e] = new ze(e, 1, !1, e.toLowerCase(), null, !0, !0);
});
function Zs(e, t, r, n) {
  var o = xe.hasOwnProperty(t) ? xe[t] : null;
  (o !== null ? o.type !== 0 : n || !(2 < t.length) || t[0] !== "o" && t[0] !== "O" || t[1] !== "n" && t[1] !== "N") && (Up(t, r, o, n) && (r = null), n || o === null ? $p(t) && (r === null ? e.removeAttribute(t) : e.setAttribute(t, "" + r)) : o.mustUseProperty ? e[o.propertyName] = r === null ? o.type === 3 ? !1 : "" : r : (t = o.attributeName, n = o.attributeNamespace, r === null ? e.removeAttribute(t) : (o = o.type, r = o === 3 || o === 4 && r === !0 ? "" : "" + r, n ? e.setAttributeNS(n, t, r) : e.setAttribute(t, r))));
}
var Ft = Ip.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED, Bo = Symbol.for("react.element"), Kr = Symbol.for("react.portal"), Gr = Symbol.for("react.fragment"), Js = Symbol.for("react.strict_mode"), $l = Symbol.for("react.profiler"), qc = Symbol.for("react.provider"), Yc = Symbol.for("react.context"), ea = Symbol.for("react.forward_ref"), Al = Symbol.for("react.suspense"), Ul = Symbol.for("react.suspense_list"), ta = Symbol.for("react.memo"), Qt = Symbol.for("react.lazy"), Xc = Symbol.for("react.offscreen"), eu = Symbol.iterator;
function In(e) {
  return e === null || typeof e != "object" ? null : (e = eu && e[eu] || e["@@iterator"], typeof e == "function" ? e : null);
}
var oe = Object.assign, dl;
function Gn(e) {
  if (dl === void 0) try {
    throw Error();
  } catch (r) {
    var t = r.stack.trim().match(/\n( *(at )?)/);
    dl = t && t[1] || "";
  }
  return `
` + dl + e;
}
var fl = !1;
function pl(e, t) {
  if (!e || fl) return "";
  fl = !0;
  var r = Error.prepareStackTrace;
  Error.prepareStackTrace = void 0;
  try {
    if (t) if (t = function() {
      throw Error();
    }, Object.defineProperty(t.prototype, "props", { set: function() {
      throw Error();
    } }), typeof Reflect == "object" && Reflect.construct) {
      try {
        Reflect.construct(t, []);
      } catch (u) {
        var n = u;
      }
      Reflect.construct(e, [], t);
    } else {
      try {
        t.call();
      } catch (u) {
        n = u;
      }
      e.call(t.prototype);
    }
    else {
      try {
        throw Error();
      } catch (u) {
        n = u;
      }
      e();
    }
  } catch (u) {
    if (u && n && typeof u.stack == "string") {
      for (var o = u.stack.split(`
`), i = n.stack.split(`
`), l = o.length - 1, s = i.length - 1; 1 <= l && 0 <= s && o[l] !== i[s]; ) s--;
      for (; 1 <= l && 0 <= s; l--, s--) if (o[l] !== i[s]) {
        if (l !== 1 || s !== 1)
          do
            if (l--, s--, 0 > s || o[l] !== i[s]) {
              var a = `
` + o[l].replace(" at new ", " at ");
              return e.displayName && a.includes("<anonymous>") && (a = a.replace("<anonymous>", e.displayName)), a;
            }
          while (1 <= l && 0 <= s);
        break;
      }
    }
  } finally {
    fl = !1, Error.prepareStackTrace = r;
  }
  return (e = e ? e.displayName || e.name : "") ? Gn(e) : "";
}
function Qp(e) {
  switch (e.tag) {
    case 5:
      return Gn(e.type);
    case 16:
      return Gn("Lazy");
    case 13:
      return Gn("Suspense");
    case 19:
      return Gn("SuspenseList");
    case 0:
    case 2:
    case 15:
      return e = pl(e.type, !1), e;
    case 11:
      return e = pl(e.type.render, !1), e;
    case 1:
      return e = pl(e.type, !0), e;
    default:
      return "";
  }
}
function Ql(e) {
  if (e == null) return null;
  if (typeof e == "function") return e.displayName || e.name || null;
  if (typeof e == "string") return e;
  switch (e) {
    case Gr:
      return "Fragment";
    case Kr:
      return "Portal";
    case $l:
      return "Profiler";
    case Js:
      return "StrictMode";
    case Al:
      return "Suspense";
    case Ul:
      return "SuspenseList";
  }
  if (typeof e == "object") switch (e.$$typeof) {
    case Yc:
      return (e.displayName || "Context") + ".Consumer";
    case qc:
      return (e._context.displayName || "Context") + ".Provider";
    case ea:
      var t = e.render;
      return e = e.displayName, e || (e = t.displayName || t.name || "", e = e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef"), e;
    case ta:
      return t = e.displayName || null, t !== null ? t : Ql(e.type) || "Memo";
    case Qt:
      t = e._payload, e = e._init;
      try {
        return Ql(e(t));
      } catch {
      }
  }
  return null;
}
function Bp(e) {
  var t = e.type;
  switch (e.tag) {
    case 24:
      return "Cache";
    case 9:
      return (t.displayName || "Context") + ".Consumer";
    case 10:
      return (t._context.displayName || "Context") + ".Provider";
    case 18:
      return "DehydratedFragment";
    case 11:
      return e = t.render, e = e.displayName || e.name || "", t.displayName || (e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef");
    case 7:
      return "Fragment";
    case 5:
      return t;
    case 4:
      return "Portal";
    case 3:
      return "Root";
    case 6:
      return "Text";
    case 16:
      return Ql(t);
    case 8:
      return t === Js ? "StrictMode" : "Mode";
    case 22:
      return "Offscreen";
    case 12:
      return "Profiler";
    case 21:
      return "Scope";
    case 13:
      return "Suspense";
    case 19:
      return "SuspenseList";
    case 25:
      return "TracingMarker";
    case 1:
    case 0:
    case 17:
    case 2:
    case 14:
    case 15:
      if (typeof t == "function") return t.displayName || t.name || null;
      if (typeof t == "string") return t;
  }
  return null;
}
function dr(e) {
  switch (typeof e) {
    case "boolean":
    case "number":
    case "string":
    case "undefined":
      return e;
    case "object":
      return e;
    default:
      return "";
  }
}
function Zc(e) {
  var t = e.type;
  return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
}
function Hp(e) {
  var t = Zc(e) ? "checked" : "value", r = Object.getOwnPropertyDescriptor(e.constructor.prototype, t), n = "" + e[t];
  if (!e.hasOwnProperty(t) && typeof r < "u" && typeof r.get == "function" && typeof r.set == "function") {
    var o = r.get, i = r.set;
    return Object.defineProperty(e, t, { configurable: !0, get: function() {
      return o.call(this);
    }, set: function(l) {
      n = "" + l, i.call(this, l);
    } }), Object.defineProperty(e, t, { enumerable: r.enumerable }), { getValue: function() {
      return n;
    }, setValue: function(l) {
      n = "" + l;
    }, stopTracking: function() {
      e._valueTracker = null, delete e[t];
    } };
  }
}
function Ho(e) {
  e._valueTracker || (e._valueTracker = Hp(e));
}
function Jc(e) {
  if (!e) return !1;
  var t = e._valueTracker;
  if (!t) return !0;
  var r = t.getValue(), n = "";
  return e && (n = Zc(e) ? e.checked ? "true" : "false" : e.value), e = n, e !== r ? (t.setValue(e), !0) : !1;
}
function bi(e) {
  if (e = e || (typeof document < "u" ? document : void 0), typeof e > "u") return null;
  try {
    return e.activeElement || e.body;
  } catch {
    return e.body;
  }
}
function Bl(e, t) {
  var r = t.checked;
  return oe({}, t, { defaultChecked: void 0, defaultValue: void 0, value: void 0, checked: r ?? e._wrapperState.initialChecked });
}
function tu(e, t) {
  var r = t.defaultValue == null ? "" : t.defaultValue, n = t.checked != null ? t.checked : t.defaultChecked;
  r = dr(t.value != null ? t.value : r), e._wrapperState = { initialChecked: n, initialValue: r, controlled: t.type === "checkbox" || t.type === "radio" ? t.checked != null : t.value != null };
}
function ed(e, t) {
  t = t.checked, t != null && Zs(e, "checked", t, !1);
}
function Hl(e, t) {
  ed(e, t);
  var r = dr(t.value), n = t.type;
  if (r != null) n === "number" ? (r === 0 && e.value === "" || e.value != r) && (e.value = "" + r) : e.value !== "" + r && (e.value = "" + r);
  else if (n === "submit" || n === "reset") {
    e.removeAttribute("value");
    return;
  }
  t.hasOwnProperty("value") ? Wl(e, t.type, r) : t.hasOwnProperty("defaultValue") && Wl(e, t.type, dr(t.defaultValue)), t.checked == null && t.defaultChecked != null && (e.defaultChecked = !!t.defaultChecked);
}
function ru(e, t, r) {
  if (t.hasOwnProperty("value") || t.hasOwnProperty("defaultValue")) {
    var n = t.type;
    if (!(n !== "submit" && n !== "reset" || t.value !== void 0 && t.value !== null)) return;
    t = "" + e._wrapperState.initialValue, r || t === e.value || (e.value = t), e.defaultValue = t;
  }
  r = e.name, r !== "" && (e.name = ""), e.defaultChecked = !!e._wrapperState.initialChecked, r !== "" && (e.name = r);
}
function Wl(e, t, r) {
  (t !== "number" || bi(e.ownerDocument) !== e) && (r == null ? e.defaultValue = "" + e._wrapperState.initialValue : e.defaultValue !== "" + r && (e.defaultValue = "" + r));
}
var qn = Array.isArray;
function ln(e, t, r, n) {
  if (e = e.options, t) {
    t = {};
    for (var o = 0; o < r.length; o++) t["$" + r[o]] = !0;
    for (r = 0; r < e.length; r++) o = t.hasOwnProperty("$" + e[r].value), e[r].selected !== o && (e[r].selected = o), o && n && (e[r].defaultSelected = !0);
  } else {
    for (r = "" + dr(r), t = null, o = 0; o < e.length; o++) {
      if (e[o].value === r) {
        e[o].selected = !0, n && (e[o].defaultSelected = !0);
        return;
      }
      t !== null || e[o].disabled || (t = e[o]);
    }
    t !== null && (t.selected = !0);
  }
}
function Vl(e, t) {
  if (t.dangerouslySetInnerHTML != null) throw Error(b(91));
  return oe({}, t, { value: void 0, defaultValue: void 0, children: "" + e._wrapperState.initialValue });
}
function nu(e, t) {
  var r = t.value;
  if (r == null) {
    if (r = t.children, t = t.defaultValue, r != null) {
      if (t != null) throw Error(b(92));
      if (qn(r)) {
        if (1 < r.length) throw Error(b(93));
        r = r[0];
      }
      t = r;
    }
    t == null && (t = ""), r = t;
  }
  e._wrapperState = { initialValue: dr(r) };
}
function td(e, t) {
  var r = dr(t.value), n = dr(t.defaultValue);
  r != null && (r = "" + r, r !== e.value && (e.value = r), t.defaultValue == null && e.defaultValue !== r && (e.defaultValue = r)), n != null && (e.defaultValue = "" + n);
}
function ou(e) {
  var t = e.textContent;
  t === e._wrapperState.initialValue && t !== "" && t !== null && (e.value = t);
}
function rd(e) {
  switch (e) {
    case "svg":
      return "http://www.w3.org/2000/svg";
    case "math":
      return "http://www.w3.org/1998/Math/MathML";
    default:
      return "http://www.w3.org/1999/xhtml";
  }
}
function Kl(e, t) {
  return e == null || e === "http://www.w3.org/1999/xhtml" ? rd(t) : e === "http://www.w3.org/2000/svg" && t === "foreignObject" ? "http://www.w3.org/1999/xhtml" : e;
}
var Wo, nd = function(e) {
  return typeof MSApp < "u" && MSApp.execUnsafeLocalFunction ? function(t, r, n, o) {
    MSApp.execUnsafeLocalFunction(function() {
      return e(t, r, n, o);
    });
  } : e;
}(function(e, t) {
  if (e.namespaceURI !== "http://www.w3.org/2000/svg" || "innerHTML" in e) e.innerHTML = t;
  else {
    for (Wo = Wo || document.createElement("div"), Wo.innerHTML = "<svg>" + t.valueOf().toString() + "</svg>", t = Wo.firstChild; e.firstChild; ) e.removeChild(e.firstChild);
    for (; t.firstChild; ) e.appendChild(t.firstChild);
  }
});
function uo(e, t) {
  if (t) {
    var r = e.firstChild;
    if (r && r === e.lastChild && r.nodeType === 3) {
      r.nodeValue = t;
      return;
    }
  }
  e.textContent = t;
}
var Jn = {
  animationIterationCount: !0,
  aspectRatio: !0,
  borderImageOutset: !0,
  borderImageSlice: !0,
  borderImageWidth: !0,
  boxFlex: !0,
  boxFlexGroup: !0,
  boxOrdinalGroup: !0,
  columnCount: !0,
  columns: !0,
  flex: !0,
  flexGrow: !0,
  flexPositive: !0,
  flexShrink: !0,
  flexNegative: !0,
  flexOrder: !0,
  gridArea: !0,
  gridRow: !0,
  gridRowEnd: !0,
  gridRowSpan: !0,
  gridRowStart: !0,
  gridColumn: !0,
  gridColumnEnd: !0,
  gridColumnSpan: !0,
  gridColumnStart: !0,
  fontWeight: !0,
  lineClamp: !0,
  lineHeight: !0,
  opacity: !0,
  order: !0,
  orphans: !0,
  tabSize: !0,
  widows: !0,
  zIndex: !0,
  zoom: !0,
  fillOpacity: !0,
  floodOpacity: !0,
  stopOpacity: !0,
  strokeDasharray: !0,
  strokeDashoffset: !0,
  strokeMiterlimit: !0,
  strokeOpacity: !0,
  strokeWidth: !0
}, Wp = ["Webkit", "ms", "Moz", "O"];
Object.keys(Jn).forEach(function(e) {
  Wp.forEach(function(t) {
    t = t + e.charAt(0).toUpperCase() + e.substring(1), Jn[t] = Jn[e];
  });
});
function od(e, t, r) {
  return t == null || typeof t == "boolean" || t === "" ? "" : r || typeof t != "number" || t === 0 || Jn.hasOwnProperty(e) && Jn[e] ? ("" + t).trim() : t + "px";
}
function id(e, t) {
  e = e.style;
  for (var r in t) if (t.hasOwnProperty(r)) {
    var n = r.indexOf("--") === 0, o = od(r, t[r], n);
    r === "float" && (r = "cssFloat"), n ? e.setProperty(r, o) : e[r] = o;
  }
}
var Vp = oe({ menuitem: !0 }, { area: !0, base: !0, br: !0, col: !0, embed: !0, hr: !0, img: !0, input: !0, keygen: !0, link: !0, meta: !0, param: !0, source: !0, track: !0, wbr: !0 });
function Gl(e, t) {
  if (t) {
    if (Vp[e] && (t.children != null || t.dangerouslySetInnerHTML != null)) throw Error(b(137, e));
    if (t.dangerouslySetInnerHTML != null) {
      if (t.children != null) throw Error(b(60));
      if (typeof t.dangerouslySetInnerHTML != "object" || !("__html" in t.dangerouslySetInnerHTML)) throw Error(b(61));
    }
    if (t.style != null && typeof t.style != "object") throw Error(b(62));
  }
}
function ql(e, t) {
  if (e.indexOf("-") === -1) return typeof t.is == "string";
  switch (e) {
    case "annotation-xml":
    case "color-profile":
    case "font-face":
    case "font-face-src":
    case "font-face-uri":
    case "font-face-format":
    case "font-face-name":
    case "missing-glyph":
      return !1;
    default:
      return !0;
  }
}
var Yl = null;
function ra(e) {
  return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
}
var Xl = null, sn = null, an = null;
function iu(e) {
  if (e = Io(e)) {
    if (typeof Xl != "function") throw Error(b(280));
    var t = e.stateNode;
    t && (t = Xi(t), Xl(e.stateNode, e.type, t));
  }
}
function ld(e) {
  sn ? an ? an.push(e) : an = [e] : sn = e;
}
function sd() {
  if (sn) {
    var e = sn, t = an;
    if (an = sn = null, iu(e), t) for (e = 0; e < t.length; e++) iu(t[e]);
  }
}
function ad(e, t) {
  return e(t);
}
function ud() {
}
var hl = !1;
function cd(e, t, r) {
  if (hl) return e(t, r);
  hl = !0;
  try {
    return ad(e, t, r);
  } finally {
    hl = !1, (sn !== null || an !== null) && (ud(), sd());
  }
}
function co(e, t) {
  var r = e.stateNode;
  if (r === null) return null;
  var n = Xi(r);
  if (n === null) return null;
  r = n[t];
  e: switch (t) {
    case "onClick":
    case "onClickCapture":
    case "onDoubleClick":
    case "onDoubleClickCapture":
    case "onMouseDown":
    case "onMouseDownCapture":
    case "onMouseMove":
    case "onMouseMoveCapture":
    case "onMouseUp":
    case "onMouseUpCapture":
    case "onMouseEnter":
      (n = !n.disabled) || (e = e.type, n = !(e === "button" || e === "input" || e === "select" || e === "textarea")), e = !n;
      break e;
    default:
      e = !1;
  }
  if (e) return null;
  if (r && typeof r != "function") throw Error(b(231, t, typeof r));
  return r;
}
var Zl = !1;
if (zt) try {
  var Dn = {};
  Object.defineProperty(Dn, "passive", { get: function() {
    Zl = !0;
  } }), window.addEventListener("test", Dn, Dn), window.removeEventListener("test", Dn, Dn);
} catch {
  Zl = !1;
}
function Kp(e, t, r, n, o, i, l, s, a) {
  var u = Array.prototype.slice.call(arguments, 3);
  try {
    t.apply(r, u);
  } catch (g) {
    this.onError(g);
  }
}
var eo = !1, Si = null, Ci = !1, Jl = null, Gp = { onError: function(e) {
  eo = !0, Si = e;
} };
function qp(e, t, r, n, o, i, l, s, a) {
  eo = !1, Si = null, Kp.apply(Gp, arguments);
}
function Yp(e, t, r, n, o, i, l, s, a) {
  if (qp.apply(this, arguments), eo) {
    if (eo) {
      var u = Si;
      eo = !1, Si = null;
    } else throw Error(b(198));
    Ci || (Ci = !0, Jl = u);
  }
}
function Qr(e) {
  var t = e, r = e;
  if (e.alternate) for (; t.return; ) t = t.return;
  else {
    e = t;
    do
      t = e, t.flags & 4098 && (r = t.return), e = t.return;
    while (e);
  }
  return t.tag === 3 ? r : null;
}
function dd(e) {
  if (e.tag === 13) {
    var t = e.memoizedState;
    if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
  }
  return null;
}
function lu(e) {
  if (Qr(e) !== e) throw Error(b(188));
}
function Xp(e) {
  var t = e.alternate;
  if (!t) {
    if (t = Qr(e), t === null) throw Error(b(188));
    return t !== e ? null : e;
  }
  for (var r = e, n = t; ; ) {
    var o = r.return;
    if (o === null) break;
    var i = o.alternate;
    if (i === null) {
      if (n = o.return, n !== null) {
        r = n;
        continue;
      }
      break;
    }
    if (o.child === i.child) {
      for (i = o.child; i; ) {
        if (i === r) return lu(o), e;
        if (i === n) return lu(o), t;
        i = i.sibling;
      }
      throw Error(b(188));
    }
    if (r.return !== n.return) r = o, n = i;
    else {
      for (var l = !1, s = o.child; s; ) {
        if (s === r) {
          l = !0, r = o, n = i;
          break;
        }
        if (s === n) {
          l = !0, n = o, r = i;
          break;
        }
        s = s.sibling;
      }
      if (!l) {
        for (s = i.child; s; ) {
          if (s === r) {
            l = !0, r = i, n = o;
            break;
          }
          if (s === n) {
            l = !0, n = i, r = o;
            break;
          }
          s = s.sibling;
        }
        if (!l) throw Error(b(189));
      }
    }
    if (r.alternate !== n) throw Error(b(190));
  }
  if (r.tag !== 3) throw Error(b(188));
  return r.stateNode.current === r ? e : t;
}
function fd(e) {
  return e = Xp(e), e !== null ? pd(e) : null;
}
function pd(e) {
  if (e.tag === 5 || e.tag === 6) return e;
  for (e = e.child; e !== null; ) {
    var t = pd(e);
    if (t !== null) return t;
    e = e.sibling;
  }
  return null;
}
var hd = We.unstable_scheduleCallback, su = We.unstable_cancelCallback, Zp = We.unstable_shouldYield, Jp = We.unstable_requestPaint, ae = We.unstable_now, eh = We.unstable_getCurrentPriorityLevel, na = We.unstable_ImmediatePriority, md = We.unstable_UserBlockingPriority, Ei = We.unstable_NormalPriority, th = We.unstable_LowPriority, gd = We.unstable_IdlePriority, Ki = null, vt = null;
function rh(e) {
  if (vt && typeof vt.onCommitFiberRoot == "function") try {
    vt.onCommitFiberRoot(Ki, e, void 0, (e.current.flags & 128) === 128);
  } catch {
  }
}
var st = Math.clz32 ? Math.clz32 : ih, nh = Math.log, oh = Math.LN2;
function ih(e) {
  return e >>>= 0, e === 0 ? 32 : 31 - (nh(e) / oh | 0) | 0;
}
var Vo = 64, Ko = 4194304;
function Yn(e) {
  switch (e & -e) {
    case 1:
      return 1;
    case 2:
      return 2;
    case 4:
      return 4;
    case 8:
      return 8;
    case 16:
      return 16;
    case 32:
      return 32;
    case 64:
    case 128:
    case 256:
    case 512:
    case 1024:
    case 2048:
    case 4096:
    case 8192:
    case 16384:
    case 32768:
    case 65536:
    case 131072:
    case 262144:
    case 524288:
    case 1048576:
    case 2097152:
      return e & 4194240;
    case 4194304:
    case 8388608:
    case 16777216:
    case 33554432:
    case 67108864:
      return e & 130023424;
    case 134217728:
      return 134217728;
    case 268435456:
      return 268435456;
    case 536870912:
      return 536870912;
    case 1073741824:
      return 1073741824;
    default:
      return e;
  }
}
function Ni(e, t) {
  var r = e.pendingLanes;
  if (r === 0) return 0;
  var n = 0, o = e.suspendedLanes, i = e.pingedLanes, l = r & 268435455;
  if (l !== 0) {
    var s = l & ~o;
    s !== 0 ? n = Yn(s) : (i &= l, i !== 0 && (n = Yn(i)));
  } else l = r & ~o, l !== 0 ? n = Yn(l) : i !== 0 && (n = Yn(i));
  if (n === 0) return 0;
  if (t !== 0 && t !== n && !(t & o) && (o = n & -n, i = t & -t, o >= i || o === 16 && (i & 4194240) !== 0)) return t;
  if (n & 4 && (n |= r & 16), t = e.entangledLanes, t !== 0) for (e = e.entanglements, t &= n; 0 < t; ) r = 31 - st(t), o = 1 << r, n |= e[r], t &= ~o;
  return n;
}
function lh(e, t) {
  switch (e) {
    case 1:
    case 2:
    case 4:
      return t + 250;
    case 8:
    case 16:
    case 32:
    case 64:
    case 128:
    case 256:
    case 512:
    case 1024:
    case 2048:
    case 4096:
    case 8192:
    case 16384:
    case 32768:
    case 65536:
    case 131072:
    case 262144:
    case 524288:
    case 1048576:
    case 2097152:
      return t + 5e3;
    case 4194304:
    case 8388608:
    case 16777216:
    case 33554432:
    case 67108864:
      return -1;
    case 134217728:
    case 268435456:
    case 536870912:
    case 1073741824:
      return -1;
    default:
      return -1;
  }
}
function sh(e, t) {
  for (var r = e.suspendedLanes, n = e.pingedLanes, o = e.expirationTimes, i = e.pendingLanes; 0 < i; ) {
    var l = 31 - st(i), s = 1 << l, a = o[l];
    a === -1 ? (!(s & r) || s & n) && (o[l] = lh(s, t)) : a <= t && (e.expiredLanes |= s), i &= ~s;
  }
}
function es(e) {
  return e = e.pendingLanes & -1073741825, e !== 0 ? e : e & 1073741824 ? 1073741824 : 0;
}
function vd() {
  var e = Vo;
  return Vo <<= 1, !(Vo & 4194240) && (Vo = 64), e;
}
function ml(e) {
  for (var t = [], r = 0; 31 > r; r++) t.push(e);
  return t;
}
function Oo(e, t, r) {
  e.pendingLanes |= t, t !== 536870912 && (e.suspendedLanes = 0, e.pingedLanes = 0), e = e.eventTimes, t = 31 - st(t), e[t] = r;
}
function ah(e, t) {
  var r = e.pendingLanes & ~t;
  e.pendingLanes = t, e.suspendedLanes = 0, e.pingedLanes = 0, e.expiredLanes &= t, e.mutableReadLanes &= t, e.entangledLanes &= t, t = e.entanglements;
  var n = e.eventTimes;
  for (e = e.expirationTimes; 0 < r; ) {
    var o = 31 - st(r), i = 1 << o;
    t[o] = 0, n[o] = -1, e[o] = -1, r &= ~i;
  }
}
function oa(e, t) {
  var r = e.entangledLanes |= t;
  for (e = e.entanglements; r; ) {
    var n = 31 - st(r), o = 1 << n;
    o & t | e[n] & t && (e[n] |= t), r &= ~o;
  }
}
var K = 0;
function yd(e) {
  return e &= -e, 1 < e ? 4 < e ? e & 268435455 ? 16 : 536870912 : 4 : 1;
}
var xd, ia, wd, kd, bd, ts = !1, Go = [], rr = null, nr = null, or = null, fo = /* @__PURE__ */ new Map(), po = /* @__PURE__ */ new Map(), Ht = [], uh = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");
function au(e, t) {
  switch (e) {
    case "focusin":
    case "focusout":
      rr = null;
      break;
    case "dragenter":
    case "dragleave":
      nr = null;
      break;
    case "mouseover":
    case "mouseout":
      or = null;
      break;
    case "pointerover":
    case "pointerout":
      fo.delete(t.pointerId);
      break;
    case "gotpointercapture":
    case "lostpointercapture":
      po.delete(t.pointerId);
  }
}
function $n(e, t, r, n, o, i) {
  return e === null || e.nativeEvent !== i ? (e = { blockedOn: t, domEventName: r, eventSystemFlags: n, nativeEvent: i, targetContainers: [o] }, t !== null && (t = Io(t), t !== null && ia(t)), e) : (e.eventSystemFlags |= n, t = e.targetContainers, o !== null && t.indexOf(o) === -1 && t.push(o), e);
}
function ch(e, t, r, n, o) {
  switch (t) {
    case "focusin":
      return rr = $n(rr, e, t, r, n, o), !0;
    case "dragenter":
      return nr = $n(nr, e, t, r, n, o), !0;
    case "mouseover":
      return or = $n(or, e, t, r, n, o), !0;
    case "pointerover":
      var i = o.pointerId;
      return fo.set(i, $n(fo.get(i) || null, e, t, r, n, o)), !0;
    case "gotpointercapture":
      return i = o.pointerId, po.set(i, $n(po.get(i) || null, e, t, r, n, o)), !0;
  }
  return !1;
}
function Sd(e) {
  var t = kr(e.target);
  if (t !== null) {
    var r = Qr(t);
    if (r !== null) {
      if (t = r.tag, t === 13) {
        if (t = dd(r), t !== null) {
          e.blockedOn = t, bd(e.priority, function() {
            wd(r);
          });
          return;
        }
      } else if (t === 3 && r.stateNode.current.memoizedState.isDehydrated) {
        e.blockedOn = r.tag === 3 ? r.stateNode.containerInfo : null;
        return;
      }
    }
  }
  e.blockedOn = null;
}
function ci(e) {
  if (e.blockedOn !== null) return !1;
  for (var t = e.targetContainers; 0 < t.length; ) {
    var r = rs(e.domEventName, e.eventSystemFlags, t[0], e.nativeEvent);
    if (r === null) {
      r = e.nativeEvent;
      var n = new r.constructor(r.type, r);
      Yl = n, r.target.dispatchEvent(n), Yl = null;
    } else return t = Io(r), t !== null && ia(t), e.blockedOn = r, !1;
    t.shift();
  }
  return !0;
}
function uu(e, t, r) {
  ci(e) && r.delete(t);
}
function dh() {
  ts = !1, rr !== null && ci(rr) && (rr = null), nr !== null && ci(nr) && (nr = null), or !== null && ci(or) && (or = null), fo.forEach(uu), po.forEach(uu);
}
function An(e, t) {
  e.blockedOn === t && (e.blockedOn = null, ts || (ts = !0, We.unstable_scheduleCallback(We.unstable_NormalPriority, dh)));
}
function ho(e) {
  function t(o) {
    return An(o, e);
  }
  if (0 < Go.length) {
    An(Go[0], e);
    for (var r = 1; r < Go.length; r++) {
      var n = Go[r];
      n.blockedOn === e && (n.blockedOn = null);
    }
  }
  for (rr !== null && An(rr, e), nr !== null && An(nr, e), or !== null && An(or, e), fo.forEach(t), po.forEach(t), r = 0; r < Ht.length; r++) n = Ht[r], n.blockedOn === e && (n.blockedOn = null);
  for (; 0 < Ht.length && (r = Ht[0], r.blockedOn === null); ) Sd(r), r.blockedOn === null && Ht.shift();
}
var un = Ft.ReactCurrentBatchConfig, ji = !0;
function fh(e, t, r, n) {
  var o = K, i = un.transition;
  un.transition = null;
  try {
    K = 1, la(e, t, r, n);
  } finally {
    K = o, un.transition = i;
  }
}
function ph(e, t, r, n) {
  var o = K, i = un.transition;
  un.transition = null;
  try {
    K = 4, la(e, t, r, n);
  } finally {
    K = o, un.transition = i;
  }
}
function la(e, t, r, n) {
  if (ji) {
    var o = rs(e, t, r, n);
    if (o === null) El(e, t, n, _i, r), au(e, n);
    else if (ch(o, e, t, r, n)) n.stopPropagation();
    else if (au(e, n), t & 4 && -1 < uh.indexOf(e)) {
      for (; o !== null; ) {
        var i = Io(o);
        if (i !== null && xd(i), i = rs(e, t, r, n), i === null && El(e, t, n, _i, r), i === o) break;
        o = i;
      }
      o !== null && n.stopPropagation();
    } else El(e, t, n, null, r);
  }
}
var _i = null;
function rs(e, t, r, n) {
  if (_i = null, e = ra(n), e = kr(e), e !== null) if (t = Qr(e), t === null) e = null;
  else if (r = t.tag, r === 13) {
    if (e = dd(t), e !== null) return e;
    e = null;
  } else if (r === 3) {
    if (t.stateNode.current.memoizedState.isDehydrated) return t.tag === 3 ? t.stateNode.containerInfo : null;
    e = null;
  } else t !== e && (e = null);
  return _i = e, null;
}
function Cd(e) {
  switch (e) {
    case "cancel":
    case "click":
    case "close":
    case "contextmenu":
    case "copy":
    case "cut":
    case "auxclick":
    case "dblclick":
    case "dragend":
    case "dragstart":
    case "drop":
    case "focusin":
    case "focusout":
    case "input":
    case "invalid":
    case "keydown":
    case "keypress":
    case "keyup":
    case "mousedown":
    case "mouseup":
    case "paste":
    case "pause":
    case "play":
    case "pointercancel":
    case "pointerdown":
    case "pointerup":
    case "ratechange":
    case "reset":
    case "resize":
    case "seeked":
    case "submit":
    case "touchcancel":
    case "touchend":
    case "touchstart":
    case "volumechange":
    case "change":
    case "selectionchange":
    case "textInput":
    case "compositionstart":
    case "compositionend":
    case "compositionupdate":
    case "beforeblur":
    case "afterblur":
    case "beforeinput":
    case "blur":
    case "fullscreenchange":
    case "focus":
    case "hashchange":
    case "popstate":
    case "select":
    case "selectstart":
      return 1;
    case "drag":
    case "dragenter":
    case "dragexit":
    case "dragleave":
    case "dragover":
    case "mousemove":
    case "mouseout":
    case "mouseover":
    case "pointermove":
    case "pointerout":
    case "pointerover":
    case "scroll":
    case "toggle":
    case "touchmove":
    case "wheel":
    case "mouseenter":
    case "mouseleave":
    case "pointerenter":
    case "pointerleave":
      return 4;
    case "message":
      switch (eh()) {
        case na:
          return 1;
        case md:
          return 4;
        case Ei:
        case th:
          return 16;
        case gd:
          return 536870912;
        default:
          return 16;
      }
    default:
      return 16;
  }
}
var er = null, sa = null, di = null;
function Ed() {
  if (di) return di;
  var e, t = sa, r = t.length, n, o = "value" in er ? er.value : er.textContent, i = o.length;
  for (e = 0; e < r && t[e] === o[e]; e++) ;
  var l = r - e;
  for (n = 1; n <= l && t[r - n] === o[i - n]; n++) ;
  return di = o.slice(e, 1 < n ? 1 - n : void 0);
}
function fi(e) {
  var t = e.keyCode;
  return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
}
function qo() {
  return !0;
}
function cu() {
  return !1;
}
function Ke(e) {
  function t(r, n, o, i, l) {
    this._reactName = r, this._targetInst = o, this.type = n, this.nativeEvent = i, this.target = l, this.currentTarget = null;
    for (var s in e) e.hasOwnProperty(s) && (r = e[s], this[s] = r ? r(i) : i[s]);
    return this.isDefaultPrevented = (i.defaultPrevented != null ? i.defaultPrevented : i.returnValue === !1) ? qo : cu, this.isPropagationStopped = cu, this;
  }
  return oe(t.prototype, { preventDefault: function() {
    this.defaultPrevented = !0;
    var r = this.nativeEvent;
    r && (r.preventDefault ? r.preventDefault() : typeof r.returnValue != "unknown" && (r.returnValue = !1), this.isDefaultPrevented = qo);
  }, stopPropagation: function() {
    var r = this.nativeEvent;
    r && (r.stopPropagation ? r.stopPropagation() : typeof r.cancelBubble != "unknown" && (r.cancelBubble = !0), this.isPropagationStopped = qo);
  }, persist: function() {
  }, isPersistent: qo }), t;
}
var Fn = { eventPhase: 0, bubbles: 0, cancelable: 0, timeStamp: function(e) {
  return e.timeStamp || Date.now();
}, defaultPrevented: 0, isTrusted: 0 }, aa = Ke(Fn), Lo = oe({}, Fn, { view: 0, detail: 0 }), hh = Ke(Lo), gl, vl, Un, Gi = oe({}, Lo, { screenX: 0, screenY: 0, clientX: 0, clientY: 0, pageX: 0, pageY: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, getModifierState: ua, button: 0, buttons: 0, relatedTarget: function(e) {
  return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget;
}, movementX: function(e) {
  return "movementX" in e ? e.movementX : (e !== Un && (Un && e.type === "mousemove" ? (gl = e.screenX - Un.screenX, vl = e.screenY - Un.screenY) : vl = gl = 0, Un = e), gl);
}, movementY: function(e) {
  return "movementY" in e ? e.movementY : vl;
} }), du = Ke(Gi), mh = oe({}, Gi, { dataTransfer: 0 }), gh = Ke(mh), vh = oe({}, Lo, { relatedTarget: 0 }), yl = Ke(vh), yh = oe({}, Fn, { animationName: 0, elapsedTime: 0, pseudoElement: 0 }), xh = Ke(yh), wh = oe({}, Fn, { clipboardData: function(e) {
  return "clipboardData" in e ? e.clipboardData : window.clipboardData;
} }), kh = Ke(wh), bh = oe({}, Fn, { data: 0 }), fu = Ke(bh), Sh = {
  Esc: "Escape",
  Spacebar: " ",
  Left: "ArrowLeft",
  Up: "ArrowUp",
  Right: "ArrowRight",
  Down: "ArrowDown",
  Del: "Delete",
  Win: "OS",
  Menu: "ContextMenu",
  Apps: "ContextMenu",
  Scroll: "ScrollLock",
  MozPrintableKey: "Unidentified"
}, Ch = {
  8: "Backspace",
  9: "Tab",
  12: "Clear",
  13: "Enter",
  16: "Shift",
  17: "Control",
  18: "Alt",
  19: "Pause",
  20: "CapsLock",
  27: "Escape",
  32: " ",
  33: "PageUp",
  34: "PageDown",
  35: "End",
  36: "Home",
  37: "ArrowLeft",
  38: "ArrowUp",
  39: "ArrowRight",
  40: "ArrowDown",
  45: "Insert",
  46: "Delete",
  112: "F1",
  113: "F2",
  114: "F3",
  115: "F4",
  116: "F5",
  117: "F6",
  118: "F7",
  119: "F8",
  120: "F9",
  121: "F10",
  122: "F11",
  123: "F12",
  144: "NumLock",
  145: "ScrollLock",
  224: "Meta"
}, Eh = { Alt: "altKey", Control: "ctrlKey", Meta: "metaKey", Shift: "shiftKey" };
function Nh(e) {
  var t = this.nativeEvent;
  return t.getModifierState ? t.getModifierState(e) : (e = Eh[e]) ? !!t[e] : !1;
}
function ua() {
  return Nh;
}
var jh = oe({}, Lo, { key: function(e) {
  if (e.key) {
    var t = Sh[e.key] || e.key;
    if (t !== "Unidentified") return t;
  }
  return e.type === "keypress" ? (e = fi(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? Ch[e.keyCode] || "Unidentified" : "";
}, code: 0, location: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, repeat: 0, locale: 0, getModifierState: ua, charCode: function(e) {
  return e.type === "keypress" ? fi(e) : 0;
}, keyCode: function(e) {
  return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
}, which: function(e) {
  return e.type === "keypress" ? fi(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
} }), _h = Ke(jh), Ph = oe({}, Gi, { pointerId: 0, width: 0, height: 0, pressure: 0, tangentialPressure: 0, tiltX: 0, tiltY: 0, twist: 0, pointerType: 0, isPrimary: 0 }), pu = Ke(Ph), zh = oe({}, Lo, { touches: 0, targetTouches: 0, changedTouches: 0, altKey: 0, metaKey: 0, ctrlKey: 0, shiftKey: 0, getModifierState: ua }), Mh = Ke(zh), Rh = oe({}, Fn, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 }), Th = Ke(Rh), Fh = oe({}, Gi, {
  deltaX: function(e) {
    return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
  },
  deltaY: function(e) {
    return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
  },
  deltaZ: 0,
  deltaMode: 0
}), Oh = Ke(Fh), Lh = [9, 13, 27, 32], ca = zt && "CompositionEvent" in window, to = null;
zt && "documentMode" in document && (to = document.documentMode);
var Ih = zt && "TextEvent" in window && !to, Nd = zt && (!ca || to && 8 < to && 11 >= to), hu = " ", mu = !1;
function jd(e, t) {
  switch (e) {
    case "keyup":
      return Lh.indexOf(t.keyCode) !== -1;
    case "keydown":
      return t.keyCode !== 229;
    case "keypress":
    case "mousedown":
    case "focusout":
      return !0;
    default:
      return !1;
  }
}
function _d(e) {
  return e = e.detail, typeof e == "object" && "data" in e ? e.data : null;
}
var qr = !1;
function Dh(e, t) {
  switch (e) {
    case "compositionend":
      return _d(t);
    case "keypress":
      return t.which !== 32 ? null : (mu = !0, hu);
    case "textInput":
      return e = t.data, e === hu && mu ? null : e;
    default:
      return null;
  }
}
function $h(e, t) {
  if (qr) return e === "compositionend" || !ca && jd(e, t) ? (e = Ed(), di = sa = er = null, qr = !1, e) : null;
  switch (e) {
    case "paste":
      return null;
    case "keypress":
      if (!(t.ctrlKey || t.altKey || t.metaKey) || t.ctrlKey && t.altKey) {
        if (t.char && 1 < t.char.length) return t.char;
        if (t.which) return String.fromCharCode(t.which);
      }
      return null;
    case "compositionend":
      return Nd && t.locale !== "ko" ? null : t.data;
    default:
      return null;
  }
}
var Ah = { color: !0, date: !0, datetime: !0, "datetime-local": !0, email: !0, month: !0, number: !0, password: !0, range: !0, search: !0, tel: !0, text: !0, time: !0, url: !0, week: !0 };
function gu(e) {
  var t = e && e.nodeName && e.nodeName.toLowerCase();
  return t === "input" ? !!Ah[e.type] : t === "textarea";
}
function Pd(e, t, r, n) {
  ld(n), t = Pi(t, "onChange"), 0 < t.length && (r = new aa("onChange", "change", null, r, n), e.push({ event: r, listeners: t }));
}
var ro = null, mo = null;
function Uh(e) {
  Ad(e, 0);
}
function qi(e) {
  var t = Zr(e);
  if (Jc(t)) return e;
}
function Qh(e, t) {
  if (e === "change") return t;
}
var zd = !1;
if (zt) {
  var xl;
  if (zt) {
    var wl = "oninput" in document;
    if (!wl) {
      var vu = document.createElement("div");
      vu.setAttribute("oninput", "return;"), wl = typeof vu.oninput == "function";
    }
    xl = wl;
  } else xl = !1;
  zd = xl && (!document.documentMode || 9 < document.documentMode);
}
function yu() {
  ro && (ro.detachEvent("onpropertychange", Md), mo = ro = null);
}
function Md(e) {
  if (e.propertyName === "value" && qi(mo)) {
    var t = [];
    Pd(t, mo, e, ra(e)), cd(Uh, t);
  }
}
function Bh(e, t, r) {
  e === "focusin" ? (yu(), ro = t, mo = r, ro.attachEvent("onpropertychange", Md)) : e === "focusout" && yu();
}
function Hh(e) {
  if (e === "selectionchange" || e === "keyup" || e === "keydown") return qi(mo);
}
function Wh(e, t) {
  if (e === "click") return qi(t);
}
function Vh(e, t) {
  if (e === "input" || e === "change") return qi(t);
}
function Kh(e, t) {
  return e === t && (e !== 0 || 1 / e === 1 / t) || e !== e && t !== t;
}
var ut = typeof Object.is == "function" ? Object.is : Kh;
function go(e, t) {
  if (ut(e, t)) return !0;
  if (typeof e != "object" || e === null || typeof t != "object" || t === null) return !1;
  var r = Object.keys(e), n = Object.keys(t);
  if (r.length !== n.length) return !1;
  for (n = 0; n < r.length; n++) {
    var o = r[n];
    if (!Dl.call(t, o) || !ut(e[o], t[o])) return !1;
  }
  return !0;
}
function xu(e) {
  for (; e && e.firstChild; ) e = e.firstChild;
  return e;
}
function wu(e, t) {
  var r = xu(e);
  e = 0;
  for (var n; r; ) {
    if (r.nodeType === 3) {
      if (n = e + r.textContent.length, e <= t && n >= t) return { node: r, offset: t - e };
      e = n;
    }
    e: {
      for (; r; ) {
        if (r.nextSibling) {
          r = r.nextSibling;
          break e;
        }
        r = r.parentNode;
      }
      r = void 0;
    }
    r = xu(r);
  }
}
function Rd(e, t) {
  return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? Rd(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1;
}
function Td() {
  for (var e = window, t = bi(); t instanceof e.HTMLIFrameElement; ) {
    try {
      var r = typeof t.contentWindow.location.href == "string";
    } catch {
      r = !1;
    }
    if (r) e = t.contentWindow;
    else break;
    t = bi(e.document);
  }
  return t;
}
function da(e) {
  var t = e && e.nodeName && e.nodeName.toLowerCase();
  return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
}
function Gh(e) {
  var t = Td(), r = e.focusedElem, n = e.selectionRange;
  if (t !== r && r && r.ownerDocument && Rd(r.ownerDocument.documentElement, r)) {
    if (n !== null && da(r)) {
      if (t = n.start, e = n.end, e === void 0 && (e = t), "selectionStart" in r) r.selectionStart = t, r.selectionEnd = Math.min(e, r.value.length);
      else if (e = (t = r.ownerDocument || document) && t.defaultView || window, e.getSelection) {
        e = e.getSelection();
        var o = r.textContent.length, i = Math.min(n.start, o);
        n = n.end === void 0 ? i : Math.min(n.end, o), !e.extend && i > n && (o = n, n = i, i = o), o = wu(r, i);
        var l = wu(
          r,
          n
        );
        o && l && (e.rangeCount !== 1 || e.anchorNode !== o.node || e.anchorOffset !== o.offset || e.focusNode !== l.node || e.focusOffset !== l.offset) && (t = t.createRange(), t.setStart(o.node, o.offset), e.removeAllRanges(), i > n ? (e.addRange(t), e.extend(l.node, l.offset)) : (t.setEnd(l.node, l.offset), e.addRange(t)));
      }
    }
    for (t = [], e = r; e = e.parentNode; ) e.nodeType === 1 && t.push({ element: e, left: e.scrollLeft, top: e.scrollTop });
    for (typeof r.focus == "function" && r.focus(), r = 0; r < t.length; r++) e = t[r], e.element.scrollLeft = e.left, e.element.scrollTop = e.top;
  }
}
var qh = zt && "documentMode" in document && 11 >= document.documentMode, Yr = null, ns = null, no = null, os = !1;
function ku(e, t, r) {
  var n = r.window === r ? r.document : r.nodeType === 9 ? r : r.ownerDocument;
  os || Yr == null || Yr !== bi(n) || (n = Yr, "selectionStart" in n && da(n) ? n = { start: n.selectionStart, end: n.selectionEnd } : (n = (n.ownerDocument && n.ownerDocument.defaultView || window).getSelection(), n = { anchorNode: n.anchorNode, anchorOffset: n.anchorOffset, focusNode: n.focusNode, focusOffset: n.focusOffset }), no && go(no, n) || (no = n, n = Pi(ns, "onSelect"), 0 < n.length && (t = new aa("onSelect", "select", null, t, r), e.push({ event: t, listeners: n }), t.target = Yr)));
}
function Yo(e, t) {
  var r = {};
  return r[e.toLowerCase()] = t.toLowerCase(), r["Webkit" + e] = "webkit" + t, r["Moz" + e] = "moz" + t, r;
}
var Xr = { animationend: Yo("Animation", "AnimationEnd"), animationiteration: Yo("Animation", "AnimationIteration"), animationstart: Yo("Animation", "AnimationStart"), transitionend: Yo("Transition", "TransitionEnd") }, kl = {}, Fd = {};
zt && (Fd = document.createElement("div").style, "AnimationEvent" in window || (delete Xr.animationend.animation, delete Xr.animationiteration.animation, delete Xr.animationstart.animation), "TransitionEvent" in window || delete Xr.transitionend.transition);
function Yi(e) {
  if (kl[e]) return kl[e];
  if (!Xr[e]) return e;
  var t = Xr[e], r;
  for (r in t) if (t.hasOwnProperty(r) && r in Fd) return kl[e] = t[r];
  return e;
}
var Od = Yi("animationend"), Ld = Yi("animationiteration"), Id = Yi("animationstart"), Dd = Yi("transitionend"), $d = /* @__PURE__ */ new Map(), bu = "abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
function pr(e, t) {
  $d.set(e, t), Ur(t, [e]);
}
for (var bl = 0; bl < bu.length; bl++) {
  var Sl = bu[bl], Yh = Sl.toLowerCase(), Xh = Sl[0].toUpperCase() + Sl.slice(1);
  pr(Yh, "on" + Xh);
}
pr(Od, "onAnimationEnd");
pr(Ld, "onAnimationIteration");
pr(Id, "onAnimationStart");
pr("dblclick", "onDoubleClick");
pr("focusin", "onFocus");
pr("focusout", "onBlur");
pr(Dd, "onTransitionEnd");
Nn("onMouseEnter", ["mouseout", "mouseover"]);
Nn("onMouseLeave", ["mouseout", "mouseover"]);
Nn("onPointerEnter", ["pointerout", "pointerover"]);
Nn("onPointerLeave", ["pointerout", "pointerover"]);
Ur("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" "));
Ur("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));
Ur("onBeforeInput", ["compositionend", "keypress", "textInput", "paste"]);
Ur("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" "));
Ur("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" "));
Ur("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
var Xn = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), Zh = new Set("cancel close invalid load scroll toggle".split(" ").concat(Xn));
function Su(e, t, r) {
  var n = e.type || "unknown-event";
  e.currentTarget = r, Yp(n, t, void 0, e), e.currentTarget = null;
}
function Ad(e, t) {
  t = (t & 4) !== 0;
  for (var r = 0; r < e.length; r++) {
    var n = e[r], o = n.event;
    n = n.listeners;
    e: {
      var i = void 0;
      if (t) for (var l = n.length - 1; 0 <= l; l--) {
        var s = n[l], a = s.instance, u = s.currentTarget;
        if (s = s.listener, a !== i && o.isPropagationStopped()) break e;
        Su(o, s, u), i = a;
      }
      else for (l = 0; l < n.length; l++) {
        if (s = n[l], a = s.instance, u = s.currentTarget, s = s.listener, a !== i && o.isPropagationStopped()) break e;
        Su(o, s, u), i = a;
      }
    }
  }
  if (Ci) throw e = Jl, Ci = !1, Jl = null, e;
}
function Z(e, t) {
  var r = t[us];
  r === void 0 && (r = t[us] = /* @__PURE__ */ new Set());
  var n = e + "__bubble";
  r.has(n) || (Ud(t, e, 2, !1), r.add(n));
}
function Cl(e, t, r) {
  var n = 0;
  t && (n |= 4), Ud(r, e, n, t);
}
var Xo = "_reactListening" + Math.random().toString(36).slice(2);
function vo(e) {
  if (!e[Xo]) {
    e[Xo] = !0, Gc.forEach(function(r) {
      r !== "selectionchange" && (Zh.has(r) || Cl(r, !1, e), Cl(r, !0, e));
    });
    var t = e.nodeType === 9 ? e : e.ownerDocument;
    t === null || t[Xo] || (t[Xo] = !0, Cl("selectionchange", !1, t));
  }
}
function Ud(e, t, r, n) {
  switch (Cd(t)) {
    case 1:
      var o = fh;
      break;
    case 4:
      o = ph;
      break;
    default:
      o = la;
  }
  r = o.bind(null, t, r, e), o = void 0, !Zl || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (o = !0), n ? o !== void 0 ? e.addEventListener(t, r, { capture: !0, passive: o }) : e.addEventListener(t, r, !0) : o !== void 0 ? e.addEventListener(t, r, { passive: o }) : e.addEventListener(t, r, !1);
}
function El(e, t, r, n, o) {
  var i = n;
  if (!(t & 1) && !(t & 2) && n !== null) e: for (; ; ) {
    if (n === null) return;
    var l = n.tag;
    if (l === 3 || l === 4) {
      var s = n.stateNode.containerInfo;
      if (s === o || s.nodeType === 8 && s.parentNode === o) break;
      if (l === 4) for (l = n.return; l !== null; ) {
        var a = l.tag;
        if ((a === 3 || a === 4) && (a = l.stateNode.containerInfo, a === o || a.nodeType === 8 && a.parentNode === o)) return;
        l = l.return;
      }
      for (; s !== null; ) {
        if (l = kr(s), l === null) return;
        if (a = l.tag, a === 5 || a === 6) {
          n = i = l;
          continue e;
        }
        s = s.parentNode;
      }
    }
    n = n.return;
  }
  cd(function() {
    var u = i, g = ra(r), h = [];
    e: {
      var v = $d.get(e);
      if (v !== void 0) {
        var y = aa, w = e;
        switch (e) {
          case "keypress":
            if (fi(r) === 0) break e;
          case "keydown":
          case "keyup":
            y = _h;
            break;
          case "focusin":
            w = "focus", y = yl;
            break;
          case "focusout":
            w = "blur", y = yl;
            break;
          case "beforeblur":
          case "afterblur":
            y = yl;
            break;
          case "click":
            if (r.button === 2) break e;
          case "auxclick":
          case "dblclick":
          case "mousedown":
          case "mousemove":
          case "mouseup":
          case "mouseout":
          case "mouseover":
          case "contextmenu":
            y = du;
            break;
          case "drag":
          case "dragend":
          case "dragenter":
          case "dragexit":
          case "dragleave":
          case "dragover":
          case "dragstart":
          case "drop":
            y = gh;
            break;
          case "touchcancel":
          case "touchend":
          case "touchmove":
          case "touchstart":
            y = Mh;
            break;
          case Od:
          case Ld:
          case Id:
            y = xh;
            break;
          case Dd:
            y = Th;
            break;
          case "scroll":
            y = hh;
            break;
          case "wheel":
            y = Oh;
            break;
          case "copy":
          case "cut":
          case "paste":
            y = kh;
            break;
          case "gotpointercapture":
          case "lostpointercapture":
          case "pointercancel":
          case "pointerdown":
          case "pointermove":
          case "pointerout":
          case "pointerover":
          case "pointerup":
            y = pu;
        }
        var x = (t & 4) !== 0, S = !x && e === "scroll", p = x ? v !== null ? v + "Capture" : null : v;
        x = [];
        for (var d = u, m; d !== null; ) {
          m = d;
          var k = m.stateNode;
          if (m.tag === 5 && k !== null && (m = k, p !== null && (k = co(d, p), k != null && x.push(yo(d, k, m)))), S) break;
          d = d.return;
        }
        0 < x.length && (v = new y(v, w, null, r, g), h.push({ event: v, listeners: x }));
      }
    }
    if (!(t & 7)) {
      e: {
        if (v = e === "mouseover" || e === "pointerover", y = e === "mouseout" || e === "pointerout", v && r !== Yl && (w = r.relatedTarget || r.fromElement) && (kr(w) || w[Mt])) break e;
        if ((y || v) && (v = g.window === g ? g : (v = g.ownerDocument) ? v.defaultView || v.parentWindow : window, y ? (w = r.relatedTarget || r.toElement, y = u, w = w ? kr(w) : null, w !== null && (S = Qr(w), w !== S || w.tag !== 5 && w.tag !== 6) && (w = null)) : (y = null, w = u), y !== w)) {
          if (x = du, k = "onMouseLeave", p = "onMouseEnter", d = "mouse", (e === "pointerout" || e === "pointerover") && (x = pu, k = "onPointerLeave", p = "onPointerEnter", d = "pointer"), S = y == null ? v : Zr(y), m = w == null ? v : Zr(w), v = new x(k, d + "leave", y, r, g), v.target = S, v.relatedTarget = m, k = null, kr(g) === u && (x = new x(p, d + "enter", w, r, g), x.target = m, x.relatedTarget = S, k = x), S = k, y && w) t: {
            for (x = y, p = w, d = 0, m = x; m; m = Wr(m)) d++;
            for (m = 0, k = p; k; k = Wr(k)) m++;
            for (; 0 < d - m; ) x = Wr(x), d--;
            for (; 0 < m - d; ) p = Wr(p), m--;
            for (; d--; ) {
              if (x === p || p !== null && x === p.alternate) break t;
              x = Wr(x), p = Wr(p);
            }
            x = null;
          }
          else x = null;
          y !== null && Cu(h, v, y, x, !1), w !== null && S !== null && Cu(h, S, w, x, !0);
        }
      }
      e: {
        if (v = u ? Zr(u) : window, y = v.nodeName && v.nodeName.toLowerCase(), y === "select" || y === "input" && v.type === "file") var C = Qh;
        else if (gu(v)) if (zd) C = Vh;
        else {
          C = Hh;
          var _ = Bh;
        }
        else (y = v.nodeName) && y.toLowerCase() === "input" && (v.type === "checkbox" || v.type === "radio") && (C = Wh);
        if (C && (C = C(e, u))) {
          Pd(h, C, r, g);
          break e;
        }
        _ && _(e, v, u), e === "focusout" && (_ = v._wrapperState) && _.controlled && v.type === "number" && Wl(v, "number", v.value);
      }
      switch (_ = u ? Zr(u) : window, e) {
        case "focusin":
          (gu(_) || _.contentEditable === "true") && (Yr = _, ns = u, no = null);
          break;
        case "focusout":
          no = ns = Yr = null;
          break;
        case "mousedown":
          os = !0;
          break;
        case "contextmenu":
        case "mouseup":
        case "dragend":
          os = !1, ku(h, r, g);
          break;
        case "selectionchange":
          if (qh) break;
        case "keydown":
        case "keyup":
          ku(h, r, g);
      }
      var N;
      if (ca) e: {
        switch (e) {
          case "compositionstart":
            var P = "onCompositionStart";
            break e;
          case "compositionend":
            P = "onCompositionEnd";
            break e;
          case "compositionupdate":
            P = "onCompositionUpdate";
            break e;
        }
        P = void 0;
      }
      else qr ? jd(e, r) && (P = "onCompositionEnd") : e === "keydown" && r.keyCode === 229 && (P = "onCompositionStart");
      P && (Nd && r.locale !== "ko" && (qr || P !== "onCompositionStart" ? P === "onCompositionEnd" && qr && (N = Ed()) : (er = g, sa = "value" in er ? er.value : er.textContent, qr = !0)), _ = Pi(u, P), 0 < _.length && (P = new fu(P, e, null, r, g), h.push({ event: P, listeners: _ }), N ? P.data = N : (N = _d(r), N !== null && (P.data = N)))), (N = Ih ? Dh(e, r) : $h(e, r)) && (u = Pi(u, "onBeforeInput"), 0 < u.length && (g = new fu("onBeforeInput", "beforeinput", null, r, g), h.push({ event: g, listeners: u }), g.data = N));
    }
    Ad(h, t);
  });
}
function yo(e, t, r) {
  return { instance: e, listener: t, currentTarget: r };
}
function Pi(e, t) {
  for (var r = t + "Capture", n = []; e !== null; ) {
    var o = e, i = o.stateNode;
    o.tag === 5 && i !== null && (o = i, i = co(e, r), i != null && n.unshift(yo(e, i, o)), i = co(e, t), i != null && n.push(yo(e, i, o))), e = e.return;
  }
  return n;
}
function Wr(e) {
  if (e === null) return null;
  do
    e = e.return;
  while (e && e.tag !== 5);
  return e || null;
}
function Cu(e, t, r, n, o) {
  for (var i = t._reactName, l = []; r !== null && r !== n; ) {
    var s = r, a = s.alternate, u = s.stateNode;
    if (a !== null && a === n) break;
    s.tag === 5 && u !== null && (s = u, o ? (a = co(r, i), a != null && l.unshift(yo(r, a, s))) : o || (a = co(r, i), a != null && l.push(yo(r, a, s)))), r = r.return;
  }
  l.length !== 0 && e.push({ event: t, listeners: l });
}
var Jh = /\r\n?/g, em = /\u0000|\uFFFD/g;
function Eu(e) {
  return (typeof e == "string" ? e : "" + e).replace(Jh, `
`).replace(em, "");
}
function Zo(e, t, r) {
  if (t = Eu(t), Eu(e) !== t && r) throw Error(b(425));
}
function zi() {
}
var is = null, ls = null;
function ss(e, t) {
  return e === "textarea" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
}
var as = typeof setTimeout == "function" ? setTimeout : void 0, tm = typeof clearTimeout == "function" ? clearTimeout : void 0, Nu = typeof Promise == "function" ? Promise : void 0, rm = typeof queueMicrotask == "function" ? queueMicrotask : typeof Nu < "u" ? function(e) {
  return Nu.resolve(null).then(e).catch(nm);
} : as;
function nm(e) {
  setTimeout(function() {
    throw e;
  });
}
function Nl(e, t) {
  var r = t, n = 0;
  do {
    var o = r.nextSibling;
    if (e.removeChild(r), o && o.nodeType === 8) if (r = o.data, r === "/$") {
      if (n === 0) {
        e.removeChild(o), ho(t);
        return;
      }
      n--;
    } else r !== "$" && r !== "$?" && r !== "$!" || n++;
    r = o;
  } while (r);
  ho(t);
}
function ir(e) {
  for (; e != null; e = e.nextSibling) {
    var t = e.nodeType;
    if (t === 1 || t === 3) break;
    if (t === 8) {
      if (t = e.data, t === "$" || t === "$!" || t === "$?") break;
      if (t === "/$") return null;
    }
  }
  return e;
}
function ju(e) {
  e = e.previousSibling;
  for (var t = 0; e; ) {
    if (e.nodeType === 8) {
      var r = e.data;
      if (r === "$" || r === "$!" || r === "$?") {
        if (t === 0) return e;
        t--;
      } else r === "/$" && t++;
    }
    e = e.previousSibling;
  }
  return null;
}
var On = Math.random().toString(36).slice(2), gt = "__reactFiber$" + On, xo = "__reactProps$" + On, Mt = "__reactContainer$" + On, us = "__reactEvents$" + On, om = "__reactListeners$" + On, im = "__reactHandles$" + On;
function kr(e) {
  var t = e[gt];
  if (t) return t;
  for (var r = e.parentNode; r; ) {
    if (t = r[Mt] || r[gt]) {
      if (r = t.alternate, t.child !== null || r !== null && r.child !== null) for (e = ju(e); e !== null; ) {
        if (r = e[gt]) return r;
        e = ju(e);
      }
      return t;
    }
    e = r, r = e.parentNode;
  }
  return null;
}
function Io(e) {
  return e = e[gt] || e[Mt], !e || e.tag !== 5 && e.tag !== 6 && e.tag !== 13 && e.tag !== 3 ? null : e;
}
function Zr(e) {
  if (e.tag === 5 || e.tag === 6) return e.stateNode;
  throw Error(b(33));
}
function Xi(e) {
  return e[xo] || null;
}
var cs = [], Jr = -1;
function hr(e) {
  return { current: e };
}
function J(e) {
  0 > Jr || (e.current = cs[Jr], cs[Jr] = null, Jr--);
}
function q(e, t) {
  Jr++, cs[Jr] = e.current, e.current = t;
}
var fr = {}, Ce = hr(fr), Le = hr(!1), Lr = fr;
function jn(e, t) {
  var r = e.type.contextTypes;
  if (!r) return fr;
  var n = e.stateNode;
  if (n && n.__reactInternalMemoizedUnmaskedChildContext === t) return n.__reactInternalMemoizedMaskedChildContext;
  var o = {}, i;
  for (i in r) o[i] = t[i];
  return n && (e = e.stateNode, e.__reactInternalMemoizedUnmaskedChildContext = t, e.__reactInternalMemoizedMaskedChildContext = o), o;
}
function Ie(e) {
  return e = e.childContextTypes, e != null;
}
function Mi() {
  J(Le), J(Ce);
}
function _u(e, t, r) {
  if (Ce.current !== fr) throw Error(b(168));
  q(Ce, t), q(Le, r);
}
function Qd(e, t, r) {
  var n = e.stateNode;
  if (t = t.childContextTypes, typeof n.getChildContext != "function") return r;
  n = n.getChildContext();
  for (var o in n) if (!(o in t)) throw Error(b(108, Bp(e) || "Unknown", o));
  return oe({}, r, n);
}
function Ri(e) {
  return e = (e = e.stateNode) && e.__reactInternalMemoizedMergedChildContext || fr, Lr = Ce.current, q(Ce, e), q(Le, Le.current), !0;
}
function Pu(e, t, r) {
  var n = e.stateNode;
  if (!n) throw Error(b(169));
  r ? (e = Qd(e, t, Lr), n.__reactInternalMemoizedMergedChildContext = e, J(Le), J(Ce), q(Ce, e)) : J(Le), q(Le, r);
}
var Ct = null, Zi = !1, jl = !1;
function Bd(e) {
  Ct === null ? Ct = [e] : Ct.push(e);
}
function lm(e) {
  Zi = !0, Bd(e);
}
function mr() {
  if (!jl && Ct !== null) {
    jl = !0;
    var e = 0, t = K;
    try {
      var r = Ct;
      for (K = 1; e < r.length; e++) {
        var n = r[e];
        do
          n = n(!0);
        while (n !== null);
      }
      Ct = null, Zi = !1;
    } catch (o) {
      throw Ct !== null && (Ct = Ct.slice(e + 1)), hd(na, mr), o;
    } finally {
      K = t, jl = !1;
    }
  }
  return null;
}
var en = [], tn = 0, Ti = null, Fi = 0, Ye = [], Xe = 0, Ir = null, jt = 1, _t = "";
function yr(e, t) {
  en[tn++] = Fi, en[tn++] = Ti, Ti = e, Fi = t;
}
function Hd(e, t, r) {
  Ye[Xe++] = jt, Ye[Xe++] = _t, Ye[Xe++] = Ir, Ir = e;
  var n = jt;
  e = _t;
  var o = 32 - st(n) - 1;
  n &= ~(1 << o), r += 1;
  var i = 32 - st(t) + o;
  if (30 < i) {
    var l = o - o % 5;
    i = (n & (1 << l) - 1).toString(32), n >>= l, o -= l, jt = 1 << 32 - st(t) + o | r << o | n, _t = i + e;
  } else jt = 1 << i | r << o | n, _t = e;
}
function fa(e) {
  e.return !== null && (yr(e, 1), Hd(e, 1, 0));
}
function pa(e) {
  for (; e === Ti; ) Ti = en[--tn], en[tn] = null, Fi = en[--tn], en[tn] = null;
  for (; e === Ir; ) Ir = Ye[--Xe], Ye[Xe] = null, _t = Ye[--Xe], Ye[Xe] = null, jt = Ye[--Xe], Ye[Xe] = null;
}
var He = null, Be = null, te = !1, lt = null;
function Wd(e, t) {
  var r = Ze(5, null, null, 0);
  r.elementType = "DELETED", r.stateNode = t, r.return = e, t = e.deletions, t === null ? (e.deletions = [r], e.flags |= 16) : t.push(r);
}
function zu(e, t) {
  switch (e.tag) {
    case 5:
      var r = e.type;
      return t = t.nodeType !== 1 || r.toLowerCase() !== t.nodeName.toLowerCase() ? null : t, t !== null ? (e.stateNode = t, He = e, Be = ir(t.firstChild), !0) : !1;
    case 6:
      return t = e.pendingProps === "" || t.nodeType !== 3 ? null : t, t !== null ? (e.stateNode = t, He = e, Be = null, !0) : !1;
    case 13:
      return t = t.nodeType !== 8 ? null : t, t !== null ? (r = Ir !== null ? { id: jt, overflow: _t } : null, e.memoizedState = { dehydrated: t, treeContext: r, retryLane: 1073741824 }, r = Ze(18, null, null, 0), r.stateNode = t, r.return = e, e.child = r, He = e, Be = null, !0) : !1;
    default:
      return !1;
  }
}
function ds(e) {
  return (e.mode & 1) !== 0 && (e.flags & 128) === 0;
}
function fs(e) {
  if (te) {
    var t = Be;
    if (t) {
      var r = t;
      if (!zu(e, t)) {
        if (ds(e)) throw Error(b(418));
        t = ir(r.nextSibling);
        var n = He;
        t && zu(e, t) ? Wd(n, r) : (e.flags = e.flags & -4097 | 2, te = !1, He = e);
      }
    } else {
      if (ds(e)) throw Error(b(418));
      e.flags = e.flags & -4097 | 2, te = !1, He = e;
    }
  }
}
function Mu(e) {
  for (e = e.return; e !== null && e.tag !== 5 && e.tag !== 3 && e.tag !== 13; ) e = e.return;
  He = e;
}
function Jo(e) {
  if (e !== He) return !1;
  if (!te) return Mu(e), te = !0, !1;
  var t;
  if ((t = e.tag !== 3) && !(t = e.tag !== 5) && (t = e.type, t = t !== "head" && t !== "body" && !ss(e.type, e.memoizedProps)), t && (t = Be)) {
    if (ds(e)) throw Vd(), Error(b(418));
    for (; t; ) Wd(e, t), t = ir(t.nextSibling);
  }
  if (Mu(e), e.tag === 13) {
    if (e = e.memoizedState, e = e !== null ? e.dehydrated : null, !e) throw Error(b(317));
    e: {
      for (e = e.nextSibling, t = 0; e; ) {
        if (e.nodeType === 8) {
          var r = e.data;
          if (r === "/$") {
            if (t === 0) {
              Be = ir(e.nextSibling);
              break e;
            }
            t--;
          } else r !== "$" && r !== "$!" && r !== "$?" || t++;
        }
        e = e.nextSibling;
      }
      Be = null;
    }
  } else Be = He ? ir(e.stateNode.nextSibling) : null;
  return !0;
}
function Vd() {
  for (var e = Be; e; ) e = ir(e.nextSibling);
}
function _n() {
  Be = He = null, te = !1;
}
function ha(e) {
  lt === null ? lt = [e] : lt.push(e);
}
var sm = Ft.ReactCurrentBatchConfig;
function Qn(e, t, r) {
  if (e = r.ref, e !== null && typeof e != "function" && typeof e != "object") {
    if (r._owner) {
      if (r = r._owner, r) {
        if (r.tag !== 1) throw Error(b(309));
        var n = r.stateNode;
      }
      if (!n) throw Error(b(147, e));
      var o = n, i = "" + e;
      return t !== null && t.ref !== null && typeof t.ref == "function" && t.ref._stringRef === i ? t.ref : (t = function(l) {
        var s = o.refs;
        l === null ? delete s[i] : s[i] = l;
      }, t._stringRef = i, t);
    }
    if (typeof e != "string") throw Error(b(284));
    if (!r._owner) throw Error(b(290, e));
  }
  return e;
}
function ei(e, t) {
  throw e = Object.prototype.toString.call(t), Error(b(31, e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e));
}
function Ru(e) {
  var t = e._init;
  return t(e._payload);
}
function Kd(e) {
  function t(p, d) {
    if (e) {
      var m = p.deletions;
      m === null ? (p.deletions = [d], p.flags |= 16) : m.push(d);
    }
  }
  function r(p, d) {
    if (!e) return null;
    for (; d !== null; ) t(p, d), d = d.sibling;
    return null;
  }
  function n(p, d) {
    for (p = /* @__PURE__ */ new Map(); d !== null; ) d.key !== null ? p.set(d.key, d) : p.set(d.index, d), d = d.sibling;
    return p;
  }
  function o(p, d) {
    return p = ur(p, d), p.index = 0, p.sibling = null, p;
  }
  function i(p, d, m) {
    return p.index = m, e ? (m = p.alternate, m !== null ? (m = m.index, m < d ? (p.flags |= 2, d) : m) : (p.flags |= 2, d)) : (p.flags |= 1048576, d);
  }
  function l(p) {
    return e && p.alternate === null && (p.flags |= 2), p;
  }
  function s(p, d, m, k) {
    return d === null || d.tag !== 6 ? (d = Fl(m, p.mode, k), d.return = p, d) : (d = o(d, m), d.return = p, d);
  }
  function a(p, d, m, k) {
    var C = m.type;
    return C === Gr ? g(p, d, m.props.children, k, m.key) : d !== null && (d.elementType === C || typeof C == "object" && C !== null && C.$$typeof === Qt && Ru(C) === d.type) ? (k = o(d, m.props), k.ref = Qn(p, d, m), k.return = p, k) : (k = xi(m.type, m.key, m.props, null, p.mode, k), k.ref = Qn(p, d, m), k.return = p, k);
  }
  function u(p, d, m, k) {
    return d === null || d.tag !== 4 || d.stateNode.containerInfo !== m.containerInfo || d.stateNode.implementation !== m.implementation ? (d = Ol(m, p.mode, k), d.return = p, d) : (d = o(d, m.children || []), d.return = p, d);
  }
  function g(p, d, m, k, C) {
    return d === null || d.tag !== 7 ? (d = Or(m, p.mode, k, C), d.return = p, d) : (d = o(d, m), d.return = p, d);
  }
  function h(p, d, m) {
    if (typeof d == "string" && d !== "" || typeof d == "number") return d = Fl("" + d, p.mode, m), d.return = p, d;
    if (typeof d == "object" && d !== null) {
      switch (d.$$typeof) {
        case Bo:
          return m = xi(d.type, d.key, d.props, null, p.mode, m), m.ref = Qn(p, null, d), m.return = p, m;
        case Kr:
          return d = Ol(d, p.mode, m), d.return = p, d;
        case Qt:
          var k = d._init;
          return h(p, k(d._payload), m);
      }
      if (qn(d) || In(d)) return d = Or(d, p.mode, m, null), d.return = p, d;
      ei(p, d);
    }
    return null;
  }
  function v(p, d, m, k) {
    var C = d !== null ? d.key : null;
    if (typeof m == "string" && m !== "" || typeof m == "number") return C !== null ? null : s(p, d, "" + m, k);
    if (typeof m == "object" && m !== null) {
      switch (m.$$typeof) {
        case Bo:
          return m.key === C ? a(p, d, m, k) : null;
        case Kr:
          return m.key === C ? u(p, d, m, k) : null;
        case Qt:
          return C = m._init, v(
            p,
            d,
            C(m._payload),
            k
          );
      }
      if (qn(m) || In(m)) return C !== null ? null : g(p, d, m, k, null);
      ei(p, m);
    }
    return null;
  }
  function y(p, d, m, k, C) {
    if (typeof k == "string" && k !== "" || typeof k == "number") return p = p.get(m) || null, s(d, p, "" + k, C);
    if (typeof k == "object" && k !== null) {
      switch (k.$$typeof) {
        case Bo:
          return p = p.get(k.key === null ? m : k.key) || null, a(d, p, k, C);
        case Kr:
          return p = p.get(k.key === null ? m : k.key) || null, u(d, p, k, C);
        case Qt:
          var _ = k._init;
          return y(p, d, m, _(k._payload), C);
      }
      if (qn(k) || In(k)) return p = p.get(m) || null, g(d, p, k, C, null);
      ei(d, k);
    }
    return null;
  }
  function w(p, d, m, k) {
    for (var C = null, _ = null, N = d, P = d = 0, R = null; N !== null && P < m.length; P++) {
      N.index > P ? (R = N, N = null) : R = N.sibling;
      var T = v(p, N, m[P], k);
      if (T === null) {
        N === null && (N = R);
        break;
      }
      e && N && T.alternate === null && t(p, N), d = i(T, d, P), _ === null ? C = T : _.sibling = T, _ = T, N = R;
    }
    if (P === m.length) return r(p, N), te && yr(p, P), C;
    if (N === null) {
      for (; P < m.length; P++) N = h(p, m[P], k), N !== null && (d = i(N, d, P), _ === null ? C = N : _.sibling = N, _ = N);
      return te && yr(p, P), C;
    }
    for (N = n(p, N); P < m.length; P++) R = y(N, p, P, m[P], k), R !== null && (e && R.alternate !== null && N.delete(R.key === null ? P : R.key), d = i(R, d, P), _ === null ? C = R : _.sibling = R, _ = R);
    return e && N.forEach(function(Y) {
      return t(p, Y);
    }), te && yr(p, P), C;
  }
  function x(p, d, m, k) {
    var C = In(m);
    if (typeof C != "function") throw Error(b(150));
    if (m = C.call(m), m == null) throw Error(b(151));
    for (var _ = C = null, N = d, P = d = 0, R = null, T = m.next(); N !== null && !T.done; P++, T = m.next()) {
      N.index > P ? (R = N, N = null) : R = N.sibling;
      var Y = v(p, N, T.value, k);
      if (Y === null) {
        N === null && (N = R);
        break;
      }
      e && N && Y.alternate === null && t(p, N), d = i(Y, d, P), _ === null ? C = Y : _.sibling = Y, _ = Y, N = R;
    }
    if (T.done) return r(
      p,
      N
    ), te && yr(p, P), C;
    if (N === null) {
      for (; !T.done; P++, T = m.next()) T = h(p, T.value, k), T !== null && (d = i(T, d, P), _ === null ? C = T : _.sibling = T, _ = T);
      return te && yr(p, P), C;
    }
    for (N = n(p, N); !T.done; P++, T = m.next()) T = y(N, p, P, T.value, k), T !== null && (e && T.alternate !== null && N.delete(T.key === null ? P : T.key), d = i(T, d, P), _ === null ? C = T : _.sibling = T, _ = T);
    return e && N.forEach(function(U) {
      return t(p, U);
    }), te && yr(p, P), C;
  }
  function S(p, d, m, k) {
    if (typeof m == "object" && m !== null && m.type === Gr && m.key === null && (m = m.props.children), typeof m == "object" && m !== null) {
      switch (m.$$typeof) {
        case Bo:
          e: {
            for (var C = m.key, _ = d; _ !== null; ) {
              if (_.key === C) {
                if (C = m.type, C === Gr) {
                  if (_.tag === 7) {
                    r(p, _.sibling), d = o(_, m.props.children), d.return = p, p = d;
                    break e;
                  }
                } else if (_.elementType === C || typeof C == "object" && C !== null && C.$$typeof === Qt && Ru(C) === _.type) {
                  r(p, _.sibling), d = o(_, m.props), d.ref = Qn(p, _, m), d.return = p, p = d;
                  break e;
                }
                r(p, _);
                break;
              } else t(p, _);
              _ = _.sibling;
            }
            m.type === Gr ? (d = Or(m.props.children, p.mode, k, m.key), d.return = p, p = d) : (k = xi(m.type, m.key, m.props, null, p.mode, k), k.ref = Qn(p, d, m), k.return = p, p = k);
          }
          return l(p);
        case Kr:
          e: {
            for (_ = m.key; d !== null; ) {
              if (d.key === _) if (d.tag === 4 && d.stateNode.containerInfo === m.containerInfo && d.stateNode.implementation === m.implementation) {
                r(p, d.sibling), d = o(d, m.children || []), d.return = p, p = d;
                break e;
              } else {
                r(p, d);
                break;
              }
              else t(p, d);
              d = d.sibling;
            }
            d = Ol(m, p.mode, k), d.return = p, p = d;
          }
          return l(p);
        case Qt:
          return _ = m._init, S(p, d, _(m._payload), k);
      }
      if (qn(m)) return w(p, d, m, k);
      if (In(m)) return x(p, d, m, k);
      ei(p, m);
    }
    return typeof m == "string" && m !== "" || typeof m == "number" ? (m = "" + m, d !== null && d.tag === 6 ? (r(p, d.sibling), d = o(d, m), d.return = p, p = d) : (r(p, d), d = Fl(m, p.mode, k), d.return = p, p = d), l(p)) : r(p, d);
  }
  return S;
}
var Pn = Kd(!0), Gd = Kd(!1), Oi = hr(null), Li = null, rn = null, ma = null;
function ga() {
  ma = rn = Li = null;
}
function va(e) {
  var t = Oi.current;
  J(Oi), e._currentValue = t;
}
function ps(e, t, r) {
  for (; e !== null; ) {
    var n = e.alternate;
    if ((e.childLanes & t) !== t ? (e.childLanes |= t, n !== null && (n.childLanes |= t)) : n !== null && (n.childLanes & t) !== t && (n.childLanes |= t), e === r) break;
    e = e.return;
  }
}
function cn(e, t) {
  Li = e, ma = rn = null, e = e.dependencies, e !== null && e.firstContext !== null && (e.lanes & t && (Oe = !0), e.firstContext = null);
}
function et(e) {
  var t = e._currentValue;
  if (ma !== e) if (e = { context: e, memoizedValue: t, next: null }, rn === null) {
    if (Li === null) throw Error(b(308));
    rn = e, Li.dependencies = { lanes: 0, firstContext: e };
  } else rn = rn.next = e;
  return t;
}
var br = null;
function ya(e) {
  br === null ? br = [e] : br.push(e);
}
function qd(e, t, r, n) {
  var o = t.interleaved;
  return o === null ? (r.next = r, ya(t)) : (r.next = o.next, o.next = r), t.interleaved = r, Rt(e, n);
}
function Rt(e, t) {
  e.lanes |= t;
  var r = e.alternate;
  for (r !== null && (r.lanes |= t), r = e, e = e.return; e !== null; ) e.childLanes |= t, r = e.alternate, r !== null && (r.childLanes |= t), r = e, e = e.return;
  return r.tag === 3 ? r.stateNode : null;
}
var Bt = !1;
function xa(e) {
  e.updateQueue = { baseState: e.memoizedState, firstBaseUpdate: null, lastBaseUpdate: null, shared: { pending: null, interleaved: null, lanes: 0 }, effects: null };
}
function Yd(e, t) {
  e = e.updateQueue, t.updateQueue === e && (t.updateQueue = { baseState: e.baseState, firstBaseUpdate: e.firstBaseUpdate, lastBaseUpdate: e.lastBaseUpdate, shared: e.shared, effects: e.effects });
}
function Pt(e, t) {
  return { eventTime: e, lane: t, tag: 0, payload: null, callback: null, next: null };
}
function lr(e, t, r) {
  var n = e.updateQueue;
  if (n === null) return null;
  if (n = n.shared, W & 2) {
    var o = n.pending;
    return o === null ? t.next = t : (t.next = o.next, o.next = t), n.pending = t, Rt(e, r);
  }
  return o = n.interleaved, o === null ? (t.next = t, ya(n)) : (t.next = o.next, o.next = t), n.interleaved = t, Rt(e, r);
}
function pi(e, t, r) {
  if (t = t.updateQueue, t !== null && (t = t.shared, (r & 4194240) !== 0)) {
    var n = t.lanes;
    n &= e.pendingLanes, r |= n, t.lanes = r, oa(e, r);
  }
}
function Tu(e, t) {
  var r = e.updateQueue, n = e.alternate;
  if (n !== null && (n = n.updateQueue, r === n)) {
    var o = null, i = null;
    if (r = r.firstBaseUpdate, r !== null) {
      do {
        var l = { eventTime: r.eventTime, lane: r.lane, tag: r.tag, payload: r.payload, callback: r.callback, next: null };
        i === null ? o = i = l : i = i.next = l, r = r.next;
      } while (r !== null);
      i === null ? o = i = t : i = i.next = t;
    } else o = i = t;
    r = { baseState: n.baseState, firstBaseUpdate: o, lastBaseUpdate: i, shared: n.shared, effects: n.effects }, e.updateQueue = r;
    return;
  }
  e = r.lastBaseUpdate, e === null ? r.firstBaseUpdate = t : e.next = t, r.lastBaseUpdate = t;
}
function Ii(e, t, r, n) {
  var o = e.updateQueue;
  Bt = !1;
  var i = o.firstBaseUpdate, l = o.lastBaseUpdate, s = o.shared.pending;
  if (s !== null) {
    o.shared.pending = null;
    var a = s, u = a.next;
    a.next = null, l === null ? i = u : l.next = u, l = a;
    var g = e.alternate;
    g !== null && (g = g.updateQueue, s = g.lastBaseUpdate, s !== l && (s === null ? g.firstBaseUpdate = u : s.next = u, g.lastBaseUpdate = a));
  }
  if (i !== null) {
    var h = o.baseState;
    l = 0, g = u = a = null, s = i;
    do {
      var v = s.lane, y = s.eventTime;
      if ((n & v) === v) {
        g !== null && (g = g.next = {
          eventTime: y,
          lane: 0,
          tag: s.tag,
          payload: s.payload,
          callback: s.callback,
          next: null
        });
        e: {
          var w = e, x = s;
          switch (v = t, y = r, x.tag) {
            case 1:
              if (w = x.payload, typeof w == "function") {
                h = w.call(y, h, v);
                break e;
              }
              h = w;
              break e;
            case 3:
              w.flags = w.flags & -65537 | 128;
            case 0:
              if (w = x.payload, v = typeof w == "function" ? w.call(y, h, v) : w, v == null) break e;
              h = oe({}, h, v);
              break e;
            case 2:
              Bt = !0;
          }
        }
        s.callback !== null && s.lane !== 0 && (e.flags |= 64, v = o.effects, v === null ? o.effects = [s] : v.push(s));
      } else y = { eventTime: y, lane: v, tag: s.tag, payload: s.payload, callback: s.callback, next: null }, g === null ? (u = g = y, a = h) : g = g.next = y, l |= v;
      if (s = s.next, s === null) {
        if (s = o.shared.pending, s === null) break;
        v = s, s = v.next, v.next = null, o.lastBaseUpdate = v, o.shared.pending = null;
      }
    } while (!0);
    if (g === null && (a = h), o.baseState = a, o.firstBaseUpdate = u, o.lastBaseUpdate = g, t = o.shared.interleaved, t !== null) {
      o = t;
      do
        l |= o.lane, o = o.next;
      while (o !== t);
    } else i === null && (o.shared.lanes = 0);
    $r |= l, e.lanes = l, e.memoizedState = h;
  }
}
function Fu(e, t, r) {
  if (e = t.effects, t.effects = null, e !== null) for (t = 0; t < e.length; t++) {
    var n = e[t], o = n.callback;
    if (o !== null) {
      if (n.callback = null, n = r, typeof o != "function") throw Error(b(191, o));
      o.call(n);
    }
  }
}
var Do = {}, yt = hr(Do), wo = hr(Do), ko = hr(Do);
function Sr(e) {
  if (e === Do) throw Error(b(174));
  return e;
}
function wa(e, t) {
  switch (q(ko, t), q(wo, e), q(yt, Do), e = t.nodeType, e) {
    case 9:
    case 11:
      t = (t = t.documentElement) ? t.namespaceURI : Kl(null, "");
      break;
    default:
      e = e === 8 ? t.parentNode : t, t = e.namespaceURI || null, e = e.tagName, t = Kl(t, e);
  }
  J(yt), q(yt, t);
}
function zn() {
  J(yt), J(wo), J(ko);
}
function Xd(e) {
  Sr(ko.current);
  var t = Sr(yt.current), r = Kl(t, e.type);
  t !== r && (q(wo, e), q(yt, r));
}
function ka(e) {
  wo.current === e && (J(yt), J(wo));
}
var re = hr(0);
function Di(e) {
  for (var t = e; t !== null; ) {
    if (t.tag === 13) {
      var r = t.memoizedState;
      if (r !== null && (r = r.dehydrated, r === null || r.data === "$?" || r.data === "$!")) return t;
    } else if (t.tag === 19 && t.memoizedProps.revealOrder !== void 0) {
      if (t.flags & 128) return t;
    } else if (t.child !== null) {
      t.child.return = t, t = t.child;
      continue;
    }
    if (t === e) break;
    for (; t.sibling === null; ) {
      if (t.return === null || t.return === e) return null;
      t = t.return;
    }
    t.sibling.return = t.return, t = t.sibling;
  }
  return null;
}
var _l = [];
function ba() {
  for (var e = 0; e < _l.length; e++) _l[e]._workInProgressVersionPrimary = null;
  _l.length = 0;
}
var hi = Ft.ReactCurrentDispatcher, Pl = Ft.ReactCurrentBatchConfig, Dr = 0, ne = null, ce = null, pe = null, $i = !1, oo = !1, bo = 0, am = 0;
function we() {
  throw Error(b(321));
}
function Sa(e, t) {
  if (t === null) return !1;
  for (var r = 0; r < t.length && r < e.length; r++) if (!ut(e[r], t[r])) return !1;
  return !0;
}
function Ca(e, t, r, n, o, i) {
  if (Dr = i, ne = t, t.memoizedState = null, t.updateQueue = null, t.lanes = 0, hi.current = e === null || e.memoizedState === null ? fm : pm, e = r(n, o), oo) {
    i = 0;
    do {
      if (oo = !1, bo = 0, 25 <= i) throw Error(b(301));
      i += 1, pe = ce = null, t.updateQueue = null, hi.current = hm, e = r(n, o);
    } while (oo);
  }
  if (hi.current = Ai, t = ce !== null && ce.next !== null, Dr = 0, pe = ce = ne = null, $i = !1, t) throw Error(b(300));
  return e;
}
function Ea() {
  var e = bo !== 0;
  return bo = 0, e;
}
function ft() {
  var e = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
  return pe === null ? ne.memoizedState = pe = e : pe = pe.next = e, pe;
}
function tt() {
  if (ce === null) {
    var e = ne.alternate;
    e = e !== null ? e.memoizedState : null;
  } else e = ce.next;
  var t = pe === null ? ne.memoizedState : pe.next;
  if (t !== null) pe = t, ce = e;
  else {
    if (e === null) throw Error(b(310));
    ce = e, e = { memoizedState: ce.memoizedState, baseState: ce.baseState, baseQueue: ce.baseQueue, queue: ce.queue, next: null }, pe === null ? ne.memoizedState = pe = e : pe = pe.next = e;
  }
  return pe;
}
function So(e, t) {
  return typeof t == "function" ? t(e) : t;
}
function zl(e) {
  var t = tt(), r = t.queue;
  if (r === null) throw Error(b(311));
  r.lastRenderedReducer = e;
  var n = ce, o = n.baseQueue, i = r.pending;
  if (i !== null) {
    if (o !== null) {
      var l = o.next;
      o.next = i.next, i.next = l;
    }
    n.baseQueue = o = i, r.pending = null;
  }
  if (o !== null) {
    i = o.next, n = n.baseState;
    var s = l = null, a = null, u = i;
    do {
      var g = u.lane;
      if ((Dr & g) === g) a !== null && (a = a.next = { lane: 0, action: u.action, hasEagerState: u.hasEagerState, eagerState: u.eagerState, next: null }), n = u.hasEagerState ? u.eagerState : e(n, u.action);
      else {
        var h = {
          lane: g,
          action: u.action,
          hasEagerState: u.hasEagerState,
          eagerState: u.eagerState,
          next: null
        };
        a === null ? (s = a = h, l = n) : a = a.next = h, ne.lanes |= g, $r |= g;
      }
      u = u.next;
    } while (u !== null && u !== i);
    a === null ? l = n : a.next = s, ut(n, t.memoizedState) || (Oe = !0), t.memoizedState = n, t.baseState = l, t.baseQueue = a, r.lastRenderedState = n;
  }
  if (e = r.interleaved, e !== null) {
    o = e;
    do
      i = o.lane, ne.lanes |= i, $r |= i, o = o.next;
    while (o !== e);
  } else o === null && (r.lanes = 0);
  return [t.memoizedState, r.dispatch];
}
function Ml(e) {
  var t = tt(), r = t.queue;
  if (r === null) throw Error(b(311));
  r.lastRenderedReducer = e;
  var n = r.dispatch, o = r.pending, i = t.memoizedState;
  if (o !== null) {
    r.pending = null;
    var l = o = o.next;
    do
      i = e(i, l.action), l = l.next;
    while (l !== o);
    ut(i, t.memoizedState) || (Oe = !0), t.memoizedState = i, t.baseQueue === null && (t.baseState = i), r.lastRenderedState = i;
  }
  return [i, n];
}
function Zd() {
}
function Jd(e, t) {
  var r = ne, n = tt(), o = t(), i = !ut(n.memoizedState, o);
  if (i && (n.memoizedState = o, Oe = !0), n = n.queue, Na(rf.bind(null, r, n, e), [e]), n.getSnapshot !== t || i || pe !== null && pe.memoizedState.tag & 1) {
    if (r.flags |= 2048, Co(9, tf.bind(null, r, n, o, t), void 0, null), he === null) throw Error(b(349));
    Dr & 30 || ef(r, t, o);
  }
  return o;
}
function ef(e, t, r) {
  e.flags |= 16384, e = { getSnapshot: t, value: r }, t = ne.updateQueue, t === null ? (t = { lastEffect: null, stores: null }, ne.updateQueue = t, t.stores = [e]) : (r = t.stores, r === null ? t.stores = [e] : r.push(e));
}
function tf(e, t, r, n) {
  t.value = r, t.getSnapshot = n, nf(t) && of(e);
}
function rf(e, t, r) {
  return r(function() {
    nf(t) && of(e);
  });
}
function nf(e) {
  var t = e.getSnapshot;
  e = e.value;
  try {
    var r = t();
    return !ut(e, r);
  } catch {
    return !0;
  }
}
function of(e) {
  var t = Rt(e, 1);
  t !== null && at(t, e, 1, -1);
}
function Ou(e) {
  var t = ft();
  return typeof e == "function" && (e = e()), t.memoizedState = t.baseState = e, e = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: So, lastRenderedState: e }, t.queue = e, e = e.dispatch = dm.bind(null, ne, e), [t.memoizedState, e];
}
function Co(e, t, r, n) {
  return e = { tag: e, create: t, destroy: r, deps: n, next: null }, t = ne.updateQueue, t === null ? (t = { lastEffect: null, stores: null }, ne.updateQueue = t, t.lastEffect = e.next = e) : (r = t.lastEffect, r === null ? t.lastEffect = e.next = e : (n = r.next, r.next = e, e.next = n, t.lastEffect = e)), e;
}
function lf() {
  return tt().memoizedState;
}
function mi(e, t, r, n) {
  var o = ft();
  ne.flags |= e, o.memoizedState = Co(1 | t, r, void 0, n === void 0 ? null : n);
}
function Ji(e, t, r, n) {
  var o = tt();
  n = n === void 0 ? null : n;
  var i = void 0;
  if (ce !== null) {
    var l = ce.memoizedState;
    if (i = l.destroy, n !== null && Sa(n, l.deps)) {
      o.memoizedState = Co(t, r, i, n);
      return;
    }
  }
  ne.flags |= e, o.memoizedState = Co(1 | t, r, i, n);
}
function Lu(e, t) {
  return mi(8390656, 8, e, t);
}
function Na(e, t) {
  return Ji(2048, 8, e, t);
}
function sf(e, t) {
  return Ji(4, 2, e, t);
}
function af(e, t) {
  return Ji(4, 4, e, t);
}
function uf(e, t) {
  if (typeof t == "function") return e = e(), t(e), function() {
    t(null);
  };
  if (t != null) return e = e(), t.current = e, function() {
    t.current = null;
  };
}
function cf(e, t, r) {
  return r = r != null ? r.concat([e]) : null, Ji(4, 4, uf.bind(null, t, e), r);
}
function ja() {
}
function df(e, t) {
  var r = tt();
  t = t === void 0 ? null : t;
  var n = r.memoizedState;
  return n !== null && t !== null && Sa(t, n[1]) ? n[0] : (r.memoizedState = [e, t], e);
}
function ff(e, t) {
  var r = tt();
  t = t === void 0 ? null : t;
  var n = r.memoizedState;
  return n !== null && t !== null && Sa(t, n[1]) ? n[0] : (e = e(), r.memoizedState = [e, t], e);
}
function pf(e, t, r) {
  return Dr & 21 ? (ut(r, t) || (r = vd(), ne.lanes |= r, $r |= r, e.baseState = !0), t) : (e.baseState && (e.baseState = !1, Oe = !0), e.memoizedState = r);
}
function um(e, t) {
  var r = K;
  K = r !== 0 && 4 > r ? r : 4, e(!0);
  var n = Pl.transition;
  Pl.transition = {};
  try {
    e(!1), t();
  } finally {
    K = r, Pl.transition = n;
  }
}
function hf() {
  return tt().memoizedState;
}
function cm(e, t, r) {
  var n = ar(e);
  if (r = { lane: n, action: r, hasEagerState: !1, eagerState: null, next: null }, mf(e)) gf(t, r);
  else if (r = qd(e, t, r, n), r !== null) {
    var o = _e();
    at(r, e, n, o), vf(r, t, n);
  }
}
function dm(e, t, r) {
  var n = ar(e), o = { lane: n, action: r, hasEagerState: !1, eagerState: null, next: null };
  if (mf(e)) gf(t, o);
  else {
    var i = e.alternate;
    if (e.lanes === 0 && (i === null || i.lanes === 0) && (i = t.lastRenderedReducer, i !== null)) try {
      var l = t.lastRenderedState, s = i(l, r);
      if (o.hasEagerState = !0, o.eagerState = s, ut(s, l)) {
        var a = t.interleaved;
        a === null ? (o.next = o, ya(t)) : (o.next = a.next, a.next = o), t.interleaved = o;
        return;
      }
    } catch {
    } finally {
    }
    r = qd(e, t, o, n), r !== null && (o = _e(), at(r, e, n, o), vf(r, t, n));
  }
}
function mf(e) {
  var t = e.alternate;
  return e === ne || t !== null && t === ne;
}
function gf(e, t) {
  oo = $i = !0;
  var r = e.pending;
  r === null ? t.next = t : (t.next = r.next, r.next = t), e.pending = t;
}
function vf(e, t, r) {
  if (r & 4194240) {
    var n = t.lanes;
    n &= e.pendingLanes, r |= n, t.lanes = r, oa(e, r);
  }
}
var Ai = { readContext: et, useCallback: we, useContext: we, useEffect: we, useImperativeHandle: we, useInsertionEffect: we, useLayoutEffect: we, useMemo: we, useReducer: we, useRef: we, useState: we, useDebugValue: we, useDeferredValue: we, useTransition: we, useMutableSource: we, useSyncExternalStore: we, useId: we, unstable_isNewReconciler: !1 }, fm = { readContext: et, useCallback: function(e, t) {
  return ft().memoizedState = [e, t === void 0 ? null : t], e;
}, useContext: et, useEffect: Lu, useImperativeHandle: function(e, t, r) {
  return r = r != null ? r.concat([e]) : null, mi(
    4194308,
    4,
    uf.bind(null, t, e),
    r
  );
}, useLayoutEffect: function(e, t) {
  return mi(4194308, 4, e, t);
}, useInsertionEffect: function(e, t) {
  return mi(4, 2, e, t);
}, useMemo: function(e, t) {
  var r = ft();
  return t = t === void 0 ? null : t, e = e(), r.memoizedState = [e, t], e;
}, useReducer: function(e, t, r) {
  var n = ft();
  return t = r !== void 0 ? r(t) : t, n.memoizedState = n.baseState = t, e = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: e, lastRenderedState: t }, n.queue = e, e = e.dispatch = cm.bind(null, ne, e), [n.memoizedState, e];
}, useRef: function(e) {
  var t = ft();
  return e = { current: e }, t.memoizedState = e;
}, useState: Ou, useDebugValue: ja, useDeferredValue: function(e) {
  return ft().memoizedState = e;
}, useTransition: function() {
  var e = Ou(!1), t = e[0];
  return e = um.bind(null, e[1]), ft().memoizedState = e, [t, e];
}, useMutableSource: function() {
}, useSyncExternalStore: function(e, t, r) {
  var n = ne, o = ft();
  if (te) {
    if (r === void 0) throw Error(b(407));
    r = r();
  } else {
    if (r = t(), he === null) throw Error(b(349));
    Dr & 30 || ef(n, t, r);
  }
  o.memoizedState = r;
  var i = { value: r, getSnapshot: t };
  return o.queue = i, Lu(rf.bind(
    null,
    n,
    i,
    e
  ), [e]), n.flags |= 2048, Co(9, tf.bind(null, n, i, r, t), void 0, null), r;
}, useId: function() {
  var e = ft(), t = he.identifierPrefix;
  if (te) {
    var r = _t, n = jt;
    r = (n & ~(1 << 32 - st(n) - 1)).toString(32) + r, t = ":" + t + "R" + r, r = bo++, 0 < r && (t += "H" + r.toString(32)), t += ":";
  } else r = am++, t = ":" + t + "r" + r.toString(32) + ":";
  return e.memoizedState = t;
}, unstable_isNewReconciler: !1 }, pm = {
  readContext: et,
  useCallback: df,
  useContext: et,
  useEffect: Na,
  useImperativeHandle: cf,
  useInsertionEffect: sf,
  useLayoutEffect: af,
  useMemo: ff,
  useReducer: zl,
  useRef: lf,
  useState: function() {
    return zl(So);
  },
  useDebugValue: ja,
  useDeferredValue: function(e) {
    var t = tt();
    return pf(t, ce.memoizedState, e);
  },
  useTransition: function() {
    var e = zl(So)[0], t = tt().memoizedState;
    return [e, t];
  },
  useMutableSource: Zd,
  useSyncExternalStore: Jd,
  useId: hf,
  unstable_isNewReconciler: !1
}, hm = { readContext: et, useCallback: df, useContext: et, useEffect: Na, useImperativeHandle: cf, useInsertionEffect: sf, useLayoutEffect: af, useMemo: ff, useReducer: Ml, useRef: lf, useState: function() {
  return Ml(So);
}, useDebugValue: ja, useDeferredValue: function(e) {
  var t = tt();
  return ce === null ? t.memoizedState = e : pf(t, ce.memoizedState, e);
}, useTransition: function() {
  var e = Ml(So)[0], t = tt().memoizedState;
  return [e, t];
}, useMutableSource: Zd, useSyncExternalStore: Jd, useId: hf, unstable_isNewReconciler: !1 };
function nt(e, t) {
  if (e && e.defaultProps) {
    t = oe({}, t), e = e.defaultProps;
    for (var r in e) t[r] === void 0 && (t[r] = e[r]);
    return t;
  }
  return t;
}
function hs(e, t, r, n) {
  t = e.memoizedState, r = r(n, t), r = r == null ? t : oe({}, t, r), e.memoizedState = r, e.lanes === 0 && (e.updateQueue.baseState = r);
}
var el = { isMounted: function(e) {
  return (e = e._reactInternals) ? Qr(e) === e : !1;
}, enqueueSetState: function(e, t, r) {
  e = e._reactInternals;
  var n = _e(), o = ar(e), i = Pt(n, o);
  i.payload = t, r != null && (i.callback = r), t = lr(e, i, o), t !== null && (at(t, e, o, n), pi(t, e, o));
}, enqueueReplaceState: function(e, t, r) {
  e = e._reactInternals;
  var n = _e(), o = ar(e), i = Pt(n, o);
  i.tag = 1, i.payload = t, r != null && (i.callback = r), t = lr(e, i, o), t !== null && (at(t, e, o, n), pi(t, e, o));
}, enqueueForceUpdate: function(e, t) {
  e = e._reactInternals;
  var r = _e(), n = ar(e), o = Pt(r, n);
  o.tag = 2, t != null && (o.callback = t), t = lr(e, o, n), t !== null && (at(t, e, n, r), pi(t, e, n));
} };
function Iu(e, t, r, n, o, i, l) {
  return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(n, i, l) : t.prototype && t.prototype.isPureReactComponent ? !go(r, n) || !go(o, i) : !0;
}
function yf(e, t, r) {
  var n = !1, o = fr, i = t.contextType;
  return typeof i == "object" && i !== null ? i = et(i) : (o = Ie(t) ? Lr : Ce.current, n = t.contextTypes, i = (n = n != null) ? jn(e, o) : fr), t = new t(r, i), e.memoizedState = t.state !== null && t.state !== void 0 ? t.state : null, t.updater = el, e.stateNode = t, t._reactInternals = e, n && (e = e.stateNode, e.__reactInternalMemoizedUnmaskedChildContext = o, e.__reactInternalMemoizedMaskedChildContext = i), t;
}
function Du(e, t, r, n) {
  e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(r, n), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(r, n), t.state !== e && el.enqueueReplaceState(t, t.state, null);
}
function ms(e, t, r, n) {
  var o = e.stateNode;
  o.props = r, o.state = e.memoizedState, o.refs = {}, xa(e);
  var i = t.contextType;
  typeof i == "object" && i !== null ? o.context = et(i) : (i = Ie(t) ? Lr : Ce.current, o.context = jn(e, i)), o.state = e.memoizedState, i = t.getDerivedStateFromProps, typeof i == "function" && (hs(e, t, i, r), o.state = e.memoizedState), typeof t.getDerivedStateFromProps == "function" || typeof o.getSnapshotBeforeUpdate == "function" || typeof o.UNSAFE_componentWillMount != "function" && typeof o.componentWillMount != "function" || (t = o.state, typeof o.componentWillMount == "function" && o.componentWillMount(), typeof o.UNSAFE_componentWillMount == "function" && o.UNSAFE_componentWillMount(), t !== o.state && el.enqueueReplaceState(o, o.state, null), Ii(e, r, o, n), o.state = e.memoizedState), typeof o.componentDidMount == "function" && (e.flags |= 4194308);
}
function Mn(e, t) {
  try {
    var r = "", n = t;
    do
      r += Qp(n), n = n.return;
    while (n);
    var o = r;
  } catch (i) {
    o = `
Error generating stack: ` + i.message + `
` + i.stack;
  }
  return { value: e, source: t, stack: o, digest: null };
}
function Rl(e, t, r) {
  return { value: e, source: null, stack: r ?? null, digest: t ?? null };
}
function gs(e, t) {
  try {
    console.error(t.value);
  } catch (r) {
    setTimeout(function() {
      throw r;
    });
  }
}
var mm = typeof WeakMap == "function" ? WeakMap : Map;
function xf(e, t, r) {
  r = Pt(-1, r), r.tag = 3, r.payload = { element: null };
  var n = t.value;
  return r.callback = function() {
    Qi || (Qi = !0, Ns = n), gs(e, t);
  }, r;
}
function wf(e, t, r) {
  r = Pt(-1, r), r.tag = 3;
  var n = e.type.getDerivedStateFromError;
  if (typeof n == "function") {
    var o = t.value;
    r.payload = function() {
      return n(o);
    }, r.callback = function() {
      gs(e, t);
    };
  }
  var i = e.stateNode;
  return i !== null && typeof i.componentDidCatch == "function" && (r.callback = function() {
    gs(e, t), typeof n != "function" && (sr === null ? sr = /* @__PURE__ */ new Set([this]) : sr.add(this));
    var l = t.stack;
    this.componentDidCatch(t.value, { componentStack: l !== null ? l : "" });
  }), r;
}
function $u(e, t, r) {
  var n = e.pingCache;
  if (n === null) {
    n = e.pingCache = new mm();
    var o = /* @__PURE__ */ new Set();
    n.set(t, o);
  } else o = n.get(t), o === void 0 && (o = /* @__PURE__ */ new Set(), n.set(t, o));
  o.has(r) || (o.add(r), e = Pm.bind(null, e, t, r), t.then(e, e));
}
function Au(e) {
  do {
    var t;
    if ((t = e.tag === 13) && (t = e.memoizedState, t = t !== null ? t.dehydrated !== null : !0), t) return e;
    e = e.return;
  } while (e !== null);
  return null;
}
function Uu(e, t, r, n, o) {
  return e.mode & 1 ? (e.flags |= 65536, e.lanes = o, e) : (e === t ? e.flags |= 65536 : (e.flags |= 128, r.flags |= 131072, r.flags &= -52805, r.tag === 1 && (r.alternate === null ? r.tag = 17 : (t = Pt(-1, 1), t.tag = 2, lr(r, t, 1))), r.lanes |= 1), e);
}
var gm = Ft.ReactCurrentOwner, Oe = !1;
function je(e, t, r, n) {
  t.child = e === null ? Gd(t, null, r, n) : Pn(t, e.child, r, n);
}
function Qu(e, t, r, n, o) {
  r = r.render;
  var i = t.ref;
  return cn(t, o), n = Ca(e, t, r, n, i, o), r = Ea(), e !== null && !Oe ? (t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~o, Tt(e, t, o)) : (te && r && fa(t), t.flags |= 1, je(e, t, n, o), t.child);
}
function Bu(e, t, r, n, o) {
  if (e === null) {
    var i = r.type;
    return typeof i == "function" && !Oa(i) && i.defaultProps === void 0 && r.compare === null && r.defaultProps === void 0 ? (t.tag = 15, t.type = i, kf(e, t, i, n, o)) : (e = xi(r.type, null, n, t, t.mode, o), e.ref = t.ref, e.return = t, t.child = e);
  }
  if (i = e.child, !(e.lanes & o)) {
    var l = i.memoizedProps;
    if (r = r.compare, r = r !== null ? r : go, r(l, n) && e.ref === t.ref) return Tt(e, t, o);
  }
  return t.flags |= 1, e = ur(i, n), e.ref = t.ref, e.return = t, t.child = e;
}
function kf(e, t, r, n, o) {
  if (e !== null) {
    var i = e.memoizedProps;
    if (go(i, n) && e.ref === t.ref) if (Oe = !1, t.pendingProps = n = i, (e.lanes & o) !== 0) e.flags & 131072 && (Oe = !0);
    else return t.lanes = e.lanes, Tt(e, t, o);
  }
  return vs(e, t, r, n, o);
}
function bf(e, t, r) {
  var n = t.pendingProps, o = n.children, i = e !== null ? e.memoizedState : null;
  if (n.mode === "hidden") if (!(t.mode & 1)) t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }, q(on, Ae), Ae |= r;
  else {
    if (!(r & 1073741824)) return e = i !== null ? i.baseLanes | r : r, t.lanes = t.childLanes = 1073741824, t.memoizedState = { baseLanes: e, cachePool: null, transitions: null }, t.updateQueue = null, q(on, Ae), Ae |= e, null;
    t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }, n = i !== null ? i.baseLanes : r, q(on, Ae), Ae |= n;
  }
  else i !== null ? (n = i.baseLanes | r, t.memoizedState = null) : n = r, q(on, Ae), Ae |= n;
  return je(e, t, o, r), t.child;
}
function Sf(e, t) {
  var r = t.ref;
  (e === null && r !== null || e !== null && e.ref !== r) && (t.flags |= 512, t.flags |= 2097152);
}
function vs(e, t, r, n, o) {
  var i = Ie(r) ? Lr : Ce.current;
  return i = jn(t, i), cn(t, o), r = Ca(e, t, r, n, i, o), n = Ea(), e !== null && !Oe ? (t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~o, Tt(e, t, o)) : (te && n && fa(t), t.flags |= 1, je(e, t, r, o), t.child);
}
function Hu(e, t, r, n, o) {
  if (Ie(r)) {
    var i = !0;
    Ri(t);
  } else i = !1;
  if (cn(t, o), t.stateNode === null) gi(e, t), yf(t, r, n), ms(t, r, n, o), n = !0;
  else if (e === null) {
    var l = t.stateNode, s = t.memoizedProps;
    l.props = s;
    var a = l.context, u = r.contextType;
    typeof u == "object" && u !== null ? u = et(u) : (u = Ie(r) ? Lr : Ce.current, u = jn(t, u));
    var g = r.getDerivedStateFromProps, h = typeof g == "function" || typeof l.getSnapshotBeforeUpdate == "function";
    h || typeof l.UNSAFE_componentWillReceiveProps != "function" && typeof l.componentWillReceiveProps != "function" || (s !== n || a !== u) && Du(t, l, n, u), Bt = !1;
    var v = t.memoizedState;
    l.state = v, Ii(t, n, l, o), a = t.memoizedState, s !== n || v !== a || Le.current || Bt ? (typeof g == "function" && (hs(t, r, g, n), a = t.memoizedState), (s = Bt || Iu(t, r, s, n, v, a, u)) ? (h || typeof l.UNSAFE_componentWillMount != "function" && typeof l.componentWillMount != "function" || (typeof l.componentWillMount == "function" && l.componentWillMount(), typeof l.UNSAFE_componentWillMount == "function" && l.UNSAFE_componentWillMount()), typeof l.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof l.componentDidMount == "function" && (t.flags |= 4194308), t.memoizedProps = n, t.memoizedState = a), l.props = n, l.state = a, l.context = u, n = s) : (typeof l.componentDidMount == "function" && (t.flags |= 4194308), n = !1);
  } else {
    l = t.stateNode, Yd(e, t), s = t.memoizedProps, u = t.type === t.elementType ? s : nt(t.type, s), l.props = u, h = t.pendingProps, v = l.context, a = r.contextType, typeof a == "object" && a !== null ? a = et(a) : (a = Ie(r) ? Lr : Ce.current, a = jn(t, a));
    var y = r.getDerivedStateFromProps;
    (g = typeof y == "function" || typeof l.getSnapshotBeforeUpdate == "function") || typeof l.UNSAFE_componentWillReceiveProps != "function" && typeof l.componentWillReceiveProps != "function" || (s !== h || v !== a) && Du(t, l, n, a), Bt = !1, v = t.memoizedState, l.state = v, Ii(t, n, l, o);
    var w = t.memoizedState;
    s !== h || v !== w || Le.current || Bt ? (typeof y == "function" && (hs(t, r, y, n), w = t.memoizedState), (u = Bt || Iu(t, r, u, n, v, w, a) || !1) ? (g || typeof l.UNSAFE_componentWillUpdate != "function" && typeof l.componentWillUpdate != "function" || (typeof l.componentWillUpdate == "function" && l.componentWillUpdate(n, w, a), typeof l.UNSAFE_componentWillUpdate == "function" && l.UNSAFE_componentWillUpdate(n, w, a)), typeof l.componentDidUpdate == "function" && (t.flags |= 4), typeof l.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof l.componentDidUpdate != "function" || s === e.memoizedProps && v === e.memoizedState || (t.flags |= 4), typeof l.getSnapshotBeforeUpdate != "function" || s === e.memoizedProps && v === e.memoizedState || (t.flags |= 1024), t.memoizedProps = n, t.memoizedState = w), l.props = n, l.state = w, l.context = a, n = u) : (typeof l.componentDidUpdate != "function" || s === e.memoizedProps && v === e.memoizedState || (t.flags |= 4), typeof l.getSnapshotBeforeUpdate != "function" || s === e.memoizedProps && v === e.memoizedState || (t.flags |= 1024), n = !1);
  }
  return ys(e, t, r, n, i, o);
}
function ys(e, t, r, n, o, i) {
  Sf(e, t);
  var l = (t.flags & 128) !== 0;
  if (!n && !l) return o && Pu(t, r, !1), Tt(e, t, i);
  n = t.stateNode, gm.current = t;
  var s = l && typeof r.getDerivedStateFromError != "function" ? null : n.render();
  return t.flags |= 1, e !== null && l ? (t.child = Pn(t, e.child, null, i), t.child = Pn(t, null, s, i)) : je(e, t, s, i), t.memoizedState = n.state, o && Pu(t, r, !0), t.child;
}
function Cf(e) {
  var t = e.stateNode;
  t.pendingContext ? _u(e, t.pendingContext, t.pendingContext !== t.context) : t.context && _u(e, t.context, !1), wa(e, t.containerInfo);
}
function Wu(e, t, r, n, o) {
  return _n(), ha(o), t.flags |= 256, je(e, t, r, n), t.child;
}
var xs = { dehydrated: null, treeContext: null, retryLane: 0 };
function ws(e) {
  return { baseLanes: e, cachePool: null, transitions: null };
}
function Ef(e, t, r) {
  var n = t.pendingProps, o = re.current, i = !1, l = (t.flags & 128) !== 0, s;
  if ((s = l) || (s = e !== null && e.memoizedState === null ? !1 : (o & 2) !== 0), s ? (i = !0, t.flags &= -129) : (e === null || e.memoizedState !== null) && (o |= 1), q(re, o & 1), e === null)
    return fs(t), e = t.memoizedState, e !== null && (e = e.dehydrated, e !== null) ? (t.mode & 1 ? e.data === "$!" ? t.lanes = 8 : t.lanes = 1073741824 : t.lanes = 1, null) : (l = n.children, e = n.fallback, i ? (n = t.mode, i = t.child, l = { mode: "hidden", children: l }, !(n & 1) && i !== null ? (i.childLanes = 0, i.pendingProps = l) : i = nl(l, n, 0, null), e = Or(e, n, r, null), i.return = t, e.return = t, i.sibling = e, t.child = i, t.child.memoizedState = ws(r), t.memoizedState = xs, e) : _a(t, l));
  if (o = e.memoizedState, o !== null && (s = o.dehydrated, s !== null)) return vm(e, t, l, n, s, o, r);
  if (i) {
    i = n.fallback, l = t.mode, o = e.child, s = o.sibling;
    var a = { mode: "hidden", children: n.children };
    return !(l & 1) && t.child !== o ? (n = t.child, n.childLanes = 0, n.pendingProps = a, t.deletions = null) : (n = ur(o, a), n.subtreeFlags = o.subtreeFlags & 14680064), s !== null ? i = ur(s, i) : (i = Or(i, l, r, null), i.flags |= 2), i.return = t, n.return = t, n.sibling = i, t.child = n, n = i, i = t.child, l = e.child.memoizedState, l = l === null ? ws(r) : { baseLanes: l.baseLanes | r, cachePool: null, transitions: l.transitions }, i.memoizedState = l, i.childLanes = e.childLanes & ~r, t.memoizedState = xs, n;
  }
  return i = e.child, e = i.sibling, n = ur(i, { mode: "visible", children: n.children }), !(t.mode & 1) && (n.lanes = r), n.return = t, n.sibling = null, e !== null && (r = t.deletions, r === null ? (t.deletions = [e], t.flags |= 16) : r.push(e)), t.child = n, t.memoizedState = null, n;
}
function _a(e, t) {
  return t = nl({ mode: "visible", children: t }, e.mode, 0, null), t.return = e, e.child = t;
}
function ti(e, t, r, n) {
  return n !== null && ha(n), Pn(t, e.child, null, r), e = _a(t, t.pendingProps.children), e.flags |= 2, t.memoizedState = null, e;
}
function vm(e, t, r, n, o, i, l) {
  if (r)
    return t.flags & 256 ? (t.flags &= -257, n = Rl(Error(b(422))), ti(e, t, l, n)) : t.memoizedState !== null ? (t.child = e.child, t.flags |= 128, null) : (i = n.fallback, o = t.mode, n = nl({ mode: "visible", children: n.children }, o, 0, null), i = Or(i, o, l, null), i.flags |= 2, n.return = t, i.return = t, n.sibling = i, t.child = n, t.mode & 1 && Pn(t, e.child, null, l), t.child.memoizedState = ws(l), t.memoizedState = xs, i);
  if (!(t.mode & 1)) return ti(e, t, l, null);
  if (o.data === "$!") {
    if (n = o.nextSibling && o.nextSibling.dataset, n) var s = n.dgst;
    return n = s, i = Error(b(419)), n = Rl(i, n, void 0), ti(e, t, l, n);
  }
  if (s = (l & e.childLanes) !== 0, Oe || s) {
    if (n = he, n !== null) {
      switch (l & -l) {
        case 4:
          o = 2;
          break;
        case 16:
          o = 8;
          break;
        case 64:
        case 128:
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
        case 67108864:
          o = 32;
          break;
        case 536870912:
          o = 268435456;
          break;
        default:
          o = 0;
      }
      o = o & (n.suspendedLanes | l) ? 0 : o, o !== 0 && o !== i.retryLane && (i.retryLane = o, Rt(e, o), at(n, e, o, -1));
    }
    return Fa(), n = Rl(Error(b(421))), ti(e, t, l, n);
  }
  return o.data === "$?" ? (t.flags |= 128, t.child = e.child, t = zm.bind(null, e), o._reactRetry = t, null) : (e = i.treeContext, Be = ir(o.nextSibling), He = t, te = !0, lt = null, e !== null && (Ye[Xe++] = jt, Ye[Xe++] = _t, Ye[Xe++] = Ir, jt = e.id, _t = e.overflow, Ir = t), t = _a(t, n.children), t.flags |= 4096, t);
}
function Vu(e, t, r) {
  e.lanes |= t;
  var n = e.alternate;
  n !== null && (n.lanes |= t), ps(e.return, t, r);
}
function Tl(e, t, r, n, o) {
  var i = e.memoizedState;
  i === null ? e.memoizedState = { isBackwards: t, rendering: null, renderingStartTime: 0, last: n, tail: r, tailMode: o } : (i.isBackwards = t, i.rendering = null, i.renderingStartTime = 0, i.last = n, i.tail = r, i.tailMode = o);
}
function Nf(e, t, r) {
  var n = t.pendingProps, o = n.revealOrder, i = n.tail;
  if (je(e, t, n.children, r), n = re.current, n & 2) n = n & 1 | 2, t.flags |= 128;
  else {
    if (e !== null && e.flags & 128) e: for (e = t.child; e !== null; ) {
      if (e.tag === 13) e.memoizedState !== null && Vu(e, r, t);
      else if (e.tag === 19) Vu(e, r, t);
      else if (e.child !== null) {
        e.child.return = e, e = e.child;
        continue;
      }
      if (e === t) break e;
      for (; e.sibling === null; ) {
        if (e.return === null || e.return === t) break e;
        e = e.return;
      }
      e.sibling.return = e.return, e = e.sibling;
    }
    n &= 1;
  }
  if (q(re, n), !(t.mode & 1)) t.memoizedState = null;
  else switch (o) {
    case "forwards":
      for (r = t.child, o = null; r !== null; ) e = r.alternate, e !== null && Di(e) === null && (o = r), r = r.sibling;
      r = o, r === null ? (o = t.child, t.child = null) : (o = r.sibling, r.sibling = null), Tl(t, !1, o, r, i);
      break;
    case "backwards":
      for (r = null, o = t.child, t.child = null; o !== null; ) {
        if (e = o.alternate, e !== null && Di(e) === null) {
          t.child = o;
          break;
        }
        e = o.sibling, o.sibling = r, r = o, o = e;
      }
      Tl(t, !0, r, null, i);
      break;
    case "together":
      Tl(t, !1, null, null, void 0);
      break;
    default:
      t.memoizedState = null;
  }
  return t.child;
}
function gi(e, t) {
  !(t.mode & 1) && e !== null && (e.alternate = null, t.alternate = null, t.flags |= 2);
}
function Tt(e, t, r) {
  if (e !== null && (t.dependencies = e.dependencies), $r |= t.lanes, !(r & t.childLanes)) return null;
  if (e !== null && t.child !== e.child) throw Error(b(153));
  if (t.child !== null) {
    for (e = t.child, r = ur(e, e.pendingProps), t.child = r, r.return = t; e.sibling !== null; ) e = e.sibling, r = r.sibling = ur(e, e.pendingProps), r.return = t;
    r.sibling = null;
  }
  return t.child;
}
function ym(e, t, r) {
  switch (t.tag) {
    case 3:
      Cf(t), _n();
      break;
    case 5:
      Xd(t);
      break;
    case 1:
      Ie(t.type) && Ri(t);
      break;
    case 4:
      wa(t, t.stateNode.containerInfo);
      break;
    case 10:
      var n = t.type._context, o = t.memoizedProps.value;
      q(Oi, n._currentValue), n._currentValue = o;
      break;
    case 13:
      if (n = t.memoizedState, n !== null)
        return n.dehydrated !== null ? (q(re, re.current & 1), t.flags |= 128, null) : r & t.child.childLanes ? Ef(e, t, r) : (q(re, re.current & 1), e = Tt(e, t, r), e !== null ? e.sibling : null);
      q(re, re.current & 1);
      break;
    case 19:
      if (n = (r & t.childLanes) !== 0, e.flags & 128) {
        if (n) return Nf(e, t, r);
        t.flags |= 128;
      }
      if (o = t.memoizedState, o !== null && (o.rendering = null, o.tail = null, o.lastEffect = null), q(re, re.current), n) break;
      return null;
    case 22:
    case 23:
      return t.lanes = 0, bf(e, t, r);
  }
  return Tt(e, t, r);
}
var jf, ks, _f, Pf;
jf = function(e, t) {
  for (var r = t.child; r !== null; ) {
    if (r.tag === 5 || r.tag === 6) e.appendChild(r.stateNode);
    else if (r.tag !== 4 && r.child !== null) {
      r.child.return = r, r = r.child;
      continue;
    }
    if (r === t) break;
    for (; r.sibling === null; ) {
      if (r.return === null || r.return === t) return;
      r = r.return;
    }
    r.sibling.return = r.return, r = r.sibling;
  }
};
ks = function() {
};
_f = function(e, t, r, n) {
  var o = e.memoizedProps;
  if (o !== n) {
    e = t.stateNode, Sr(yt.current);
    var i = null;
    switch (r) {
      case "input":
        o = Bl(e, o), n = Bl(e, n), i = [];
        break;
      case "select":
        o = oe({}, o, { value: void 0 }), n = oe({}, n, { value: void 0 }), i = [];
        break;
      case "textarea":
        o = Vl(e, o), n = Vl(e, n), i = [];
        break;
      default:
        typeof o.onClick != "function" && typeof n.onClick == "function" && (e.onclick = zi);
    }
    Gl(r, n);
    var l;
    r = null;
    for (u in o) if (!n.hasOwnProperty(u) && o.hasOwnProperty(u) && o[u] != null) if (u === "style") {
      var s = o[u];
      for (l in s) s.hasOwnProperty(l) && (r || (r = {}), r[l] = "");
    } else u !== "dangerouslySetInnerHTML" && u !== "children" && u !== "suppressContentEditableWarning" && u !== "suppressHydrationWarning" && u !== "autoFocus" && (ao.hasOwnProperty(u) ? i || (i = []) : (i = i || []).push(u, null));
    for (u in n) {
      var a = n[u];
      if (s = o?.[u], n.hasOwnProperty(u) && a !== s && (a != null || s != null)) if (u === "style") if (s) {
        for (l in s) !s.hasOwnProperty(l) || a && a.hasOwnProperty(l) || (r || (r = {}), r[l] = "");
        for (l in a) a.hasOwnProperty(l) && s[l] !== a[l] && (r || (r = {}), r[l] = a[l]);
      } else r || (i || (i = []), i.push(
        u,
        r
      )), r = a;
      else u === "dangerouslySetInnerHTML" ? (a = a ? a.__html : void 0, s = s ? s.__html : void 0, a != null && s !== a && (i = i || []).push(u, a)) : u === "children" ? typeof a != "string" && typeof a != "number" || (i = i || []).push(u, "" + a) : u !== "suppressContentEditableWarning" && u !== "suppressHydrationWarning" && (ao.hasOwnProperty(u) ? (a != null && u === "onScroll" && Z("scroll", e), i || s === a || (i = [])) : (i = i || []).push(u, a));
    }
    r && (i = i || []).push("style", r);
    var u = i;
    (t.updateQueue = u) && (t.flags |= 4);
  }
};
Pf = function(e, t, r, n) {
  r !== n && (t.flags |= 4);
};
function Bn(e, t) {
  if (!te) switch (e.tailMode) {
    case "hidden":
      t = e.tail;
      for (var r = null; t !== null; ) t.alternate !== null && (r = t), t = t.sibling;
      r === null ? e.tail = null : r.sibling = null;
      break;
    case "collapsed":
      r = e.tail;
      for (var n = null; r !== null; ) r.alternate !== null && (n = r), r = r.sibling;
      n === null ? t || e.tail === null ? e.tail = null : e.tail.sibling = null : n.sibling = null;
  }
}
function ke(e) {
  var t = e.alternate !== null && e.alternate.child === e.child, r = 0, n = 0;
  if (t) for (var o = e.child; o !== null; ) r |= o.lanes | o.childLanes, n |= o.subtreeFlags & 14680064, n |= o.flags & 14680064, o.return = e, o = o.sibling;
  else for (o = e.child; o !== null; ) r |= o.lanes | o.childLanes, n |= o.subtreeFlags, n |= o.flags, o.return = e, o = o.sibling;
  return e.subtreeFlags |= n, e.childLanes = r, t;
}
function xm(e, t, r) {
  var n = t.pendingProps;
  switch (pa(t), t.tag) {
    case 2:
    case 16:
    case 15:
    case 0:
    case 11:
    case 7:
    case 8:
    case 12:
    case 9:
    case 14:
      return ke(t), null;
    case 1:
      return Ie(t.type) && Mi(), ke(t), null;
    case 3:
      return n = t.stateNode, zn(), J(Le), J(Ce), ba(), n.pendingContext && (n.context = n.pendingContext, n.pendingContext = null), (e === null || e.child === null) && (Jo(t) ? t.flags |= 4 : e === null || e.memoizedState.isDehydrated && !(t.flags & 256) || (t.flags |= 1024, lt !== null && (Ps(lt), lt = null))), ks(e, t), ke(t), null;
    case 5:
      ka(t);
      var o = Sr(ko.current);
      if (r = t.type, e !== null && t.stateNode != null) _f(e, t, r, n, o), e.ref !== t.ref && (t.flags |= 512, t.flags |= 2097152);
      else {
        if (!n) {
          if (t.stateNode === null) throw Error(b(166));
          return ke(t), null;
        }
        if (e = Sr(yt.current), Jo(t)) {
          n = t.stateNode, r = t.type;
          var i = t.memoizedProps;
          switch (n[gt] = t, n[xo] = i, e = (t.mode & 1) !== 0, r) {
            case "dialog":
              Z("cancel", n), Z("close", n);
              break;
            case "iframe":
            case "object":
            case "embed":
              Z("load", n);
              break;
            case "video":
            case "audio":
              for (o = 0; o < Xn.length; o++) Z(Xn[o], n);
              break;
            case "source":
              Z("error", n);
              break;
            case "img":
            case "image":
            case "link":
              Z(
                "error",
                n
              ), Z("load", n);
              break;
            case "details":
              Z("toggle", n);
              break;
            case "input":
              tu(n, i), Z("invalid", n);
              break;
            case "select":
              n._wrapperState = { wasMultiple: !!i.multiple }, Z("invalid", n);
              break;
            case "textarea":
              nu(n, i), Z("invalid", n);
          }
          Gl(r, i), o = null;
          for (var l in i) if (i.hasOwnProperty(l)) {
            var s = i[l];
            l === "children" ? typeof s == "string" ? n.textContent !== s && (i.suppressHydrationWarning !== !0 && Zo(n.textContent, s, e), o = ["children", s]) : typeof s == "number" && n.textContent !== "" + s && (i.suppressHydrationWarning !== !0 && Zo(
              n.textContent,
              s,
              e
            ), o = ["children", "" + s]) : ao.hasOwnProperty(l) && s != null && l === "onScroll" && Z("scroll", n);
          }
          switch (r) {
            case "input":
              Ho(n), ru(n, i, !0);
              break;
            case "textarea":
              Ho(n), ou(n);
              break;
            case "select":
            case "option":
              break;
            default:
              typeof i.onClick == "function" && (n.onclick = zi);
          }
          n = o, t.updateQueue = n, n !== null && (t.flags |= 4);
        } else {
          l = o.nodeType === 9 ? o : o.ownerDocument, e === "http://www.w3.org/1999/xhtml" && (e = rd(r)), e === "http://www.w3.org/1999/xhtml" ? r === "script" ? (e = l.createElement("div"), e.innerHTML = "<script><\/script>", e = e.removeChild(e.firstChild)) : typeof n.is == "string" ? e = l.createElement(r, { is: n.is }) : (e = l.createElement(r), r === "select" && (l = e, n.multiple ? l.multiple = !0 : n.size && (l.size = n.size))) : e = l.createElementNS(e, r), e[gt] = t, e[xo] = n, jf(e, t, !1, !1), t.stateNode = e;
          e: {
            switch (l = ql(r, n), r) {
              case "dialog":
                Z("cancel", e), Z("close", e), o = n;
                break;
              case "iframe":
              case "object":
              case "embed":
                Z("load", e), o = n;
                break;
              case "video":
              case "audio":
                for (o = 0; o < Xn.length; o++) Z(Xn[o], e);
                o = n;
                break;
              case "source":
                Z("error", e), o = n;
                break;
              case "img":
              case "image":
              case "link":
                Z(
                  "error",
                  e
                ), Z("load", e), o = n;
                break;
              case "details":
                Z("toggle", e), o = n;
                break;
              case "input":
                tu(e, n), o = Bl(e, n), Z("invalid", e);
                break;
              case "option":
                o = n;
                break;
              case "select":
                e._wrapperState = { wasMultiple: !!n.multiple }, o = oe({}, n, { value: void 0 }), Z("invalid", e);
                break;
              case "textarea":
                nu(e, n), o = Vl(e, n), Z("invalid", e);
                break;
              default:
                o = n;
            }
            Gl(r, o), s = o;
            for (i in s) if (s.hasOwnProperty(i)) {
              var a = s[i];
              i === "style" ? id(e, a) : i === "dangerouslySetInnerHTML" ? (a = a ? a.__html : void 0, a != null && nd(e, a)) : i === "children" ? typeof a == "string" ? (r !== "textarea" || a !== "") && uo(e, a) : typeof a == "number" && uo(e, "" + a) : i !== "suppressContentEditableWarning" && i !== "suppressHydrationWarning" && i !== "autoFocus" && (ao.hasOwnProperty(i) ? a != null && i === "onScroll" && Z("scroll", e) : a != null && Zs(e, i, a, l));
            }
            switch (r) {
              case "input":
                Ho(e), ru(e, n, !1);
                break;
              case "textarea":
                Ho(e), ou(e);
                break;
              case "option":
                n.value != null && e.setAttribute("value", "" + dr(n.value));
                break;
              case "select":
                e.multiple = !!n.multiple, i = n.value, i != null ? ln(e, !!n.multiple, i, !1) : n.defaultValue != null && ln(
                  e,
                  !!n.multiple,
                  n.defaultValue,
                  !0
                );
                break;
              default:
                typeof o.onClick == "function" && (e.onclick = zi);
            }
            switch (r) {
              case "button":
              case "input":
              case "select":
              case "textarea":
                n = !!n.autoFocus;
                break e;
              case "img":
                n = !0;
                break e;
              default:
                n = !1;
            }
          }
          n && (t.flags |= 4);
        }
        t.ref !== null && (t.flags |= 512, t.flags |= 2097152);
      }
      return ke(t), null;
    case 6:
      if (e && t.stateNode != null) Pf(e, t, e.memoizedProps, n);
      else {
        if (typeof n != "string" && t.stateNode === null) throw Error(b(166));
        if (r = Sr(ko.current), Sr(yt.current), Jo(t)) {
          if (n = t.stateNode, r = t.memoizedProps, n[gt] = t, (i = n.nodeValue !== r) && (e = He, e !== null)) switch (e.tag) {
            case 3:
              Zo(n.nodeValue, r, (e.mode & 1) !== 0);
              break;
            case 5:
              e.memoizedProps.suppressHydrationWarning !== !0 && Zo(n.nodeValue, r, (e.mode & 1) !== 0);
          }
          i && (t.flags |= 4);
        } else n = (r.nodeType === 9 ? r : r.ownerDocument).createTextNode(n), n[gt] = t, t.stateNode = n;
      }
      return ke(t), null;
    case 13:
      if (J(re), n = t.memoizedState, e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
        if (te && Be !== null && t.mode & 1 && !(t.flags & 128)) Vd(), _n(), t.flags |= 98560, i = !1;
        else if (i = Jo(t), n !== null && n.dehydrated !== null) {
          if (e === null) {
            if (!i) throw Error(b(318));
            if (i = t.memoizedState, i = i !== null ? i.dehydrated : null, !i) throw Error(b(317));
            i[gt] = t;
          } else _n(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
          ke(t), i = !1;
        } else lt !== null && (Ps(lt), lt = null), i = !0;
        if (!i) return t.flags & 65536 ? t : null;
      }
      return t.flags & 128 ? (t.lanes = r, t) : (n = n !== null, n !== (e !== null && e.memoizedState !== null) && n && (t.child.flags |= 8192, t.mode & 1 && (e === null || re.current & 1 ? de === 0 && (de = 3) : Fa())), t.updateQueue !== null && (t.flags |= 4), ke(t), null);
    case 4:
      return zn(), ks(e, t), e === null && vo(t.stateNode.containerInfo), ke(t), null;
    case 10:
      return va(t.type._context), ke(t), null;
    case 17:
      return Ie(t.type) && Mi(), ke(t), null;
    case 19:
      if (J(re), i = t.memoizedState, i === null) return ke(t), null;
      if (n = (t.flags & 128) !== 0, l = i.rendering, l === null) if (n) Bn(i, !1);
      else {
        if (de !== 0 || e !== null && e.flags & 128) for (e = t.child; e !== null; ) {
          if (l = Di(e), l !== null) {
            for (t.flags |= 128, Bn(i, !1), n = l.updateQueue, n !== null && (t.updateQueue = n, t.flags |= 4), t.subtreeFlags = 0, n = r, r = t.child; r !== null; ) i = r, e = n, i.flags &= 14680066, l = i.alternate, l === null ? (i.childLanes = 0, i.lanes = e, i.child = null, i.subtreeFlags = 0, i.memoizedProps = null, i.memoizedState = null, i.updateQueue = null, i.dependencies = null, i.stateNode = null) : (i.childLanes = l.childLanes, i.lanes = l.lanes, i.child = l.child, i.subtreeFlags = 0, i.deletions = null, i.memoizedProps = l.memoizedProps, i.memoizedState = l.memoizedState, i.updateQueue = l.updateQueue, i.type = l.type, e = l.dependencies, i.dependencies = e === null ? null : { lanes: e.lanes, firstContext: e.firstContext }), r = r.sibling;
            return q(re, re.current & 1 | 2), t.child;
          }
          e = e.sibling;
        }
        i.tail !== null && ae() > Rn && (t.flags |= 128, n = !0, Bn(i, !1), t.lanes = 4194304);
      }
      else {
        if (!n) if (e = Di(l), e !== null) {
          if (t.flags |= 128, n = !0, r = e.updateQueue, r !== null && (t.updateQueue = r, t.flags |= 4), Bn(i, !0), i.tail === null && i.tailMode === "hidden" && !l.alternate && !te) return ke(t), null;
        } else 2 * ae() - i.renderingStartTime > Rn && r !== 1073741824 && (t.flags |= 128, n = !0, Bn(i, !1), t.lanes = 4194304);
        i.isBackwards ? (l.sibling = t.child, t.child = l) : (r = i.last, r !== null ? r.sibling = l : t.child = l, i.last = l);
      }
      return i.tail !== null ? (t = i.tail, i.rendering = t, i.tail = t.sibling, i.renderingStartTime = ae(), t.sibling = null, r = re.current, q(re, n ? r & 1 | 2 : r & 1), t) : (ke(t), null);
    case 22:
    case 23:
      return Ta(), n = t.memoizedState !== null, e !== null && e.memoizedState !== null !== n && (t.flags |= 8192), n && t.mode & 1 ? Ae & 1073741824 && (ke(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : ke(t), null;
    case 24:
      return null;
    case 25:
      return null;
  }
  throw Error(b(156, t.tag));
}
function wm(e, t) {
  switch (pa(t), t.tag) {
    case 1:
      return Ie(t.type) && Mi(), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
    case 3:
      return zn(), J(Le), J(Ce), ba(), e = t.flags, e & 65536 && !(e & 128) ? (t.flags = e & -65537 | 128, t) : null;
    case 5:
      return ka(t), null;
    case 13:
      if (J(re), e = t.memoizedState, e !== null && e.dehydrated !== null) {
        if (t.alternate === null) throw Error(b(340));
        _n();
      }
      return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
    case 19:
      return J(re), null;
    case 4:
      return zn(), null;
    case 10:
      return va(t.type._context), null;
    case 22:
    case 23:
      return Ta(), null;
    case 24:
      return null;
    default:
      return null;
  }
}
var ri = !1, Se = !1, km = typeof WeakSet == "function" ? WeakSet : Set, M = null;
function nn(e, t) {
  var r = e.ref;
  if (r !== null) if (typeof r == "function") try {
    r(null);
  } catch (n) {
    le(e, t, n);
  }
  else r.current = null;
}
function bs(e, t, r) {
  try {
    r();
  } catch (n) {
    le(e, t, n);
  }
}
var Ku = !1;
function bm(e, t) {
  if (is = ji, e = Td(), da(e)) {
    if ("selectionStart" in e) var r = { start: e.selectionStart, end: e.selectionEnd };
    else e: {
      r = (r = e.ownerDocument) && r.defaultView || window;
      var n = r.getSelection && r.getSelection();
      if (n && n.rangeCount !== 0) {
        r = n.anchorNode;
        var o = n.anchorOffset, i = n.focusNode;
        n = n.focusOffset;
        try {
          r.nodeType, i.nodeType;
        } catch {
          r = null;
          break e;
        }
        var l = 0, s = -1, a = -1, u = 0, g = 0, h = e, v = null;
        t: for (; ; ) {
          for (var y; h !== r || o !== 0 && h.nodeType !== 3 || (s = l + o), h !== i || n !== 0 && h.nodeType !== 3 || (a = l + n), h.nodeType === 3 && (l += h.nodeValue.length), (y = h.firstChild) !== null; )
            v = h, h = y;
          for (; ; ) {
            if (h === e) break t;
            if (v === r && ++u === o && (s = l), v === i && ++g === n && (a = l), (y = h.nextSibling) !== null) break;
            h = v, v = h.parentNode;
          }
          h = y;
        }
        r = s === -1 || a === -1 ? null : { start: s, end: a };
      } else r = null;
    }
    r = r || { start: 0, end: 0 };
  } else r = null;
  for (ls = { focusedElem: e, selectionRange: r }, ji = !1, M = t; M !== null; ) if (t = M, e = t.child, (t.subtreeFlags & 1028) !== 0 && e !== null) e.return = t, M = e;
  else for (; M !== null; ) {
    t = M;
    try {
      var w = t.alternate;
      if (t.flags & 1024) switch (t.tag) {
        case 0:
        case 11:
        case 15:
          break;
        case 1:
          if (w !== null) {
            var x = w.memoizedProps, S = w.memoizedState, p = t.stateNode, d = p.getSnapshotBeforeUpdate(t.elementType === t.type ? x : nt(t.type, x), S);
            p.__reactInternalSnapshotBeforeUpdate = d;
          }
          break;
        case 3:
          var m = t.stateNode.containerInfo;
          m.nodeType === 1 ? m.textContent = "" : m.nodeType === 9 && m.documentElement && m.removeChild(m.documentElement);
          break;
        case 5:
        case 6:
        case 4:
        case 17:
          break;
        default:
          throw Error(b(163));
      }
    } catch (k) {
      le(t, t.return, k);
    }
    if (e = t.sibling, e !== null) {
      e.return = t.return, M = e;
      break;
    }
    M = t.return;
  }
  return w = Ku, Ku = !1, w;
}
function io(e, t, r) {
  var n = t.updateQueue;
  if (n = n !== null ? n.lastEffect : null, n !== null) {
    var o = n = n.next;
    do {
      if ((o.tag & e) === e) {
        var i = o.destroy;
        o.destroy = void 0, i !== void 0 && bs(t, r, i);
      }
      o = o.next;
    } while (o !== n);
  }
}
function tl(e, t) {
  if (t = t.updateQueue, t = t !== null ? t.lastEffect : null, t !== null) {
    var r = t = t.next;
    do {
      if ((r.tag & e) === e) {
        var n = r.create;
        r.destroy = n();
      }
      r = r.next;
    } while (r !== t);
  }
}
function Ss(e) {
  var t = e.ref;
  if (t !== null) {
    var r = e.stateNode;
    switch (e.tag) {
      case 5:
        e = r;
        break;
      default:
        e = r;
    }
    typeof t == "function" ? t(e) : t.current = e;
  }
}
function zf(e) {
  var t = e.alternate;
  t !== null && (e.alternate = null, zf(t)), e.child = null, e.deletions = null, e.sibling = null, e.tag === 5 && (t = e.stateNode, t !== null && (delete t[gt], delete t[xo], delete t[us], delete t[om], delete t[im])), e.stateNode = null, e.return = null, e.dependencies = null, e.memoizedProps = null, e.memoizedState = null, e.pendingProps = null, e.stateNode = null, e.updateQueue = null;
}
function Mf(e) {
  return e.tag === 5 || e.tag === 3 || e.tag === 4;
}
function Gu(e) {
  e: for (; ; ) {
    for (; e.sibling === null; ) {
      if (e.return === null || Mf(e.return)) return null;
      e = e.return;
    }
    for (e.sibling.return = e.return, e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18; ) {
      if (e.flags & 2 || e.child === null || e.tag === 4) continue e;
      e.child.return = e, e = e.child;
    }
    if (!(e.flags & 2)) return e.stateNode;
  }
}
function Cs(e, t, r) {
  var n = e.tag;
  if (n === 5 || n === 6) e = e.stateNode, t ? r.nodeType === 8 ? r.parentNode.insertBefore(e, t) : r.insertBefore(e, t) : (r.nodeType === 8 ? (t = r.parentNode, t.insertBefore(e, r)) : (t = r, t.appendChild(e)), r = r._reactRootContainer, r != null || t.onclick !== null || (t.onclick = zi));
  else if (n !== 4 && (e = e.child, e !== null)) for (Cs(e, t, r), e = e.sibling; e !== null; ) Cs(e, t, r), e = e.sibling;
}
function Es(e, t, r) {
  var n = e.tag;
  if (n === 5 || n === 6) e = e.stateNode, t ? r.insertBefore(e, t) : r.appendChild(e);
  else if (n !== 4 && (e = e.child, e !== null)) for (Es(e, t, r), e = e.sibling; e !== null; ) Es(e, t, r), e = e.sibling;
}
var ge = null, it = !1;
function It(e, t, r) {
  for (r = r.child; r !== null; ) Rf(e, t, r), r = r.sibling;
}
function Rf(e, t, r) {
  if (vt && typeof vt.onCommitFiberUnmount == "function") try {
    vt.onCommitFiberUnmount(Ki, r);
  } catch {
  }
  switch (r.tag) {
    case 5:
      Se || nn(r, t);
    case 6:
      var n = ge, o = it;
      ge = null, It(e, t, r), ge = n, it = o, ge !== null && (it ? (e = ge, r = r.stateNode, e.nodeType === 8 ? e.parentNode.removeChild(r) : e.removeChild(r)) : ge.removeChild(r.stateNode));
      break;
    case 18:
      ge !== null && (it ? (e = ge, r = r.stateNode, e.nodeType === 8 ? Nl(e.parentNode, r) : e.nodeType === 1 && Nl(e, r), ho(e)) : Nl(ge, r.stateNode));
      break;
    case 4:
      n = ge, o = it, ge = r.stateNode.containerInfo, it = !0, It(e, t, r), ge = n, it = o;
      break;
    case 0:
    case 11:
    case 14:
    case 15:
      if (!Se && (n = r.updateQueue, n !== null && (n = n.lastEffect, n !== null))) {
        o = n = n.next;
        do {
          var i = o, l = i.destroy;
          i = i.tag, l !== void 0 && (i & 2 || i & 4) && bs(r, t, l), o = o.next;
        } while (o !== n);
      }
      It(e, t, r);
      break;
    case 1:
      if (!Se && (nn(r, t), n = r.stateNode, typeof n.componentWillUnmount == "function")) try {
        n.props = r.memoizedProps, n.state = r.memoizedState, n.componentWillUnmount();
      } catch (s) {
        le(r, t, s);
      }
      It(e, t, r);
      break;
    case 21:
      It(e, t, r);
      break;
    case 22:
      r.mode & 1 ? (Se = (n = Se) || r.memoizedState !== null, It(e, t, r), Se = n) : It(e, t, r);
      break;
    default:
      It(e, t, r);
  }
}
function qu(e) {
  var t = e.updateQueue;
  if (t !== null) {
    e.updateQueue = null;
    var r = e.stateNode;
    r === null && (r = e.stateNode = new km()), t.forEach(function(n) {
      var o = Mm.bind(null, e, n);
      r.has(n) || (r.add(n), n.then(o, o));
    });
  }
}
function rt(e, t) {
  var r = t.deletions;
  if (r !== null) for (var n = 0; n < r.length; n++) {
    var o = r[n];
    try {
      var i = e, l = t, s = l;
      e: for (; s !== null; ) {
        switch (s.tag) {
          case 5:
            ge = s.stateNode, it = !1;
            break e;
          case 3:
            ge = s.stateNode.containerInfo, it = !0;
            break e;
          case 4:
            ge = s.stateNode.containerInfo, it = !0;
            break e;
        }
        s = s.return;
      }
      if (ge === null) throw Error(b(160));
      Rf(i, l, o), ge = null, it = !1;
      var a = o.alternate;
      a !== null && (a.return = null), o.return = null;
    } catch (u) {
      le(o, t, u);
    }
  }
  if (t.subtreeFlags & 12854) for (t = t.child; t !== null; ) Tf(t, e), t = t.sibling;
}
function Tf(e, t) {
  var r = e.alternate, n = e.flags;
  switch (e.tag) {
    case 0:
    case 11:
    case 14:
    case 15:
      if (rt(t, e), dt(e), n & 4) {
        try {
          io(3, e, e.return), tl(3, e);
        } catch (x) {
          le(e, e.return, x);
        }
        try {
          io(5, e, e.return);
        } catch (x) {
          le(e, e.return, x);
        }
      }
      break;
    case 1:
      rt(t, e), dt(e), n & 512 && r !== null && nn(r, r.return);
      break;
    case 5:
      if (rt(t, e), dt(e), n & 512 && r !== null && nn(r, r.return), e.flags & 32) {
        var o = e.stateNode;
        try {
          uo(o, "");
        } catch (x) {
          le(e, e.return, x);
        }
      }
      if (n & 4 && (o = e.stateNode, o != null)) {
        var i = e.memoizedProps, l = r !== null ? r.memoizedProps : i, s = e.type, a = e.updateQueue;
        if (e.updateQueue = null, a !== null) try {
          s === "input" && i.type === "radio" && i.name != null && ed(o, i), ql(s, l);
          var u = ql(s, i);
          for (l = 0; l < a.length; l += 2) {
            var g = a[l], h = a[l + 1];
            g === "style" ? id(o, h) : g === "dangerouslySetInnerHTML" ? nd(o, h) : g === "children" ? uo(o, h) : Zs(o, g, h, u);
          }
          switch (s) {
            case "input":
              Hl(o, i);
              break;
            case "textarea":
              td(o, i);
              break;
            case "select":
              var v = o._wrapperState.wasMultiple;
              o._wrapperState.wasMultiple = !!i.multiple;
              var y = i.value;
              y != null ? ln(o, !!i.multiple, y, !1) : v !== !!i.multiple && (i.defaultValue != null ? ln(
                o,
                !!i.multiple,
                i.defaultValue,
                !0
              ) : ln(o, !!i.multiple, i.multiple ? [] : "", !1));
          }
          o[xo] = i;
        } catch (x) {
          le(e, e.return, x);
        }
      }
      break;
    case 6:
      if (rt(t, e), dt(e), n & 4) {
        if (e.stateNode === null) throw Error(b(162));
        o = e.stateNode, i = e.memoizedProps;
        try {
          o.nodeValue = i;
        } catch (x) {
          le(e, e.return, x);
        }
      }
      break;
    case 3:
      if (rt(t, e), dt(e), n & 4 && r !== null && r.memoizedState.isDehydrated) try {
        ho(t.containerInfo);
      } catch (x) {
        le(e, e.return, x);
      }
      break;
    case 4:
      rt(t, e), dt(e);
      break;
    case 13:
      rt(t, e), dt(e), o = e.child, o.flags & 8192 && (i = o.memoizedState !== null, o.stateNode.isHidden = i, !i || o.alternate !== null && o.alternate.memoizedState !== null || (Ma = ae())), n & 4 && qu(e);
      break;
    case 22:
      if (g = r !== null && r.memoizedState !== null, e.mode & 1 ? (Se = (u = Se) || g, rt(t, e), Se = u) : rt(t, e), dt(e), n & 8192) {
        if (u = e.memoizedState !== null, (e.stateNode.isHidden = u) && !g && e.mode & 1) for (M = e, g = e.child; g !== null; ) {
          for (h = M = g; M !== null; ) {
            switch (v = M, y = v.child, v.tag) {
              case 0:
              case 11:
              case 14:
              case 15:
                io(4, v, v.return);
                break;
              case 1:
                nn(v, v.return);
                var w = v.stateNode;
                if (typeof w.componentWillUnmount == "function") {
                  n = v, r = v.return;
                  try {
                    t = n, w.props = t.memoizedProps, w.state = t.memoizedState, w.componentWillUnmount();
                  } catch (x) {
                    le(n, r, x);
                  }
                }
                break;
              case 5:
                nn(v, v.return);
                break;
              case 22:
                if (v.memoizedState !== null) {
                  Xu(h);
                  continue;
                }
            }
            y !== null ? (y.return = v, M = y) : Xu(h);
          }
          g = g.sibling;
        }
        e: for (g = null, h = e; ; ) {
          if (h.tag === 5) {
            if (g === null) {
              g = h;
              try {
                o = h.stateNode, u ? (i = o.style, typeof i.setProperty == "function" ? i.setProperty("display", "none", "important") : i.display = "none") : (s = h.stateNode, a = h.memoizedProps.style, l = a != null && a.hasOwnProperty("display") ? a.display : null, s.style.display = od("display", l));
              } catch (x) {
                le(e, e.return, x);
              }
            }
          } else if (h.tag === 6) {
            if (g === null) try {
              h.stateNode.nodeValue = u ? "" : h.memoizedProps;
            } catch (x) {
              le(e, e.return, x);
            }
          } else if ((h.tag !== 22 && h.tag !== 23 || h.memoizedState === null || h === e) && h.child !== null) {
            h.child.return = h, h = h.child;
            continue;
          }
          if (h === e) break e;
          for (; h.sibling === null; ) {
            if (h.return === null || h.return === e) break e;
            g === h && (g = null), h = h.return;
          }
          g === h && (g = null), h.sibling.return = h.return, h = h.sibling;
        }
      }
      break;
    case 19:
      rt(t, e), dt(e), n & 4 && qu(e);
      break;
    case 21:
      break;
    default:
      rt(
        t,
        e
      ), dt(e);
  }
}
function dt(e) {
  var t = e.flags;
  if (t & 2) {
    try {
      e: {
        for (var r = e.return; r !== null; ) {
          if (Mf(r)) {
            var n = r;
            break e;
          }
          r = r.return;
        }
        throw Error(b(160));
      }
      switch (n.tag) {
        case 5:
          var o = n.stateNode;
          n.flags & 32 && (uo(o, ""), n.flags &= -33);
          var i = Gu(e);
          Es(e, i, o);
          break;
        case 3:
        case 4:
          var l = n.stateNode.containerInfo, s = Gu(e);
          Cs(e, s, l);
          break;
        default:
          throw Error(b(161));
      }
    } catch (a) {
      le(e, e.return, a);
    }
    e.flags &= -3;
  }
  t & 4096 && (e.flags &= -4097);
}
function Sm(e, t, r) {
  M = e, Ff(e);
}
function Ff(e, t, r) {
  for (var n = (e.mode & 1) !== 0; M !== null; ) {
    var o = M, i = o.child;
    if (o.tag === 22 && n) {
      var l = o.memoizedState !== null || ri;
      if (!l) {
        var s = o.alternate, a = s !== null && s.memoizedState !== null || Se;
        s = ri;
        var u = Se;
        if (ri = l, (Se = a) && !u) for (M = o; M !== null; ) l = M, a = l.child, l.tag === 22 && l.memoizedState !== null ? Zu(o) : a !== null ? (a.return = l, M = a) : Zu(o);
        for (; i !== null; ) M = i, Ff(i), i = i.sibling;
        M = o, ri = s, Se = u;
      }
      Yu(e);
    } else o.subtreeFlags & 8772 && i !== null ? (i.return = o, M = i) : Yu(e);
  }
}
function Yu(e) {
  for (; M !== null; ) {
    var t = M;
    if (t.flags & 8772) {
      var r = t.alternate;
      try {
        if (t.flags & 8772) switch (t.tag) {
          case 0:
          case 11:
          case 15:
            Se || tl(5, t);
            break;
          case 1:
            var n = t.stateNode;
            if (t.flags & 4 && !Se) if (r === null) n.componentDidMount();
            else {
              var o = t.elementType === t.type ? r.memoizedProps : nt(t.type, r.memoizedProps);
              n.componentDidUpdate(o, r.memoizedState, n.__reactInternalSnapshotBeforeUpdate);
            }
            var i = t.updateQueue;
            i !== null && Fu(t, i, n);
            break;
          case 3:
            var l = t.updateQueue;
            if (l !== null) {
              if (r = null, t.child !== null) switch (t.child.tag) {
                case 5:
                  r = t.child.stateNode;
                  break;
                case 1:
                  r = t.child.stateNode;
              }
              Fu(t, l, r);
            }
            break;
          case 5:
            var s = t.stateNode;
            if (r === null && t.flags & 4) {
              r = s;
              var a = t.memoizedProps;
              switch (t.type) {
                case "button":
                case "input":
                case "select":
                case "textarea":
                  a.autoFocus && r.focus();
                  break;
                case "img":
                  a.src && (r.src = a.src);
              }
            }
            break;
          case 6:
            break;
          case 4:
            break;
          case 12:
            break;
          case 13:
            if (t.memoizedState === null) {
              var u = t.alternate;
              if (u !== null) {
                var g = u.memoizedState;
                if (g !== null) {
                  var h = g.dehydrated;
                  h !== null && ho(h);
                }
              }
            }
            break;
          case 19:
          case 17:
          case 21:
          case 22:
          case 23:
          case 25:
            break;
          default:
            throw Error(b(163));
        }
        Se || t.flags & 512 && Ss(t);
      } catch (v) {
        le(t, t.return, v);
      }
    }
    if (t === e) {
      M = null;
      break;
    }
    if (r = t.sibling, r !== null) {
      r.return = t.return, M = r;
      break;
    }
    M = t.return;
  }
}
function Xu(e) {
  for (; M !== null; ) {
    var t = M;
    if (t === e) {
      M = null;
      break;
    }
    var r = t.sibling;
    if (r !== null) {
      r.return = t.return, M = r;
      break;
    }
    M = t.return;
  }
}
function Zu(e) {
  for (; M !== null; ) {
    var t = M;
    try {
      switch (t.tag) {
        case 0:
        case 11:
        case 15:
          var r = t.return;
          try {
            tl(4, t);
          } catch (a) {
            le(t, r, a);
          }
          break;
        case 1:
          var n = t.stateNode;
          if (typeof n.componentDidMount == "function") {
            var o = t.return;
            try {
              n.componentDidMount();
            } catch (a) {
              le(t, o, a);
            }
          }
          var i = t.return;
          try {
            Ss(t);
          } catch (a) {
            le(t, i, a);
          }
          break;
        case 5:
          var l = t.return;
          try {
            Ss(t);
          } catch (a) {
            le(t, l, a);
          }
      }
    } catch (a) {
      le(t, t.return, a);
    }
    if (t === e) {
      M = null;
      break;
    }
    var s = t.sibling;
    if (s !== null) {
      s.return = t.return, M = s;
      break;
    }
    M = t.return;
  }
}
var Cm = Math.ceil, Ui = Ft.ReactCurrentDispatcher, Pa = Ft.ReactCurrentOwner, Je = Ft.ReactCurrentBatchConfig, W = 0, he = null, ue = null, ye = 0, Ae = 0, on = hr(0), de = 0, Eo = null, $r = 0, rl = 0, za = 0, lo = null, Fe = null, Ma = 0, Rn = 1 / 0, St = null, Qi = !1, Ns = null, sr = null, ni = !1, tr = null, Bi = 0, so = 0, js = null, vi = -1, yi = 0;
function _e() {
  return W & 6 ? ae() : vi !== -1 ? vi : vi = ae();
}
function ar(e) {
  return e.mode & 1 ? W & 2 && ye !== 0 ? ye & -ye : sm.transition !== null ? (yi === 0 && (yi = vd()), yi) : (e = K, e !== 0 || (e = window.event, e = e === void 0 ? 16 : Cd(e.type)), e) : 1;
}
function at(e, t, r, n) {
  if (50 < so) throw so = 0, js = null, Error(b(185));
  Oo(e, r, n), (!(W & 2) || e !== he) && (e === he && (!(W & 2) && (rl |= r), de === 4 && Wt(e, ye)), De(e, n), r === 1 && W === 0 && !(t.mode & 1) && (Rn = ae() + 500, Zi && mr()));
}
function De(e, t) {
  var r = e.callbackNode;
  sh(e, t);
  var n = Ni(e, e === he ? ye : 0);
  if (n === 0) r !== null && su(r), e.callbackNode = null, e.callbackPriority = 0;
  else if (t = n & -n, e.callbackPriority !== t) {
    if (r != null && su(r), t === 1) e.tag === 0 ? lm(Ju.bind(null, e)) : Bd(Ju.bind(null, e)), rm(function() {
      !(W & 6) && mr();
    }), r = null;
    else {
      switch (yd(n)) {
        case 1:
          r = na;
          break;
        case 4:
          r = md;
          break;
        case 16:
          r = Ei;
          break;
        case 536870912:
          r = gd;
          break;
        default:
          r = Ei;
      }
      r = Qf(r, Of.bind(null, e));
    }
    e.callbackPriority = t, e.callbackNode = r;
  }
}
function Of(e, t) {
  if (vi = -1, yi = 0, W & 6) throw Error(b(327));
  var r = e.callbackNode;
  if (dn() && e.callbackNode !== r) return null;
  var n = Ni(e, e === he ? ye : 0);
  if (n === 0) return null;
  if (n & 30 || n & e.expiredLanes || t) t = Hi(e, n);
  else {
    t = n;
    var o = W;
    W |= 2;
    var i = If();
    (he !== e || ye !== t) && (St = null, Rn = ae() + 500, Fr(e, t));
    do
      try {
        jm();
        break;
      } catch (s) {
        Lf(e, s);
      }
    while (!0);
    ga(), Ui.current = i, W = o, ue !== null ? t = 0 : (he = null, ye = 0, t = de);
  }
  if (t !== 0) {
    if (t === 2 && (o = es(e), o !== 0 && (n = o, t = _s(e, o))), t === 1) throw r = Eo, Fr(e, 0), Wt(e, n), De(e, ae()), r;
    if (t === 6) Wt(e, n);
    else {
      if (o = e.current.alternate, !(n & 30) && !Em(o) && (t = Hi(e, n), t === 2 && (i = es(e), i !== 0 && (n = i, t = _s(e, i))), t === 1)) throw r = Eo, Fr(e, 0), Wt(e, n), De(e, ae()), r;
      switch (e.finishedWork = o, e.finishedLanes = n, t) {
        case 0:
        case 1:
          throw Error(b(345));
        case 2:
          xr(e, Fe, St);
          break;
        case 3:
          if (Wt(e, n), (n & 130023424) === n && (t = Ma + 500 - ae(), 10 < t)) {
            if (Ni(e, 0) !== 0) break;
            if (o = e.suspendedLanes, (o & n) !== n) {
              _e(), e.pingedLanes |= e.suspendedLanes & o;
              break;
            }
            e.timeoutHandle = as(xr.bind(null, e, Fe, St), t);
            break;
          }
          xr(e, Fe, St);
          break;
        case 4:
          if (Wt(e, n), (n & 4194240) === n) break;
          for (t = e.eventTimes, o = -1; 0 < n; ) {
            var l = 31 - st(n);
            i = 1 << l, l = t[l], l > o && (o = l), n &= ~i;
          }
          if (n = o, n = ae() - n, n = (120 > n ? 120 : 480 > n ? 480 : 1080 > n ? 1080 : 1920 > n ? 1920 : 3e3 > n ? 3e3 : 4320 > n ? 4320 : 1960 * Cm(n / 1960)) - n, 10 < n) {
            e.timeoutHandle = as(xr.bind(null, e, Fe, St), n);
            break;
          }
          xr(e, Fe, St);
          break;
        case 5:
          xr(e, Fe, St);
          break;
        default:
          throw Error(b(329));
      }
    }
  }
  return De(e, ae()), e.callbackNode === r ? Of.bind(null, e) : null;
}
function _s(e, t) {
  var r = lo;
  return e.current.memoizedState.isDehydrated && (Fr(e, t).flags |= 256), e = Hi(e, t), e !== 2 && (t = Fe, Fe = r, t !== null && Ps(t)), e;
}
function Ps(e) {
  Fe === null ? Fe = e : Fe.push.apply(Fe, e);
}
function Em(e) {
  for (var t = e; ; ) {
    if (t.flags & 16384) {
      var r = t.updateQueue;
      if (r !== null && (r = r.stores, r !== null)) for (var n = 0; n < r.length; n++) {
        var o = r[n], i = o.getSnapshot;
        o = o.value;
        try {
          if (!ut(i(), o)) return !1;
        } catch {
          return !1;
        }
      }
    }
    if (r = t.child, t.subtreeFlags & 16384 && r !== null) r.return = t, t = r;
    else {
      if (t === e) break;
      for (; t.sibling === null; ) {
        if (t.return === null || t.return === e) return !0;
        t = t.return;
      }
      t.sibling.return = t.return, t = t.sibling;
    }
  }
  return !0;
}
function Wt(e, t) {
  for (t &= ~za, t &= ~rl, e.suspendedLanes |= t, e.pingedLanes &= ~t, e = e.expirationTimes; 0 < t; ) {
    var r = 31 - st(t), n = 1 << r;
    e[r] = -1, t &= ~n;
  }
}
function Ju(e) {
  if (W & 6) throw Error(b(327));
  dn();
  var t = Ni(e, 0);
  if (!(t & 1)) return De(e, ae()), null;
  var r = Hi(e, t);
  if (e.tag !== 0 && r === 2) {
    var n = es(e);
    n !== 0 && (t = n, r = _s(e, n));
  }
  if (r === 1) throw r = Eo, Fr(e, 0), Wt(e, t), De(e, ae()), r;
  if (r === 6) throw Error(b(345));
  return e.finishedWork = e.current.alternate, e.finishedLanes = t, xr(e, Fe, St), De(e, ae()), null;
}
function Ra(e, t) {
  var r = W;
  W |= 1;
  try {
    return e(t);
  } finally {
    W = r, W === 0 && (Rn = ae() + 500, Zi && mr());
  }
}
function Ar(e) {
  tr !== null && tr.tag === 0 && !(W & 6) && dn();
  var t = W;
  W |= 1;
  var r = Je.transition, n = K;
  try {
    if (Je.transition = null, K = 1, e) return e();
  } finally {
    K = n, Je.transition = r, W = t, !(W & 6) && mr();
  }
}
function Ta() {
  Ae = on.current, J(on);
}
function Fr(e, t) {
  e.finishedWork = null, e.finishedLanes = 0;
  var r = e.timeoutHandle;
  if (r !== -1 && (e.timeoutHandle = -1, tm(r)), ue !== null) for (r = ue.return; r !== null; ) {
    var n = r;
    switch (pa(n), n.tag) {
      case 1:
        n = n.type.childContextTypes, n != null && Mi();
        break;
      case 3:
        zn(), J(Le), J(Ce), ba();
        break;
      case 5:
        ka(n);
        break;
      case 4:
        zn();
        break;
      case 13:
        J(re);
        break;
      case 19:
        J(re);
        break;
      case 10:
        va(n.type._context);
        break;
      case 22:
      case 23:
        Ta();
    }
    r = r.return;
  }
  if (he = e, ue = e = ur(e.current, null), ye = Ae = t, de = 0, Eo = null, za = rl = $r = 0, Fe = lo = null, br !== null) {
    for (t = 0; t < br.length; t++) if (r = br[t], n = r.interleaved, n !== null) {
      r.interleaved = null;
      var o = n.next, i = r.pending;
      if (i !== null) {
        var l = i.next;
        i.next = o, n.next = l;
      }
      r.pending = n;
    }
    br = null;
  }
  return e;
}
function Lf(e, t) {
  do {
    var r = ue;
    try {
      if (ga(), hi.current = Ai, $i) {
        for (var n = ne.memoizedState; n !== null; ) {
          var o = n.queue;
          o !== null && (o.pending = null), n = n.next;
        }
        $i = !1;
      }
      if (Dr = 0, pe = ce = ne = null, oo = !1, bo = 0, Pa.current = null, r === null || r.return === null) {
        de = 1, Eo = t, ue = null;
        break;
      }
      e: {
        var i = e, l = r.return, s = r, a = t;
        if (t = ye, s.flags |= 32768, a !== null && typeof a == "object" && typeof a.then == "function") {
          var u = a, g = s, h = g.tag;
          if (!(g.mode & 1) && (h === 0 || h === 11 || h === 15)) {
            var v = g.alternate;
            v ? (g.updateQueue = v.updateQueue, g.memoizedState = v.memoizedState, g.lanes = v.lanes) : (g.updateQueue = null, g.memoizedState = null);
          }
          var y = Au(l);
          if (y !== null) {
            y.flags &= -257, Uu(y, l, s, i, t), y.mode & 1 && $u(i, u, t), t = y, a = u;
            var w = t.updateQueue;
            if (w === null) {
              var x = /* @__PURE__ */ new Set();
              x.add(a), t.updateQueue = x;
            } else w.add(a);
            break e;
          } else {
            if (!(t & 1)) {
              $u(i, u, t), Fa();
              break e;
            }
            a = Error(b(426));
          }
        } else if (te && s.mode & 1) {
          var S = Au(l);
          if (S !== null) {
            !(S.flags & 65536) && (S.flags |= 256), Uu(S, l, s, i, t), ha(Mn(a, s));
            break e;
          }
        }
        i = a = Mn(a, s), de !== 4 && (de = 2), lo === null ? lo = [i] : lo.push(i), i = l;
        do {
          switch (i.tag) {
            case 3:
              i.flags |= 65536, t &= -t, i.lanes |= t;
              var p = xf(i, a, t);
              Tu(i, p);
              break e;
            case 1:
              s = a;
              var d = i.type, m = i.stateNode;
              if (!(i.flags & 128) && (typeof d.getDerivedStateFromError == "function" || m !== null && typeof m.componentDidCatch == "function" && (sr === null || !sr.has(m)))) {
                i.flags |= 65536, t &= -t, i.lanes |= t;
                var k = wf(i, s, t);
                Tu(i, k);
                break e;
              }
          }
          i = i.return;
        } while (i !== null);
      }
      $f(r);
    } catch (C) {
      t = C, ue === r && r !== null && (ue = r = r.return);
      continue;
    }
    break;
  } while (!0);
}
function If() {
  var e = Ui.current;
  return Ui.current = Ai, e === null ? Ai : e;
}
function Fa() {
  (de === 0 || de === 3 || de === 2) && (de = 4), he === null || !($r & 268435455) && !(rl & 268435455) || Wt(he, ye);
}
function Hi(e, t) {
  var r = W;
  W |= 2;
  var n = If();
  (he !== e || ye !== t) && (St = null, Fr(e, t));
  do
    try {
      Nm();
      break;
    } catch (o) {
      Lf(e, o);
    }
  while (!0);
  if (ga(), W = r, Ui.current = n, ue !== null) throw Error(b(261));
  return he = null, ye = 0, de;
}
function Nm() {
  for (; ue !== null; ) Df(ue);
}
function jm() {
  for (; ue !== null && !Zp(); ) Df(ue);
}
function Df(e) {
  var t = Uf(e.alternate, e, Ae);
  e.memoizedProps = e.pendingProps, t === null ? $f(e) : ue = t, Pa.current = null;
}
function $f(e) {
  var t = e;
  do {
    var r = t.alternate;
    if (e = t.return, t.flags & 32768) {
      if (r = wm(r, t), r !== null) {
        r.flags &= 32767, ue = r;
        return;
      }
      if (e !== null) e.flags |= 32768, e.subtreeFlags = 0, e.deletions = null;
      else {
        de = 6, ue = null;
        return;
      }
    } else if (r = xm(r, t, Ae), r !== null) {
      ue = r;
      return;
    }
    if (t = t.sibling, t !== null) {
      ue = t;
      return;
    }
    ue = t = e;
  } while (t !== null);
  de === 0 && (de = 5);
}
function xr(e, t, r) {
  var n = K, o = Je.transition;
  try {
    Je.transition = null, K = 1, _m(e, t, r, n);
  } finally {
    Je.transition = o, K = n;
  }
  return null;
}
function _m(e, t, r, n) {
  do
    dn();
  while (tr !== null);
  if (W & 6) throw Error(b(327));
  r = e.finishedWork;
  var o = e.finishedLanes;
  if (r === null) return null;
  if (e.finishedWork = null, e.finishedLanes = 0, r === e.current) throw Error(b(177));
  e.callbackNode = null, e.callbackPriority = 0;
  var i = r.lanes | r.childLanes;
  if (ah(e, i), e === he && (ue = he = null, ye = 0), !(r.subtreeFlags & 2064) && !(r.flags & 2064) || ni || (ni = !0, Qf(Ei, function() {
    return dn(), null;
  })), i = (r.flags & 15990) !== 0, r.subtreeFlags & 15990 || i) {
    i = Je.transition, Je.transition = null;
    var l = K;
    K = 1;
    var s = W;
    W |= 4, Pa.current = null, bm(e, r), Tf(r, e), Gh(ls), ji = !!is, ls = is = null, e.current = r, Sm(r), Jp(), W = s, K = l, Je.transition = i;
  } else e.current = r;
  if (ni && (ni = !1, tr = e, Bi = o), i = e.pendingLanes, i === 0 && (sr = null), rh(r.stateNode), De(e, ae()), t !== null) for (n = e.onRecoverableError, r = 0; r < t.length; r++) o = t[r], n(o.value, { componentStack: o.stack, digest: o.digest });
  if (Qi) throw Qi = !1, e = Ns, Ns = null, e;
  return Bi & 1 && e.tag !== 0 && dn(), i = e.pendingLanes, i & 1 ? e === js ? so++ : (so = 0, js = e) : so = 0, mr(), null;
}
function dn() {
  if (tr !== null) {
    var e = yd(Bi), t = Je.transition, r = K;
    try {
      if (Je.transition = null, K = 16 > e ? 16 : e, tr === null) var n = !1;
      else {
        if (e = tr, tr = null, Bi = 0, W & 6) throw Error(b(331));
        var o = W;
        for (W |= 4, M = e.current; M !== null; ) {
          var i = M, l = i.child;
          if (M.flags & 16) {
            var s = i.deletions;
            if (s !== null) {
              for (var a = 0; a < s.length; a++) {
                var u = s[a];
                for (M = u; M !== null; ) {
                  var g = M;
                  switch (g.tag) {
                    case 0:
                    case 11:
                    case 15:
                      io(8, g, i);
                  }
                  var h = g.child;
                  if (h !== null) h.return = g, M = h;
                  else for (; M !== null; ) {
                    g = M;
                    var v = g.sibling, y = g.return;
                    if (zf(g), g === u) {
                      M = null;
                      break;
                    }
                    if (v !== null) {
                      v.return = y, M = v;
                      break;
                    }
                    M = y;
                  }
                }
              }
              var w = i.alternate;
              if (w !== null) {
                var x = w.child;
                if (x !== null) {
                  w.child = null;
                  do {
                    var S = x.sibling;
                    x.sibling = null, x = S;
                  } while (x !== null);
                }
              }
              M = i;
            }
          }
          if (i.subtreeFlags & 2064 && l !== null) l.return = i, M = l;
          else e: for (; M !== null; ) {
            if (i = M, i.flags & 2048) switch (i.tag) {
              case 0:
              case 11:
              case 15:
                io(9, i, i.return);
            }
            var p = i.sibling;
            if (p !== null) {
              p.return = i.return, M = p;
              break e;
            }
            M = i.return;
          }
        }
        var d = e.current;
        for (M = d; M !== null; ) {
          l = M;
          var m = l.child;
          if (l.subtreeFlags & 2064 && m !== null) m.return = l, M = m;
          else e: for (l = d; M !== null; ) {
            if (s = M, s.flags & 2048) try {
              switch (s.tag) {
                case 0:
                case 11:
                case 15:
                  tl(9, s);
              }
            } catch (C) {
              le(s, s.return, C);
            }
            if (s === l) {
              M = null;
              break e;
            }
            var k = s.sibling;
            if (k !== null) {
              k.return = s.return, M = k;
              break e;
            }
            M = s.return;
          }
        }
        if (W = o, mr(), vt && typeof vt.onPostCommitFiberRoot == "function") try {
          vt.onPostCommitFiberRoot(Ki, e);
        } catch {
        }
        n = !0;
      }
      return n;
    } finally {
      K = r, Je.transition = t;
    }
  }
  return !1;
}
function ec(e, t, r) {
  t = Mn(r, t), t = xf(e, t, 1), e = lr(e, t, 1), t = _e(), e !== null && (Oo(e, 1, t), De(e, t));
}
function le(e, t, r) {
  if (e.tag === 3) ec(e, e, r);
  else for (; t !== null; ) {
    if (t.tag === 3) {
      ec(t, e, r);
      break;
    } else if (t.tag === 1) {
      var n = t.stateNode;
      if (typeof t.type.getDerivedStateFromError == "function" || typeof n.componentDidCatch == "function" && (sr === null || !sr.has(n))) {
        e = Mn(r, e), e = wf(t, e, 1), t = lr(t, e, 1), e = _e(), t !== null && (Oo(t, 1, e), De(t, e));
        break;
      }
    }
    t = t.return;
  }
}
function Pm(e, t, r) {
  var n = e.pingCache;
  n !== null && n.delete(t), t = _e(), e.pingedLanes |= e.suspendedLanes & r, he === e && (ye & r) === r && (de === 4 || de === 3 && (ye & 130023424) === ye && 500 > ae() - Ma ? Fr(e, 0) : za |= r), De(e, t);
}
function Af(e, t) {
  t === 0 && (e.mode & 1 ? (t = Ko, Ko <<= 1, !(Ko & 130023424) && (Ko = 4194304)) : t = 1);
  var r = _e();
  e = Rt(e, t), e !== null && (Oo(e, t, r), De(e, r));
}
function zm(e) {
  var t = e.memoizedState, r = 0;
  t !== null && (r = t.retryLane), Af(e, r);
}
function Mm(e, t) {
  var r = 0;
  switch (e.tag) {
    case 13:
      var n = e.stateNode, o = e.memoizedState;
      o !== null && (r = o.retryLane);
      break;
    case 19:
      n = e.stateNode;
      break;
    default:
      throw Error(b(314));
  }
  n !== null && n.delete(t), Af(e, r);
}
var Uf;
Uf = function(e, t, r) {
  if (e !== null) if (e.memoizedProps !== t.pendingProps || Le.current) Oe = !0;
  else {
    if (!(e.lanes & r) && !(t.flags & 128)) return Oe = !1, ym(e, t, r);
    Oe = !!(e.flags & 131072);
  }
  else Oe = !1, te && t.flags & 1048576 && Hd(t, Fi, t.index);
  switch (t.lanes = 0, t.tag) {
    case 2:
      var n = t.type;
      gi(e, t), e = t.pendingProps;
      var o = jn(t, Ce.current);
      cn(t, r), o = Ca(null, t, n, e, o, r);
      var i = Ea();
      return t.flags |= 1, typeof o == "object" && o !== null && typeof o.render == "function" && o.$$typeof === void 0 ? (t.tag = 1, t.memoizedState = null, t.updateQueue = null, Ie(n) ? (i = !0, Ri(t)) : i = !1, t.memoizedState = o.state !== null && o.state !== void 0 ? o.state : null, xa(t), o.updater = el, t.stateNode = o, o._reactInternals = t, ms(t, n, e, r), t = ys(null, t, n, !0, i, r)) : (t.tag = 0, te && i && fa(t), je(null, t, o, r), t = t.child), t;
    case 16:
      n = t.elementType;
      e: {
        switch (gi(e, t), e = t.pendingProps, o = n._init, n = o(n._payload), t.type = n, o = t.tag = Tm(n), e = nt(n, e), o) {
          case 0:
            t = vs(null, t, n, e, r);
            break e;
          case 1:
            t = Hu(null, t, n, e, r);
            break e;
          case 11:
            t = Qu(null, t, n, e, r);
            break e;
          case 14:
            t = Bu(null, t, n, nt(n.type, e), r);
            break e;
        }
        throw Error(b(
          306,
          n,
          ""
        ));
      }
      return t;
    case 0:
      return n = t.type, o = t.pendingProps, o = t.elementType === n ? o : nt(n, o), vs(e, t, n, o, r);
    case 1:
      return n = t.type, o = t.pendingProps, o = t.elementType === n ? o : nt(n, o), Hu(e, t, n, o, r);
    case 3:
      e: {
        if (Cf(t), e === null) throw Error(b(387));
        n = t.pendingProps, i = t.memoizedState, o = i.element, Yd(e, t), Ii(t, n, null, r);
        var l = t.memoizedState;
        if (n = l.element, i.isDehydrated) if (i = { element: n, isDehydrated: !1, cache: l.cache, pendingSuspenseBoundaries: l.pendingSuspenseBoundaries, transitions: l.transitions }, t.updateQueue.baseState = i, t.memoizedState = i, t.flags & 256) {
          o = Mn(Error(b(423)), t), t = Wu(e, t, n, r, o);
          break e;
        } else if (n !== o) {
          o = Mn(Error(b(424)), t), t = Wu(e, t, n, r, o);
          break e;
        } else for (Be = ir(t.stateNode.containerInfo.firstChild), He = t, te = !0, lt = null, r = Gd(t, null, n, r), t.child = r; r; ) r.flags = r.flags & -3 | 4096, r = r.sibling;
        else {
          if (_n(), n === o) {
            t = Tt(e, t, r);
            break e;
          }
          je(e, t, n, r);
        }
        t = t.child;
      }
      return t;
    case 5:
      return Xd(t), e === null && fs(t), n = t.type, o = t.pendingProps, i = e !== null ? e.memoizedProps : null, l = o.children, ss(n, o) ? l = null : i !== null && ss(n, i) && (t.flags |= 32), Sf(e, t), je(e, t, l, r), t.child;
    case 6:
      return e === null && fs(t), null;
    case 13:
      return Ef(e, t, r);
    case 4:
      return wa(t, t.stateNode.containerInfo), n = t.pendingProps, e === null ? t.child = Pn(t, null, n, r) : je(e, t, n, r), t.child;
    case 11:
      return n = t.type, o = t.pendingProps, o = t.elementType === n ? o : nt(n, o), Qu(e, t, n, o, r);
    case 7:
      return je(e, t, t.pendingProps, r), t.child;
    case 8:
      return je(e, t, t.pendingProps.children, r), t.child;
    case 12:
      return je(e, t, t.pendingProps.children, r), t.child;
    case 10:
      e: {
        if (n = t.type._context, o = t.pendingProps, i = t.memoizedProps, l = o.value, q(Oi, n._currentValue), n._currentValue = l, i !== null) if (ut(i.value, l)) {
          if (i.children === o.children && !Le.current) {
            t = Tt(e, t, r);
            break e;
          }
        } else for (i = t.child, i !== null && (i.return = t); i !== null; ) {
          var s = i.dependencies;
          if (s !== null) {
            l = i.child;
            for (var a = s.firstContext; a !== null; ) {
              if (a.context === n) {
                if (i.tag === 1) {
                  a = Pt(-1, r & -r), a.tag = 2;
                  var u = i.updateQueue;
                  if (u !== null) {
                    u = u.shared;
                    var g = u.pending;
                    g === null ? a.next = a : (a.next = g.next, g.next = a), u.pending = a;
                  }
                }
                i.lanes |= r, a = i.alternate, a !== null && (a.lanes |= r), ps(
                  i.return,
                  r,
                  t
                ), s.lanes |= r;
                break;
              }
              a = a.next;
            }
          } else if (i.tag === 10) l = i.type === t.type ? null : i.child;
          else if (i.tag === 18) {
            if (l = i.return, l === null) throw Error(b(341));
            l.lanes |= r, s = l.alternate, s !== null && (s.lanes |= r), ps(l, r, t), l = i.sibling;
          } else l = i.child;
          if (l !== null) l.return = i;
          else for (l = i; l !== null; ) {
            if (l === t) {
              l = null;
              break;
            }
            if (i = l.sibling, i !== null) {
              i.return = l.return, l = i;
              break;
            }
            l = l.return;
          }
          i = l;
        }
        je(e, t, o.children, r), t = t.child;
      }
      return t;
    case 9:
      return o = t.type, n = t.pendingProps.children, cn(t, r), o = et(o), n = n(o), t.flags |= 1, je(e, t, n, r), t.child;
    case 14:
      return n = t.type, o = nt(n, t.pendingProps), o = nt(n.type, o), Bu(e, t, n, o, r);
    case 15:
      return kf(e, t, t.type, t.pendingProps, r);
    case 17:
      return n = t.type, o = t.pendingProps, o = t.elementType === n ? o : nt(n, o), gi(e, t), t.tag = 1, Ie(n) ? (e = !0, Ri(t)) : e = !1, cn(t, r), yf(t, n, o), ms(t, n, o, r), ys(null, t, n, !0, e, r);
    case 19:
      return Nf(e, t, r);
    case 22:
      return bf(e, t, r);
  }
  throw Error(b(156, t.tag));
};
function Qf(e, t) {
  return hd(e, t);
}
function Rm(e, t, r, n) {
  this.tag = e, this.key = r, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = n, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
}
function Ze(e, t, r, n) {
  return new Rm(e, t, r, n);
}
function Oa(e) {
  return e = e.prototype, !(!e || !e.isReactComponent);
}
function Tm(e) {
  if (typeof e == "function") return Oa(e) ? 1 : 0;
  if (e != null) {
    if (e = e.$$typeof, e === ea) return 11;
    if (e === ta) return 14;
  }
  return 2;
}
function ur(e, t) {
  var r = e.alternate;
  return r === null ? (r = Ze(e.tag, t, e.key, e.mode), r.elementType = e.elementType, r.type = e.type, r.stateNode = e.stateNode, r.alternate = e, e.alternate = r) : (r.pendingProps = t, r.type = e.type, r.flags = 0, r.subtreeFlags = 0, r.deletions = null), r.flags = e.flags & 14680064, r.childLanes = e.childLanes, r.lanes = e.lanes, r.child = e.child, r.memoizedProps = e.memoizedProps, r.memoizedState = e.memoizedState, r.updateQueue = e.updateQueue, t = e.dependencies, r.dependencies = t === null ? null : { lanes: t.lanes, firstContext: t.firstContext }, r.sibling = e.sibling, r.index = e.index, r.ref = e.ref, r;
}
function xi(e, t, r, n, o, i) {
  var l = 2;
  if (n = e, typeof e == "function") Oa(e) && (l = 1);
  else if (typeof e == "string") l = 5;
  else e: switch (e) {
    case Gr:
      return Or(r.children, o, i, t);
    case Js:
      l = 8, o |= 8;
      break;
    case $l:
      return e = Ze(12, r, t, o | 2), e.elementType = $l, e.lanes = i, e;
    case Al:
      return e = Ze(13, r, t, o), e.elementType = Al, e.lanes = i, e;
    case Ul:
      return e = Ze(19, r, t, o), e.elementType = Ul, e.lanes = i, e;
    case Xc:
      return nl(r, o, i, t);
    default:
      if (typeof e == "object" && e !== null) switch (e.$$typeof) {
        case qc:
          l = 10;
          break e;
        case Yc:
          l = 9;
          break e;
        case ea:
          l = 11;
          break e;
        case ta:
          l = 14;
          break e;
        case Qt:
          l = 16, n = null;
          break e;
      }
      throw Error(b(130, e == null ? e : typeof e, ""));
  }
  return t = Ze(l, r, t, o), t.elementType = e, t.type = n, t.lanes = i, t;
}
function Or(e, t, r, n) {
  return e = Ze(7, e, n, t), e.lanes = r, e;
}
function nl(e, t, r, n) {
  return e = Ze(22, e, n, t), e.elementType = Xc, e.lanes = r, e.stateNode = { isHidden: !1 }, e;
}
function Fl(e, t, r) {
  return e = Ze(6, e, null, t), e.lanes = r, e;
}
function Ol(e, t, r) {
  return t = Ze(4, e.children !== null ? e.children : [], e.key, t), t.lanes = r, t.stateNode = { containerInfo: e.containerInfo, pendingChildren: null, implementation: e.implementation }, t;
}
function Fm(e, t, r, n, o) {
  this.tag = t, this.containerInfo = e, this.finishedWork = this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.pendingContext = this.context = null, this.callbackPriority = 0, this.eventTimes = ml(0), this.expirationTimes = ml(-1), this.entangledLanes = this.finishedLanes = this.mutableReadLanes = this.expiredLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = ml(0), this.identifierPrefix = n, this.onRecoverableError = o, this.mutableSourceEagerHydrationData = null;
}
function La(e, t, r, n, o, i, l, s, a) {
  return e = new Fm(e, t, r, s, a), t === 1 ? (t = 1, i === !0 && (t |= 8)) : t = 0, i = Ze(3, null, null, t), e.current = i, i.stateNode = e, i.memoizedState = { element: n, isDehydrated: r, cache: null, transitions: null, pendingSuspenseBoundaries: null }, xa(i), e;
}
function Om(e, t, r) {
  var n = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
  return { $$typeof: Kr, key: n == null ? null : "" + n, children: e, containerInfo: t, implementation: r };
}
function Bf(e) {
  if (!e) return fr;
  e = e._reactInternals;
  e: {
    if (Qr(e) !== e || e.tag !== 1) throw Error(b(170));
    var t = e;
    do {
      switch (t.tag) {
        case 3:
          t = t.stateNode.context;
          break e;
        case 1:
          if (Ie(t.type)) {
            t = t.stateNode.__reactInternalMemoizedMergedChildContext;
            break e;
          }
      }
      t = t.return;
    } while (t !== null);
    throw Error(b(171));
  }
  if (e.tag === 1) {
    var r = e.type;
    if (Ie(r)) return Qd(e, r, t);
  }
  return t;
}
function Hf(e, t, r, n, o, i, l, s, a) {
  return e = La(r, n, !0, e, o, i, l, s, a), e.context = Bf(null), r = e.current, n = _e(), o = ar(r), i = Pt(n, o), i.callback = t ?? null, lr(r, i, o), e.current.lanes = o, Oo(e, o, n), De(e, n), e;
}
function ol(e, t, r, n) {
  var o = t.current, i = _e(), l = ar(o);
  return r = Bf(r), t.context === null ? t.context = r : t.pendingContext = r, t = Pt(i, l), t.payload = { element: e }, n = n === void 0 ? null : n, n !== null && (t.callback = n), e = lr(o, t, l), e !== null && (at(e, o, l, i), pi(e, o, l)), l;
}
function Wi(e) {
  if (e = e.current, !e.child) return null;
  switch (e.child.tag) {
    case 5:
      return e.child.stateNode;
    default:
      return e.child.stateNode;
  }
}
function tc(e, t) {
  if (e = e.memoizedState, e !== null && e.dehydrated !== null) {
    var r = e.retryLane;
    e.retryLane = r !== 0 && r < t ? r : t;
  }
}
function Ia(e, t) {
  tc(e, t), (e = e.alternate) && tc(e, t);
}
function Lm() {
  return null;
}
var Wf = typeof reportError == "function" ? reportError : function(e) {
  console.error(e);
};
function Da(e) {
  this._internalRoot = e;
}
il.prototype.render = Da.prototype.render = function(e) {
  var t = this._internalRoot;
  if (t === null) throw Error(b(409));
  ol(e, t, null, null);
};
il.prototype.unmount = Da.prototype.unmount = function() {
  var e = this._internalRoot;
  if (e !== null) {
    this._internalRoot = null;
    var t = e.containerInfo;
    Ar(function() {
      ol(null, e, null, null);
    }), t[Mt] = null;
  }
};
function il(e) {
  this._internalRoot = e;
}
il.prototype.unstable_scheduleHydration = function(e) {
  if (e) {
    var t = kd();
    e = { blockedOn: null, target: e, priority: t };
    for (var r = 0; r < Ht.length && t !== 0 && t < Ht[r].priority; r++) ;
    Ht.splice(r, 0, e), r === 0 && Sd(e);
  }
};
function $a(e) {
  return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11);
}
function ll(e) {
  return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11 && (e.nodeType !== 8 || e.nodeValue !== " react-mount-point-unstable "));
}
function rc() {
}
function Im(e, t, r, n, o) {
  if (o) {
    if (typeof n == "function") {
      var i = n;
      n = function() {
        var u = Wi(l);
        i.call(u);
      };
    }
    var l = Hf(t, n, e, 0, null, !1, !1, "", rc);
    return e._reactRootContainer = l, e[Mt] = l.current, vo(e.nodeType === 8 ? e.parentNode : e), Ar(), l;
  }
  for (; o = e.lastChild; ) e.removeChild(o);
  if (typeof n == "function") {
    var s = n;
    n = function() {
      var u = Wi(a);
      s.call(u);
    };
  }
  var a = La(e, 0, !1, null, null, !1, !1, "", rc);
  return e._reactRootContainer = a, e[Mt] = a.current, vo(e.nodeType === 8 ? e.parentNode : e), Ar(function() {
    ol(t, a, r, n);
  }), a;
}
function sl(e, t, r, n, o) {
  var i = r._reactRootContainer;
  if (i) {
    var l = i;
    if (typeof o == "function") {
      var s = o;
      o = function() {
        var a = Wi(l);
        s.call(a);
      };
    }
    ol(t, l, e, o);
  } else l = Im(r, t, e, o, n);
  return Wi(l);
}
xd = function(e) {
  switch (e.tag) {
    case 3:
      var t = e.stateNode;
      if (t.current.memoizedState.isDehydrated) {
        var r = Yn(t.pendingLanes);
        r !== 0 && (oa(t, r | 1), De(t, ae()), !(W & 6) && (Rn = ae() + 500, mr()));
      }
      break;
    case 13:
      Ar(function() {
        var n = Rt(e, 1);
        if (n !== null) {
          var o = _e();
          at(n, e, 1, o);
        }
      }), Ia(e, 1);
  }
};
ia = function(e) {
  if (e.tag === 13) {
    var t = Rt(e, 134217728);
    if (t !== null) {
      var r = _e();
      at(t, e, 134217728, r);
    }
    Ia(e, 134217728);
  }
};
wd = function(e) {
  if (e.tag === 13) {
    var t = ar(e), r = Rt(e, t);
    if (r !== null) {
      var n = _e();
      at(r, e, t, n);
    }
    Ia(e, t);
  }
};
kd = function() {
  return K;
};
bd = function(e, t) {
  var r = K;
  try {
    return K = e, t();
  } finally {
    K = r;
  }
};
Xl = function(e, t, r) {
  switch (t) {
    case "input":
      if (Hl(e, r), t = r.name, r.type === "radio" && t != null) {
        for (r = e; r.parentNode; ) r = r.parentNode;
        for (r = r.querySelectorAll("input[name=" + JSON.stringify("" + t) + '][type="radio"]'), t = 0; t < r.length; t++) {
          var n = r[t];
          if (n !== e && n.form === e.form) {
            var o = Xi(n);
            if (!o) throw Error(b(90));
            Jc(n), Hl(n, o);
          }
        }
      }
      break;
    case "textarea":
      td(e, r);
      break;
    case "select":
      t = r.value, t != null && ln(e, !!r.multiple, t, !1);
  }
};
ad = Ra;
ud = Ar;
var Dm = { usingClientEntryPoint: !1, Events: [Io, Zr, Xi, ld, sd, Ra] }, Hn = { findFiberByHostInstance: kr, bundleType: 0, version: "18.3.1", rendererPackageName: "react-dom" }, $m = { bundleType: Hn.bundleType, version: Hn.version, rendererPackageName: Hn.rendererPackageName, rendererConfig: Hn.rendererConfig, overrideHookState: null, overrideHookStateDeletePath: null, overrideHookStateRenamePath: null, overrideProps: null, overridePropsDeletePath: null, overridePropsRenamePath: null, setErrorHandler: null, setSuspenseHandler: null, scheduleUpdate: null, currentDispatcherRef: Ft.ReactCurrentDispatcher, findHostInstanceByFiber: function(e) {
  return e = fd(e), e === null ? null : e.stateNode;
}, findFiberByHostInstance: Hn.findFiberByHostInstance || Lm, findHostInstancesForRefresh: null, scheduleRefresh: null, scheduleRoot: null, setRefreshHandler: null, getCurrentFiber: null, reconcilerVersion: "18.3.1-next-f1338f8080-20240426" };
if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
  var oi = __REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!oi.isDisabled && oi.supportsFiber) try {
    Ki = oi.inject($m), vt = oi;
  } catch {
  }
}
Ve.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = Dm;
Ve.createPortal = function(e, t) {
  var r = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
  if (!$a(t)) throw Error(b(200));
  return Om(e, t, null, r);
};
Ve.createRoot = function(e, t) {
  if (!$a(e)) throw Error(b(299));
  var r = !1, n = "", o = Wf;
  return t != null && (t.unstable_strictMode === !0 && (r = !0), t.identifierPrefix !== void 0 && (n = t.identifierPrefix), t.onRecoverableError !== void 0 && (o = t.onRecoverableError)), t = La(e, 1, !1, null, null, r, !1, n, o), e[Mt] = t.current, vo(e.nodeType === 8 ? e.parentNode : e), new Da(t);
};
Ve.findDOMNode = function(e) {
  if (e == null) return null;
  if (e.nodeType === 1) return e;
  var t = e._reactInternals;
  if (t === void 0)
    throw typeof e.render == "function" ? Error(b(188)) : (e = Object.keys(e).join(","), Error(b(268, e)));
  return e = fd(t), e = e === null ? null : e.stateNode, e;
};
Ve.flushSync = function(e) {
  return Ar(e);
};
Ve.hydrate = function(e, t, r) {
  if (!ll(t)) throw Error(b(200));
  return sl(null, e, t, !0, r);
};
Ve.hydrateRoot = function(e, t, r) {
  if (!$a(e)) throw Error(b(405));
  var n = r != null && r.hydratedSources || null, o = !1, i = "", l = Wf;
  if (r != null && (r.unstable_strictMode === !0 && (o = !0), r.identifierPrefix !== void 0 && (i = r.identifierPrefix), r.onRecoverableError !== void 0 && (l = r.onRecoverableError)), t = Hf(t, null, e, 1, r ?? null, o, !1, i, l), e[Mt] = t.current, vo(e), n) for (e = 0; e < n.length; e++) r = n[e], o = r._getVersion, o = o(r._source), t.mutableSourceEagerHydrationData == null ? t.mutableSourceEagerHydrationData = [r, o] : t.mutableSourceEagerHydrationData.push(
    r,
    o
  );
  return new il(t);
};
Ve.render = function(e, t, r) {
  if (!ll(t)) throw Error(b(200));
  return sl(null, e, t, !1, r);
};
Ve.unmountComponentAtNode = function(e) {
  if (!ll(e)) throw Error(b(40));
  return e._reactRootContainer ? (Ar(function() {
    sl(null, null, e, !1, function() {
      e._reactRootContainer = null, e[Mt] = null;
    });
  }), !0) : !1;
};
Ve.unstable_batchedUpdates = Ra;
Ve.unstable_renderSubtreeIntoContainer = function(e, t, r, n) {
  if (!ll(r)) throw Error(b(200));
  if (e == null || e._reactInternals === void 0) throw Error(b(38));
  return sl(e, t, r, !1, n);
};
Ve.version = "18.3.1-next-f1338f8080-20240426";
function Vf() {
  if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
    try {
      __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(Vf);
    } catch (e) {
      console.error(e);
    }
}
Vf(), Wc.exports = Ve;
var Kf = Wc.exports, Gf, nc = Kf;
Gf = nc.createRoot, nc.hydrateRoot;
var $o = class {
  constructor() {
    this.listeners = /* @__PURE__ */ new Set(), this.subscribe = this.subscribe.bind(this);
  }
  subscribe(e) {
    return this.listeners.add(e), this.onSubscribe(), () => {
      this.listeners.delete(e), this.onUnsubscribe();
    };
  }
  hasListeners() {
    return this.listeners.size > 0;
  }
  onSubscribe() {
  }
  onUnsubscribe() {
  }
}, Er, Vt, pn, Nc, Am = (Nc = class extends $o {
  constructor() {
    super();
    F(this, Er);
    F(this, Vt);
    F(this, pn);
    j(this, pn, (t) => {
      if (typeof window < "u" && window.addEventListener) {
        const r = () => t();
        return window.addEventListener("visibilitychange", r, !1), () => {
          window.removeEventListener("visibilitychange", r);
        };
      }
    });
  }
  onSubscribe() {
    f(this, Vt) || this.setEventListener(f(this, pn));
  }
  onUnsubscribe() {
    var t;
    this.hasListeners() || ((t = f(this, Vt)) == null || t.call(this), j(this, Vt, void 0));
  }
  setEventListener(t) {
    var r;
    j(this, pn, t), (r = f(this, Vt)) == null || r.call(this), j(this, Vt, t((n) => {
      typeof n == "boolean" ? this.setFocused(n) : this.onFocus();
    }));
  }
  setFocused(t) {
    f(this, Er) !== t && (j(this, Er, t), this.onFocus());
  }
  onFocus() {
    const t = this.isFocused();
    this.listeners.forEach((r) => {
      r(t);
    });
  }
  isFocused() {
    return typeof f(this, Er) == "boolean" ? f(this, Er) : globalThis.document?.visibilityState !== "hidden";
  }
}, Er = new WeakMap(), Vt = new WeakMap(), pn = new WeakMap(), Nc), Aa = new Am(), Um = {
  // We need the wrapper function syntax below instead of direct references to
  // global setTimeout etc.
  //
  // BAD: `setTimeout: setTimeout`
  // GOOD: `setTimeout: (cb, delay) => setTimeout(cb, delay)`
  //
  // If we use direct references here, then anything that wants to spy on or
  // replace the global setTimeout (like tests) won't work since we'll already
  // have a hard reference to the original implementation at the time when this
  // file was imported.
  setTimeout: (e, t) => setTimeout(e, t),
  clearTimeout: (e) => clearTimeout(e),
  setInterval: (e, t) => setInterval(e, t),
  clearInterval: (e) => clearInterval(e)
}, Kt, Ws, jc, Qm = (jc = class {
  constructor() {
    // We cannot have TimeoutManager<T> as we must instantiate it with a concrete
    // type at app boot; and if we leave that type, then any new timer provider
    // would need to support the default provider's concrete timer ID, which is
    // infeasible across environments.
    //
    // We settle for type safety for the TimeoutProvider type, and accept that
    // this class is unsafe internally to allow for extension.
    F(this, Kt, Um);
    F(this, Ws, !1);
  }
  setTimeoutProvider(e) {
    j(this, Kt, e);
  }
  setTimeout(e, t) {
    return f(this, Kt).setTimeout(e, t);
  }
  clearTimeout(e) {
    f(this, Kt).clearTimeout(e);
  }
  setInterval(e, t) {
    return f(this, Kt).setInterval(e, t);
  }
  clearInterval(e) {
    f(this, Kt).clearInterval(e);
  }
}, Kt = new WeakMap(), Ws = new WeakMap(), jc), Cr = new Qm();
function Bm(e) {
  setTimeout(e, 0);
}
var Hm = typeof window > "u" || "Deno" in globalThis;
function Te() {
}
function Wm(e, t) {
  return typeof e == "function" ? e(t) : e;
}
function zs(e) {
  return typeof e == "number" && e >= 0 && e !== 1 / 0;
}
function qf(e, t) {
  return Math.max(e + (t || 0) - Date.now(), 0);
}
function cr(e, t) {
  return typeof e == "function" ? e(t) : e;
}
function Qe(e, t) {
  return typeof e == "function" ? e(t) : e;
}
function oc(e, t) {
  const {
    type: r = "all",
    exact: n,
    fetchStatus: o,
    predicate: i,
    queryKey: l,
    stale: s
  } = e;
  if (l) {
    if (n) {
      if (t.queryHash !== Ua(l, t.options))
        return !1;
    } else if (!jo(t.queryKey, l))
      return !1;
  }
  if (r !== "all") {
    const a = t.isActive();
    if (r === "active" && !a || r === "inactive" && a)
      return !1;
  }
  return !(typeof s == "boolean" && t.isStale() !== s || o && o !== t.state.fetchStatus || i && !i(t));
}
function ic(e, t) {
  const { exact: r, status: n, predicate: o, mutationKey: i } = e;
  if (i) {
    if (!t.options.mutationKey)
      return !1;
    if (r) {
      if (No(t.options.mutationKey) !== No(i))
        return !1;
    } else if (!jo(t.options.mutationKey, i))
      return !1;
  }
  return !(n && t.state.status !== n || o && !o(t));
}
function Ua(e, t) {
  return (t?.queryKeyHashFn || No)(e);
}
function No(e) {
  return JSON.stringify(
    e,
    (t, r) => Rs(r) ? Object.keys(r).sort().reduce((n, o) => (n[o] = r[o], n), {}) : r
  );
}
function jo(e, t) {
  return e === t ? !0 : typeof e != typeof t ? !1 : e && t && typeof e == "object" && typeof t == "object" ? Object.keys(t).every((r) => jo(e[r], t[r])) : !1;
}
var Vm = Object.prototype.hasOwnProperty;
function Yf(e, t, r = 0) {
  if (e === t)
    return e;
  if (r > 500) return t;
  const n = lc(e) && lc(t);
  if (!n && !(Rs(e) && Rs(t))) return t;
  const i = (n ? e : Object.keys(e)).length, l = n ? t : Object.keys(t), s = l.length, a = n ? new Array(s) : {};
  let u = 0;
  for (let g = 0; g < s; g++) {
    const h = n ? g : l[g], v = e[h], y = t[h];
    if (v === y) {
      a[h] = v, (n ? g < i : Vm.call(e, h)) && u++;
      continue;
    }
    if (v === null || y === null || typeof v != "object" || typeof y != "object") {
      a[h] = y;
      continue;
    }
    const w = Yf(v, y, r + 1);
    a[h] = w, w === v && u++;
  }
  return i === s && u === i ? e : a;
}
function Ms(e, t) {
  if (!t || Object.keys(e).length !== Object.keys(t).length)
    return !1;
  for (const r in e)
    if (e[r] !== t[r])
      return !1;
  return !0;
}
function lc(e) {
  return Array.isArray(e) && e.length === Object.keys(e).length;
}
function Rs(e) {
  if (!sc(e))
    return !1;
  const t = e.constructor;
  if (t === void 0)
    return !0;
  const r = t.prototype;
  return !(!sc(r) || !r.hasOwnProperty("isPrototypeOf") || Object.getPrototypeOf(e) !== Object.prototype);
}
function sc(e) {
  return Object.prototype.toString.call(e) === "[object Object]";
}
function Km(e) {
  return new Promise((t) => {
    Cr.setTimeout(t, e);
  });
}
function Ts(e, t, r) {
  return typeof r.structuralSharing == "function" ? r.structuralSharing(e, t) : r.structuralSharing !== !1 ? Yf(e, t) : t;
}
function Gm(e, t, r = 0) {
  const n = [...e, t];
  return r && n.length > r ? n.slice(1) : n;
}
function qm(e, t, r = 0) {
  const n = [t, ...e];
  return r && n.length > r ? n.slice(0, -1) : n;
}
var Qa = /* @__PURE__ */ Symbol();
function Xf(e, t) {
  return !e.queryFn && t?.initialPromise ? () => t.initialPromise : !e.queryFn || e.queryFn === Qa ? () => Promise.reject(new Error(`Missing queryFn: '${e.queryHash}'`)) : e.queryFn;
}
function Zf(e, t) {
  return typeof e == "function" ? e(...t) : !!e;
}
function Ym(e, t, r) {
  let n = !1, o;
  return Object.defineProperty(e, "signal", {
    enumerable: !0,
    get: () => (o ?? (o = t()), n || (n = !0, o.aborted ? r() : o.addEventListener("abort", r, { once: !0 })), o)
  }), e;
}
var _o = /* @__PURE__ */ (() => {
  let e = () => Hm;
  return {
    /**
     * Returns whether the current runtime should be treated as a server environment.
     */
    isServer() {
      return e();
    },
    /**
     * Overrides the server check globally.
     */
    setIsServer(t) {
      e = t;
    }
  };
})();
function Fs() {
  let e, t;
  const r = new Promise((o, i) => {
    e = o, t = i;
  });
  r.status = "pending", r.catch(() => {
  });
  function n(o) {
    Object.assign(r, o), delete r.resolve, delete r.reject;
  }
  return r.resolve = (o) => {
    n({
      status: "fulfilled",
      value: o
    }), e(o);
  }, r.reject = (o) => {
    n({
      status: "rejected",
      reason: o
    }), t(o);
  }, r;
}
var Xm = Bm;
function Zm() {
  let e = [], t = 0, r = (s) => {
    s();
  }, n = (s) => {
    s();
  }, o = Xm;
  const i = (s) => {
    t ? e.push(s) : o(() => {
      r(s);
    });
  }, l = () => {
    const s = e;
    e = [], s.length && o(() => {
      n(() => {
        s.forEach((a) => {
          r(a);
        });
      });
    });
  };
  return {
    batch: (s) => {
      let a;
      t++;
      try {
        a = s();
      } finally {
        t--, t || l();
      }
      return a;
    },
    /**
     * All calls to the wrapped function will be batched.
     */
    batchCalls: (s) => (...a) => {
      i(() => {
        s(...a);
      });
    },
    schedule: i,
    /**
     * Use this method to set a custom notify function.
     * This can be used to for example wrap notifications with `React.act` while running tests.
     */
    setNotifyFunction: (s) => {
      r = s;
    },
    /**
     * Use this method to set a custom function to batch notifications together into a single tick.
     * By default React Query will use the batch function provided by ReactDOM or React Native.
     */
    setBatchNotifyFunction: (s) => {
      n = s;
    },
    setScheduler: (s) => {
      o = s;
    }
  };
}
var ve = Zm(), hn, Gt, mn, _c, Jm = (_c = class extends $o {
  constructor() {
    super();
    F(this, hn, !0);
    F(this, Gt);
    F(this, mn);
    j(this, mn, (t) => {
      if (typeof window < "u" && window.addEventListener) {
        const r = () => t(!0), n = () => t(!1);
        return window.addEventListener("online", r, !1), window.addEventListener("offline", n, !1), () => {
          window.removeEventListener("online", r), window.removeEventListener("offline", n);
        };
      }
    });
  }
  onSubscribe() {
    f(this, Gt) || this.setEventListener(f(this, mn));
  }
  onUnsubscribe() {
    var t;
    this.hasListeners() || ((t = f(this, Gt)) == null || t.call(this), j(this, Gt, void 0));
  }
  setEventListener(t) {
    var r;
    j(this, mn, t), (r = f(this, Gt)) == null || r.call(this), j(this, Gt, t(this.setOnline.bind(this)));
  }
  setOnline(t) {
    f(this, hn) !== t && (j(this, hn, t), this.listeners.forEach((n) => {
      n(t);
    }));
  }
  isOnline() {
    return f(this, hn);
  }
}, hn = new WeakMap(), Gt = new WeakMap(), mn = new WeakMap(), _c), Vi = new Jm();
function eg(e) {
  return Math.min(1e3 * 2 ** e, 3e4);
}
function Jf(e) {
  return (e ?? "online") === "online" ? Vi.isOnline() : !0;
}
var Os = class extends Error {
  constructor(e) {
    super("CancelledError"), this.revert = e?.revert, this.silent = e?.silent;
  }
};
function ep(e) {
  let t = !1, r = 0, n;
  const o = Fs(), i = () => o.status !== "pending", l = (x) => {
    if (!i()) {
      const S = new Os(x);
      v(S), e.onCancel?.(S);
    }
  }, s = () => {
    t = !0;
  }, a = () => {
    t = !1;
  }, u = () => Aa.isFocused() && (e.networkMode === "always" || Vi.isOnline()) && e.canRun(), g = () => Jf(e.networkMode) && e.canRun(), h = (x) => {
    i() || (n?.(), o.resolve(x));
  }, v = (x) => {
    i() || (n?.(), o.reject(x));
  }, y = () => new Promise((x) => {
    n = (S) => {
      (i() || u()) && x(S);
    }, e.onPause?.();
  }).then(() => {
    n = void 0, i() || e.onContinue?.();
  }), w = () => {
    if (i())
      return;
    let x;
    const S = r === 0 ? e.initialPromise : void 0;
    try {
      x = S ?? e.fn();
    } catch (p) {
      x = Promise.reject(p);
    }
    Promise.resolve(x).then(h).catch((p) => {
      if (i())
        return;
      const d = e.retry ?? (_o.isServer() ? 0 : 3), m = e.retryDelay ?? eg, k = typeof m == "function" ? m(r, p) : m, C = d === !0 || typeof d == "number" && r < d || typeof d == "function" && d(r, p);
      if (t || !C) {
        v(p);
        return;
      }
      r++, e.onFail?.(r, p), Km(k).then(() => u() ? void 0 : y()).then(() => {
        t ? v(p) : w();
      });
    });
  };
  return {
    promise: o,
    status: () => o.status,
    cancel: l,
    continue: () => (n?.(), o),
    cancelRetry: s,
    continueRetry: a,
    canStart: g,
    start: () => (g() ? w() : y().then(w), o)
  };
}
var Nr, Pc, tp = (Pc = class {
  constructor() {
    F(this, Nr);
  }
  destroy() {
    this.clearGcTimeout();
  }
  scheduleGc() {
    this.clearGcTimeout(), zs(this.gcTime) && j(this, Nr, Cr.setTimeout(() => {
      this.optionalRemove();
    }, this.gcTime));
  }
  updateGcTime(e) {
    this.gcTime = Math.max(
      this.gcTime || 0,
      e ?? (_o.isServer() ? 1 / 0 : 5 * 60 * 1e3)
    );
  }
  clearGcTimeout() {
    f(this, Nr) !== void 0 && (Cr.clearTimeout(f(this, Nr)), j(this, Nr, void 0));
  }
}, Nr = new WeakMap(), Pc);
function tg(e) {
  return {
    onFetch: (t, r) => {
      const n = t.options, o = t.fetchOptions?.meta?.fetchMore?.direction, i = t.state.data?.pages || [], l = t.state.data?.pageParams || [];
      let s = { pages: [], pageParams: [] }, a = 0;
      const u = async () => {
        let g = !1;
        const h = (w) => {
          Ym(
            w,
            () => t.signal,
            () => g = !0
          );
        }, v = Xf(t.options, t.fetchOptions), y = async (w, x, S) => {
          if (g)
            return Promise.reject(t.signal.reason);
          if (x == null && w.pages.length)
            return Promise.resolve(w);
          const d = (() => {
            const _ = {
              client: t.client,
              queryKey: t.queryKey,
              pageParam: x,
              direction: S ? "backward" : "forward",
              meta: t.options.meta
            };
            return h(_), _;
          })(), m = await v(d), { maxPages: k } = t.options, C = S ? qm : Gm;
          return {
            pages: C(w.pages, m, k),
            pageParams: C(w.pageParams, x, k)
          };
        };
        if (o && i.length) {
          const w = o === "backward", x = w ? rg : ac, S = {
            pages: i,
            pageParams: l
          }, p = x(n, S);
          s = await y(S, p, w);
        } else {
          const w = e ?? i.length;
          do {
            const x = a === 0 ? l[0] ?? n.initialPageParam : ac(n, s);
            if (a > 0 && x == null)
              break;
            s = await y(s, x), a++;
          } while (a < w);
        }
        return s;
      };
      t.options.persister ? t.fetchFn = () => t.options.persister?.(
        u,
        {
          client: t.client,
          queryKey: t.queryKey,
          meta: t.options.meta,
          signal: t.signal
        },
        r
      ) : t.fetchFn = u;
    }
  };
}
function ac(e, { pages: t, pageParams: r }) {
  const n = t.length - 1;
  return t.length > 0 ? e.getNextPageParam(
    t[n],
    t,
    r[n],
    r
  ) : void 0;
}
function rg(e, { pages: t, pageParams: r }) {
  return t.length > 0 ? e.getPreviousPageParam?.(t[0], t, r[0], r) : void 0;
}
var gn, jr, vn, qe, _r, fe, Po, Pr, Ue, rp, bt, zc, ng = (zc = class extends tp {
  constructor(t) {
    super();
    F(this, Ue);
    F(this, gn);
    F(this, jr);
    F(this, vn);
    F(this, qe);
    F(this, _r);
    F(this, fe);
    F(this, Po);
    F(this, Pr);
    j(this, Pr, !1), j(this, Po, t.defaultOptions), this.setOptions(t.options), this.observers = [], j(this, _r, t.client), j(this, qe, f(this, _r).getQueryCache()), this.queryKey = t.queryKey, this.queryHash = t.queryHash, j(this, jr, cc(this.options)), this.state = t.state ?? f(this, jr), this.scheduleGc();
  }
  get meta() {
    return this.options.meta;
  }
  get queryType() {
    return f(this, gn);
  }
  get promise() {
    return f(this, fe)?.promise;
  }
  setOptions(t) {
    if (this.options = { ...f(this, Po), ...t }, t?._type && j(this, gn, t._type), this.updateGcTime(this.options.gcTime), this.state && this.state.data === void 0) {
      const r = cc(this.options);
      r.data !== void 0 && (this.setState(
        uc(r.data, r.dataUpdatedAt)
      ), j(this, jr, r));
    }
  }
  optionalRemove() {
    !this.observers.length && this.state.fetchStatus === "idle" && f(this, qe).remove(this);
  }
  setData(t, r) {
    const n = Ts(this.state.data, t, this.options);
    return A(this, Ue, bt).call(this, {
      data: n,
      type: "success",
      dataUpdatedAt: r?.updatedAt,
      manual: r?.manual
    }), n;
  }
  setState(t) {
    A(this, Ue, bt).call(this, { type: "setState", state: t });
  }
  cancel(t) {
    const r = f(this, fe)?.promise;
    return f(this, fe)?.cancel(t), r ? r.then(Te).catch(Te) : Promise.resolve();
  }
  destroy() {
    super.destroy(), this.cancel({ silent: !0 });
  }
  get resetState() {
    return f(this, jr);
  }
  reset() {
    this.destroy(), this.setState(this.resetState);
  }
  isActive() {
    return this.observers.some(
      (t) => Qe(t.options.enabled, this) !== !1
    );
  }
  isDisabled() {
    return this.getObserversCount() > 0 ? !this.isActive() : this.options.queryFn === Qa || !this.isFetched();
  }
  isFetched() {
    return this.state.dataUpdateCount + this.state.errorUpdateCount > 0;
  }
  isStatic() {
    return this.getObserversCount() > 0 ? this.observers.some(
      (t) => cr(t.options.staleTime, this) === "static"
    ) : !1;
  }
  isStale() {
    return this.getObserversCount() > 0 ? this.observers.some(
      (t) => t.getCurrentResult().isStale
    ) : this.state.data === void 0 || this.state.isInvalidated;
  }
  isStaleByTime(t = 0) {
    return this.state.data === void 0 ? !0 : t === "static" ? !1 : this.state.isInvalidated ? !0 : !qf(this.state.dataUpdatedAt, t);
  }
  onFocus() {
    this.observers.find((r) => r.shouldFetchOnWindowFocus())?.refetch({ cancelRefetch: !1 }), f(this, fe)?.continue();
  }
  onOnline() {
    this.observers.find((r) => r.shouldFetchOnReconnect())?.refetch({ cancelRefetch: !1 }), f(this, fe)?.continue();
  }
  addObserver(t) {
    this.observers.includes(t) || (this.observers.push(t), this.clearGcTimeout(), f(this, qe).notify({ type: "observerAdded", query: this, observer: t }));
  }
  removeObserver(t) {
    this.observers.includes(t) && (this.observers = this.observers.filter((r) => r !== t), this.observers.length || (f(this, fe) && (f(this, Pr) || A(this, Ue, rp).call(this) ? f(this, fe).cancel({ revert: !0 }) : f(this, fe).cancelRetry()), this.scheduleGc()), f(this, qe).notify({ type: "observerRemoved", query: this, observer: t }));
  }
  getObserversCount() {
    return this.observers.length;
  }
  invalidate() {
    this.state.isInvalidated || A(this, Ue, bt).call(this, { type: "invalidate" });
  }
  async fetch(t, r) {
    if (this.state.fetchStatus !== "idle" && // If the promise in the retryer is already rejected, we have to definitely
    // re-start the fetch; there is a chance that the query is still in a
    // pending state when that happens
    f(this, fe)?.status() !== "rejected") {
      if (this.state.data !== void 0 && r?.cancelRefetch)
        this.cancel({ silent: !0 });
      else if (f(this, fe))
        return f(this, fe).continueRetry(), f(this, fe).promise;
    }
    if (t && this.setOptions(t), !this.options.queryFn) {
      const u = this.observers.find((g) => g.options.queryFn);
      u && this.setOptions(u.options);
    }
    const n = new AbortController(), o = (u) => {
      Object.defineProperty(u, "signal", {
        enumerable: !0,
        get: () => (j(this, Pr, !0), n.signal)
      });
    }, i = () => {
      const u = Xf(this.options, r), h = (() => {
        const v = {
          client: f(this, _r),
          queryKey: this.queryKey,
          meta: this.meta
        };
        return o(v), v;
      })();
      return j(this, Pr, !1), this.options.persister ? this.options.persister(
        u,
        h,
        this
      ) : u(h);
    }, s = (() => {
      const u = {
        fetchOptions: r,
        options: this.options,
        queryKey: this.queryKey,
        client: f(this, _r),
        state: this.state,
        fetchFn: i
      };
      return o(u), u;
    })();
    (f(this, gn) === "infinite" ? tg(
      this.options.pages
    ) : this.options.behavior)?.onFetch(s, this), j(this, vn, this.state), (this.state.fetchStatus === "idle" || this.state.fetchMeta !== s.fetchOptions?.meta) && A(this, Ue, bt).call(this, { type: "fetch", meta: s.fetchOptions?.meta }), j(this, fe, ep({
      initialPromise: r?.initialPromise,
      fn: s.fetchFn,
      onCancel: (u) => {
        u instanceof Os && u.revert && this.setState({
          ...f(this, vn),
          fetchStatus: "idle"
        }), n.abort();
      },
      onFail: (u, g) => {
        A(this, Ue, bt).call(this, { type: "failed", failureCount: u, error: g });
      },
      onPause: () => {
        A(this, Ue, bt).call(this, { type: "pause" });
      },
      onContinue: () => {
        A(this, Ue, bt).call(this, { type: "continue" });
      },
      retry: s.options.retry,
      retryDelay: s.options.retryDelay,
      networkMode: s.options.networkMode,
      canRun: () => !0
    }));
    try {
      const u = await f(this, fe).start();
      if (u === void 0)
        throw new Error(`${this.queryHash} data is undefined`);
      return this.setData(u), f(this, qe).config.onSuccess?.(u, this), f(this, qe).config.onSettled?.(
        u,
        this.state.error,
        this
      ), u;
    } catch (u) {
      if (u instanceof Os) {
        if (u.silent)
          return f(this, fe).promise;
        if (u.revert) {
          if (this.state.data === void 0)
            throw u;
          return this.state.data;
        }
      }
      throw A(this, Ue, bt).call(this, {
        type: "error",
        error: u
      }), f(this, qe).config.onError?.(
        u,
        this
      ), f(this, qe).config.onSettled?.(
        this.state.data,
        u,
        this
      ), u;
    } finally {
      this.scheduleGc();
    }
  }
}, gn = new WeakMap(), jr = new WeakMap(), vn = new WeakMap(), qe = new WeakMap(), _r = new WeakMap(), fe = new WeakMap(), Po = new WeakMap(), Pr = new WeakMap(), Ue = new WeakSet(), rp = function() {
  return this.state.fetchStatus === "paused" && this.state.status === "pending";
}, bt = function(t) {
  const r = (n) => {
    switch (t.type) {
      case "failed":
        return {
          ...n,
          fetchFailureCount: t.failureCount,
          fetchFailureReason: t.error
        };
      case "pause":
        return {
          ...n,
          fetchStatus: "paused"
        };
      case "continue":
        return {
          ...n,
          fetchStatus: "fetching"
        };
      case "fetch":
        return {
          ...n,
          ...np(n.data, this.options),
          fetchMeta: t.meta ?? null
        };
      case "success":
        const o = {
          ...n,
          ...uc(t.data, t.dataUpdatedAt),
          dataUpdateCount: n.dataUpdateCount + 1,
          ...!t.manual && {
            fetchStatus: "idle",
            fetchFailureCount: 0,
            fetchFailureReason: null
          }
        };
        return j(this, vn, t.manual ? o : void 0), o;
      case "error":
        const i = t.error;
        return {
          ...n,
          error: i,
          errorUpdateCount: n.errorUpdateCount + 1,
          errorUpdatedAt: Date.now(),
          fetchFailureCount: n.fetchFailureCount + 1,
          fetchFailureReason: i,
          fetchStatus: "idle",
          status: "error",
          // flag existing data as invalidated if we get a background error
          // note that "no data" always means stale so we can set unconditionally here
          isInvalidated: !0
        };
      case "invalidate":
        return {
          ...n,
          isInvalidated: !0
        };
      case "setState":
        return {
          ...n,
          ...t.state
        };
    }
  };
  this.state = r(this.state), ve.batch(() => {
    this.observers.forEach((n) => {
      n.onQueryUpdate();
    }), f(this, qe).notify({ query: this, type: "updated", action: t });
  });
}, zc);
function np(e, t) {
  return {
    fetchFailureCount: 0,
    fetchFailureReason: null,
    fetchStatus: Jf(t.networkMode) ? "fetching" : "paused",
    ...e === void 0 && {
      error: null,
      status: "pending"
    }
  };
}
function uc(e, t) {
  return {
    data: e,
    dataUpdatedAt: t ?? Date.now(),
    error: null,
    isInvalidated: !1,
    status: "success"
  };
}
function cc(e) {
  const t = typeof e.initialData == "function" ? e.initialData() : e.initialData, r = t !== void 0, n = r ? typeof e.initialDataUpdatedAt == "function" ? e.initialDataUpdatedAt() : e.initialDataUpdatedAt : 0;
  return {
    data: t,
    dataUpdateCount: 0,
    dataUpdatedAt: r ? n ?? Date.now() : 0,
    error: null,
    errorUpdateCount: 0,
    errorUpdatedAt: 0,
    fetchFailureCount: 0,
    fetchFailureReason: null,
    fetchMeta: null,
    isInvalidated: !1,
    status: r ? "success" : "pending",
    fetchStatus: "idle"
  };
}
var Re, Q, zo, Ne, zr, yn, Et, qt, Mo, xn, wn, Mr, Rr, Yt, kn, V, Zn, Ls, Is, Ds, $s, As, Us, Qs, op, Mc, og = (Mc = class extends $o {
  constructor(t, r) {
    super();
    F(this, V);
    F(this, Re);
    F(this, Q);
    F(this, zo);
    F(this, Ne);
    F(this, zr);
    F(this, yn);
    F(this, Et);
    F(this, qt);
    F(this, Mo);
    F(this, xn);
    // This property keeps track of the last query with defined data.
    // It will be used to pass the previous data and query to the placeholder function between renders.
    F(this, wn);
    F(this, Mr);
    F(this, Rr);
    F(this, Yt);
    F(this, kn, /* @__PURE__ */ new Set());
    this.options = r, j(this, Re, t), j(this, qt, null), j(this, Et, Fs()), this.bindMethods(), this.setOptions(r);
  }
  bindMethods() {
    this.refetch = this.refetch.bind(this);
  }
  onSubscribe() {
    this.listeners.size === 1 && (f(this, Q).addObserver(this), dc(f(this, Q), this.options) ? A(this, V, Zn).call(this) : this.updateResult(), A(this, V, $s).call(this));
  }
  onUnsubscribe() {
    this.hasListeners() || this.destroy();
  }
  shouldFetchOnReconnect() {
    return Bs(
      f(this, Q),
      this.options,
      this.options.refetchOnReconnect
    );
  }
  shouldFetchOnWindowFocus() {
    return Bs(
      f(this, Q),
      this.options,
      this.options.refetchOnWindowFocus
    );
  }
  destroy() {
    this.listeners = /* @__PURE__ */ new Set(), A(this, V, As).call(this), A(this, V, Us).call(this), f(this, Q).removeObserver(this);
  }
  setOptions(t) {
    const r = this.options, n = f(this, Q);
    if (this.options = f(this, Re).defaultQueryOptions(t), this.options.enabled !== void 0 && typeof this.options.enabled != "boolean" && typeof this.options.enabled != "function" && typeof Qe(this.options.enabled, f(this, Q)) != "boolean")
      throw new Error(
        "Expected enabled to be a boolean or a callback that returns a boolean"
      );
    A(this, V, Qs).call(this), f(this, Q).setOptions(this.options), r._defaulted && !Ms(this.options, r) && f(this, Re).getQueryCache().notify({
      type: "observerOptionsUpdated",
      query: f(this, Q),
      observer: this
    });
    const o = this.hasListeners();
    o && fc(
      f(this, Q),
      n,
      this.options,
      r
    ) && A(this, V, Zn).call(this), this.updateResult(), o && (f(this, Q) !== n || Qe(this.options.enabled, f(this, Q)) !== Qe(r.enabled, f(this, Q)) || cr(this.options.staleTime, f(this, Q)) !== cr(r.staleTime, f(this, Q))) && A(this, V, Ls).call(this);
    const i = A(this, V, Is).call(this);
    o && (f(this, Q) !== n || Qe(this.options.enabled, f(this, Q)) !== Qe(r.enabled, f(this, Q)) || i !== f(this, Yt)) && A(this, V, Ds).call(this, i);
  }
  getOptimisticResult(t) {
    const r = f(this, Re).getQueryCache().build(f(this, Re), t), n = this.createResult(r, t);
    return lg(this, n) && (j(this, Ne, n), j(this, yn, this.options), j(this, zr, f(this, Q).state)), n;
  }
  getCurrentResult() {
    return f(this, Ne);
  }
  trackResult(t, r) {
    return new Proxy(t, {
      get: (n, o) => (this.trackProp(o), r?.(o), o === "promise" && (this.trackProp("data"), !this.options.experimental_prefetchInRender && f(this, Et).status === "pending" && f(this, Et).reject(
        new Error(
          "experimental_prefetchInRender feature flag is not enabled"
        )
      )), Reflect.get(n, o))
    });
  }
  trackProp(t) {
    f(this, kn).add(t);
  }
  getCurrentQuery() {
    return f(this, Q);
  }
  refetch({ ...t } = {}) {
    return this.fetch({
      ...t
    });
  }
  fetchOptimistic(t) {
    const r = f(this, Re).defaultQueryOptions(t), n = f(this, Re).getQueryCache().build(f(this, Re), r);
    return n.fetch().then(() => this.createResult(n, r));
  }
  fetch(t) {
    return A(this, V, Zn).call(this, {
      ...t,
      cancelRefetch: t.cancelRefetch ?? !0
    }).then(() => (this.updateResult(), f(this, Ne)));
  }
  createResult(t, r) {
    const n = f(this, Q), o = this.options, i = f(this, Ne), l = f(this, zr), s = f(this, yn), u = t !== n ? t.state : f(this, zo), { state: g } = t;
    let h = { ...g }, v = !1, y;
    if (r._optimisticResults) {
      const R = this.hasListeners(), T = !R && dc(t, r), Y = R && fc(t, n, r, o);
      (T || Y) && (h = {
        ...h,
        ...np(g.data, t.options)
      }), r._optimisticResults === "isRestoring" && (h.fetchStatus = "idle");
    }
    let { error: w, errorUpdatedAt: x, status: S } = h;
    y = h.data;
    let p = !1;
    if (r.placeholderData !== void 0 && y === void 0 && S === "pending") {
      let R;
      i?.isPlaceholderData && r.placeholderData === s?.placeholderData ? (R = i.data, p = !0) : R = typeof r.placeholderData == "function" ? r.placeholderData(
        f(this, wn)?.state.data,
        f(this, wn)
      ) : r.placeholderData, R !== void 0 && (S = "success", y = Ts(
        i?.data,
        R,
        r
      ), v = !0);
    }
    if (r.select && y !== void 0 && !p)
      if (i && y === l?.data && r.select === f(this, Mo))
        y = f(this, xn);
      else
        try {
          j(this, Mo, r.select), y = r.select(y), y = Ts(i?.data, y, r), j(this, xn, y), j(this, qt, null);
        } catch (R) {
          j(this, qt, R);
        }
    f(this, qt) && (w = f(this, qt), y = f(this, xn), x = Date.now(), S = "error");
    const d = h.fetchStatus === "fetching", m = S === "pending", k = S === "error", C = m && d, _ = y !== void 0, P = {
      status: S,
      fetchStatus: h.fetchStatus,
      isPending: m,
      isSuccess: S === "success",
      isError: k,
      isInitialLoading: C,
      isLoading: C,
      data: y,
      dataUpdatedAt: h.dataUpdatedAt,
      error: w,
      errorUpdatedAt: x,
      failureCount: h.fetchFailureCount,
      failureReason: h.fetchFailureReason,
      errorUpdateCount: h.errorUpdateCount,
      isFetched: t.isFetched(),
      isFetchedAfterMount: h.dataUpdateCount > u.dataUpdateCount || h.errorUpdateCount > u.errorUpdateCount,
      isFetching: d,
      isRefetching: d && !m,
      isLoadingError: k && !_,
      isPaused: h.fetchStatus === "paused",
      isPlaceholderData: v,
      isRefetchError: k && _,
      isStale: Ba(t, r),
      refetch: this.refetch,
      promise: f(this, Et),
      isEnabled: Qe(r.enabled, t) !== !1
    };
    if (this.options.experimental_prefetchInRender) {
      const R = P.data !== void 0, T = P.status === "error" && !R, Y = (Me) => {
        T ? Me.reject(P.error) : R && Me.resolve(P.data);
      }, U = () => {
        const Me = j(this, Et, P.promise = Fs());
        Y(Me);
      }, Ee = f(this, Et);
      switch (Ee.status) {
        case "pending":
          t.queryHash === n.queryHash && Y(Ee);
          break;
        case "fulfilled":
          (T || P.data !== Ee.value) && U();
          break;
        case "rejected":
          (!T || P.error !== Ee.reason) && U();
          break;
      }
    }
    return P;
  }
  updateResult() {
    const t = f(this, Ne), r = this.createResult(f(this, Q), this.options);
    if (j(this, zr, f(this, Q).state), j(this, yn, this.options), f(this, zr).data !== void 0 && j(this, wn, f(this, Q)), Ms(r, t))
      return;
    j(this, Ne, r);
    const n = () => {
      if (!t)
        return !0;
      const { notifyOnChangeProps: o } = this.options, i = typeof o == "function" ? o() : o;
      if (i === "all" || !i && !f(this, kn).size)
        return !0;
      const l = new Set(
        i ?? f(this, kn)
      );
      return this.options.throwOnError && l.add("error"), Object.keys(f(this, Ne)).some((s) => {
        const a = s;
        return f(this, Ne)[a] !== t[a] && l.has(a);
      });
    };
    A(this, V, op).call(this, { listeners: n() });
  }
  onQueryUpdate() {
    this.updateResult(), this.hasListeners() && A(this, V, $s).call(this);
  }
}, Re = new WeakMap(), Q = new WeakMap(), zo = new WeakMap(), Ne = new WeakMap(), zr = new WeakMap(), yn = new WeakMap(), Et = new WeakMap(), qt = new WeakMap(), Mo = new WeakMap(), xn = new WeakMap(), wn = new WeakMap(), Mr = new WeakMap(), Rr = new WeakMap(), Yt = new WeakMap(), kn = new WeakMap(), V = new WeakSet(), Zn = function(t) {
  A(this, V, Qs).call(this);
  let r = f(this, Q).fetch(
    this.options,
    t
  );
  return t?.throwOnError || (r = r.catch(Te)), r;
}, Ls = function() {
  A(this, V, As).call(this);
  const t = cr(
    this.options.staleTime,
    f(this, Q)
  );
  if (_o.isServer() || f(this, Ne).isStale || !zs(t))
    return;
  const n = qf(f(this, Ne).dataUpdatedAt, t) + 1;
  j(this, Mr, Cr.setTimeout(() => {
    f(this, Ne).isStale || this.updateResult();
  }, n));
}, Is = function() {
  return (typeof this.options.refetchInterval == "function" ? this.options.refetchInterval(f(this, Q)) : this.options.refetchInterval) ?? !1;
}, Ds = function(t) {
  A(this, V, Us).call(this), j(this, Yt, t), !(_o.isServer() || Qe(this.options.enabled, f(this, Q)) === !1 || !zs(f(this, Yt)) || f(this, Yt) === 0) && j(this, Rr, Cr.setInterval(() => {
    (this.options.refetchIntervalInBackground || Aa.isFocused()) && A(this, V, Zn).call(this);
  }, f(this, Yt)));
}, $s = function() {
  A(this, V, Ls).call(this), A(this, V, Ds).call(this, A(this, V, Is).call(this));
}, As = function() {
  f(this, Mr) !== void 0 && (Cr.clearTimeout(f(this, Mr)), j(this, Mr, void 0));
}, Us = function() {
  f(this, Rr) !== void 0 && (Cr.clearInterval(f(this, Rr)), j(this, Rr, void 0));
}, Qs = function() {
  const t = f(this, Re).getQueryCache().build(f(this, Re), this.options);
  if (t === f(this, Q))
    return;
  const r = f(this, Q);
  j(this, Q, t), j(this, zo, t.state), this.hasListeners() && (r?.removeObserver(this), t.addObserver(this));
}, op = function(t) {
  ve.batch(() => {
    t.listeners && this.listeners.forEach((r) => {
      r(f(this, Ne));
    }), f(this, Re).getQueryCache().notify({
      query: f(this, Q),
      type: "observerResultsUpdated"
    });
  });
}, Mc);
function ig(e, t) {
  return Qe(t.enabled, e) !== !1 && e.state.data === void 0 && !(e.state.status === "error" && Qe(t.retryOnMount, e) === !1);
}
function dc(e, t) {
  return ig(e, t) || e.state.data !== void 0 && Bs(e, t, t.refetchOnMount);
}
function Bs(e, t, r) {
  if (Qe(t.enabled, e) !== !1 && cr(t.staleTime, e) !== "static") {
    const n = typeof r == "function" ? r(e) : r;
    return n === "always" || n !== !1 && Ba(e, t);
  }
  return !1;
}
function fc(e, t, r, n) {
  return (e !== t || Qe(n.enabled, e) === !1) && (!r.suspense || e.state.status !== "error") && Ba(e, r);
}
function Ba(e, t) {
  return Qe(t.enabled, e) !== !1 && e.isStaleByTime(cr(t.staleTime, e));
}
function lg(e, t) {
  return !Ms(e.getCurrentResult(), t);
}
var Ro, pt, be, Tr, ht, Ut, Rc, sg = (Rc = class extends tp {
  constructor(t) {
    super();
    F(this, ht);
    F(this, Ro);
    F(this, pt);
    F(this, be);
    F(this, Tr);
    j(this, Ro, t.client), this.mutationId = t.mutationId, j(this, be, t.mutationCache), j(this, pt, []), this.state = t.state || ag(), this.setOptions(t.options), this.scheduleGc();
  }
  setOptions(t) {
    this.options = t, this.updateGcTime(this.options.gcTime);
  }
  get meta() {
    return this.options.meta;
  }
  addObserver(t) {
    f(this, pt).includes(t) || (f(this, pt).push(t), this.clearGcTimeout(), f(this, be).notify({
      type: "observerAdded",
      mutation: this,
      observer: t
    }));
  }
  removeObserver(t) {
    j(this, pt, f(this, pt).filter((r) => r !== t)), this.scheduleGc(), f(this, be).notify({
      type: "observerRemoved",
      mutation: this,
      observer: t
    });
  }
  optionalRemove() {
    f(this, pt).length || (this.state.status === "pending" ? this.scheduleGc() : f(this, be).remove(this));
  }
  continue() {
    return f(this, Tr)?.continue() ?? // continuing a mutation assumes that variables are set, mutation must have been dehydrated before
    this.execute(this.state.variables);
  }
  async execute(t) {
    const r = () => {
      A(this, ht, Ut).call(this, { type: "continue" });
    }, n = {
      client: f(this, Ro),
      meta: this.options.meta,
      mutationKey: this.options.mutationKey
    };
    j(this, Tr, ep({
      fn: () => this.options.mutationFn ? this.options.mutationFn(t, n) : Promise.reject(new Error("No mutationFn found")),
      onFail: (l, s) => {
        A(this, ht, Ut).call(this, { type: "failed", failureCount: l, error: s });
      },
      onPause: () => {
        A(this, ht, Ut).call(this, { type: "pause" });
      },
      onContinue: r,
      retry: this.options.retry ?? 0,
      retryDelay: this.options.retryDelay,
      networkMode: this.options.networkMode,
      canRun: () => f(this, be).canRun(this)
    }));
    const o = this.state.status === "pending", i = !f(this, Tr).canStart();
    try {
      if (o)
        r();
      else {
        A(this, ht, Ut).call(this, { type: "pending", variables: t, isPaused: i }), f(this, be).config.onMutate && await f(this, be).config.onMutate(
          t,
          this,
          n
        );
        const s = await this.options.onMutate?.(
          t,
          n
        );
        s !== this.state.context && A(this, ht, Ut).call(this, {
          type: "pending",
          context: s,
          variables: t,
          isPaused: i
        });
      }
      const l = await f(this, Tr).start();
      return await f(this, be).config.onSuccess?.(
        l,
        t,
        this.state.context,
        this,
        n
      ), await this.options.onSuccess?.(
        l,
        t,
        this.state.context,
        n
      ), await f(this, be).config.onSettled?.(
        l,
        null,
        this.state.variables,
        this.state.context,
        this,
        n
      ), await this.options.onSettled?.(
        l,
        null,
        t,
        this.state.context,
        n
      ), A(this, ht, Ut).call(this, { type: "success", data: l }), l;
    } catch (l) {
      try {
        await f(this, be).config.onError?.(
          l,
          t,
          this.state.context,
          this,
          n
        );
      } catch (s) {
        Promise.reject(s);
      }
      try {
        await this.options.onError?.(
          l,
          t,
          this.state.context,
          n
        );
      } catch (s) {
        Promise.reject(s);
      }
      try {
        await f(this, be).config.onSettled?.(
          void 0,
          l,
          this.state.variables,
          this.state.context,
          this,
          n
        );
      } catch (s) {
        Promise.reject(s);
      }
      try {
        await this.options.onSettled?.(
          void 0,
          l,
          t,
          this.state.context,
          n
        );
      } catch (s) {
        Promise.reject(s);
      }
      throw A(this, ht, Ut).call(this, { type: "error", error: l }), l;
    } finally {
      f(this, be).runNext(this);
    }
  }
}, Ro = new WeakMap(), pt = new WeakMap(), be = new WeakMap(), Tr = new WeakMap(), ht = new WeakSet(), Ut = function(t) {
  const r = (n) => {
    switch (t.type) {
      case "failed":
        return {
          ...n,
          failureCount: t.failureCount,
          failureReason: t.error
        };
      case "pause":
        return {
          ...n,
          isPaused: !0
        };
      case "continue":
        return {
          ...n,
          isPaused: !1
        };
      case "pending":
        return {
          ...n,
          context: t.context,
          data: void 0,
          failureCount: 0,
          failureReason: null,
          error: null,
          isPaused: t.isPaused,
          status: "pending",
          variables: t.variables,
          submittedAt: Date.now()
        };
      case "success":
        return {
          ...n,
          data: t.data,
          failureCount: 0,
          failureReason: null,
          error: null,
          status: "success",
          isPaused: !1
        };
      case "error":
        return {
          ...n,
          data: void 0,
          error: t.error,
          failureCount: n.failureCount + 1,
          failureReason: t.error,
          isPaused: !1,
          status: "error"
        };
    }
  };
  this.state = r(this.state), ve.batch(() => {
    f(this, pt).forEach((n) => {
      n.onMutationUpdate(t);
    }), f(this, be).notify({
      mutation: this,
      type: "updated",
      action: t
    });
  });
}, Rc);
function ag() {
  return {
    context: void 0,
    data: void 0,
    error: null,
    failureCount: 0,
    failureReason: null,
    isPaused: !1,
    status: "idle",
    variables: void 0,
    submittedAt: 0
  };
}
var Nt, ot, To, Tc, ug = (Tc = class extends $o {
  constructor(t = {}) {
    super();
    F(this, Nt);
    F(this, ot);
    F(this, To);
    this.config = t, j(this, Nt, /* @__PURE__ */ new Set()), j(this, ot, /* @__PURE__ */ new Map()), j(this, To, 0);
  }
  build(t, r, n) {
    const o = new sg({
      client: t,
      mutationCache: this,
      mutationId: ++Uo(this, To)._,
      options: t.defaultMutationOptions(r),
      state: n
    });
    return this.add(o), o;
  }
  add(t) {
    f(this, Nt).add(t);
    const r = ii(t);
    if (typeof r == "string") {
      const n = f(this, ot).get(r);
      n ? n.push(t) : f(this, ot).set(r, [t]);
    }
    this.notify({ type: "added", mutation: t });
  }
  remove(t) {
    if (f(this, Nt).delete(t)) {
      const r = ii(t);
      if (typeof r == "string") {
        const n = f(this, ot).get(r);
        if (n)
          if (n.length > 1) {
            const o = n.indexOf(t);
            o !== -1 && n.splice(o, 1);
          } else n[0] === t && f(this, ot).delete(r);
      }
    }
    this.notify({ type: "removed", mutation: t });
  }
  canRun(t) {
    const r = ii(t);
    if (typeof r == "string") {
      const o = f(this, ot).get(r)?.find(
        (i) => i.state.status === "pending"
      );
      return !o || o === t;
    } else
      return !0;
  }
  runNext(t) {
    const r = ii(t);
    return typeof r == "string" ? f(this, ot).get(r)?.find((o) => o !== t && o.state.isPaused)?.continue() ?? Promise.resolve() : Promise.resolve();
  }
  clear() {
    ve.batch(() => {
      f(this, Nt).forEach((t) => {
        this.notify({ type: "removed", mutation: t });
      }), f(this, Nt).clear(), f(this, ot).clear();
    });
  }
  getAll() {
    return Array.from(f(this, Nt));
  }
  find(t) {
    const r = { exact: !0, ...t };
    return this.getAll().find(
      (n) => ic(r, n)
    );
  }
  findAll(t = {}) {
    return this.getAll().filter((r) => ic(t, r));
  }
  notify(t) {
    ve.batch(() => {
      this.listeners.forEach((r) => {
        r(t);
      });
    });
  }
  resumePausedMutations() {
    const t = this.getAll().filter((r) => r.state.isPaused);
    return ve.batch(
      () => Promise.all(
        t.map((r) => r.continue().catch(Te))
      )
    );
  }
}, Nt = new WeakMap(), ot = new WeakMap(), To = new WeakMap(), Tc);
function ii(e) {
  return e.options.scope?.id;
}
var mt, Fc, cg = (Fc = class extends $o {
  constructor(t = {}) {
    super();
    F(this, mt);
    this.config = t, j(this, mt, /* @__PURE__ */ new Map());
  }
  build(t, r, n) {
    const o = r.queryKey, i = r.queryHash ?? Ua(o, r);
    let l = this.get(i);
    return l || (l = new ng({
      client: t,
      queryKey: o,
      queryHash: i,
      options: t.defaultQueryOptions(r),
      state: n,
      defaultOptions: t.getQueryDefaults(o)
    }), this.add(l)), l;
  }
  add(t) {
    f(this, mt).has(t.queryHash) || (f(this, mt).set(t.queryHash, t), this.notify({
      type: "added",
      query: t
    }));
  }
  remove(t) {
    const r = f(this, mt).get(t.queryHash);
    r && (t.destroy(), r === t && f(this, mt).delete(t.queryHash), this.notify({ type: "removed", query: t }));
  }
  clear() {
    ve.batch(() => {
      this.getAll().forEach((t) => {
        this.remove(t);
      });
    });
  }
  get(t) {
    return f(this, mt).get(t);
  }
  getAll() {
    return [...f(this, mt).values()];
  }
  find(t) {
    const r = { exact: !0, ...t };
    return this.getAll().find(
      (n) => oc(r, n)
    );
  }
  findAll(t = {}) {
    const r = this.getAll();
    return Object.keys(t).length > 0 ? r.filter((n) => oc(t, n)) : r;
  }
  notify(t) {
    ve.batch(() => {
      this.listeners.forEach((r) => {
        r(t);
      });
    });
  }
  onFocus() {
    ve.batch(() => {
      this.getAll().forEach((t) => {
        t.onFocus();
      });
    });
  }
  onOnline() {
    ve.batch(() => {
      this.getAll().forEach((t) => {
        t.onOnline();
      });
    });
  }
}, mt = new WeakMap(), Fc), ie, Xt, Zt, bn, Sn, Jt, Cn, En, Oc, dg = (Oc = class {
  constructor(e = {}) {
    F(this, ie);
    F(this, Xt);
    F(this, Zt);
    F(this, bn);
    F(this, Sn);
    F(this, Jt);
    F(this, Cn);
    F(this, En);
    j(this, ie, e.queryCache || new cg()), j(this, Xt, e.mutationCache || new ug()), j(this, Zt, e.defaultOptions || {}), j(this, bn, /* @__PURE__ */ new Map()), j(this, Sn, /* @__PURE__ */ new Map()), j(this, Jt, 0);
  }
  mount() {
    Uo(this, Jt)._++, f(this, Jt) === 1 && (j(this, Cn, Aa.subscribe(async (e) => {
      e && (await this.resumePausedMutations(), f(this, ie).onFocus());
    })), j(this, En, Vi.subscribe(async (e) => {
      e && (await this.resumePausedMutations(), f(this, ie).onOnline());
    })));
  }
  unmount() {
    var e, t;
    Uo(this, Jt)._--, f(this, Jt) === 0 && ((e = f(this, Cn)) == null || e.call(this), j(this, Cn, void 0), (t = f(this, En)) == null || t.call(this), j(this, En, void 0));
  }
  isFetching(e) {
    return f(this, ie).findAll({ ...e, fetchStatus: "fetching" }).length;
  }
  isMutating(e) {
    return f(this, Xt).findAll({ ...e, status: "pending" }).length;
  }
  /**
   * Imperative (non-reactive) way to retrieve data for a QueryKey.
   * Should only be used in callbacks or functions where reading the latest data is necessary, e.g. for optimistic updates.
   *
   * Hint: Do not use this function inside a component, because it won't receive updates.
   * Use `useQuery` to create a `QueryObserver` that subscribes to changes.
   */
  getQueryData(e) {
    const t = this.defaultQueryOptions({ queryKey: e });
    return f(this, ie).get(t.queryHash)?.state.data;
  }
  ensureQueryData(e) {
    const t = this.defaultQueryOptions(e), r = f(this, ie).build(this, t), n = r.state.data;
    return n === void 0 ? this.fetchQuery(e) : (e.revalidateIfStale && r.isStaleByTime(cr(t.staleTime, r)) && this.prefetchQuery(t), Promise.resolve(n));
  }
  getQueriesData(e) {
    return f(this, ie).findAll(e).map(({ queryKey: t, state: r }) => {
      const n = r.data;
      return [t, n];
    });
  }
  setQueryData(e, t, r) {
    const n = this.defaultQueryOptions({ queryKey: e }), i = f(this, ie).get(
      n.queryHash
    )?.state.data, l = Wm(t, i);
    if (l !== void 0)
      return f(this, ie).build(this, n).setData(l, { ...r, manual: !0 });
  }
  setQueriesData(e, t, r) {
    return ve.batch(
      () => f(this, ie).findAll(e).map(({ queryKey: n }) => [
        n,
        this.setQueryData(n, t, r)
      ])
    );
  }
  getQueryState(e) {
    const t = this.defaultQueryOptions({ queryKey: e });
    return f(this, ie).get(
      t.queryHash
    )?.state;
  }
  removeQueries(e) {
    const t = f(this, ie);
    ve.batch(() => {
      t.findAll(e).forEach((r) => {
        t.remove(r);
      });
    });
  }
  resetQueries(e, t) {
    const r = f(this, ie);
    return ve.batch(() => (r.findAll(e).forEach((n) => {
      n.reset();
    }), this.refetchQueries(
      {
        type: "active",
        ...e
      },
      t
    )));
  }
  cancelQueries(e, t = {}) {
    const r = { revert: !0, ...t }, n = ve.batch(
      () => f(this, ie).findAll(e).map((o) => o.cancel(r))
    );
    return Promise.all(n).then(Te).catch(Te);
  }
  invalidateQueries(e, t = {}) {
    return ve.batch(() => (f(this, ie).findAll(e).forEach((r) => {
      r.invalidate();
    }), e?.refetchType === "none" ? Promise.resolve() : this.refetchQueries(
      {
        ...e,
        type: e?.refetchType ?? e?.type ?? "active"
      },
      t
    )));
  }
  refetchQueries(e, t = {}) {
    const r = {
      ...t,
      cancelRefetch: t.cancelRefetch ?? !0
    }, n = ve.batch(
      () => f(this, ie).findAll(e).filter((o) => !o.isDisabled() && !o.isStatic()).map((o) => {
        let i = o.fetch(void 0, r);
        return r.throwOnError || (i = i.catch(Te)), o.state.fetchStatus === "paused" ? Promise.resolve() : i;
      })
    );
    return Promise.all(n).then(Te);
  }
  fetchQuery(e) {
    const t = this.defaultQueryOptions(e);
    t.retry === void 0 && (t.retry = !1);
    const r = f(this, ie).build(this, t);
    return r.isStaleByTime(
      cr(t.staleTime, r)
    ) ? r.fetch(t) : Promise.resolve(r.state.data);
  }
  prefetchQuery(e) {
    return this.fetchQuery(e).then(Te).catch(Te);
  }
  fetchInfiniteQuery(e) {
    return e._type = "infinite", this.fetchQuery(e);
  }
  prefetchInfiniteQuery(e) {
    return this.fetchInfiniteQuery(e).then(Te).catch(Te);
  }
  ensureInfiniteQueryData(e) {
    return e._type = "infinite", this.ensureQueryData(e);
  }
  resumePausedMutations() {
    return Vi.isOnline() ? f(this, Xt).resumePausedMutations() : Promise.resolve();
  }
  getQueryCache() {
    return f(this, ie);
  }
  getMutationCache() {
    return f(this, Xt);
  }
  getDefaultOptions() {
    return f(this, Zt);
  }
  setDefaultOptions(e) {
    j(this, Zt, e);
  }
  setQueryDefaults(e, t) {
    f(this, bn).set(No(e), {
      queryKey: e,
      defaultOptions: t
    });
  }
  getQueryDefaults(e) {
    const t = [...f(this, bn).values()], r = {};
    return t.forEach((n) => {
      jo(e, n.queryKey) && Object.assign(r, n.defaultOptions);
    }), r;
  }
  setMutationDefaults(e, t) {
    f(this, Sn).set(No(e), {
      mutationKey: e,
      defaultOptions: t
    });
  }
  getMutationDefaults(e) {
    const t = [...f(this, Sn).values()], r = {};
    return t.forEach((n) => {
      jo(e, n.mutationKey) && Object.assign(r, n.defaultOptions);
    }), r;
  }
  defaultQueryOptions(e) {
    if (e._defaulted)
      return e;
    const t = {
      ...f(this, Zt).queries,
      ...this.getQueryDefaults(e.queryKey),
      ...e,
      _defaulted: !0
    };
    return t.queryHash || (t.queryHash = Ua(
      t.queryKey,
      t
    )), t.refetchOnReconnect === void 0 && (t.refetchOnReconnect = t.networkMode !== "always"), t.throwOnError === void 0 && (t.throwOnError = !!t.suspense), !t.networkMode && t.persister && (t.networkMode = "offlineFirst"), t.queryFn === Qa && (t.enabled = !1), t;
  }
  defaultMutationOptions(e) {
    return e?._defaulted ? e : {
      ...f(this, Zt).mutations,
      ...e?.mutationKey && this.getMutationDefaults(e.mutationKey),
      ...e,
      _defaulted: !0
    };
  }
  clear() {
    f(this, ie).clear(), f(this, Xt).clear();
  }
}, ie = new WeakMap(), Xt = new WeakMap(), Zt = new WeakMap(), bn = new WeakMap(), Sn = new WeakMap(), Jt = new WeakMap(), Cn = new WeakMap(), En = new WeakMap(), Oc), ip = { exports: {} }, al = {};
/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var fg = I, pg = Symbol.for("react.element"), hg = Symbol.for("react.fragment"), mg = Object.prototype.hasOwnProperty, gg = fg.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner, vg = { key: !0, ref: !0, __self: !0, __source: !0 };
function lp(e, t, r) {
  var n, o = {}, i = null, l = null;
  r !== void 0 && (i = "" + r), t.key !== void 0 && (i = "" + t.key), t.ref !== void 0 && (l = t.ref);
  for (n in t) mg.call(t, n) && !vg.hasOwnProperty(n) && (o[n] = t[n]);
  if (e && e.defaultProps) for (n in t = e.defaultProps, t) o[n] === void 0 && (o[n] = t[n]);
  return { $$typeof: pg, type: e, key: i, ref: l, props: o, _owner: gg.current };
}
al.Fragment = hg;
al.jsx = lp;
al.jsxs = lp;
ip.exports = al;
var c = ip.exports, sp = I.createContext(
  void 0
), yg = (e) => {
  const t = I.useContext(sp);
  if (!t)
    throw new Error("No QueryClient set, use QueryClientProvider to set one");
  return t;
}, xg = ({
  client: e,
  children: t
}) => (I.useEffect(() => (e.mount(), () => {
  e.unmount();
}), [e]), /* @__PURE__ */ c.jsx(sp.Provider, { value: e, children: t })), ap = I.createContext(!1), wg = () => I.useContext(ap);
ap.Provider;
function kg() {
  let e = !1;
  return {
    clearReset: () => {
      e = !1;
    },
    reset: () => {
      e = !0;
    },
    isReset: () => e
  };
}
var bg = I.createContext(kg()), Sg = () => I.useContext(bg), Cg = (e, t, r) => {
  const n = r?.state.error && typeof e.throwOnError == "function" ? Zf(e.throwOnError, [r.state.error, r]) : e.throwOnError;
  (e.suspense || e.experimental_prefetchInRender || n) && (t.isReset() || (e.retryOnMount = !1));
}, Eg = (e) => {
  I.useEffect(() => {
    e.clearReset();
  }, [e]);
}, Ng = ({
  result: e,
  errorResetBoundary: t,
  throwOnError: r,
  query: n,
  suspense: o
}) => e.isError && !t.isReset() && !e.isFetching && n && (o && e.data === void 0 || Zf(r, [e.error, n])), jg = (e) => {
  if (e.suspense) {
    const r = (o) => o === "static" ? o : Math.max(o ?? 1e3, 1e3), n = e.staleTime;
    e.staleTime = typeof n == "function" ? (...o) => r(n(...o)) : r(n), typeof e.gcTime == "number" && (e.gcTime = Math.max(
      e.gcTime,
      1e3
    ));
  }
}, _g = (e, t) => e.isLoading && e.isFetching && !t, Pg = (e, t) => e?.suspense && t.isPending, pc = (e, t, r) => t.fetchOptimistic(e).catch(() => {
  r.clearReset();
});
function zg(e, t, r) {
  const n = wg(), o = Sg(), i = yg(), l = i.defaultQueryOptions(e);
  i.getDefaultOptions().queries?._experimental_beforeQuery?.(
    l
  );
  const s = i.getQueryCache().get(l.queryHash);
  l._optimisticResults = n ? "isRestoring" : "optimistic", jg(l), Cg(l, o, s), Eg(o);
  const a = !i.getQueryCache().get(l.queryHash), [u] = I.useState(
    () => new t(
      i,
      l
    )
  ), g = u.getOptimisticResult(l), h = !n && e.subscribed !== !1;
  if (I.useSyncExternalStore(
    I.useCallback(
      (v) => {
        const y = h ? u.subscribe(ve.batchCalls(v)) : Te;
        return u.updateResult(), y;
      },
      [u, h]
    ),
    () => u.getCurrentResult(),
    () => u.getCurrentResult()
  ), I.useEffect(() => {
    u.setOptions(l);
  }, [l, u]), Pg(l, g))
    throw pc(l, u, o);
  if (Ng({
    result: g,
    errorResetBoundary: o,
    throwOnError: l.throwOnError,
    query: s,
    suspense: l.suspense
  }))
    throw g.error;
  return i.getDefaultOptions().queries?._experimental_afterQuery?.(
    l,
    g
  ), l.experimental_prefetchInRender && !_o.isServer() && _g(g, n) && (a ? (
    // Fetch immediately on render in order to ensure `.promise` is resolved even if the component is unmounted
    pc(l, u, o)
  ) : (
    // subscribe to the "cache promise" so that we can finalize the currentThenable once data comes in
    s?.promise
  ))?.catch(Te).finally(() => {
    u.updateResult();
  }), l.notifyOnChangeProps ? g : u.trackResult(g);
}
function Ha(e, t) {
  return zg(e, og);
}
const Mg = '*,:before,:after{--tw-border-spacing-x: 0;--tw-border-spacing-y: 0;--tw-translate-x: 0;--tw-translate-y: 0;--tw-rotate: 0;--tw-skew-x: 0;--tw-skew-y: 0;--tw-scale-x: 1;--tw-scale-y: 1;--tw-pan-x: ;--tw-pan-y: ;--tw-pinch-zoom: ;--tw-scroll-snap-strictness: proximity;--tw-gradient-from-position: ;--tw-gradient-via-position: ;--tw-gradient-to-position: ;--tw-ordinal: ;--tw-slashed-zero: ;--tw-numeric-figure: ;--tw-numeric-spacing: ;--tw-numeric-fraction: ;--tw-ring-inset: ;--tw-ring-offset-width: 0px;--tw-ring-offset-color: #fff;--tw-ring-color: rgb(59 130 246 / .5);--tw-ring-offset-shadow: 0 0 #0000;--tw-ring-shadow: 0 0 #0000;--tw-shadow: 0 0 #0000;--tw-shadow-colored: 0 0 #0000;--tw-blur: ;--tw-brightness: ;--tw-contrast: ;--tw-grayscale: ;--tw-hue-rotate: ;--tw-invert: ;--tw-saturate: ;--tw-sepia: ;--tw-drop-shadow: ;--tw-backdrop-blur: ;--tw-backdrop-brightness: ;--tw-backdrop-contrast: ;--tw-backdrop-grayscale: ;--tw-backdrop-hue-rotate: ;--tw-backdrop-invert: ;--tw-backdrop-opacity: ;--tw-backdrop-saturate: ;--tw-backdrop-sepia: ;--tw-contain-size: ;--tw-contain-layout: ;--tw-contain-paint: ;--tw-contain-style: }::backdrop{--tw-border-spacing-x: 0;--tw-border-spacing-y: 0;--tw-translate-x: 0;--tw-translate-y: 0;--tw-rotate: 0;--tw-skew-x: 0;--tw-skew-y: 0;--tw-scale-x: 1;--tw-scale-y: 1;--tw-pan-x: ;--tw-pan-y: ;--tw-pinch-zoom: ;--tw-scroll-snap-strictness: proximity;--tw-gradient-from-position: ;--tw-gradient-via-position: ;--tw-gradient-to-position: ;--tw-ordinal: ;--tw-slashed-zero: ;--tw-numeric-figure: ;--tw-numeric-spacing: ;--tw-numeric-fraction: ;--tw-ring-inset: ;--tw-ring-offset-width: 0px;--tw-ring-offset-color: #fff;--tw-ring-color: rgb(59 130 246 / .5);--tw-ring-offset-shadow: 0 0 #0000;--tw-ring-shadow: 0 0 #0000;--tw-shadow: 0 0 #0000;--tw-shadow-colored: 0 0 #0000;--tw-blur: ;--tw-brightness: ;--tw-contrast: ;--tw-grayscale: ;--tw-hue-rotate: ;--tw-invert: ;--tw-saturate: ;--tw-sepia: ;--tw-drop-shadow: ;--tw-backdrop-blur: ;--tw-backdrop-brightness: ;--tw-backdrop-contrast: ;--tw-backdrop-grayscale: ;--tw-backdrop-hue-rotate: ;--tw-backdrop-invert: ;--tw-backdrop-opacity: ;--tw-backdrop-saturate: ;--tw-backdrop-sepia: ;--tw-contain-size: ;--tw-contain-layout: ;--tw-contain-paint: ;--tw-contain-style: }*,:before,:after{box-sizing:border-box;border-width:0;border-style:solid;border-color:#e5e7eb}:before,:after{--tw-content: ""}html,:host{line-height:1.5;-webkit-text-size-adjust:100%;-moz-tab-size:4;-o-tab-size:4;tab-size:4;font-family:Inter,HarmonyOS Sans SC,PingFang SC,system-ui,sans-serif;font-feature-settings:normal;font-variation-settings:normal;-webkit-tap-highlight-color:transparent}body{margin:0;line-height:inherit}hr{height:0;color:inherit;border-top-width:1px}abbr:where([title]){-webkit-text-decoration:underline dotted;text-decoration:underline dotted}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}a{color:inherit;text-decoration:inherit}b,strong{font-weight:bolder}code,kbd,samp,pre{font-family:JetBrains Mono,IBM Plex Mono,ui-monospace,monospace;font-feature-settings:normal;font-variation-settings:normal;font-size:1em}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-.25em}sup{top:-.5em}table{text-indent:0;border-color:inherit;border-collapse:collapse}button,input,optgroup,select,textarea{font-family:inherit;font-feature-settings:inherit;font-variation-settings:inherit;font-size:100%;font-weight:inherit;line-height:inherit;letter-spacing:inherit;color:inherit;margin:0;padding:0}button,select{text-transform:none}button,input:where([type=button]),input:where([type=reset]),input:where([type=submit]){-webkit-appearance:button;background-color:transparent;background-image:none}:-moz-focusring{outline:auto}:-moz-ui-invalid{box-shadow:none}progress{vertical-align:baseline}::-webkit-inner-spin-button,::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}summary{display:list-item}blockquote,dl,dd,h1,h2,h3,h4,h5,h6,hr,figure,p,pre{margin:0}fieldset{margin:0;padding:0}legend{padding:0}ol,ul,menu{list-style:none;margin:0;padding:0}dialog{padding:0}textarea{resize:vertical}input::-moz-placeholder,textarea::-moz-placeholder{opacity:1;color:#9ca3af}input::placeholder,textarea::placeholder{opacity:1;color:#9ca3af}button,[role=button]{cursor:pointer}:disabled{cursor:default}img,svg,video,canvas,audio,iframe,embed,object{display:block;vertical-align:middle}img,video{max-width:100%;height:auto}[hidden]:where(:not([hidden=until-found])){display:none}.container{width:100%;margin-right:auto;margin-left:auto;padding-right:1rem;padding-left:1rem}@media (min-width: 640px){.container{max-width:640px}}@media (min-width: 768px){.container{max-width:768px}}@media (min-width: 1024px){.container{max-width:1024px}}@media (min-width: 1280px){.container{max-width:1280px}}@media (min-width: 1536px){.container{max-width:1536px}}.pointer-events-none{pointer-events:none}.visible{visibility:visible}.fixed{position:fixed}.absolute{position:absolute}.relative{position:relative}.sticky{position:sticky}.left-0{left:0}.top-0{top:0}.z-10{z-index:10}.z-\\[70\\]{z-index:70}.mb-1{margin-bottom:.25rem}.mb-1\\.5{margin-bottom:.375rem}.mb-2{margin-bottom:.5rem}.mr-0\\.5{margin-right:.125rem}.mt-0\\.5{margin-top:.125rem}.mt-1{margin-top:.25rem}.mt-1\\.5{margin-top:.375rem}.mt-2{margin-top:.5rem}.mt-auto{margin-top:auto}.block{display:block}.inline{display:inline}.flex{display:flex}.inline-flex{display:inline-flex}.table{display:table}.grid{display:grid}.hidden{display:none}.h-1{height:.25rem}.h-1\\.5{height:.375rem}.h-2\\.5{height:.625rem}.h-24{height:6rem}.h-3{height:.75rem}.h-3\\.5{height:.875rem}.h-4{height:1rem}.h-\\[20rem\\]{height:20rem}.h-full{height:100%}.max-h-\\[15\\.5rem\\]{max-height:15.5rem}.max-h-\\[18rem\\]{max-height:18rem}.max-h-\\[22rem\\]{max-height:22rem}.min-h-0{min-height:0px}.min-h-\\[5\\.5rem\\]{min-height:5.5rem}.min-h-\\[9rem\\]{min-height:9rem}.w-0\\.5{width:.125rem}.w-1{width:.25rem}.w-12{width:3rem}.w-2{width:.5rem}.w-2\\.5{width:.625rem}.w-3{width:.75rem}.w-3\\.5{width:.875rem}.w-4{width:1rem}.w-fit{width:-moz-fit-content;width:fit-content}.w-full{width:100%}.min-w-0{min-width:0px}.min-w-\\[180px\\]{min-width:180px}.min-w-\\[74px\\]{min-width:74px}.min-w-max{min-width:-moz-max-content;min-width:max-content}.max-w-\\[4\\.5rem\\]{max-width:4.5rem}.max-w-\\[6rem\\]{max-width:6rem}.max-w-full{max-width:100%}.flex-1{flex:1 1 0%}.shrink-0{flex-shrink:0}.border-collapse{border-collapse:collapse}@keyframes spin{to{transform:rotate(360deg)}}.animate-spin{animation:spin 1s linear infinite}.cursor-pointer{cursor:pointer}.appearance-none{-webkit-appearance:none;-moz-appearance:none;appearance:none}.auto-rows-fr{grid-auto-rows:minmax(0,1fr)}.grid-cols-1{grid-template-columns:repeat(1,minmax(0,1fr))}.grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}.grid-cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}.grid-cols-4{grid-template-columns:repeat(4,minmax(0,1fr))}.grid-cols-6{grid-template-columns:repeat(6,minmax(0,1fr))}.grid-cols-8{grid-template-columns:repeat(8,minmax(0,1fr))}.grid-cols-\\[1fr_auto\\]{grid-template-columns:1fr auto}.grid-cols-\\[42px_1fr_auto\\]{grid-template-columns:42px 1fr auto}.flex-col{flex-direction:column}.flex-wrap{flex-wrap:wrap}.items-end{align-items:flex-end}.items-center{align-items:center}.justify-end{justify-content:flex-end}.justify-center{justify-content:center}.justify-between{justify-content:space-between}.gap-0\\.5{gap:.125rem}.gap-1{gap:.25rem}.gap-1\\.5{gap:.375rem}.gap-2{gap:.5rem}.gap-3{gap:.75rem}.gap-x-2{-moz-column-gap:.5rem;column-gap:.5rem}.gap-y-0\\.5{row-gap:.125rem}.space-y-1\\.5>:not([hidden])~:not([hidden]){--tw-space-y-reverse: 0;margin-top:calc(.375rem * calc(1 - var(--tw-space-y-reverse)));margin-bottom:calc(.375rem * var(--tw-space-y-reverse))}.space-y-2>:not([hidden])~:not([hidden]){--tw-space-y-reverse: 0;margin-top:calc(.5rem * calc(1 - var(--tw-space-y-reverse)));margin-bottom:calc(.5rem * var(--tw-space-y-reverse))}.overflow-auto{overflow:auto}.overflow-hidden{overflow:hidden}.overflow-x-auto{overflow-x:auto}.overflow-y-auto{overflow-y:auto}.overflow-y-visible{overflow-y:visible}.truncate{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.whitespace-nowrap{white-space:nowrap}.rounded{border-radius:.25rem}.rounded-btn{border-radius:6px}.rounded-card{border-radius:8px}.rounded-full{border-radius:9999px}.rounded-lg{border-radius:.5rem}.rounded-md{border-radius:.375rem}.border{border-width:1px}.border-y{border-top-width:1px;border-bottom-width:1px}.border-r{border-right-width:1px}.border-dashed{border-style:dashed}.border-accent\\/40{border-color:hsl(var(--accent) / .4)}.border-accent\\/45{border-color:hsl(var(--accent) / .45)}.border-bear\\/30{border-color:hsl(var(--bear) / .3)}.border-border{--tw-border-opacity: 1;border-color:hsl(var(--border) / var(--tw-border-opacity, 1))}.border-border\\/40{border-color:hsl(var(--border) / .4)}.border-border\\/60{border-color:hsl(var(--border) / .6)}.border-bull\\/30{border-color:hsl(var(--bull) / .3)}.border-danger\\/35{border-color:hsl(var(--danger) / .35)}.border-danger\\/45{border-color:hsl(var(--danger) / .45)}.border-danger\\/50{border-color:hsl(var(--danger) / .5)}.border-warning\\/35{border-color:hsl(var(--warning) / .35)}.border-r-border\\/40{border-right-color:hsl(var(--border) / .4)}.bg-accent\\/10{background-color:hsl(var(--accent) / .1)}.bg-accent\\/15{background-color:hsl(var(--accent) / .15)}.bg-accent\\/40{background-color:hsl(var(--accent) / .4)}.bg-base{--tw-bg-opacity: 1;background-color:hsl(var(--base) / var(--tw-bg-opacity, 1))}.bg-base\\/30{background-color:hsl(var(--base) / .3)}.bg-bear\\/10{background-color:hsl(var(--bear) / .1)}.bg-bear\\/85{background-color:hsl(var(--bear) / .85)}.bg-border\\/70{background-color:hsl(var(--border) / .7)}.bg-bull\\/10{background-color:hsl(var(--bull) / .1)}.bg-bull\\/70{background-color:hsl(var(--bull) / .7)}.bg-bull\\/85{background-color:hsl(var(--bull) / .85)}.bg-danger{--tw-bg-opacity: 1;background-color:hsl(var(--danger) / var(--tw-bg-opacity, 1))}.bg-danger\\/10{background-color:hsl(var(--danger) / .1)}.bg-danger\\/15{background-color:hsl(var(--danger) / .15)}.bg-elevated{--tw-bg-opacity: 1;background-color:hsl(var(--elevated) / var(--tw-bg-opacity, 1))}.bg-elevated\\/30{background-color:hsl(var(--elevated) / .3)}.bg-elevated\\/35{background-color:hsl(var(--elevated) / .35)}.bg-elevated\\/40{background-color:hsl(var(--elevated) / .4)}.bg-elevated\\/45{background-color:hsl(var(--elevated) / .45)}.bg-elevated\\/50{background-color:hsl(var(--elevated) / .5)}.bg-elevated\\/55{background-color:hsl(var(--elevated) / .55)}.bg-elevated\\/70{background-color:hsl(var(--elevated) / .7)}.bg-muted\\/45{background-color:hsl(var(--fg-muted) / .45)}.bg-surface{--tw-bg-opacity: 1;background-color:hsl(var(--surface) / var(--tw-bg-opacity, 1))}.bg-surface\\/60{background-color:hsl(var(--surface) / .6)}.bg-surface\\/80{background-color:hsl(var(--surface) / .8)}.bg-surface\\/95{background-color:hsl(var(--surface) / .95)}.bg-warning{--tw-bg-opacity: 1;background-color:hsl(var(--warning) / var(--tw-bg-opacity, 1))}.bg-warning\\/10{background-color:hsl(var(--warning) / .1)}.bg-gradient-to-b{background-image:linear-gradient(to bottom,var(--tw-gradient-stops))}.bg-gradient-to-r{background-image:linear-gradient(to right,var(--tw-gradient-stops))}.bg-gradient-to-t{background-image:linear-gradient(to top,var(--tw-gradient-stops))}.from-accent{--tw-gradient-from: hsl(var(--accent) / 1) var(--tw-gradient-from-position);--tw-gradient-to: hsl(var(--accent) / 0) var(--tw-gradient-to-position);--tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to)}.from-bear\\/45{--tw-gradient-from: hsl(var(--bear) / .45) var(--tw-gradient-from-position);--tw-gradient-to: hsl(var(--bear) / 0) var(--tw-gradient-to-position);--tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to)}.from-bull\\/45{--tw-gradient-from: hsl(var(--bull) / .45) var(--tw-gradient-from-position);--tw-gradient-to: hsl(var(--bull) / 0) var(--tw-gradient-to-position);--tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to)}.from-surface\\/90{--tw-gradient-from: hsl(var(--surface) / .9) var(--tw-gradient-from-position);--tw-gradient-to: hsl(var(--surface) / 0) var(--tw-gradient-to-position);--tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to)}.to-accent\\/20{--tw-gradient-to: hsl(var(--accent) / .2) var(--tw-gradient-to-position)}.to-accent\\/30{--tw-gradient-to: hsl(var(--accent) / .3) var(--tw-gradient-to-position)}.to-bear\\/90{--tw-gradient-to: hsl(var(--bear) / .9) var(--tw-gradient-to-position)}.to-bull\\/90{--tw-gradient-to: hsl(var(--bull) / .9) var(--tw-gradient-to-position)}.to-surface\\/70{--tw-gradient-to: hsl(var(--surface) / .7) var(--tw-gradient-to-position)}.fill-foreground{fill:hsl(var(--fg-primary) / 1)}.fill-secondary{fill:hsl(var(--fg-secondary) / 1)}.p-0\\.5{padding:.125rem}.p-1\\.5{padding:.375rem}.p-2{padding:.5rem}.px-0\\.5{padding-left:.125rem;padding-right:.125rem}.px-1{padding-left:.25rem;padding-right:.25rem}.px-1\\.5{padding-left:.375rem;padding-right:.375rem}.px-2{padding-left:.5rem;padding-right:.5rem}.px-2\\.5{padding-left:.625rem;padding-right:.625rem}.px-3{padding-left:.75rem;padding-right:.75rem}.py-0\\.5{padding-top:.125rem;padding-bottom:.125rem}.py-1{padding-top:.25rem;padding-bottom:.25rem}.py-1\\.5{padding-top:.375rem;padding-bottom:.375rem}.py-2{padding-top:.5rem;padding-bottom:.5rem}.py-5{padding-top:1.25rem;padding-bottom:1.25rem}.py-6{padding-top:1.5rem;padding-bottom:1.5rem}.py-px{padding-top:1px;padding-bottom:1px}.pl-2\\.5{padding-left:.625rem}.pl-\\[50px\\]{padding-left:50px}.pr-0\\.5{padding-right:.125rem}.pr-2{padding-right:.5rem}.pt-1{padding-top:.25rem}.text-center{text-align:center}.text-right{text-align:right}.align-top{vertical-align:top}.font-mono{font-family:JetBrains Mono,IBM Plex Mono,ui-monospace,monospace}.text-\\[10px\\]{font-size:10px}.text-\\[11px\\]{font-size:11px}.text-\\[24px\\]{font-size:24px}.text-\\[8px\\]{font-size:8px}.text-\\[9px\\]{font-size:9px}.text-base{font-size:1rem;line-height:1.5rem}.text-lg{font-size:1.125rem;line-height:1.75rem}.text-sm{font-size:.875rem;line-height:1.25rem}.text-xs{font-size:.75rem;line-height:1rem}.font-bold{font-weight:700}.font-medium{font-weight:500}.font-semibold{font-weight:600}.tabular-nums{--tw-numeric-spacing: tabular-nums;font-variant-numeric:var(--tw-ordinal) var(--tw-slashed-zero) var(--tw-numeric-figure) var(--tw-numeric-spacing) var(--tw-numeric-fraction)}.leading-4{line-height:1rem}.leading-\\[1\\.3\\]{line-height:1.3}.leading-none{line-height:1}.text-accent{--tw-text-opacity: 1;color:hsl(var(--accent) / var(--tw-text-opacity, 1))}.text-base{--tw-text-opacity: 1;color:hsl(var(--base) / var(--tw-text-opacity, 1))}.text-bear{--tw-text-opacity: 1;color:hsl(var(--bear) / var(--tw-text-opacity, 1))}.text-bull{--tw-text-opacity: 1;color:hsl(var(--bull) / var(--tw-text-opacity, 1))}.text-danger{--tw-text-opacity: 1;color:hsl(var(--danger) / var(--tw-text-opacity, 1))}.text-danger\\/85{color:hsl(var(--danger) / .85)}.text-foreground{--tw-text-opacity: 1;color:hsl(var(--fg-primary) / var(--tw-text-opacity, 1))}.text-foreground\\/60{color:hsl(var(--fg-primary) / .6)}.text-foreground\\/80{color:hsl(var(--fg-primary) / .8)}.text-foreground\\/90{color:hsl(var(--fg-primary) / .9)}.text-muted{--tw-text-opacity: 1;color:hsl(var(--fg-muted) / var(--tw-text-opacity, 1))}.text-secondary{--tw-text-opacity: 1;color:hsl(var(--fg-secondary) / var(--tw-text-opacity, 1))}.text-warning{--tw-text-opacity: 1;color:hsl(var(--warning) / var(--tw-text-opacity, 1))}.opacity-\\[0\\.12\\]{opacity:.12}.shadow{--tw-shadow: 0 1px 3px 0 rgb(0 0 0 / .1), 0 1px 2px -1px rgb(0 0 0 / .1);--tw-shadow-colored: 0 1px 3px 0 var(--tw-shadow-color), 0 1px 2px -1px var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000),var(--tw-ring-shadow, 0 0 #0000),var(--tw-shadow)}.shadow-\\[0_1px_1px_hsl\\(var\\(--border\\)\\/0\\.3\\)\\]{--tw-shadow: 0 1px 1px hsl(var(--border)/.3);--tw-shadow-colored: 0 1px 1px var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000),var(--tw-ring-shadow, 0 0 #0000),var(--tw-shadow)}.shadow-\\[0_1px_2px_hsl\\(var\\(--border\\)\\/0\\.4\\)\\]{--tw-shadow: 0 1px 2px hsl(var(--border)/.4);--tw-shadow-colored: 0 1px 2px var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000),var(--tw-ring-shadow, 0 0 #0000),var(--tw-shadow)}.shadow-\\[0_1px_3px_hsl\\(var\\(--border\\)\\/0\\.4\\)\\]{--tw-shadow: 0 1px 3px hsl(var(--border)/.4);--tw-shadow-colored: 0 1px 3px var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000),var(--tw-ring-shadow, 0 0 #0000),var(--tw-shadow)}.shadow-\\[0_4px_20px_hsl\\(var\\(--border\\)\\/0\\.5\\)\\]{--tw-shadow: 0 4px 20px hsl(var(--border)/.5);--tw-shadow-colored: 0 4px 20px var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000),var(--tw-ring-shadow, 0 0 #0000),var(--tw-shadow)}.filter{filter:var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow)}.backdrop-blur{--tw-backdrop-blur: blur(8px);backdrop-filter:var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia)}.backdrop-blur-sm{--tw-backdrop-blur: blur(4px);backdrop-filter:var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia)}.backdrop-filter{backdrop-filter:var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia)}.transition-all{transition-property:all;transition-timing-function:cubic-bezier(.4,0,.2,1);transition-duration:.15s}.transition-colors{transition-property:color,background-color,border-color,text-decoration-color,fill,stroke;transition-timing-function:cubic-bezier(.4,0,.2,1);transition-duration:.15s}.transition-opacity{transition-property:opacity;transition-timing-function:cubic-bezier(.4,0,.2,1);transition-duration:.15s}@keyframes enter{0%{opacity:var(--tw-enter-opacity, 1);transform:translate3d(var(--tw-enter-translate-x, 0),var(--tw-enter-translate-y, 0),0) scale3d(var(--tw-enter-scale, 1),var(--tw-enter-scale, 1),var(--tw-enter-scale, 1)) rotate(var(--tw-enter-rotate, 0))}}@keyframes exit{to{opacity:var(--tw-exit-opacity, 1);transform:translate3d(var(--tw-exit-translate-x, 0),var(--tw-exit-translate-y, 0),0) scale3d(var(--tw-exit-scale, 1),var(--tw-exit-scale, 1),var(--tw-exit-scale, 1)) rotate(var(--tw-exit-rotate, 0))}}.paused{animation-play-state:paused}.as-root{--base: 0 0% 98%;--surface: 0 0% 100%;--elevated: 240 5% 96%;--border: 240 6% 90%;--fg-primary: 240 6% 10%;--fg-secondary: 240 4% 35%;--fg-muted: 240 5% 65%;--accent: 217 91% 60%;--bull: 4 87% 60%;--bear: 152 67% 45%;--warning: 32 95% 50%;--danger: 4 87% 60%}.as-root.dark{--base: 240 5% 5%;--surface: 240 7% 10%;--elevated: 240 9% 14%;--border: 240 5% 22%;--fg-primary: 0 0% 98%;--fg-secondary: 240 5% 78%;--fg-muted: 240 5% 58%;--accent: 217 91% 60%;--bull: 4 87% 60%;--bear: 152 67% 45%;--warning: 32 95% 50%;--danger: 4 87% 60%}.as-root{background:hsl(var(--base));color:hsl(var(--fg-primary))}.as-root *{border-color:hsl(var(--border));scrollbar-width:thin;scrollbar-color:hsl(var(--border)) transparent}.as-root *::-webkit-scrollbar{width:8px;height:8px}.as-root *::-webkit-scrollbar-thumb{background:hsl(var(--border) / .72);border:2px solid transparent;border-radius:999px;background-clip:content-box}.tabular{font-variant-numeric:tabular-nums}.hover\\:border-accent\\/30:hover{border-color:hsl(var(--accent) / .3)}.hover\\:border-accent\\/40:hover{border-color:hsl(var(--accent) / .4)}.hover\\:bg-accent\\/15:hover{background-color:hsl(var(--accent) / .15)}.hover\\:bg-elevated:hover{--tw-bg-opacity: 1;background-color:hsl(var(--elevated) / var(--tw-bg-opacity, 1))}.hover\\:text-accent:hover{--tw-text-opacity: 1;color:hsl(var(--accent) / var(--tw-text-opacity, 1))}.hover\\:text-foreground:hover{--tw-text-opacity: 1;color:hsl(var(--fg-primary) / var(--tw-text-opacity, 1))}.hover\\:shadow-\\[0_2px_6px_hsl\\(var\\(--accent\\)\\/0\\.15\\)\\]:hover{--tw-shadow: 0 2px 6px hsl(var(--accent)/.15);--tw-shadow-colored: 0 2px 6px var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000),var(--tw-ring-shadow, 0 0 #0000),var(--tw-shadow)}.hover\\:shadow-\\[0_2px_8px_hsl\\(var\\(--accent\\)\\/0\\.15\\)\\]:hover{--tw-shadow: 0 2px 8px hsl(var(--accent)/.15);--tw-shadow-colored: 0 2px 8px var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000),var(--tw-ring-shadow, 0 0 #0000),var(--tw-shadow)}.disabled\\:cursor-not-allowed:disabled{cursor:not-allowed}.disabled\\:opacity-40:disabled{opacity:.4}.disabled\\:opacity-50:disabled{opacity:.5}@media (min-width: 1024px){.lg\\:inline-flex{display:inline-flex}.lg\\:grid-cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}}@media (min-width: 1280px){.xl\\:grid-cols-\\[minmax\\(0\\,1fr\\)_20rem\\]{grid-template-columns:minmax(0,1fr) 20rem}}';
/**
 * @license lucide-react v0.439.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Rg = (e) => e.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase(), up = (...e) => e.filter((t, r, n) => !!t && n.indexOf(t) === r).join(" ");
/**
 * @license lucide-react v0.439.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
var Tg = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round"
};
/**
 * @license lucide-react v0.439.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Fg = I.forwardRef(
  ({
    color: e = "currentColor",
    size: t = 24,
    strokeWidth: r = 2,
    absoluteStrokeWidth: n,
    className: o = "",
    children: i,
    iconNode: l,
    ...s
  }, a) => I.createElement(
    "svg",
    {
      ref: a,
      ...Tg,
      width: t,
      height: t,
      stroke: e,
      strokeWidth: n ? Number(r) * 24 / Number(t) : r,
      className: up("lucide", o),
      ...s
    },
    [
      ...l.map(([u, g]) => I.createElement(u, g)),
      ...Array.isArray(i) ? i : [i]
    ]
  )
);
/**
 * @license lucide-react v0.439.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const me = (e, t) => {
  const r = I.forwardRef(
    ({ className: n, ...o }, i) => I.createElement(Fg, {
      ref: i,
      iconNode: t,
      className: up(`lucide-${Rg(e)}`, n),
      ...o
    })
  );
  return r.displayName = `${e}`, r;
};
/**
 * @license lucide-react v0.439.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
me("Activity", [
  [
    "path",
    {
      d: "M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2",
      key: "169zse"
    }
  ]
]);
/**
 * @license lucide-react v0.439.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Og = me("ArrowDownRight", [
  ["path", { d: "m7 7 10 10", key: "1fmybs" }],
  ["path", { d: "M17 7v10H7", key: "6fjiku" }]
]);
/**
 * @license lucide-react v0.439.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Lg = me("ArrowUpRight", [
  ["path", { d: "M7 7h10v10", key: "1tivn9" }],
  ["path", { d: "M7 17 17 7", key: "1vkiza" }]
]);
/**
 * @license lucide-react v0.439.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Ig = me("BellRing", [
  ["path", { d: "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9", key: "1qo2s2" }],
  ["path", { d: "M10.3 21a1.94 1.94 0 0 0 3.4 0", key: "qgo35s" }],
  ["path", { d: "M4 2C2.8 3.7 2 5.7 2 8", key: "tap9e0" }],
  ["path", { d: "M22 8c0-2.3-.8-4.3-2-6", key: "5bb3ad" }]
]);
/**
 * @license lucide-react v0.439.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Dg = me("ChartColumn", [
  ["path", { d: "M3 3v16a2 2 0 0 0 2 2h16", key: "c24i48" }],
  ["path", { d: "M18 17V9", key: "2bz60n" }],
  ["path", { d: "M13 17V5", key: "1frdt8" }],
  ["path", { d: "M8 17v-3", key: "17ska0" }]
]);
/**
 * @license lucide-react v0.439.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const $g = me("ChartLine", [
  ["path", { d: "M3 3v16a2 2 0 0 0 2 2h16", key: "c24i48" }],
  ["path", { d: "m19 9-5 5-4-4-3 3", key: "2osh9i" }]
]);
/**
 * @license lucide-react v0.439.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const cp = me("Flame", [
  [
    "path",
    {
      d: "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z",
      key: "96xj49"
    }
  ]
]);
/**
 * @license lucide-react v0.439.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Ag = me("Gauge", [
  ["path", { d: "m12 14 4-4", key: "9kzdfg" }],
  ["path", { d: "M3.34 19a10 10 0 1 1 17.32 0", key: "19p75a" }]
]);
/**
 * @license lucide-react v0.439.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Ug = me("LoaderCircle", [
  ["path", { d: "M21 12a9 9 0 1 1-6.219-8.56", key: "13zald" }]
]);
/**
 * @license lucide-react v0.439.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const hc = me("Pause", [
  ["rect", { x: "14", y: "4", width: "4", height: "16", rx: "1", key: "zuxfzm" }],
  ["rect", { x: "6", y: "4", width: "4", height: "16", rx: "1", key: "1okwgv" }]
]);
/**
 * @license lucide-react v0.439.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const mc = me("Play", [
  ["polygon", { points: "6 3 20 12 6 21 6 3", key: "1oa8hb" }]
]);
/**
 * @license lucide-react v0.439.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Qg = me("RefreshCw", [
  ["path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8", key: "v9h5vc" }],
  ["path", { d: "M21 3v5h-5", key: "1q7to0" }],
  ["path", { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16", key: "3uifl3" }],
  ["path", { d: "M8 16H3v5", key: "1cv678" }]
]);
/**
 * @license lucide-react v0.439.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Bg = me("RotateCcw", [
  ["path", { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8", key: "1357e3" }],
  ["path", { d: "M3 3v5h5", key: "1xhq8a" }]
]);
/**
 * @license lucide-react v0.439.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Hg = me("Sparkles", [
  [
    "path",
    {
      d: "M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z",
      key: "4pj2yx"
    }
  ],
  ["path", { d: "M20 3v4", key: "1olli1" }],
  ["path", { d: "M22 5h-4", key: "1gvqau" }],
  ["path", { d: "M4 17v2", key: "vumght" }],
  ["path", { d: "M5 18H3", key: "zchphs" }]
]);
/**
 * @license lucide-react v0.439.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
me("Target", [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["circle", { cx: "12", cy: "12", r: "6", key: "1vlfrh" }],
  ["circle", { cx: "12", cy: "12", r: "2", key: "1c9p78" }]
]);
/**
 * @license lucide-react v0.439.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const dp = me("Timer", [
  ["line", { x1: "10", x2: "14", y1: "2", y2: "2", key: "14vaq8" }],
  ["line", { x1: "12", x2: "15", y1: "14", y2: "11", key: "17fdiu" }],
  ["circle", { cx: "12", cy: "14", r: "8", key: "1e1u0o" }]
]);
/**
 * @license lucide-react v0.439.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Wg = me("TriangleAlert", [
  [
    "path",
    {
      d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",
      key: "wmoenq"
    }
  ],
  ["path", { d: "M12 9v4", key: "juzpu7" }],
  ["path", { d: "M12 17h.01", key: "p32p05" }]
]);
/**
 * @license lucide-react v0.439.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Vg = me("X", [
  ["path", { d: "M18 6 6 18", key: "1bl5f8" }],
  ["path", { d: "m6 6 12 12", key: "d8bk6v" }]
]), Kg = "http://127.0.0.1:3023";
async function gc(e) {
  const t = await fetch(e, { headers: { Accept: "application/json" } });
  if (!t.ok) throw new Error(`${t.status} ${t.statusText}`);
  return t.json();
}
const fp = {
  limitPoolTimeline: (e, t = !1) => {
    const r = new URLSearchParams();
    e && r.set("date", e), t && r.set("refresh", "1");
    const n = r.toString();
    return gc(`${Kg}/api/limit-pool/timeline${n ? `?${n}` : ""}`);
  },
  overviewMarket: () => gc("/api/overview/market?market=cn")
};
function pp(e) {
  var t, r, n = "";
  if (typeof e == "string" || typeof e == "number") n += e;
  else if (typeof e == "object") if (Array.isArray(e)) {
    var o = e.length;
    for (t = 0; t < o; t++) e[t] && (r = pp(e[t])) && (n && (n += " "), n += r);
  } else for (r in e) e[r] && (n && (n += " "), n += r);
  return n;
}
function Gg() {
  for (var e, t, r = 0, n = "", o = arguments.length; r < o; r++) (e = arguments[r]) && (t = pp(e)) && (n && (n += " "), n += t);
  return n;
}
const Wa = "-", qg = (e) => {
  const t = Xg(e), {
    conflictingClassGroups: r,
    conflictingClassGroupModifiers: n
  } = e;
  return {
    getClassGroupId: (l) => {
      const s = l.split(Wa);
      return s[0] === "" && s.length !== 1 && s.shift(), hp(s, t) || Yg(l);
    },
    getConflictingClassGroupIds: (l, s) => {
      const a = r[l] || [];
      return s && n[l] ? [...a, ...n[l]] : a;
    }
  };
}, hp = (e, t) => {
  if (e.length === 0)
    return t.classGroupId;
  const r = e[0], n = t.nextPart.get(r), o = n ? hp(e.slice(1), n) : void 0;
  if (o)
    return o;
  if (t.validators.length === 0)
    return;
  const i = e.join(Wa);
  return t.validators.find(({
    validator: l
  }) => l(i))?.classGroupId;
}, vc = /^\[(.+)\]$/, Yg = (e) => {
  if (vc.test(e)) {
    const t = vc.exec(e)[1], r = t?.substring(0, t.indexOf(":"));
    if (r)
      return "arbitrary.." + r;
  }
}, Xg = (e) => {
  const {
    theme: t,
    prefix: r
  } = e, n = {
    nextPart: /* @__PURE__ */ new Map(),
    validators: []
  };
  return Jg(Object.entries(e.classGroups), r).forEach(([i, l]) => {
    Hs(l, n, i, t);
  }), n;
}, Hs = (e, t, r, n) => {
  e.forEach((o) => {
    if (typeof o == "string") {
      const i = o === "" ? t : yc(t, o);
      i.classGroupId = r;
      return;
    }
    if (typeof o == "function") {
      if (Zg(o)) {
        Hs(o(n), t, r, n);
        return;
      }
      t.validators.push({
        validator: o,
        classGroupId: r
      });
      return;
    }
    Object.entries(o).forEach(([i, l]) => {
      Hs(l, yc(t, i), r, n);
    });
  });
}, yc = (e, t) => {
  let r = e;
  return t.split(Wa).forEach((n) => {
    r.nextPart.has(n) || r.nextPart.set(n, {
      nextPart: /* @__PURE__ */ new Map(),
      validators: []
    }), r = r.nextPart.get(n);
  }), r;
}, Zg = (e) => e.isThemeGetter, Jg = (e, t) => t ? e.map(([r, n]) => {
  const o = n.map((i) => typeof i == "string" ? t + i : typeof i == "object" ? Object.fromEntries(Object.entries(i).map(([l, s]) => [t + l, s])) : i);
  return [r, o];
}) : e, ev = (e) => {
  if (e < 1)
    return {
      get: () => {
      },
      set: () => {
      }
    };
  let t = 0, r = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map();
  const o = (i, l) => {
    r.set(i, l), t++, t > e && (t = 0, n = r, r = /* @__PURE__ */ new Map());
  };
  return {
    get(i) {
      let l = r.get(i);
      if (l !== void 0)
        return l;
      if ((l = n.get(i)) !== void 0)
        return o(i, l), l;
    },
    set(i, l) {
      r.has(i) ? r.set(i, l) : o(i, l);
    }
  };
}, mp = "!", tv = (e) => {
  const {
    separator: t,
    experimentalParseClassName: r
  } = e, n = t.length === 1, o = t[0], i = t.length, l = (s) => {
    const a = [];
    let u = 0, g = 0, h;
    for (let S = 0; S < s.length; S++) {
      let p = s[S];
      if (u === 0) {
        if (p === o && (n || s.slice(S, S + i) === t)) {
          a.push(s.slice(g, S)), g = S + i;
          continue;
        }
        if (p === "/") {
          h = S;
          continue;
        }
      }
      p === "[" ? u++ : p === "]" && u--;
    }
    const v = a.length === 0 ? s : s.substring(g), y = v.startsWith(mp), w = y ? v.substring(1) : v, x = h && h > g ? h - g : void 0;
    return {
      modifiers: a,
      hasImportantModifier: y,
      baseClassName: w,
      maybePostfixModifierPosition: x
    };
  };
  return r ? (s) => r({
    className: s,
    parseClassName: l
  }) : l;
}, rv = (e) => {
  if (e.length <= 1)
    return e;
  const t = [];
  let r = [];
  return e.forEach((n) => {
    n[0] === "[" ? (t.push(...r.sort(), n), r = []) : r.push(n);
  }), t.push(...r.sort()), t;
}, nv = (e) => ({
  cache: ev(e.cacheSize),
  parseClassName: tv(e),
  ...qg(e)
}), ov = /\s+/, iv = (e, t) => {
  const {
    parseClassName: r,
    getClassGroupId: n,
    getConflictingClassGroupIds: o
  } = t, i = [], l = e.trim().split(ov);
  let s = "";
  for (let a = l.length - 1; a >= 0; a -= 1) {
    const u = l[a], {
      modifiers: g,
      hasImportantModifier: h,
      baseClassName: v,
      maybePostfixModifierPosition: y
    } = r(u);
    let w = !!y, x = n(w ? v.substring(0, y) : v);
    if (!x) {
      if (!w) {
        s = u + (s.length > 0 ? " " + s : s);
        continue;
      }
      if (x = n(v), !x) {
        s = u + (s.length > 0 ? " " + s : s);
        continue;
      }
      w = !1;
    }
    const S = rv(g).join(":"), p = h ? S + mp : S, d = p + x;
    if (i.includes(d))
      continue;
    i.push(d);
    const m = o(x, w);
    for (let k = 0; k < m.length; ++k) {
      const C = m[k];
      i.push(p + C);
    }
    s = u + (s.length > 0 ? " " + s : s);
  }
  return s;
};
function lv() {
  let e = 0, t, r, n = "";
  for (; e < arguments.length; )
    (t = arguments[e++]) && (r = gp(t)) && (n && (n += " "), n += r);
  return n;
}
const gp = (e) => {
  if (typeof e == "string")
    return e;
  let t, r = "";
  for (let n = 0; n < e.length; n++)
    e[n] && (t = gp(e[n])) && (r && (r += " "), r += t);
  return r;
};
function sv(e, ...t) {
  let r, n, o, i = l;
  function l(a) {
    const u = t.reduce((g, h) => h(g), e());
    return r = nv(u), n = r.cache.get, o = r.cache.set, i = s, s(a);
  }
  function s(a) {
    const u = n(a);
    if (u)
      return u;
    const g = iv(a, r);
    return o(a, g), g;
  }
  return function() {
    return i(lv.apply(null, arguments));
  };
}
const X = (e) => {
  const t = (r) => r[e] || [];
  return t.isThemeGetter = !0, t;
}, vp = /^\[(?:([a-z-]+):)?(.+)\]$/i, av = /^\d+\/\d+$/, uv = /* @__PURE__ */ new Set(["px", "full", "screen"]), cv = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, dv = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, fv = /^(rgba?|hsla?|hwb|(ok)?(lab|lch)|color-mix)\(.+\)$/, pv = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, hv = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, kt = (e) => fn(e) || uv.has(e) || av.test(e), Dt = (e) => Ln(e, "length", bv), fn = (e) => !!e && !Number.isNaN(Number(e)), Ll = (e) => Ln(e, "number", fn), Wn = (e) => !!e && Number.isInteger(Number(e)), mv = (e) => e.endsWith("%") && fn(e.slice(0, -1)), D = (e) => vp.test(e), $t = (e) => cv.test(e), gv = /* @__PURE__ */ new Set(["length", "size", "percentage"]), vv = (e) => Ln(e, gv, yp), yv = (e) => Ln(e, "position", yp), xv = /* @__PURE__ */ new Set(["image", "url"]), wv = (e) => Ln(e, xv, Cv), kv = (e) => Ln(e, "", Sv), Vn = () => !0, Ln = (e, t, r) => {
  const n = vp.exec(e);
  return n ? n[1] ? typeof t == "string" ? n[1] === t : t.has(n[1]) : r(n[2]) : !1;
}, bv = (e) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  dv.test(e) && !fv.test(e)
), yp = () => !1, Sv = (e) => pv.test(e), Cv = (e) => hv.test(e), Ev = () => {
  const e = X("colors"), t = X("spacing"), r = X("blur"), n = X("brightness"), o = X("borderColor"), i = X("borderRadius"), l = X("borderSpacing"), s = X("borderWidth"), a = X("contrast"), u = X("grayscale"), g = X("hueRotate"), h = X("invert"), v = X("gap"), y = X("gradientColorStops"), w = X("gradientColorStopPositions"), x = X("inset"), S = X("margin"), p = X("opacity"), d = X("padding"), m = X("saturate"), k = X("scale"), C = X("sepia"), _ = X("skew"), N = X("space"), P = X("translate"), R = () => ["auto", "contain", "none"], T = () => ["auto", "hidden", "clip", "visible", "scroll"], Y = () => ["auto", D, t], U = () => [D, t], Ee = () => ["", kt, Dt], Me = () => ["auto", fn, D], Br = () => ["bottom", "center", "left", "left-bottom", "left-top", "right", "right-bottom", "right-top", "top"], ct = () => ["solid", "dashed", "dotted", "double", "none"], xt = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"], E = () => ["start", "end", "center", "between", "around", "evenly", "stretch"], O = () => ["", "0", D], L = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"], B = () => [fn, D];
  return {
    cacheSize: 500,
    separator: ":",
    theme: {
      colors: [Vn],
      spacing: [kt, Dt],
      blur: ["none", "", $t, D],
      brightness: B(),
      borderColor: [e],
      borderRadius: ["none", "", "full", $t, D],
      borderSpacing: U(),
      borderWidth: Ee(),
      contrast: B(),
      grayscale: O(),
      hueRotate: B(),
      invert: O(),
      gap: U(),
      gradientColorStops: [e],
      gradientColorStopPositions: [mv, Dt],
      inset: Y(),
      margin: Y(),
      opacity: B(),
      padding: U(),
      saturate: B(),
      scale: B(),
      sepia: O(),
      skew: B(),
      space: U(),
      translate: U()
    },
    classGroups: {
      // Layout
      /**
       * Aspect Ratio
       * @see https://tailwindcss.com/docs/aspect-ratio
       */
      aspect: [{
        aspect: ["auto", "square", "video", D]
      }],
      /**
       * Container
       * @see https://tailwindcss.com/docs/container
       */
      container: ["container"],
      /**
       * Columns
       * @see https://tailwindcss.com/docs/columns
       */
      columns: [{
        columns: [$t]
      }],
      /**
       * Break After
       * @see https://tailwindcss.com/docs/break-after
       */
      "break-after": [{
        "break-after": L()
      }],
      /**
       * Break Before
       * @see https://tailwindcss.com/docs/break-before
       */
      "break-before": [{
        "break-before": L()
      }],
      /**
       * Break Inside
       * @see https://tailwindcss.com/docs/break-inside
       */
      "break-inside": [{
        "break-inside": ["auto", "avoid", "avoid-page", "avoid-column"]
      }],
      /**
       * Box Decoration Break
       * @see https://tailwindcss.com/docs/box-decoration-break
       */
      "box-decoration": [{
        "box-decoration": ["slice", "clone"]
      }],
      /**
       * Box Sizing
       * @see https://tailwindcss.com/docs/box-sizing
       */
      box: [{
        box: ["border", "content"]
      }],
      /**
       * Display
       * @see https://tailwindcss.com/docs/display
       */
      display: ["block", "inline-block", "inline", "flex", "inline-flex", "table", "inline-table", "table-caption", "table-cell", "table-column", "table-column-group", "table-footer-group", "table-header-group", "table-row-group", "table-row", "flow-root", "grid", "inline-grid", "contents", "list-item", "hidden"],
      /**
       * Floats
       * @see https://tailwindcss.com/docs/float
       */
      float: [{
        float: ["right", "left", "none", "start", "end"]
      }],
      /**
       * Clear
       * @see https://tailwindcss.com/docs/clear
       */
      clear: [{
        clear: ["left", "right", "both", "none", "start", "end"]
      }],
      /**
       * Isolation
       * @see https://tailwindcss.com/docs/isolation
       */
      isolation: ["isolate", "isolation-auto"],
      /**
       * Object Fit
       * @see https://tailwindcss.com/docs/object-fit
       */
      "object-fit": [{
        object: ["contain", "cover", "fill", "none", "scale-down"]
      }],
      /**
       * Object Position
       * @see https://tailwindcss.com/docs/object-position
       */
      "object-position": [{
        object: [...Br(), D]
      }],
      /**
       * Overflow
       * @see https://tailwindcss.com/docs/overflow
       */
      overflow: [{
        overflow: T()
      }],
      /**
       * Overflow X
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-x": [{
        "overflow-x": T()
      }],
      /**
       * Overflow Y
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-y": [{
        "overflow-y": T()
      }],
      /**
       * Overscroll Behavior
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      overscroll: [{
        overscroll: R()
      }],
      /**
       * Overscroll Behavior X
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-x": [{
        "overscroll-x": R()
      }],
      /**
       * Overscroll Behavior Y
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-y": [{
        "overscroll-y": R()
      }],
      /**
       * Position
       * @see https://tailwindcss.com/docs/position
       */
      position: ["static", "fixed", "absolute", "relative", "sticky"],
      /**
       * Top / Right / Bottom / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      inset: [{
        inset: [x]
      }],
      /**
       * Right / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-x": [{
        "inset-x": [x]
      }],
      /**
       * Top / Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-y": [{
        "inset-y": [x]
      }],
      /**
       * Start
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      start: [{
        start: [x]
      }],
      /**
       * End
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      end: [{
        end: [x]
      }],
      /**
       * Top
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      top: [{
        top: [x]
      }],
      /**
       * Right
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      right: [{
        right: [x]
      }],
      /**
       * Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      bottom: [{
        bottom: [x]
      }],
      /**
       * Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      left: [{
        left: [x]
      }],
      /**
       * Visibility
       * @see https://tailwindcss.com/docs/visibility
       */
      visibility: ["visible", "invisible", "collapse"],
      /**
       * Z-Index
       * @see https://tailwindcss.com/docs/z-index
       */
      z: [{
        z: ["auto", Wn, D]
      }],
      // Flexbox and Grid
      /**
       * Flex Basis
       * @see https://tailwindcss.com/docs/flex-basis
       */
      basis: [{
        basis: Y()
      }],
      /**
       * Flex Direction
       * @see https://tailwindcss.com/docs/flex-direction
       */
      "flex-direction": [{
        flex: ["row", "row-reverse", "col", "col-reverse"]
      }],
      /**
       * Flex Wrap
       * @see https://tailwindcss.com/docs/flex-wrap
       */
      "flex-wrap": [{
        flex: ["wrap", "wrap-reverse", "nowrap"]
      }],
      /**
       * Flex
       * @see https://tailwindcss.com/docs/flex
       */
      flex: [{
        flex: ["1", "auto", "initial", "none", D]
      }],
      /**
       * Flex Grow
       * @see https://tailwindcss.com/docs/flex-grow
       */
      grow: [{
        grow: O()
      }],
      /**
       * Flex Shrink
       * @see https://tailwindcss.com/docs/flex-shrink
       */
      shrink: [{
        shrink: O()
      }],
      /**
       * Order
       * @see https://tailwindcss.com/docs/order
       */
      order: [{
        order: ["first", "last", "none", Wn, D]
      }],
      /**
       * Grid Template Columns
       * @see https://tailwindcss.com/docs/grid-template-columns
       */
      "grid-cols": [{
        "grid-cols": [Vn]
      }],
      /**
       * Grid Column Start / End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start-end": [{
        col: ["auto", {
          span: ["full", Wn, D]
        }, D]
      }],
      /**
       * Grid Column Start
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start": [{
        "col-start": Me()
      }],
      /**
       * Grid Column End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-end": [{
        "col-end": Me()
      }],
      /**
       * Grid Template Rows
       * @see https://tailwindcss.com/docs/grid-template-rows
       */
      "grid-rows": [{
        "grid-rows": [Vn]
      }],
      /**
       * Grid Row Start / End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start-end": [{
        row: ["auto", {
          span: [Wn, D]
        }, D]
      }],
      /**
       * Grid Row Start
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start": [{
        "row-start": Me()
      }],
      /**
       * Grid Row End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-end": [{
        "row-end": Me()
      }],
      /**
       * Grid Auto Flow
       * @see https://tailwindcss.com/docs/grid-auto-flow
       */
      "grid-flow": [{
        "grid-flow": ["row", "col", "dense", "row-dense", "col-dense"]
      }],
      /**
       * Grid Auto Columns
       * @see https://tailwindcss.com/docs/grid-auto-columns
       */
      "auto-cols": [{
        "auto-cols": ["auto", "min", "max", "fr", D]
      }],
      /**
       * Grid Auto Rows
       * @see https://tailwindcss.com/docs/grid-auto-rows
       */
      "auto-rows": [{
        "auto-rows": ["auto", "min", "max", "fr", D]
      }],
      /**
       * Gap
       * @see https://tailwindcss.com/docs/gap
       */
      gap: [{
        gap: [v]
      }],
      /**
       * Gap X
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-x": [{
        "gap-x": [v]
      }],
      /**
       * Gap Y
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-y": [{
        "gap-y": [v]
      }],
      /**
       * Justify Content
       * @see https://tailwindcss.com/docs/justify-content
       */
      "justify-content": [{
        justify: ["normal", ...E()]
      }],
      /**
       * Justify Items
       * @see https://tailwindcss.com/docs/justify-items
       */
      "justify-items": [{
        "justify-items": ["start", "end", "center", "stretch"]
      }],
      /**
       * Justify Self
       * @see https://tailwindcss.com/docs/justify-self
       */
      "justify-self": [{
        "justify-self": ["auto", "start", "end", "center", "stretch"]
      }],
      /**
       * Align Content
       * @see https://tailwindcss.com/docs/align-content
       */
      "align-content": [{
        content: ["normal", ...E(), "baseline"]
      }],
      /**
       * Align Items
       * @see https://tailwindcss.com/docs/align-items
       */
      "align-items": [{
        items: ["start", "end", "center", "baseline", "stretch"]
      }],
      /**
       * Align Self
       * @see https://tailwindcss.com/docs/align-self
       */
      "align-self": [{
        self: ["auto", "start", "end", "center", "stretch", "baseline"]
      }],
      /**
       * Place Content
       * @see https://tailwindcss.com/docs/place-content
       */
      "place-content": [{
        "place-content": [...E(), "baseline"]
      }],
      /**
       * Place Items
       * @see https://tailwindcss.com/docs/place-items
       */
      "place-items": [{
        "place-items": ["start", "end", "center", "baseline", "stretch"]
      }],
      /**
       * Place Self
       * @see https://tailwindcss.com/docs/place-self
       */
      "place-self": [{
        "place-self": ["auto", "start", "end", "center", "stretch"]
      }],
      // Spacing
      /**
       * Padding
       * @see https://tailwindcss.com/docs/padding
       */
      p: [{
        p: [d]
      }],
      /**
       * Padding X
       * @see https://tailwindcss.com/docs/padding
       */
      px: [{
        px: [d]
      }],
      /**
       * Padding Y
       * @see https://tailwindcss.com/docs/padding
       */
      py: [{
        py: [d]
      }],
      /**
       * Padding Start
       * @see https://tailwindcss.com/docs/padding
       */
      ps: [{
        ps: [d]
      }],
      /**
       * Padding End
       * @see https://tailwindcss.com/docs/padding
       */
      pe: [{
        pe: [d]
      }],
      /**
       * Padding Top
       * @see https://tailwindcss.com/docs/padding
       */
      pt: [{
        pt: [d]
      }],
      /**
       * Padding Right
       * @see https://tailwindcss.com/docs/padding
       */
      pr: [{
        pr: [d]
      }],
      /**
       * Padding Bottom
       * @see https://tailwindcss.com/docs/padding
       */
      pb: [{
        pb: [d]
      }],
      /**
       * Padding Left
       * @see https://tailwindcss.com/docs/padding
       */
      pl: [{
        pl: [d]
      }],
      /**
       * Margin
       * @see https://tailwindcss.com/docs/margin
       */
      m: [{
        m: [S]
      }],
      /**
       * Margin X
       * @see https://tailwindcss.com/docs/margin
       */
      mx: [{
        mx: [S]
      }],
      /**
       * Margin Y
       * @see https://tailwindcss.com/docs/margin
       */
      my: [{
        my: [S]
      }],
      /**
       * Margin Start
       * @see https://tailwindcss.com/docs/margin
       */
      ms: [{
        ms: [S]
      }],
      /**
       * Margin End
       * @see https://tailwindcss.com/docs/margin
       */
      me: [{
        me: [S]
      }],
      /**
       * Margin Top
       * @see https://tailwindcss.com/docs/margin
       */
      mt: [{
        mt: [S]
      }],
      /**
       * Margin Right
       * @see https://tailwindcss.com/docs/margin
       */
      mr: [{
        mr: [S]
      }],
      /**
       * Margin Bottom
       * @see https://tailwindcss.com/docs/margin
       */
      mb: [{
        mb: [S]
      }],
      /**
       * Margin Left
       * @see https://tailwindcss.com/docs/margin
       */
      ml: [{
        ml: [S]
      }],
      /**
       * Space Between X
       * @see https://tailwindcss.com/docs/space
       */
      "space-x": [{
        "space-x": [N]
      }],
      /**
       * Space Between X Reverse
       * @see https://tailwindcss.com/docs/space
       */
      "space-x-reverse": ["space-x-reverse"],
      /**
       * Space Between Y
       * @see https://tailwindcss.com/docs/space
       */
      "space-y": [{
        "space-y": [N]
      }],
      /**
       * Space Between Y Reverse
       * @see https://tailwindcss.com/docs/space
       */
      "space-y-reverse": ["space-y-reverse"],
      // Sizing
      /**
       * Width
       * @see https://tailwindcss.com/docs/width
       */
      w: [{
        w: ["auto", "min", "max", "fit", "svw", "lvw", "dvw", D, t]
      }],
      /**
       * Min-Width
       * @see https://tailwindcss.com/docs/min-width
       */
      "min-w": [{
        "min-w": [D, t, "min", "max", "fit"]
      }],
      /**
       * Max-Width
       * @see https://tailwindcss.com/docs/max-width
       */
      "max-w": [{
        "max-w": [D, t, "none", "full", "min", "max", "fit", "prose", {
          screen: [$t]
        }, $t]
      }],
      /**
       * Height
       * @see https://tailwindcss.com/docs/height
       */
      h: [{
        h: [D, t, "auto", "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Min-Height
       * @see https://tailwindcss.com/docs/min-height
       */
      "min-h": [{
        "min-h": [D, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Max-Height
       * @see https://tailwindcss.com/docs/max-height
       */
      "max-h": [{
        "max-h": [D, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Size
       * @see https://tailwindcss.com/docs/size
       */
      size: [{
        size: [D, t, "auto", "min", "max", "fit"]
      }],
      // Typography
      /**
       * Font Size
       * @see https://tailwindcss.com/docs/font-size
       */
      "font-size": [{
        text: ["base", $t, Dt]
      }],
      /**
       * Font Smoothing
       * @see https://tailwindcss.com/docs/font-smoothing
       */
      "font-smoothing": ["antialiased", "subpixel-antialiased"],
      /**
       * Font Style
       * @see https://tailwindcss.com/docs/font-style
       */
      "font-style": ["italic", "not-italic"],
      /**
       * Font Weight
       * @see https://tailwindcss.com/docs/font-weight
       */
      "font-weight": [{
        font: ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black", Ll]
      }],
      /**
       * Font Family
       * @see https://tailwindcss.com/docs/font-family
       */
      "font-family": [{
        font: [Vn]
      }],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-normal": ["normal-nums"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-ordinal": ["ordinal"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-slashed-zero": ["slashed-zero"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-figure": ["lining-nums", "oldstyle-nums"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-spacing": ["proportional-nums", "tabular-nums"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-fraction": ["diagonal-fractions", "stacked-fractions"],
      /**
       * Letter Spacing
       * @see https://tailwindcss.com/docs/letter-spacing
       */
      tracking: [{
        tracking: ["tighter", "tight", "normal", "wide", "wider", "widest", D]
      }],
      /**
       * Line Clamp
       * @see https://tailwindcss.com/docs/line-clamp
       */
      "line-clamp": [{
        "line-clamp": ["none", fn, Ll]
      }],
      /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */
      leading: [{
        leading: ["none", "tight", "snug", "normal", "relaxed", "loose", kt, D]
      }],
      /**
       * List Style Image
       * @see https://tailwindcss.com/docs/list-style-image
       */
      "list-image": [{
        "list-image": ["none", D]
      }],
      /**
       * List Style Type
       * @see https://tailwindcss.com/docs/list-style-type
       */
      "list-style-type": [{
        list: ["none", "disc", "decimal", D]
      }],
      /**
       * List Style Position
       * @see https://tailwindcss.com/docs/list-style-position
       */
      "list-style-position": [{
        list: ["inside", "outside"]
      }],
      /**
       * Placeholder Color
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/placeholder-color
       */
      "placeholder-color": [{
        placeholder: [e]
      }],
      /**
       * Placeholder Opacity
       * @see https://tailwindcss.com/docs/placeholder-opacity
       */
      "placeholder-opacity": [{
        "placeholder-opacity": [p]
      }],
      /**
       * Text Alignment
       * @see https://tailwindcss.com/docs/text-align
       */
      "text-alignment": [{
        text: ["left", "center", "right", "justify", "start", "end"]
      }],
      /**
       * Text Color
       * @see https://tailwindcss.com/docs/text-color
       */
      "text-color": [{
        text: [e]
      }],
      /**
       * Text Opacity
       * @see https://tailwindcss.com/docs/text-opacity
       */
      "text-opacity": [{
        "text-opacity": [p]
      }],
      /**
       * Text Decoration
       * @see https://tailwindcss.com/docs/text-decoration
       */
      "text-decoration": ["underline", "overline", "line-through", "no-underline"],
      /**
       * Text Decoration Style
       * @see https://tailwindcss.com/docs/text-decoration-style
       */
      "text-decoration-style": [{
        decoration: [...ct(), "wavy"]
      }],
      /**
       * Text Decoration Thickness
       * @see https://tailwindcss.com/docs/text-decoration-thickness
       */
      "text-decoration-thickness": [{
        decoration: ["auto", "from-font", kt, Dt]
      }],
      /**
       * Text Underline Offset
       * @see https://tailwindcss.com/docs/text-underline-offset
       */
      "underline-offset": [{
        "underline-offset": ["auto", kt, D]
      }],
      /**
       * Text Decoration Color
       * @see https://tailwindcss.com/docs/text-decoration-color
       */
      "text-decoration-color": [{
        decoration: [e]
      }],
      /**
       * Text Transform
       * @see https://tailwindcss.com/docs/text-transform
       */
      "text-transform": ["uppercase", "lowercase", "capitalize", "normal-case"],
      /**
       * Text Overflow
       * @see https://tailwindcss.com/docs/text-overflow
       */
      "text-overflow": ["truncate", "text-ellipsis", "text-clip"],
      /**
       * Text Wrap
       * @see https://tailwindcss.com/docs/text-wrap
       */
      "text-wrap": [{
        text: ["wrap", "nowrap", "balance", "pretty"]
      }],
      /**
       * Text Indent
       * @see https://tailwindcss.com/docs/text-indent
       */
      indent: [{
        indent: U()
      }],
      /**
       * Vertical Alignment
       * @see https://tailwindcss.com/docs/vertical-align
       */
      "vertical-align": [{
        align: ["baseline", "top", "middle", "bottom", "text-top", "text-bottom", "sub", "super", D]
      }],
      /**
       * Whitespace
       * @see https://tailwindcss.com/docs/whitespace
       */
      whitespace: [{
        whitespace: ["normal", "nowrap", "pre", "pre-line", "pre-wrap", "break-spaces"]
      }],
      /**
       * Word Break
       * @see https://tailwindcss.com/docs/word-break
       */
      break: [{
        break: ["normal", "words", "all", "keep"]
      }],
      /**
       * Hyphens
       * @see https://tailwindcss.com/docs/hyphens
       */
      hyphens: [{
        hyphens: ["none", "manual", "auto"]
      }],
      /**
       * Content
       * @see https://tailwindcss.com/docs/content
       */
      content: [{
        content: ["none", D]
      }],
      // Backgrounds
      /**
       * Background Attachment
       * @see https://tailwindcss.com/docs/background-attachment
       */
      "bg-attachment": [{
        bg: ["fixed", "local", "scroll"]
      }],
      /**
       * Background Clip
       * @see https://tailwindcss.com/docs/background-clip
       */
      "bg-clip": [{
        "bg-clip": ["border", "padding", "content", "text"]
      }],
      /**
       * Background Opacity
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/background-opacity
       */
      "bg-opacity": [{
        "bg-opacity": [p]
      }],
      /**
       * Background Origin
       * @see https://tailwindcss.com/docs/background-origin
       */
      "bg-origin": [{
        "bg-origin": ["border", "padding", "content"]
      }],
      /**
       * Background Position
       * @see https://tailwindcss.com/docs/background-position
       */
      "bg-position": [{
        bg: [...Br(), yv]
      }],
      /**
       * Background Repeat
       * @see https://tailwindcss.com/docs/background-repeat
       */
      "bg-repeat": [{
        bg: ["no-repeat", {
          repeat: ["", "x", "y", "round", "space"]
        }]
      }],
      /**
       * Background Size
       * @see https://tailwindcss.com/docs/background-size
       */
      "bg-size": [{
        bg: ["auto", "cover", "contain", vv]
      }],
      /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */
      "bg-image": [{
        bg: ["none", {
          "gradient-to": ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
        }, wv]
      }],
      /**
       * Background Color
       * @see https://tailwindcss.com/docs/background-color
       */
      "bg-color": [{
        bg: [e]
      }],
      /**
       * Gradient Color Stops From Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-from-pos": [{
        from: [w]
      }],
      /**
       * Gradient Color Stops Via Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via-pos": [{
        via: [w]
      }],
      /**
       * Gradient Color Stops To Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to-pos": [{
        to: [w]
      }],
      /**
       * Gradient Color Stops From
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-from": [{
        from: [y]
      }],
      /**
       * Gradient Color Stops Via
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via": [{
        via: [y]
      }],
      /**
       * Gradient Color Stops To
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to": [{
        to: [y]
      }],
      // Borders
      /**
       * Border Radius
       * @see https://tailwindcss.com/docs/border-radius
       */
      rounded: [{
        rounded: [i]
      }],
      /**
       * Border Radius Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-s": [{
        "rounded-s": [i]
      }],
      /**
       * Border Radius End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-e": [{
        "rounded-e": [i]
      }],
      /**
       * Border Radius Top
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-t": [{
        "rounded-t": [i]
      }],
      /**
       * Border Radius Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-r": [{
        "rounded-r": [i]
      }],
      /**
       * Border Radius Bottom
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-b": [{
        "rounded-b": [i]
      }],
      /**
       * Border Radius Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-l": [{
        "rounded-l": [i]
      }],
      /**
       * Border Radius Start Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-ss": [{
        "rounded-ss": [i]
      }],
      /**
       * Border Radius Start End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-se": [{
        "rounded-se": [i]
      }],
      /**
       * Border Radius End End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-ee": [{
        "rounded-ee": [i]
      }],
      /**
       * Border Radius End Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-es": [{
        "rounded-es": [i]
      }],
      /**
       * Border Radius Top Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-tl": [{
        "rounded-tl": [i]
      }],
      /**
       * Border Radius Top Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-tr": [{
        "rounded-tr": [i]
      }],
      /**
       * Border Radius Bottom Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-br": [{
        "rounded-br": [i]
      }],
      /**
       * Border Radius Bottom Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-bl": [{
        "rounded-bl": [i]
      }],
      /**
       * Border Width
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w": [{
        border: [s]
      }],
      /**
       * Border Width X
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-x": [{
        "border-x": [s]
      }],
      /**
       * Border Width Y
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-y": [{
        "border-y": [s]
      }],
      /**
       * Border Width Start
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-s": [{
        "border-s": [s]
      }],
      /**
       * Border Width End
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-e": [{
        "border-e": [s]
      }],
      /**
       * Border Width Top
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-t": [{
        "border-t": [s]
      }],
      /**
       * Border Width Right
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-r": [{
        "border-r": [s]
      }],
      /**
       * Border Width Bottom
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-b": [{
        "border-b": [s]
      }],
      /**
       * Border Width Left
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-l": [{
        "border-l": [s]
      }],
      /**
       * Border Opacity
       * @see https://tailwindcss.com/docs/border-opacity
       */
      "border-opacity": [{
        "border-opacity": [p]
      }],
      /**
       * Border Style
       * @see https://tailwindcss.com/docs/border-style
       */
      "border-style": [{
        border: [...ct(), "hidden"]
      }],
      /**
       * Divide Width X
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-x": [{
        "divide-x": [s]
      }],
      /**
       * Divide Width X Reverse
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-x-reverse": ["divide-x-reverse"],
      /**
       * Divide Width Y
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-y": [{
        "divide-y": [s]
      }],
      /**
       * Divide Width Y Reverse
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-y-reverse": ["divide-y-reverse"],
      /**
       * Divide Opacity
       * @see https://tailwindcss.com/docs/divide-opacity
       */
      "divide-opacity": [{
        "divide-opacity": [p]
      }],
      /**
       * Divide Style
       * @see https://tailwindcss.com/docs/divide-style
       */
      "divide-style": [{
        divide: ct()
      }],
      /**
       * Border Color
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color": [{
        border: [o]
      }],
      /**
       * Border Color X
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-x": [{
        "border-x": [o]
      }],
      /**
       * Border Color Y
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-y": [{
        "border-y": [o]
      }],
      /**
       * Border Color S
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-s": [{
        "border-s": [o]
      }],
      /**
       * Border Color E
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-e": [{
        "border-e": [o]
      }],
      /**
       * Border Color Top
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-t": [{
        "border-t": [o]
      }],
      /**
       * Border Color Right
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-r": [{
        "border-r": [o]
      }],
      /**
       * Border Color Bottom
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-b": [{
        "border-b": [o]
      }],
      /**
       * Border Color Left
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-l": [{
        "border-l": [o]
      }],
      /**
       * Divide Color
       * @see https://tailwindcss.com/docs/divide-color
       */
      "divide-color": [{
        divide: [o]
      }],
      /**
       * Outline Style
       * @see https://tailwindcss.com/docs/outline-style
       */
      "outline-style": [{
        outline: ["", ...ct()]
      }],
      /**
       * Outline Offset
       * @see https://tailwindcss.com/docs/outline-offset
       */
      "outline-offset": [{
        "outline-offset": [kt, D]
      }],
      /**
       * Outline Width
       * @see https://tailwindcss.com/docs/outline-width
       */
      "outline-w": [{
        outline: [kt, Dt]
      }],
      /**
       * Outline Color
       * @see https://tailwindcss.com/docs/outline-color
       */
      "outline-color": [{
        outline: [e]
      }],
      /**
       * Ring Width
       * @see https://tailwindcss.com/docs/ring-width
       */
      "ring-w": [{
        ring: Ee()
      }],
      /**
       * Ring Width Inset
       * @see https://tailwindcss.com/docs/ring-width
       */
      "ring-w-inset": ["ring-inset"],
      /**
       * Ring Color
       * @see https://tailwindcss.com/docs/ring-color
       */
      "ring-color": [{
        ring: [e]
      }],
      /**
       * Ring Opacity
       * @see https://tailwindcss.com/docs/ring-opacity
       */
      "ring-opacity": [{
        "ring-opacity": [p]
      }],
      /**
       * Ring Offset Width
       * @see https://tailwindcss.com/docs/ring-offset-width
       */
      "ring-offset-w": [{
        "ring-offset": [kt, Dt]
      }],
      /**
       * Ring Offset Color
       * @see https://tailwindcss.com/docs/ring-offset-color
       */
      "ring-offset-color": [{
        "ring-offset": [e]
      }],
      // Effects
      /**
       * Box Shadow
       * @see https://tailwindcss.com/docs/box-shadow
       */
      shadow: [{
        shadow: ["", "inner", "none", $t, kv]
      }],
      /**
       * Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow-color
       */
      "shadow-color": [{
        shadow: [Vn]
      }],
      /**
       * Opacity
       * @see https://tailwindcss.com/docs/opacity
       */
      opacity: [{
        opacity: [p]
      }],
      /**
       * Mix Blend Mode
       * @see https://tailwindcss.com/docs/mix-blend-mode
       */
      "mix-blend": [{
        "mix-blend": [...xt(), "plus-lighter", "plus-darker"]
      }],
      /**
       * Background Blend Mode
       * @see https://tailwindcss.com/docs/background-blend-mode
       */
      "bg-blend": [{
        "bg-blend": xt()
      }],
      // Filters
      /**
       * Filter
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/filter
       */
      filter: [{
        filter: ["", "none"]
      }],
      /**
       * Blur
       * @see https://tailwindcss.com/docs/blur
       */
      blur: [{
        blur: [r]
      }],
      /**
       * Brightness
       * @see https://tailwindcss.com/docs/brightness
       */
      brightness: [{
        brightness: [n]
      }],
      /**
       * Contrast
       * @see https://tailwindcss.com/docs/contrast
       */
      contrast: [{
        contrast: [a]
      }],
      /**
       * Drop Shadow
       * @see https://tailwindcss.com/docs/drop-shadow
       */
      "drop-shadow": [{
        "drop-shadow": ["", "none", $t, D]
      }],
      /**
       * Grayscale
       * @see https://tailwindcss.com/docs/grayscale
       */
      grayscale: [{
        grayscale: [u]
      }],
      /**
       * Hue Rotate
       * @see https://tailwindcss.com/docs/hue-rotate
       */
      "hue-rotate": [{
        "hue-rotate": [g]
      }],
      /**
       * Invert
       * @see https://tailwindcss.com/docs/invert
       */
      invert: [{
        invert: [h]
      }],
      /**
       * Saturate
       * @see https://tailwindcss.com/docs/saturate
       */
      saturate: [{
        saturate: [m]
      }],
      /**
       * Sepia
       * @see https://tailwindcss.com/docs/sepia
       */
      sepia: [{
        sepia: [C]
      }],
      /**
       * Backdrop Filter
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/backdrop-filter
       */
      "backdrop-filter": [{
        "backdrop-filter": ["", "none"]
      }],
      /**
       * Backdrop Blur
       * @see https://tailwindcss.com/docs/backdrop-blur
       */
      "backdrop-blur": [{
        "backdrop-blur": [r]
      }],
      /**
       * Backdrop Brightness
       * @see https://tailwindcss.com/docs/backdrop-brightness
       */
      "backdrop-brightness": [{
        "backdrop-brightness": [n]
      }],
      /**
       * Backdrop Contrast
       * @see https://tailwindcss.com/docs/backdrop-contrast
       */
      "backdrop-contrast": [{
        "backdrop-contrast": [a]
      }],
      /**
       * Backdrop Grayscale
       * @see https://tailwindcss.com/docs/backdrop-grayscale
       */
      "backdrop-grayscale": [{
        "backdrop-grayscale": [u]
      }],
      /**
       * Backdrop Hue Rotate
       * @see https://tailwindcss.com/docs/backdrop-hue-rotate
       */
      "backdrop-hue-rotate": [{
        "backdrop-hue-rotate": [g]
      }],
      /**
       * Backdrop Invert
       * @see https://tailwindcss.com/docs/backdrop-invert
       */
      "backdrop-invert": [{
        "backdrop-invert": [h]
      }],
      /**
       * Backdrop Opacity
       * @see https://tailwindcss.com/docs/backdrop-opacity
       */
      "backdrop-opacity": [{
        "backdrop-opacity": [p]
      }],
      /**
       * Backdrop Saturate
       * @see https://tailwindcss.com/docs/backdrop-saturate
       */
      "backdrop-saturate": [{
        "backdrop-saturate": [m]
      }],
      /**
       * Backdrop Sepia
       * @see https://tailwindcss.com/docs/backdrop-sepia
       */
      "backdrop-sepia": [{
        "backdrop-sepia": [C]
      }],
      // Tables
      /**
       * Border Collapse
       * @see https://tailwindcss.com/docs/border-collapse
       */
      "border-collapse": [{
        border: ["collapse", "separate"]
      }],
      /**
       * Border Spacing
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing": [{
        "border-spacing": [l]
      }],
      /**
       * Border Spacing X
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing-x": [{
        "border-spacing-x": [l]
      }],
      /**
       * Border Spacing Y
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing-y": [{
        "border-spacing-y": [l]
      }],
      /**
       * Table Layout
       * @see https://tailwindcss.com/docs/table-layout
       */
      "table-layout": [{
        table: ["auto", "fixed"]
      }],
      /**
       * Caption Side
       * @see https://tailwindcss.com/docs/caption-side
       */
      caption: [{
        caption: ["top", "bottom"]
      }],
      // Transitions and Animation
      /**
       * Tranisition Property
       * @see https://tailwindcss.com/docs/transition-property
       */
      transition: [{
        transition: ["none", "all", "", "colors", "opacity", "shadow", "transform", D]
      }],
      /**
       * Transition Duration
       * @see https://tailwindcss.com/docs/transition-duration
       */
      duration: [{
        duration: B()
      }],
      /**
       * Transition Timing Function
       * @see https://tailwindcss.com/docs/transition-timing-function
       */
      ease: [{
        ease: ["linear", "in", "out", "in-out", D]
      }],
      /**
       * Transition Delay
       * @see https://tailwindcss.com/docs/transition-delay
       */
      delay: [{
        delay: B()
      }],
      /**
       * Animation
       * @see https://tailwindcss.com/docs/animation
       */
      animate: [{
        animate: ["none", "spin", "ping", "pulse", "bounce", D]
      }],
      // Transforms
      /**
       * Transform
       * @see https://tailwindcss.com/docs/transform
       */
      transform: [{
        transform: ["", "gpu", "none"]
      }],
      /**
       * Scale
       * @see https://tailwindcss.com/docs/scale
       */
      scale: [{
        scale: [k]
      }],
      /**
       * Scale X
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-x": [{
        "scale-x": [k]
      }],
      /**
       * Scale Y
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-y": [{
        "scale-y": [k]
      }],
      /**
       * Rotate
       * @see https://tailwindcss.com/docs/rotate
       */
      rotate: [{
        rotate: [Wn, D]
      }],
      /**
       * Translate X
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-x": [{
        "translate-x": [P]
      }],
      /**
       * Translate Y
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-y": [{
        "translate-y": [P]
      }],
      /**
       * Skew X
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-x": [{
        "skew-x": [_]
      }],
      /**
       * Skew Y
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-y": [{
        "skew-y": [_]
      }],
      /**
       * Transform Origin
       * @see https://tailwindcss.com/docs/transform-origin
       */
      "transform-origin": [{
        origin: ["center", "top", "top-right", "right", "bottom-right", "bottom", "bottom-left", "left", "top-left", D]
      }],
      // Interactivity
      /**
       * Accent Color
       * @see https://tailwindcss.com/docs/accent-color
       */
      accent: [{
        accent: ["auto", e]
      }],
      /**
       * Appearance
       * @see https://tailwindcss.com/docs/appearance
       */
      appearance: [{
        appearance: ["none", "auto"]
      }],
      /**
       * Cursor
       * @see https://tailwindcss.com/docs/cursor
       */
      cursor: [{
        cursor: ["auto", "default", "pointer", "wait", "text", "move", "help", "not-allowed", "none", "context-menu", "progress", "cell", "crosshair", "vertical-text", "alias", "copy", "no-drop", "grab", "grabbing", "all-scroll", "col-resize", "row-resize", "n-resize", "e-resize", "s-resize", "w-resize", "ne-resize", "nw-resize", "se-resize", "sw-resize", "ew-resize", "ns-resize", "nesw-resize", "nwse-resize", "zoom-in", "zoom-out", D]
      }],
      /**
       * Caret Color
       * @see https://tailwindcss.com/docs/just-in-time-mode#caret-color-utilities
       */
      "caret-color": [{
        caret: [e]
      }],
      /**
       * Pointer Events
       * @see https://tailwindcss.com/docs/pointer-events
       */
      "pointer-events": [{
        "pointer-events": ["none", "auto"]
      }],
      /**
       * Resize
       * @see https://tailwindcss.com/docs/resize
       */
      resize: [{
        resize: ["none", "y", "x", ""]
      }],
      /**
       * Scroll Behavior
       * @see https://tailwindcss.com/docs/scroll-behavior
       */
      "scroll-behavior": [{
        scroll: ["auto", "smooth"]
      }],
      /**
       * Scroll Margin
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-m": [{
        "scroll-m": U()
      }],
      /**
       * Scroll Margin X
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mx": [{
        "scroll-mx": U()
      }],
      /**
       * Scroll Margin Y
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-my": [{
        "scroll-my": U()
      }],
      /**
       * Scroll Margin Start
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ms": [{
        "scroll-ms": U()
      }],
      /**
       * Scroll Margin End
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-me": [{
        "scroll-me": U()
      }],
      /**
       * Scroll Margin Top
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mt": [{
        "scroll-mt": U()
      }],
      /**
       * Scroll Margin Right
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mr": [{
        "scroll-mr": U()
      }],
      /**
       * Scroll Margin Bottom
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mb": [{
        "scroll-mb": U()
      }],
      /**
       * Scroll Margin Left
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ml": [{
        "scroll-ml": U()
      }],
      /**
       * Scroll Padding
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-p": [{
        "scroll-p": U()
      }],
      /**
       * Scroll Padding X
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-px": [{
        "scroll-px": U()
      }],
      /**
       * Scroll Padding Y
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-py": [{
        "scroll-py": U()
      }],
      /**
       * Scroll Padding Start
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-ps": [{
        "scroll-ps": U()
      }],
      /**
       * Scroll Padding End
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pe": [{
        "scroll-pe": U()
      }],
      /**
       * Scroll Padding Top
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pt": [{
        "scroll-pt": U()
      }],
      /**
       * Scroll Padding Right
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pr": [{
        "scroll-pr": U()
      }],
      /**
       * Scroll Padding Bottom
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pb": [{
        "scroll-pb": U()
      }],
      /**
       * Scroll Padding Left
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pl": [{
        "scroll-pl": U()
      }],
      /**
       * Scroll Snap Align
       * @see https://tailwindcss.com/docs/scroll-snap-align
       */
      "snap-align": [{
        snap: ["start", "end", "center", "align-none"]
      }],
      /**
       * Scroll Snap Stop
       * @see https://tailwindcss.com/docs/scroll-snap-stop
       */
      "snap-stop": [{
        snap: ["normal", "always"]
      }],
      /**
       * Scroll Snap Type
       * @see https://tailwindcss.com/docs/scroll-snap-type
       */
      "snap-type": [{
        snap: ["none", "x", "y", "both"]
      }],
      /**
       * Scroll Snap Type Strictness
       * @see https://tailwindcss.com/docs/scroll-snap-type
       */
      "snap-strictness": [{
        snap: ["mandatory", "proximity"]
      }],
      /**
       * Touch Action
       * @see https://tailwindcss.com/docs/touch-action
       */
      touch: [{
        touch: ["auto", "none", "manipulation"]
      }],
      /**
       * Touch Action X
       * @see https://tailwindcss.com/docs/touch-action
       */
      "touch-x": [{
        "touch-pan": ["x", "left", "right"]
      }],
      /**
       * Touch Action Y
       * @see https://tailwindcss.com/docs/touch-action
       */
      "touch-y": [{
        "touch-pan": ["y", "up", "down"]
      }],
      /**
       * Touch Action Pinch Zoom
       * @see https://tailwindcss.com/docs/touch-action
       */
      "touch-pz": ["touch-pinch-zoom"],
      /**
       * User Select
       * @see https://tailwindcss.com/docs/user-select
       */
      select: [{
        select: ["none", "text", "all", "auto"]
      }],
      /**
       * Will Change
       * @see https://tailwindcss.com/docs/will-change
       */
      "will-change": [{
        "will-change": ["auto", "scroll", "contents", "transform", D]
      }],
      // SVG
      /**
       * Fill
       * @see https://tailwindcss.com/docs/fill
       */
      fill: [{
        fill: [e, "none"]
      }],
      /**
       * Stroke Width
       * @see https://tailwindcss.com/docs/stroke-width
       */
      "stroke-w": [{
        stroke: [kt, Dt, Ll]
      }],
      /**
       * Stroke
       * @see https://tailwindcss.com/docs/stroke
       */
      stroke: [{
        stroke: [e, "none"]
      }],
      // Accessibility
      /**
       * Screen Readers
       * @see https://tailwindcss.com/docs/screen-readers
       */
      sr: ["sr-only", "not-sr-only"],
      /**
       * Forced Color Adjust
       * @see https://tailwindcss.com/docs/forced-color-adjust
       */
      "forced-color-adjust": [{
        "forced-color-adjust": ["auto", "none"]
      }]
    },
    conflictingClassGroups: {
      overflow: ["overflow-x", "overflow-y"],
      overscroll: ["overscroll-x", "overscroll-y"],
      inset: ["inset-x", "inset-y", "start", "end", "top", "right", "bottom", "left"],
      "inset-x": ["right", "left"],
      "inset-y": ["top", "bottom"],
      flex: ["basis", "grow", "shrink"],
      gap: ["gap-x", "gap-y"],
      p: ["px", "py", "ps", "pe", "pt", "pr", "pb", "pl"],
      px: ["pr", "pl"],
      py: ["pt", "pb"],
      m: ["mx", "my", "ms", "me", "mt", "mr", "mb", "ml"],
      mx: ["mr", "ml"],
      my: ["mt", "mb"],
      size: ["w", "h"],
      "font-size": ["leading"],
      "fvn-normal": ["fvn-ordinal", "fvn-slashed-zero", "fvn-figure", "fvn-spacing", "fvn-fraction"],
      "fvn-ordinal": ["fvn-normal"],
      "fvn-slashed-zero": ["fvn-normal"],
      "fvn-figure": ["fvn-normal"],
      "fvn-spacing": ["fvn-normal"],
      "fvn-fraction": ["fvn-normal"],
      "line-clamp": ["display", "overflow"],
      rounded: ["rounded-s", "rounded-e", "rounded-t", "rounded-r", "rounded-b", "rounded-l", "rounded-ss", "rounded-se", "rounded-ee", "rounded-es", "rounded-tl", "rounded-tr", "rounded-br", "rounded-bl"],
      "rounded-s": ["rounded-ss", "rounded-es"],
      "rounded-e": ["rounded-se", "rounded-ee"],
      "rounded-t": ["rounded-tl", "rounded-tr"],
      "rounded-r": ["rounded-tr", "rounded-br"],
      "rounded-b": ["rounded-br", "rounded-bl"],
      "rounded-l": ["rounded-tl", "rounded-bl"],
      "border-spacing": ["border-spacing-x", "border-spacing-y"],
      "border-w": ["border-w-s", "border-w-e", "border-w-t", "border-w-r", "border-w-b", "border-w-l"],
      "border-w-x": ["border-w-r", "border-w-l"],
      "border-w-y": ["border-w-t", "border-w-b"],
      "border-color": ["border-color-s", "border-color-e", "border-color-t", "border-color-r", "border-color-b", "border-color-l"],
      "border-color-x": ["border-color-r", "border-color-l"],
      "border-color-y": ["border-color-t", "border-color-b"],
      "scroll-m": ["scroll-mx", "scroll-my", "scroll-ms", "scroll-me", "scroll-mt", "scroll-mr", "scroll-mb", "scroll-ml"],
      "scroll-mx": ["scroll-mr", "scroll-ml"],
      "scroll-my": ["scroll-mt", "scroll-mb"],
      "scroll-p": ["scroll-px", "scroll-py", "scroll-ps", "scroll-pe", "scroll-pt", "scroll-pr", "scroll-pb", "scroll-pl"],
      "scroll-px": ["scroll-pr", "scroll-pl"],
      "scroll-py": ["scroll-pt", "scroll-pb"],
      touch: ["touch-x", "touch-y", "touch-pz"],
      "touch-x": ["touch"],
      "touch-y": ["touch"],
      "touch-pz": ["touch"]
    },
    conflictingClassGroupModifiers: {
      "font-size": ["leading"]
    }
  };
}, Nv = /* @__PURE__ */ sv(Ev);
function wr(...e) {
  return Nv(Gg(e));
}
const jv = 3e3, wi = {
  秒顶一: { bg: "#ffeb3b", fg: "#000" },
  龙头: { bg: "#f44336", fg: "#fff" },
  加强: { bg: "#ff5722", fg: "#fff" },
  弹性: { bg: "#ff9800", fg: "#000" },
  后排: { bg: "#9e9e9e", fg: "#fff" },
  顶板: { bg: "#e040fb", fg: "#fff" },
  卡位: { bg: "#4fc3f7", fg: "#000" },
  炸: { bg: "#4682b4", fg: "#fff" },
  跌停: { bg: "#4caf50", fg: "#fff" }
}, _v = {
  zt: "border-bull/30 bg-bull/10",
  zb: "border-warning/35 bg-warning/10",
  dt: "border-bear/30 bg-bear/10"
}, Pv = {
  zt: "涨停",
  zb: "炸板",
  dt: "跌停"
}, Kn = (e) => `${e.symbol}-${e.type}`;
function ki(e) {
  const t = Math.floor(e / 60), r = e % 60;
  return `${String(t).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}
function zv(e) {
  return !e || !Number.isFinite(e) ? "—" : e >= 1e8 ? `${(e / 1e8).toFixed(2)}亿` : e >= 1e4 ? `${(e / 1e4).toFixed(0)}万` : e.toFixed(0);
}
function Mv({
  day: e,
  onStockClick: t
}) {
  const [r, n] = I.useState(!1), [o, i] = I.useState("all"), [l, s] = I.useState(null), [a, u] = I.useState(null), [g, h] = I.useState(null), [v, y] = I.useState(!1), [w, x] = I.useState(2), S = g != null, p = I.useRef(null), { data: d, isError: m, refetch: k, isFetching: C } = Ha({
    queryKey: ["limit-pool-timeline", e ?? "today"],
    queryFn: () => fp.limitPoolTimeline(e),
    // 非盘中(收盘后 / 历史日期)页面停留久了没必要 3s 打一次, 交给服务端 30s 缓存兜底。
    // 回放期间必须停轮询: 数据一变时间点数量就变, 进度/画面会跳。
    refetchInterval: r || v || S ? !1 : jv,
    staleTime: 0,
    placeholderData: (z) => z,
    retry: 1
  }), _ = d ? !d.in_session : !1, N = d?.events ?? [], P = I.useMemo(
    () => a ? N.find((z) => Kn(z) === a.key) ?? null : null,
    [a, N]
  ), R = I.useMemo(() => {
    const z = /* @__PURE__ */ new Set();
    for (const H of N) z.add(H.time);
    return Array.from(z).sort((H, ee) => H - ee);
  }, [N]), T = I.useMemo(() => {
    if (g == null) return N;
    if (g <= 0) return [];
    const z = R[Math.min(g, R.length) - 1];
    return N.filter((H) => H.time <= z);
  }, [N, g, R]), Y = I.useMemo(() => {
    const z = /* @__PURE__ */ new Set();
    for (const ee of T) z.add(ee.time);
    const H = Array.from(z);
    return S ? H.sort((ee, G) => ee - G) : H.sort((ee, G) => G - ee);
  }, [T, S]);
  I.useEffect(() => {
    if (!v || R.length === 0) return;
    const z = Math.max(120, Math.round(900 / w)), H = window.setInterval(() => {
      h((ee) => Math.min((ee ?? 0) + 1, R.length));
    }, z);
    return () => window.clearInterval(H);
  }, [v, w, R.length]), I.useEffect(() => {
    v && g != null && g >= R.length && y(!1);
  }, [v, g, R.length]), I.useEffect(() => {
    if (!v) return;
    const z = p.current;
    z && (z.scrollLeft = z.scrollWidth);
  }, [v, g]), I.useEffect(() => {
    d?.in_session && g != null && (y(!1), h(null));
  }, [d?.in_session, g]);
  const U = () => {
    if (R.length !== 0) {
      if (v) {
        y(!1);
        return;
      }
      (g == null || g >= R.length) && h(0), y(!0);
    }
  }, Ee = () => {
    y(!1), h(null);
  }, Me = (z) => {
    y(!1), h(z >= R.length ? R.length : z);
  }, Br = Math.max(1, d?.rows?.zt ?? 1), ct = Math.max(1, d?.rows?.bt ?? 1), xt = I.useMemo(() => {
    const z = /* @__PURE__ */ new Map(), H = /* @__PURE__ */ new Map();
    for (const ee of T) {
      const G = ee.type === "zt" ? z : H, Hr = `${ee.time}:${ee.row}`, Va = G.get(Hr);
      Va ? Va.push(ee) : G.set(Hr, [ee]);
    }
    return { zt: z, bt: H };
  }, [T]), E = I.useMemo(
    () => d?.periods.find((z) => z.id === o) ?? null,
    [d?.periods, o]
  ), O = (z) => !!(E && !(z.time >= E.t0 && z.time < E.t1) || l && z.reason !== l), L = (d?.periods ?? []).filter((z) => z.count > 0), B = d?.sectors ?? [], se = d?.counts, Ot = (z) => {
    s((H) => H === z ? null : z);
  }, wt = I.useMemo(() => {
    if (!S) return null;
    let z = 0, H = 0, ee = 0;
    for (const G of T)
      G.type === "zt" ? z++ : G.type === "zb" ? H++ : ee++;
    return { zt: z, zb: H, dt: ee };
  }, [S, T]), $e = R.length, Ge = g == null ? $e : Math.min(g, $e), Lt = $e === 0 ? "--:--" : Ge <= 0 ? ki(R[0]) : ki(R[Ge - 1]), gr = wt ?? se, xp = gr ? S ? `回放至 ${Lt} · 涨停 ${gr.zt} · 炸板 ${gr.zb} · 跌停 ${gr.dt}（当时累计）` : `全天 涨停 ${gr.zt} · 炸板 ${gr.zb} · 跌停 ${gr.dt}` : void 0;
  return /* @__PURE__ */ c.jsxs("section", { className: "flex flex-col rounded-card border border-border bg-surface/80 p-1.5 shadow-[0_1px_2px_hsl(var(--border)/0.4)] backdrop-blur-sm", children: [
    /* @__PURE__ */ c.jsxs("div", { className: "mb-1.5 flex items-center justify-between gap-2", children: [
      /* @__PURE__ */ c.jsxs("div", { className: "flex items-center gap-1.5", children: [
        /* @__PURE__ */ c.jsx("span", { className: "h-3 w-0.5 rounded-full bg-gradient-to-b from-accent to-accent/30" }),
        /* @__PURE__ */ c.jsx(dp, { className: "h-3.5 w-3.5 text-accent" }),
        /* @__PURE__ */ c.jsx("h2", { className: "text-xs font-semibold text-foreground", children: "涨跌停时间轴" }),
        /* @__PURE__ */ c.jsx("span", { className: "rounded bg-accent/10 px-1 py-px text-[9px] text-accent", title: "东方财富官方涨跌停池口径", children: "东财官方池" }),
        /* @__PURE__ */ c.jsx("span", { className: "font-mono text-[10px] text-muted", children: xp }),
        d?.stale && /* @__PURE__ */ c.jsxs("span", { className: "inline-flex items-center gap-0.5 rounded bg-warning/10 px-1 py-px text-[9px] text-warning", children: [
          /* @__PURE__ */ c.jsx(Wg, { className: "h-2.5 w-2.5" }),
          "上游超时"
        ] })
      ] }),
      /* @__PURE__ */ c.jsxs("div", { className: "flex items-center gap-1.5 text-[10px] text-muted", children: [
        /* @__PURE__ */ c.jsx("span", { className: "font-mono", children: d?.date || "—" }),
        /* @__PURE__ */ c.jsx("span", { className: wr("tabular-nums", r || S ? "text-warning" : "text-accent"), children: S ? v ? "回放中" : "回放已暂停" : r ? "已暂停" : `${d?.server_time ?? "--:--:--"} · 3s` }),
        /* @__PURE__ */ c.jsx(
          "button",
          {
            onClick: () => n((z) => !z),
            className: "inline-flex h-4 w-4 items-center justify-center rounded text-muted transition-colors hover:bg-elevated hover:text-foreground",
            title: r ? "恢复自动刷新" : "暂停自动刷新",
            children: r ? /* @__PURE__ */ c.jsx(mc, { className: "h-2.5 w-2.5" }) : /* @__PURE__ */ c.jsx(hc, { className: "h-2.5 w-2.5" })
          }
        ),
        /* @__PURE__ */ c.jsx(
          "button",
          {
            onClick: () => k(),
            className: "inline-flex h-4 w-4 items-center justify-center rounded text-muted transition-colors hover:bg-elevated hover:text-foreground",
            title: "立即刷新",
            children: /* @__PURE__ */ c.jsx(Ug, { className: wr("h-2.5 w-2.5", C && "animate-spin") })
          }
        )
      ] })
    ] }),
    _ && /* @__PURE__ */ c.jsxs("div", { className: "mb-1 flex items-center gap-1.5 rounded border border-border/60 bg-elevated/30 px-1.5 py-1", children: [
      /* @__PURE__ */ c.jsxs(
        "button",
        {
          onClick: U,
          disabled: $e === 0,
          className: "inline-flex shrink-0 items-center gap-1 rounded-btn border border-accent/40 bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-accent transition-colors hover:bg-accent/15 disabled:cursor-not-allowed disabled:opacity-40",
          title: v ? "暂停回放" : g == null ? "回放当日涨跌停 / 炸板" : g >= $e ? "从头重播" : "继续回放",
          children: [
            v ? /* @__PURE__ */ c.jsx(hc, { className: "h-2.5 w-2.5" }) : /* @__PURE__ */ c.jsx(mc, { className: "h-2.5 w-2.5" }),
            v ? "暂停" : g == null ? "回放" : g >= $e ? "重播" : "继续"
          ]
        }
      ),
      /* @__PURE__ */ c.jsx(
        "input",
        {
          type: "range",
          min: 0,
          max: Math.max($e, 1),
          step: 1,
          value: Ge,
          onChange: (z) => Me(Number(z.target.value)),
          disabled: $e === 0,
          title: "拖动可跳到任意时刻",
          className: "h-1 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-border/70 disabled:cursor-not-allowed",
          style: { accentColor: "hsl(var(--accent))" }
        }
      ),
      /* @__PURE__ */ c.jsx("span", { className: "shrink-0 font-mono text-[10px] tabular-nums text-accent", children: Lt }),
      /* @__PURE__ */ c.jsxs("span", { className: "shrink-0 font-mono text-[9px] tabular-nums text-muted", children: [
        Ge,
        "/",
        $e
      ] }),
      /* @__PURE__ */ c.jsxs(
        "button",
        {
          onClick: () => x((z) => z === 1 ? 2 : z === 2 ? 4 : 1),
          className: "shrink-0 rounded border border-border px-1 text-[9px] tabular-nums text-muted transition-colors hover:text-foreground",
          title: "回放速度 (每个时间点停留时长)",
          children: [
            w,
            "x"
          ]
        }
      ),
      S && /* @__PURE__ */ c.jsxs(
        "button",
        {
          onClick: Ee,
          className: "inline-flex shrink-0 items-center gap-0.5 rounded border border-border px-1 text-[9px] text-muted transition-colors hover:text-foreground",
          title: "退出回放, 恢复全天视图",
          children: [
            /* @__PURE__ */ c.jsx(Bg, { className: "h-2.5 w-2.5" }),
            "全天"
          ]
        }
      )
    ] }),
    L.length > 0 && /* @__PURE__ */ c.jsxs("div", { className: "mb-1 flex flex-wrap items-center gap-1", children: [
      /* @__PURE__ */ c.jsx("span", { className: "mr-0.5 text-[9px] text-muted", children: "时段" }),
      [...L].reverse().map((z) => /* @__PURE__ */ c.jsxs(
        "button",
        {
          onClick: () => i((H) => H === z.id ? "all" : z.id),
          className: wr(
            "inline-flex items-center gap-1 rounded-full border px-1.5 py-px text-[10px] transition-colors",
            o === z.id ? "border-accent/45 bg-accent/15 text-accent" : "border-border bg-elevated/40 text-muted hover:text-foreground"
          ),
          children: [
            /* @__PURE__ */ c.jsx("span", { className: "font-mono", children: z.label }),
            /* @__PURE__ */ c.jsx("span", { className: "text-[9px] text-bull", children: z.count })
          ]
        },
        z.id
      )),
      /* @__PURE__ */ c.jsxs(
        "button",
        {
          onClick: () => i("all"),
          className: wr(
            "inline-flex items-center gap-1 rounded-full border px-1.5 py-px text-[10px] transition-colors",
            o === "all" ? "border-accent/45 bg-accent/15 text-accent" : "border-border bg-elevated/40 text-muted hover:text-foreground"
          ),
          children: [
            "全部",
            /* @__PURE__ */ c.jsx("span", { className: "text-[9px] text-bull", children: se?.total ?? 0 })
          ]
        }
      )
    ] }),
    B.length > 0 && /* @__PURE__ */ c.jsxs("div", { className: "mb-1 flex flex-wrap items-center gap-1", children: [
      /* @__PURE__ */ c.jsx("span", { className: "mr-0.5 text-[9px] text-muted", children: "题材" }),
      l && /* @__PURE__ */ c.jsxs(
        "button",
        {
          onClick: () => s(null),
          className: "inline-flex items-center gap-0.5 rounded-full border border-danger/35 bg-danger/10 px-1.5 py-px text-[10px] text-danger",
          children: [
            /* @__PURE__ */ c.jsx(Vg, { className: "h-2.5 w-2.5" }),
            "清除"
          ]
        }
      ),
      B.map((z, H) => /* @__PURE__ */ c.jsxs(
        "button",
        {
          onClick: () => Ot(z.name),
          className: wr(
            "inline-flex items-center gap-1 rounded-full border px-1.5 py-px text-[10px] transition-colors",
            l === z.name ? "border-danger/45 bg-danger/15 text-danger" : "border-border bg-elevated/40 hover:text-foreground",
            l === z.name ? "" : H < 3 ? "text-danger/85" : "text-muted"
          ),
          title: `涨停 ${z.zt} · 炸板 ${z.zb} · 跌停 ${z.dt}`,
          children: [
            H < 3 && l !== z.name && /* @__PURE__ */ c.jsx(cp, { className: "h-2.5 w-2.5" }),
            z.name,
            /* @__PURE__ */ c.jsx("span", { className: "text-[9px] text-bull", children: z.total })
          ]
        },
        z.name
      ))
    ] }),
    /* @__PURE__ */ c.jsx(
      "div",
      {
        ref: p,
        onScroll: () => u(null),
        className: "relative min-h-[9rem] overflow-x-auto overflow-y-visible rounded border border-border/60 bg-base/30",
        children: T.length === 0 ? /* @__PURE__ */ c.jsx("div", { className: "flex h-24 flex-col items-center justify-center gap-1 text-[11px] text-muted", children: S ? /* @__PURE__ */ c.jsx("span", { children: "回放已就绪 · 点「播放」或拖动进度条" }) : m ? /* @__PURE__ */ c.jsxs(c.Fragment, { children: [
          /* @__PURE__ */ c.jsx("span", { className: "text-danger", children: "时间轴数据加载失败" }),
          /* @__PURE__ */ c.jsx("span", { className: "text-[10px]", children: "东财板池接口不可达, 稍后自动重试" })
        ] }) : /* @__PURE__ */ c.jsxs(c.Fragment, { children: [
          /* @__PURE__ */ c.jsx("span", { children: d ? "当前日期无涨跌停数据" : "加载中…" }),
          d?.errors && d.errors.length > 0 && /* @__PURE__ */ c.jsxs("span", { className: "text-[10px]", children: [
            "上游返回异常: ",
            d.errors.join("/")
          ] })
        ] }) }) : /* @__PURE__ */ c.jsx("table", { className: "w-full min-w-max border-collapse text-[10px]", children: /* @__PURE__ */ c.jsxs("tbody", { children: [
          Array.from({ length: Br }, (z, H) => /* @__PURE__ */ c.jsxs("tr", { children: [
            /* @__PURE__ */ c.jsx(
              "th",
              {
                className: "sticky left-0 z-10 w-12 border-r border-border/60 bg-surface px-1 text-[9px] font-medium text-bull",
                scope: "row",
                children: H === 0 ? "涨停" : ""
              }
            ),
            Y.map((ee) => /* @__PURE__ */ c.jsx(
              "td",
              {
                className: "min-w-[74px] border-r border-border/40 align-top p-0.5",
                children: /* @__PURE__ */ c.jsx("div", { className: "flex flex-col gap-0.5", children: (xt.zt.get(`${ee}:${H}`) ?? []).map((G) => /* @__PURE__ */ c.jsx(
                  xc,
                  {
                    ev: G,
                    dim: O(G),
                    onHover: (Hr) => u({ key: Kn(G), anchor: Hr }),
                    onLeave: () => u(null),
                    onClick: () => Ot(G.reason),
                    onNameClick: () => G.symbol && t?.(G.symbol, G.name)
                  },
                  Kn(G)
                )) })
              },
              `zt-${H}-${ee}`
            ))
          ] }, `zt-${H}`)),
          /* @__PURE__ */ c.jsxs("tr", { children: [
            /* @__PURE__ */ c.jsx(
              "th",
              {
                className: "sticky left-0 z-10 w-12 border-y border-accent/40 bg-surface px-1 text-[9px] font-medium text-accent",
                scope: "row",
                children: "时间"
              }
            ),
            Y.map((z) => /* @__PURE__ */ c.jsx(
              "td",
              {
                className: "border-y border-accent/40 border-r border-r-border/40 bg-elevated/50 px-0.5 py-0.5 text-center font-mono text-[10px] text-secondary",
                children: ki(z)
              },
              `t-${z}`
            ))
          ] }),
          Array.from({ length: ct }, (z, H) => /* @__PURE__ */ c.jsxs("tr", { children: [
            /* @__PURE__ */ c.jsx(
              "th",
              {
                className: "sticky left-0 z-10 w-12 border-r border-border/60 bg-surface px-1 text-[9px] font-medium text-warning",
                scope: "row",
                children: H === 0 ? "炸/跌" : ""
              }
            ),
            Y.map((ee) => /* @__PURE__ */ c.jsx(
              "td",
              {
                className: "min-w-[74px] border-r border-border/40 align-top p-0.5",
                children: /* @__PURE__ */ c.jsx("div", { className: "flex flex-col gap-0.5", children: (xt.bt.get(`${ee}:${H}`) ?? []).map((G) => /* @__PURE__ */ c.jsx(
                  xc,
                  {
                    ev: G,
                    dim: O(G),
                    onHover: (Hr) => u({ key: Kn(G), anchor: Hr }),
                    onLeave: () => u(null),
                    onClick: () => Ot(G.reason),
                    onNameClick: () => G.symbol && t?.(G.symbol, G.name)
                  },
                  Kn(G)
                )) })
              },
              `bt-${H}-${ee}`
            ))
          ] }, `bt-${H}`))
        ] }) })
      }
    ),
    /* @__PURE__ */ c.jsxs("div", { className: "mt-1 flex items-center justify-between gap-2 text-[9px] text-muted", children: [
      /* @__PURE__ */ c.jsx("span", { children: S ? `回放中 · 左=早 右=晚 · ${Lt}` : "左=最新 · 无事件的时段不占列" }),
      /* @__PURE__ */ c.jsx("span", { className: "font-mono", children: d ? `${Y.length} 个时间点 / ${T.length} 条` : "" })
    ] }),
    a && P && /* @__PURE__ */ c.jsx(Rv, { ev: P, anchor: a.anchor })
  ] });
}
function xc({
  ev: e,
  dim: t,
  onHover: r,
  onLeave: n,
  onClick: o,
  onNameClick: i
}) {
  const l = e.tag ? wi[e.tag] : void 0;
  return /* @__PURE__ */ c.jsxs(
    "span",
    {
      className: wr(
        "inline-flex w-fit max-w-full items-center gap-0.5 overflow-hidden rounded border px-0.5 py-px transition-opacity",
        _v[e.type],
        t && "pointer-events-none opacity-[0.12]"
      ),
      onMouseEnter: (s) => r(s.currentTarget.getBoundingClientRect()),
      onMouseLeave: n,
      children: [
        /* @__PURE__ */ c.jsx(
          "button",
          {
            onClick: (s) => {
              s.stopPropagation(), i();
            },
            className: "max-w-[4.5rem] truncate text-[10px] font-medium text-foreground/90 hover:text-accent",
            children: e.name
          }
        ),
        e.tag && /* @__PURE__ */ c.jsx(
          "button",
          {
            onClick: (s) => {
              s.stopPropagation(), o();
            },
            className: "shrink-0 rounded px-0.5 text-[8px] font-bold leading-[1.3]",
            style: l ? { background: l.bg, color: l.fg } : void 0,
            title: `按题材「${e.reason}」筛选`,
            children: e.tag
          }
        )
      ]
    }
  );
}
function Rv({ ev: e, anchor: t }) {
  const r = I.useRef(null);
  return I.useLayoutEffect(() => {
    const n = r.current;
    if (!n) return;
    const o = 8, i = 6, l = n.offsetWidth, s = n.offsetHeight;
    let a = t.top - s - i;
    a < o && (a = t.bottom + i), a + s > window.innerHeight - o && (a = Math.max(o, window.innerHeight - s - o));
    let u = t.left;
    u + l > window.innerWidth - o && (u = window.innerWidth - l - o), u = Math.max(o, u), n.style.top = `${Math.round(a)}px`, n.style.left = `${Math.round(u)}px`, n.style.visibility = "visible";
  }, [t, e]), Kf.createPortal(
    /* @__PURE__ */ c.jsxs(
      "div",
      {
        ref: r,
        style: { top: 0, left: 0, visibility: "hidden" },
        className: "pointer-events-none fixed z-[70] min-w-[180px] rounded border border-danger/50 bg-surface/95 px-2.5 py-2 shadow-[0_4px_20px_hsl(var(--border)/0.5)] backdrop-blur",
        children: [
          /* @__PURE__ */ c.jsxs("div", { className: "mb-1 flex items-center gap-1", children: [
            /* @__PURE__ */ c.jsx("span", { className: "text-xs font-bold text-foreground", children: e.name }),
            /* @__PURE__ */ c.jsx("span", { className: "font-mono text-[10px] text-muted", children: e.code }),
            e.tag && /* @__PURE__ */ c.jsx(
              "span",
              {
                className: "rounded px-1 text-[9px] font-bold",
                style: wi[e.tag] ? { background: wi[e.tag].bg, color: wi[e.tag].fg } : void 0,
                children: e.tag
              }
            )
          ] }),
          /* @__PURE__ */ c.jsx(vr, { label: "类型", value: Pv[e.type] }),
          /* @__PURE__ */ c.jsx(vr, { label: "时间", value: ki(e.time) }),
          /* @__PURE__ */ c.jsx(vr, { label: "题材", value: e.reason }),
          e.type === "zt" && /* @__PURE__ */ c.jsx(vr, { label: "梯队", value: e.tier }),
          /* @__PURE__ */ c.jsx(vr, { label: "价格", value: `¥${(e.price ?? 0).toFixed(2)}` }),
          /* @__PURE__ */ c.jsx(
            vr,
            {
              label: "涨跌幅",
              value: `${e.change_pct >= 0 ? "+" : ""}${(e.change_pct ?? 0).toFixed(2)}%`,
              tone: e.change_pct >= 0 ? "bull" : "bear"
            }
          ),
          /* @__PURE__ */ c.jsx(vr, { label: "成交额", value: zv(e.amount) })
        ]
      }
    ),
    document.body
  );
}
function vr({ label: e, value: t, tone: r }) {
  return /* @__PURE__ */ c.jsxs("div", { className: "flex items-center justify-between gap-3 text-[10px] leading-4", children: [
    /* @__PURE__ */ c.jsx("span", { className: "text-muted", children: e }),
    /* @__PURE__ */ c.jsx("span", { className: wr("font-mono", r === "bull" ? "text-bull" : r === "bear" ? "text-bear" : "text-secondary"), children: t })
  ] });
}
function Ao(e) {
  return typeof e == "number" && Number.isFinite(e) ? e : null;
}
function Tv(e) {
  return e >= 70 ? "#F04438" : e >= 55 ? "#FB923C" : e >= 45 ? "#F59E0B" : e >= 30 ? "#84CC16" : "#12B76A";
}
function Fv(e, t = 2) {
  const r = Ao(e);
  return r == null ? "—" : r.toFixed(t);
}
function Ov(e) {
  const t = Ao(e);
  return t == null ? "—" : `${t >= 0 ? "+" : ""}${t.toFixed(2)}%`;
}
function wc(e) {
  const t = Ao(e);
  return t == null || t === 0 ? "text-muted" : t > 0 ? "text-bull" : "text-bear";
}
function kc(e) {
  const t = Ao(e);
  return t == null ? "—" : t >= 1e12 ? `${(t / 1e12).toFixed(2)}万亿` : t >= 1e8 ? `${(t / 1e8).toFixed(2)}亿` : t >= 1e4 ? `${(t / 1e4).toFixed(1)}万` : t.toFixed(0);
}
function li({ icon: e, title: t, hint: r }) {
  return /* @__PURE__ */ c.jsxs("div", { className: "mb-2 flex items-center justify-between gap-2", children: [
    /* @__PURE__ */ c.jsxs("div", { className: "flex items-center gap-1.5", children: [
      /* @__PURE__ */ c.jsx("span", { className: "h-3 w-0.5 rounded-full bg-gradient-to-b from-accent to-accent/30" }),
      /* @__PURE__ */ c.jsx(e, { className: "h-3.5 w-3.5 text-accent" }),
      /* @__PURE__ */ c.jsx("h2", { className: "text-xs font-semibold text-foreground", children: t })
    ] }),
    r && /* @__PURE__ */ c.jsx("span", { className: "font-mono text-[10px] text-muted", children: r })
  ] });
}
function Vr({ label: e, value: t, sub: r, tone: n = "neutral" }) {
  const o = typeof t == "string" || typeof t == "number", i = n === "bull" ? "text-bull" : n === "bear" ? "text-bear" : n === "accent" ? "text-accent" : "text-foreground";
  return /* @__PURE__ */ c.jsxs("div", { className: "min-w-0 overflow-hidden rounded-lg border border-border bg-surface/80 px-2 py-1 shadow-[0_1px_2px_hsl(var(--border)/0.4)] backdrop-blur-sm transition-all hover:border-accent/30 hover:shadow-[0_2px_8px_hsl(var(--accent)/0.15)]", children: [
    /* @__PURE__ */ c.jsx("div", { className: "flex items-center gap-1 text-[11px] text-muted", children: e }),
    /* @__PURE__ */ c.jsx("div", { className: `mt-1 truncate font-mono text-lg font-semibold leading-none tabular-nums ${o ? i : "text-foreground"}`, children: t }),
    r && /* @__PURE__ */ c.jsx("div", { className: "mt-1 truncate text-[10px] text-muted", children: r })
  ] });
}
function Lv({ item: e }) {
  const t = e.change_pct, r = (Ao(t) ?? 0) >= 0;
  return /* @__PURE__ */ c.jsxs("div", { className: "grid min-w-0 grid-cols-[1fr_auto] items-center gap-x-2 gap-y-0.5 rounded-lg border border-border bg-elevated/45 px-1.5 py-1 shadow-[0_1px_1px_hsl(var(--border)/0.3)] backdrop-blur-sm transition-all hover:border-accent/40 hover:bg-elevated hover:shadow-[0_2px_6px_hsl(var(--accent)/0.15)]", children: [
    /* @__PURE__ */ c.jsx("div", { className: "truncate text-xs font-medium text-foreground", children: e.name || e.symbol }),
    /* @__PURE__ */ c.jsx("div", { className: `font-mono text-xs font-semibold ${wc(t)}`, children: Ov(t) }),
    /* @__PURE__ */ c.jsx("div", { className: "font-mono text-[10px] text-muted", children: e.symbol }),
    /* @__PURE__ */ c.jsxs("div", { className: `flex items-center gap-1 font-mono text-[11px] ${wc(t)}`, children: [
      r ? /* @__PURE__ */ c.jsx(Lg, { className: "h-3 w-3" }) : /* @__PURE__ */ c.jsx(Og, { className: "h-3 w-3" }),
      Fv(e.last_price)
    ] })
  ] });
}
function Iv({ data: e, compact: t = !1 }) {
  const r = Math.max(e.total, 1), n = e.up / r * 100, o = e.down / r * 100, i = Math.max(0, 100 - n - o);
  return /* @__PURE__ */ c.jsxs("div", { className: t ? "" : "space-y-2", children: [
    /* @__PURE__ */ c.jsxs("div", { className: "flex h-2.5 overflow-hidden rounded-full bg-elevated", children: [
      /* @__PURE__ */ c.jsx("div", { className: "bg-bull/85", style: { width: `${n}%` } }),
      /* @__PURE__ */ c.jsx("div", { className: "bg-muted/45", style: { width: `${i}%` } }),
      /* @__PURE__ */ c.jsx("div", { className: "bg-bear/85", style: { width: `${o}%` } })
    ] }),
    !t && /* @__PURE__ */ c.jsxs("div", { className: "grid grid-cols-3 gap-1.5 text-[11px]", children: [
      /* @__PURE__ */ c.jsxs("div", { className: "rounded bg-bull/8 px-2 py-1 text-bull", children: [
        "涨 ",
        /* @__PURE__ */ c.jsx("span", { className: "font-mono", children: e.up })
      ] }),
      /* @__PURE__ */ c.jsxs("div", { className: "rounded bg-elevated/70 px-2 py-1 text-muted", children: [
        "平 ",
        /* @__PURE__ */ c.jsx("span", { className: "font-mono", children: e.flat })
      ] }),
      /* @__PURE__ */ c.jsxs("div", { className: "rounded bg-bear/8 px-2 py-1 text-bear", children: [
        "跌 ",
        /* @__PURE__ */ c.jsx("span", { className: "font-mono", children: e.down })
      ] })
    ] })
  ] });
}
function Dv({ rows: e }) {
  const t = Math.max(...e.map((r) => r.count), 1);
  return /* @__PURE__ */ c.jsx("div", { className: "grid min-h-[5.5rem] flex-1 grid-cols-8 items-end gap-1 pt-1", children: e.map((r, n) => {
    const o = n >= 4;
    return /* @__PURE__ */ c.jsxs("div", { className: "flex h-full min-w-0 flex-col items-center justify-end gap-0.5", children: [
      /* @__PURE__ */ c.jsx("div", { className: "font-mono text-[9px] text-muted", children: r.count || "" }),
      /* @__PURE__ */ c.jsx(
        "div",
        {
          className: `w-2 rounded-full ${o ? "bg-gradient-to-t from-bull/45 to-bull/90" : "bg-gradient-to-t from-bear/45 to-bear/90"}`,
          style: { height: `${Math.max(4, r.count / t * 86)}%` },
          title: `${r.label}: ${r.count}只`
        }
      ),
      /* @__PURE__ */ c.jsx("div", { className: "truncate text-[9px] text-muted", children: r.label })
    ] }, r.label);
  }) });
}
function $v({ radar: e, score: t, compact: r = !1 }) {
  const s = Tv(t);
  if (!e.length) return /* @__PURE__ */ c.jsx("div", { className: "flex flex-1 items-center justify-center text-xs text-muted", children: "暂无雷达数据" });
  const a = e.map((h, v) => {
    const y = -Math.PI / 2 + v * 2 * Math.PI / e.length, w = 78 * Math.max(0, Math.min(100, h.value)) / 100;
    return {
      ...h,
      x: 120 + Math.cos(y) * w,
      y: 120 + Math.sin(y) * w,
      lx: 120 + Math.cos(y) * 105,
      ly: 120 + Math.sin(y) * 105,
      gx: 120 + Math.cos(y) * 78,
      gy: 120 + Math.sin(y) * 78
    };
  }), u = a.map((h) => `${h.x},${h.y}`).join(" "), g = [1, 0.66, 0.33].map((h, v) => ({
    level: h,
    idx: v,
    points: e.map((y, w) => {
      const x = -Math.PI / 2 + w * 2 * Math.PI / e.length;
      return `${120 + Math.cos(x) * 78 * h},${120 + Math.sin(x) * 78 * h}`;
    }).join(" ")
  }));
  return /* @__PURE__ */ c.jsx("div", { className: "flex min-h-0 flex-1 items-center justify-center", children: /* @__PURE__ */ c.jsxs("svg", { viewBox: "0 0 240 240", className: `h-full w-full ${r ? "max-h-[15.5rem]" : "max-h-[22rem]"}`, children: [
    /* @__PURE__ */ c.jsxs("defs", { children: [
      /* @__PURE__ */ c.jsxs("radialGradient", { id: "emotionRadarFill", cx: "50%", cy: "45%", r: "70%", children: [
        /* @__PURE__ */ c.jsx("stop", { offset: "0%", stopColor: `${s}57` }),
        /* @__PURE__ */ c.jsx("stop", { offset: "100%", stopColor: `${s}1f` })
      ] }),
      /* @__PURE__ */ c.jsxs("radialGradient", { id: "emotionRadarCenter", cx: "50%", cy: "50%", r: "55%", children: [
        /* @__PURE__ */ c.jsx("stop", { offset: "0%", stopColor: "hsl(var(--surface) / 0.92)" }),
        /* @__PURE__ */ c.jsx("stop", { offset: "68%", stopColor: "hsl(var(--surface) / 0.70)" }),
        /* @__PURE__ */ c.jsx("stop", { offset: "100%", stopColor: "hsl(var(--surface) / 0)" })
      ] })
    ] }),
    g.map((h) => /* @__PURE__ */ c.jsx(
      "polygon",
      {
        points: h.points,
        fill: h.idx % 2 === 0 ? "hsl(var(--elevated) / 0.55)" : "hsl(var(--elevated) / 0.3)",
        stroke: h.level === 1 ? "hsl(var(--border) / 0.9)" : "hsl(var(--border) / 0.5)",
        strokeWidth: h.level === 1 ? 1.2 : 0.8
      },
      h.level
    )),
    a.map((h) => /* @__PURE__ */ c.jsx("line", { x1: 120, y1: 120, x2: h.gx, y2: h.gy, stroke: "hsl(var(--border) / 0.4)" }, h.key)),
    /* @__PURE__ */ c.jsx("polygon", { points: u, fill: "url(#emotionRadarFill)", stroke: s, strokeWidth: "2" }),
    a.map((h) => /* @__PURE__ */ c.jsx("circle", { cx: h.x, cy: h.y, r: "2.8", fill: s, stroke: "hsl(var(--surface) / 0.9)", strokeWidth: "1" }, h.key)),
    /* @__PURE__ */ c.jsx("circle", { cx: 120, cy: 120, r: "29", fill: "url(#emotionRadarCenter)" }),
    /* @__PURE__ */ c.jsx("text", { x: 120, y: 127, textAnchor: "middle", className: "fill-foreground font-mono text-[24px] font-bold", children: t }),
    a.map((h) => /* @__PURE__ */ c.jsx("text", { x: h.lx, y: h.ly + 4, textAnchor: "middle", className: "fill-secondary text-[10px] font-medium", children: h.label }, `${h.key}-label`))
  ] }) });
}
function Av({ limit: e, showSealRate: t = !0 }) {
  const r = e.tiers.filter((n) => n.boards >= 2).slice(0, 6);
  return /* @__PURE__ */ c.jsxs("div", { className: "space-y-1.5", children: [
    t && /* @__PURE__ */ c.jsxs("div", { className: "flex items-center justify-between rounded bg-elevated/55 px-2 py-1.5 text-[11px]", children: [
      /* @__PURE__ */ c.jsx("span", { className: "text-muted", children: "封板率" }),
      /* @__PURE__ */ c.jsxs("span", { className: "font-mono text-accent", children: [
        (e.seal_rate ?? 0).toFixed(0),
        "%"
      ] })
    ] }),
    r.length === 0 && /* @__PURE__ */ c.jsx("div", { className: "rounded border border-dashed border-border py-5 text-center text-xs text-muted", children: "暂无 2 板以上" }),
    r.map((n) => {
      const o = n.stocks ?? [], i = o.length > 0 && o.length <= 3;
      return /* @__PURE__ */ c.jsxs("div", { className: "rounded bg-elevated/35 px-2 py-1.5", children: [
        /* @__PURE__ */ c.jsxs("div", { className: "grid grid-cols-[42px_1fr_auto] items-center gap-2", children: [
          /* @__PURE__ */ c.jsxs("span", { className: `font-mono text-sm font-bold ${n.boards >= 5 ? "text-bull" : n.boards >= 3 ? "text-accent" : "text-secondary"}`, children: [
            n.boards,
            "板"
          ] }),
          /* @__PURE__ */ c.jsx("div", { className: "h-1.5 overflow-hidden rounded-full bg-base", children: /* @__PURE__ */ c.jsx("div", { className: "h-full rounded-full bg-bull/70", style: { width: `${Math.min(100, n.count * 12)}%` } }) }),
          /* @__PURE__ */ c.jsx("span", { className: "font-mono text-xs text-foreground", children: n.count })
        ] }),
        i && /* @__PURE__ */ c.jsx("div", { className: "mt-1 flex flex-wrap gap-x-2 gap-y-0.5 pl-[50px]", children: o.map((l) => /* @__PURE__ */ c.jsx("span", { className: "inline-flex items-center gap-0.5 text-[9px] text-secondary", children: l.name || l.symbol }, l.symbol)) })
      ] }, n.boards);
    })
  ] });
}
function At({ label: e, value: t, cls: r = "text-foreground" }) {
  return /* @__PURE__ */ c.jsxs("div", { className: "flex flex-col justify-center rounded-md bg-elevated/45 px-2 py-1.5 border border-border/40", children: [
    /* @__PURE__ */ c.jsx("div", { className: "text-[10px] text-muted", children: e }),
    /* @__PURE__ */ c.jsx("div", { className: `mt-0.5 font-mono text-xs font-semibold ${r}`, children: t })
  ] });
}
const Uv = { BarChart3: Dg, Flame: cp, Sparkles: Hg }, { BarChart3: Qv, Sparkles: Bv, Flame: Hv } = Uv;
function Wv() {
  const t = Ha({
    queryKey: ["alerts"],
    queryFn: () => Vv(),
    refetchInterval: 1e4
  }).data ?? [];
  return t.length === 0 ? /* @__PURE__ */ c.jsx("div", { className: "mt-1 py-6 text-center text-[11px] text-muted", children: "暂无触发记录" }) : /* @__PURE__ */ c.jsx("div", { className: "mt-1 max-h-[18rem] space-y-1.5 overflow-y-auto pr-0.5", children: t.map((r, n) => {
    const o = r.change_pct ?? 0;
    return /* @__PURE__ */ c.jsxs("div", { className: "relative overflow-hidden rounded-md border border-border/40 bg-surface/60 pl-2.5 pr-2 py-1.5", children: [
      /* @__PURE__ */ c.jsx("div", { className: `absolute left-0 top-0 h-full w-0.5 ${r.severity === "critical" ? "bg-danger" : r.severity === "warn" ? "bg-warning" : "bg-accent/40"}` }),
      /* @__PURE__ */ c.jsxs("div", { className: "flex items-center gap-1.5", children: [
        /* @__PURE__ */ c.jsx("span", { className: "font-mono text-[10px] font-medium text-foreground/80", children: r.symbol?.replace(/\.(SH|SZ|BJ)$/, "") }),
        r.name && /* @__PURE__ */ c.jsx("span", { className: "text-[10px] text-secondary truncate max-w-[6rem]", children: r.name }),
        /* @__PURE__ */ c.jsx("span", { className: "flex-1" }),
        r.price != null && /* @__PURE__ */ c.jsx("span", { className: "text-[10px] font-mono text-foreground/60", children: r.price.toFixed(2) }),
        r.change_pct != null && /* @__PURE__ */ c.jsxs("span", { className: `text-[10px] font-mono font-medium w-12 text-right ${o >= 0 ? "text-bull" : "text-bear"}`, children: [
          o >= 0 ? "+" : "",
          (o * 100).toFixed(2),
          "%"
        ] })
      ] }),
      /* @__PURE__ */ c.jsxs("div", { className: "mt-0.5 flex items-center gap-1.5", children: [
        /* @__PURE__ */ c.jsx("span", { className: "shrink-0 rounded bg-accent/10 px-1 py-px text-[8px] font-medium text-accent", children: r.source }),
        r.message && /* @__PURE__ */ c.jsx("span", { className: "text-[9px] text-muted truncate flex-1", children: r.message })
      ] })
    ] }, `${r.ts}-${n}`);
  }) });
}
async function Vv() {
  const e = await fetch("/api/alerts?days=7&limit=10", { headers: { Accept: "application/json" } });
  return e.ok ? (await e.json()).alerts ?? [] : [];
}
function Kv() {
  const [e, t] = I.useState(!1), r = Ha({
    queryKey: ["overview-market"],
    queryFn: () => fp.overviewMarket(),
    staleTime: 5e3,
    placeholderData: (l) => l,
    refetchInterval: 6e4
  }), n = r.data, o = n?.emotion?.score ?? 0, i = async () => {
    t(!0);
    try {
      await r.refetch();
    } finally {
      t(!1);
    }
  };
  return n ? /* @__PURE__ */ c.jsxs("div", { className: "flex h-full flex-col overflow-y-auto p-2 as-root-body", children: [
    /* @__PURE__ */ c.jsxs("div", { className: "relative mb-1.5 flex flex-wrap items-center justify-between gap-2 overflow-hidden rounded-card border border-border bg-gradient-to-r from-surface/90 to-surface/70 px-3 py-1.5 shadow-[0_1px_3px_hsl(var(--border)/0.4)] backdrop-blur-sm", children: [
      /* @__PURE__ */ c.jsx("div", { className: "pointer-events-none absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-accent to-accent/20", "aria-hidden": !0 }),
      /* @__PURE__ */ c.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ c.jsx(Ag, { className: "h-4 w-4 text-accent" }),
        /* @__PURE__ */ c.jsx("h1", { className: "text-base font-semibold text-foreground", children: "新看板" }),
        /* @__PURE__ */ c.jsxs("span", { className: "rounded-full border px-2 py-0.5 text-[10px] font-medium", style: { color: si(o), borderColor: `${si(o)}40`, background: `${si(o)}14` }, children: [
          n.emotion.label,
          " · ",
          o
        ] }),
        /* @__PURE__ */ c.jsxs("span", { className: "hidden items-center gap-1 whitespace-nowrap text-[10px] text-muted lg:inline-flex", children: [
          /* @__PURE__ */ c.jsx(dp, { className: "h-3 w-3" }),
          "数据：本地行情 + 东财三池"
        ] })
      ] }),
      /* @__PURE__ */ c.jsxs("div", { className: "flex items-center gap-3 text-[11px] text-muted", children: [
        /* @__PURE__ */ c.jsx("span", { className: "font-mono text-secondary", children: n.as_of ?? "—" }),
        /* @__PURE__ */ c.jsxs(
          "button",
          {
            onClick: i,
            disabled: e || r.isFetching,
            className: "inline-flex items-center gap-1 rounded-btn border border-border bg-elevated px-2 py-1 text-[11px] text-secondary transition-colors hover:text-foreground disabled:opacity-50",
            children: [
              /* @__PURE__ */ c.jsx(Qg, { className: `h-3 w-3 ${e || r.isFetching ? "animate-spin" : ""}` }),
              "重载"
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ c.jsx("div", { className: "mb-1.5 grid grid-cols-4 gap-1", children: n.indices.map((l) => /* @__PURE__ */ c.jsx(Lv, { item: l }, l.symbol)) }),
    /* @__PURE__ */ c.jsxs("div", { className: "mb-1.5 grid grid-cols-6 gap-1", children: [
      /* @__PURE__ */ c.jsx(Vr, { label: "个股涨 / 平 / 跌", value: /* @__PURE__ */ c.jsxs(c.Fragment, { children: [
        /* @__PURE__ */ c.jsx("span", { className: "text-bull", children: n.breadth.up }),
        /* @__PURE__ */ c.jsx("span", { className: "text-muted", children: "/" }),
        /* @__PURE__ */ c.jsx("span", { className: "text-muted", children: n.breadth.flat }),
        /* @__PURE__ */ c.jsx("span", { className: "text-muted", children: "/" }),
        /* @__PURE__ */ c.jsx("span", { className: "text-bear", children: n.breadth.down })
      ] }), sub: `上涨率 ${n.breadth.up_pct.toFixed(1)}%` }),
      /* @__PURE__ */ c.jsx(Vr, { label: "强势 / 弱势", value: /* @__PURE__ */ c.jsxs(c.Fragment, { children: [
        /* @__PURE__ */ c.jsx("span", { className: "text-bull", children: n.breadth.strong_up }),
        /* @__PURE__ */ c.jsx("span", { className: "text-muted", children: "/" }),
        /* @__PURE__ */ c.jsx("span", { className: "text-bear", children: n.breadth.strong_down })
      ] }), sub: "涨跌 ≥3%" }),
      /* @__PURE__ */ c.jsx(Vr, { label: "涨停 / 跌停", value: /* @__PURE__ */ c.jsxs(c.Fragment, { children: [
        /* @__PURE__ */ c.jsx("span", { className: "text-bull", children: n.limit.limit_up }),
        /* @__PURE__ */ c.jsx("span", { className: "text-muted", children: "/" }),
        /* @__PURE__ */ c.jsx("span", { className: "text-bear", children: n.limit.limit_down })
      ] }), sub: `本地真封 · 封板率 ${(n.limit.seal_rate ?? 0).toFixed(0)}%` }),
      /* @__PURE__ */ c.jsx(Vr, { label: "最高连板", value: `${n.limit.max_boards || 0}板`, sub: `梯队 ${n.limit.tiers.length}`, tone: "accent" }),
      /* @__PURE__ */ c.jsx(Vr, { label: "成交额", value: kc(n.amount.total), sub: `均额 ${kc(n.amount.avg)}` }),
      /* @__PURE__ */ c.jsx(Vr, { label: "换手 / 量比", value: `${n.activity.avg_turnover.toFixed(1)}% / ${n.activity.vol_ratio.toFixed(2)}`, sub: `高换手 ${n.activity.high_turnover} · 放量占比 ${n.activity.high_vol_ratio.toFixed(1)}%`, tone: "accent" })
    ] }),
    /* @__PURE__ */ c.jsxs("div", { className: "shrink-0 grid grid-cols-1 gap-1.5 xl:grid-cols-[minmax(0,1fr)_20rem]", children: [
      /* @__PURE__ */ c.jsx("main", { className: "min-w-0", children: /* @__PURE__ */ c.jsxs("div", { className: "grid h-[20rem] grid-cols-1 gap-1.5 lg:grid-cols-3", children: [
        /* @__PURE__ */ c.jsxs("section", { className: "flex flex-col rounded-card border border-border bg-surface/80 p-1.5 shadow-[0_1px_2px_hsl(var(--border)/0.4)] backdrop-blur-sm", children: [
          /* @__PURE__ */ c.jsx(li, { icon: Qv, title: "涨跌分布 / 广度", hint: `${n.breadth.total}只` }),
          /* @__PURE__ */ c.jsx(Dv, { rows: n.distribution }),
          /* @__PURE__ */ c.jsx("div", { className: "mt-auto pt-1", children: /* @__PURE__ */ c.jsx(Iv, { data: n.breadth, compact: !0 }) }),
          /* @__PURE__ */ c.jsxs("div", { className: "mt-2 grid grid-cols-2 gap-1.5", children: [
            /* @__PURE__ */ c.jsx(At, { label: "平均涨跌", value: bc(n.breadth.avg_pct), cls: Sc(n.breadth.avg_pct) }),
            /* @__PURE__ */ c.jsx(At, { label: "中位涨跌", value: bc(n.breadth.median_pct), cls: Sc(n.breadth.median_pct) })
          ] })
        ] }),
        /* @__PURE__ */ c.jsxs("section", { className: "flex flex-col rounded-card border bg-surface/80 p-1.5 shadow-[0_1px_2px_hsl(var(--border)/0.4)] backdrop-blur-sm", style: { borderColor: `${si(o)}40` }, children: [
          /* @__PURE__ */ c.jsx(li, { icon: Bv, title: "情绪雷达", hint: "五维" }),
          /* @__PURE__ */ c.jsx($v, { radar: n.radar, score: o, compact: !0 })
        ] }),
        /* @__PURE__ */ c.jsxs("div", { className: "flex h-full min-h-0 flex-col gap-1.5", children: [
          /* @__PURE__ */ c.jsxs("section", { className: "flex min-h-0 flex-1 flex-col rounded-card border border-border bg-surface/80 p-1.5 shadow-[0_1px_2px_hsl(var(--border)/0.4)] backdrop-blur-sm", children: [
            /* @__PURE__ */ c.jsx(li, { icon: $g, title: "趋势强度", hint: "均线/新高低" }),
            /* @__PURE__ */ c.jsxs("div", { className: "grid min-h-0 flex-1 auto-rows-fr grid-cols-3 gap-1.5", children: [
              /* @__PURE__ */ c.jsx(At, { label: "站上MA5", value: `${n.trend.above_ma5_pct.toFixed(0)}%`, cls: "text-accent" }),
              /* @__PURE__ */ c.jsx(At, { label: "站上MA20", value: `${n.trend.above_ma20_pct.toFixed(0)}%`, cls: "text-accent" }),
              /* @__PURE__ */ c.jsx(At, { label: "站上MA60", value: `${n.trend.above_ma60_pct.toFixed(0)}%`, cls: "text-accent" }),
              /* @__PURE__ */ c.jsx(At, { label: "60日新高", value: Cc(n.trend.new_high), cls: "text-bull" }),
              /* @__PURE__ */ c.jsx(At, { label: "60日新低", value: Cc(n.trend.new_low), cls: "text-bear" }),
              /* @__PURE__ */ c.jsx(At, { label: "高低比", value: `${n.trend.new_high + n.trend.new_low > 0 ? Math.round(n.trend.new_high / (n.trend.new_high + n.trend.new_low) * 100) : 50}%`, cls: n.trend.new_high >= n.trend.new_low ? "text-bull" : "text-bear" })
            ] })
          ] }),
          /* @__PURE__ */ c.jsxs("section", { className: "shrink-0 rounded-card border border-border bg-surface/80 p-1.5 shadow-[0_1px_2px_hsl(var(--border)/0.4)] backdrop-blur-sm", children: [
            /* @__PURE__ */ c.jsx(li, { icon: Hv, title: "涨停梯队", hint: "2板以上" }),
            /* @__PURE__ */ c.jsx(Av, { limit: n.limit, showSealRate: !1 })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ c.jsx("aside", { className: "min-w-0 space-y-1.5", children: /* @__PURE__ */ c.jsxs("section", { className: "rounded-card border border-border bg-surface/80 p-1.5 shadow-[0_1px_2px_hsl(var(--border)/0.4)] backdrop-blur-sm", children: [
        /* @__PURE__ */ c.jsx("div", { className: "mb-2 flex items-center justify-between gap-2", children: /* @__PURE__ */ c.jsxs("div", { className: "flex items-center gap-1.5", children: [
          /* @__PURE__ */ c.jsx(Ig, { className: "h-3.5 w-3.5 text-accent" }),
          /* @__PURE__ */ c.jsx("h2", { className: "text-xs font-semibold text-foreground", children: "监控中心" }),
          /* @__PURE__ */ c.jsx("span", { className: "font-mono text-[10px] text-muted", children: "实时信号" })
        ] }) }),
        /* @__PURE__ */ c.jsx(Wv, {})
      ] }) })
    ] }),
    /* @__PURE__ */ c.jsx("div", { className: "mt-1.5 min-h-0", children: /* @__PURE__ */ c.jsx(Mv, {}) })
  ] }) : /* @__PURE__ */ c.jsx("div", { className: "flex h-full items-center justify-center text-sm text-muted", children: r.isError ? "看板数据加载失败，请点「重载」重试" : "正在加载看板数据…" });
}
function si(e) {
  return e >= 70 ? "#F04438" : e >= 55 ? "#FB923C" : e >= 45 ? "#F59E0B" : e >= 30 ? "#84CC16" : "#12B76A";
}
function bc(e) {
  return typeof e != "number" || !Number.isFinite(e) ? "—" : `${e >= 0 ? "+" : ""}${(e * 100).toFixed(2)}%`;
}
function Sc(e) {
  return typeof e != "number" || !Number.isFinite(e) || e === 0 ? "text-muted" : e > 0 ? "text-bull" : "text-bear";
}
function Cc(e) {
  return typeof e != "number" || !Number.isFinite(e) ? "—" : e >= 1e3 ? `${(e / 1e3).toFixed(1)}k` : e.toFixed(0);
}
const Il = /* @__PURE__ */ new WeakMap(), Gv = "tf-theme", Ec = "tf-theme-change";
function qv() {
  let e = null;
  try {
    e = localStorage.getItem(Gv);
  } catch {
  }
  return document.documentElement.classList.contains("dark") ? !0 : e !== "light";
}
function Yv(e) {
  e.innerHTML = "", e.style.display = "block", e.style.height = "100%", e.style.minHeight = "0";
  const t = e.shadowRoot ?? e.attachShadow({ mode: "open" });
  t.innerHTML = "";
  const r = document.createElement("style");
  r.textContent = Mg, t.appendChild(r);
  const n = document.createElement("div");
  n.className = "as-root", n.style.height = "100%", n.style.minHeight = "0", t.appendChild(n);
  const o = () => n.classList.toggle("dark", qv());
  o(), window.addEventListener(Ec, o), window.addEventListener("storage", o);
  const i = new MutationObserver(o);
  i.observe(document.documentElement, { attributes: !0, attributeFilter: ["class"] });
  const l = new dg({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: !1 } } }), s = Gf(n);
  return s.render(
    Xa.createElement(
      xg,
      { client: l },
      Xa.createElement(Kv)
    )
  ), Il.set(e, s), () => {
    window.removeEventListener(Ec, o), window.removeEventListener("storage", o), i.disconnect(), Il.get(e)?.unmount(), Il.delete(e), t.innerHTML = "", e.innerHTML = "";
  };
}
const Zv = {
  id: "tsp.new-dashboard",
  apiVersion: 1,
  routes: [{ id: "new-dashboard", path: "/custom/new-dashboard", mount: Yv }],
  navigation: [{ id: "new-dashboard", routeId: "new-dashboard", label: "新看板", icon: "LayoutDashboard" }]
};
export {
  Zv as default
};
