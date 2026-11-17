var Ga = (e) => {
  throw TypeError(e);
};
var cl = (e, t, r) => t.has(e) || Ga("Cannot " + r);
var f = (e, t, r) => (cl(e, t, "read from private field"), r ? r.call(e) : t.get(e)), F = (e, t, r) => t.has(e) ? Ga("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, r), N = (e, t, r, n) => (cl(e, t, "write to private field"), n ? n.call(e, r) : t.set(e, r), r), A = (e, t, r) => (cl(e, t, "access private method"), r);
var Qo = (e, t, r, n) => ({
  set _(o) {
    N(e, t, o, r);
  },
  get _() {
    return f(e, t, n);
  }
});
function wp(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var Lc = { exports: {} }, D = {};
/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Fo = Symbol.for("react.element"), kp = Symbol.for("react.portal"), bp = Symbol.for("react.fragment"), Sp = Symbol.for("react.strict_mode"), Cp = Symbol.for("react.profiler"), Ep = Symbol.for("react.provider"), jp = Symbol.for("react.context"), Np = Symbol.for("react.forward_ref"), _p = Symbol.for("react.suspense"), Pp = Symbol.for("react.memo"), zp = Symbol.for("react.lazy"), qa = Symbol.iterator;
function Mp(e) {
  return e === null || typeof e != "object" ? null : (e = qa && e[qa] || e["@@iterator"], typeof e == "function" ? e : null);
}
var Ic = { isMounted: function() {
  return !1;
}, enqueueForceUpdate: function() {
}, enqueueReplaceState: function() {
}, enqueueSetState: function() {
} }, $c = Object.assign, Dc = {};
function Rn(e, t, r) {
  this.props = e, this.context = t, this.refs = Dc, this.updater = r || Ic;
}
Rn.prototype.isReactComponent = {};
Rn.prototype.setState = function(e, t) {
  if (typeof e != "object" && typeof e != "function" && e != null) throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
  this.updater.enqueueSetState(this, e, t, "setState");
};
Rn.prototype.forceUpdate = function(e) {
  this.updater.enqueueForceUpdate(this, e, "forceUpdate");
};
function Ac() {
}
Ac.prototype = Rn.prototype;
function Ks(e, t, r) {
  this.props = e, this.context = t, this.refs = Dc, this.updater = r || Ic;
}
var Gs = Ks.prototype = new Ac();
Gs.constructor = Ks;
$c(Gs, Rn.prototype);
Gs.isPureReactComponent = !0;
var Ya = Array.isArray, Uc = Object.prototype.hasOwnProperty, qs = { current: null }, Qc = { key: !0, ref: !0, __self: !0, __source: !0 };
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
  return { $$typeof: Fo, type: e, key: i, ref: l, props: o, _owner: qs.current };
}
function Rp(e, t) {
  return { $$typeof: Fo, type: e.type, key: t, ref: e.ref, props: e.props, _owner: e._owner };
}
function Ys(e) {
  return typeof e == "object" && e !== null && e.$$typeof === Fo;
}
function Tp(e) {
  var t = { "=": "=0", ":": "=2" };
  return "$" + e.replace(/[=:]/g, function(r) {
    return t[r];
  });
}
var Xa = /\/+/g;
function dl(e, t) {
  return typeof e == "object" && e !== null && e.key != null ? Tp("" + e.key) : t.toString(36);
}
function ui(e, t, r, n, o) {
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
  if (l) return l = e, o = o(l), e = n === "" ? "." + dl(l, 0) : n, Ya(o) ? (r = "", e != null && (r = e.replace(Xa, "$&/") + "/"), ui(o, t, r, "", function(u) {
    return u;
  })) : o != null && (Ys(o) && (o = Rp(o, r + (!o.key || l && l.key === o.key ? "" : ("" + o.key).replace(Xa, "$&/") + "/") + e)), t.push(o)), 1;
  if (l = 0, n = n === "" ? "." : n + ":", Ya(e)) for (var s = 0; s < e.length; s++) {
    i = e[s];
    var a = n + dl(i, s);
    l += ui(i, t, r, a, o);
  }
  else if (a = Mp(e), typeof a == "function") for (e = a.call(e), s = 0; !(i = e.next()).done; ) i = i.value, a = n + dl(i, s++), l += ui(i, t, r, a, o);
  else if (i === "object") throw t = String(e), Error("Objects are not valid as a React child (found: " + (t === "[object Object]" ? "object with keys {" + Object.keys(e).join(", ") + "}" : t) + "). If you meant to render a collection of children, use an array instead.");
  return l;
}
function Bo(e, t, r) {
  if (e == null) return e;
  var n = [], o = 0;
  return ui(e, n, "", "", function(i) {
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
var Pe = { current: null }, ci = { transition: null }, Op = { ReactCurrentDispatcher: Pe, ReactCurrentBatchConfig: ci, ReactCurrentOwner: qs };
function Hc() {
  throw Error("act(...) is not supported in production builds of React.");
}
D.Children = { map: Bo, forEach: function(e, t, r) {
  Bo(e, function() {
    t.apply(this, arguments);
  }, r);
}, count: function(e) {
  var t = 0;
  return Bo(e, function() {
    t++;
  }), t;
}, toArray: function(e) {
  return Bo(e, function(t) {
    return t;
  }) || [];
}, only: function(e) {
  if (!Ys(e)) throw Error("React.Children.only expected to receive a single React element child.");
  return e;
} };
D.Component = Rn;
D.Fragment = bp;
D.Profiler = Cp;
D.PureComponent = Ks;
D.StrictMode = Sp;
D.Suspense = _p;
D.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = Op;
D.act = Hc;
D.cloneElement = function(e, t, r) {
  if (e == null) throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + e + ".");
  var n = $c({}, e.props), o = e.key, i = e.ref, l = e._owner;
  if (t != null) {
    if (t.ref !== void 0 && (i = t.ref, l = qs.current), t.key !== void 0 && (o = "" + t.key), e.type && e.type.defaultProps) var s = e.type.defaultProps;
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
D.createContext = function(e) {
  return e = { $$typeof: jp, _currentValue: e, _currentValue2: e, _threadCount: 0, Provider: null, Consumer: null, _defaultValue: null, _globalName: null }, e.Provider = { $$typeof: Ep, _context: e }, e.Consumer = e;
};
D.createElement = Bc;
D.createFactory = function(e) {
  var t = Bc.bind(null, e);
  return t.type = e, t;
};
D.createRef = function() {
  return { current: null };
};
D.forwardRef = function(e) {
  return { $$typeof: Np, render: e };
};
D.isValidElement = Ys;
D.lazy = function(e) {
  return { $$typeof: zp, _payload: { _status: -1, _result: e }, _init: Fp };
};
D.memo = function(e, t) {
  return { $$typeof: Pp, type: e, compare: t === void 0 ? null : t };
};
D.startTransition = function(e) {
  var t = ci.transition;
  ci.transition = {};
  try {
    e();
  } finally {
    ci.transition = t;
  }
};
D.unstable_act = Hc;
D.useCallback = function(e, t) {
  return Pe.current.useCallback(e, t);
};
D.useContext = function(e) {
  return Pe.current.useContext(e);
};
D.useDebugValue = function() {
};
D.useDeferredValue = function(e) {
  return Pe.current.useDeferredValue(e);
};
D.useEffect = function(e, t) {
  return Pe.current.useEffect(e, t);
};
D.useId = function() {
  return Pe.current.useId();
};
D.useImperativeHandle = function(e, t, r) {
  return Pe.current.useImperativeHandle(e, t, r);
};
D.useInsertionEffect = function(e, t) {
  return Pe.current.useInsertionEffect(e, t);
};
D.useLayoutEffect = function(e, t) {
  return Pe.current.useLayoutEffect(e, t);
};
D.useMemo = function(e, t) {
  return Pe.current.useMemo(e, t);
};
D.useReducer = function(e, t, r) {
  return Pe.current.useReducer(e, t, r);
};
D.useRef = function(e) {
  return Pe.current.useRef(e);
};
D.useState = function(e) {
  return Pe.current.useState(e);
};
D.useSyncExternalStore = function(e, t, r) {
  return Pe.current.useSyncExternalStore(e, t, r);
};
D.useTransition = function() {
  return Pe.current.useTransition();
};
D.version = "18.3.1";
Lc.exports = D;
var I = Lc.exports;
const Za = /* @__PURE__ */ wp(I);
var Wc = { exports: {} }, Ke = {}, Vc = { exports: {} }, Kc = {};
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
      e: for (var B = 0, se = E.length, Lt = se >>> 1; B < Lt; ) {
        var kt = 2 * (B + 1) - 1, Ae = E[kt], qe = kt + 1, mr = E[qe];
        if (0 > o(Ae, L)) qe < se && 0 > o(mr, Ae) ? (E[B] = mr, E[qe] = L, B = qe) : (E[B] = Ae, E[kt] = L, B = kt);
        else if (qe < se && 0 > o(mr, L)) E[B] = mr, E[qe] = L, B = qe;
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
  var a = [], u = [], h = 1, v = null, g = 3, y = !1, x = !1, w = !1, C = typeof setTimeout == "function" ? setTimeout : null, p = typeof clearTimeout == "function" ? clearTimeout : null, d = typeof setImmediate < "u" ? setImmediate : null;
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
    if (w = !1, m(E), !x) if (r(a) !== null) x = !0, dt(S);
    else {
      var O = r(u);
      O !== null && wt(k, O.startTime - E);
    }
  }
  function S(E, O) {
    x = !1, w && (w = !1, p(P), P = -1), y = !0;
    var L = g;
    try {
      for (m(O), v = r(a); v !== null && (!(v.expirationTime > O) || E && !Y()); ) {
        var B = v.callback;
        if (typeof B == "function") {
          v.callback = null, g = v.priorityLevel;
          var se = B(v.expirationTime <= O);
          O = e.unstable_now(), typeof se == "function" ? v.callback = se : v === r(a) && n(a), m(O);
        } else n(a);
        v = r(a);
      }
      if (v !== null) var Lt = !0;
      else {
        var kt = r(u);
        kt !== null && wt(k, kt.startTime - O), Lt = !1;
      }
      return Lt;
    } finally {
      v = null, g = L, y = !1;
    }
  }
  var _ = !1, j = null, P = -1, R = 5, T = -1;
  function Y() {
    return !(e.unstable_now() - T < R);
  }
  function U() {
    if (j !== null) {
      var E = e.unstable_now();
      T = E;
      var O = !0;
      try {
        O = j(!0, E);
      } finally {
        O ? Ee() : (_ = !1, j = null);
      }
    } else _ = !1;
  }
  var Ee;
  if (typeof d == "function") Ee = function() {
    d(U);
  };
  else if (typeof MessageChannel < "u") {
    var Me = new MessageChannel(), Qr = Me.port2;
    Me.port1.onmessage = U, Ee = function() {
      Qr.postMessage(null);
    };
  } else Ee = function() {
    C(U, 0);
  };
  function dt(E) {
    j = E, _ || (_ = !0, Ee());
  }
  function wt(E, O) {
    P = C(function() {
      E(e.unstable_now());
    }, O);
  }
  e.unstable_IdlePriority = 5, e.unstable_ImmediatePriority = 1, e.unstable_LowPriority = 4, e.unstable_NormalPriority = 3, e.unstable_Profiling = null, e.unstable_UserBlockingPriority = 2, e.unstable_cancelCallback = function(E) {
    E.callback = null;
  }, e.unstable_continueExecution = function() {
    x || y || (x = !0, dt(S));
  }, e.unstable_forceFrameRate = function(E) {
    0 > E || 125 < E ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : R = 0 < E ? Math.floor(1e3 / E) : 5;
  }, e.unstable_getCurrentPriorityLevel = function() {
    return g;
  }, e.unstable_getFirstCallbackNode = function() {
    return r(a);
  }, e.unstable_next = function(E) {
    switch (g) {
      case 1:
      case 2:
      case 3:
        var O = 3;
        break;
      default:
        O = g;
    }
    var L = g;
    g = O;
    try {
      return E();
    } finally {
      g = L;
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
    var L = g;
    g = E;
    try {
      return O();
    } finally {
      g = L;
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
    return se = L + se, E = { id: h++, callback: O, priorityLevel: E, startTime: L, expirationTime: se, sortIndex: -1 }, L > B ? (E.sortIndex = L, t(u, E), r(a) === null && E === r(u) && (w ? (p(P), P = -1) : w = !0, wt(k, L - B))) : (E.sortIndex = se, t(a, E), x || y || (x = !0, dt(S))), E;
  }, e.unstable_shouldYield = Y, e.unstable_wrapCallback = function(E) {
    var O = g;
    return function() {
      var L = g;
      g = O;
      try {
        return E.apply(this, arguments);
      } finally {
        g = L;
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
var Ip = I, Ve = Lp;
function b(e) {
  for (var t = "https://reactjs.org/docs/error-decoder.html?invariant=" + e, r = 1; r < arguments.length; r++) t += "&args[]=" + encodeURIComponent(arguments[r]);
  return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
}
var Gc = /* @__PURE__ */ new Set(), ao = {};
function Ar(e, t) {
  En(e, t), En(e + "Capture", t);
}
function En(e, t) {
  for (ao[e] = t, e = 0; e < t.length; e++) Gc.add(t[e]);
}
var Mt = !(typeof window > "u" || typeof window.document > "u" || typeof window.document.createElement > "u"), Dl = Object.prototype.hasOwnProperty, $p = /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/, Ja = {}, eu = {};
function Dp(e) {
  return Dl.call(eu, e) ? !0 : Dl.call(Ja, e) ? !1 : $p.test(e) ? eu[e] = !0 : (Ja[e] = !0, !1);
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
var Xs = /[\-:]([a-z])/g;
function Zs(e) {
  return e[1].toUpperCase();
}
"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(e) {
  var t = e.replace(
    Xs,
    Zs
  );
  xe[t] = new ze(t, 1, !1, e, null, !1, !1);
});
"xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(e) {
  var t = e.replace(Xs, Zs);
  xe[t] = new ze(t, 1, !1, e, "http://www.w3.org/1999/xlink", !1, !1);
});
["xml:base", "xml:lang", "xml:space"].forEach(function(e) {
  var t = e.replace(Xs, Zs);
  xe[t] = new ze(t, 1, !1, e, "http://www.w3.org/XML/1998/namespace", !1, !1);
});
["tabIndex", "crossOrigin"].forEach(function(e) {
  xe[e] = new ze(e, 1, !1, e.toLowerCase(), null, !1, !1);
});
xe.xlinkHref = new ze("xlinkHref", 1, !1, "xlink:href", "http://www.w3.org/1999/xlink", !0, !1);
["src", "href", "action", "formAction"].forEach(function(e) {
  xe[e] = new ze(e, 1, !1, e.toLowerCase(), null, !0, !0);
});
function Js(e, t, r, n) {
  var o = xe.hasOwnProperty(t) ? xe[t] : null;
  (o !== null ? o.type !== 0 : n || !(2 < t.length) || t[0] !== "o" && t[0] !== "O" || t[1] !== "n" && t[1] !== "N") && (Up(t, r, o, n) && (r = null), n || o === null ? Dp(t) && (r === null ? e.removeAttribute(t) : e.setAttribute(t, "" + r)) : o.mustUseProperty ? e[o.propertyName] = r === null ? o.type === 3 ? !1 : "" : r : (t = o.attributeName, n = o.attributeNamespace, r === null ? e.removeAttribute(t) : (o = o.type, r = o === 3 || o === 4 && r === !0 ? "" : "" + r, n ? e.setAttributeNS(n, t, r) : e.setAttribute(t, r))));
}
var Ot = Ip.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED, Ho = Symbol.for("react.element"), Vr = Symbol.for("react.portal"), Kr = Symbol.for("react.fragment"), ea = Symbol.for("react.strict_mode"), Al = Symbol.for("react.profiler"), qc = Symbol.for("react.provider"), Yc = Symbol.for("react.context"), ta = Symbol.for("react.forward_ref"), Ul = Symbol.for("react.suspense"), Ql = Symbol.for("react.suspense_list"), ra = Symbol.for("react.memo"), Ut = Symbol.for("react.lazy"), Xc = Symbol.for("react.offscreen"), tu = Symbol.iterator;
function Ln(e) {
  return e === null || typeof e != "object" ? null : (e = tu && e[tu] || e["@@iterator"], typeof e == "function" ? e : null);
}
var oe = Object.assign, fl;
function Gn(e) {
  if (fl === void 0) try {
    throw Error();
  } catch (r) {
    var t = r.stack.trim().match(/\n( *(at )?)/);
    fl = t && t[1] || "";
  }
  return `
` + fl + e;
}
var pl = !1;
function hl(e, t) {
  if (!e || pl) return "";
  pl = !0;
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
    pl = !1, Error.prepareStackTrace = r;
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
      return e = hl(e.type, !1), e;
    case 11:
      return e = hl(e.type.render, !1), e;
    case 1:
      return e = hl(e.type, !0), e;
    default:
      return "";
  }
}
function Bl(e) {
  if (e == null) return null;
  if (typeof e == "function") return e.displayName || e.name || null;
  if (typeof e == "string") return e;
  switch (e) {
    case Kr:
      return "Fragment";
    case Vr:
      return "Portal";
    case Al:
      return "Profiler";
    case ea:
      return "StrictMode";
    case Ul:
      return "Suspense";
    case Ql:
      return "SuspenseList";
  }
  if (typeof e == "object") switch (e.$$typeof) {
    case Yc:
      return (e.displayName || "Context") + ".Consumer";
    case qc:
      return (e._context.displayName || "Context") + ".Provider";
    case ta:
      var t = e.render;
      return e = e.displayName, e || (e = t.displayName || t.name || "", e = e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef"), e;
    case ra:
      return t = e.displayName || null, t !== null ? t : Bl(e.type) || "Memo";
    case Ut:
      t = e._payload, e = e._init;
      try {
        return Bl(e(t));
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
      return Bl(t);
    case 8:
      return t === ea ? "StrictMode" : "Mode";
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
function cr(e) {
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
function Wo(e) {
  e._valueTracker || (e._valueTracker = Hp(e));
}
function Jc(e) {
  if (!e) return !1;
  var t = e._valueTracker;
  if (!t) return !0;
  var r = t.getValue(), n = "";
  return e && (n = Zc(e) ? e.checked ? "true" : "false" : e.value), e = n, e !== r ? (t.setValue(e), !0) : !1;
}
function Si(e) {
  if (e = e || (typeof document < "u" ? document : void 0), typeof e > "u") return null;
  try {
    return e.activeElement || e.body;
  } catch {
    return e.body;
  }
}
function Hl(e, t) {
  var r = t.checked;
  return oe({}, t, { defaultChecked: void 0, defaultValue: void 0, value: void 0, checked: r ?? e._wrapperState.initialChecked });
}
function ru(e, t) {
  var r = t.defaultValue == null ? "" : t.defaultValue, n = t.checked != null ? t.checked : t.defaultChecked;
  r = cr(t.value != null ? t.value : r), e._wrapperState = { initialChecked: n, initialValue: r, controlled: t.type === "checkbox" || t.type === "radio" ? t.checked != null : t.value != null };
}
function ed(e, t) {
  t = t.checked, t != null && Js(e, "checked", t, !1);
}
function Wl(e, t) {
  ed(e, t);
  var r = cr(t.value), n = t.type;
  if (r != null) n === "number" ? (r === 0 && e.value === "" || e.value != r) && (e.value = "" + r) : e.value !== "" + r && (e.value = "" + r);
  else if (n === "submit" || n === "reset") {
    e.removeAttribute("value");
    return;
  }
  t.hasOwnProperty("value") ? Vl(e, t.type, r) : t.hasOwnProperty("defaultValue") && Vl(e, t.type, cr(t.defaultValue)), t.checked == null && t.defaultChecked != null && (e.defaultChecked = !!t.defaultChecked);
}
function nu(e, t, r) {
  if (t.hasOwnProperty("value") || t.hasOwnProperty("defaultValue")) {
    var n = t.type;
    if (!(n !== "submit" && n !== "reset" || t.value !== void 0 && t.value !== null)) return;
    t = "" + e._wrapperState.initialValue, r || t === e.value || (e.value = t), e.defaultValue = t;
  }
  r = e.name, r !== "" && (e.name = ""), e.defaultChecked = !!e._wrapperState.initialChecked, r !== "" && (e.name = r);
}
function Vl(e, t, r) {
  (t !== "number" || Si(e.ownerDocument) !== e) && (r == null ? e.defaultValue = "" + e._wrapperState.initialValue : e.defaultValue !== "" + r && (e.defaultValue = "" + r));
}
var qn = Array.isArray;
function on(e, t, r, n) {
  if (e = e.options, t) {
    t = {};
    for (var o = 0; o < r.length; o++) t["$" + r[o]] = !0;
    for (r = 0; r < e.length; r++) o = t.hasOwnProperty("$" + e[r].value), e[r].selected !== o && (e[r].selected = o), o && n && (e[r].defaultSelected = !0);
  } else {
    for (r = "" + cr(r), t = null, o = 0; o < e.length; o++) {
      if (e[o].value === r) {
        e[o].selected = !0, n && (e[o].defaultSelected = !0);
        return;
      }
      t !== null || e[o].disabled || (t = e[o]);
    }
    t !== null && (t.selected = !0);
  }
}
function Kl(e, t) {
  if (t.dangerouslySetInnerHTML != null) throw Error(b(91));
  return oe({}, t, { value: void 0, defaultValue: void 0, children: "" + e._wrapperState.initialValue });
}
function ou(e, t) {
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
  e._wrapperState = { initialValue: cr(r) };
}
function td(e, t) {
  var r = cr(t.value), n = cr(t.defaultValue);
  r != null && (r = "" + r, r !== e.value && (e.value = r), t.defaultValue == null && e.defaultValue !== r && (e.defaultValue = r)), n != null && (e.defaultValue = "" + n);
}
function iu(e) {
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
function Gl(e, t) {
  return e == null || e === "http://www.w3.org/1999/xhtml" ? rd(t) : e === "http://www.w3.org/2000/svg" && t === "foreignObject" ? "http://www.w3.org/1999/xhtml" : e;
}
var Vo, nd = function(e) {
  return typeof MSApp < "u" && MSApp.execUnsafeLocalFunction ? function(t, r, n, o) {
    MSApp.execUnsafeLocalFunction(function() {
      return e(t, r, n, o);
    });
  } : e;
}(function(e, t) {
  if (e.namespaceURI !== "http://www.w3.org/2000/svg" || "innerHTML" in e) e.innerHTML = t;
  else {
    for (Vo = Vo || document.createElement("div"), Vo.innerHTML = "<svg>" + t.valueOf().toString() + "</svg>", t = Vo.firstChild; e.firstChild; ) e.removeChild(e.firstChild);
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
function ql(e, t) {
  if (t) {
    if (Vp[e] && (t.children != null || t.dangerouslySetInnerHTML != null)) throw Error(b(137, e));
    if (t.dangerouslySetInnerHTML != null) {
      if (t.children != null) throw Error(b(60));
      if (typeof t.dangerouslySetInnerHTML != "object" || !("__html" in t.dangerouslySetInnerHTML)) throw Error(b(61));
    }
    if (t.style != null && typeof t.style != "object") throw Error(b(62));
  }
}
function Yl(e, t) {
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
var Xl = null;
function na(e) {
  return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
}
var Zl = null, ln = null, sn = null;
function lu(e) {
  if (e = Io(e)) {
    if (typeof Zl != "function") throw Error(b(280));
    var t = e.stateNode;
    t && (t = Zi(t), Zl(e.stateNode, e.type, t));
  }
}
function ld(e) {
  ln ? sn ? sn.push(e) : sn = [e] : ln = e;
}
function sd() {
  if (ln) {
    var e = ln, t = sn;
    if (sn = ln = null, lu(e), t) for (e = 0; e < t.length; e++) lu(t[e]);
  }
}
function ad(e, t) {
  return e(t);
}
function ud() {
}
var ml = !1;
function cd(e, t, r) {
  if (ml) return e(t, r);
  ml = !0;
  try {
    return ad(e, t, r);
  } finally {
    ml = !1, (ln !== null || sn !== null) && (ud(), sd());
  }
}
function co(e, t) {
  var r = e.stateNode;
  if (r === null) return null;
  var n = Zi(r);
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
var Jl = !1;
if (Mt) try {
  var In = {};
  Object.defineProperty(In, "passive", { get: function() {
    Jl = !0;
  } }), window.addEventListener("test", In, In), window.removeEventListener("test", In, In);
} catch {
  Jl = !1;
}
function Kp(e, t, r, n, o, i, l, s, a) {
  var u = Array.prototype.slice.call(arguments, 3);
  try {
    t.apply(r, u);
  } catch (h) {
    this.onError(h);
  }
}
var eo = !1, Ci = null, Ei = !1, es = null, Gp = { onError: function(e) {
  eo = !0, Ci = e;
} };
function qp(e, t, r, n, o, i, l, s, a) {
  eo = !1, Ci = null, Kp.apply(Gp, arguments);
}
function Yp(e, t, r, n, o, i, l, s, a) {
  if (qp.apply(this, arguments), eo) {
    if (eo) {
      var u = Ci;
      eo = !1, Ci = null;
    } else throw Error(b(198));
    Ei || (Ei = !0, es = u);
  }
}
function Ur(e) {
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
function su(e) {
  if (Ur(e) !== e) throw Error(b(188));
}
function Xp(e) {
  var t = e.alternate;
  if (!t) {
    if (t = Ur(e), t === null) throw Error(b(188));
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
        if (i === r) return su(o), e;
        if (i === n) return su(o), t;
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
var hd = Ve.unstable_scheduleCallback, au = Ve.unstable_cancelCallback, Zp = Ve.unstable_shouldYield, Jp = Ve.unstable_requestPaint, ae = Ve.unstable_now, eh = Ve.unstable_getCurrentPriorityLevel, oa = Ve.unstable_ImmediatePriority, md = Ve.unstable_UserBlockingPriority, ji = Ve.unstable_NormalPriority, th = Ve.unstable_LowPriority, gd = Ve.unstable_IdlePriority, Gi = null, yt = null;
function rh(e) {
  if (yt && typeof yt.onCommitFiberRoot == "function") try {
    yt.onCommitFiberRoot(Gi, e, void 0, (e.current.flags & 128) === 128);
  } catch {
  }
}
var at = Math.clz32 ? Math.clz32 : ih, nh = Math.log, oh = Math.LN2;
function ih(e) {
  return e >>>= 0, e === 0 ? 32 : 31 - (nh(e) / oh | 0) | 0;
}
var Ko = 64, Go = 4194304;
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
  if (n & 4 && (n |= r & 16), t = e.entangledLanes, t !== 0) for (e = e.entanglements, t &= n; 0 < t; ) r = 31 - at(t), o = 1 << r, n |= e[r], t &= ~o;
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
    var l = 31 - at(i), s = 1 << l, a = o[l];
    a === -1 ? (!(s & r) || s & n) && (o[l] = lh(s, t)) : a <= t && (e.expiredLanes |= s), i &= ~s;
  }
}
function ts(e) {
  return e = e.pendingLanes & -1073741825, e !== 0 ? e : e & 1073741824 ? 1073741824 : 0;
}
function vd() {
  var e = Ko;
  return Ko <<= 1, !(Ko & 4194240) && (Ko = 64), e;
}
function gl(e) {
  for (var t = [], r = 0; 31 > r; r++) t.push(e);
  return t;
}
function Oo(e, t, r) {
  e.pendingLanes |= t, t !== 536870912 && (e.suspendedLanes = 0, e.pingedLanes = 0), e = e.eventTimes, t = 31 - at(t), e[t] = r;
}
function ah(e, t) {
  var r = e.pendingLanes & ~t;
  e.pendingLanes = t, e.suspendedLanes = 0, e.pingedLanes = 0, e.expiredLanes &= t, e.mutableReadLanes &= t, e.entangledLanes &= t, t = e.entanglements;
  var n = e.eventTimes;
  for (e = e.expirationTimes; 0 < r; ) {
    var o = 31 - at(r), i = 1 << o;
    t[o] = 0, n[o] = -1, e[o] = -1, r &= ~i;
  }
}
function ia(e, t) {
  var r = e.entangledLanes |= t;
  for (e = e.entanglements; r; ) {
    var n = 31 - at(r), o = 1 << n;
    o & t | e[n] & t && (e[n] |= t), r &= ~o;
  }
}
var K = 0;
function yd(e) {
  return e &= -e, 1 < e ? 4 < e ? e & 268435455 ? 16 : 536870912 : 4 : 1;
}
var xd, la, wd, kd, bd, rs = !1, qo = [], tr = null, rr = null, nr = null, fo = /* @__PURE__ */ new Map(), po = /* @__PURE__ */ new Map(), Bt = [], uh = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");
function uu(e, t) {
  switch (e) {
    case "focusin":
    case "focusout":
      tr = null;
      break;
    case "dragenter":
    case "dragleave":
      rr = null;
      break;
    case "mouseover":
    case "mouseout":
      nr = null;
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
  return e === null || e.nativeEvent !== i ? (e = { blockedOn: t, domEventName: r, eventSystemFlags: n, nativeEvent: i, targetContainers: [o] }, t !== null && (t = Io(t), t !== null && la(t)), e) : (e.eventSystemFlags |= n, t = e.targetContainers, o !== null && t.indexOf(o) === -1 && t.push(o), e);
}
function ch(e, t, r, n, o) {
  switch (t) {
    case "focusin":
      return tr = $n(tr, e, t, r, n, o), !0;
    case "dragenter":
      return rr = $n(rr, e, t, r, n, o), !0;
    case "mouseover":
      return nr = $n(nr, e, t, r, n, o), !0;
    case "pointerover":
      var i = o.pointerId;
      return fo.set(i, $n(fo.get(i) || null, e, t, r, n, o)), !0;
    case "gotpointercapture":
      return i = o.pointerId, po.set(i, $n(po.get(i) || null, e, t, r, n, o)), !0;
  }
  return !1;
}
function Sd(e) {
  var t = wr(e.target);
  if (t !== null) {
    var r = Ur(t);
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
function di(e) {
  if (e.blockedOn !== null) return !1;
  for (var t = e.targetContainers; 0 < t.length; ) {
    var r = ns(e.domEventName, e.eventSystemFlags, t[0], e.nativeEvent);
    if (r === null) {
      r = e.nativeEvent;
      var n = new r.constructor(r.type, r);
      Xl = n, r.target.dispatchEvent(n), Xl = null;
    } else return t = Io(r), t !== null && la(t), e.blockedOn = r, !1;
    t.shift();
  }
  return !0;
}
function cu(e, t, r) {
  di(e) && r.delete(t);
}
function dh() {
  rs = !1, tr !== null && di(tr) && (tr = null), rr !== null && di(rr) && (rr = null), nr !== null && di(nr) && (nr = null), fo.forEach(cu), po.forEach(cu);
}
function Dn(e, t) {
  e.blockedOn === t && (e.blockedOn = null, rs || (rs = !0, Ve.unstable_scheduleCallback(Ve.unstable_NormalPriority, dh)));
}
function ho(e) {
  function t(o) {
    return Dn(o, e);
  }
  if (0 < qo.length) {
    Dn(qo[0], e);
    for (var r = 1; r < qo.length; r++) {
      var n = qo[r];
      n.blockedOn === e && (n.blockedOn = null);
    }
  }
  for (tr !== null && Dn(tr, e), rr !== null && Dn(rr, e), nr !== null && Dn(nr, e), fo.forEach(t), po.forEach(t), r = 0; r < Bt.length; r++) n = Bt[r], n.blockedOn === e && (n.blockedOn = null);
  for (; 0 < Bt.length && (r = Bt[0], r.blockedOn === null); ) Sd(r), r.blockedOn === null && Bt.shift();
}
var an = Ot.ReactCurrentBatchConfig, _i = !0;
function fh(e, t, r, n) {
  var o = K, i = an.transition;
  an.transition = null;
  try {
    K = 1, sa(e, t, r, n);
  } finally {
    K = o, an.transition = i;
  }
}
function ph(e, t, r, n) {
  var o = K, i = an.transition;
  an.transition = null;
  try {
    K = 4, sa(e, t, r, n);
  } finally {
    K = o, an.transition = i;
  }
}
function sa(e, t, r, n) {
  if (_i) {
    var o = ns(e, t, r, n);
    if (o === null) jl(e, t, n, Pi, r), uu(e, n);
    else if (ch(o, e, t, r, n)) n.stopPropagation();
    else if (uu(e, n), t & 4 && -1 < uh.indexOf(e)) {
      for (; o !== null; ) {
        var i = Io(o);
        if (i !== null && xd(i), i = ns(e, t, r, n), i === null && jl(e, t, n, Pi, r), i === o) break;
        o = i;
      }
      o !== null && n.stopPropagation();
    } else jl(e, t, n, null, r);
  }
}
var Pi = null;
function ns(e, t, r, n) {
  if (Pi = null, e = na(n), e = wr(e), e !== null) if (t = Ur(e), t === null) e = null;
  else if (r = t.tag, r === 13) {
    if (e = dd(t), e !== null) return e;
    e = null;
  } else if (r === 3) {
    if (t.stateNode.current.memoizedState.isDehydrated) return t.tag === 3 ? t.stateNode.containerInfo : null;
    e = null;
  } else t !== e && (e = null);
  return Pi = e, null;
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
        case oa:
          return 1;
        case md:
          return 4;
        case ji:
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
var Jt = null, aa = null, fi = null;
function Ed() {
  if (fi) return fi;
  var e, t = aa, r = t.length, n, o = "value" in Jt ? Jt.value : Jt.textContent, i = o.length;
  for (e = 0; e < r && t[e] === o[e]; e++) ;
  var l = r - e;
  for (n = 1; n <= l && t[r - n] === o[i - n]; n++) ;
  return fi = o.slice(e, 1 < n ? 1 - n : void 0);
}
function pi(e) {
  var t = e.keyCode;
  return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
}
function Yo() {
  return !0;
}
function du() {
  return !1;
}
function Ge(e) {
  function t(r, n, o, i, l) {
    this._reactName = r, this._targetInst = o, this.type = n, this.nativeEvent = i, this.target = l, this.currentTarget = null;
    for (var s in e) e.hasOwnProperty(s) && (r = e[s], this[s] = r ? r(i) : i[s]);
    return this.isDefaultPrevented = (i.defaultPrevented != null ? i.defaultPrevented : i.returnValue === !1) ? Yo : du, this.isPropagationStopped = du, this;
  }
  return oe(t.prototype, { preventDefault: function() {
    this.defaultPrevented = !0;
    var r = this.nativeEvent;
    r && (r.preventDefault ? r.preventDefault() : typeof r.returnValue != "unknown" && (r.returnValue = !1), this.isDefaultPrevented = Yo);
  }, stopPropagation: function() {
    var r = this.nativeEvent;
    r && (r.stopPropagation ? r.stopPropagation() : typeof r.cancelBubble != "unknown" && (r.cancelBubble = !0), this.isPropagationStopped = Yo);
  }, persist: function() {
  }, isPersistent: Yo }), t;
}
var Tn = { eventPhase: 0, bubbles: 0, cancelable: 0, timeStamp: function(e) {
  return e.timeStamp || Date.now();
}, defaultPrevented: 0, isTrusted: 0 }, ua = Ge(Tn), Lo = oe({}, Tn, { view: 0, detail: 0 }), hh = Ge(Lo), vl, yl, An, qi = oe({}, Lo, { screenX: 0, screenY: 0, clientX: 0, clientY: 0, pageX: 0, pageY: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, getModifierState: ca, button: 0, buttons: 0, relatedTarget: function(e) {
  return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget;
}, movementX: function(e) {
  return "movementX" in e ? e.movementX : (e !== An && (An && e.type === "mousemove" ? (vl = e.screenX - An.screenX, yl = e.screenY - An.screenY) : yl = vl = 0, An = e), vl);
}, movementY: function(e) {
  return "movementY" in e ? e.movementY : yl;
} }), fu = Ge(qi), mh = oe({}, qi, { dataTransfer: 0 }), gh = Ge(mh), vh = oe({}, Lo, { relatedTarget: 0 }), xl = Ge(vh), yh = oe({}, Tn, { animationName: 0, elapsedTime: 0, pseudoElement: 0 }), xh = Ge(yh), wh = oe({}, Tn, { clipboardData: function(e) {
  return "clipboardData" in e ? e.clipboardData : window.clipboardData;
} }), kh = Ge(wh), bh = oe({}, Tn, { data: 0 }), pu = Ge(bh), Sh = {
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
function jh(e) {
  var t = this.nativeEvent;
  return t.getModifierState ? t.getModifierState(e) : (e = Eh[e]) ? !!t[e] : !1;
}
function ca() {
  return jh;
}
var Nh = oe({}, Lo, { key: function(e) {
  if (e.key) {
    var t = Sh[e.key] || e.key;
    if (t !== "Unidentified") return t;
  }
  return e.type === "keypress" ? (e = pi(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? Ch[e.keyCode] || "Unidentified" : "";
}, code: 0, location: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, repeat: 0, locale: 0, getModifierState: ca, charCode: function(e) {
  return e.type === "keypress" ? pi(e) : 0;
}, keyCode: function(e) {
  return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
}, which: function(e) {
  return e.type === "keypress" ? pi(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
} }), _h = Ge(Nh), Ph = oe({}, qi, { pointerId: 0, width: 0, height: 0, pressure: 0, tangentialPressure: 0, tiltX: 0, tiltY: 0, twist: 0, pointerType: 0, isPrimary: 0 }), hu = Ge(Ph), zh = oe({}, Lo, { touches: 0, targetTouches: 0, changedTouches: 0, altKey: 0, metaKey: 0, ctrlKey: 0, shiftKey: 0, getModifierState: ca }), Mh = Ge(zh), Rh = oe({}, Tn, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 }), Th = Ge(Rh), Fh = oe({}, qi, {
  deltaX: function(e) {
    return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
  },
  deltaY: function(e) {
    return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
  },
  deltaZ: 0,
  deltaMode: 0
}), Oh = Ge(Fh), Lh = [9, 13, 27, 32], da = Mt && "CompositionEvent" in window, to = null;
Mt && "documentMode" in document && (to = document.documentMode);
var Ih = Mt && "TextEvent" in window && !to, jd = Mt && (!da || to && 8 < to && 11 >= to), mu = " ", gu = !1;
function Nd(e, t) {
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
var Gr = !1;
function $h(e, t) {
  switch (e) {
    case "compositionend":
      return _d(t);
    case "keypress":
      return t.which !== 32 ? null : (gu = !0, mu);
    case "textInput":
      return e = t.data, e === mu && gu ? null : e;
    default:
      return null;
  }
}
function Dh(e, t) {
  if (Gr) return e === "compositionend" || !da && Nd(e, t) ? (e = Ed(), fi = aa = Jt = null, Gr = !1, e) : null;
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
      return jd && t.locale !== "ko" ? null : t.data;
    default:
      return null;
  }
}
var Ah = { color: !0, date: !0, datetime: !0, "datetime-local": !0, email: !0, month: !0, number: !0, password: !0, range: !0, search: !0, tel: !0, text: !0, time: !0, url: !0, week: !0 };
function vu(e) {
  var t = e && e.nodeName && e.nodeName.toLowerCase();
  return t === "input" ? !!Ah[e.type] : t === "textarea";
}
function Pd(e, t, r, n) {
  ld(n), t = zi(t, "onChange"), 0 < t.length && (r = new ua("onChange", "change", null, r, n), e.push({ event: r, listeners: t }));
}
var ro = null, mo = null;
function Uh(e) {
  Ad(e, 0);
}
function Yi(e) {
  var t = Xr(e);
  if (Jc(t)) return e;
}
function Qh(e, t) {
  if (e === "change") return t;
}
var zd = !1;
if (Mt) {
  var wl;
  if (Mt) {
    var kl = "oninput" in document;
    if (!kl) {
      var yu = document.createElement("div");
      yu.setAttribute("oninput", "return;"), kl = typeof yu.oninput == "function";
    }
    wl = kl;
  } else wl = !1;
  zd = wl && (!document.documentMode || 9 < document.documentMode);
}
function xu() {
  ro && (ro.detachEvent("onpropertychange", Md), mo = ro = null);
}
function Md(e) {
  if (e.propertyName === "value" && Yi(mo)) {
    var t = [];
    Pd(t, mo, e, na(e)), cd(Uh, t);
  }
}
function Bh(e, t, r) {
  e === "focusin" ? (xu(), ro = t, mo = r, ro.attachEvent("onpropertychange", Md)) : e === "focusout" && xu();
}
function Hh(e) {
  if (e === "selectionchange" || e === "keyup" || e === "keydown") return Yi(mo);
}
function Wh(e, t) {
  if (e === "click") return Yi(t);
}
function Vh(e, t) {
  if (e === "input" || e === "change") return Yi(t);
}
function Kh(e, t) {
  return e === t && (e !== 0 || 1 / e === 1 / t) || e !== e && t !== t;
}
var ct = typeof Object.is == "function" ? Object.is : Kh;
function go(e, t) {
  if (ct(e, t)) return !0;
  if (typeof e != "object" || e === null || typeof t != "object" || t === null) return !1;
  var r = Object.keys(e), n = Object.keys(t);
  if (r.length !== n.length) return !1;
  for (n = 0; n < r.length; n++) {
    var o = r[n];
    if (!Dl.call(t, o) || !ct(e[o], t[o])) return !1;
  }
  return !0;
}
function wu(e) {
  for (; e && e.firstChild; ) e = e.firstChild;
  return e;
}
function ku(e, t) {
  var r = wu(e);
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
    r = wu(r);
  }
}
function Rd(e, t) {
  return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? Rd(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1;
}
function Td() {
  for (var e = window, t = Si(); t instanceof e.HTMLIFrameElement; ) {
    try {
      var r = typeof t.contentWindow.location.href == "string";
    } catch {
      r = !1;
    }
    if (r) e = t.contentWindow;
    else break;
    t = Si(e.document);
  }
  return t;
}
function fa(e) {
  var t = e && e.nodeName && e.nodeName.toLowerCase();
  return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
}
function Gh(e) {
  var t = Td(), r = e.focusedElem, n = e.selectionRange;
  if (t !== r && r && r.ownerDocument && Rd(r.ownerDocument.documentElement, r)) {
    if (n !== null && fa(r)) {
      if (t = n.start, e = n.end, e === void 0 && (e = t), "selectionStart" in r) r.selectionStart = t, r.selectionEnd = Math.min(e, r.value.length);
      else if (e = (t = r.ownerDocument || document) && t.defaultView || window, e.getSelection) {
        e = e.getSelection();
        var o = r.textContent.length, i = Math.min(n.start, o);
        n = n.end === void 0 ? i : Math.min(n.end, o), !e.extend && i > n && (o = n, n = i, i = o), o = ku(r, i);
        var l = ku(
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
var qh = Mt && "documentMode" in document && 11 >= document.documentMode, qr = null, os = null, no = null, is = !1;
function bu(e, t, r) {
  var n = r.window === r ? r.document : r.nodeType === 9 ? r : r.ownerDocument;
  is || qr == null || qr !== Si(n) || (n = qr, "selectionStart" in n && fa(n) ? n = { start: n.selectionStart, end: n.selectionEnd } : (n = (n.ownerDocument && n.ownerDocument.defaultView || window).getSelection(), n = { anchorNode: n.anchorNode, anchorOffset: n.anchorOffset, focusNode: n.focusNode, focusOffset: n.focusOffset }), no && go(no, n) || (no = n, n = zi(os, "onSelect"), 0 < n.length && (t = new ua("onSelect", "select", null, t, r), e.push({ event: t, listeners: n }), t.target = qr)));
}
function Xo(e, t) {
  var r = {};
  return r[e.toLowerCase()] = t.toLowerCase(), r["Webkit" + e] = "webkit" + t, r["Moz" + e] = "moz" + t, r;
}
var Yr = { animationend: Xo("Animation", "AnimationEnd"), animationiteration: Xo("Animation", "AnimationIteration"), animationstart: Xo("Animation", "AnimationStart"), transitionend: Xo("Transition", "TransitionEnd") }, bl = {}, Fd = {};
Mt && (Fd = document.createElement("div").style, "AnimationEvent" in window || (delete Yr.animationend.animation, delete Yr.animationiteration.animation, delete Yr.animationstart.animation), "TransitionEvent" in window || delete Yr.transitionend.transition);
function Xi(e) {
  if (bl[e]) return bl[e];
  if (!Yr[e]) return e;
  var t = Yr[e], r;
  for (r in t) if (t.hasOwnProperty(r) && r in Fd) return bl[e] = t[r];
  return e;
}
var Od = Xi("animationend"), Ld = Xi("animationiteration"), Id = Xi("animationstart"), $d = Xi("transitionend"), Dd = /* @__PURE__ */ new Map(), Su = "abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
function fr(e, t) {
  Dd.set(e, t), Ar(t, [e]);
}
for (var Sl = 0; Sl < Su.length; Sl++) {
  var Cl = Su[Sl], Yh = Cl.toLowerCase(), Xh = Cl[0].toUpperCase() + Cl.slice(1);
  fr(Yh, "on" + Xh);
}
fr(Od, "onAnimationEnd");
fr(Ld, "onAnimationIteration");
fr(Id, "onAnimationStart");
fr("dblclick", "onDoubleClick");
fr("focusin", "onFocus");
fr("focusout", "onBlur");
fr($d, "onTransitionEnd");
En("onMouseEnter", ["mouseout", "mouseover"]);
En("onMouseLeave", ["mouseout", "mouseover"]);
En("onPointerEnter", ["pointerout", "pointerover"]);
En("onPointerLeave", ["pointerout", "pointerover"]);
Ar("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" "));
Ar("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));
Ar("onBeforeInput", ["compositionend", "keypress", "textInput", "paste"]);
Ar("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" "));
Ar("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" "));
Ar("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
var Xn = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), Zh = new Set("cancel close invalid load scroll toggle".split(" ").concat(Xn));
function Cu(e, t, r) {
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
        Cu(o, s, u), i = a;
      }
      else for (l = 0; l < n.length; l++) {
        if (s = n[l], a = s.instance, u = s.currentTarget, s = s.listener, a !== i && o.isPropagationStopped()) break e;
        Cu(o, s, u), i = a;
      }
    }
  }
  if (Ei) throw e = es, Ei = !1, es = null, e;
}
function Z(e, t) {
  var r = t[cs];
  r === void 0 && (r = t[cs] = /* @__PURE__ */ new Set());
  var n = e + "__bubble";
  r.has(n) || (Ud(t, e, 2, !1), r.add(n));
}
function El(e, t, r) {
  var n = 0;
  t && (n |= 4), Ud(r, e, n, t);
}
var Zo = "_reactListening" + Math.random().toString(36).slice(2);
function vo(e) {
  if (!e[Zo]) {
    e[Zo] = !0, Gc.forEach(function(r) {
      r !== "selectionchange" && (Zh.has(r) || El(r, !1, e), El(r, !0, e));
    });
    var t = e.nodeType === 9 ? e : e.ownerDocument;
    t === null || t[Zo] || (t[Zo] = !0, El("selectionchange", !1, t));
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
      o = sa;
  }
  r = o.bind(null, t, r, e), o = void 0, !Jl || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (o = !0), n ? o !== void 0 ? e.addEventListener(t, r, { capture: !0, passive: o }) : e.addEventListener(t, r, !0) : o !== void 0 ? e.addEventListener(t, r, { passive: o }) : e.addEventListener(t, r, !1);
}
function jl(e, t, r, n, o) {
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
        if (l = wr(s), l === null) return;
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
    var u = i, h = na(r), v = [];
    e: {
      var g = Dd.get(e);
      if (g !== void 0) {
        var y = ua, x = e;
        switch (e) {
          case "keypress":
            if (pi(r) === 0) break e;
          case "keydown":
          case "keyup":
            y = _h;
            break;
          case "focusin":
            x = "focus", y = xl;
            break;
          case "focusout":
            x = "blur", y = xl;
            break;
          case "beforeblur":
          case "afterblur":
            y = xl;
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
            y = fu;
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
          case $d:
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
            y = hu;
        }
        var w = (t & 4) !== 0, C = !w && e === "scroll", p = w ? g !== null ? g + "Capture" : null : g;
        w = [];
        for (var d = u, m; d !== null; ) {
          m = d;
          var k = m.stateNode;
          if (m.tag === 5 && k !== null && (m = k, p !== null && (k = co(d, p), k != null && w.push(yo(d, k, m)))), C) break;
          d = d.return;
        }
        0 < w.length && (g = new y(g, x, null, r, h), v.push({ event: g, listeners: w }));
      }
    }
    if (!(t & 7)) {
      e: {
        if (g = e === "mouseover" || e === "pointerover", y = e === "mouseout" || e === "pointerout", g && r !== Xl && (x = r.relatedTarget || r.fromElement) && (wr(x) || x[Rt])) break e;
        if ((y || g) && (g = h.window === h ? h : (g = h.ownerDocument) ? g.defaultView || g.parentWindow : window, y ? (x = r.relatedTarget || r.toElement, y = u, x = x ? wr(x) : null, x !== null && (C = Ur(x), x !== C || x.tag !== 5 && x.tag !== 6) && (x = null)) : (y = null, x = u), y !== x)) {
          if (w = fu, k = "onMouseLeave", p = "onMouseEnter", d = "mouse", (e === "pointerout" || e === "pointerover") && (w = hu, k = "onPointerLeave", p = "onPointerEnter", d = "pointer"), C = y == null ? g : Xr(y), m = x == null ? g : Xr(x), g = new w(k, d + "leave", y, r, h), g.target = C, g.relatedTarget = m, k = null, wr(h) === u && (w = new w(p, d + "enter", x, r, h), w.target = m, w.relatedTarget = C, k = w), C = k, y && x) t: {
            for (w = y, p = x, d = 0, m = w; m; m = Hr(m)) d++;
            for (m = 0, k = p; k; k = Hr(k)) m++;
            for (; 0 < d - m; ) w = Hr(w), d--;
            for (; 0 < m - d; ) p = Hr(p), m--;
            for (; d--; ) {
              if (w === p || p !== null && w === p.alternate) break t;
              w = Hr(w), p = Hr(p);
            }
            w = null;
          }
          else w = null;
          y !== null && Eu(v, g, y, w, !1), x !== null && C !== null && Eu(v, C, x, w, !0);
        }
      }
      e: {
        if (g = u ? Xr(u) : window, y = g.nodeName && g.nodeName.toLowerCase(), y === "select" || y === "input" && g.type === "file") var S = Qh;
        else if (vu(g)) if (zd) S = Vh;
        else {
          S = Hh;
          var _ = Bh;
        }
        else (y = g.nodeName) && y.toLowerCase() === "input" && (g.type === "checkbox" || g.type === "radio") && (S = Wh);
        if (S && (S = S(e, u))) {
          Pd(v, S, r, h);
          break e;
        }
        _ && _(e, g, u), e === "focusout" && (_ = g._wrapperState) && _.controlled && g.type === "number" && Vl(g, "number", g.value);
      }
      switch (_ = u ? Xr(u) : window, e) {
        case "focusin":
          (vu(_) || _.contentEditable === "true") && (qr = _, os = u, no = null);
          break;
        case "focusout":
          no = os = qr = null;
          break;
        case "mousedown":
          is = !0;
          break;
        case "contextmenu":
        case "mouseup":
        case "dragend":
          is = !1, bu(v, r, h);
          break;
        case "selectionchange":
          if (qh) break;
        case "keydown":
        case "keyup":
          bu(v, r, h);
      }
      var j;
      if (da) e: {
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
      else Gr ? Nd(e, r) && (P = "onCompositionEnd") : e === "keydown" && r.keyCode === 229 && (P = "onCompositionStart");
      P && (jd && r.locale !== "ko" && (Gr || P !== "onCompositionStart" ? P === "onCompositionEnd" && Gr && (j = Ed()) : (Jt = h, aa = "value" in Jt ? Jt.value : Jt.textContent, Gr = !0)), _ = zi(u, P), 0 < _.length && (P = new pu(P, e, null, r, h), v.push({ event: P, listeners: _ }), j ? P.data = j : (j = _d(r), j !== null && (P.data = j)))), (j = Ih ? $h(e, r) : Dh(e, r)) && (u = zi(u, "onBeforeInput"), 0 < u.length && (h = new pu("onBeforeInput", "beforeinput", null, r, h), v.push({ event: h, listeners: u }), h.data = j));
    }
    Ad(v, t);
  });
}
function yo(e, t, r) {
  return { instance: e, listener: t, currentTarget: r };
}
function zi(e, t) {
  for (var r = t + "Capture", n = []; e !== null; ) {
    var o = e, i = o.stateNode;
    o.tag === 5 && i !== null && (o = i, i = co(e, r), i != null && n.unshift(yo(e, i, o)), i = co(e, t), i != null && n.push(yo(e, i, o))), e = e.return;
  }
  return n;
}
function Hr(e) {
  if (e === null) return null;
  do
    e = e.return;
  while (e && e.tag !== 5);
  return e || null;
}
function Eu(e, t, r, n, o) {
  for (var i = t._reactName, l = []; r !== null && r !== n; ) {
    var s = r, a = s.alternate, u = s.stateNode;
    if (a !== null && a === n) break;
    s.tag === 5 && u !== null && (s = u, o ? (a = co(r, i), a != null && l.unshift(yo(r, a, s))) : o || (a = co(r, i), a != null && l.push(yo(r, a, s)))), r = r.return;
  }
  l.length !== 0 && e.push({ event: t, listeners: l });
}
var Jh = /\r\n?/g, em = /\u0000|\uFFFD/g;
function ju(e) {
  return (typeof e == "string" ? e : "" + e).replace(Jh, `
`).replace(em, "");
}
function Jo(e, t, r) {
  if (t = ju(t), ju(e) !== t && r) throw Error(b(425));
}
function Mi() {
}
var ls = null, ss = null;
function as(e, t) {
  return e === "textarea" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
}
var us = typeof setTimeout == "function" ? setTimeout : void 0, tm = typeof clearTimeout == "function" ? clearTimeout : void 0, Nu = typeof Promise == "function" ? Promise : void 0, rm = typeof queueMicrotask == "function" ? queueMicrotask : typeof Nu < "u" ? function(e) {
  return Nu.resolve(null).then(e).catch(nm);
} : us;
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
function or(e) {
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
function _u(e) {
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
var Fn = Math.random().toString(36).slice(2), vt = "__reactFiber$" + Fn, xo = "__reactProps$" + Fn, Rt = "__reactContainer$" + Fn, cs = "__reactEvents$" + Fn, om = "__reactListeners$" + Fn, im = "__reactHandles$" + Fn;
function wr(e) {
  var t = e[vt];
  if (t) return t;
  for (var r = e.parentNode; r; ) {
    if (t = r[Rt] || r[vt]) {
      if (r = t.alternate, t.child !== null || r !== null && r.child !== null) for (e = _u(e); e !== null; ) {
        if (r = e[vt]) return r;
        e = _u(e);
      }
      return t;
    }
    e = r, r = e.parentNode;
  }
  return null;
}
function Io(e) {
  return e = e[vt] || e[Rt], !e || e.tag !== 5 && e.tag !== 6 && e.tag !== 13 && e.tag !== 3 ? null : e;
}
function Xr(e) {
  if (e.tag === 5 || e.tag === 6) return e.stateNode;
  throw Error(b(33));
}
function Zi(e) {
  return e[xo] || null;
}
var ds = [], Zr = -1;
function pr(e) {
  return { current: e };
}
function J(e) {
  0 > Zr || (e.current = ds[Zr], ds[Zr] = null, Zr--);
}
function q(e, t) {
  Zr++, ds[Zr] = e.current, e.current = t;
}
var dr = {}, Ce = pr(dr), Ie = pr(!1), Or = dr;
function jn(e, t) {
  var r = e.type.contextTypes;
  if (!r) return dr;
  var n = e.stateNode;
  if (n && n.__reactInternalMemoizedUnmaskedChildContext === t) return n.__reactInternalMemoizedMaskedChildContext;
  var o = {}, i;
  for (i in r) o[i] = t[i];
  return n && (e = e.stateNode, e.__reactInternalMemoizedUnmaskedChildContext = t, e.__reactInternalMemoizedMaskedChildContext = o), o;
}
function $e(e) {
  return e = e.childContextTypes, e != null;
}
function Ri() {
  J(Ie), J(Ce);
}
function Pu(e, t, r) {
  if (Ce.current !== dr) throw Error(b(168));
  q(Ce, t), q(Ie, r);
}
function Qd(e, t, r) {
  var n = e.stateNode;
  if (t = t.childContextTypes, typeof n.getChildContext != "function") return r;
  n = n.getChildContext();
  for (var o in n) if (!(o in t)) throw Error(b(108, Bp(e) || "Unknown", o));
  return oe({}, r, n);
}
function Ti(e) {
  return e = (e = e.stateNode) && e.__reactInternalMemoizedMergedChildContext || dr, Or = Ce.current, q(Ce, e), q(Ie, Ie.current), !0;
}
function zu(e, t, r) {
  var n = e.stateNode;
  if (!n) throw Error(b(169));
  r ? (e = Qd(e, t, Or), n.__reactInternalMemoizedMergedChildContext = e, J(Ie), J(Ce), q(Ce, e)) : J(Ie), q(Ie, r);
}
var Et = null, Ji = !1, _l = !1;
function Bd(e) {
  Et === null ? Et = [e] : Et.push(e);
}
function lm(e) {
  Ji = !0, Bd(e);
}
function hr() {
  if (!_l && Et !== null) {
    _l = !0;
    var e = 0, t = K;
    try {
      var r = Et;
      for (K = 1; e < r.length; e++) {
        var n = r[e];
        do
          n = n(!0);
        while (n !== null);
      }
      Et = null, Ji = !1;
    } catch (o) {
      throw Et !== null && (Et = Et.slice(e + 1)), hd(oa, hr), o;
    } finally {
      K = t, _l = !1;
    }
  }
  return null;
}
var Jr = [], en = 0, Fi = null, Oi = 0, Xe = [], Ze = 0, Lr = null, _t = 1, Pt = "";
function vr(e, t) {
  Jr[en++] = Oi, Jr[en++] = Fi, Fi = e, Oi = t;
}
function Hd(e, t, r) {
  Xe[Ze++] = _t, Xe[Ze++] = Pt, Xe[Ze++] = Lr, Lr = e;
  var n = _t;
  e = Pt;
  var o = 32 - at(n) - 1;
  n &= ~(1 << o), r += 1;
  var i = 32 - at(t) + o;
  if (30 < i) {
    var l = o - o % 5;
    i = (n & (1 << l) - 1).toString(32), n >>= l, o -= l, _t = 1 << 32 - at(t) + o | r << o | n, Pt = i + e;
  } else _t = 1 << i | r << o | n, Pt = e;
}
function pa(e) {
  e.return !== null && (vr(e, 1), Hd(e, 1, 0));
}
function ha(e) {
  for (; e === Fi; ) Fi = Jr[--en], Jr[en] = null, Oi = Jr[--en], Jr[en] = null;
  for (; e === Lr; ) Lr = Xe[--Ze], Xe[Ze] = null, Pt = Xe[--Ze], Xe[Ze] = null, _t = Xe[--Ze], Xe[Ze] = null;
}
var We = null, He = null, te = !1, st = null;
function Wd(e, t) {
  var r = Je(5, null, null, 0);
  r.elementType = "DELETED", r.stateNode = t, r.return = e, t = e.deletions, t === null ? (e.deletions = [r], e.flags |= 16) : t.push(r);
}
function Mu(e, t) {
  switch (e.tag) {
    case 5:
      var r = e.type;
      return t = t.nodeType !== 1 || r.toLowerCase() !== t.nodeName.toLowerCase() ? null : t, t !== null ? (e.stateNode = t, We = e, He = or(t.firstChild), !0) : !1;
    case 6:
      return t = e.pendingProps === "" || t.nodeType !== 3 ? null : t, t !== null ? (e.stateNode = t, We = e, He = null, !0) : !1;
    case 13:
      return t = t.nodeType !== 8 ? null : t, t !== null ? (r = Lr !== null ? { id: _t, overflow: Pt } : null, e.memoizedState = { dehydrated: t, treeContext: r, retryLane: 1073741824 }, r = Je(18, null, null, 0), r.stateNode = t, r.return = e, e.child = r, We = e, He = null, !0) : !1;
    default:
      return !1;
  }
}
function fs(e) {
  return (e.mode & 1) !== 0 && (e.flags & 128) === 0;
}
function ps(e) {
  if (te) {
    var t = He;
    if (t) {
      var r = t;
      if (!Mu(e, t)) {
        if (fs(e)) throw Error(b(418));
        t = or(r.nextSibling);
        var n = We;
        t && Mu(e, t) ? Wd(n, r) : (e.flags = e.flags & -4097 | 2, te = !1, We = e);
      }
    } else {
      if (fs(e)) throw Error(b(418));
      e.flags = e.flags & -4097 | 2, te = !1, We = e;
    }
  }
}
function Ru(e) {
  for (e = e.return; e !== null && e.tag !== 5 && e.tag !== 3 && e.tag !== 13; ) e = e.return;
  We = e;
}
function ei(e) {
  if (e !== We) return !1;
  if (!te) return Ru(e), te = !0, !1;
  var t;
  if ((t = e.tag !== 3) && !(t = e.tag !== 5) && (t = e.type, t = t !== "head" && t !== "body" && !as(e.type, e.memoizedProps)), t && (t = He)) {
    if (fs(e)) throw Vd(), Error(b(418));
    for (; t; ) Wd(e, t), t = or(t.nextSibling);
  }
  if (Ru(e), e.tag === 13) {
    if (e = e.memoizedState, e = e !== null ? e.dehydrated : null, !e) throw Error(b(317));
    e: {
      for (e = e.nextSibling, t = 0; e; ) {
        if (e.nodeType === 8) {
          var r = e.data;
          if (r === "/$") {
            if (t === 0) {
              He = or(e.nextSibling);
              break e;
            }
            t--;
          } else r !== "$" && r !== "$!" && r !== "$?" || t++;
        }
        e = e.nextSibling;
      }
      He = null;
    }
  } else He = We ? or(e.stateNode.nextSibling) : null;
  return !0;
}
function Vd() {
  for (var e = He; e; ) e = or(e.nextSibling);
}
function Nn() {
  He = We = null, te = !1;
}
function ma(e) {
  st === null ? st = [e] : st.push(e);
}
var sm = Ot.ReactCurrentBatchConfig;
function Un(e, t, r) {
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
function ti(e, t) {
  throw e = Object.prototype.toString.call(t), Error(b(31, e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e));
}
function Tu(e) {
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
    return p = ar(p, d), p.index = 0, p.sibling = null, p;
  }
  function i(p, d, m) {
    return p.index = m, e ? (m = p.alternate, m !== null ? (m = m.index, m < d ? (p.flags |= 2, d) : m) : (p.flags |= 2, d)) : (p.flags |= 1048576, d);
  }
  function l(p) {
    return e && p.alternate === null && (p.flags |= 2), p;
  }
  function s(p, d, m, k) {
    return d === null || d.tag !== 6 ? (d = Ol(m, p.mode, k), d.return = p, d) : (d = o(d, m), d.return = p, d);
  }
  function a(p, d, m, k) {
    var S = m.type;
    return S === Kr ? h(p, d, m.props.children, k, m.key) : d !== null && (d.elementType === S || typeof S == "object" && S !== null && S.$$typeof === Ut && Tu(S) === d.type) ? (k = o(d, m.props), k.ref = Un(p, d, m), k.return = p, k) : (k = wi(m.type, m.key, m.props, null, p.mode, k), k.ref = Un(p, d, m), k.return = p, k);
  }
  function u(p, d, m, k) {
    return d === null || d.tag !== 4 || d.stateNode.containerInfo !== m.containerInfo || d.stateNode.implementation !== m.implementation ? (d = Ll(m, p.mode, k), d.return = p, d) : (d = o(d, m.children || []), d.return = p, d);
  }
  function h(p, d, m, k, S) {
    return d === null || d.tag !== 7 ? (d = Fr(m, p.mode, k, S), d.return = p, d) : (d = o(d, m), d.return = p, d);
  }
  function v(p, d, m) {
    if (typeof d == "string" && d !== "" || typeof d == "number") return d = Ol("" + d, p.mode, m), d.return = p, d;
    if (typeof d == "object" && d !== null) {
      switch (d.$$typeof) {
        case Ho:
          return m = wi(d.type, d.key, d.props, null, p.mode, m), m.ref = Un(p, null, d), m.return = p, m;
        case Vr:
          return d = Ll(d, p.mode, m), d.return = p, d;
        case Ut:
          var k = d._init;
          return v(p, k(d._payload), m);
      }
      if (qn(d) || Ln(d)) return d = Fr(d, p.mode, m, null), d.return = p, d;
      ti(p, d);
    }
    return null;
  }
  function g(p, d, m, k) {
    var S = d !== null ? d.key : null;
    if (typeof m == "string" && m !== "" || typeof m == "number") return S !== null ? null : s(p, d, "" + m, k);
    if (typeof m == "object" && m !== null) {
      switch (m.$$typeof) {
        case Ho:
          return m.key === S ? a(p, d, m, k) : null;
        case Vr:
          return m.key === S ? u(p, d, m, k) : null;
        case Ut:
          return S = m._init, g(
            p,
            d,
            S(m._payload),
            k
          );
      }
      if (qn(m) || Ln(m)) return S !== null ? null : h(p, d, m, k, null);
      ti(p, m);
    }
    return null;
  }
  function y(p, d, m, k, S) {
    if (typeof k == "string" && k !== "" || typeof k == "number") return p = p.get(m) || null, s(d, p, "" + k, S);
    if (typeof k == "object" && k !== null) {
      switch (k.$$typeof) {
        case Ho:
          return p = p.get(k.key === null ? m : k.key) || null, a(d, p, k, S);
        case Vr:
          return p = p.get(k.key === null ? m : k.key) || null, u(d, p, k, S);
        case Ut:
          var _ = k._init;
          return y(p, d, m, _(k._payload), S);
      }
      if (qn(k) || Ln(k)) return p = p.get(m) || null, h(d, p, k, S, null);
      ti(d, k);
    }
    return null;
  }
  function x(p, d, m, k) {
    for (var S = null, _ = null, j = d, P = d = 0, R = null; j !== null && P < m.length; P++) {
      j.index > P ? (R = j, j = null) : R = j.sibling;
      var T = g(p, j, m[P], k);
      if (T === null) {
        j === null && (j = R);
        break;
      }
      e && j && T.alternate === null && t(p, j), d = i(T, d, P), _ === null ? S = T : _.sibling = T, _ = T, j = R;
    }
    if (P === m.length) return r(p, j), te && vr(p, P), S;
    if (j === null) {
      for (; P < m.length; P++) j = v(p, m[P], k), j !== null && (d = i(j, d, P), _ === null ? S = j : _.sibling = j, _ = j);
      return te && vr(p, P), S;
    }
    for (j = n(p, j); P < m.length; P++) R = y(j, p, P, m[P], k), R !== null && (e && R.alternate !== null && j.delete(R.key === null ? P : R.key), d = i(R, d, P), _ === null ? S = R : _.sibling = R, _ = R);
    return e && j.forEach(function(Y) {
      return t(p, Y);
    }), te && vr(p, P), S;
  }
  function w(p, d, m, k) {
    var S = Ln(m);
    if (typeof S != "function") throw Error(b(150));
    if (m = S.call(m), m == null) throw Error(b(151));
    for (var _ = S = null, j = d, P = d = 0, R = null, T = m.next(); j !== null && !T.done; P++, T = m.next()) {
      j.index > P ? (R = j, j = null) : R = j.sibling;
      var Y = g(p, j, T.value, k);
      if (Y === null) {
        j === null && (j = R);
        break;
      }
      e && j && Y.alternate === null && t(p, j), d = i(Y, d, P), _ === null ? S = Y : _.sibling = Y, _ = Y, j = R;
    }
    if (T.done) return r(
      p,
      j
    ), te && vr(p, P), S;
    if (j === null) {
      for (; !T.done; P++, T = m.next()) T = v(p, T.value, k), T !== null && (d = i(T, d, P), _ === null ? S = T : _.sibling = T, _ = T);
      return te && vr(p, P), S;
    }
    for (j = n(p, j); !T.done; P++, T = m.next()) T = y(j, p, P, T.value, k), T !== null && (e && T.alternate !== null && j.delete(T.key === null ? P : T.key), d = i(T, d, P), _ === null ? S = T : _.sibling = T, _ = T);
    return e && j.forEach(function(U) {
      return t(p, U);
    }), te && vr(p, P), S;
  }
  function C(p, d, m, k) {
    if (typeof m == "object" && m !== null && m.type === Kr && m.key === null && (m = m.props.children), typeof m == "object" && m !== null) {
      switch (m.$$typeof) {
        case Ho:
          e: {
            for (var S = m.key, _ = d; _ !== null; ) {
              if (_.key === S) {
                if (S = m.type, S === Kr) {
                  if (_.tag === 7) {
                    r(p, _.sibling), d = o(_, m.props.children), d.return = p, p = d;
                    break e;
                  }
                } else if (_.elementType === S || typeof S == "object" && S !== null && S.$$typeof === Ut && Tu(S) === _.type) {
                  r(p, _.sibling), d = o(_, m.props), d.ref = Un(p, _, m), d.return = p, p = d;
                  break e;
                }
                r(p, _);
                break;
              } else t(p, _);
              _ = _.sibling;
            }
            m.type === Kr ? (d = Fr(m.props.children, p.mode, k, m.key), d.return = p, p = d) : (k = wi(m.type, m.key, m.props, null, p.mode, k), k.ref = Un(p, d, m), k.return = p, p = k);
          }
          return l(p);
        case Vr:
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
            d = Ll(m, p.mode, k), d.return = p, p = d;
          }
          return l(p);
        case Ut:
          return _ = m._init, C(p, d, _(m._payload), k);
      }
      if (qn(m)) return x(p, d, m, k);
      if (Ln(m)) return w(p, d, m, k);
      ti(p, m);
    }
    return typeof m == "string" && m !== "" || typeof m == "number" ? (m = "" + m, d !== null && d.tag === 6 ? (r(p, d.sibling), d = o(d, m), d.return = p, p = d) : (r(p, d), d = Ol(m, p.mode, k), d.return = p, p = d), l(p)) : r(p, d);
  }
  return C;
}
var _n = Kd(!0), Gd = Kd(!1), Li = pr(null), Ii = null, tn = null, ga = null;
function va() {
  ga = tn = Ii = null;
}
function ya(e) {
  var t = Li.current;
  J(Li), e._currentValue = t;
}
function hs(e, t, r) {
  for (; e !== null; ) {
    var n = e.alternate;
    if ((e.childLanes & t) !== t ? (e.childLanes |= t, n !== null && (n.childLanes |= t)) : n !== null && (n.childLanes & t) !== t && (n.childLanes |= t), e === r) break;
    e = e.return;
  }
}
function un(e, t) {
  Ii = e, ga = tn = null, e = e.dependencies, e !== null && e.firstContext !== null && (e.lanes & t && (Le = !0), e.firstContext = null);
}
function tt(e) {
  var t = e._currentValue;
  if (ga !== e) if (e = { context: e, memoizedValue: t, next: null }, tn === null) {
    if (Ii === null) throw Error(b(308));
    tn = e, Ii.dependencies = { lanes: 0, firstContext: e };
  } else tn = tn.next = e;
  return t;
}
var kr = null;
function xa(e) {
  kr === null ? kr = [e] : kr.push(e);
}
function qd(e, t, r, n) {
  var o = t.interleaved;
  return o === null ? (r.next = r, xa(t)) : (r.next = o.next, o.next = r), t.interleaved = r, Tt(e, n);
}
function Tt(e, t) {
  e.lanes |= t;
  var r = e.alternate;
  for (r !== null && (r.lanes |= t), r = e, e = e.return; e !== null; ) e.childLanes |= t, r = e.alternate, r !== null && (r.childLanes |= t), r = e, e = e.return;
  return r.tag === 3 ? r.stateNode : null;
}
var Qt = !1;
function wa(e) {
  e.updateQueue = { baseState: e.memoizedState, firstBaseUpdate: null, lastBaseUpdate: null, shared: { pending: null, interleaved: null, lanes: 0 }, effects: null };
}
function Yd(e, t) {
  e = e.updateQueue, t.updateQueue === e && (t.updateQueue = { baseState: e.baseState, firstBaseUpdate: e.firstBaseUpdate, lastBaseUpdate: e.lastBaseUpdate, shared: e.shared, effects: e.effects });
}
function zt(e, t) {
  return { eventTime: e, lane: t, tag: 0, payload: null, callback: null, next: null };
}
function ir(e, t, r) {
  var n = e.updateQueue;
  if (n === null) return null;
  if (n = n.shared, W & 2) {
    var o = n.pending;
    return o === null ? t.next = t : (t.next = o.next, o.next = t), n.pending = t, Tt(e, r);
  }
  return o = n.interleaved, o === null ? (t.next = t, xa(n)) : (t.next = o.next, o.next = t), n.interleaved = t, Tt(e, r);
}
function hi(e, t, r) {
  if (t = t.updateQueue, t !== null && (t = t.shared, (r & 4194240) !== 0)) {
    var n = t.lanes;
    n &= e.pendingLanes, r |= n, t.lanes = r, ia(e, r);
  }
}
function Fu(e, t) {
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
function $i(e, t, r, n) {
  var o = e.updateQueue;
  Qt = !1;
  var i = o.firstBaseUpdate, l = o.lastBaseUpdate, s = o.shared.pending;
  if (s !== null) {
    o.shared.pending = null;
    var a = s, u = a.next;
    a.next = null, l === null ? i = u : l.next = u, l = a;
    var h = e.alternate;
    h !== null && (h = h.updateQueue, s = h.lastBaseUpdate, s !== l && (s === null ? h.firstBaseUpdate = u : s.next = u, h.lastBaseUpdate = a));
  }
  if (i !== null) {
    var v = o.baseState;
    l = 0, h = u = a = null, s = i;
    do {
      var g = s.lane, y = s.eventTime;
      if ((n & g) === g) {
        h !== null && (h = h.next = {
          eventTime: y,
          lane: 0,
          tag: s.tag,
          payload: s.payload,
          callback: s.callback,
          next: null
        });
        e: {
          var x = e, w = s;
          switch (g = t, y = r, w.tag) {
            case 1:
              if (x = w.payload, typeof x == "function") {
                v = x.call(y, v, g);
                break e;
              }
              v = x;
              break e;
            case 3:
              x.flags = x.flags & -65537 | 128;
            case 0:
              if (x = w.payload, g = typeof x == "function" ? x.call(y, v, g) : x, g == null) break e;
              v = oe({}, v, g);
              break e;
            case 2:
              Qt = !0;
          }
        }
        s.callback !== null && s.lane !== 0 && (e.flags |= 64, g = o.effects, g === null ? o.effects = [s] : g.push(s));
      } else y = { eventTime: y, lane: g, tag: s.tag, payload: s.payload, callback: s.callback, next: null }, h === null ? (u = h = y, a = v) : h = h.next = y, l |= g;
      if (s = s.next, s === null) {
        if (s = o.shared.pending, s === null) break;
        g = s, s = g.next, g.next = null, o.lastBaseUpdate = g, o.shared.pending = null;
      }
    } while (!0);
    if (h === null && (a = v), o.baseState = a, o.firstBaseUpdate = u, o.lastBaseUpdate = h, t = o.shared.interleaved, t !== null) {
      o = t;
      do
        l |= o.lane, o = o.next;
      while (o !== t);
    } else i === null && (o.shared.lanes = 0);
    $r |= l, e.lanes = l, e.memoizedState = v;
  }
}
function Ou(e, t, r) {
  if (e = t.effects, t.effects = null, e !== null) for (t = 0; t < e.length; t++) {
    var n = e[t], o = n.callback;
    if (o !== null) {
      if (n.callback = null, n = r, typeof o != "function") throw Error(b(191, o));
      o.call(n);
    }
  }
}
var $o = {}, xt = pr($o), wo = pr($o), ko = pr($o);
function br(e) {
  if (e === $o) throw Error(b(174));
  return e;
}
function ka(e, t) {
  switch (q(ko, t), q(wo, e), q(xt, $o), e = t.nodeType, e) {
    case 9:
    case 11:
      t = (t = t.documentElement) ? t.namespaceURI : Gl(null, "");
      break;
    default:
      e = e === 8 ? t.parentNode : t, t = e.namespaceURI || null, e = e.tagName, t = Gl(t, e);
  }
  J(xt), q(xt, t);
}
function Pn() {
  J(xt), J(wo), J(ko);
}
function Xd(e) {
  br(ko.current);
  var t = br(xt.current), r = Gl(t, e.type);
  t !== r && (q(wo, e), q(xt, r));
}
function ba(e) {
  wo.current === e && (J(xt), J(wo));
}
var re = pr(0);
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
var Pl = [];
function Sa() {
  for (var e = 0; e < Pl.length; e++) Pl[e]._workInProgressVersionPrimary = null;
  Pl.length = 0;
}
var mi = Ot.ReactCurrentDispatcher, zl = Ot.ReactCurrentBatchConfig, Ir = 0, ne = null, ce = null, pe = null, Ai = !1, oo = !1, bo = 0, am = 0;
function we() {
  throw Error(b(321));
}
function Ca(e, t) {
  if (t === null) return !1;
  for (var r = 0; r < t.length && r < e.length; r++) if (!ct(e[r], t[r])) return !1;
  return !0;
}
function Ea(e, t, r, n, o, i) {
  if (Ir = i, ne = t, t.memoizedState = null, t.updateQueue = null, t.lanes = 0, mi.current = e === null || e.memoizedState === null ? fm : pm, e = r(n, o), oo) {
    i = 0;
    do {
      if (oo = !1, bo = 0, 25 <= i) throw Error(b(301));
      i += 1, pe = ce = null, t.updateQueue = null, mi.current = hm, e = r(n, o);
    } while (oo);
  }
  if (mi.current = Ui, t = ce !== null && ce.next !== null, Ir = 0, pe = ce = ne = null, Ai = !1, t) throw Error(b(300));
  return e;
}
function ja() {
  var e = bo !== 0;
  return bo = 0, e;
}
function pt() {
  var e = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
  return pe === null ? ne.memoizedState = pe = e : pe = pe.next = e, pe;
}
function rt() {
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
function Ml(e) {
  var t = rt(), r = t.queue;
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
      var h = u.lane;
      if ((Ir & h) === h) a !== null && (a = a.next = { lane: 0, action: u.action, hasEagerState: u.hasEagerState, eagerState: u.eagerState, next: null }), n = u.hasEagerState ? u.eagerState : e(n, u.action);
      else {
        var v = {
          lane: h,
          action: u.action,
          hasEagerState: u.hasEagerState,
          eagerState: u.eagerState,
          next: null
        };
        a === null ? (s = a = v, l = n) : a = a.next = v, ne.lanes |= h, $r |= h;
      }
      u = u.next;
    } while (u !== null && u !== i);
    a === null ? l = n : a.next = s, ct(n, t.memoizedState) || (Le = !0), t.memoizedState = n, t.baseState = l, t.baseQueue = a, r.lastRenderedState = n;
  }
  if (e = r.interleaved, e !== null) {
    o = e;
    do
      i = o.lane, ne.lanes |= i, $r |= i, o = o.next;
    while (o !== e);
  } else o === null && (r.lanes = 0);
  return [t.memoizedState, r.dispatch];
}
function Rl(e) {
  var t = rt(), r = t.queue;
  if (r === null) throw Error(b(311));
  r.lastRenderedReducer = e;
  var n = r.dispatch, o = r.pending, i = t.memoizedState;
  if (o !== null) {
    r.pending = null;
    var l = o = o.next;
    do
      i = e(i, l.action), l = l.next;
    while (l !== o);
    ct(i, t.memoizedState) || (Le = !0), t.memoizedState = i, t.baseQueue === null && (t.baseState = i), r.lastRenderedState = i;
  }
  return [i, n];
}
function Zd() {
}
function Jd(e, t) {
  var r = ne, n = rt(), o = t(), i = !ct(n.memoizedState, o);
  if (i && (n.memoizedState = o, Le = !0), n = n.queue, Na(rf.bind(null, r, n, e), [e]), n.getSnapshot !== t || i || pe !== null && pe.memoizedState.tag & 1) {
    if (r.flags |= 2048, Co(9, tf.bind(null, r, n, o, t), void 0, null), he === null) throw Error(b(349));
    Ir & 30 || ef(r, t, o);
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
    return !ct(e, r);
  } catch {
    return !0;
  }
}
function of(e) {
  var t = Tt(e, 1);
  t !== null && ut(t, e, 1, -1);
}
function Lu(e) {
  var t = pt();
  return typeof e == "function" && (e = e()), t.memoizedState = t.baseState = e, e = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: So, lastRenderedState: e }, t.queue = e, e = e.dispatch = dm.bind(null, ne, e), [t.memoizedState, e];
}
function Co(e, t, r, n) {
  return e = { tag: e, create: t, destroy: r, deps: n, next: null }, t = ne.updateQueue, t === null ? (t = { lastEffect: null, stores: null }, ne.updateQueue = t, t.lastEffect = e.next = e) : (r = t.lastEffect, r === null ? t.lastEffect = e.next = e : (n = r.next, r.next = e, e.next = n, t.lastEffect = e)), e;
}
function lf() {
  return rt().memoizedState;
}
function gi(e, t, r, n) {
  var o = pt();
  ne.flags |= e, o.memoizedState = Co(1 | t, r, void 0, n === void 0 ? null : n);
}
function el(e, t, r, n) {
  var o = rt();
  n = n === void 0 ? null : n;
  var i = void 0;
  if (ce !== null) {
    var l = ce.memoizedState;
    if (i = l.destroy, n !== null && Ca(n, l.deps)) {
      o.memoizedState = Co(t, r, i, n);
      return;
    }
  }
  ne.flags |= e, o.memoizedState = Co(1 | t, r, i, n);
}
function Iu(e, t) {
  return gi(8390656, 8, e, t);
}
function Na(e, t) {
  return el(2048, 8, e, t);
}
function sf(e, t) {
  return el(4, 2, e, t);
}
function af(e, t) {
  return el(4, 4, e, t);
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
  return r = r != null ? r.concat([e]) : null, el(4, 4, uf.bind(null, t, e), r);
}
function _a() {
}
function df(e, t) {
  var r = rt();
  t = t === void 0 ? null : t;
  var n = r.memoizedState;
  return n !== null && t !== null && Ca(t, n[1]) ? n[0] : (r.memoizedState = [e, t], e);
}
function ff(e, t) {
  var r = rt();
  t = t === void 0 ? null : t;
  var n = r.memoizedState;
  return n !== null && t !== null && Ca(t, n[1]) ? n[0] : (e = e(), r.memoizedState = [e, t], e);
}
function pf(e, t, r) {
  return Ir & 21 ? (ct(r, t) || (r = vd(), ne.lanes |= r, $r |= r, e.baseState = !0), t) : (e.baseState && (e.baseState = !1, Le = !0), e.memoizedState = r);
}
function um(e, t) {
  var r = K;
  K = r !== 0 && 4 > r ? r : 4, e(!0);
  var n = zl.transition;
  zl.transition = {};
  try {
    e(!1), t();
  } finally {
    K = r, zl.transition = n;
  }
}
function hf() {
  return rt().memoizedState;
}
function cm(e, t, r) {
  var n = sr(e);
  if (r = { lane: n, action: r, hasEagerState: !1, eagerState: null, next: null }, mf(e)) gf(t, r);
  else if (r = qd(e, t, r, n), r !== null) {
    var o = _e();
    ut(r, e, n, o), vf(r, t, n);
  }
}
function dm(e, t, r) {
  var n = sr(e), o = { lane: n, action: r, hasEagerState: !1, eagerState: null, next: null };
  if (mf(e)) gf(t, o);
  else {
    var i = e.alternate;
    if (e.lanes === 0 && (i === null || i.lanes === 0) && (i = t.lastRenderedReducer, i !== null)) try {
      var l = t.lastRenderedState, s = i(l, r);
      if (o.hasEagerState = !0, o.eagerState = s, ct(s, l)) {
        var a = t.interleaved;
        a === null ? (o.next = o, xa(t)) : (o.next = a.next, a.next = o), t.interleaved = o;
        return;
      }
    } catch {
    } finally {
    }
    r = qd(e, t, o, n), r !== null && (o = _e(), ut(r, e, n, o), vf(r, t, n));
  }
}
function mf(e) {
  var t = e.alternate;
  return e === ne || t !== null && t === ne;
}
function gf(e, t) {
  oo = Ai = !0;
  var r = e.pending;
  r === null ? t.next = t : (t.next = r.next, r.next = t), e.pending = t;
}
function vf(e, t, r) {
  if (r & 4194240) {
    var n = t.lanes;
    n &= e.pendingLanes, r |= n, t.lanes = r, ia(e, r);
  }
}
var Ui = { readContext: tt, useCallback: we, useContext: we, useEffect: we, useImperativeHandle: we, useInsertionEffect: we, useLayoutEffect: we, useMemo: we, useReducer: we, useRef: we, useState: we, useDebugValue: we, useDeferredValue: we, useTransition: we, useMutableSource: we, useSyncExternalStore: we, useId: we, unstable_isNewReconciler: !1 }, fm = { readContext: tt, useCallback: function(e, t) {
  return pt().memoizedState = [e, t === void 0 ? null : t], e;
}, useContext: tt, useEffect: Iu, useImperativeHandle: function(e, t, r) {
  return r = r != null ? r.concat([e]) : null, gi(
    4194308,
    4,
    uf.bind(null, t, e),
    r
  );
}, useLayoutEffect: function(e, t) {
  return gi(4194308, 4, e, t);
}, useInsertionEffect: function(e, t) {
  return gi(4, 2, e, t);
}, useMemo: function(e, t) {
  var r = pt();
  return t = t === void 0 ? null : t, e = e(), r.memoizedState = [e, t], e;
}, useReducer: function(e, t, r) {
  var n = pt();
  return t = r !== void 0 ? r(t) : t, n.memoizedState = n.baseState = t, e = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: e, lastRenderedState: t }, n.queue = e, e = e.dispatch = cm.bind(null, ne, e), [n.memoizedState, e];
}, useRef: function(e) {
  var t = pt();
  return e = { current: e }, t.memoizedState = e;
}, useState: Lu, useDebugValue: _a, useDeferredValue: function(e) {
  return pt().memoizedState = e;
}, useTransition: function() {
  var e = Lu(!1), t = e[0];
  return e = um.bind(null, e[1]), pt().memoizedState = e, [t, e];
}, useMutableSource: function() {
}, useSyncExternalStore: function(e, t, r) {
  var n = ne, o = pt();
  if (te) {
    if (r === void 0) throw Error(b(407));
    r = r();
  } else {
    if (r = t(), he === null) throw Error(b(349));
    Ir & 30 || ef(n, t, r);
  }
  o.memoizedState = r;
  var i = { value: r, getSnapshot: t };
  return o.queue = i, Iu(rf.bind(
    null,
    n,
    i,
    e
  ), [e]), n.flags |= 2048, Co(9, tf.bind(null, n, i, r, t), void 0, null), r;
}, useId: function() {
  var e = pt(), t = he.identifierPrefix;
  if (te) {
    var r = Pt, n = _t;
    r = (n & ~(1 << 32 - at(n) - 1)).toString(32) + r, t = ":" + t + "R" + r, r = bo++, 0 < r && (t += "H" + r.toString(32)), t += ":";
  } else r = am++, t = ":" + t + "r" + r.toString(32) + ":";
  return e.memoizedState = t;
}, unstable_isNewReconciler: !1 }, pm = {
  readContext: tt,
  useCallback: df,
  useContext: tt,
  useEffect: Na,
  useImperativeHandle: cf,
  useInsertionEffect: sf,
  useLayoutEffect: af,
  useMemo: ff,
  useReducer: Ml,
  useRef: lf,
  useState: function() {
    return Ml(So);
  },
  useDebugValue: _a,
  useDeferredValue: function(e) {
    var t = rt();
    return pf(t, ce.memoizedState, e);
  },
  useTransition: function() {
    var e = Ml(So)[0], t = rt().memoizedState;
    return [e, t];
  },
  useMutableSource: Zd,
  useSyncExternalStore: Jd,
  useId: hf,
  unstable_isNewReconciler: !1
}, hm = { readContext: tt, useCallback: df, useContext: tt, useEffect: Na, useImperativeHandle: cf, useInsertionEffect: sf, useLayoutEffect: af, useMemo: ff, useReducer: Rl, useRef: lf, useState: function() {
  return Rl(So);
}, useDebugValue: _a, useDeferredValue: function(e) {
  var t = rt();
  return ce === null ? t.memoizedState = e : pf(t, ce.memoizedState, e);
}, useTransition: function() {
  var e = Rl(So)[0], t = rt().memoizedState;
  return [e, t];
}, useMutableSource: Zd, useSyncExternalStore: Jd, useId: hf, unstable_isNewReconciler: !1 };
function ot(e, t) {
  if (e && e.defaultProps) {
    t = oe({}, t), e = e.defaultProps;
    for (var r in e) t[r] === void 0 && (t[r] = e[r]);
    return t;
  }
  return t;
}
function ms(e, t, r, n) {
  t = e.memoizedState, r = r(n, t), r = r == null ? t : oe({}, t, r), e.memoizedState = r, e.lanes === 0 && (e.updateQueue.baseState = r);
}
var tl = { isMounted: function(e) {
  return (e = e._reactInternals) ? Ur(e) === e : !1;
}, enqueueSetState: function(e, t, r) {
  e = e._reactInternals;
  var n = _e(), o = sr(e), i = zt(n, o);
  i.payload = t, r != null && (i.callback = r), t = ir(e, i, o), t !== null && (ut(t, e, o, n), hi(t, e, o));
}, enqueueReplaceState: function(e, t, r) {
  e = e._reactInternals;
  var n = _e(), o = sr(e), i = zt(n, o);
  i.tag = 1, i.payload = t, r != null && (i.callback = r), t = ir(e, i, o), t !== null && (ut(t, e, o, n), hi(t, e, o));
}, enqueueForceUpdate: function(e, t) {
  e = e._reactInternals;
  var r = _e(), n = sr(e), o = zt(r, n);
  o.tag = 2, t != null && (o.callback = t), t = ir(e, o, n), t !== null && (ut(t, e, n, r), hi(t, e, n));
} };
function $u(e, t, r, n, o, i, l) {
  return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(n, i, l) : t.prototype && t.prototype.isPureReactComponent ? !go(r, n) || !go(o, i) : !0;
}
function yf(e, t, r) {
  var n = !1, o = dr, i = t.contextType;
  return typeof i == "object" && i !== null ? i = tt(i) : (o = $e(t) ? Or : Ce.current, n = t.contextTypes, i = (n = n != null) ? jn(e, o) : dr), t = new t(r, i), e.memoizedState = t.state !== null && t.state !== void 0 ? t.state : null, t.updater = tl, e.stateNode = t, t._reactInternals = e, n && (e = e.stateNode, e.__reactInternalMemoizedUnmaskedChildContext = o, e.__reactInternalMemoizedMaskedChildContext = i), t;
}
function Du(e, t, r, n) {
  e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(r, n), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(r, n), t.state !== e && tl.enqueueReplaceState(t, t.state, null);
}
function gs(e, t, r, n) {
  var o = e.stateNode;
  o.props = r, o.state = e.memoizedState, o.refs = {}, wa(e);
  var i = t.contextType;
  typeof i == "object" && i !== null ? o.context = tt(i) : (i = $e(t) ? Or : Ce.current, o.context = jn(e, i)), o.state = e.memoizedState, i = t.getDerivedStateFromProps, typeof i == "function" && (ms(e, t, i, r), o.state = e.memoizedState), typeof t.getDerivedStateFromProps == "function" || typeof o.getSnapshotBeforeUpdate == "function" || typeof o.UNSAFE_componentWillMount != "function" && typeof o.componentWillMount != "function" || (t = o.state, typeof o.componentWillMount == "function" && o.componentWillMount(), typeof o.UNSAFE_componentWillMount == "function" && o.UNSAFE_componentWillMount(), t !== o.state && tl.enqueueReplaceState(o, o.state, null), $i(e, r, o, n), o.state = e.memoizedState), typeof o.componentDidMount == "function" && (e.flags |= 4194308);
}
function zn(e, t) {
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
function Tl(e, t, r) {
  return { value: e, source: null, stack: r ?? null, digest: t ?? null };
}
function vs(e, t) {
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
  r = zt(-1, r), r.tag = 3, r.payload = { element: null };
  var n = t.value;
  return r.callback = function() {
    Bi || (Bi = !0, Ns = n), vs(e, t);
  }, r;
}
function wf(e, t, r) {
  r = zt(-1, r), r.tag = 3;
  var n = e.type.getDerivedStateFromError;
  if (typeof n == "function") {
    var o = t.value;
    r.payload = function() {
      return n(o);
    }, r.callback = function() {
      vs(e, t);
    };
  }
  var i = e.stateNode;
  return i !== null && typeof i.componentDidCatch == "function" && (r.callback = function() {
    vs(e, t), typeof n != "function" && (lr === null ? lr = /* @__PURE__ */ new Set([this]) : lr.add(this));
    var l = t.stack;
    this.componentDidCatch(t.value, { componentStack: l !== null ? l : "" });
  }), r;
}
function Au(e, t, r) {
  var n = e.pingCache;
  if (n === null) {
    n = e.pingCache = new mm();
    var o = /* @__PURE__ */ new Set();
    n.set(t, o);
  } else o = n.get(t), o === void 0 && (o = /* @__PURE__ */ new Set(), n.set(t, o));
  o.has(r) || (o.add(r), e = Pm.bind(null, e, t, r), t.then(e, e));
}
function Uu(e) {
  do {
    var t;
    if ((t = e.tag === 13) && (t = e.memoizedState, t = t !== null ? t.dehydrated !== null : !0), t) return e;
    e = e.return;
  } while (e !== null);
  return null;
}
function Qu(e, t, r, n, o) {
  return e.mode & 1 ? (e.flags |= 65536, e.lanes = o, e) : (e === t ? e.flags |= 65536 : (e.flags |= 128, r.flags |= 131072, r.flags &= -52805, r.tag === 1 && (r.alternate === null ? r.tag = 17 : (t = zt(-1, 1), t.tag = 2, ir(r, t, 1))), r.lanes |= 1), e);
}
var gm = Ot.ReactCurrentOwner, Le = !1;
function Ne(e, t, r, n) {
  t.child = e === null ? Gd(t, null, r, n) : _n(t, e.child, r, n);
}
function Bu(e, t, r, n, o) {
  r = r.render;
  var i = t.ref;
  return un(t, o), n = Ea(e, t, r, n, i, o), r = ja(), e !== null && !Le ? (t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~o, Ft(e, t, o)) : (te && r && pa(t), t.flags |= 1, Ne(e, t, n, o), t.child);
}
function Hu(e, t, r, n, o) {
  if (e === null) {
    var i = r.type;
    return typeof i == "function" && !La(i) && i.defaultProps === void 0 && r.compare === null && r.defaultProps === void 0 ? (t.tag = 15, t.type = i, kf(e, t, i, n, o)) : (e = wi(r.type, null, n, t, t.mode, o), e.ref = t.ref, e.return = t, t.child = e);
  }
  if (i = e.child, !(e.lanes & o)) {
    var l = i.memoizedProps;
    if (r = r.compare, r = r !== null ? r : go, r(l, n) && e.ref === t.ref) return Ft(e, t, o);
  }
  return t.flags |= 1, e = ar(i, n), e.ref = t.ref, e.return = t, t.child = e;
}
function kf(e, t, r, n, o) {
  if (e !== null) {
    var i = e.memoizedProps;
    if (go(i, n) && e.ref === t.ref) if (Le = !1, t.pendingProps = n = i, (e.lanes & o) !== 0) e.flags & 131072 && (Le = !0);
    else return t.lanes = e.lanes, Ft(e, t, o);
  }
  return ys(e, t, r, n, o);
}
function bf(e, t, r) {
  var n = t.pendingProps, o = n.children, i = e !== null ? e.memoizedState : null;
  if (n.mode === "hidden") if (!(t.mode & 1)) t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }, q(nn, Ue), Ue |= r;
  else {
    if (!(r & 1073741824)) return e = i !== null ? i.baseLanes | r : r, t.lanes = t.childLanes = 1073741824, t.memoizedState = { baseLanes: e, cachePool: null, transitions: null }, t.updateQueue = null, q(nn, Ue), Ue |= e, null;
    t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }, n = i !== null ? i.baseLanes : r, q(nn, Ue), Ue |= n;
  }
  else i !== null ? (n = i.baseLanes | r, t.memoizedState = null) : n = r, q(nn, Ue), Ue |= n;
  return Ne(e, t, o, r), t.child;
}
function Sf(e, t) {
  var r = t.ref;
  (e === null && r !== null || e !== null && e.ref !== r) && (t.flags |= 512, t.flags |= 2097152);
}
function ys(e, t, r, n, o) {
  var i = $e(r) ? Or : Ce.current;
  return i = jn(t, i), un(t, o), r = Ea(e, t, r, n, i, o), n = ja(), e !== null && !Le ? (t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~o, Ft(e, t, o)) : (te && n && pa(t), t.flags |= 1, Ne(e, t, r, o), t.child);
}
function Wu(e, t, r, n, o) {
  if ($e(r)) {
    var i = !0;
    Ti(t);
  } else i = !1;
  if (un(t, o), t.stateNode === null) vi(e, t), yf(t, r, n), gs(t, r, n, o), n = !0;
  else if (e === null) {
    var l = t.stateNode, s = t.memoizedProps;
    l.props = s;
    var a = l.context, u = r.contextType;
    typeof u == "object" && u !== null ? u = tt(u) : (u = $e(r) ? Or : Ce.current, u = jn(t, u));
    var h = r.getDerivedStateFromProps, v = typeof h == "function" || typeof l.getSnapshotBeforeUpdate == "function";
    v || typeof l.UNSAFE_componentWillReceiveProps != "function" && typeof l.componentWillReceiveProps != "function" || (s !== n || a !== u) && Du(t, l, n, u), Qt = !1;
    var g = t.memoizedState;
    l.state = g, $i(t, n, l, o), a = t.memoizedState, s !== n || g !== a || Ie.current || Qt ? (typeof h == "function" && (ms(t, r, h, n), a = t.memoizedState), (s = Qt || $u(t, r, s, n, g, a, u)) ? (v || typeof l.UNSAFE_componentWillMount != "function" && typeof l.componentWillMount != "function" || (typeof l.componentWillMount == "function" && l.componentWillMount(), typeof l.UNSAFE_componentWillMount == "function" && l.UNSAFE_componentWillMount()), typeof l.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof l.componentDidMount == "function" && (t.flags |= 4194308), t.memoizedProps = n, t.memoizedState = a), l.props = n, l.state = a, l.context = u, n = s) : (typeof l.componentDidMount == "function" && (t.flags |= 4194308), n = !1);
  } else {
    l = t.stateNode, Yd(e, t), s = t.memoizedProps, u = t.type === t.elementType ? s : ot(t.type, s), l.props = u, v = t.pendingProps, g = l.context, a = r.contextType, typeof a == "object" && a !== null ? a = tt(a) : (a = $e(r) ? Or : Ce.current, a = jn(t, a));
    var y = r.getDerivedStateFromProps;
    (h = typeof y == "function" || typeof l.getSnapshotBeforeUpdate == "function") || typeof l.UNSAFE_componentWillReceiveProps != "function" && typeof l.componentWillReceiveProps != "function" || (s !== v || g !== a) && Du(t, l, n, a), Qt = !1, g = t.memoizedState, l.state = g, $i(t, n, l, o);
    var x = t.memoizedState;
    s !== v || g !== x || Ie.current || Qt ? (typeof y == "function" && (ms(t, r, y, n), x = t.memoizedState), (u = Qt || $u(t, r, u, n, g, x, a) || !1) ? (h || typeof l.UNSAFE_componentWillUpdate != "function" && typeof l.componentWillUpdate != "function" || (typeof l.componentWillUpdate == "function" && l.componentWillUpdate(n, x, a), typeof l.UNSAFE_componentWillUpdate == "function" && l.UNSAFE_componentWillUpdate(n, x, a)), typeof l.componentDidUpdate == "function" && (t.flags |= 4), typeof l.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof l.componentDidUpdate != "function" || s === e.memoizedProps && g === e.memoizedState || (t.flags |= 4), typeof l.getSnapshotBeforeUpdate != "function" || s === e.memoizedProps && g === e.memoizedState || (t.flags |= 1024), t.memoizedProps = n, t.memoizedState = x), l.props = n, l.state = x, l.context = a, n = u) : (typeof l.componentDidUpdate != "function" || s === e.memoizedProps && g === e.memoizedState || (t.flags |= 4), typeof l.getSnapshotBeforeUpdate != "function" || s === e.memoizedProps && g === e.memoizedState || (t.flags |= 1024), n = !1);
  }
  return xs(e, t, r, n, i, o);
}
function xs(e, t, r, n, o, i) {
  Sf(e, t);
  var l = (t.flags & 128) !== 0;
  if (!n && !l) return o && zu(t, r, !1), Ft(e, t, i);
  n = t.stateNode, gm.current = t;
  var s = l && typeof r.getDerivedStateFromError != "function" ? null : n.render();
  return t.flags |= 1, e !== null && l ? (t.child = _n(t, e.child, null, i), t.child = _n(t, null, s, i)) : Ne(e, t, s, i), t.memoizedState = n.state, o && zu(t, r, !0), t.child;
}
function Cf(e) {
  var t = e.stateNode;
  t.pendingContext ? Pu(e, t.pendingContext, t.pendingContext !== t.context) : t.context && Pu(e, t.context, !1), ka(e, t.containerInfo);
}
function Vu(e, t, r, n, o) {
  return Nn(), ma(o), t.flags |= 256, Ne(e, t, r, n), t.child;
}
var ws = { dehydrated: null, treeContext: null, retryLane: 0 };
function ks(e) {
  return { baseLanes: e, cachePool: null, transitions: null };
}
function Ef(e, t, r) {
  var n = t.pendingProps, o = re.current, i = !1, l = (t.flags & 128) !== 0, s;
  if ((s = l) || (s = e !== null && e.memoizedState === null ? !1 : (o & 2) !== 0), s ? (i = !0, t.flags &= -129) : (e === null || e.memoizedState !== null) && (o |= 1), q(re, o & 1), e === null)
    return ps(t), e = t.memoizedState, e !== null && (e = e.dehydrated, e !== null) ? (t.mode & 1 ? e.data === "$!" ? t.lanes = 8 : t.lanes = 1073741824 : t.lanes = 1, null) : (l = n.children, e = n.fallback, i ? (n = t.mode, i = t.child, l = { mode: "hidden", children: l }, !(n & 1) && i !== null ? (i.childLanes = 0, i.pendingProps = l) : i = ol(l, n, 0, null), e = Fr(e, n, r, null), i.return = t, e.return = t, i.sibling = e, t.child = i, t.child.memoizedState = ks(r), t.memoizedState = ws, e) : Pa(t, l));
  if (o = e.memoizedState, o !== null && (s = o.dehydrated, s !== null)) return vm(e, t, l, n, s, o, r);
  if (i) {
    i = n.fallback, l = t.mode, o = e.child, s = o.sibling;
    var a = { mode: "hidden", children: n.children };
    return !(l & 1) && t.child !== o ? (n = t.child, n.childLanes = 0, n.pendingProps = a, t.deletions = null) : (n = ar(o, a), n.subtreeFlags = o.subtreeFlags & 14680064), s !== null ? i = ar(s, i) : (i = Fr(i, l, r, null), i.flags |= 2), i.return = t, n.return = t, n.sibling = i, t.child = n, n = i, i = t.child, l = e.child.memoizedState, l = l === null ? ks(r) : { baseLanes: l.baseLanes | r, cachePool: null, transitions: l.transitions }, i.memoizedState = l, i.childLanes = e.childLanes & ~r, t.memoizedState = ws, n;
  }
  return i = e.child, e = i.sibling, n = ar(i, { mode: "visible", children: n.children }), !(t.mode & 1) && (n.lanes = r), n.return = t, n.sibling = null, e !== null && (r = t.deletions, r === null ? (t.deletions = [e], t.flags |= 16) : r.push(e)), t.child = n, t.memoizedState = null, n;
}
function Pa(e, t) {
  return t = ol({ mode: "visible", children: t }, e.mode, 0, null), t.return = e, e.child = t;
}
function ri(e, t, r, n) {
  return n !== null && ma(n), _n(t, e.child, null, r), e = Pa(t, t.pendingProps.children), e.flags |= 2, t.memoizedState = null, e;
}
function vm(e, t, r, n, o, i, l) {
  if (r)
    return t.flags & 256 ? (t.flags &= -257, n = Tl(Error(b(422))), ri(e, t, l, n)) : t.memoizedState !== null ? (t.child = e.child, t.flags |= 128, null) : (i = n.fallback, o = t.mode, n = ol({ mode: "visible", children: n.children }, o, 0, null), i = Fr(i, o, l, null), i.flags |= 2, n.return = t, i.return = t, n.sibling = i, t.child = n, t.mode & 1 && _n(t, e.child, null, l), t.child.memoizedState = ks(l), t.memoizedState = ws, i);
  if (!(t.mode & 1)) return ri(e, t, l, null);
  if (o.data === "$!") {
    if (n = o.nextSibling && o.nextSibling.dataset, n) var s = n.dgst;
    return n = s, i = Error(b(419)), n = Tl(i, n, void 0), ri(e, t, l, n);
  }
  if (s = (l & e.childLanes) !== 0, Le || s) {
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
      o = o & (n.suspendedLanes | l) ? 0 : o, o !== 0 && o !== i.retryLane && (i.retryLane = o, Tt(e, o), ut(n, e, o, -1));
    }
    return Oa(), n = Tl(Error(b(421))), ri(e, t, l, n);
  }
  return o.data === "$?" ? (t.flags |= 128, t.child = e.child, t = zm.bind(null, e), o._reactRetry = t, null) : (e = i.treeContext, He = or(o.nextSibling), We = t, te = !0, st = null, e !== null && (Xe[Ze++] = _t, Xe[Ze++] = Pt, Xe[Ze++] = Lr, _t = e.id, Pt = e.overflow, Lr = t), t = Pa(t, n.children), t.flags |= 4096, t);
}
function Ku(e, t, r) {
  e.lanes |= t;
  var n = e.alternate;
  n !== null && (n.lanes |= t), hs(e.return, t, r);
}
function Fl(e, t, r, n, o) {
  var i = e.memoizedState;
  i === null ? e.memoizedState = { isBackwards: t, rendering: null, renderingStartTime: 0, last: n, tail: r, tailMode: o } : (i.isBackwards = t, i.rendering = null, i.renderingStartTime = 0, i.last = n, i.tail = r, i.tailMode = o);
}
function jf(e, t, r) {
  var n = t.pendingProps, o = n.revealOrder, i = n.tail;
  if (Ne(e, t, n.children, r), n = re.current, n & 2) n = n & 1 | 2, t.flags |= 128;
  else {
    if (e !== null && e.flags & 128) e: for (e = t.child; e !== null; ) {
      if (e.tag === 13) e.memoizedState !== null && Ku(e, r, t);
      else if (e.tag === 19) Ku(e, r, t);
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
      r = o, r === null ? (o = t.child, t.child = null) : (o = r.sibling, r.sibling = null), Fl(t, !1, o, r, i);
      break;
    case "backwards":
      for (r = null, o = t.child, t.child = null; o !== null; ) {
        if (e = o.alternate, e !== null && Di(e) === null) {
          t.child = o;
          break;
        }
        e = o.sibling, o.sibling = r, r = o, o = e;
      }
      Fl(t, !0, r, null, i);
      break;
    case "together":
      Fl(t, !1, null, null, void 0);
      break;
    default:
      t.memoizedState = null;
  }
  return t.child;
}
function vi(e, t) {
  !(t.mode & 1) && e !== null && (e.alternate = null, t.alternate = null, t.flags |= 2);
}
function Ft(e, t, r) {
  if (e !== null && (t.dependencies = e.dependencies), $r |= t.lanes, !(r & t.childLanes)) return null;
  if (e !== null && t.child !== e.child) throw Error(b(153));
  if (t.child !== null) {
    for (e = t.child, r = ar(e, e.pendingProps), t.child = r, r.return = t; e.sibling !== null; ) e = e.sibling, r = r.sibling = ar(e, e.pendingProps), r.return = t;
    r.sibling = null;
  }
  return t.child;
}
function ym(e, t, r) {
  switch (t.tag) {
    case 3:
      Cf(t), Nn();
      break;
    case 5:
      Xd(t);
      break;
    case 1:
      $e(t.type) && Ti(t);
      break;
    case 4:
      ka(t, t.stateNode.containerInfo);
      break;
    case 10:
      var n = t.type._context, o = t.memoizedProps.value;
      q(Li, n._currentValue), n._currentValue = o;
      break;
    case 13:
      if (n = t.memoizedState, n !== null)
        return n.dehydrated !== null ? (q(re, re.current & 1), t.flags |= 128, null) : r & t.child.childLanes ? Ef(e, t, r) : (q(re, re.current & 1), e = Ft(e, t, r), e !== null ? e.sibling : null);
      q(re, re.current & 1);
      break;
    case 19:
      if (n = (r & t.childLanes) !== 0, e.flags & 128) {
        if (n) return jf(e, t, r);
        t.flags |= 128;
      }
      if (o = t.memoizedState, o !== null && (o.rendering = null, o.tail = null, o.lastEffect = null), q(re, re.current), n) break;
      return null;
    case 22:
    case 23:
      return t.lanes = 0, bf(e, t, r);
  }
  return Ft(e, t, r);
}
var Nf, bs, _f, Pf;
Nf = function(e, t) {
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
bs = function() {
};
_f = function(e, t, r, n) {
  var o = e.memoizedProps;
  if (o !== n) {
    e = t.stateNode, br(xt.current);
    var i = null;
    switch (r) {
      case "input":
        o = Hl(e, o), n = Hl(e, n), i = [];
        break;
      case "select":
        o = oe({}, o, { value: void 0 }), n = oe({}, n, { value: void 0 }), i = [];
        break;
      case "textarea":
        o = Kl(e, o), n = Kl(e, n), i = [];
        break;
      default:
        typeof o.onClick != "function" && typeof n.onClick == "function" && (e.onclick = Mi);
    }
    ql(r, n);
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
function Qn(e, t) {
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
  switch (ha(t), t.tag) {
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
      return $e(t.type) && Ri(), ke(t), null;
    case 3:
      return n = t.stateNode, Pn(), J(Ie), J(Ce), Sa(), n.pendingContext && (n.context = n.pendingContext, n.pendingContext = null), (e === null || e.child === null) && (ei(t) ? t.flags |= 4 : e === null || e.memoizedState.isDehydrated && !(t.flags & 256) || (t.flags |= 1024, st !== null && (zs(st), st = null))), bs(e, t), ke(t), null;
    case 5:
      ba(t);
      var o = br(ko.current);
      if (r = t.type, e !== null && t.stateNode != null) _f(e, t, r, n, o), e.ref !== t.ref && (t.flags |= 512, t.flags |= 2097152);
      else {
        if (!n) {
          if (t.stateNode === null) throw Error(b(166));
          return ke(t), null;
        }
        if (e = br(xt.current), ei(t)) {
          n = t.stateNode, r = t.type;
          var i = t.memoizedProps;
          switch (n[vt] = t, n[xo] = i, e = (t.mode & 1) !== 0, r) {
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
              ru(n, i), Z("invalid", n);
              break;
            case "select":
              n._wrapperState = { wasMultiple: !!i.multiple }, Z("invalid", n);
              break;
            case "textarea":
              ou(n, i), Z("invalid", n);
          }
          ql(r, i), o = null;
          for (var l in i) if (i.hasOwnProperty(l)) {
            var s = i[l];
            l === "children" ? typeof s == "string" ? n.textContent !== s && (i.suppressHydrationWarning !== !0 && Jo(n.textContent, s, e), o = ["children", s]) : typeof s == "number" && n.textContent !== "" + s && (i.suppressHydrationWarning !== !0 && Jo(
              n.textContent,
              s,
              e
            ), o = ["children", "" + s]) : ao.hasOwnProperty(l) && s != null && l === "onScroll" && Z("scroll", n);
          }
          switch (r) {
            case "input":
              Wo(n), nu(n, i, !0);
              break;
            case "textarea":
              Wo(n), iu(n);
              break;
            case "select":
            case "option":
              break;
            default:
              typeof i.onClick == "function" && (n.onclick = Mi);
          }
          n = o, t.updateQueue = n, n !== null && (t.flags |= 4);
        } else {
          l = o.nodeType === 9 ? o : o.ownerDocument, e === "http://www.w3.org/1999/xhtml" && (e = rd(r)), e === "http://www.w3.org/1999/xhtml" ? r === "script" ? (e = l.createElement("div"), e.innerHTML = "<script><\/script>", e = e.removeChild(e.firstChild)) : typeof n.is == "string" ? e = l.createElement(r, { is: n.is }) : (e = l.createElement(r), r === "select" && (l = e, n.multiple ? l.multiple = !0 : n.size && (l.size = n.size))) : e = l.createElementNS(e, r), e[vt] = t, e[xo] = n, Nf(e, t, !1, !1), t.stateNode = e;
          e: {
            switch (l = Yl(r, n), r) {
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
                ru(e, n), o = Hl(e, n), Z("invalid", e);
                break;
              case "option":
                o = n;
                break;
              case "select":
                e._wrapperState = { wasMultiple: !!n.multiple }, o = oe({}, n, { value: void 0 }), Z("invalid", e);
                break;
              case "textarea":
                ou(e, n), o = Kl(e, n), Z("invalid", e);
                break;
              default:
                o = n;
            }
            ql(r, o), s = o;
            for (i in s) if (s.hasOwnProperty(i)) {
              var a = s[i];
              i === "style" ? id(e, a) : i === "dangerouslySetInnerHTML" ? (a = a ? a.__html : void 0, a != null && nd(e, a)) : i === "children" ? typeof a == "string" ? (r !== "textarea" || a !== "") && uo(e, a) : typeof a == "number" && uo(e, "" + a) : i !== "suppressContentEditableWarning" && i !== "suppressHydrationWarning" && i !== "autoFocus" && (ao.hasOwnProperty(i) ? a != null && i === "onScroll" && Z("scroll", e) : a != null && Js(e, i, a, l));
            }
            switch (r) {
              case "input":
                Wo(e), nu(e, n, !1);
                break;
              case "textarea":
                Wo(e), iu(e);
                break;
              case "option":
                n.value != null && e.setAttribute("value", "" + cr(n.value));
                break;
              case "select":
                e.multiple = !!n.multiple, i = n.value, i != null ? on(e, !!n.multiple, i, !1) : n.defaultValue != null && on(
                  e,
                  !!n.multiple,
                  n.defaultValue,
                  !0
                );
                break;
              default:
                typeof o.onClick == "function" && (e.onclick = Mi);
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
        if (r = br(ko.current), br(xt.current), ei(t)) {
          if (n = t.stateNode, r = t.memoizedProps, n[vt] = t, (i = n.nodeValue !== r) && (e = We, e !== null)) switch (e.tag) {
            case 3:
              Jo(n.nodeValue, r, (e.mode & 1) !== 0);
              break;
            case 5:
              e.memoizedProps.suppressHydrationWarning !== !0 && Jo(n.nodeValue, r, (e.mode & 1) !== 0);
          }
          i && (t.flags |= 4);
        } else n = (r.nodeType === 9 ? r : r.ownerDocument).createTextNode(n), n[vt] = t, t.stateNode = n;
      }
      return ke(t), null;
    case 13:
      if (J(re), n = t.memoizedState, e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
        if (te && He !== null && t.mode & 1 && !(t.flags & 128)) Vd(), Nn(), t.flags |= 98560, i = !1;
        else if (i = ei(t), n !== null && n.dehydrated !== null) {
          if (e === null) {
            if (!i) throw Error(b(318));
            if (i = t.memoizedState, i = i !== null ? i.dehydrated : null, !i) throw Error(b(317));
            i[vt] = t;
          } else Nn(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
          ke(t), i = !1;
        } else st !== null && (zs(st), st = null), i = !0;
        if (!i) return t.flags & 65536 ? t : null;
      }
      return t.flags & 128 ? (t.lanes = r, t) : (n = n !== null, n !== (e !== null && e.memoizedState !== null) && n && (t.child.flags |= 8192, t.mode & 1 && (e === null || re.current & 1 ? de === 0 && (de = 3) : Oa())), t.updateQueue !== null && (t.flags |= 4), ke(t), null);
    case 4:
      return Pn(), bs(e, t), e === null && vo(t.stateNode.containerInfo), ke(t), null;
    case 10:
      return ya(t.type._context), ke(t), null;
    case 17:
      return $e(t.type) && Ri(), ke(t), null;
    case 19:
      if (J(re), i = t.memoizedState, i === null) return ke(t), null;
      if (n = (t.flags & 128) !== 0, l = i.rendering, l === null) if (n) Qn(i, !1);
      else {
        if (de !== 0 || e !== null && e.flags & 128) for (e = t.child; e !== null; ) {
          if (l = Di(e), l !== null) {
            for (t.flags |= 128, Qn(i, !1), n = l.updateQueue, n !== null && (t.updateQueue = n, t.flags |= 4), t.subtreeFlags = 0, n = r, r = t.child; r !== null; ) i = r, e = n, i.flags &= 14680066, l = i.alternate, l === null ? (i.childLanes = 0, i.lanes = e, i.child = null, i.subtreeFlags = 0, i.memoizedProps = null, i.memoizedState = null, i.updateQueue = null, i.dependencies = null, i.stateNode = null) : (i.childLanes = l.childLanes, i.lanes = l.lanes, i.child = l.child, i.subtreeFlags = 0, i.deletions = null, i.memoizedProps = l.memoizedProps, i.memoizedState = l.memoizedState, i.updateQueue = l.updateQueue, i.type = l.type, e = l.dependencies, i.dependencies = e === null ? null : { lanes: e.lanes, firstContext: e.firstContext }), r = r.sibling;
            return q(re, re.current & 1 | 2), t.child;
          }
          e = e.sibling;
        }
        i.tail !== null && ae() > Mn && (t.flags |= 128, n = !0, Qn(i, !1), t.lanes = 4194304);
      }
      else {
        if (!n) if (e = Di(l), e !== null) {
          if (t.flags |= 128, n = !0, r = e.updateQueue, r !== null && (t.updateQueue = r, t.flags |= 4), Qn(i, !0), i.tail === null && i.tailMode === "hidden" && !l.alternate && !te) return ke(t), null;
        } else 2 * ae() - i.renderingStartTime > Mn && r !== 1073741824 && (t.flags |= 128, n = !0, Qn(i, !1), t.lanes = 4194304);
        i.isBackwards ? (l.sibling = t.child, t.child = l) : (r = i.last, r !== null ? r.sibling = l : t.child = l, i.last = l);
      }
      return i.tail !== null ? (t = i.tail, i.rendering = t, i.tail = t.sibling, i.renderingStartTime = ae(), t.sibling = null, r = re.current, q(re, n ? r & 1 | 2 : r & 1), t) : (ke(t), null);
    case 22:
    case 23:
      return Fa(), n = t.memoizedState !== null, e !== null && e.memoizedState !== null !== n && (t.flags |= 8192), n && t.mode & 1 ? Ue & 1073741824 && (ke(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : ke(t), null;
    case 24:
      return null;
    case 25:
      return null;
  }
  throw Error(b(156, t.tag));
}
function wm(e, t) {
  switch (ha(t), t.tag) {
    case 1:
      return $e(t.type) && Ri(), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
    case 3:
      return Pn(), J(Ie), J(Ce), Sa(), e = t.flags, e & 65536 && !(e & 128) ? (t.flags = e & -65537 | 128, t) : null;
    case 5:
      return ba(t), null;
    case 13:
      if (J(re), e = t.memoizedState, e !== null && e.dehydrated !== null) {
        if (t.alternate === null) throw Error(b(340));
        Nn();
      }
      return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
    case 19:
      return J(re), null;
    case 4:
      return Pn(), null;
    case 10:
      return ya(t.type._context), null;
    case 22:
    case 23:
      return Fa(), null;
    case 24:
      return null;
    default:
      return null;
  }
}
var ni = !1, Se = !1, km = typeof WeakSet == "function" ? WeakSet : Set, M = null;
function rn(e, t) {
  var r = e.ref;
  if (r !== null) if (typeof r == "function") try {
    r(null);
  } catch (n) {
    le(e, t, n);
  }
  else r.current = null;
}
function Ss(e, t, r) {
  try {
    r();
  } catch (n) {
    le(e, t, n);
  }
}
var Gu = !1;
function bm(e, t) {
  if (ls = _i, e = Td(), fa(e)) {
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
        var l = 0, s = -1, a = -1, u = 0, h = 0, v = e, g = null;
        t: for (; ; ) {
          for (var y; v !== r || o !== 0 && v.nodeType !== 3 || (s = l + o), v !== i || n !== 0 && v.nodeType !== 3 || (a = l + n), v.nodeType === 3 && (l += v.nodeValue.length), (y = v.firstChild) !== null; )
            g = v, v = y;
          for (; ; ) {
            if (v === e) break t;
            if (g === r && ++u === o && (s = l), g === i && ++h === n && (a = l), (y = v.nextSibling) !== null) break;
            v = g, g = v.parentNode;
          }
          v = y;
        }
        r = s === -1 || a === -1 ? null : { start: s, end: a };
      } else r = null;
    }
    r = r || { start: 0, end: 0 };
  } else r = null;
  for (ss = { focusedElem: e, selectionRange: r }, _i = !1, M = t; M !== null; ) if (t = M, e = t.child, (t.subtreeFlags & 1028) !== 0 && e !== null) e.return = t, M = e;
  else for (; M !== null; ) {
    t = M;
    try {
      var x = t.alternate;
      if (t.flags & 1024) switch (t.tag) {
        case 0:
        case 11:
        case 15:
          break;
        case 1:
          if (x !== null) {
            var w = x.memoizedProps, C = x.memoizedState, p = t.stateNode, d = p.getSnapshotBeforeUpdate(t.elementType === t.type ? w : ot(t.type, w), C);
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
  return x = Gu, Gu = !1, x;
}
function io(e, t, r) {
  var n = t.updateQueue;
  if (n = n !== null ? n.lastEffect : null, n !== null) {
    var o = n = n.next;
    do {
      if ((o.tag & e) === e) {
        var i = o.destroy;
        o.destroy = void 0, i !== void 0 && Ss(t, r, i);
      }
      o = o.next;
    } while (o !== n);
  }
}
function rl(e, t) {
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
function Cs(e) {
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
  t !== null && (e.alternate = null, zf(t)), e.child = null, e.deletions = null, e.sibling = null, e.tag === 5 && (t = e.stateNode, t !== null && (delete t[vt], delete t[xo], delete t[cs], delete t[om], delete t[im])), e.stateNode = null, e.return = null, e.dependencies = null, e.memoizedProps = null, e.memoizedState = null, e.pendingProps = null, e.stateNode = null, e.updateQueue = null;
}
function Mf(e) {
  return e.tag === 5 || e.tag === 3 || e.tag === 4;
}
function qu(e) {
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
function Es(e, t, r) {
  var n = e.tag;
  if (n === 5 || n === 6) e = e.stateNode, t ? r.nodeType === 8 ? r.parentNode.insertBefore(e, t) : r.insertBefore(e, t) : (r.nodeType === 8 ? (t = r.parentNode, t.insertBefore(e, r)) : (t = r, t.appendChild(e)), r = r._reactRootContainer, r != null || t.onclick !== null || (t.onclick = Mi));
  else if (n !== 4 && (e = e.child, e !== null)) for (Es(e, t, r), e = e.sibling; e !== null; ) Es(e, t, r), e = e.sibling;
}
function js(e, t, r) {
  var n = e.tag;
  if (n === 5 || n === 6) e = e.stateNode, t ? r.insertBefore(e, t) : r.appendChild(e);
  else if (n !== 4 && (e = e.child, e !== null)) for (js(e, t, r), e = e.sibling; e !== null; ) js(e, t, r), e = e.sibling;
}
var ge = null, lt = !1;
function It(e, t, r) {
  for (r = r.child; r !== null; ) Rf(e, t, r), r = r.sibling;
}
function Rf(e, t, r) {
  if (yt && typeof yt.onCommitFiberUnmount == "function") try {
    yt.onCommitFiberUnmount(Gi, r);
  } catch {
  }
  switch (r.tag) {
    case 5:
      Se || rn(r, t);
    case 6:
      var n = ge, o = lt;
      ge = null, It(e, t, r), ge = n, lt = o, ge !== null && (lt ? (e = ge, r = r.stateNode, e.nodeType === 8 ? e.parentNode.removeChild(r) : e.removeChild(r)) : ge.removeChild(r.stateNode));
      break;
    case 18:
      ge !== null && (lt ? (e = ge, r = r.stateNode, e.nodeType === 8 ? Nl(e.parentNode, r) : e.nodeType === 1 && Nl(e, r), ho(e)) : Nl(ge, r.stateNode));
      break;
    case 4:
      n = ge, o = lt, ge = r.stateNode.containerInfo, lt = !0, It(e, t, r), ge = n, lt = o;
      break;
    case 0:
    case 11:
    case 14:
    case 15:
      if (!Se && (n = r.updateQueue, n !== null && (n = n.lastEffect, n !== null))) {
        o = n = n.next;
        do {
          var i = o, l = i.destroy;
          i = i.tag, l !== void 0 && (i & 2 || i & 4) && Ss(r, t, l), o = o.next;
        } while (o !== n);
      }
      It(e, t, r);
      break;
    case 1:
      if (!Se && (rn(r, t), n = r.stateNode, typeof n.componentWillUnmount == "function")) try {
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
function Yu(e) {
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
function nt(e, t) {
  var r = t.deletions;
  if (r !== null) for (var n = 0; n < r.length; n++) {
    var o = r[n];
    try {
      var i = e, l = t, s = l;
      e: for (; s !== null; ) {
        switch (s.tag) {
          case 5:
            ge = s.stateNode, lt = !1;
            break e;
          case 3:
            ge = s.stateNode.containerInfo, lt = !0;
            break e;
          case 4:
            ge = s.stateNode.containerInfo, lt = !0;
            break e;
        }
        s = s.return;
      }
      if (ge === null) throw Error(b(160));
      Rf(i, l, o), ge = null, lt = !1;
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
      if (nt(t, e), ft(e), n & 4) {
        try {
          io(3, e, e.return), rl(3, e);
        } catch (w) {
          le(e, e.return, w);
        }
        try {
          io(5, e, e.return);
        } catch (w) {
          le(e, e.return, w);
        }
      }
      break;
    case 1:
      nt(t, e), ft(e), n & 512 && r !== null && rn(r, r.return);
      break;
    case 5:
      if (nt(t, e), ft(e), n & 512 && r !== null && rn(r, r.return), e.flags & 32) {
        var o = e.stateNode;
        try {
          uo(o, "");
        } catch (w) {
          le(e, e.return, w);
        }
      }
      if (n & 4 && (o = e.stateNode, o != null)) {
        var i = e.memoizedProps, l = r !== null ? r.memoizedProps : i, s = e.type, a = e.updateQueue;
        if (e.updateQueue = null, a !== null) try {
          s === "input" && i.type === "radio" && i.name != null && ed(o, i), Yl(s, l);
          var u = Yl(s, i);
          for (l = 0; l < a.length; l += 2) {
            var h = a[l], v = a[l + 1];
            h === "style" ? id(o, v) : h === "dangerouslySetInnerHTML" ? nd(o, v) : h === "children" ? uo(o, v) : Js(o, h, v, u);
          }
          switch (s) {
            case "input":
              Wl(o, i);
              break;
            case "textarea":
              td(o, i);
              break;
            case "select":
              var g = o._wrapperState.wasMultiple;
              o._wrapperState.wasMultiple = !!i.multiple;
              var y = i.value;
              y != null ? on(o, !!i.multiple, y, !1) : g !== !!i.multiple && (i.defaultValue != null ? on(
                o,
                !!i.multiple,
                i.defaultValue,
                !0
              ) : on(o, !!i.multiple, i.multiple ? [] : "", !1));
          }
          o[xo] = i;
        } catch (w) {
          le(e, e.return, w);
        }
      }
      break;
    case 6:
      if (nt(t, e), ft(e), n & 4) {
        if (e.stateNode === null) throw Error(b(162));
        o = e.stateNode, i = e.memoizedProps;
        try {
          o.nodeValue = i;
        } catch (w) {
          le(e, e.return, w);
        }
      }
      break;
    case 3:
      if (nt(t, e), ft(e), n & 4 && r !== null && r.memoizedState.isDehydrated) try {
        ho(t.containerInfo);
      } catch (w) {
        le(e, e.return, w);
      }
      break;
    case 4:
      nt(t, e), ft(e);
      break;
    case 13:
      nt(t, e), ft(e), o = e.child, o.flags & 8192 && (i = o.memoizedState !== null, o.stateNode.isHidden = i, !i || o.alternate !== null && o.alternate.memoizedState !== null || (Ra = ae())), n & 4 && Yu(e);
      break;
    case 22:
      if (h = r !== null && r.memoizedState !== null, e.mode & 1 ? (Se = (u = Se) || h, nt(t, e), Se = u) : nt(t, e), ft(e), n & 8192) {
        if (u = e.memoizedState !== null, (e.stateNode.isHidden = u) && !h && e.mode & 1) for (M = e, h = e.child; h !== null; ) {
          for (v = M = h; M !== null; ) {
            switch (g = M, y = g.child, g.tag) {
              case 0:
              case 11:
              case 14:
              case 15:
                io(4, g, g.return);
                break;
              case 1:
                rn(g, g.return);
                var x = g.stateNode;
                if (typeof x.componentWillUnmount == "function") {
                  n = g, r = g.return;
                  try {
                    t = n, x.props = t.memoizedProps, x.state = t.memoizedState, x.componentWillUnmount();
                  } catch (w) {
                    le(n, r, w);
                  }
                }
                break;
              case 5:
                rn(g, g.return);
                break;
              case 22:
                if (g.memoizedState !== null) {
                  Zu(v);
                  continue;
                }
            }
            y !== null ? (y.return = g, M = y) : Zu(v);
          }
          h = h.sibling;
        }
        e: for (h = null, v = e; ; ) {
          if (v.tag === 5) {
            if (h === null) {
              h = v;
              try {
                o = v.stateNode, u ? (i = o.style, typeof i.setProperty == "function" ? i.setProperty("display", "none", "important") : i.display = "none") : (s = v.stateNode, a = v.memoizedProps.style, l = a != null && a.hasOwnProperty("display") ? a.display : null, s.style.display = od("display", l));
              } catch (w) {
                le(e, e.return, w);
              }
            }
          } else if (v.tag === 6) {
            if (h === null) try {
              v.stateNode.nodeValue = u ? "" : v.memoizedProps;
            } catch (w) {
              le(e, e.return, w);
            }
          } else if ((v.tag !== 22 && v.tag !== 23 || v.memoizedState === null || v === e) && v.child !== null) {
            v.child.return = v, v = v.child;
            continue;
          }
          if (v === e) break e;
          for (; v.sibling === null; ) {
            if (v.return === null || v.return === e) break e;
            h === v && (h = null), v = v.return;
          }
          h === v && (h = null), v.sibling.return = v.return, v = v.sibling;
        }
      }
      break;
    case 19:
      nt(t, e), ft(e), n & 4 && Yu(e);
      break;
    case 21:
      break;
    default:
      nt(
        t,
        e
      ), ft(e);
  }
}
function ft(e) {
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
          var i = qu(e);
          js(e, i, o);
          break;
        case 3:
        case 4:
          var l = n.stateNode.containerInfo, s = qu(e);
          Es(e, s, l);
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
      var l = o.memoizedState !== null || ni;
      if (!l) {
        var s = o.alternate, a = s !== null && s.memoizedState !== null || Se;
        s = ni;
        var u = Se;
        if (ni = l, (Se = a) && !u) for (M = o; M !== null; ) l = M, a = l.child, l.tag === 22 && l.memoizedState !== null ? Ju(o) : a !== null ? (a.return = l, M = a) : Ju(o);
        for (; i !== null; ) M = i, Ff(i), i = i.sibling;
        M = o, ni = s, Se = u;
      }
      Xu(e);
    } else o.subtreeFlags & 8772 && i !== null ? (i.return = o, M = i) : Xu(e);
  }
}
function Xu(e) {
  for (; M !== null; ) {
    var t = M;
    if (t.flags & 8772) {
      var r = t.alternate;
      try {
        if (t.flags & 8772) switch (t.tag) {
          case 0:
          case 11:
          case 15:
            Se || rl(5, t);
            break;
          case 1:
            var n = t.stateNode;
            if (t.flags & 4 && !Se) if (r === null) n.componentDidMount();
            else {
              var o = t.elementType === t.type ? r.memoizedProps : ot(t.type, r.memoizedProps);
              n.componentDidUpdate(o, r.memoizedState, n.__reactInternalSnapshotBeforeUpdate);
            }
            var i = t.updateQueue;
            i !== null && Ou(t, i, n);
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
              Ou(t, l, r);
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
                var h = u.memoizedState;
                if (h !== null) {
                  var v = h.dehydrated;
                  v !== null && ho(v);
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
        Se || t.flags & 512 && Cs(t);
      } catch (g) {
        le(t, t.return, g);
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
function Zu(e) {
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
function Ju(e) {
  for (; M !== null; ) {
    var t = M;
    try {
      switch (t.tag) {
        case 0:
        case 11:
        case 15:
          var r = t.return;
          try {
            rl(4, t);
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
            Cs(t);
          } catch (a) {
            le(t, i, a);
          }
          break;
        case 5:
          var l = t.return;
          try {
            Cs(t);
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
var Cm = Math.ceil, Qi = Ot.ReactCurrentDispatcher, za = Ot.ReactCurrentOwner, et = Ot.ReactCurrentBatchConfig, W = 0, he = null, ue = null, ye = 0, Ue = 0, nn = pr(0), de = 0, Eo = null, $r = 0, nl = 0, Ma = 0, lo = null, Oe = null, Ra = 0, Mn = 1 / 0, Ct = null, Bi = !1, Ns = null, lr = null, oi = !1, er = null, Hi = 0, so = 0, _s = null, yi = -1, xi = 0;
function _e() {
  return W & 6 ? ae() : yi !== -1 ? yi : yi = ae();
}
function sr(e) {
  return e.mode & 1 ? W & 2 && ye !== 0 ? ye & -ye : sm.transition !== null ? (xi === 0 && (xi = vd()), xi) : (e = K, e !== 0 || (e = window.event, e = e === void 0 ? 16 : Cd(e.type)), e) : 1;
}
function ut(e, t, r, n) {
  if (50 < so) throw so = 0, _s = null, Error(b(185));
  Oo(e, r, n), (!(W & 2) || e !== he) && (e === he && (!(W & 2) && (nl |= r), de === 4 && Ht(e, ye)), De(e, n), r === 1 && W === 0 && !(t.mode & 1) && (Mn = ae() + 500, Ji && hr()));
}
function De(e, t) {
  var r = e.callbackNode;
  sh(e, t);
  var n = Ni(e, e === he ? ye : 0);
  if (n === 0) r !== null && au(r), e.callbackNode = null, e.callbackPriority = 0;
  else if (t = n & -n, e.callbackPriority !== t) {
    if (r != null && au(r), t === 1) e.tag === 0 ? lm(ec.bind(null, e)) : Bd(ec.bind(null, e)), rm(function() {
      !(W & 6) && hr();
    }), r = null;
    else {
      switch (yd(n)) {
        case 1:
          r = oa;
          break;
        case 4:
          r = md;
          break;
        case 16:
          r = ji;
          break;
        case 536870912:
          r = gd;
          break;
        default:
          r = ji;
      }
      r = Qf(r, Of.bind(null, e));
    }
    e.callbackPriority = t, e.callbackNode = r;
  }
}
function Of(e, t) {
  if (yi = -1, xi = 0, W & 6) throw Error(b(327));
  var r = e.callbackNode;
  if (cn() && e.callbackNode !== r) return null;
  var n = Ni(e, e === he ? ye : 0);
  if (n === 0) return null;
  if (n & 30 || n & e.expiredLanes || t) t = Wi(e, n);
  else {
    t = n;
    var o = W;
    W |= 2;
    var i = If();
    (he !== e || ye !== t) && (Ct = null, Mn = ae() + 500, Tr(e, t));
    do
      try {
        Nm();
        break;
      } catch (s) {
        Lf(e, s);
      }
    while (!0);
    va(), Qi.current = i, W = o, ue !== null ? t = 0 : (he = null, ye = 0, t = de);
  }
  if (t !== 0) {
    if (t === 2 && (o = ts(e), o !== 0 && (n = o, t = Ps(e, o))), t === 1) throw r = Eo, Tr(e, 0), Ht(e, n), De(e, ae()), r;
    if (t === 6) Ht(e, n);
    else {
      if (o = e.current.alternate, !(n & 30) && !Em(o) && (t = Wi(e, n), t === 2 && (i = ts(e), i !== 0 && (n = i, t = Ps(e, i))), t === 1)) throw r = Eo, Tr(e, 0), Ht(e, n), De(e, ae()), r;
      switch (e.finishedWork = o, e.finishedLanes = n, t) {
        case 0:
        case 1:
          throw Error(b(345));
        case 2:
          yr(e, Oe, Ct);
          break;
        case 3:
          if (Ht(e, n), (n & 130023424) === n && (t = Ra + 500 - ae(), 10 < t)) {
            if (Ni(e, 0) !== 0) break;
            if (o = e.suspendedLanes, (o & n) !== n) {
              _e(), e.pingedLanes |= e.suspendedLanes & o;
              break;
            }
            e.timeoutHandle = us(yr.bind(null, e, Oe, Ct), t);
            break;
          }
          yr(e, Oe, Ct);
          break;
        case 4:
          if (Ht(e, n), (n & 4194240) === n) break;
          for (t = e.eventTimes, o = -1; 0 < n; ) {
            var l = 31 - at(n);
            i = 1 << l, l = t[l], l > o && (o = l), n &= ~i;
          }
          if (n = o, n = ae() - n, n = (120 > n ? 120 : 480 > n ? 480 : 1080 > n ? 1080 : 1920 > n ? 1920 : 3e3 > n ? 3e3 : 4320 > n ? 4320 : 1960 * Cm(n / 1960)) - n, 10 < n) {
            e.timeoutHandle = us(yr.bind(null, e, Oe, Ct), n);
            break;
          }
          yr(e, Oe, Ct);
          break;
        case 5:
          yr(e, Oe, Ct);
          break;
        default:
          throw Error(b(329));
      }
    }
  }
  return De(e, ae()), e.callbackNode === r ? Of.bind(null, e) : null;
}
function Ps(e, t) {
  var r = lo;
  return e.current.memoizedState.isDehydrated && (Tr(e, t).flags |= 256), e = Wi(e, t), e !== 2 && (t = Oe, Oe = r, t !== null && zs(t)), e;
}
function zs(e) {
  Oe === null ? Oe = e : Oe.push.apply(Oe, e);
}
function Em(e) {
  for (var t = e; ; ) {
    if (t.flags & 16384) {
      var r = t.updateQueue;
      if (r !== null && (r = r.stores, r !== null)) for (var n = 0; n < r.length; n++) {
        var o = r[n], i = o.getSnapshot;
        o = o.value;
        try {
          if (!ct(i(), o)) return !1;
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
function Ht(e, t) {
  for (t &= ~Ma, t &= ~nl, e.suspendedLanes |= t, e.pingedLanes &= ~t, e = e.expirationTimes; 0 < t; ) {
    var r = 31 - at(t), n = 1 << r;
    e[r] = -1, t &= ~n;
  }
}
function ec(e) {
  if (W & 6) throw Error(b(327));
  cn();
  var t = Ni(e, 0);
  if (!(t & 1)) return De(e, ae()), null;
  var r = Wi(e, t);
  if (e.tag !== 0 && r === 2) {
    var n = ts(e);
    n !== 0 && (t = n, r = Ps(e, n));
  }
  if (r === 1) throw r = Eo, Tr(e, 0), Ht(e, t), De(e, ae()), r;
  if (r === 6) throw Error(b(345));
  return e.finishedWork = e.current.alternate, e.finishedLanes = t, yr(e, Oe, Ct), De(e, ae()), null;
}
function Ta(e, t) {
  var r = W;
  W |= 1;
  try {
    return e(t);
  } finally {
    W = r, W === 0 && (Mn = ae() + 500, Ji && hr());
  }
}
function Dr(e) {
  er !== null && er.tag === 0 && !(W & 6) && cn();
  var t = W;
  W |= 1;
  var r = et.transition, n = K;
  try {
    if (et.transition = null, K = 1, e) return e();
  } finally {
    K = n, et.transition = r, W = t, !(W & 6) && hr();
  }
}
function Fa() {
  Ue = nn.current, J(nn);
}
function Tr(e, t) {
  e.finishedWork = null, e.finishedLanes = 0;
  var r = e.timeoutHandle;
  if (r !== -1 && (e.timeoutHandle = -1, tm(r)), ue !== null) for (r = ue.return; r !== null; ) {
    var n = r;
    switch (ha(n), n.tag) {
      case 1:
        n = n.type.childContextTypes, n != null && Ri();
        break;
      case 3:
        Pn(), J(Ie), J(Ce), Sa();
        break;
      case 5:
        ba(n);
        break;
      case 4:
        Pn();
        break;
      case 13:
        J(re);
        break;
      case 19:
        J(re);
        break;
      case 10:
        ya(n.type._context);
        break;
      case 22:
      case 23:
        Fa();
    }
    r = r.return;
  }
  if (he = e, ue = e = ar(e.current, null), ye = Ue = t, de = 0, Eo = null, Ma = nl = $r = 0, Oe = lo = null, kr !== null) {
    for (t = 0; t < kr.length; t++) if (r = kr[t], n = r.interleaved, n !== null) {
      r.interleaved = null;
      var o = n.next, i = r.pending;
      if (i !== null) {
        var l = i.next;
        i.next = o, n.next = l;
      }
      r.pending = n;
    }
    kr = null;
  }
  return e;
}
function Lf(e, t) {
  do {
    var r = ue;
    try {
      if (va(), mi.current = Ui, Ai) {
        for (var n = ne.memoizedState; n !== null; ) {
          var o = n.queue;
          o !== null && (o.pending = null), n = n.next;
        }
        Ai = !1;
      }
      if (Ir = 0, pe = ce = ne = null, oo = !1, bo = 0, za.current = null, r === null || r.return === null) {
        de = 1, Eo = t, ue = null;
        break;
      }
      e: {
        var i = e, l = r.return, s = r, a = t;
        if (t = ye, s.flags |= 32768, a !== null && typeof a == "object" && typeof a.then == "function") {
          var u = a, h = s, v = h.tag;
          if (!(h.mode & 1) && (v === 0 || v === 11 || v === 15)) {
            var g = h.alternate;
            g ? (h.updateQueue = g.updateQueue, h.memoizedState = g.memoizedState, h.lanes = g.lanes) : (h.updateQueue = null, h.memoizedState = null);
          }
          var y = Uu(l);
          if (y !== null) {
            y.flags &= -257, Qu(y, l, s, i, t), y.mode & 1 && Au(i, u, t), t = y, a = u;
            var x = t.updateQueue;
            if (x === null) {
              var w = /* @__PURE__ */ new Set();
              w.add(a), t.updateQueue = w;
            } else x.add(a);
            break e;
          } else {
            if (!(t & 1)) {
              Au(i, u, t), Oa();
              break e;
            }
            a = Error(b(426));
          }
        } else if (te && s.mode & 1) {
          var C = Uu(l);
          if (C !== null) {
            !(C.flags & 65536) && (C.flags |= 256), Qu(C, l, s, i, t), ma(zn(a, s));
            break e;
          }
        }
        i = a = zn(a, s), de !== 4 && (de = 2), lo === null ? lo = [i] : lo.push(i), i = l;
        do {
          switch (i.tag) {
            case 3:
              i.flags |= 65536, t &= -t, i.lanes |= t;
              var p = xf(i, a, t);
              Fu(i, p);
              break e;
            case 1:
              s = a;
              var d = i.type, m = i.stateNode;
              if (!(i.flags & 128) && (typeof d.getDerivedStateFromError == "function" || m !== null && typeof m.componentDidCatch == "function" && (lr === null || !lr.has(m)))) {
                i.flags |= 65536, t &= -t, i.lanes |= t;
                var k = wf(i, s, t);
                Fu(i, k);
                break e;
              }
          }
          i = i.return;
        } while (i !== null);
      }
      Df(r);
    } catch (S) {
      t = S, ue === r && r !== null && (ue = r = r.return);
      continue;
    }
    break;
  } while (!0);
}
function If() {
  var e = Qi.current;
  return Qi.current = Ui, e === null ? Ui : e;
}
function Oa() {
  (de === 0 || de === 3 || de === 2) && (de = 4), he === null || !($r & 268435455) && !(nl & 268435455) || Ht(he, ye);
}
function Wi(e, t) {
  var r = W;
  W |= 2;
  var n = If();
  (he !== e || ye !== t) && (Ct = null, Tr(e, t));
  do
    try {
      jm();
      break;
    } catch (o) {
      Lf(e, o);
    }
  while (!0);
  if (va(), W = r, Qi.current = n, ue !== null) throw Error(b(261));
  return he = null, ye = 0, de;
}
function jm() {
  for (; ue !== null; ) $f(ue);
}
function Nm() {
  for (; ue !== null && !Zp(); ) $f(ue);
}
function $f(e) {
  var t = Uf(e.alternate, e, Ue);
  e.memoizedProps = e.pendingProps, t === null ? Df(e) : ue = t, za.current = null;
}
function Df(e) {
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
    } else if (r = xm(r, t, Ue), r !== null) {
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
function yr(e, t, r) {
  var n = K, o = et.transition;
  try {
    et.transition = null, K = 1, _m(e, t, r, n);
  } finally {
    et.transition = o, K = n;
  }
  return null;
}
function _m(e, t, r, n) {
  do
    cn();
  while (er !== null);
  if (W & 6) throw Error(b(327));
  r = e.finishedWork;
  var o = e.finishedLanes;
  if (r === null) return null;
  if (e.finishedWork = null, e.finishedLanes = 0, r === e.current) throw Error(b(177));
  e.callbackNode = null, e.callbackPriority = 0;
  var i = r.lanes | r.childLanes;
  if (ah(e, i), e === he && (ue = he = null, ye = 0), !(r.subtreeFlags & 2064) && !(r.flags & 2064) || oi || (oi = !0, Qf(ji, function() {
    return cn(), null;
  })), i = (r.flags & 15990) !== 0, r.subtreeFlags & 15990 || i) {
    i = et.transition, et.transition = null;
    var l = K;
    K = 1;
    var s = W;
    W |= 4, za.current = null, bm(e, r), Tf(r, e), Gh(ss), _i = !!ls, ss = ls = null, e.current = r, Sm(r), Jp(), W = s, K = l, et.transition = i;
  } else e.current = r;
  if (oi && (oi = !1, er = e, Hi = o), i = e.pendingLanes, i === 0 && (lr = null), rh(r.stateNode), De(e, ae()), t !== null) for (n = e.onRecoverableError, r = 0; r < t.length; r++) o = t[r], n(o.value, { componentStack: o.stack, digest: o.digest });
  if (Bi) throw Bi = !1, e = Ns, Ns = null, e;
  return Hi & 1 && e.tag !== 0 && cn(), i = e.pendingLanes, i & 1 ? e === _s ? so++ : (so = 0, _s = e) : so = 0, hr(), null;
}
function cn() {
  if (er !== null) {
    var e = yd(Hi), t = et.transition, r = K;
    try {
      if (et.transition = null, K = 16 > e ? 16 : e, er === null) var n = !1;
      else {
        if (e = er, er = null, Hi = 0, W & 6) throw Error(b(331));
        var o = W;
        for (W |= 4, M = e.current; M !== null; ) {
          var i = M, l = i.child;
          if (M.flags & 16) {
            var s = i.deletions;
            if (s !== null) {
              for (var a = 0; a < s.length; a++) {
                var u = s[a];
                for (M = u; M !== null; ) {
                  var h = M;
                  switch (h.tag) {
                    case 0:
                    case 11:
                    case 15:
                      io(8, h, i);
                  }
                  var v = h.child;
                  if (v !== null) v.return = h, M = v;
                  else for (; M !== null; ) {
                    h = M;
                    var g = h.sibling, y = h.return;
                    if (zf(h), h === u) {
                      M = null;
                      break;
                    }
                    if (g !== null) {
                      g.return = y, M = g;
                      break;
                    }
                    M = y;
                  }
                }
              }
              var x = i.alternate;
              if (x !== null) {
                var w = x.child;
                if (w !== null) {
                  x.child = null;
                  do {
                    var C = w.sibling;
                    w.sibling = null, w = C;
                  } while (w !== null);
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
                  rl(9, s);
              }
            } catch (S) {
              le(s, s.return, S);
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
        if (W = o, hr(), yt && typeof yt.onPostCommitFiberRoot == "function") try {
          yt.onPostCommitFiberRoot(Gi, e);
        } catch {
        }
        n = !0;
      }
      return n;
    } finally {
      K = r, et.transition = t;
    }
  }
  return !1;
}
function tc(e, t, r) {
  t = zn(r, t), t = xf(e, t, 1), e = ir(e, t, 1), t = _e(), e !== null && (Oo(e, 1, t), De(e, t));
}
function le(e, t, r) {
  if (e.tag === 3) tc(e, e, r);
  else for (; t !== null; ) {
    if (t.tag === 3) {
      tc(t, e, r);
      break;
    } else if (t.tag === 1) {
      var n = t.stateNode;
      if (typeof t.type.getDerivedStateFromError == "function" || typeof n.componentDidCatch == "function" && (lr === null || !lr.has(n))) {
        e = zn(r, e), e = wf(t, e, 1), t = ir(t, e, 1), e = _e(), t !== null && (Oo(t, 1, e), De(t, e));
        break;
      }
    }
    t = t.return;
  }
}
function Pm(e, t, r) {
  var n = e.pingCache;
  n !== null && n.delete(t), t = _e(), e.pingedLanes |= e.suspendedLanes & r, he === e && (ye & r) === r && (de === 4 || de === 3 && (ye & 130023424) === ye && 500 > ae() - Ra ? Tr(e, 0) : Ma |= r), De(e, t);
}
function Af(e, t) {
  t === 0 && (e.mode & 1 ? (t = Go, Go <<= 1, !(Go & 130023424) && (Go = 4194304)) : t = 1);
  var r = _e();
  e = Tt(e, t), e !== null && (Oo(e, t, r), De(e, r));
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
  if (e !== null) if (e.memoizedProps !== t.pendingProps || Ie.current) Le = !0;
  else {
    if (!(e.lanes & r) && !(t.flags & 128)) return Le = !1, ym(e, t, r);
    Le = !!(e.flags & 131072);
  }
  else Le = !1, te && t.flags & 1048576 && Hd(t, Oi, t.index);
  switch (t.lanes = 0, t.tag) {
    case 2:
      var n = t.type;
      vi(e, t), e = t.pendingProps;
      var o = jn(t, Ce.current);
      un(t, r), o = Ea(null, t, n, e, o, r);
      var i = ja();
      return t.flags |= 1, typeof o == "object" && o !== null && typeof o.render == "function" && o.$$typeof === void 0 ? (t.tag = 1, t.memoizedState = null, t.updateQueue = null, $e(n) ? (i = !0, Ti(t)) : i = !1, t.memoizedState = o.state !== null && o.state !== void 0 ? o.state : null, wa(t), o.updater = tl, t.stateNode = o, o._reactInternals = t, gs(t, n, e, r), t = xs(null, t, n, !0, i, r)) : (t.tag = 0, te && i && pa(t), Ne(null, t, o, r), t = t.child), t;
    case 16:
      n = t.elementType;
      e: {
        switch (vi(e, t), e = t.pendingProps, o = n._init, n = o(n._payload), t.type = n, o = t.tag = Tm(n), e = ot(n, e), o) {
          case 0:
            t = ys(null, t, n, e, r);
            break e;
          case 1:
            t = Wu(null, t, n, e, r);
            break e;
          case 11:
            t = Bu(null, t, n, e, r);
            break e;
          case 14:
            t = Hu(null, t, n, ot(n.type, e), r);
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
      return n = t.type, o = t.pendingProps, o = t.elementType === n ? o : ot(n, o), ys(e, t, n, o, r);
    case 1:
      return n = t.type, o = t.pendingProps, o = t.elementType === n ? o : ot(n, o), Wu(e, t, n, o, r);
    case 3:
      e: {
        if (Cf(t), e === null) throw Error(b(387));
        n = t.pendingProps, i = t.memoizedState, o = i.element, Yd(e, t), $i(t, n, null, r);
        var l = t.memoizedState;
        if (n = l.element, i.isDehydrated) if (i = { element: n, isDehydrated: !1, cache: l.cache, pendingSuspenseBoundaries: l.pendingSuspenseBoundaries, transitions: l.transitions }, t.updateQueue.baseState = i, t.memoizedState = i, t.flags & 256) {
          o = zn(Error(b(423)), t), t = Vu(e, t, n, r, o);
          break e;
        } else if (n !== o) {
          o = zn(Error(b(424)), t), t = Vu(e, t, n, r, o);
          break e;
        } else for (He = or(t.stateNode.containerInfo.firstChild), We = t, te = !0, st = null, r = Gd(t, null, n, r), t.child = r; r; ) r.flags = r.flags & -3 | 4096, r = r.sibling;
        else {
          if (Nn(), n === o) {
            t = Ft(e, t, r);
            break e;
          }
          Ne(e, t, n, r);
        }
        t = t.child;
      }
      return t;
    case 5:
      return Xd(t), e === null && ps(t), n = t.type, o = t.pendingProps, i = e !== null ? e.memoizedProps : null, l = o.children, as(n, o) ? l = null : i !== null && as(n, i) && (t.flags |= 32), Sf(e, t), Ne(e, t, l, r), t.child;
    case 6:
      return e === null && ps(t), null;
    case 13:
      return Ef(e, t, r);
    case 4:
      return ka(t, t.stateNode.containerInfo), n = t.pendingProps, e === null ? t.child = _n(t, null, n, r) : Ne(e, t, n, r), t.child;
    case 11:
      return n = t.type, o = t.pendingProps, o = t.elementType === n ? o : ot(n, o), Bu(e, t, n, o, r);
    case 7:
      return Ne(e, t, t.pendingProps, r), t.child;
    case 8:
      return Ne(e, t, t.pendingProps.children, r), t.child;
    case 12:
      return Ne(e, t, t.pendingProps.children, r), t.child;
    case 10:
      e: {
        if (n = t.type._context, o = t.pendingProps, i = t.memoizedProps, l = o.value, q(Li, n._currentValue), n._currentValue = l, i !== null) if (ct(i.value, l)) {
          if (i.children === o.children && !Ie.current) {
            t = Ft(e, t, r);
            break e;
          }
        } else for (i = t.child, i !== null && (i.return = t); i !== null; ) {
          var s = i.dependencies;
          if (s !== null) {
            l = i.child;
            for (var a = s.firstContext; a !== null; ) {
              if (a.context === n) {
                if (i.tag === 1) {
                  a = zt(-1, r & -r), a.tag = 2;
                  var u = i.updateQueue;
                  if (u !== null) {
                    u = u.shared;
                    var h = u.pending;
                    h === null ? a.next = a : (a.next = h.next, h.next = a), u.pending = a;
                  }
                }
                i.lanes |= r, a = i.alternate, a !== null && (a.lanes |= r), hs(
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
            l.lanes |= r, s = l.alternate, s !== null && (s.lanes |= r), hs(l, r, t), l = i.sibling;
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
        Ne(e, t, o.children, r), t = t.child;
      }
      return t;
    case 9:
      return o = t.type, n = t.pendingProps.children, un(t, r), o = tt(o), n = n(o), t.flags |= 1, Ne(e, t, n, r), t.child;
    case 14:
      return n = t.type, o = ot(n, t.pendingProps), o = ot(n.type, o), Hu(e, t, n, o, r);
    case 15:
      return kf(e, t, t.type, t.pendingProps, r);
    case 17:
      return n = t.type, o = t.pendingProps, o = t.elementType === n ? o : ot(n, o), vi(e, t), t.tag = 1, $e(n) ? (e = !0, Ti(t)) : e = !1, un(t, r), yf(t, n, o), gs(t, n, o, r), xs(null, t, n, !0, e, r);
    case 19:
      return jf(e, t, r);
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
function Je(e, t, r, n) {
  return new Rm(e, t, r, n);
}
function La(e) {
  return e = e.prototype, !(!e || !e.isReactComponent);
}
function Tm(e) {
  if (typeof e == "function") return La(e) ? 1 : 0;
  if (e != null) {
    if (e = e.$$typeof, e === ta) return 11;
    if (e === ra) return 14;
  }
  return 2;
}
function ar(e, t) {
  var r = e.alternate;
  return r === null ? (r = Je(e.tag, t, e.key, e.mode), r.elementType = e.elementType, r.type = e.type, r.stateNode = e.stateNode, r.alternate = e, e.alternate = r) : (r.pendingProps = t, r.type = e.type, r.flags = 0, r.subtreeFlags = 0, r.deletions = null), r.flags = e.flags & 14680064, r.childLanes = e.childLanes, r.lanes = e.lanes, r.child = e.child, r.memoizedProps = e.memoizedProps, r.memoizedState = e.memoizedState, r.updateQueue = e.updateQueue, t = e.dependencies, r.dependencies = t === null ? null : { lanes: t.lanes, firstContext: t.firstContext }, r.sibling = e.sibling, r.index = e.index, r.ref = e.ref, r;
}
function wi(e, t, r, n, o, i) {
  var l = 2;
  if (n = e, typeof e == "function") La(e) && (l = 1);
  else if (typeof e == "string") l = 5;
  else e: switch (e) {
    case Kr:
      return Fr(r.children, o, i, t);
    case ea:
      l = 8, o |= 8;
      break;
    case Al:
      return e = Je(12, r, t, o | 2), e.elementType = Al, e.lanes = i, e;
    case Ul:
      return e = Je(13, r, t, o), e.elementType = Ul, e.lanes = i, e;
    case Ql:
      return e = Je(19, r, t, o), e.elementType = Ql, e.lanes = i, e;
    case Xc:
      return ol(r, o, i, t);
    default:
      if (typeof e == "object" && e !== null) switch (e.$$typeof) {
        case qc:
          l = 10;
          break e;
        case Yc:
          l = 9;
          break e;
        case ta:
          l = 11;
          break e;
        case ra:
          l = 14;
          break e;
        case Ut:
          l = 16, n = null;
          break e;
      }
      throw Error(b(130, e == null ? e : typeof e, ""));
  }
  return t = Je(l, r, t, o), t.elementType = e, t.type = n, t.lanes = i, t;
}
function Fr(e, t, r, n) {
  return e = Je(7, e, n, t), e.lanes = r, e;
}
function ol(e, t, r, n) {
  return e = Je(22, e, n, t), e.elementType = Xc, e.lanes = r, e.stateNode = { isHidden: !1 }, e;
}
function Ol(e, t, r) {
  return e = Je(6, e, null, t), e.lanes = r, e;
}
function Ll(e, t, r) {
  return t = Je(4, e.children !== null ? e.children : [], e.key, t), t.lanes = r, t.stateNode = { containerInfo: e.containerInfo, pendingChildren: null, implementation: e.implementation }, t;
}
function Fm(e, t, r, n, o) {
  this.tag = t, this.containerInfo = e, this.finishedWork = this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.pendingContext = this.context = null, this.callbackPriority = 0, this.eventTimes = gl(0), this.expirationTimes = gl(-1), this.entangledLanes = this.finishedLanes = this.mutableReadLanes = this.expiredLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = gl(0), this.identifierPrefix = n, this.onRecoverableError = o, this.mutableSourceEagerHydrationData = null;
}
function Ia(e, t, r, n, o, i, l, s, a) {
  return e = new Fm(e, t, r, s, a), t === 1 ? (t = 1, i === !0 && (t |= 8)) : t = 0, i = Je(3, null, null, t), e.current = i, i.stateNode = e, i.memoizedState = { element: n, isDehydrated: r, cache: null, transitions: null, pendingSuspenseBoundaries: null }, wa(i), e;
}
function Om(e, t, r) {
  var n = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
  return { $$typeof: Vr, key: n == null ? null : "" + n, children: e, containerInfo: t, implementation: r };
}
function Bf(e) {
  if (!e) return dr;
  e = e._reactInternals;
  e: {
    if (Ur(e) !== e || e.tag !== 1) throw Error(b(170));
    var t = e;
    do {
      switch (t.tag) {
        case 3:
          t = t.stateNode.context;
          break e;
        case 1:
          if ($e(t.type)) {
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
    if ($e(r)) return Qd(e, r, t);
  }
  return t;
}
function Hf(e, t, r, n, o, i, l, s, a) {
  return e = Ia(r, n, !0, e, o, i, l, s, a), e.context = Bf(null), r = e.current, n = _e(), o = sr(r), i = zt(n, o), i.callback = t ?? null, ir(r, i, o), e.current.lanes = o, Oo(e, o, n), De(e, n), e;
}
function il(e, t, r, n) {
  var o = t.current, i = _e(), l = sr(o);
  return r = Bf(r), t.context === null ? t.context = r : t.pendingContext = r, t = zt(i, l), t.payload = { element: e }, n = n === void 0 ? null : n, n !== null && (t.callback = n), e = ir(o, t, l), e !== null && (ut(e, o, l, i), hi(e, o, l)), l;
}
function Vi(e) {
  if (e = e.current, !e.child) return null;
  switch (e.child.tag) {
    case 5:
      return e.child.stateNode;
    default:
      return e.child.stateNode;
  }
}
function rc(e, t) {
  if (e = e.memoizedState, e !== null && e.dehydrated !== null) {
    var r = e.retryLane;
    e.retryLane = r !== 0 && r < t ? r : t;
  }
}
function $a(e, t) {
  rc(e, t), (e = e.alternate) && rc(e, t);
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
ll.prototype.render = Da.prototype.render = function(e) {
  var t = this._internalRoot;
  if (t === null) throw Error(b(409));
  il(e, t, null, null);
};
ll.prototype.unmount = Da.prototype.unmount = function() {
  var e = this._internalRoot;
  if (e !== null) {
    this._internalRoot = null;
    var t = e.containerInfo;
    Dr(function() {
      il(null, e, null, null);
    }), t[Rt] = null;
  }
};
function ll(e) {
  this._internalRoot = e;
}
ll.prototype.unstable_scheduleHydration = function(e) {
  if (e) {
    var t = kd();
    e = { blockedOn: null, target: e, priority: t };
    for (var r = 0; r < Bt.length && t !== 0 && t < Bt[r].priority; r++) ;
    Bt.splice(r, 0, e), r === 0 && Sd(e);
  }
};
function Aa(e) {
  return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11);
}
function sl(e) {
  return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11 && (e.nodeType !== 8 || e.nodeValue !== " react-mount-point-unstable "));
}
function nc() {
}
function Im(e, t, r, n, o) {
  if (o) {
    if (typeof n == "function") {
      var i = n;
      n = function() {
        var u = Vi(l);
        i.call(u);
      };
    }
    var l = Hf(t, n, e, 0, null, !1, !1, "", nc);
    return e._reactRootContainer = l, e[Rt] = l.current, vo(e.nodeType === 8 ? e.parentNode : e), Dr(), l;
  }
  for (; o = e.lastChild; ) e.removeChild(o);
  if (typeof n == "function") {
    var s = n;
    n = function() {
      var u = Vi(a);
      s.call(u);
    };
  }
  var a = Ia(e, 0, !1, null, null, !1, !1, "", nc);
  return e._reactRootContainer = a, e[Rt] = a.current, vo(e.nodeType === 8 ? e.parentNode : e), Dr(function() {
    il(t, a, r, n);
  }), a;
}
function al(e, t, r, n, o) {
  var i = r._reactRootContainer;
  if (i) {
    var l = i;
    if (typeof o == "function") {
      var s = o;
      o = function() {
        var a = Vi(l);
        s.call(a);
      };
    }
    il(t, l, e, o);
  } else l = Im(r, t, e, o, n);
  return Vi(l);
}
xd = function(e) {
  switch (e.tag) {
    case 3:
      var t = e.stateNode;
      if (t.current.memoizedState.isDehydrated) {
        var r = Yn(t.pendingLanes);
        r !== 0 && (ia(t, r | 1), De(t, ae()), !(W & 6) && (Mn = ae() + 500, hr()));
      }
      break;
    case 13:
      Dr(function() {
        var n = Tt(e, 1);
        if (n !== null) {
          var o = _e();
          ut(n, e, 1, o);
        }
      }), $a(e, 1);
  }
};
la = function(e) {
  if (e.tag === 13) {
    var t = Tt(e, 134217728);
    if (t !== null) {
      var r = _e();
      ut(t, e, 134217728, r);
    }
    $a(e, 134217728);
  }
};
wd = function(e) {
  if (e.tag === 13) {
    var t = sr(e), r = Tt(e, t);
    if (r !== null) {
      var n = _e();
      ut(r, e, t, n);
    }
    $a(e, t);
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
Zl = function(e, t, r) {
  switch (t) {
    case "input":
      if (Wl(e, r), t = r.name, r.type === "radio" && t != null) {
        for (r = e; r.parentNode; ) r = r.parentNode;
        for (r = r.querySelectorAll("input[name=" + JSON.stringify("" + t) + '][type="radio"]'), t = 0; t < r.length; t++) {
          var n = r[t];
          if (n !== e && n.form === e.form) {
            var o = Zi(n);
            if (!o) throw Error(b(90));
            Jc(n), Wl(n, o);
          }
        }
      }
      break;
    case "textarea":
      td(e, r);
      break;
    case "select":
      t = r.value, t != null && on(e, !!r.multiple, t, !1);
  }
};
ad = Ta;
ud = Dr;
var $m = { usingClientEntryPoint: !1, Events: [Io, Xr, Zi, ld, sd, Ta] }, Bn = { findFiberByHostInstance: wr, bundleType: 0, version: "18.3.1", rendererPackageName: "react-dom" }, Dm = { bundleType: Bn.bundleType, version: Bn.version, rendererPackageName: Bn.rendererPackageName, rendererConfig: Bn.rendererConfig, overrideHookState: null, overrideHookStateDeletePath: null, overrideHookStateRenamePath: null, overrideProps: null, overridePropsDeletePath: null, overridePropsRenamePath: null, setErrorHandler: null, setSuspenseHandler: null, scheduleUpdate: null, currentDispatcherRef: Ot.ReactCurrentDispatcher, findHostInstanceByFiber: function(e) {
  return e = fd(e), e === null ? null : e.stateNode;
}, findFiberByHostInstance: Bn.findFiberByHostInstance || Lm, findHostInstancesForRefresh: null, scheduleRefresh: null, scheduleRoot: null, setRefreshHandler: null, getCurrentFiber: null, reconcilerVersion: "18.3.1-next-f1338f8080-20240426" };
if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
  var ii = __REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!ii.isDisabled && ii.supportsFiber) try {
    Gi = ii.inject(Dm), yt = ii;
  } catch {
  }
}
Ke.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = $m;
Ke.createPortal = function(e, t) {
  var r = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
  if (!Aa(t)) throw Error(b(200));
  return Om(e, t, null, r);
};
Ke.createRoot = function(e, t) {
  if (!Aa(e)) throw Error(b(299));
  var r = !1, n = "", o = Wf;
  return t != null && (t.unstable_strictMode === !0 && (r = !0), t.identifierPrefix !== void 0 && (n = t.identifierPrefix), t.onRecoverableError !== void 0 && (o = t.onRecoverableError)), t = Ia(e, 1, !1, null, null, r, !1, n, o), e[Rt] = t.current, vo(e.nodeType === 8 ? e.parentNode : e), new Da(t);
};
Ke.findDOMNode = function(e) {
  if (e == null) return null;
  if (e.nodeType === 1) return e;
  var t = e._reactInternals;
  if (t === void 0)
    throw typeof e.render == "function" ? Error(b(188)) : (e = Object.keys(e).join(","), Error(b(268, e)));
  return e = fd(t), e = e === null ? null : e.stateNode, e;
};
Ke.flushSync = function(e) {
  return Dr(e);
};
Ke.hydrate = function(e, t, r) {
  if (!sl(t)) throw Error(b(200));
  return al(null, e, t, !0, r);
};
Ke.hydrateRoot = function(e, t, r) {
  if (!Aa(e)) throw Error(b(405));
  var n = r != null && r.hydratedSources || null, o = !1, i = "", l = Wf;
  if (r != null && (r.unstable_strictMode === !0 && (o = !0), r.identifierPrefix !== void 0 && (i = r.identifierPrefix), r.onRecoverableError !== void 0 && (l = r.onRecoverableError)), t = Hf(t, null, e, 1, r ?? null, o, !1, i, l), e[Rt] = t.current, vo(e), n) for (e = 0; e < n.length; e++) r = n[e], o = r._getVersion, o = o(r._source), t.mutableSourceEagerHydrationData == null ? t.mutableSourceEagerHydrationData = [r, o] : t.mutableSourceEagerHydrationData.push(
    r,
    o
  );
  return new ll(t);
};
Ke.render = function(e, t, r) {
  if (!sl(t)) throw Error(b(200));
  return al(null, e, t, !1, r);
};
Ke.unmountComponentAtNode = function(e) {
  if (!sl(e)) throw Error(b(40));
  return e._reactRootContainer ? (Dr(function() {
    al(null, null, e, !1, function() {
      e._reactRootContainer = null, e[Rt] = null;
    });
  }), !0) : !1;
};
Ke.unstable_batchedUpdates = Ta;
Ke.unstable_renderSubtreeIntoContainer = function(e, t, r, n) {
  if (!sl(r)) throw Error(b(200));
  if (e == null || e._reactInternals === void 0) throw Error(b(38));
  return al(e, t, r, !1, n);
};
Ke.version = "18.3.1-next-f1338f8080-20240426";
function Vf() {
  if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
    try {
      __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(Vf);
    } catch (e) {
      console.error(e);
    }
}
Vf(), Wc.exports = Ke;
var Kf = Wc.exports, Gf, oc = Kf;
Gf = oc.createRoot, oc.hydrateRoot;
var Do = class {
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
}, Cr, Wt, fn, jc, Am = (jc = class extends Do {
  constructor() {
    super();
    F(this, Cr);
    F(this, Wt);
    F(this, fn);
    N(this, fn, (t) => {
      if (typeof window < "u" && window.addEventListener) {
        const r = () => t();
        return window.addEventListener("visibilitychange", r, !1), () => {
          window.removeEventListener("visibilitychange", r);
        };
      }
    });
  }
  onSubscribe() {
    f(this, Wt) || this.setEventListener(f(this, fn));
  }
  onUnsubscribe() {
    var t;
    this.hasListeners() || ((t = f(this, Wt)) == null || t.call(this), N(this, Wt, void 0));
  }
  setEventListener(t) {
    var r;
    N(this, fn, t), (r = f(this, Wt)) == null || r.call(this), N(this, Wt, t((n) => {
      typeof n == "boolean" ? this.setFocused(n) : this.onFocus();
    }));
  }
  setFocused(t) {
    f(this, Cr) !== t && (N(this, Cr, t), this.onFocus());
  }
  onFocus() {
    const t = this.isFocused();
    this.listeners.forEach((r) => {
      r(t);
    });
  }
  isFocused() {
    return typeof f(this, Cr) == "boolean" ? f(this, Cr) : globalThis.document?.visibilityState !== "hidden";
  }
}, Cr = new WeakMap(), Wt = new WeakMap(), fn = new WeakMap(), jc), Ua = new Am(), Um = {
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
}, Vt, Vs, Nc, Qm = (Nc = class {
  constructor() {
    // We cannot have TimeoutManager<T> as we must instantiate it with a concrete
    // type at app boot; and if we leave that type, then any new timer provider
    // would need to support the default provider's concrete timer ID, which is
    // infeasible across environments.
    //
    // We settle for type safety for the TimeoutProvider type, and accept that
    // this class is unsafe internally to allow for extension.
    F(this, Vt, Um);
    F(this, Vs, !1);
  }
  setTimeoutProvider(e) {
    N(this, Vt, e);
  }
  setTimeout(e, t) {
    return f(this, Vt).setTimeout(e, t);
  }
  clearTimeout(e) {
    f(this, Vt).clearTimeout(e);
  }
  setInterval(e, t) {
    return f(this, Vt).setInterval(e, t);
  }
  clearInterval(e) {
    f(this, Vt).clearInterval(e);
  }
}, Vt = new WeakMap(), Vs = new WeakMap(), Nc), Sr = new Qm();
function Bm(e) {
  setTimeout(e, 0);
}
var Hm = typeof window > "u" || "Deno" in globalThis;
function Fe() {
}
function Wm(e, t) {
  return typeof e == "function" ? e(t) : e;
}
function Ms(e) {
  return typeof e == "number" && e >= 0 && e !== 1 / 0;
}
function qf(e, t) {
  return Math.max(e + (t || 0) - Date.now(), 0);
}
function ur(e, t) {
  return typeof e == "function" ? e(t) : e;
}
function Be(e, t) {
  return typeof e == "function" ? e(t) : e;
}
function ic(e, t) {
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
      if (t.queryHash !== Qa(l, t.options))
        return !1;
    } else if (!No(t.queryKey, l))
      return !1;
  }
  if (r !== "all") {
    const a = t.isActive();
    if (r === "active" && !a || r === "inactive" && a)
      return !1;
  }
  return !(typeof s == "boolean" && t.isStale() !== s || o && o !== t.state.fetchStatus || i && !i(t));
}
function lc(e, t) {
  const { exact: r, status: n, predicate: o, mutationKey: i } = e;
  if (i) {
    if (!t.options.mutationKey)
      return !1;
    if (r) {
      if (jo(t.options.mutationKey) !== jo(i))
        return !1;
    } else if (!No(t.options.mutationKey, i))
      return !1;
  }
  return !(n && t.state.status !== n || o && !o(t));
}
function Qa(e, t) {
  return (t?.queryKeyHashFn || jo)(e);
}
function jo(e) {
  return JSON.stringify(
    e,
    (t, r) => Ts(r) ? Object.keys(r).sort().reduce((n, o) => (n[o] = r[o], n), {}) : r
  );
}
function No(e, t) {
  return e === t ? !0 : typeof e != typeof t ? !1 : e && t && typeof e == "object" && typeof t == "object" ? Object.keys(t).every((r) => No(e[r], t[r])) : !1;
}
var Vm = Object.prototype.hasOwnProperty;
function Yf(e, t, r = 0) {
  if (e === t)
    return e;
  if (r > 500) return t;
  const n = sc(e) && sc(t);
  if (!n && !(Ts(e) && Ts(t))) return t;
  const i = (n ? e : Object.keys(e)).length, l = n ? t : Object.keys(t), s = l.length, a = n ? new Array(s) : {};
  let u = 0;
  for (let h = 0; h < s; h++) {
    const v = n ? h : l[h], g = e[v], y = t[v];
    if (g === y) {
      a[v] = g, (n ? h < i : Vm.call(e, v)) && u++;
      continue;
    }
    if (g === null || y === null || typeof g != "object" || typeof y != "object") {
      a[v] = y;
      continue;
    }
    const x = Yf(g, y, r + 1);
    a[v] = x, x === g && u++;
  }
  return i === s && u === i ? e : a;
}
function Rs(e, t) {
  if (!t || Object.keys(e).length !== Object.keys(t).length)
    return !1;
  for (const r in e)
    if (e[r] !== t[r])
      return !1;
  return !0;
}
function sc(e) {
  return Array.isArray(e) && e.length === Object.keys(e).length;
}
function Ts(e) {
  if (!ac(e))
    return !1;
  const t = e.constructor;
  if (t === void 0)
    return !0;
  const r = t.prototype;
  return !(!ac(r) || !r.hasOwnProperty("isPrototypeOf") || Object.getPrototypeOf(e) !== Object.prototype);
}
function ac(e) {
  return Object.prototype.toString.call(e) === "[object Object]";
}
function Km(e) {
  return new Promise((t) => {
    Sr.setTimeout(t, e);
  });
}
function Fs(e, t, r) {
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
var Ba = /* @__PURE__ */ Symbol();
function Xf(e, t) {
  return !e.queryFn && t?.initialPromise ? () => t.initialPromise : !e.queryFn || e.queryFn === Ba ? () => Promise.reject(new Error(`Missing queryFn: '${e.queryHash}'`)) : e.queryFn;
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
function Os() {
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
var ve = Zm(), pn, Kt, hn, _c, Jm = (_c = class extends Do {
  constructor() {
    super();
    F(this, pn, !0);
    F(this, Kt);
    F(this, hn);
    N(this, hn, (t) => {
      if (typeof window < "u" && window.addEventListener) {
        const r = () => t(!0), n = () => t(!1);
        return window.addEventListener("online", r, !1), window.addEventListener("offline", n, !1), () => {
          window.removeEventListener("online", r), window.removeEventListener("offline", n);
        };
      }
    });
  }
  onSubscribe() {
    f(this, Kt) || this.setEventListener(f(this, hn));
  }
  onUnsubscribe() {
    var t;
    this.hasListeners() || ((t = f(this, Kt)) == null || t.call(this), N(this, Kt, void 0));
  }
  setEventListener(t) {
    var r;
    N(this, hn, t), (r = f(this, Kt)) == null || r.call(this), N(this, Kt, t(this.setOnline.bind(this)));
  }
  setOnline(t) {
    f(this, pn) !== t && (N(this, pn, t), this.listeners.forEach((n) => {
      n(t);
    }));
  }
  isOnline() {
    return f(this, pn);
  }
}, pn = new WeakMap(), Kt = new WeakMap(), hn = new WeakMap(), _c), Ki = new Jm();
function eg(e) {
  return Math.min(1e3 * 2 ** e, 3e4);
}
function Jf(e) {
  return (e ?? "online") === "online" ? Ki.isOnline() : !0;
}
var Ls = class extends Error {
  constructor(e) {
    super("CancelledError"), this.revert = e?.revert, this.silent = e?.silent;
  }
};
function ep(e) {
  let t = !1, r = 0, n;
  const o = Os(), i = () => o.status !== "pending", l = (w) => {
    if (!i()) {
      const C = new Ls(w);
      g(C), e.onCancel?.(C);
    }
  }, s = () => {
    t = !0;
  }, a = () => {
    t = !1;
  }, u = () => Ua.isFocused() && (e.networkMode === "always" || Ki.isOnline()) && e.canRun(), h = () => Jf(e.networkMode) && e.canRun(), v = (w) => {
    i() || (n?.(), o.resolve(w));
  }, g = (w) => {
    i() || (n?.(), o.reject(w));
  }, y = () => new Promise((w) => {
    n = (C) => {
      (i() || u()) && w(C);
    }, e.onPause?.();
  }).then(() => {
    n = void 0, i() || e.onContinue?.();
  }), x = () => {
    if (i())
      return;
    let w;
    const C = r === 0 ? e.initialPromise : void 0;
    try {
      w = C ?? e.fn();
    } catch (p) {
      w = Promise.reject(p);
    }
    Promise.resolve(w).then(v).catch((p) => {
      if (i())
        return;
      const d = e.retry ?? (_o.isServer() ? 0 : 3), m = e.retryDelay ?? eg, k = typeof m == "function" ? m(r, p) : m, S = d === !0 || typeof d == "number" && r < d || typeof d == "function" && d(r, p);
      if (t || !S) {
        g(p);
        return;
      }
      r++, e.onFail?.(r, p), Km(k).then(() => u() ? void 0 : y()).then(() => {
        t ? g(p) : x();
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
    canStart: h,
    start: () => (h() ? x() : y().then(x), o)
  };
}
var Er, Pc, tp = (Pc = class {
  constructor() {
    F(this, Er);
  }
  destroy() {
    this.clearGcTimeout();
  }
  scheduleGc() {
    this.clearGcTimeout(), Ms(this.gcTime) && N(this, Er, Sr.setTimeout(() => {
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
    f(this, Er) !== void 0 && (Sr.clearTimeout(f(this, Er)), N(this, Er, void 0));
  }
}, Er = new WeakMap(), Pc);
function tg(e) {
  return {
    onFetch: (t, r) => {
      const n = t.options, o = t.fetchOptions?.meta?.fetchMore?.direction, i = t.state.data?.pages || [], l = t.state.data?.pageParams || [];
      let s = { pages: [], pageParams: [] }, a = 0;
      const u = async () => {
        let h = !1;
        const v = (x) => {
          Ym(
            x,
            () => t.signal,
            () => h = !0
          );
        }, g = Xf(t.options, t.fetchOptions), y = async (x, w, C) => {
          if (h)
            return Promise.reject(t.signal.reason);
          if (w == null && x.pages.length)
            return Promise.resolve(x);
          const d = (() => {
            const _ = {
              client: t.client,
              queryKey: t.queryKey,
              pageParam: w,
              direction: C ? "backward" : "forward",
              meta: t.options.meta
            };
            return v(_), _;
          })(), m = await g(d), { maxPages: k } = t.options, S = C ? qm : Gm;
          return {
            pages: S(x.pages, m, k),
            pageParams: S(x.pageParams, w, k)
          };
        };
        if (o && i.length) {
          const x = o === "backward", w = x ? rg : uc, C = {
            pages: i,
            pageParams: l
          }, p = w(n, C);
          s = await y(C, p, x);
        } else {
          const x = e ?? i.length;
          do {
            const w = a === 0 ? l[0] ?? n.initialPageParam : uc(n, s);
            if (a > 0 && w == null)
              break;
            s = await y(s, w), a++;
          } while (a < x);
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
function uc(e, { pages: t, pageParams: r }) {
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
var mn, jr, gn, Ye, Nr, fe, Po, _r, Qe, rp, St, zc, ng = (zc = class extends tp {
  constructor(t) {
    super();
    F(this, Qe);
    F(this, mn);
    F(this, jr);
    F(this, gn);
    F(this, Ye);
    F(this, Nr);
    F(this, fe);
    F(this, Po);
    F(this, _r);
    N(this, _r, !1), N(this, Po, t.defaultOptions), this.setOptions(t.options), this.observers = [], N(this, Nr, t.client), N(this, Ye, f(this, Nr).getQueryCache()), this.queryKey = t.queryKey, this.queryHash = t.queryHash, N(this, jr, dc(this.options)), this.state = t.state ?? f(this, jr), this.scheduleGc();
  }
  get meta() {
    return this.options.meta;
  }
  get queryType() {
    return f(this, mn);
  }
  get promise() {
    return f(this, fe)?.promise;
  }
  setOptions(t) {
    if (this.options = { ...f(this, Po), ...t }, t?._type && N(this, mn, t._type), this.updateGcTime(this.options.gcTime), this.state && this.state.data === void 0) {
      const r = dc(this.options);
      r.data !== void 0 && (this.setState(
        cc(r.data, r.dataUpdatedAt)
      ), N(this, jr, r));
    }
  }
  optionalRemove() {
    !this.observers.length && this.state.fetchStatus === "idle" && f(this, Ye).remove(this);
  }
  setData(t, r) {
    const n = Fs(this.state.data, t, this.options);
    return A(this, Qe, St).call(this, {
      data: n,
      type: "success",
      dataUpdatedAt: r?.updatedAt,
      manual: r?.manual
    }), n;
  }
  setState(t) {
    A(this, Qe, St).call(this, { type: "setState", state: t });
  }
  cancel(t) {
    const r = f(this, fe)?.promise;
    return f(this, fe)?.cancel(t), r ? r.then(Fe).catch(Fe) : Promise.resolve();
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
      (t) => Be(t.options.enabled, this) !== !1
    );
  }
  isDisabled() {
    return this.getObserversCount() > 0 ? !this.isActive() : this.options.queryFn === Ba || !this.isFetched();
  }
  isFetched() {
    return this.state.dataUpdateCount + this.state.errorUpdateCount > 0;
  }
  isStatic() {
    return this.getObserversCount() > 0 ? this.observers.some(
      (t) => ur(t.options.staleTime, this) === "static"
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
    this.observers.includes(t) || (this.observers.push(t), this.clearGcTimeout(), f(this, Ye).notify({ type: "observerAdded", query: this, observer: t }));
  }
  removeObserver(t) {
    this.observers.includes(t) && (this.observers = this.observers.filter((r) => r !== t), this.observers.length || (f(this, fe) && (f(this, _r) || A(this, Qe, rp).call(this) ? f(this, fe).cancel({ revert: !0 }) : f(this, fe).cancelRetry()), this.scheduleGc()), f(this, Ye).notify({ type: "observerRemoved", query: this, observer: t }));
  }
  getObserversCount() {
    return this.observers.length;
  }
  invalidate() {
    this.state.isInvalidated || A(this, Qe, St).call(this, { type: "invalidate" });
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
      const u = this.observers.find((h) => h.options.queryFn);
      u && this.setOptions(u.options);
    }
    const n = new AbortController(), o = (u) => {
      Object.defineProperty(u, "signal", {
        enumerable: !0,
        get: () => (N(this, _r, !0), n.signal)
      });
    }, i = () => {
      const u = Xf(this.options, r), v = (() => {
        const g = {
          client: f(this, Nr),
          queryKey: this.queryKey,
          meta: this.meta
        };
        return o(g), g;
      })();
      return N(this, _r, !1), this.options.persister ? this.options.persister(
        u,
        v,
        this
      ) : u(v);
    }, s = (() => {
      const u = {
        fetchOptions: r,
        options: this.options,
        queryKey: this.queryKey,
        client: f(this, Nr),
        state: this.state,
        fetchFn: i
      };
      return o(u), u;
    })();
    (f(this, mn) === "infinite" ? tg(
      this.options.pages
    ) : this.options.behavior)?.onFetch(s, this), N(this, gn, this.state), (this.state.fetchStatus === "idle" || this.state.fetchMeta !== s.fetchOptions?.meta) && A(this, Qe, St).call(this, { type: "fetch", meta: s.fetchOptions?.meta }), N(this, fe, ep({
      initialPromise: r?.initialPromise,
      fn: s.fetchFn,
      onCancel: (u) => {
        u instanceof Ls && u.revert && this.setState({
          ...f(this, gn),
          fetchStatus: "idle"
        }), n.abort();
      },
      onFail: (u, h) => {
        A(this, Qe, St).call(this, { type: "failed", failureCount: u, error: h });
      },
      onPause: () => {
        A(this, Qe, St).call(this, { type: "pause" });
      },
      onContinue: () => {
        A(this, Qe, St).call(this, { type: "continue" });
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
      return this.setData(u), f(this, Ye).config.onSuccess?.(u, this), f(this, Ye).config.onSettled?.(
        u,
        this.state.error,
        this
      ), u;
    } catch (u) {
      if (u instanceof Ls) {
        if (u.silent)
          return f(this, fe).promise;
        if (u.revert) {
          if (this.state.data === void 0)
            throw u;
          return this.state.data;
        }
      }
      throw A(this, Qe, St).call(this, {
        type: "error",
        error: u
      }), f(this, Ye).config.onError?.(
        u,
        this
      ), f(this, Ye).config.onSettled?.(
        this.state.data,
        u,
        this
      ), u;
    } finally {
      this.scheduleGc();
    }
  }
}, mn = new WeakMap(), jr = new WeakMap(), gn = new WeakMap(), Ye = new WeakMap(), Nr = new WeakMap(), fe = new WeakMap(), Po = new WeakMap(), _r = new WeakMap(), Qe = new WeakSet(), rp = function() {
  return this.state.fetchStatus === "paused" && this.state.status === "pending";
}, St = function(t) {
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
          ...cc(t.data, t.dataUpdatedAt),
          dataUpdateCount: n.dataUpdateCount + 1,
          ...!t.manual && {
            fetchStatus: "idle",
            fetchFailureCount: 0,
            fetchFailureReason: null
          }
        };
        return N(this, gn, t.manual ? o : void 0), o;
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
    }), f(this, Ye).notify({ query: this, type: "updated", action: t });
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
function cc(e, t) {
  return {
    data: e,
    dataUpdatedAt: t ?? Date.now(),
    error: null,
    isInvalidated: !1,
    status: "success"
  };
}
function dc(e) {
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
var Te, Q, zo, je, Pr, vn, jt, Gt, Mo, yn, xn, zr, Mr, qt, wn, V, Zn, Is, $s, Ds, As, Us, Qs, Bs, op, Mc, og = (Mc = class extends Do {
  constructor(t, r) {
    super();
    F(this, V);
    F(this, Te);
    F(this, Q);
    F(this, zo);
    F(this, je);
    F(this, Pr);
    F(this, vn);
    F(this, jt);
    F(this, Gt);
    F(this, Mo);
    F(this, yn);
    // This property keeps track of the last query with defined data.
    // It will be used to pass the previous data and query to the placeholder function between renders.
    F(this, xn);
    F(this, zr);
    F(this, Mr);
    F(this, qt);
    F(this, wn, /* @__PURE__ */ new Set());
    this.options = r, N(this, Te, t), N(this, Gt, null), N(this, jt, Os()), this.bindMethods(), this.setOptions(r);
  }
  bindMethods() {
    this.refetch = this.refetch.bind(this);
  }
  onSubscribe() {
    this.listeners.size === 1 && (f(this, Q).addObserver(this), fc(f(this, Q), this.options) ? A(this, V, Zn).call(this) : this.updateResult(), A(this, V, As).call(this));
  }
  onUnsubscribe() {
    this.hasListeners() || this.destroy();
  }
  shouldFetchOnReconnect() {
    return Hs(
      f(this, Q),
      this.options,
      this.options.refetchOnReconnect
    );
  }
  shouldFetchOnWindowFocus() {
    return Hs(
      f(this, Q),
      this.options,
      this.options.refetchOnWindowFocus
    );
  }
  destroy() {
    this.listeners = /* @__PURE__ */ new Set(), A(this, V, Us).call(this), A(this, V, Qs).call(this), f(this, Q).removeObserver(this);
  }
  setOptions(t) {
    const r = this.options, n = f(this, Q);
    if (this.options = f(this, Te).defaultQueryOptions(t), this.options.enabled !== void 0 && typeof this.options.enabled != "boolean" && typeof this.options.enabled != "function" && typeof Be(this.options.enabled, f(this, Q)) != "boolean")
      throw new Error(
        "Expected enabled to be a boolean or a callback that returns a boolean"
      );
    A(this, V, Bs).call(this), f(this, Q).setOptions(this.options), r._defaulted && !Rs(this.options, r) && f(this, Te).getQueryCache().notify({
      type: "observerOptionsUpdated",
      query: f(this, Q),
      observer: this
    });
    const o = this.hasListeners();
    o && pc(
      f(this, Q),
      n,
      this.options,
      r
    ) && A(this, V, Zn).call(this), this.updateResult(), o && (f(this, Q) !== n || Be(this.options.enabled, f(this, Q)) !== Be(r.enabled, f(this, Q)) || ur(this.options.staleTime, f(this, Q)) !== ur(r.staleTime, f(this, Q))) && A(this, V, Is).call(this);
    const i = A(this, V, $s).call(this);
    o && (f(this, Q) !== n || Be(this.options.enabled, f(this, Q)) !== Be(r.enabled, f(this, Q)) || i !== f(this, qt)) && A(this, V, Ds).call(this, i);
  }
  getOptimisticResult(t) {
    const r = f(this, Te).getQueryCache().build(f(this, Te), t), n = this.createResult(r, t);
    return lg(this, n) && (N(this, je, n), N(this, vn, this.options), N(this, Pr, f(this, Q).state)), n;
  }
  getCurrentResult() {
    return f(this, je);
  }
  trackResult(t, r) {
    return new Proxy(t, {
      get: (n, o) => (this.trackProp(o), r?.(o), o === "promise" && (this.trackProp("data"), !this.options.experimental_prefetchInRender && f(this, jt).status === "pending" && f(this, jt).reject(
        new Error(
          "experimental_prefetchInRender feature flag is not enabled"
        )
      )), Reflect.get(n, o))
    });
  }
  trackProp(t) {
    f(this, wn).add(t);
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
    const r = f(this, Te).defaultQueryOptions(t), n = f(this, Te).getQueryCache().build(f(this, Te), r);
    return n.fetch().then(() => this.createResult(n, r));
  }
  fetch(t) {
    return A(this, V, Zn).call(this, {
      ...t,
      cancelRefetch: t.cancelRefetch ?? !0
    }).then(() => (this.updateResult(), f(this, je)));
  }
  createResult(t, r) {
    const n = f(this, Q), o = this.options, i = f(this, je), l = f(this, Pr), s = f(this, vn), u = t !== n ? t.state : f(this, zo), { state: h } = t;
    let v = { ...h }, g = !1, y;
    if (r._optimisticResults) {
      const R = this.hasListeners(), T = !R && fc(t, r), Y = R && pc(t, n, r, o);
      (T || Y) && (v = {
        ...v,
        ...np(h.data, t.options)
      }), r._optimisticResults === "isRestoring" && (v.fetchStatus = "idle");
    }
    let { error: x, errorUpdatedAt: w, status: C } = v;
    y = v.data;
    let p = !1;
    if (r.placeholderData !== void 0 && y === void 0 && C === "pending") {
      let R;
      i?.isPlaceholderData && r.placeholderData === s?.placeholderData ? (R = i.data, p = !0) : R = typeof r.placeholderData == "function" ? r.placeholderData(
        f(this, xn)?.state.data,
        f(this, xn)
      ) : r.placeholderData, R !== void 0 && (C = "success", y = Fs(
        i?.data,
        R,
        r
      ), g = !0);
    }
    if (r.select && y !== void 0 && !p)
      if (i && y === l?.data && r.select === f(this, Mo))
        y = f(this, yn);
      else
        try {
          N(this, Mo, r.select), y = r.select(y), y = Fs(i?.data, y, r), N(this, yn, y), N(this, Gt, null);
        } catch (R) {
          N(this, Gt, R);
        }
    f(this, Gt) && (x = f(this, Gt), y = f(this, yn), w = Date.now(), C = "error");
    const d = v.fetchStatus === "fetching", m = C === "pending", k = C === "error", S = m && d, _ = y !== void 0, P = {
      status: C,
      fetchStatus: v.fetchStatus,
      isPending: m,
      isSuccess: C === "success",
      isError: k,
      isInitialLoading: S,
      isLoading: S,
      data: y,
      dataUpdatedAt: v.dataUpdatedAt,
      error: x,
      errorUpdatedAt: w,
      failureCount: v.fetchFailureCount,
      failureReason: v.fetchFailureReason,
      errorUpdateCount: v.errorUpdateCount,
      isFetched: t.isFetched(),
      isFetchedAfterMount: v.dataUpdateCount > u.dataUpdateCount || v.errorUpdateCount > u.errorUpdateCount,
      isFetching: d,
      isRefetching: d && !m,
      isLoadingError: k && !_,
      isPaused: v.fetchStatus === "paused",
      isPlaceholderData: g,
      isRefetchError: k && _,
      isStale: Ha(t, r),
      refetch: this.refetch,
      promise: f(this, jt),
      isEnabled: Be(r.enabled, t) !== !1
    };
    if (this.options.experimental_prefetchInRender) {
      const R = P.data !== void 0, T = P.status === "error" && !R, Y = (Me) => {
        T ? Me.reject(P.error) : R && Me.resolve(P.data);
      }, U = () => {
        const Me = N(this, jt, P.promise = Os());
        Y(Me);
      }, Ee = f(this, jt);
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
    const t = f(this, je), r = this.createResult(f(this, Q), this.options);
    if (N(this, Pr, f(this, Q).state), N(this, vn, this.options), f(this, Pr).data !== void 0 && N(this, xn, f(this, Q)), Rs(r, t))
      return;
    N(this, je, r);
    const n = () => {
      if (!t)
        return !0;
      const { notifyOnChangeProps: o } = this.options, i = typeof o == "function" ? o() : o;
      if (i === "all" || !i && !f(this, wn).size)
        return !0;
      const l = new Set(
        i ?? f(this, wn)
      );
      return this.options.throwOnError && l.add("error"), Object.keys(f(this, je)).some((s) => {
        const a = s;
        return f(this, je)[a] !== t[a] && l.has(a);
      });
    };
    A(this, V, op).call(this, { listeners: n() });
  }
  onQueryUpdate() {
    this.updateResult(), this.hasListeners() && A(this, V, As).call(this);
  }
}, Te = new WeakMap(), Q = new WeakMap(), zo = new WeakMap(), je = new WeakMap(), Pr = new WeakMap(), vn = new WeakMap(), jt = new WeakMap(), Gt = new WeakMap(), Mo = new WeakMap(), yn = new WeakMap(), xn = new WeakMap(), zr = new WeakMap(), Mr = new WeakMap(), qt = new WeakMap(), wn = new WeakMap(), V = new WeakSet(), Zn = function(t) {
  A(this, V, Bs).call(this);
  let r = f(this, Q).fetch(
    this.options,
    t
  );
  return t?.throwOnError || (r = r.catch(Fe)), r;
}, Is = function() {
  A(this, V, Us).call(this);
  const t = ur(
    this.options.staleTime,
    f(this, Q)
  );
  if (_o.isServer() || f(this, je).isStale || !Ms(t))
    return;
  const n = qf(f(this, je).dataUpdatedAt, t) + 1;
  N(this, zr, Sr.setTimeout(() => {
    f(this, je).isStale || this.updateResult();
  }, n));
}, $s = function() {
  return (typeof this.options.refetchInterval == "function" ? this.options.refetchInterval(f(this, Q)) : this.options.refetchInterval) ?? !1;
}, Ds = function(t) {
  A(this, V, Qs).call(this), N(this, qt, t), !(_o.isServer() || Be(this.options.enabled, f(this, Q)) === !1 || !Ms(f(this, qt)) || f(this, qt) === 0) && N(this, Mr, Sr.setInterval(() => {
    (this.options.refetchIntervalInBackground || Ua.isFocused()) && A(this, V, Zn).call(this);
  }, f(this, qt)));
}, As = function() {
  A(this, V, Is).call(this), A(this, V, Ds).call(this, A(this, V, $s).call(this));
}, Us = function() {
  f(this, zr) !== void 0 && (Sr.clearTimeout(f(this, zr)), N(this, zr, void 0));
}, Qs = function() {
  f(this, Mr) !== void 0 && (Sr.clearInterval(f(this, Mr)), N(this, Mr, void 0));
}, Bs = function() {
  const t = f(this, Te).getQueryCache().build(f(this, Te), this.options);
  if (t === f(this, Q))
    return;
  const r = f(this, Q);
  N(this, Q, t), N(this, zo, t.state), this.hasListeners() && (r?.removeObserver(this), t.addObserver(this));
}, op = function(t) {
  ve.batch(() => {
    t.listeners && this.listeners.forEach((r) => {
      r(f(this, je));
    }), f(this, Te).getQueryCache().notify({
      query: f(this, Q),
      type: "observerResultsUpdated"
    });
  });
}, Mc);
function ig(e, t) {
  return Be(t.enabled, e) !== !1 && e.state.data === void 0 && !(e.state.status === "error" && Be(t.retryOnMount, e) === !1);
}
function fc(e, t) {
  return ig(e, t) || e.state.data !== void 0 && Hs(e, t, t.refetchOnMount);
}
function Hs(e, t, r) {
  if (Be(t.enabled, e) !== !1 && ur(t.staleTime, e) !== "static") {
    const n = typeof r == "function" ? r(e) : r;
    return n === "always" || n !== !1 && Ha(e, t);
  }
  return !1;
}
function pc(e, t, r, n) {
  return (e !== t || Be(n.enabled, e) === !1) && (!r.suspense || e.state.status !== "error") && Ha(e, r);
}
function Ha(e, t) {
  return Be(t.enabled, e) !== !1 && e.isStaleByTime(ur(t.staleTime, e));
}
function lg(e, t) {
  return !Rs(e.getCurrentResult(), t);
}
var Ro, ht, be, Rr, mt, At, Rc, sg = (Rc = class extends tp {
  constructor(t) {
    super();
    F(this, mt);
    F(this, Ro);
    F(this, ht);
    F(this, be);
    F(this, Rr);
    N(this, Ro, t.client), this.mutationId = t.mutationId, N(this, be, t.mutationCache), N(this, ht, []), this.state = t.state || ag(), this.setOptions(t.options), this.scheduleGc();
  }
  setOptions(t) {
    this.options = t, this.updateGcTime(this.options.gcTime);
  }
  get meta() {
    return this.options.meta;
  }
  addObserver(t) {
    f(this, ht).includes(t) || (f(this, ht).push(t), this.clearGcTimeout(), f(this, be).notify({
      type: "observerAdded",
      mutation: this,
      observer: t
    }));
  }
  removeObserver(t) {
    N(this, ht, f(this, ht).filter((r) => r !== t)), this.scheduleGc(), f(this, be).notify({
      type: "observerRemoved",
      mutation: this,
      observer: t
    });
  }
  optionalRemove() {
    f(this, ht).length || (this.state.status === "pending" ? this.scheduleGc() : f(this, be).remove(this));
  }
  continue() {
    return f(this, Rr)?.continue() ?? // continuing a mutation assumes that variables are set, mutation must have been dehydrated before
    this.execute(this.state.variables);
  }
  async execute(t) {
    const r = () => {
      A(this, mt, At).call(this, { type: "continue" });
    }, n = {
      client: f(this, Ro),
      meta: this.options.meta,
      mutationKey: this.options.mutationKey
    };
    N(this, Rr, ep({
      fn: () => this.options.mutationFn ? this.options.mutationFn(t, n) : Promise.reject(new Error("No mutationFn found")),
      onFail: (l, s) => {
        A(this, mt, At).call(this, { type: "failed", failureCount: l, error: s });
      },
      onPause: () => {
        A(this, mt, At).call(this, { type: "pause" });
      },
      onContinue: r,
      retry: this.options.retry ?? 0,
      retryDelay: this.options.retryDelay,
      networkMode: this.options.networkMode,
      canRun: () => f(this, be).canRun(this)
    }));
    const o = this.state.status === "pending", i = !f(this, Rr).canStart();
    try {
      if (o)
        r();
      else {
        A(this, mt, At).call(this, { type: "pending", variables: t, isPaused: i }), f(this, be).config.onMutate && await f(this, be).config.onMutate(
          t,
          this,
          n
        );
        const s = await this.options.onMutate?.(
          t,
          n
        );
        s !== this.state.context && A(this, mt, At).call(this, {
          type: "pending",
          context: s,
          variables: t,
          isPaused: i
        });
      }
      const l = await f(this, Rr).start();
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
      ), A(this, mt, At).call(this, { type: "success", data: l }), l;
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
      throw A(this, mt, At).call(this, { type: "error", error: l }), l;
    } finally {
      f(this, be).runNext(this);
    }
  }
}, Ro = new WeakMap(), ht = new WeakMap(), be = new WeakMap(), Rr = new WeakMap(), mt = new WeakSet(), At = function(t) {
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
    f(this, ht).forEach((n) => {
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
var Nt, it, To, Tc, ug = (Tc = class extends Do {
  constructor(t = {}) {
    super();
    F(this, Nt);
    F(this, it);
    F(this, To);
    this.config = t, N(this, Nt, /* @__PURE__ */ new Set()), N(this, it, /* @__PURE__ */ new Map()), N(this, To, 0);
  }
  build(t, r, n) {
    const o = new sg({
      client: t,
      mutationCache: this,
      mutationId: ++Qo(this, To)._,
      options: t.defaultMutationOptions(r),
      state: n
    });
    return this.add(o), o;
  }
  add(t) {
    f(this, Nt).add(t);
    const r = li(t);
    if (typeof r == "string") {
      const n = f(this, it).get(r);
      n ? n.push(t) : f(this, it).set(r, [t]);
    }
    this.notify({ type: "added", mutation: t });
  }
  remove(t) {
    if (f(this, Nt).delete(t)) {
      const r = li(t);
      if (typeof r == "string") {
        const n = f(this, it).get(r);
        if (n)
          if (n.length > 1) {
            const o = n.indexOf(t);
            o !== -1 && n.splice(o, 1);
          } else n[0] === t && f(this, it).delete(r);
      }
    }
    this.notify({ type: "removed", mutation: t });
  }
  canRun(t) {
    const r = li(t);
    if (typeof r == "string") {
      const o = f(this, it).get(r)?.find(
        (i) => i.state.status === "pending"
      );
      return !o || o === t;
    } else
      return !0;
  }
  runNext(t) {
    const r = li(t);
    return typeof r == "string" ? f(this, it).get(r)?.find((o) => o !== t && o.state.isPaused)?.continue() ?? Promise.resolve() : Promise.resolve();
  }
  clear() {
    ve.batch(() => {
      f(this, Nt).forEach((t) => {
        this.notify({ type: "removed", mutation: t });
      }), f(this, Nt).clear(), f(this, it).clear();
    });
  }
  getAll() {
    return Array.from(f(this, Nt));
  }
  find(t) {
    const r = { exact: !0, ...t };
    return this.getAll().find(
      (n) => lc(r, n)
    );
  }
  findAll(t = {}) {
    return this.getAll().filter((r) => lc(t, r));
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
        t.map((r) => r.continue().catch(Fe))
      )
    );
  }
}, Nt = new WeakMap(), it = new WeakMap(), To = new WeakMap(), Tc);
function li(e) {
  return e.options.scope?.id;
}
var gt, Fc, cg = (Fc = class extends Do {
  constructor(t = {}) {
    super();
    F(this, gt);
    this.config = t, N(this, gt, /* @__PURE__ */ new Map());
  }
  build(t, r, n) {
    const o = r.queryKey, i = r.queryHash ?? Qa(o, r);
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
    f(this, gt).has(t.queryHash) || (f(this, gt).set(t.queryHash, t), this.notify({
      type: "added",
      query: t
    }));
  }
  remove(t) {
    const r = f(this, gt).get(t.queryHash);
    r && (t.destroy(), r === t && f(this, gt).delete(t.queryHash), this.notify({ type: "removed", query: t }));
  }
  clear() {
    ve.batch(() => {
      this.getAll().forEach((t) => {
        this.remove(t);
      });
    });
  }
  get(t) {
    return f(this, gt).get(t);
  }
  getAll() {
    return [...f(this, gt).values()];
  }
  find(t) {
    const r = { exact: !0, ...t };
    return this.getAll().find(
      (n) => ic(r, n)
    );
  }
  findAll(t = {}) {
    const r = this.getAll();
    return Object.keys(t).length > 0 ? r.filter((n) => ic(t, n)) : r;
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
}, gt = new WeakMap(), Fc), ie, Yt, Xt, kn, bn, Zt, Sn, Cn, Oc, dg = (Oc = class {
  constructor(e = {}) {
    F(this, ie);
    F(this, Yt);
    F(this, Xt);
    F(this, kn);
    F(this, bn);
    F(this, Zt);
    F(this, Sn);
    F(this, Cn);
    N(this, ie, e.queryCache || new cg()), N(this, Yt, e.mutationCache || new ug()), N(this, Xt, e.defaultOptions || {}), N(this, kn, /* @__PURE__ */ new Map()), N(this, bn, /* @__PURE__ */ new Map()), N(this, Zt, 0);
  }
  mount() {
    Qo(this, Zt)._++, f(this, Zt) === 1 && (N(this, Sn, Ua.subscribe(async (e) => {
      e && (await this.resumePausedMutations(), f(this, ie).onFocus());
    })), N(this, Cn, Ki.subscribe(async (e) => {
      e && (await this.resumePausedMutations(), f(this, ie).onOnline());
    })));
  }
  unmount() {
    var e, t;
    Qo(this, Zt)._--, f(this, Zt) === 0 && ((e = f(this, Sn)) == null || e.call(this), N(this, Sn, void 0), (t = f(this, Cn)) == null || t.call(this), N(this, Cn, void 0));
  }
  isFetching(e) {
    return f(this, ie).findAll({ ...e, fetchStatus: "fetching" }).length;
  }
  isMutating(e) {
    return f(this, Yt).findAll({ ...e, status: "pending" }).length;
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
    return n === void 0 ? this.fetchQuery(e) : (e.revalidateIfStale && r.isStaleByTime(ur(t.staleTime, r)) && this.prefetchQuery(t), Promise.resolve(n));
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
    return Promise.all(n).then(Fe).catch(Fe);
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
        return r.throwOnError || (i = i.catch(Fe)), o.state.fetchStatus === "paused" ? Promise.resolve() : i;
      })
    );
    return Promise.all(n).then(Fe);
  }
  fetchQuery(e) {
    const t = this.defaultQueryOptions(e);
    t.retry === void 0 && (t.retry = !1);
    const r = f(this, ie).build(this, t);
    return r.isStaleByTime(
      ur(t.staleTime, r)
    ) ? r.fetch(t) : Promise.resolve(r.state.data);
  }
  prefetchQuery(e) {
    return this.fetchQuery(e).then(Fe).catch(Fe);
  }
  fetchInfiniteQuery(e) {
    return e._type = "infinite", this.fetchQuery(e);
  }
  prefetchInfiniteQuery(e) {
    return this.fetchInfiniteQuery(e).then(Fe).catch(Fe);
  }
  ensureInfiniteQueryData(e) {
    return e._type = "infinite", this.ensureQueryData(e);
  }
  resumePausedMutations() {
    return Ki.isOnline() ? f(this, Yt).resumePausedMutations() : Promise.resolve();
  }
  getQueryCache() {
    return f(this, ie);
  }
  getMutationCache() {
    return f(this, Yt);
  }
  getDefaultOptions() {
    return f(this, Xt);
  }
  setDefaultOptions(e) {
    N(this, Xt, e);
  }
  setQueryDefaults(e, t) {
    f(this, kn).set(jo(e), {
      queryKey: e,
      defaultOptions: t
    });
  }
  getQueryDefaults(e) {
    const t = [...f(this, kn).values()], r = {};
    return t.forEach((n) => {
      No(e, n.queryKey) && Object.assign(r, n.defaultOptions);
    }), r;
  }
  setMutationDefaults(e, t) {
    f(this, bn).set(jo(e), {
      mutationKey: e,
      defaultOptions: t
    });
  }
  getMutationDefaults(e) {
    const t = [...f(this, bn).values()], r = {};
    return t.forEach((n) => {
      No(e, n.mutationKey) && Object.assign(r, n.defaultOptions);
    }), r;
  }
  defaultQueryOptions(e) {
    if (e._defaulted)
      return e;
    const t = {
      ...f(this, Xt).queries,
      ...this.getQueryDefaults(e.queryKey),
      ...e,
      _defaulted: !0
    };
    return t.queryHash || (t.queryHash = Qa(
      t.queryKey,
      t
    )), t.refetchOnReconnect === void 0 && (t.refetchOnReconnect = t.networkMode !== "always"), t.throwOnError === void 0 && (t.throwOnError = !!t.suspense), !t.networkMode && t.persister && (t.networkMode = "offlineFirst"), t.queryFn === Ba && (t.enabled = !1), t;
  }
  defaultMutationOptions(e) {
    return e?._defaulted ? e : {
      ...f(this, Xt).mutations,
      ...e?.mutationKey && this.getMutationDefaults(e.mutationKey),
      ...e,
      _defaulted: !0
    };
  }
  clear() {
    f(this, ie).clear(), f(this, Yt).clear();
  }
}, ie = new WeakMap(), Yt = new WeakMap(), Xt = new WeakMap(), kn = new WeakMap(), bn = new WeakMap(), Zt = new WeakMap(), Sn = new WeakMap(), Cn = new WeakMap(), Oc), ip = { exports: {} }, ul = {};
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
ul.Fragment = hg;
ul.jsx = lp;
ul.jsxs = lp;
ip.exports = ul;
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
}, jg = ({
  result: e,
  errorResetBoundary: t,
  throwOnError: r,
  query: n,
  suspense: o
}) => e.isError && !t.isReset() && !e.isFetching && n && (o && e.data === void 0 || Zf(r, [e.error, n])), Ng = (e) => {
  if (e.suspense) {
    const r = (o) => o === "static" ? o : Math.max(o ?? 1e3, 1e3), n = e.staleTime;
    e.staleTime = typeof n == "function" ? (...o) => r(n(...o)) : r(n), typeof e.gcTime == "number" && (e.gcTime = Math.max(
      e.gcTime,
      1e3
    ));
  }
}, _g = (e, t) => e.isLoading && e.isFetching && !t, Pg = (e, t) => e?.suspense && t.isPending, hc = (e, t, r) => t.fetchOptimistic(e).catch(() => {
  r.clearReset();
});
function zg(e, t, r) {
  const n = wg(), o = Sg(), i = yg(), l = i.defaultQueryOptions(e);
  i.getDefaultOptions().queries?._experimental_beforeQuery?.(
    l
  );
  const s = i.getQueryCache().get(l.queryHash);
  l._optimisticResults = n ? "isRestoring" : "optimistic", Ng(l), Cg(l, o, s), Eg(o);
  const a = !i.getQueryCache().get(l.queryHash), [u] = I.useState(
    () => new t(
      i,
      l
    )
  ), h = u.getOptimisticResult(l), v = !n && e.subscribed !== !1;
  if (I.useSyncExternalStore(
    I.useCallback(
      (g) => {
        const y = v ? u.subscribe(ve.batchCalls(g)) : Fe;
        return u.updateResult(), y;
      },
      [u, v]
    ),
    () => u.getCurrentResult(),
    () => u.getCurrentResult()
  ), I.useEffect(() => {
    u.setOptions(l);
  }, [l, u]), Pg(l, h))
    throw hc(l, u, o);
  if (jg({
    result: h,
    errorResetBoundary: o,
    throwOnError: l.throwOnError,
    query: s,
    suspense: l.suspense
  }))
    throw h.error;
  return i.getDefaultOptions().queries?._experimental_afterQuery?.(
    l,
    h
  ), l.experimental_prefetchInRender && !_o.isServer() && _g(h, n) && (a ? (
    // Fetch immediately on render in order to ensure `.promise` is resolved even if the component is unmounted
    hc(l, u, o)
  ) : (
    // subscribe to the "cache promise" so that we can finalize the currentThenable once data comes in
    s?.promise
  ))?.catch(Fe).finally(() => {
    u.updateResult();
  }), l.notifyOnChangeProps ? h : u.trackResult(h);
}
function Wa(e, t) {
  return zg(e, og);
}
const Mg = '*,:before,:after{--tw-border-spacing-x: 0;--tw-border-spacing-y: 0;--tw-translate-x: 0;--tw-translate-y: 0;--tw-rotate: 0;--tw-skew-x: 0;--tw-skew-y: 0;--tw-scale-x: 1;--tw-scale-y: 1;--tw-pan-x: ;--tw-pan-y: ;--tw-pinch-zoom: ;--tw-scroll-snap-strictness: proximity;--tw-gradient-from-position: ;--tw-gradient-via-position: ;--tw-gradient-to-position: ;--tw-ordinal: ;--tw-slashed-zero: ;--tw-numeric-figure: ;--tw-numeric-spacing: ;--tw-numeric-fraction: ;--tw-ring-inset: ;--tw-ring-offset-width: 0px;--tw-ring-offset-color: #fff;--tw-ring-color: rgb(59 130 246 / .5);--tw-ring-offset-shadow: 0 0 #0000;--tw-ring-shadow: 0 0 #0000;--tw-shadow: 0 0 #0000;--tw-shadow-colored: 0 0 #0000;--tw-blur: ;--tw-brightness: ;--tw-contrast: ;--tw-grayscale: ;--tw-hue-rotate: ;--tw-invert: ;--tw-saturate: ;--tw-sepia: ;--tw-drop-shadow: ;--tw-backdrop-blur: ;--tw-backdrop-brightness: ;--tw-backdrop-contrast: ;--tw-backdrop-grayscale: ;--tw-backdrop-hue-rotate: ;--tw-backdrop-invert: ;--tw-backdrop-opacity: ;--tw-backdrop-saturate: ;--tw-backdrop-sepia: ;--tw-contain-size: ;--tw-contain-layout: ;--tw-contain-paint: ;--tw-contain-style: }::backdrop{--tw-border-spacing-x: 0;--tw-border-spacing-y: 0;--tw-translate-x: 0;--tw-translate-y: 0;--tw-rotate: 0;--tw-skew-x: 0;--tw-skew-y: 0;--tw-scale-x: 1;--tw-scale-y: 1;--tw-pan-x: ;--tw-pan-y: ;--tw-pinch-zoom: ;--tw-scroll-snap-strictness: proximity;--tw-gradient-from-position: ;--tw-gradient-via-position: ;--tw-gradient-to-position: ;--tw-ordinal: ;--tw-slashed-zero: ;--tw-numeric-figure: ;--tw-numeric-spacing: ;--tw-numeric-fraction: ;--tw-ring-inset: ;--tw-ring-offset-width: 0px;--tw-ring-offset-color: #fff;--tw-ring-color: rgb(59 130 246 / .5);--tw-ring-offset-shadow: 0 0 #0000;--tw-ring-shadow: 0 0 #0000;--tw-shadow: 0 0 #0000;--tw-shadow-colored: 0 0 #0000;--tw-blur: ;--tw-brightness: ;--tw-contrast: ;--tw-grayscale: ;--tw-hue-rotate: ;--tw-invert: ;--tw-saturate: ;--tw-sepia: ;--tw-drop-shadow: ;--tw-backdrop-blur: ;--tw-backdrop-brightness: ;--tw-backdrop-contrast: ;--tw-backdrop-grayscale: ;--tw-backdrop-hue-rotate: ;--tw-backdrop-invert: ;--tw-backdrop-opacity: ;--tw-backdrop-saturate: ;--tw-backdrop-sepia: ;--tw-contain-size: ;--tw-contain-layout: ;--tw-contain-paint: ;--tw-contain-style: }*,:before,:after{box-sizing:border-box;border-width:0;border-style:solid;border-color:#e5e7eb}:before,:after{--tw-content: ""}html,:host{line-height:1.5;-webkit-text-size-adjust:100%;-moz-tab-size:4;-o-tab-size:4;tab-size:4;font-family:Inter,HarmonyOS Sans SC,PingFang SC,system-ui,sans-serif;font-feature-settings:normal;font-variation-settings:normal;-webkit-tap-highlight-color:transparent}body{margin:0;line-height:inherit}hr{height:0;color:inherit;border-top-width:1px}abbr:where([title]){-webkit-text-decoration:underline dotted;text-decoration:underline dotted}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}a{color:inherit;text-decoration:inherit}b,strong{font-weight:bolder}code,kbd,samp,pre{font-family:JetBrains Mono,IBM Plex Mono,ui-monospace,monospace;font-feature-settings:normal;font-variation-settings:normal;font-size:1em}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-.25em}sup{top:-.5em}table{text-indent:0;border-color:inherit;border-collapse:collapse}button,input,optgroup,select,textarea{font-family:inherit;font-feature-settings:inherit;font-variation-settings:inherit;font-size:100%;font-weight:inherit;line-height:inherit;letter-spacing:inherit;color:inherit;margin:0;padding:0}button,select{text-transform:none}button,input:where([type=button]),input:where([type=reset]),input:where([type=submit]){-webkit-appearance:button;background-color:transparent;background-image:none}:-moz-focusring{outline:auto}:-moz-ui-invalid{box-shadow:none}progress{vertical-align:baseline}::-webkit-inner-spin-button,::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}summary{display:list-item}blockquote,dl,dd,h1,h2,h3,h4,h5,h6,hr,figure,p,pre{margin:0}fieldset{margin:0;padding:0}legend{padding:0}ol,ul,menu{list-style:none;margin:0;padding:0}dialog{padding:0}textarea{resize:vertical}input::-moz-placeholder,textarea::-moz-placeholder{opacity:1;color:#9ca3af}input::placeholder,textarea::placeholder{opacity:1;color:#9ca3af}button,[role=button]{cursor:pointer}:disabled{cursor:default}img,svg,video,canvas,audio,iframe,embed,object{display:block;vertical-align:middle}img,video{max-width:100%;height:auto}[hidden]:where(:not([hidden=until-found])){display:none}.container{width:100%;margin-right:auto;margin-left:auto;padding-right:1rem;padding-left:1rem}@media (min-width: 640px){.container{max-width:640px}}@media (min-width: 768px){.container{max-width:768px}}@media (min-width: 1024px){.container{max-width:1024px}}@media (min-width: 1280px){.container{max-width:1280px}}@media (min-width: 1536px){.container{max-width:1536px}}.pointer-events-none{pointer-events:none}.visible{visibility:visible}.fixed{position:fixed}.absolute{position:absolute}.relative{position:relative}.sticky{position:sticky}.left-0{left:0}.top-0{top:0}.z-10{z-index:10}.z-\\[70\\]{z-index:70}.mb-1{margin-bottom:.25rem}.mb-1\\.5{margin-bottom:.375rem}.mb-2{margin-bottom:.5rem}.mr-0\\.5{margin-right:.125rem}.mt-0\\.5{margin-top:.125rem}.mt-1{margin-top:.25rem}.mt-2{margin-top:.5rem}.mt-auto{margin-top:auto}.block{display:block}.inline{display:inline}.flex{display:flex}.inline-flex{display:inline-flex}.table{display:table}.grid{display:grid}.hidden{display:none}.h-1{height:.25rem}.h-1\\.5{height:.375rem}.h-2\\.5{height:.625rem}.h-24{height:6rem}.h-3{height:.75rem}.h-3\\.5{height:.875rem}.h-4{height:1rem}.h-full{height:100%}.max-h-\\[15rem\\]{max-height:15rem}.max-h-\\[22rem\\]{max-height:22rem}.max-h-\\[34rem\\]{max-height:34rem}.min-h-0{min-height:0px}.min-h-\\[5\\.5rem\\]{min-height:5.5rem}.min-h-\\[9rem\\]{min-height:9rem}.w-0\\.5{width:.125rem}.w-1{width:.25rem}.w-12{width:3rem}.w-2{width:.5rem}.w-2\\.5{width:.625rem}.w-3{width:.75rem}.w-3\\.5{width:.875rem}.w-4{width:1rem}.w-fit{width:-moz-fit-content;width:fit-content}.w-full{width:100%}.min-w-0{min-width:0px}.min-w-\\[180px\\]{min-width:180px}.min-w-\\[74px\\]{min-width:74px}.min-w-max{min-width:-moz-max-content;min-width:max-content}.max-w-\\[4\\.5rem\\]{max-width:4.5rem}.max-w-\\[6rem\\]{max-width:6rem}.max-w-full{max-width:100%}.flex-1{flex:1 1 0%}.shrink-0{flex-shrink:0}.border-collapse{border-collapse:collapse}@keyframes spin{to{transform:rotate(360deg)}}.animate-spin{animation:spin 1s linear infinite}.cursor-pointer{cursor:pointer}.appearance-none{-webkit-appearance:none;-moz-appearance:none;appearance:none}.auto-rows-fr{grid-auto-rows:minmax(0,1fr)}.grid-cols-1{grid-template-columns:repeat(1,minmax(0,1fr))}.grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}.grid-cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}.grid-cols-4{grid-template-columns:repeat(4,minmax(0,1fr))}.grid-cols-6{grid-template-columns:repeat(6,minmax(0,1fr))}.grid-cols-8{grid-template-columns:repeat(8,minmax(0,1fr))}.grid-cols-\\[1fr_auto\\]{grid-template-columns:1fr auto}.grid-cols-\\[42px_1fr_auto\\]{grid-template-columns:42px 1fr auto}.flex-col{flex-direction:column}.flex-wrap{flex-wrap:wrap}.items-end{align-items:flex-end}.items-center{align-items:center}.justify-end{justify-content:flex-end}.justify-center{justify-content:center}.justify-between{justify-content:space-between}.gap-0\\.5{gap:.125rem}.gap-1{gap:.25rem}.gap-1\\.5{gap:.375rem}.gap-2{gap:.5rem}.gap-3{gap:.75rem}.gap-x-2{-moz-column-gap:.5rem;column-gap:.5rem}.gap-y-0\\.5{row-gap:.125rem}.space-y-1\\.5>:not([hidden])~:not([hidden]){--tw-space-y-reverse: 0;margin-top:calc(.375rem * calc(1 - var(--tw-space-y-reverse)));margin-bottom:calc(.375rem * var(--tw-space-y-reverse))}.space-y-2>:not([hidden])~:not([hidden]){--tw-space-y-reverse: 0;margin-top:calc(.5rem * calc(1 - var(--tw-space-y-reverse)));margin-bottom:calc(.5rem * var(--tw-space-y-reverse))}.overflow-auto{overflow:auto}.overflow-hidden{overflow:hidden}.overflow-y-auto{overflow-y:auto}.truncate{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.whitespace-nowrap{white-space:nowrap}.rounded{border-radius:.25rem}.rounded-btn{border-radius:6px}.rounded-card{border-radius:8px}.rounded-full{border-radius:9999px}.rounded-lg{border-radius:.5rem}.rounded-md{border-radius:.375rem}.border{border-width:1px}.border-y{border-top-width:1px;border-bottom-width:1px}.border-r{border-right-width:1px}.border-t{border-top-width:1px}.border-dashed{border-style:dashed}.border-accent\\/40{border-color:hsl(var(--accent) / .4)}.border-accent\\/45{border-color:hsl(var(--accent) / .45)}.border-bear\\/30{border-color:hsl(var(--bear) / .3)}.border-border{--tw-border-opacity: 1;border-color:hsl(var(--border) / var(--tw-border-opacity, 1))}.border-border\\/40{border-color:hsl(var(--border) / .4)}.border-border\\/60{border-color:hsl(var(--border) / .6)}.border-bull\\/30{border-color:hsl(var(--bull) / .3)}.border-danger\\/35{border-color:hsl(var(--danger) / .35)}.border-danger\\/45{border-color:hsl(var(--danger) / .45)}.border-danger\\/50{border-color:hsl(var(--danger) / .5)}.border-warning\\/35{border-color:hsl(var(--warning) / .35)}.border-r-border\\/40{border-right-color:hsl(var(--border) / .4)}.bg-accent\\/10{background-color:hsl(var(--accent) / .1)}.bg-accent\\/15{background-color:hsl(var(--accent) / .15)}.bg-accent\\/40{background-color:hsl(var(--accent) / .4)}.bg-base{--tw-bg-opacity: 1;background-color:hsl(var(--base) / var(--tw-bg-opacity, 1))}.bg-base\\/30{background-color:hsl(var(--base) / .3)}.bg-bear\\/10{background-color:hsl(var(--bear) / .1)}.bg-bear\\/85{background-color:hsl(var(--bear) / .85)}.bg-border\\/70{background-color:hsl(var(--border) / .7)}.bg-bull\\/10{background-color:hsl(var(--bull) / .1)}.bg-bull\\/70{background-color:hsl(var(--bull) / .7)}.bg-bull\\/85{background-color:hsl(var(--bull) / .85)}.bg-danger{--tw-bg-opacity: 1;background-color:hsl(var(--danger) / var(--tw-bg-opacity, 1))}.bg-danger\\/10{background-color:hsl(var(--danger) / .1)}.bg-danger\\/15{background-color:hsl(var(--danger) / .15)}.bg-elevated{--tw-bg-opacity: 1;background-color:hsl(var(--elevated) / var(--tw-bg-opacity, 1))}.bg-elevated\\/30{background-color:hsl(var(--elevated) / .3)}.bg-elevated\\/35{background-color:hsl(var(--elevated) / .35)}.bg-elevated\\/40{background-color:hsl(var(--elevated) / .4)}.bg-elevated\\/45{background-color:hsl(var(--elevated) / .45)}.bg-elevated\\/50{background-color:hsl(var(--elevated) / .5)}.bg-elevated\\/55{background-color:hsl(var(--elevated) / .55)}.bg-elevated\\/70{background-color:hsl(var(--elevated) / .7)}.bg-muted\\/45{background-color:hsl(var(--fg-muted) / .45)}.bg-surface{--tw-bg-opacity: 1;background-color:hsl(var(--surface) / var(--tw-bg-opacity, 1))}.bg-surface\\/60{background-color:hsl(var(--surface) / .6)}.bg-surface\\/80{background-color:hsl(var(--surface) / .8)}.bg-surface\\/95{background-color:hsl(var(--surface) / .95)}.bg-warning{--tw-bg-opacity: 1;background-color:hsl(var(--warning) / var(--tw-bg-opacity, 1))}.bg-warning\\/10{background-color:hsl(var(--warning) / .1)}.bg-gradient-to-b{background-image:linear-gradient(to bottom,var(--tw-gradient-stops))}.bg-gradient-to-r{background-image:linear-gradient(to right,var(--tw-gradient-stops))}.bg-gradient-to-t{background-image:linear-gradient(to top,var(--tw-gradient-stops))}.from-accent{--tw-gradient-from: hsl(var(--accent) / 1) var(--tw-gradient-from-position);--tw-gradient-to: hsl(var(--accent) / 0) var(--tw-gradient-to-position);--tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to)}.from-bear\\/45{--tw-gradient-from: hsl(var(--bear) / .45) var(--tw-gradient-from-position);--tw-gradient-to: hsl(var(--bear) / 0) var(--tw-gradient-to-position);--tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to)}.from-bull\\/45{--tw-gradient-from: hsl(var(--bull) / .45) var(--tw-gradient-from-position);--tw-gradient-to: hsl(var(--bull) / 0) var(--tw-gradient-to-position);--tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to)}.from-surface\\/90{--tw-gradient-from: hsl(var(--surface) / .9) var(--tw-gradient-from-position);--tw-gradient-to: hsl(var(--surface) / 0) var(--tw-gradient-to-position);--tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to)}.to-accent\\/20{--tw-gradient-to: hsl(var(--accent) / .2) var(--tw-gradient-to-position)}.to-accent\\/30{--tw-gradient-to: hsl(var(--accent) / .3) var(--tw-gradient-to-position)}.to-bear\\/90{--tw-gradient-to: hsl(var(--bear) / .9) var(--tw-gradient-to-position)}.to-bull\\/90{--tw-gradient-to: hsl(var(--bull) / .9) var(--tw-gradient-to-position)}.to-surface\\/70{--tw-gradient-to: hsl(var(--surface) / .7) var(--tw-gradient-to-position)}.fill-foreground{fill:hsl(var(--fg-primary) / 1)}.fill-secondary{fill:hsl(var(--fg-secondary) / 1)}.p-0\\.5{padding:.125rem}.p-1\\.5{padding:.375rem}.p-2{padding:.5rem}.px-0\\.5{padding-left:.125rem;padding-right:.125rem}.px-1{padding-left:.25rem;padding-right:.25rem}.px-1\\.5{padding-left:.375rem;padding-right:.375rem}.px-2{padding-left:.5rem;padding-right:.5rem}.px-2\\.5{padding-left:.625rem;padding-right:.625rem}.px-3{padding-left:.75rem;padding-right:.75rem}.py-0\\.5{padding-top:.125rem;padding-bottom:.125rem}.py-1{padding-top:.25rem;padding-bottom:.25rem}.py-1\\.5{padding-top:.375rem;padding-bottom:.375rem}.py-2{padding-top:.5rem;padding-bottom:.5rem}.py-5{padding-top:1.25rem;padding-bottom:1.25rem}.py-6{padding-top:1.5rem;padding-bottom:1.5rem}.py-px{padding-top:1px;padding-bottom:1px}.pl-2\\.5{padding-left:.625rem}.pl-\\[50px\\]{padding-left:50px}.pr-0\\.5{padding-right:.125rem}.pr-2{padding-right:.5rem}.pt-1{padding-top:.25rem}.pt-1\\.5{padding-top:.375rem}.text-center{text-align:center}.text-right{text-align:right}.align-top{vertical-align:top}.font-mono{font-family:JetBrains Mono,IBM Plex Mono,ui-monospace,monospace}.text-\\[10px\\]{font-size:10px}.text-\\[11px\\]{font-size:11px}.text-\\[24px\\]{font-size:24px}.text-\\[8px\\]{font-size:8px}.text-\\[9px\\]{font-size:9px}.text-base{font-size:1rem;line-height:1.5rem}.text-lg{font-size:1.125rem;line-height:1.75rem}.text-sm{font-size:.875rem;line-height:1.25rem}.text-xs{font-size:.75rem;line-height:1rem}.font-bold{font-weight:700}.font-medium{font-weight:500}.font-semibold{font-weight:600}.tabular-nums{--tw-numeric-spacing: tabular-nums;font-variant-numeric:var(--tw-ordinal) var(--tw-slashed-zero) var(--tw-numeric-figure) var(--tw-numeric-spacing) var(--tw-numeric-fraction)}.leading-4{line-height:1rem}.leading-\\[1\\.3\\]{line-height:1.3}.leading-none{line-height:1}.text-accent{--tw-text-opacity: 1;color:hsl(var(--accent) / var(--tw-text-opacity, 1))}.text-base{--tw-text-opacity: 1;color:hsl(var(--base) / var(--tw-text-opacity, 1))}.text-bear{--tw-text-opacity: 1;color:hsl(var(--bear) / var(--tw-text-opacity, 1))}.text-bull{--tw-text-opacity: 1;color:hsl(var(--bull) / var(--tw-text-opacity, 1))}.text-danger{--tw-text-opacity: 1;color:hsl(var(--danger) / var(--tw-text-opacity, 1))}.text-danger\\/85{color:hsl(var(--danger) / .85)}.text-foreground{--tw-text-opacity: 1;color:hsl(var(--fg-primary) / var(--tw-text-opacity, 1))}.text-foreground\\/60{color:hsl(var(--fg-primary) / .6)}.text-foreground\\/80{color:hsl(var(--fg-primary) / .8)}.text-foreground\\/90{color:hsl(var(--fg-primary) / .9)}.text-muted{--tw-text-opacity: 1;color:hsl(var(--fg-muted) / var(--tw-text-opacity, 1))}.text-secondary{--tw-text-opacity: 1;color:hsl(var(--fg-secondary) / var(--tw-text-opacity, 1))}.text-warning{--tw-text-opacity: 1;color:hsl(var(--warning) / var(--tw-text-opacity, 1))}.opacity-\\[0\\.12\\]{opacity:.12}.shadow{--tw-shadow: 0 1px 3px 0 rgb(0 0 0 / .1), 0 1px 2px -1px rgb(0 0 0 / .1);--tw-shadow-colored: 0 1px 3px 0 var(--tw-shadow-color), 0 1px 2px -1px var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000),var(--tw-ring-shadow, 0 0 #0000),var(--tw-shadow)}.shadow-\\[0_1px_1px_hsl\\(var\\(--border\\)\\/0\\.3\\)\\]{--tw-shadow: 0 1px 1px hsl(var(--border)/.3);--tw-shadow-colored: 0 1px 1px var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000),var(--tw-ring-shadow, 0 0 #0000),var(--tw-shadow)}.shadow-\\[0_1px_2px_hsl\\(var\\(--border\\)\\/0\\.4\\)\\]{--tw-shadow: 0 1px 2px hsl(var(--border)/.4);--tw-shadow-colored: 0 1px 2px var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000),var(--tw-ring-shadow, 0 0 #0000),var(--tw-shadow)}.shadow-\\[0_1px_3px_hsl\\(var\\(--border\\)\\/0\\.4\\)\\]{--tw-shadow: 0 1px 3px hsl(var(--border)/.4);--tw-shadow-colored: 0 1px 3px var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000),var(--tw-ring-shadow, 0 0 #0000),var(--tw-shadow)}.shadow-\\[0_4px_20px_hsl\\(var\\(--border\\)\\/0\\.5\\)\\]{--tw-shadow: 0 4px 20px hsl(var(--border)/.5);--tw-shadow-colored: 0 4px 20px var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000),var(--tw-ring-shadow, 0 0 #0000),var(--tw-shadow)}.filter{filter:var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow)}.backdrop-blur{--tw-backdrop-blur: blur(8px);backdrop-filter:var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia)}.backdrop-blur-sm{--tw-backdrop-blur: blur(4px);backdrop-filter:var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia)}.backdrop-filter{backdrop-filter:var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia)}.transition-all{transition-property:all;transition-timing-function:cubic-bezier(.4,0,.2,1);transition-duration:.15s}.transition-colors{transition-property:color,background-color,border-color,text-decoration-color,fill,stroke;transition-timing-function:cubic-bezier(.4,0,.2,1);transition-duration:.15s}.transition-opacity{transition-property:opacity;transition-timing-function:cubic-bezier(.4,0,.2,1);transition-duration:.15s}@keyframes enter{0%{opacity:var(--tw-enter-opacity, 1);transform:translate3d(var(--tw-enter-translate-x, 0),var(--tw-enter-translate-y, 0),0) scale3d(var(--tw-enter-scale, 1),var(--tw-enter-scale, 1),var(--tw-enter-scale, 1)) rotate(var(--tw-enter-rotate, 0))}}@keyframes exit{to{opacity:var(--tw-exit-opacity, 1);transform:translate3d(var(--tw-exit-translate-x, 0),var(--tw-exit-translate-y, 0),0) scale3d(var(--tw-exit-scale, 1),var(--tw-exit-scale, 1),var(--tw-exit-scale, 1)) rotate(var(--tw-exit-rotate, 0))}}.paused{animation-play-state:paused}.as-root{--base: 0 0% 98%;--surface: 0 0% 100%;--elevated: 240 5% 96%;--border: 240 6% 90%;--fg-primary: 240 6% 10%;--fg-secondary: 240 4% 35%;--fg-muted: 240 5% 65%;--accent: 217 91% 60%;--bull: 4 87% 60%;--bear: 152 67% 45%;--warning: 32 95% 50%;--danger: 4 87% 60%}.as-root.dark{--base: 240 5% 5%;--surface: 240 7% 10%;--elevated: 240 9% 14%;--border: 240 5% 22%;--fg-primary: 0 0% 98%;--fg-secondary: 240 5% 78%;--fg-muted: 240 5% 58%;--accent: 217 91% 60%;--bull: 4 87% 60%;--bear: 152 67% 45%;--warning: 32 95% 50%;--danger: 4 87% 60%}.as-root{background:hsl(var(--base));color:hsl(var(--fg-primary))}.as-root *{border-color:hsl(var(--border));scrollbar-width:thin;scrollbar-color:hsl(var(--border)) transparent}.as-root *::-webkit-scrollbar{width:8px;height:8px}.as-root *::-webkit-scrollbar-thumb{background:hsl(var(--border) / .72);border:2px solid transparent;border-radius:999px;background-clip:content-box}.tabular{font-variant-numeric:tabular-nums}.hover\\:border-accent\\/30:hover{border-color:hsl(var(--accent) / .3)}.hover\\:border-accent\\/40:hover{border-color:hsl(var(--accent) / .4)}.hover\\:bg-accent\\/15:hover{background-color:hsl(var(--accent) / .15)}.hover\\:bg-elevated:hover{--tw-bg-opacity: 1;background-color:hsl(var(--elevated) / var(--tw-bg-opacity, 1))}.hover\\:text-accent:hover{--tw-text-opacity: 1;color:hsl(var(--accent) / var(--tw-text-opacity, 1))}.hover\\:text-foreground:hover{--tw-text-opacity: 1;color:hsl(var(--fg-primary) / var(--tw-text-opacity, 1))}.hover\\:shadow-\\[0_2px_6px_hsl\\(var\\(--accent\\)\\/0\\.15\\)\\]:hover{--tw-shadow: 0 2px 6px hsl(var(--accent)/.15);--tw-shadow-colored: 0 2px 6px var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000),var(--tw-ring-shadow, 0 0 #0000),var(--tw-shadow)}.hover\\:shadow-\\[0_2px_8px_hsl\\(var\\(--accent\\)\\/0\\.15\\)\\]:hover{--tw-shadow: 0 2px 8px hsl(var(--accent)/.15);--tw-shadow-colored: 0 2px 8px var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000),var(--tw-ring-shadow, 0 0 #0000),var(--tw-shadow)}.disabled\\:cursor-not-allowed:disabled{cursor:not-allowed}.disabled\\:opacity-40:disabled{opacity:.4}.disabled\\:opacity-50:disabled{opacity:.5}@media (min-width: 1024px){.lg\\:inline-flex{display:inline-flex}.lg\\:grid-cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}}@media (min-width: 1280px){.xl\\:grid-cols-\\[minmax\\(0\\,1fr\\)_20rem\\]{grid-template-columns:minmax(0,1fr) 20rem}}';
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
      ...l.map(([u, h]) => I.createElement(u, h)),
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
const $g = me("ChartColumn", [
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
const Dg = me("ChartLine", [
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
const mc = me("Pause", [
  ["rect", { x: "14", y: "4", width: "4", height: "16", rx: "1", key: "zuxfzm" }],
  ["rect", { x: "6", y: "4", width: "4", height: "16", rx: "1", key: "1okwgv" }]
]);
/**
 * @license lucide-react v0.439.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const gc = me("Play", [
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
const Wg = me("Target", [
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
const Vg = me("TriangleAlert", [
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
const Kg = me("X", [
  ["path", { d: "M18 6 6 18", key: "1bl5f8" }],
  ["path", { d: "m6 6 12 12", key: "d8bk6v" }]
]), Gg = "http://127.0.0.1:3023";
async function vc(e) {
  const t = await fetch(e, { headers: { Accept: "application/json" } });
  if (!t.ok) throw new Error(`${t.status} ${t.statusText}`);
  return t.json();
}
const fp = {
  limitPoolTimeline: (e, t = !1) => {
    const r = new URLSearchParams();
    e && r.set("date", e), t && r.set("refresh", "1");
    const n = r.toString();
    return vc(`${Gg}/api/limit-pool/timeline${n ? `?${n}` : ""}`);
  },
  overviewMarket: () => vc("/api/overview/market?market=cn")
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
function qg() {
  for (var e, t, r = 0, n = "", o = arguments.length; r < o; r++) (e = arguments[r]) && (t = pp(e)) && (n && (n += " "), n += t);
  return n;
}
const Va = "-", Yg = (e) => {
  const t = Zg(e), {
    conflictingClassGroups: r,
    conflictingClassGroupModifiers: n
  } = e;
  return {
    getClassGroupId: (l) => {
      const s = l.split(Va);
      return s[0] === "" && s.length !== 1 && s.shift(), hp(s, t) || Xg(l);
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
  const i = e.join(Va);
  return t.validators.find(({
    validator: l
  }) => l(i))?.classGroupId;
}, yc = /^\[(.+)\]$/, Xg = (e) => {
  if (yc.test(e)) {
    const t = yc.exec(e)[1], r = t?.substring(0, t.indexOf(":"));
    if (r)
      return "arbitrary.." + r;
  }
}, Zg = (e) => {
  const {
    theme: t,
    prefix: r
  } = e, n = {
    nextPart: /* @__PURE__ */ new Map(),
    validators: []
  };
  return ev(Object.entries(e.classGroups), r).forEach(([i, l]) => {
    Ws(l, n, i, t);
  }), n;
}, Ws = (e, t, r, n) => {
  e.forEach((o) => {
    if (typeof o == "string") {
      const i = o === "" ? t : xc(t, o);
      i.classGroupId = r;
      return;
    }
    if (typeof o == "function") {
      if (Jg(o)) {
        Ws(o(n), t, r, n);
        return;
      }
      t.validators.push({
        validator: o,
        classGroupId: r
      });
      return;
    }
    Object.entries(o).forEach(([i, l]) => {
      Ws(l, xc(t, i), r, n);
    });
  });
}, xc = (e, t) => {
  let r = e;
  return t.split(Va).forEach((n) => {
    r.nextPart.has(n) || r.nextPart.set(n, {
      nextPart: /* @__PURE__ */ new Map(),
      validators: []
    }), r = r.nextPart.get(n);
  }), r;
}, Jg = (e) => e.isThemeGetter, ev = (e, t) => t ? e.map(([r, n]) => {
  const o = n.map((i) => typeof i == "string" ? t + i : typeof i == "object" ? Object.fromEntries(Object.entries(i).map(([l, s]) => [t + l, s])) : i);
  return [r, o];
}) : e, tv = (e) => {
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
}, mp = "!", rv = (e) => {
  const {
    separator: t,
    experimentalParseClassName: r
  } = e, n = t.length === 1, o = t[0], i = t.length, l = (s) => {
    const a = [];
    let u = 0, h = 0, v;
    for (let C = 0; C < s.length; C++) {
      let p = s[C];
      if (u === 0) {
        if (p === o && (n || s.slice(C, C + i) === t)) {
          a.push(s.slice(h, C)), h = C + i;
          continue;
        }
        if (p === "/") {
          v = C;
          continue;
        }
      }
      p === "[" ? u++ : p === "]" && u--;
    }
    const g = a.length === 0 ? s : s.substring(h), y = g.startsWith(mp), x = y ? g.substring(1) : g, w = v && v > h ? v - h : void 0;
    return {
      modifiers: a,
      hasImportantModifier: y,
      baseClassName: x,
      maybePostfixModifierPosition: w
    };
  };
  return r ? (s) => r({
    className: s,
    parseClassName: l
  }) : l;
}, nv = (e) => {
  if (e.length <= 1)
    return e;
  const t = [];
  let r = [];
  return e.forEach((n) => {
    n[0] === "[" ? (t.push(...r.sort(), n), r = []) : r.push(n);
  }), t.push(...r.sort()), t;
}, ov = (e) => ({
  cache: tv(e.cacheSize),
  parseClassName: rv(e),
  ...Yg(e)
}), iv = /\s+/, lv = (e, t) => {
  const {
    parseClassName: r,
    getClassGroupId: n,
    getConflictingClassGroupIds: o
  } = t, i = [], l = e.trim().split(iv);
  let s = "";
  for (let a = l.length - 1; a >= 0; a -= 1) {
    const u = l[a], {
      modifiers: h,
      hasImportantModifier: v,
      baseClassName: g,
      maybePostfixModifierPosition: y
    } = r(u);
    let x = !!y, w = n(x ? g.substring(0, y) : g);
    if (!w) {
      if (!x) {
        s = u + (s.length > 0 ? " " + s : s);
        continue;
      }
      if (w = n(g), !w) {
        s = u + (s.length > 0 ? " " + s : s);
        continue;
      }
      x = !1;
    }
    const C = nv(h).join(":"), p = v ? C + mp : C, d = p + w;
    if (i.includes(d))
      continue;
    i.push(d);
    const m = o(w, x);
    for (let k = 0; k < m.length; ++k) {
      const S = m[k];
      i.push(p + S);
    }
    s = u + (s.length > 0 ? " " + s : s);
  }
  return s;
};
function sv() {
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
function av(e, ...t) {
  let r, n, o, i = l;
  function l(a) {
    const u = t.reduce((h, v) => v(h), e());
    return r = ov(u), n = r.cache.get, o = r.cache.set, i = s, s(a);
  }
  function s(a) {
    const u = n(a);
    if (u)
      return u;
    const h = lv(a, r);
    return o(a, h), h;
  }
  return function() {
    return i(sv.apply(null, arguments));
  };
}
const X = (e) => {
  const t = (r) => r[e] || [];
  return t.isThemeGetter = !0, t;
}, vp = /^\[(?:([a-z-]+):)?(.+)\]$/i, uv = /^\d+\/\d+$/, cv = /* @__PURE__ */ new Set(["px", "full", "screen"]), dv = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, fv = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, pv = /^(rgba?|hsla?|hwb|(ok)?(lab|lch)|color-mix)\(.+\)$/, hv = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, mv = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, bt = (e) => dn(e) || cv.has(e) || uv.test(e), $t = (e) => On(e, "length", Sv), dn = (e) => !!e && !Number.isNaN(Number(e)), Il = (e) => On(e, "number", dn), Hn = (e) => !!e && Number.isInteger(Number(e)), gv = (e) => e.endsWith("%") && dn(e.slice(0, -1)), $ = (e) => vp.test(e), Dt = (e) => dv.test(e), vv = /* @__PURE__ */ new Set(["length", "size", "percentage"]), yv = (e) => On(e, vv, yp), xv = (e) => On(e, "position", yp), wv = /* @__PURE__ */ new Set(["image", "url"]), kv = (e) => On(e, wv, Ev), bv = (e) => On(e, "", Cv), Wn = () => !0, On = (e, t, r) => {
  const n = vp.exec(e);
  return n ? n[1] ? typeof t == "string" ? n[1] === t : t.has(n[1]) : r(n[2]) : !1;
}, Sv = (e) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  fv.test(e) && !pv.test(e)
), yp = () => !1, Cv = (e) => hv.test(e), Ev = (e) => mv.test(e), jv = () => {
  const e = X("colors"), t = X("spacing"), r = X("blur"), n = X("brightness"), o = X("borderColor"), i = X("borderRadius"), l = X("borderSpacing"), s = X("borderWidth"), a = X("contrast"), u = X("grayscale"), h = X("hueRotate"), v = X("invert"), g = X("gap"), y = X("gradientColorStops"), x = X("gradientColorStopPositions"), w = X("inset"), C = X("margin"), p = X("opacity"), d = X("padding"), m = X("saturate"), k = X("scale"), S = X("sepia"), _ = X("skew"), j = X("space"), P = X("translate"), R = () => ["auto", "contain", "none"], T = () => ["auto", "hidden", "clip", "visible", "scroll"], Y = () => ["auto", $, t], U = () => [$, t], Ee = () => ["", bt, $t], Me = () => ["auto", dn, $], Qr = () => ["bottom", "center", "left", "left-bottom", "left-top", "right", "right-bottom", "right-top", "top"], dt = () => ["solid", "dashed", "dotted", "double", "none"], wt = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"], E = () => ["start", "end", "center", "between", "around", "evenly", "stretch"], O = () => ["", "0", $], L = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"], B = () => [dn, $];
  return {
    cacheSize: 500,
    separator: ":",
    theme: {
      colors: [Wn],
      spacing: [bt, $t],
      blur: ["none", "", Dt, $],
      brightness: B(),
      borderColor: [e],
      borderRadius: ["none", "", "full", Dt, $],
      borderSpacing: U(),
      borderWidth: Ee(),
      contrast: B(),
      grayscale: O(),
      hueRotate: B(),
      invert: O(),
      gap: U(),
      gradientColorStops: [e],
      gradientColorStopPositions: [gv, $t],
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
        aspect: ["auto", "square", "video", $]
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
        columns: [Dt]
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
        object: [...Qr(), $]
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
        inset: [w]
      }],
      /**
       * Right / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-x": [{
        "inset-x": [w]
      }],
      /**
       * Top / Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-y": [{
        "inset-y": [w]
      }],
      /**
       * Start
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      start: [{
        start: [w]
      }],
      /**
       * End
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      end: [{
        end: [w]
      }],
      /**
       * Top
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      top: [{
        top: [w]
      }],
      /**
       * Right
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      right: [{
        right: [w]
      }],
      /**
       * Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      bottom: [{
        bottom: [w]
      }],
      /**
       * Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      left: [{
        left: [w]
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
        z: ["auto", Hn, $]
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
        flex: ["1", "auto", "initial", "none", $]
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
        order: ["first", "last", "none", Hn, $]
      }],
      /**
       * Grid Template Columns
       * @see https://tailwindcss.com/docs/grid-template-columns
       */
      "grid-cols": [{
        "grid-cols": [Wn]
      }],
      /**
       * Grid Column Start / End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start-end": [{
        col: ["auto", {
          span: ["full", Hn, $]
        }, $]
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
        "grid-rows": [Wn]
      }],
      /**
       * Grid Row Start / End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start-end": [{
        row: ["auto", {
          span: [Hn, $]
        }, $]
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
        "auto-cols": ["auto", "min", "max", "fr", $]
      }],
      /**
       * Grid Auto Rows
       * @see https://tailwindcss.com/docs/grid-auto-rows
       */
      "auto-rows": [{
        "auto-rows": ["auto", "min", "max", "fr", $]
      }],
      /**
       * Gap
       * @see https://tailwindcss.com/docs/gap
       */
      gap: [{
        gap: [g]
      }],
      /**
       * Gap X
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-x": [{
        "gap-x": [g]
      }],
      /**
       * Gap Y
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-y": [{
        "gap-y": [g]
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
        m: [C]
      }],
      /**
       * Margin X
       * @see https://tailwindcss.com/docs/margin
       */
      mx: [{
        mx: [C]
      }],
      /**
       * Margin Y
       * @see https://tailwindcss.com/docs/margin
       */
      my: [{
        my: [C]
      }],
      /**
       * Margin Start
       * @see https://tailwindcss.com/docs/margin
       */
      ms: [{
        ms: [C]
      }],
      /**
       * Margin End
       * @see https://tailwindcss.com/docs/margin
       */
      me: [{
        me: [C]
      }],
      /**
       * Margin Top
       * @see https://tailwindcss.com/docs/margin
       */
      mt: [{
        mt: [C]
      }],
      /**
       * Margin Right
       * @see https://tailwindcss.com/docs/margin
       */
      mr: [{
        mr: [C]
      }],
      /**
       * Margin Bottom
       * @see https://tailwindcss.com/docs/margin
       */
      mb: [{
        mb: [C]
      }],
      /**
       * Margin Left
       * @see https://tailwindcss.com/docs/margin
       */
      ml: [{
        ml: [C]
      }],
      /**
       * Space Between X
       * @see https://tailwindcss.com/docs/space
       */
      "space-x": [{
        "space-x": [j]
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
        "space-y": [j]
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
        w: ["auto", "min", "max", "fit", "svw", "lvw", "dvw", $, t]
      }],
      /**
       * Min-Width
       * @see https://tailwindcss.com/docs/min-width
       */
      "min-w": [{
        "min-w": [$, t, "min", "max", "fit"]
      }],
      /**
       * Max-Width
       * @see https://tailwindcss.com/docs/max-width
       */
      "max-w": [{
        "max-w": [$, t, "none", "full", "min", "max", "fit", "prose", {
          screen: [Dt]
        }, Dt]
      }],
      /**
       * Height
       * @see https://tailwindcss.com/docs/height
       */
      h: [{
        h: [$, t, "auto", "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Min-Height
       * @see https://tailwindcss.com/docs/min-height
       */
      "min-h": [{
        "min-h": [$, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Max-Height
       * @see https://tailwindcss.com/docs/max-height
       */
      "max-h": [{
        "max-h": [$, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Size
       * @see https://tailwindcss.com/docs/size
       */
      size: [{
        size: [$, t, "auto", "min", "max", "fit"]
      }],
      // Typography
      /**
       * Font Size
       * @see https://tailwindcss.com/docs/font-size
       */
      "font-size": [{
        text: ["base", Dt, $t]
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
        font: ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black", Il]
      }],
      /**
       * Font Family
       * @see https://tailwindcss.com/docs/font-family
       */
      "font-family": [{
        font: [Wn]
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
        tracking: ["tighter", "tight", "normal", "wide", "wider", "widest", $]
      }],
      /**
       * Line Clamp
       * @see https://tailwindcss.com/docs/line-clamp
       */
      "line-clamp": [{
        "line-clamp": ["none", dn, Il]
      }],
      /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */
      leading: [{
        leading: ["none", "tight", "snug", "normal", "relaxed", "loose", bt, $]
      }],
      /**
       * List Style Image
       * @see https://tailwindcss.com/docs/list-style-image
       */
      "list-image": [{
        "list-image": ["none", $]
      }],
      /**
       * List Style Type
       * @see https://tailwindcss.com/docs/list-style-type
       */
      "list-style-type": [{
        list: ["none", "disc", "decimal", $]
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
        decoration: [...dt(), "wavy"]
      }],
      /**
       * Text Decoration Thickness
       * @see https://tailwindcss.com/docs/text-decoration-thickness
       */
      "text-decoration-thickness": [{
        decoration: ["auto", "from-font", bt, $t]
      }],
      /**
       * Text Underline Offset
       * @see https://tailwindcss.com/docs/text-underline-offset
       */
      "underline-offset": [{
        "underline-offset": ["auto", bt, $]
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
        align: ["baseline", "top", "middle", "bottom", "text-top", "text-bottom", "sub", "super", $]
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
        content: ["none", $]
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
        bg: [...Qr(), xv]
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
        bg: ["auto", "cover", "contain", yv]
      }],
      /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */
      "bg-image": [{
        bg: ["none", {
          "gradient-to": ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
        }, kv]
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
        from: [x]
      }],
      /**
       * Gradient Color Stops Via Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via-pos": [{
        via: [x]
      }],
      /**
       * Gradient Color Stops To Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to-pos": [{
        to: [x]
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
        border: [...dt(), "hidden"]
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
        divide: dt()
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
        outline: ["", ...dt()]
      }],
      /**
       * Outline Offset
       * @see https://tailwindcss.com/docs/outline-offset
       */
      "outline-offset": [{
        "outline-offset": [bt, $]
      }],
      /**
       * Outline Width
       * @see https://tailwindcss.com/docs/outline-width
       */
      "outline-w": [{
        outline: [bt, $t]
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
        "ring-offset": [bt, $t]
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
        shadow: ["", "inner", "none", Dt, bv]
      }],
      /**
       * Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow-color
       */
      "shadow-color": [{
        shadow: [Wn]
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
        "mix-blend": [...wt(), "plus-lighter", "plus-darker"]
      }],
      /**
       * Background Blend Mode
       * @see https://tailwindcss.com/docs/background-blend-mode
       */
      "bg-blend": [{
        "bg-blend": wt()
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
        "drop-shadow": ["", "none", Dt, $]
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
        "hue-rotate": [h]
      }],
      /**
       * Invert
       * @see https://tailwindcss.com/docs/invert
       */
      invert: [{
        invert: [v]
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
        sepia: [S]
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
        "backdrop-hue-rotate": [h]
      }],
      /**
       * Backdrop Invert
       * @see https://tailwindcss.com/docs/backdrop-invert
       */
      "backdrop-invert": [{
        "backdrop-invert": [v]
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
        "backdrop-sepia": [S]
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
        transition: ["none", "all", "", "colors", "opacity", "shadow", "transform", $]
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
        ease: ["linear", "in", "out", "in-out", $]
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
        animate: ["none", "spin", "ping", "pulse", "bounce", $]
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
        rotate: [Hn, $]
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
        origin: ["center", "top", "top-right", "right", "bottom-right", "bottom", "bottom-left", "left", "top-left", $]
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
        cursor: ["auto", "default", "pointer", "wait", "text", "move", "help", "not-allowed", "none", "context-menu", "progress", "cell", "crosshair", "vertical-text", "alias", "copy", "no-drop", "grab", "grabbing", "all-scroll", "col-resize", "row-resize", "n-resize", "e-resize", "s-resize", "w-resize", "ne-resize", "nw-resize", "se-resize", "sw-resize", "ew-resize", "ns-resize", "nesw-resize", "nwse-resize", "zoom-in", "zoom-out", $]
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
        "will-change": ["auto", "scroll", "contents", "transform", $]
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
        stroke: [bt, $t, Il]
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
}, Nv = /* @__PURE__ */ av(jv);
function xr(...e) {
  return Nv(qg(e));
}
const _v = 3e3, ki = {
  秒顶一: { bg: "#ffeb3b", fg: "#000" },
  龙头: { bg: "#f44336", fg: "#fff" },
  加强: { bg: "#ff5722", fg: "#fff" },
  弹性: { bg: "#ff9800", fg: "#000" },
  后排: { bg: "#9e9e9e", fg: "#fff" },
  顶板: { bg: "#e040fb", fg: "#fff" },
  卡位: { bg: "#4fc3f7", fg: "#000" },
  炸: { bg: "#4682b4", fg: "#fff" },
  跌停: { bg: "#4caf50", fg: "#fff" }
}, Pv = {
  zt: "border-bull/30 bg-bull/10",
  zb: "border-warning/35 bg-warning/10",
  dt: "border-bear/30 bg-bear/10"
}, zv = {
  zt: "涨停",
  zb: "炸板",
  dt: "跌停"
}, Vn = (e) => `${e.symbol}-${e.type}`;
function bi(e) {
  const t = Math.floor(e / 60), r = e % 60;
  return `${String(t).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}
function Mv(e) {
  return !e || !Number.isFinite(e) ? "—" : e >= 1e8 ? `${(e / 1e8).toFixed(2)}亿` : e >= 1e4 ? `${(e / 1e4).toFixed(0)}万` : e.toFixed(0);
}
function Rv({
  day: e,
  onStockClick: t
}) {
  const [r, n] = I.useState(!1), [o, i] = I.useState("all"), [l, s] = I.useState(null), [a, u] = I.useState(null), [h, v] = I.useState(null), [g, y] = I.useState(!1), [x, w] = I.useState(2), C = h != null, p = I.useRef(null), { data: d, isError: m, refetch: k, isFetching: S } = Wa({
    queryKey: ["limit-pool-timeline", e ?? "today"],
    queryFn: () => fp.limitPoolTimeline(e),
    // 非盘中(收盘后 / 历史日期)页面停留久了没必要 3s 打一次, 交给服务端 30s 缓存兜底。
    // 回放期间必须停轮询: 数据一变时间点数量就变, 进度/画面会跳。
    refetchInterval: r || g || C ? !1 : _v,
    staleTime: 0,
    placeholderData: (z) => z,
    retry: 1
  }), _ = d ? !d.in_session : !1, j = d?.events ?? [], P = I.useMemo(
    () => a ? j.find((z) => Vn(z) === a.key) ?? null : null,
    [a, j]
  ), R = I.useMemo(() => {
    const z = /* @__PURE__ */ new Set();
    for (const H of j) z.add(H.time);
    return Array.from(z).sort((H, ee) => H - ee);
  }, [j]), T = I.useMemo(() => {
    if (h == null) return j;
    if (h <= 0) return [];
    const z = R[Math.min(h, R.length) - 1];
    return j.filter((H) => H.time <= z);
  }, [j, h, R]), Y = I.useMemo(() => {
    const z = /* @__PURE__ */ new Set();
    for (const ee of T) z.add(ee.time);
    const H = Array.from(z);
    return C ? H.sort((ee, G) => ee - G) : H.sort((ee, G) => G - ee);
  }, [T, C]);
  I.useEffect(() => {
    if (!g || R.length === 0) return;
    const z = Math.max(120, Math.round(900 / x)), H = window.setInterval(() => {
      v((ee) => Math.min((ee ?? 0) + 1, R.length));
    }, z);
    return () => window.clearInterval(H);
  }, [g, x, R.length]), I.useEffect(() => {
    g && h != null && h >= R.length && y(!1);
  }, [g, h, R.length]), I.useEffect(() => {
    if (!g) return;
    const z = p.current;
    z && (z.scrollLeft = z.scrollWidth);
  }, [g, h]), I.useEffect(() => {
    d?.in_session && h != null && (y(!1), v(null));
  }, [d?.in_session, h]);
  const U = () => {
    if (R.length !== 0) {
      if (g) {
        y(!1);
        return;
      }
      (h == null || h >= R.length) && v(0), y(!0);
    }
  }, Ee = () => {
    y(!1), v(null);
  }, Me = (z) => {
    y(!1), v(z >= R.length ? R.length : z);
  }, Qr = Math.max(1, d?.rows?.zt ?? 1), dt = Math.max(1, d?.rows?.bt ?? 1), wt = I.useMemo(() => {
    const z = /* @__PURE__ */ new Map(), H = /* @__PURE__ */ new Map();
    for (const ee of T) {
      const G = ee.type === "zt" ? z : H, Br = `${ee.time}:${ee.row}`, Ka = G.get(Br);
      Ka ? Ka.push(ee) : G.set(Br, [ee]);
    }
    return { zt: z, bt: H };
  }, [T]), E = I.useMemo(
    () => d?.periods.find((z) => z.id === o) ?? null,
    [d?.periods, o]
  ), O = (z) => !!(E && !(z.time >= E.t0 && z.time < E.t1) || l && z.reason !== l), L = (d?.periods ?? []).filter((z) => z.count > 0), B = d?.sectors ?? [], se = d?.counts, Lt = (z) => {
    s((H) => H === z ? null : z);
  }, kt = I.useMemo(() => {
    if (!C) return null;
    let z = 0, H = 0, ee = 0;
    for (const G of T)
      G.type === "zt" ? z++ : G.type === "zb" ? H++ : ee++;
    return { zt: z, zb: H, dt: ee };
  }, [C, T]), Ae = R.length, qe = h == null ? Ae : Math.min(h, Ae), mr = Ae === 0 ? "--:--" : qe <= 0 ? bi(R[0]) : bi(R[qe - 1]), Uo = kt ?? se, xp = Uo ? `涨停 ${Uo.zt} · 炸板 ${Uo.zb} · 跌停 ${Uo.dt}` : void 0;
  return /* @__PURE__ */ c.jsxs("section", { className: "flex h-full flex-col rounded-card border border-border bg-surface/80 p-1.5 shadow-[0_1px_2px_hsl(var(--border)/0.4)] backdrop-blur-sm", children: [
    /* @__PURE__ */ c.jsxs("div", { className: "mb-1.5 flex items-center justify-between gap-2", children: [
      /* @__PURE__ */ c.jsxs("div", { className: "flex items-center gap-1.5", children: [
        /* @__PURE__ */ c.jsx("span", { className: "h-3 w-0.5 rounded-full bg-gradient-to-b from-accent to-accent/30" }),
        /* @__PURE__ */ c.jsx(dp, { className: "h-3.5 w-3.5 text-accent" }),
        /* @__PURE__ */ c.jsx("h2", { className: "text-xs font-semibold text-foreground", children: "涨跌停时间轴" }),
        /* @__PURE__ */ c.jsx("span", { className: "font-mono text-[10px] text-muted", children: xp }),
        d?.stale && /* @__PURE__ */ c.jsxs("span", { className: "inline-flex items-center gap-0.5 rounded bg-warning/10 px-1 py-px text-[9px] text-warning", children: [
          /* @__PURE__ */ c.jsx(Vg, { className: "h-2.5 w-2.5" }),
          "上游超时"
        ] })
      ] }),
      /* @__PURE__ */ c.jsxs("div", { className: "flex items-center gap-1.5 text-[10px] text-muted", children: [
        /* @__PURE__ */ c.jsx("span", { className: "font-mono", children: d?.date || "—" }),
        /* @__PURE__ */ c.jsx("span", { className: xr("tabular-nums", r || C ? "text-warning" : "text-accent"), children: C ? g ? "回放中" : "回放已暂停" : r ? "已暂停" : `${d?.server_time ?? "--:--:--"} · 3s` }),
        /* @__PURE__ */ c.jsx(
          "button",
          {
            onClick: () => n((z) => !z),
            className: "inline-flex h-4 w-4 items-center justify-center rounded text-muted transition-colors hover:bg-elevated hover:text-foreground",
            title: r ? "恢复自动刷新" : "暂停自动刷新",
            children: r ? /* @__PURE__ */ c.jsx(gc, { className: "h-2.5 w-2.5" }) : /* @__PURE__ */ c.jsx(mc, { className: "h-2.5 w-2.5" })
          }
        ),
        /* @__PURE__ */ c.jsx(
          "button",
          {
            onClick: () => k(),
            className: "inline-flex h-4 w-4 items-center justify-center rounded text-muted transition-colors hover:bg-elevated hover:text-foreground",
            title: "立即刷新",
            children: /* @__PURE__ */ c.jsx(Ug, { className: xr("h-2.5 w-2.5", S && "animate-spin") })
          }
        )
      ] })
    ] }),
    _ && /* @__PURE__ */ c.jsxs("div", { className: "mb-1 flex items-center gap-1.5 rounded border border-border/60 bg-elevated/30 px-1.5 py-1", children: [
      /* @__PURE__ */ c.jsxs(
        "button",
        {
          onClick: U,
          disabled: Ae === 0,
          className: "inline-flex shrink-0 items-center gap-1 rounded-btn border border-accent/40 bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-accent transition-colors hover:bg-accent/15 disabled:cursor-not-allowed disabled:opacity-40",
          title: g ? "暂停回放" : h == null ? "回放当日涨跌停 / 炸板" : h >= Ae ? "从头重播" : "继续回放",
          children: [
            g ? /* @__PURE__ */ c.jsx(mc, { className: "h-2.5 w-2.5" }) : /* @__PURE__ */ c.jsx(gc, { className: "h-2.5 w-2.5" }),
            g ? "暂停" : h == null ? "回放" : h >= Ae ? "重播" : "继续"
          ]
        }
      ),
      /* @__PURE__ */ c.jsx(
        "input",
        {
          type: "range",
          min: 0,
          max: Math.max(Ae, 1),
          step: 1,
          value: qe,
          onChange: (z) => Me(Number(z.target.value)),
          disabled: Ae === 0,
          title: "拖动可跳到任意时刻",
          className: "h-1 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-border/70 disabled:cursor-not-allowed",
          style: { accentColor: "hsl(var(--accent))" }
        }
      ),
      /* @__PURE__ */ c.jsx("span", { className: "shrink-0 font-mono text-[10px] tabular-nums text-accent", children: mr }),
      /* @__PURE__ */ c.jsxs("span", { className: "shrink-0 font-mono text-[9px] tabular-nums text-muted", children: [
        qe,
        "/",
        Ae
      ] }),
      /* @__PURE__ */ c.jsxs(
        "button",
        {
          onClick: () => w((z) => z === 1 ? 2 : z === 2 ? 4 : 1),
          className: "shrink-0 rounded border border-border px-1 text-[9px] tabular-nums text-muted transition-colors hover:text-foreground",
          title: "回放速度 (每个时间点停留时长)",
          children: [
            x,
            "x"
          ]
        }
      ),
      C && /* @__PURE__ */ c.jsxs(
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
          className: xr(
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
          className: xr(
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
            /* @__PURE__ */ c.jsx(Kg, { className: "h-2.5 w-2.5" }),
            "清除"
          ]
        }
      ),
      B.map((z, H) => /* @__PURE__ */ c.jsxs(
        "button",
        {
          onClick: () => Lt(z.name),
          className: xr(
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
        className: "relative min-h-[9rem] flex-1 overflow-auto rounded border border-border/60 bg-base/30",
        children: T.length === 0 ? /* @__PURE__ */ c.jsx("div", { className: "flex h-24 flex-col items-center justify-center gap-1 text-[11px] text-muted", children: C ? /* @__PURE__ */ c.jsx("span", { children: "回放已就绪 · 点「播放」或拖动进度条" }) : m ? /* @__PURE__ */ c.jsxs(c.Fragment, { children: [
          /* @__PURE__ */ c.jsx("span", { className: "text-danger", children: "时间轴数据加载失败" }),
          /* @__PURE__ */ c.jsx("span", { className: "text-[10px]", children: "东财板池接口不可达, 稍后自动重试" })
        ] }) : /* @__PURE__ */ c.jsxs(c.Fragment, { children: [
          /* @__PURE__ */ c.jsx("span", { children: d ? "当前日期无涨跌停数据" : "加载中…" }),
          d?.errors && d.errors.length > 0 && /* @__PURE__ */ c.jsxs("span", { className: "text-[10px]", children: [
            "上游返回异常: ",
            d.errors.join("/")
          ] })
        ] }) }) : /* @__PURE__ */ c.jsx("table", { className: "w-full min-w-max border-collapse text-[10px]", children: /* @__PURE__ */ c.jsxs("tbody", { children: [
          Array.from({ length: Qr }, (z, H) => /* @__PURE__ */ c.jsxs("tr", { children: [
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
                children: /* @__PURE__ */ c.jsx("div", { className: "flex flex-col gap-0.5", children: (wt.zt.get(`${ee}:${H}`) ?? []).map((G) => /* @__PURE__ */ c.jsx(
                  wc,
                  {
                    ev: G,
                    dim: O(G),
                    onHover: (Br) => u({ key: Vn(G), anchor: Br }),
                    onLeave: () => u(null),
                    onClick: () => Lt(G.reason),
                    onNameClick: () => G.symbol && t?.(G.symbol, G.name)
                  },
                  Vn(G)
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
                children: bi(z)
              },
              `t-${z}`
            ))
          ] }),
          Array.from({ length: dt }, (z, H) => /* @__PURE__ */ c.jsxs("tr", { children: [
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
                children: /* @__PURE__ */ c.jsx("div", { className: "flex flex-col gap-0.5", children: (wt.bt.get(`${ee}:${H}`) ?? []).map((G) => /* @__PURE__ */ c.jsx(
                  wc,
                  {
                    ev: G,
                    dim: O(G),
                    onHover: (Br) => u({ key: Vn(G), anchor: Br }),
                    onLeave: () => u(null),
                    onClick: () => Lt(G.reason),
                    onNameClick: () => G.symbol && t?.(G.symbol, G.name)
                  },
                  Vn(G)
                )) })
              },
              `bt-${H}-${ee}`
            ))
          ] }, `bt-${H}`))
        ] }) })
      }
    ),
    /* @__PURE__ */ c.jsxs("div", { className: "mt-1 flex items-center justify-between gap-2 text-[9px] text-muted", children: [
      /* @__PURE__ */ c.jsx("span", { children: C ? `回放中 · 左=早 右=晚 · ${mr}` : "左=最新 · 无事件的时段不占列" }),
      /* @__PURE__ */ c.jsx("span", { className: "font-mono", children: d ? `${Y.length} 个时间点 / ${T.length} 条` : "" })
    ] }),
    a && P && /* @__PURE__ */ c.jsx(Tv, { ev: P, anchor: a.anchor })
  ] });
}
function wc({
  ev: e,
  dim: t,
  onHover: r,
  onLeave: n,
  onClick: o,
  onNameClick: i
}) {
  const l = e.tag ? ki[e.tag] : void 0;
  return /* @__PURE__ */ c.jsxs(
    "span",
    {
      className: xr(
        "inline-flex w-fit max-w-full items-center gap-0.5 overflow-hidden rounded border px-0.5 py-px transition-opacity",
        Pv[e.type],
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
function Tv({ ev: e, anchor: t }) {
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
                style: ki[e.tag] ? { background: ki[e.tag].bg, color: ki[e.tag].fg } : void 0,
                children: e.tag
              }
            )
          ] }),
          /* @__PURE__ */ c.jsx(gr, { label: "类型", value: zv[e.type] }),
          /* @__PURE__ */ c.jsx(gr, { label: "时间", value: bi(e.time) }),
          /* @__PURE__ */ c.jsx(gr, { label: "题材", value: e.reason }),
          e.type === "zt" && /* @__PURE__ */ c.jsx(gr, { label: "梯队", value: e.tier }),
          /* @__PURE__ */ c.jsx(gr, { label: "价格", value: `¥${(e.price ?? 0).toFixed(2)}` }),
          /* @__PURE__ */ c.jsx(
            gr,
            {
              label: "涨跌幅",
              value: `${e.change_pct >= 0 ? "+" : ""}${(e.change_pct ?? 0).toFixed(2)}%`,
              tone: e.change_pct >= 0 ? "bull" : "bear"
            }
          ),
          /* @__PURE__ */ c.jsx(gr, { label: "成交额", value: Mv(e.amount) })
        ]
      }
    ),
    document.body
  );
}
function gr({ label: e, value: t, tone: r }) {
  return /* @__PURE__ */ c.jsxs("div", { className: "flex items-center justify-between gap-3 text-[10px] leading-4", children: [
    /* @__PURE__ */ c.jsx("span", { className: "text-muted", children: e }),
    /* @__PURE__ */ c.jsx("span", { className: xr("font-mono", r === "bull" ? "text-bull" : r === "bear" ? "text-bear" : "text-secondary"), children: t })
  ] });
}
function Ao(e) {
  return typeof e == "number" && Number.isFinite(e) ? e : null;
}
function Fv(e) {
  return e >= 70 ? "#F04438" : e >= 55 ? "#FB923C" : e >= 45 ? "#F59E0B" : e >= 30 ? "#84CC16" : "#12B76A";
}
function Ov(e, t = 2) {
  const r = Ao(e);
  return r == null ? "—" : r.toFixed(t);
}
function Lv(e) {
  const t = Ao(e);
  return t == null ? "—" : `${t >= 0 ? "+" : ""}${t.toFixed(2)}%`;
}
function kc(e) {
  const t = Ao(e);
  return t == null || t === 0 ? "text-muted" : t > 0 ? "text-bull" : "text-bear";
}
function bc(e) {
  const t = Ao(e);
  return t == null ? "—" : t >= 1e12 ? `${(t / 1e12).toFixed(2)}万亿` : t >= 1e8 ? `${(t / 1e8).toFixed(2)}亿` : t >= 1e4 ? `${(t / 1e4).toFixed(1)}万` : t.toFixed(0);
}
function Kn({ icon: e, title: t, hint: r }) {
  return /* @__PURE__ */ c.jsxs("div", { className: "mb-2 flex items-center justify-between gap-2", children: [
    /* @__PURE__ */ c.jsxs("div", { className: "flex items-center gap-1.5", children: [
      /* @__PURE__ */ c.jsx("span", { className: "h-3 w-0.5 rounded-full bg-gradient-to-b from-accent to-accent/30" }),
      /* @__PURE__ */ c.jsx(e, { className: "h-3.5 w-3.5 text-accent" }),
      /* @__PURE__ */ c.jsx("h2", { className: "text-xs font-semibold text-foreground", children: t })
    ] }),
    r && /* @__PURE__ */ c.jsx("span", { className: "font-mono text-[10px] text-muted", children: r })
  ] });
}
function Wr({ label: e, value: t, sub: r, tone: n = "neutral" }) {
  const o = typeof t == "string" || typeof t == "number", i = n === "bull" ? "text-bull" : n === "bear" ? "text-bear" : n === "accent" ? "text-accent" : "text-foreground";
  return /* @__PURE__ */ c.jsxs("div", { className: "min-w-0 overflow-hidden rounded-lg border border-border bg-surface/80 px-2 py-1 shadow-[0_1px_2px_hsl(var(--border)/0.4)] backdrop-blur-sm transition-all hover:border-accent/30 hover:shadow-[0_2px_8px_hsl(var(--accent)/0.15)]", children: [
    /* @__PURE__ */ c.jsx("div", { className: "flex items-center gap-1 text-[11px] text-muted", children: e }),
    /* @__PURE__ */ c.jsx("div", { className: `mt-1 truncate font-mono text-lg font-semibold leading-none tabular-nums ${o ? i : "text-foreground"}`, children: t }),
    r && /* @__PURE__ */ c.jsx("div", { className: "mt-1 truncate text-[10px] text-muted", children: r })
  ] });
}
function Iv({ item: e }) {
  const t = e.change_pct, r = (Ao(t) ?? 0) >= 0;
  return /* @__PURE__ */ c.jsxs("div", { className: "grid min-w-0 grid-cols-[1fr_auto] items-center gap-x-2 gap-y-0.5 rounded-lg border border-border bg-elevated/45 px-1.5 py-1 shadow-[0_1px_1px_hsl(var(--border)/0.3)] backdrop-blur-sm transition-all hover:border-accent/40 hover:bg-elevated hover:shadow-[0_2px_6px_hsl(var(--accent)/0.15)]", children: [
    /* @__PURE__ */ c.jsx("div", { className: "truncate text-xs font-medium text-foreground", children: e.name || e.symbol }),
    /* @__PURE__ */ c.jsx("div", { className: `font-mono text-xs font-semibold ${kc(t)}`, children: Lv(t) }),
    /* @__PURE__ */ c.jsx("div", { className: "font-mono text-[10px] text-muted", children: e.symbol }),
    /* @__PURE__ */ c.jsxs("div", { className: `flex items-center gap-1 font-mono text-[11px] ${kc(t)}`, children: [
      r ? /* @__PURE__ */ c.jsx(Lg, { className: "h-3 w-3" }) : /* @__PURE__ */ c.jsx(Og, { className: "h-3 w-3" }),
      Ov(e.last_price)
    ] })
  ] });
}
function $v({ data: e }) {
  const t = Math.max(e.total, 1), r = e.up / t * 100, n = e.down / t * 100, o = Math.max(0, 100 - r - n);
  return /* @__PURE__ */ c.jsxs("div", { className: "space-y-2", children: [
    /* @__PURE__ */ c.jsxs("div", { className: "flex h-2.5 overflow-hidden rounded-full bg-elevated", children: [
      /* @__PURE__ */ c.jsx("div", { className: "bg-bull/85", style: { width: `${r}%` } }),
      /* @__PURE__ */ c.jsx("div", { className: "bg-muted/45", style: { width: `${o}%` } }),
      /* @__PURE__ */ c.jsx("div", { className: "bg-bear/85", style: { width: `${n}%` } })
    ] }),
    /* @__PURE__ */ c.jsxs("div", { className: "grid grid-cols-3 gap-1.5 text-[11px]", children: [
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
function Av({ radar: e, score: t }) {
  const l = Fv(t);
  if (!e.length) return /* @__PURE__ */ c.jsx("div", { className: "flex flex-1 items-center justify-center text-xs text-muted", children: "暂无雷达数据" });
  const s = e.map((h, v) => {
    const g = -Math.PI / 2 + v * 2 * Math.PI / e.length, y = 78 * Math.max(0, Math.min(100, h.value)) / 100;
    return {
      ...h,
      x: 120 + Math.cos(g) * y,
      y: 120 + Math.sin(g) * y,
      lx: 120 + Math.cos(g) * 105,
      ly: 120 + Math.sin(g) * 105,
      gx: 120 + Math.cos(g) * 78,
      gy: 120 + Math.sin(g) * 78
    };
  }), a = s.map((h) => `${h.x},${h.y}`).join(" "), u = [1, 0.66, 0.33].map((h, v) => ({
    level: h,
    idx: v,
    points: e.map((g, y) => {
      const x = -Math.PI / 2 + y * 2 * Math.PI / e.length;
      return `${120 + Math.cos(x) * 78 * h},${120 + Math.sin(x) * 78 * h}`;
    }).join(" ")
  }));
  return /* @__PURE__ */ c.jsx("div", { className: "flex min-h-0 flex-1 items-center justify-center", children: /* @__PURE__ */ c.jsxs("svg", { viewBox: "0 0 240 240", className: "h-full max-h-[22rem] w-full", children: [
    /* @__PURE__ */ c.jsxs("defs", { children: [
      /* @__PURE__ */ c.jsxs("radialGradient", { id: "emotionRadarFill", cx: "50%", cy: "45%", r: "70%", children: [
        /* @__PURE__ */ c.jsx("stop", { offset: "0%", stopColor: `${l}57` }),
        /* @__PURE__ */ c.jsx("stop", { offset: "100%", stopColor: `${l}1f` })
      ] }),
      /* @__PURE__ */ c.jsxs("radialGradient", { id: "emotionRadarCenter", cx: "50%", cy: "50%", r: "55%", children: [
        /* @__PURE__ */ c.jsx("stop", { offset: "0%", stopColor: "hsl(var(--surface) / 0.92)" }),
        /* @__PURE__ */ c.jsx("stop", { offset: "68%", stopColor: "hsl(var(--surface) / 0.70)" }),
        /* @__PURE__ */ c.jsx("stop", { offset: "100%", stopColor: "hsl(var(--surface) / 0)" })
      ] })
    ] }),
    u.map((h) => /* @__PURE__ */ c.jsx(
      "polygon",
      {
        points: h.points,
        fill: h.idx % 2 === 0 ? "hsl(var(--elevated) / 0.55)" : "hsl(var(--elevated) / 0.3)",
        stroke: h.level === 1 ? "hsl(var(--border) / 0.9)" : "hsl(var(--border) / 0.5)",
        strokeWidth: h.level === 1 ? 1.2 : 0.8
      },
      h.level
    )),
    s.map((h) => /* @__PURE__ */ c.jsx("line", { x1: 120, y1: 120, x2: h.gx, y2: h.gy, stroke: "hsl(var(--border) / 0.4)" }, h.key)),
    /* @__PURE__ */ c.jsx("polygon", { points: a, fill: "url(#emotionRadarFill)", stroke: l, strokeWidth: "2" }),
    s.map((h) => /* @__PURE__ */ c.jsx("circle", { cx: h.x, cy: h.y, r: "2.8", fill: l, stroke: "hsl(var(--surface) / 0.9)", strokeWidth: "1" }, h.key)),
    /* @__PURE__ */ c.jsx("circle", { cx: 120, cy: 120, r: "29", fill: "url(#emotionRadarCenter)" }),
    /* @__PURE__ */ c.jsx("text", { x: 120, y: 127, textAnchor: "middle", className: "fill-foreground font-mono text-[24px] font-bold", children: t }),
    s.map((h) => /* @__PURE__ */ c.jsx("text", { x: h.lx, y: h.ly + 4, textAnchor: "middle", className: "fill-secondary text-[10px] font-medium", children: h.label }, `${h.key}-label`))
  ] }) });
}
function Uv({ limit: e }) {
  const t = e.tiers.filter((r) => r.boards >= 2).slice(0, 6);
  return /* @__PURE__ */ c.jsxs("div", { className: "space-y-1.5", children: [
    /* @__PURE__ */ c.jsxs("div", { className: "flex items-center justify-between rounded bg-elevated/55 px-2 py-1.5 text-[11px]", children: [
      /* @__PURE__ */ c.jsx("span", { className: "text-muted", children: "封板率" }),
      /* @__PURE__ */ c.jsxs("span", { className: "font-mono text-accent", children: [
        (e.seal_rate ?? 0).toFixed(0),
        "%"
      ] })
    ] }),
    t.length === 0 && /* @__PURE__ */ c.jsx("div", { className: "rounded border border-dashed border-border py-5 text-center text-xs text-muted", children: "暂无 2 板以上" }),
    t.map((r) => {
      const n = r.stocks ?? [], o = n.length > 0 && n.length <= 3;
      return /* @__PURE__ */ c.jsxs("div", { className: "rounded bg-elevated/35 px-2 py-1.5", children: [
        /* @__PURE__ */ c.jsxs("div", { className: "grid grid-cols-[42px_1fr_auto] items-center gap-2", children: [
          /* @__PURE__ */ c.jsxs("span", { className: `font-mono text-sm font-bold ${r.boards >= 5 ? "text-bull" : r.boards >= 3 ? "text-accent" : "text-secondary"}`, children: [
            r.boards,
            "板"
          ] }),
          /* @__PURE__ */ c.jsx("div", { className: "h-1.5 overflow-hidden rounded-full bg-base", children: /* @__PURE__ */ c.jsx("div", { className: "h-full rounded-full bg-bull/70", style: { width: `${Math.min(100, r.count * 12)}%` } }) }),
          /* @__PURE__ */ c.jsx("span", { className: "font-mono text-xs text-foreground", children: r.count })
        ] }),
        o && /* @__PURE__ */ c.jsx("div", { className: "mt-1 flex flex-wrap gap-x-2 gap-y-0.5 pl-[50px]", children: n.map((i) => /* @__PURE__ */ c.jsx("span", { className: "inline-flex items-center gap-0.5 text-[9px] text-secondary", children: i.name || i.symbol }, i.symbol)) })
      ] }, r.boards);
    })
  ] });
}
function Re({ label: e, value: t, cls: r = "text-foreground" }) {
  return /* @__PURE__ */ c.jsxs("div", { className: "flex flex-col justify-center rounded-md bg-elevated/45 px-2 py-1.5 border border-border/40", children: [
    /* @__PURE__ */ c.jsx("div", { className: "text-[10px] text-muted", children: e }),
    /* @__PURE__ */ c.jsx("div", { className: `mt-0.5 font-mono text-xs font-semibold ${r}`, children: t })
  ] });
}
const Qv = { BarChart3: $g, Flame: cp, Sparkles: Hg, Target: Wg }, { BarChart3: Bv, Sparkles: Hv, Flame: Wv, Target: Vv } = Qv;
function Kv() {
  const t = Wa({
    queryKey: ["alerts"],
    queryFn: () => Gv(),
    refetchInterval: 1e4
  }).data ?? [];
  return t.length === 0 ? /* @__PURE__ */ c.jsx("div", { className: "mt-1 py-6 text-center text-[11px] text-muted", children: "暂无触发记录" }) : /* @__PURE__ */ c.jsx("div", { className: "mt-1 max-h-[15rem] space-y-1.5 overflow-y-auto pr-0.5", children: t.map((r, n) => {
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
async function Gv() {
  const e = await fetch("/api/alerts?days=7&limit=10", { headers: { Accept: "application/json" } });
  return e.ok ? (await e.json()).alerts ?? [] : [];
}
function qv() {
  const [e, t] = I.useState(!1), r = Wa({
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
          "涨跌停时间轴 · 东财三池"
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
    /* @__PURE__ */ c.jsx("div", { className: "mb-1.5 grid grid-cols-4 gap-1", children: n.indices.map((l) => /* @__PURE__ */ c.jsx(Iv, { item: l }, l.symbol)) }),
    /* @__PURE__ */ c.jsxs("div", { className: "mb-1.5 grid grid-cols-6 gap-1", children: [
      /* @__PURE__ */ c.jsx(Wr, { label: "个股涨 / 平 / 跌", value: /* @__PURE__ */ c.jsxs(c.Fragment, { children: [
        /* @__PURE__ */ c.jsx("span", { className: "text-bull", children: n.breadth.up }),
        /* @__PURE__ */ c.jsx("span", { className: "text-muted", children: "/" }),
        /* @__PURE__ */ c.jsx("span", { className: "text-muted", children: n.breadth.flat }),
        /* @__PURE__ */ c.jsx("span", { className: "text-muted", children: "/" }),
        /* @__PURE__ */ c.jsx("span", { className: "text-bear", children: n.breadth.down })
      ] }), sub: `上涨率 ${n.breadth.up_pct.toFixed(1)}%` }),
      /* @__PURE__ */ c.jsx(Wr, { label: "强势 / 弱势", value: /* @__PURE__ */ c.jsxs(c.Fragment, { children: [
        /* @__PURE__ */ c.jsx("span", { className: "text-bull", children: n.breadth.strong_up }),
        /* @__PURE__ */ c.jsx("span", { className: "text-muted", children: "/" }),
        /* @__PURE__ */ c.jsx("span", { className: "text-bear", children: n.breadth.strong_down })
      ] }), sub: "涨跌 ≥3%" }),
      /* @__PURE__ */ c.jsx(Wr, { label: "涨停 / 跌停", value: /* @__PURE__ */ c.jsxs(c.Fragment, { children: [
        /* @__PURE__ */ c.jsx("span", { className: "text-bull", children: n.limit.limit_up }),
        /* @__PURE__ */ c.jsx("span", { className: "text-muted", children: "/" }),
        /* @__PURE__ */ c.jsx("span", { className: "text-bear", children: n.limit.limit_down })
      ] }), sub: `封板率 ${(n.limit.seal_rate ?? 0).toFixed(0)}%` }),
      /* @__PURE__ */ c.jsx(Wr, { label: "最高连板", value: `${n.limit.max_boards || 0}板`, sub: `梯队 ${n.limit.tiers.length}`, tone: "accent" }),
      /* @__PURE__ */ c.jsx(Wr, { label: "成交额", value: bc(n.amount.total), sub: `均额 ${bc(n.amount.avg)}` }),
      /* @__PURE__ */ c.jsx(Wr, { label: "换手 / 量比", value: `${n.activity.avg_turnover.toFixed(1)}% / ${n.activity.vol_ratio.toFixed(2)}`, sub: `高换手 ${n.activity.high_turnover} · 放量占比 ${n.activity.high_vol_ratio.toFixed(1)}%`, tone: "accent" })
    ] }),
    /* @__PURE__ */ c.jsx("div", { className: "mb-1.5 min-h-0 max-h-[34rem]", children: /* @__PURE__ */ c.jsx(Rv, {}) }),
    /* @__PURE__ */ c.jsxs("div", { className: "shrink-0 grid grid-cols-1 gap-1.5 xl:grid-cols-[minmax(0,1fr)_20rem]", children: [
      /* @__PURE__ */ c.jsx("main", { className: "min-w-0", children: /* @__PURE__ */ c.jsxs("div", { className: "grid h-full grid-cols-1 gap-1.5 lg:grid-cols-3", children: [
        /* @__PURE__ */ c.jsxs("section", { className: "flex flex-col rounded-card border border-border bg-surface/80 p-1.5 shadow-[0_1px_2px_hsl(var(--border)/0.4)] backdrop-blur-sm", children: [
          /* @__PURE__ */ c.jsx(Kn, { icon: Bv, title: "涨跌分布 / 广度", hint: `${n.breadth.total}只` }),
          /* @__PURE__ */ c.jsx(Dv, { rows: n.distribution }),
          /* @__PURE__ */ c.jsx("div", { className: "mt-auto", children: /* @__PURE__ */ c.jsx($v, { data: n.breadth }) }),
          /* @__PURE__ */ c.jsxs("div", { className: "mt-2 grid grid-cols-2 gap-1.5", children: [
            /* @__PURE__ */ c.jsx(Re, { label: "平均涨跌", value: Sc(n.breadth.avg_pct), cls: Cc(n.breadth.avg_pct) }),
            /* @__PURE__ */ c.jsx(Re, { label: "中位涨跌", value: Sc(n.breadth.median_pct), cls: Cc(n.breadth.median_pct) })
          ] })
        ] }),
        /* @__PURE__ */ c.jsxs("section", { className: "flex flex-col rounded-card border bg-surface/80 p-1.5 shadow-[0_1px_2px_hsl(var(--border)/0.4)] backdrop-blur-sm", style: { borderColor: `${si(o)}40` }, children: [
          /* @__PURE__ */ c.jsx(Kn, { icon: Hv, title: "情绪雷达", hint: `情绪评分 ${o}` }),
          /* @__PURE__ */ c.jsx(Av, { radar: n.radar, score: o })
        ] }),
        /* @__PURE__ */ c.jsxs("section", { className: "flex flex-col gap-2 rounded-card border border-border bg-surface/80 p-1.5 shadow-[0_1px_2px_hsl(var(--border)/0.4)] backdrop-blur-sm", children: [
          /* @__PURE__ */ c.jsxs("div", { className: "flex min-h-0 flex-1 flex-col", children: [
            /* @__PURE__ */ c.jsx(Kn, { icon: Dg, title: "趋势强度", hint: "均线/新高低" }),
            /* @__PURE__ */ c.jsxs("div", { className: "grid min-h-0 flex-1 auto-rows-fr grid-cols-3 gap-1.5", children: [
              /* @__PURE__ */ c.jsx(Re, { label: "站上MA5", value: `${n.trend.above_ma5_pct.toFixed(0)}%`, cls: "text-accent" }),
              /* @__PURE__ */ c.jsx(Re, { label: "站上MA20", value: `${n.trend.above_ma20_pct.toFixed(0)}%`, cls: "text-accent" }),
              /* @__PURE__ */ c.jsx(Re, { label: "站上MA60", value: `${n.trend.above_ma60_pct.toFixed(0)}%`, cls: "text-accent" }),
              /* @__PURE__ */ c.jsx(Re, { label: "60日新高", value: ai(n.trend.new_high), cls: "text-bull" }),
              /* @__PURE__ */ c.jsx(Re, { label: "60日新低", value: ai(n.trend.new_low), cls: "text-bear" }),
              /* @__PURE__ */ c.jsx(Re, { label: "高低比", value: `${n.trend.new_high + n.trend.new_low > 0 ? Math.round(n.trend.new_high / (n.trend.new_high + n.trend.new_low) * 100) : 50}%`, cls: n.trend.new_high >= n.trend.new_low ? "text-bull" : "text-bear" })
            ] })
          ] }),
          /* @__PURE__ */ c.jsxs("div", { className: "flex min-h-0 flex-1 flex-col border-t border-border pt-1.5", children: [
            /* @__PURE__ */ c.jsx(Kn, { icon: Vv, title: "实用监控", hint: "盘中观察" }),
            /* @__PURE__ */ c.jsxs("div", { className: "grid min-h-0 flex-1 auto-rows-fr grid-cols-3 gap-1.5", children: [
              /* @__PURE__ */ c.jsx(Re, { label: "炸板", value: `${n.limit.broken ?? 0}`, cls: "text-warning" }),
              /* @__PURE__ */ c.jsx(Re, { label: "跌停", value: `${n.limit.limit_down ?? 0}`, cls: "text-bear" }),
              /* @__PURE__ */ c.jsx(Re, { label: "站上MA60", value: `${n.trend.above_ma60_pct.toFixed(0)}%`, cls: "text-accent" }),
              /* @__PURE__ */ c.jsx(Re, { label: "新高/新低", value: `${ai(n.trend.new_high)}/${ai(n.trend.new_low)}`, cls: n.trend.new_high >= n.trend.new_low ? "text-bull" : "text-bear" }),
              /* @__PURE__ */ c.jsx(Re, { label: "高换手数", value: `${n.activity.high_turnover}`, cls: "text-accent" }),
              /* @__PURE__ */ c.jsx(Re, { label: "放量占比", value: `${n.activity.high_vol_ratio.toFixed(1)}%`, cls: "text-accent" })
            ] })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ c.jsxs("aside", { className: "min-w-0 space-y-1.5", children: [
        /* @__PURE__ */ c.jsxs("section", { className: "rounded-card border border-border bg-surface/80 p-1.5 shadow-[0_1px_2px_hsl(var(--border)/0.4)] backdrop-blur-sm", children: [
          /* @__PURE__ */ c.jsx(Kn, { icon: Wv, title: "涨停梯队", hint: `涨停 ${n.limit.limit_up}` }),
          /* @__PURE__ */ c.jsx(Uv, { limit: n.limit })
        ] }),
        /* @__PURE__ */ c.jsxs("section", { className: "rounded-card border border-border bg-surface/80 p-1.5 shadow-[0_1px_2px_hsl(var(--border)/0.4)] backdrop-blur-sm", children: [
          /* @__PURE__ */ c.jsx("div", { className: "mb-2 flex items-center justify-between gap-2", children: /* @__PURE__ */ c.jsxs("div", { className: "flex items-center gap-1.5", children: [
            /* @__PURE__ */ c.jsx(Ig, { className: "h-3.5 w-3.5 text-accent" }),
            /* @__PURE__ */ c.jsx("h2", { className: "text-xs font-semibold text-foreground", children: "监控中心" }),
            /* @__PURE__ */ c.jsx("span", { className: "font-mono text-[10px] text-muted", children: "实时信号" })
          ] }) }),
          /* @__PURE__ */ c.jsx(Kv, {})
        ] })
      ] })
    ] })
  ] }) : /* @__PURE__ */ c.jsx("div", { className: "flex h-full items-center justify-center text-sm text-muted", children: r.isError ? "看板数据加载失败，请点「重载」重试" : "正在加载看板数据…" });
}
function si(e) {
  return e >= 70 ? "#F04438" : e >= 55 ? "#FB923C" : e >= 45 ? "#F59E0B" : e >= 30 ? "#84CC16" : "#12B76A";
}
function Sc(e) {
  return typeof e != "number" || !Number.isFinite(e) ? "—" : `${e >= 0 ? "+" : ""}${(e * 100).toFixed(2)}%`;
}
function Cc(e) {
  return typeof e != "number" || !Number.isFinite(e) || e === 0 ? "text-muted" : e > 0 ? "text-bull" : "text-bear";
}
function ai(e) {
  return typeof e != "number" || !Number.isFinite(e) ? "—" : e >= 1e3 ? `${(e / 1e3).toFixed(1)}k` : e.toFixed(0);
}
const $l = /* @__PURE__ */ new WeakMap(), Yv = "tf-theme", Ec = "tf-theme-change";
function Xv() {
  let e = null;
  try {
    e = localStorage.getItem(Yv);
  } catch {
  }
  return document.documentElement.classList.contains("dark") ? !0 : e !== "light";
}
function Zv(e) {
  e.innerHTML = "", e.style.display = "block", e.style.height = "100%", e.style.minHeight = "0";
  const t = e.shadowRoot ?? e.attachShadow({ mode: "open" });
  t.innerHTML = "";
  const r = document.createElement("style");
  r.textContent = Mg, t.appendChild(r);
  const n = document.createElement("div");
  n.className = "as-root", n.style.height = "100%", n.style.minHeight = "0", t.appendChild(n);
  const o = () => n.classList.toggle("dark", Xv());
  o(), window.addEventListener(Ec, o), window.addEventListener("storage", o);
  const i = new MutationObserver(o);
  i.observe(document.documentElement, { attributes: !0, attributeFilter: ["class"] });
  const l = new dg({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: !1 } } }), s = Gf(n);
  return s.render(
    Za.createElement(
      xg,
      { client: l },
      Za.createElement(qv)
    )
  ), $l.set(e, s), () => {
    window.removeEventListener(Ec, o), window.removeEventListener("storage", o), i.disconnect(), $l.get(e)?.unmount(), $l.delete(e), t.innerHTML = "", e.innerHTML = "";
  };
}
const ey = {
  id: "tsp.new-dashboard",
  apiVersion: 1,
  routes: [{ id: "new-dashboard", path: "/custom/new-dashboard", mount: Zv }],
  navigation: [{ id: "new-dashboard", routeId: "new-dashboard", label: "新看板", icon: "LayoutDashboard" }]
};
export {
  ey as default
};
