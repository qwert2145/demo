﻿///<jscompress sourcefile="zepto.js" />
//     Zepto.js
//     (c) 2010-2014 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

var Zepto = (function() {
  var undefined, key, $, classList, emptyArray = [], slice = emptyArray.slice, filter = emptyArray.filter,
    document = window.document,
    elementDisplay = {}, classCache = {},
    cssNumber = { 'column-count': 1, 'columns': 1, 'font-weight': 1, 'line-height': 1,'opacity': 1, 'z-index': 1, 'zoom': 1 },
    fragmentRE = /^\s*<(\w+|!)[^>]*>/,
    singleTagRE = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,
    tagExpanderRE = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,
    rootNodeRE = /^(?:body|html)$/i,
    capitalRE = /([A-Z])/g,

    // special attributes that should be get/set via method calls
    methodAttributes = ['val', 'css', 'html', 'text', 'data', 'width', 'height', 'offset'],

    adjacencyOperators = [ 'after', 'prepend', 'before', 'append' ],
    table = document.createElement('table'),
    tableRow = document.createElement('tr'),
    containers = {
      'tr': document.createElement('tbody'),
      'tbody': table, 'thead': table, 'tfoot': table,
      'td': tableRow, 'th': tableRow,
      '*': document.createElement('div')
    },
    readyRE = /complete|loaded|interactive/,
    simpleSelectorRE = /^[\w-]*$/,
    class2type = {},
    toString = class2type.toString,
    zepto = {},
    camelize, uniq,
    tempParent = document.createElement('div'),
    propMap = {
      'tabindex': 'tabIndex',
      'readonly': 'readOnly',
      'for': 'htmlFor',
      'class': 'className',
      'maxlength': 'maxLength',
      'cellspacing': 'cellSpacing',
      'cellpadding': 'cellPadding',
      'rowspan': 'rowSpan',
      'colspan': 'colSpan',
      'usemap': 'useMap',
      'frameborder': 'frameBorder',
      'contenteditable': 'contentEditable'
    },
    isArray = Array.isArray ||
      function(object){ return object instanceof Array }

  zepto.matches = function(element, selector) {
    if (!selector || !element || element.nodeType !== 1) return false
    var matchesSelector = element.webkitMatchesSelector || element.mozMatchesSelector ||
                          element.oMatchesSelector || element.matchesSelector
    if (matchesSelector) return matchesSelector.call(element, selector)
    // fall back to performing a selector:
    var match, parent = element.parentNode, temp = !parent
    if (temp) (parent = tempParent).appendChild(element)
    match = ~zepto.qsa(parent, selector).indexOf(element)
    temp && tempParent.removeChild(element)
    return match
  }

  function type(obj) {
    return obj == null ? String(obj) :
      class2type[toString.call(obj)] || "object"
  }

  function isFunction(value) { return type(value) == "function" }
  function isWindow(obj)     { return obj != null && obj == obj.window }
  function isDocument(obj)   { return obj != null && obj.nodeType == obj.DOCUMENT_NODE }
  function isObject(obj)     { return type(obj) == "object" }
  function isPlainObject(obj) {
    return isObject(obj) && !isWindow(obj) && Object.getPrototypeOf(obj) == Object.prototype
  }
  function likeArray(obj) { return typeof obj.length == 'number' }

  function compact(array) { return filter.call(array, function(item){ return item != null }) }
  function flatten(array) { return array.length > 0 ? $.fn.concat.apply([], array) : array }
  camelize = function(str){ return str.replace(/-+(.)?/g, function(match, chr){ return chr ? chr.toUpperCase() : '' }) }
  function dasherize(str) {
    return str.replace(/::/g, '/')
           .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
           .replace(/([a-z\d])([A-Z])/g, '$1_$2')
           .replace(/_/g, '-')
           .toLowerCase()
  }
  uniq = function(array){ return filter.call(array, function(item, idx){ return array.indexOf(item) == idx }) }

  function classRE(name) {
    return name in classCache ?
      classCache[name] : (classCache[name] = new RegExp('(^|\\s)' + name + '(\\s|$)'))
  }

  function maybeAddPx(name, value) {
    return (typeof value == "number" && !cssNumber[dasherize(name)]) ? value + "px" : value
  }

  function defaultDisplay(nodeName) {
    var element, display
    if (!elementDisplay[nodeName]) {
      element = document.createElement(nodeName)
      document.body.appendChild(element)
      display = getComputedStyle(element, '').getPropertyValue("display")
      element.parentNode.removeChild(element)
      display == "none" && (display = "block")
      elementDisplay[nodeName] = display
    }
    return elementDisplay[nodeName]
  }

  function children(element) {
    return 'children' in element ?
      slice.call(element.children) :
      $.map(element.childNodes, function(node){ if (node.nodeType == 1) return node })
  }

  // `$.zepto.fragment` takes a html string and an optional tag name
  // to generate DOM nodes nodes from the given html string.
  // The generated DOM nodes are returned as an array.
  // This function can be overriden in plugins for example to make
  // it compatible with browsers that don't support the DOM fully.
  zepto.fragment = function(html, name, properties) {
    var dom, nodes, container

    // A special case optimization for a single tag
    if (singleTagRE.test(html)) dom = $(document.createElement(RegExp.$1))

    if (!dom) {
      if (html.replace) html = html.replace(tagExpanderRE, "<$1></$2>")
      if (name === undefined) name = fragmentRE.test(html) && RegExp.$1
      if (!(name in containers)) name = '*'

      container = containers[name]
      container.innerHTML = '' + html
      dom = $.each(slice.call(container.childNodes), function(){
        container.removeChild(this)
      })
    }

    if (isPlainObject(properties)) {
      nodes = $(dom)
      $.each(properties, function(key, value) {
        if (methodAttributes.indexOf(key) > -1) nodes[key](value)
        else nodes.attr(key, value)
      })
    }

    return dom
  }

  // `$.zepto.Z` swaps out the prototype of the given `dom` array
  // of nodes with `$.fn` and thus supplying all the Zepto functions
  // to the array. Note that `__proto__` is not supported on Internet
  // Explorer. This method can be overriden in plugins.
  zepto.Z = function(dom, selector) {
    dom = dom || []
    dom.__proto__ = $.fn
    dom.selector = selector || ''
    return dom
  }

  // `$.zepto.isZ` should return `true` if the given object is a Zepto
  // collection. This method can be overriden in plugins.
  zepto.isZ = function(object) {
    return object instanceof zepto.Z
  }

  // `$.zepto.init` is Zepto's counterpart to jQuery's `$.fn.init` and
  // takes a CSS selector and an optional context (and handles various
  // special cases).
  // This method can be overriden in plugins.
  zepto.init = function(selector, context) {
    var dom
    // If nothing given, return an empty Zepto collection
    if (!selector) return zepto.Z()
    // Optimize for string selectors
    else if (typeof selector == 'string') {
      selector = selector.trim()
      // If it's a html fragment, create nodes from it
      // Note: In both Chrome 21 and Firefox 15, DOM error 12
      // is thrown if the fragment doesn't begin with <
      if (selector[0] == '<' && fragmentRE.test(selector))
        dom = zepto.fragment(selector, RegExp.$1, context), selector = null
      // If there's a context, create a collection on that context first, and select
      // nodes from there
      else if (context !== undefined) return $(context).find(selector)
      // If it's a CSS selector, use it to select nodes.
      else dom = zepto.qsa(document, selector)
    }
    // If a function is given, call it when the DOM is ready
    else if (isFunction(selector)) return $(document).ready(selector)
    // If a Zepto collection is given, just return it
    else if (zepto.isZ(selector)) return selector
    else {
      // normalize array if an array of nodes is given
      if (isArray(selector)) dom = compact(selector)
      // Wrap DOM nodes.
      else if (isObject(selector))
        dom = [selector], selector = null
      // If it's a html fragment, create nodes from it
      else if (fragmentRE.test(selector))
        dom = zepto.fragment(selector.trim(), RegExp.$1, context), selector = null
      // If there's a context, create a collection on that context first, and select
      // nodes from there
      else if (context !== undefined) return $(context).find(selector)
      // And last but no least, if it's a CSS selector, use it to select nodes.
      else dom = zepto.qsa(document, selector)
    }
    // create a new Zepto collection from the nodes found
    return zepto.Z(dom, selector)
  }

  // `$` will be the base `Zepto` object. When calling this
  // function just call `$.zepto.init, which makes the implementation
  // details of selecting nodes and creating Zepto collections
  // patchable in plugins.
  $ = function(selector, context){
    return zepto.init(selector, context)
  }

  function extend(target, source, deep) {
    for (key in source)
      if (deep && (isPlainObject(source[key]) || isArray(source[key]))) {
        if (isPlainObject(source[key]) && !isPlainObject(target[key]))
          target[key] = {}
        if (isArray(source[key]) && !isArray(target[key]))
          target[key] = []
        extend(target[key], source[key], deep)
      }
      else if (source[key] !== undefined) target[key] = source[key]
  }

  // Copy all but undefined properties from one or more
  // objects to the `target` object.
  $.extend = function(target){
    var deep, args = slice.call(arguments, 1)
    if (typeof target == 'boolean') {
      deep = target
      target = args.shift()
    }
    args.forEach(function(arg){ extend(target, arg, deep) })
    return target
  }

  // `$.zepto.qsa` is Zepto's CSS selector implementation which
  // uses `document.querySelectorAll` and optimizes for some special cases, like `#id`.
  // This method can be overriden in plugins.
  zepto.qsa = function(element, selector){
    var found,
        maybeID = selector[0] == '#',
        maybeClass = !maybeID && selector[0] == '.',
        nameOnly = maybeID || maybeClass ? selector.slice(1) : selector, // Ensure that a 1 char tag name still gets checked
        isSimple = simpleSelectorRE.test(nameOnly)
    return (isDocument(element) && isSimple && maybeID) ?
      ( (found = element.getElementById(nameOnly)) ? [found] : [] ) :
      (element.nodeType !== 1 && element.nodeType !== 9) ? [] :
      slice.call(
        isSimple && !maybeID ?
          maybeClass ? element.getElementsByClassName(nameOnly) : // If it's simple, it could be a class
          element.getElementsByTagName(selector) : // Or a tag
          element.querySelectorAll(selector) // Or it's not simple, and we need to query all
      )
  }

  function filtered(nodes, selector) {
    return selector == null ? $(nodes) : $(nodes).filter(selector)
  }

  $.contains = document.documentElement.contains ?
    function(parent, node) {
      return parent !== node && parent.contains(node)
    } :
    function(parent, node) {
      while (node && (node = node.parentNode))
        if (node === parent) return true
      return false
    }

  function funcArg(context, arg, idx, payload) {
    return isFunction(arg) ? arg.call(context, idx, payload) : arg
  }

  function setAttribute(node, name, value) {
    value == null ? node.removeAttribute(name) : node.setAttribute(name, value)
  }

  // access className property while respecting SVGAnimatedString
  function className(node, value){
    var klass = node.className || '',
        svg   = klass && klass.baseVal !== undefined

    if (value === undefined) return svg ? klass.baseVal : klass
    svg ? (klass.baseVal = value) : (node.className = value)
  }

  // "true"  => true
  // "false" => false
  // "null"  => null
  // "42"    => 42
  // "42.5"  => 42.5
  // "08"    => "08"
  // JSON    => parse if valid
  // String  => self
  function deserializeValue(value) {
    var num
    try {
      return value ?
        value == "true" ||
        ( value == "false" ? false :
          value == "null" ? null :
          !/^0/.test(value) && !isNaN(num = Number(value)) ? num :
          /^[\[\{]/.test(value) ? $.parseJSON(value) :
          value )
        : value
    } catch(e) {
      return value
    }
  }

  $.type = type
  $.isFunction = isFunction
  $.isWindow = isWindow
  $.isArray = isArray
  $.isPlainObject = isPlainObject

  $.isEmptyObject = function(obj) {
    var name
    for (name in obj) return false
    return true
  }

  $.inArray = function(elem, array, i){
    return emptyArray.indexOf.call(array, elem, i)
  }

  $.camelCase = camelize
  $.trim = function(str) {
    return str == null ? "" : String.prototype.trim.call(str)
  }

  // plugin compatibility
  $.uuid = 0
  $.support = { }
  $.expr = { }

  $.map = function(elements, callback){
    var value, values = [], i, key
    if (likeArray(elements))
      for (i = 0; i < elements.length; i++) {
        value = callback(elements[i], i)
        if (value != null) values.push(value)
      }
    else
      for (key in elements) {
        value = callback(elements[key], key)
        if (value != null) values.push(value)
      }
    return flatten(values)
  }

  $.each = function(elements, callback){
    var i, key
    if (likeArray(elements)) {
      for (i = 0; i < elements.length; i++)
        if (callback.call(elements[i], i, elements[i]) === false) return elements
    } else {
      for (key in elements)
        if (callback.call(elements[key], key, elements[key]) === false) return elements
    }

    return elements
  }

  $.grep = function(elements, callback){
    return filter.call(elements, callback)
  }

  if (window.JSON) $.parseJSON = JSON.parse

  // Populate the class2type map
  $.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(i, name) {
    class2type[ "[object " + name + "]" ] = name.toLowerCase()
  })

  // Define methods that will be available on all
  // Zepto collections
  $.fn = {
    // Because a collection acts like an array
    // copy over these useful array functions.
    forEach: emptyArray.forEach,
    reduce: emptyArray.reduce,
    push: emptyArray.push,
    sort: emptyArray.sort,
    indexOf: emptyArray.indexOf,
    concat: emptyArray.concat,

    // `map` and `slice` in the jQuery API work differently
    // from their array counterparts
    map: function(fn){
      return $($.map(this, function(el, i){ return fn.call(el, i, el) }))
    },
    slice: function(){
      return $(slice.apply(this, arguments))
    },

    ready: function(callback){
      // need to check if document.body exists for IE as that browser reports
      // document ready when it hasn't yet created the body element
      if (readyRE.test(document.readyState) && document.body) callback($)
      else document.addEventListener('DOMContentLoaded', function(){ callback($) }, false)
      return this
    },
    get: function(idx){
      return idx === undefined ? slice.call(this) : this[idx >= 0 ? idx : idx + this.length]
    },
    toArray: function(){ return this.get() },
    size: function(){
      return this.length
    },
    remove: function(){
      return this.each(function(){
        if (this.parentNode != null)
          this.parentNode.removeChild(this)
      })
    },
    each: function(callback){
      emptyArray.every.call(this, function(el, idx){
        return callback.call(el, idx, el) !== false
      })
      return this
    },
    filter: function(selector){
      if (isFunction(selector)) return this.not(this.not(selector))
      return $(filter.call(this, function(element){
        return zepto.matches(element, selector)
      }))
    },
    add: function(selector,context){
      return $(uniq(this.concat($(selector,context))))
    },
    is: function(selector){
      return this.length > 0 && zepto.matches(this[0], selector)
    },
    not: function(selector){
      var nodes=[]
      if (isFunction(selector) && selector.call !== undefined)
        this.each(function(idx){
          if (!selector.call(this,idx)) nodes.push(this)
        })
      else {
        var excludes = typeof selector == 'string' ? this.filter(selector) :
          (likeArray(selector) && isFunction(selector.item)) ? slice.call(selector) : $(selector)
        this.forEach(function(el){
          if (excludes.indexOf(el) < 0) nodes.push(el)
        })
      }
      return $(nodes)
    },
    has: function(selector){
      return this.filter(function(){
        return isObject(selector) ?
          $.contains(this, selector) :
          $(this).find(selector).size()
      })
    },
    eq: function(idx){
      return idx === -1 ? this.slice(idx) : this.slice(idx, + idx + 1)
    },
    first: function(){
      var el = this[0]
      return el && !isObject(el) ? el : $(el)
    },
    last: function(){
      var el = this[this.length - 1]
      return el && !isObject(el) ? el : $(el)
    },
    find: function(selector){
      var result, $this = this
      if (!selector) result = []
      else if (typeof selector == 'object')
        result = $(selector).filter(function(){
          var node = this
          return emptyArray.some.call($this, function(parent){
            return $.contains(parent, node)
          })
        })
      else if (this.length == 1) result = $(zepto.qsa(this[0], selector))
      else result = this.map(function(){ return zepto.qsa(this, selector) })
      return result
    },
    closest: function(selector, context){
      var node = this[0], collection = false
      if (typeof selector == 'object') collection = $(selector)
      while (node && !(collection ? collection.indexOf(node) >= 0 : zepto.matches(node, selector)))
        node = node !== context && !isDocument(node) && node.parentNode
      return $(node)
    },
    parents: function(selector){
      var ancestors = [], nodes = this
      while (nodes.length > 0)
        nodes = $.map(nodes, function(node){
          if ((node = node.parentNode) && !isDocument(node) && ancestors.indexOf(node) < 0) {
            ancestors.push(node)
            return node
          }
        })
      return filtered(ancestors, selector)
    },
    parent: function(selector){
      return filtered(uniq(this.pluck('parentNode')), selector)
    },
    children: function(selector){
      return filtered(this.map(function(){ return children(this) }), selector)
    },
    contents: function() {
      return this.map(function() { return slice.call(this.childNodes) })
    },
    siblings: function(selector){
      return filtered(this.map(function(i, el){
        return filter.call(children(el.parentNode), function(child){ return child!==el })
      }), selector)
    },
    empty: function(){
      return this.each(function(){ this.innerHTML = '' })
    },
    // `pluck` is borrowed from Prototype.js
    pluck: function(property){
      return $.map(this, function(el){ return el[property] })
    },
    show: function(){
      return this.each(function(){
        this.style.display == "none" && (this.style.display = '')
        if (getComputedStyle(this, '').getPropertyValue("display") == "none")
          this.style.display = defaultDisplay(this.nodeName)
      })
    },
    replaceWith: function(newContent){
      return this.before(newContent).remove()
    },
    wrap: function(structure){
      var func = isFunction(structure)
      if (this[0] && !func)
        var dom   = $(structure).get(0),
            clone = dom.parentNode || this.length > 1

      return this.each(function(index){
        $(this).wrapAll(
          func ? structure.call(this, index) :
            clone ? dom.cloneNode(true) : dom
        )
      })
    },
    wrapAll: function(structure){
      if (this[0]) {
        $(this[0]).before(structure = $(structure))
        var children
        // drill down to the inmost element
        while ((children = structure.children()).length) structure = children.first()
        $(structure).append(this)
      }
      return this
    },
    wrapInner: function(structure){
      var func = isFunction(structure)
      return this.each(function(index){
        var self = $(this), contents = self.contents(),
            dom  = func ? structure.call(this, index) : structure
        contents.length ? contents.wrapAll(dom) : self.append(dom)
      })
    },
    unwrap: function(){
      this.parent().each(function(){
        $(this).replaceWith($(this).children())
      })
      return this
    },
    clone: function(){
      return this.map(function(){ return this.cloneNode(true) })
    },
    hide: function(){
      return this.css("display", "none")
    },
    toggle: function(setting){
      return this.each(function(){
        var el = $(this)
        ;(setting === undefined ? el.css("display") == "none" : setting) ? el.show() : el.hide()
      })
    },
    prev: function(selector){ return $(this.pluck('previousElementSibling')).filter(selector || '*') },
    next: function(selector){ return $(this.pluck('nextElementSibling')).filter(selector || '*') },
    html: function(html){
      return 0 in arguments ?
        this.each(function(idx){
          var originHtml = this.innerHTML
          $(this).empty().append( funcArg(this, html, idx, originHtml) )
        }) :
        (0 in this ? this[0].innerHTML : null)
    },
    text: function(text){
      return 0 in arguments ?
        this.each(function(idx){
          var newText = funcArg(this, text, idx, this.textContent)
          this.textContent = newText == null ? '' : ''+newText
        }) :
        (0 in this ? this[0].textContent : null)
    },
    attr: function(name, value){
      var result
      return (typeof name == 'string' && !(1 in arguments)) ?
        (!this.length || this[0].nodeType !== 1 ? undefined :
          (!(result = this[0].getAttribute(name)) && name in this[0]) ? this[0][name] : result
        ) :
        this.each(function(idx){
          if (this.nodeType !== 1) return
          if (isObject(name)) for (key in name) setAttribute(this, key, name[key])
          else setAttribute(this, name, funcArg(this, value, idx, this.getAttribute(name)))
        })
    },
    removeAttr: function(name){
      return this.each(function(){ this.nodeType === 1 && setAttribute(this, name) })
    },
    prop: function(name, value){
      name = propMap[name] || name
      return (1 in arguments) ?
        this.each(function(idx){
          this[name] = funcArg(this, value, idx, this[name])
        }) :
        (this[0] && this[0][name])
    },
    data: function(name, value){
      var attrName = 'data-' + name.replace(capitalRE, '-$1').toLowerCase()

      var data = (1 in arguments) ?
        this.attr(attrName, value) :
        this.attr(attrName)

      return data !== null ? deserializeValue(data) : undefined
    },
    val: function(value){
      return 0 in arguments ?
        this.each(function(idx){
          this.value = funcArg(this, value, idx, this.value)
        }) :
        (this[0] && (this[0].multiple ?
           $(this[0]).find('option').filter(function(){ return this.selected }).pluck('value') :
           this[0].value)
        )
    },
    offset: function(coordinates){
      if (coordinates) return this.each(function(index){
        var $this = $(this),
            coords = funcArg(this, coordinates, index, $this.offset()),
            parentOffset = $this.offsetParent().offset(),
            props = {
              top:  coords.top  - parentOffset.top,
              left: coords.left - parentOffset.left
            }

        if ($this.css('position') == 'static') props['position'] = 'relative'
        $this.css(props)
      })
      if (!this.length) return null
      var obj = this[0].getBoundingClientRect()
      return {
        left: obj.left + window.pageXOffset,
        top: obj.top + window.pageYOffset,
        width: Math.round(obj.width),
        height: Math.round(obj.height)
      }
    },
    css: function(property, value){
      if (arguments.length < 2) {
        var element = this[0], computedStyle = getComputedStyle(element, '')
        if(!element) return
        if (typeof property == 'string')
          return element.style[camelize(property)] || computedStyle.getPropertyValue(property)
        else if (isArray(property)) {
          var props = {}
          $.each(property, function(_, prop){
            props[prop] = (element.style[camelize(prop)] || computedStyle.getPropertyValue(prop))
          })
          return props
        }
      }

      var css = ''
      if (type(property) == 'string') {
        if (!value && value !== 0)
          this.each(function(){ this.style.removeProperty(dasherize(property)) })
        else
          css = dasherize(property) + ":" + maybeAddPx(property, value)
      } else {
        for (key in property)
          if (!property[key] && property[key] !== 0)
            this.each(function(){ this.style.removeProperty(dasherize(key)) })
          else
            css += dasherize(key) + ':' + maybeAddPx(key, property[key]) + ';'
      }

      return this.each(function(){ this.style.cssText += ';' + css })
    },
    index: function(element){
      return element ? this.indexOf($(element)[0]) : this.parent().children().indexOf(this[0])
    },
    hasClass: function(name){
      if (!name) return false
      return emptyArray.some.call(this, function(el){
        return this.test(className(el))
      }, classRE(name))
    },
    addClass: function(name){
      if (!name) return this
      return this.each(function(idx){
        if (!('className' in this)) return
        classList = []
        var cls = className(this), newName = funcArg(this, name, idx, cls)
        newName.split(/\s+/g).forEach(function(klass){
          if (!$(this).hasClass(klass)) classList.push(klass)
        }, this)
        classList.length && className(this, cls + (cls ? " " : "") + classList.join(" "))
      })
    },
    removeClass: function(name){
      return this.each(function(idx){
        if (!('className' in this)) return
        if (name === undefined) return className(this, '')
        classList = className(this)
        funcArg(this, name, idx, classList).split(/\s+/g).forEach(function(klass){
          classList = classList.replace(classRE(klass), " ")
        })
        className(this, classList.trim())
      })
    },
    toggleClass: function(name, when){
      if (!name) return this
      return this.each(function(idx){
        var $this = $(this), names = funcArg(this, name, idx, className(this))
        names.split(/\s+/g).forEach(function(klass){
          (when === undefined ? !$this.hasClass(klass) : when) ?
            $this.addClass(klass) : $this.removeClass(klass)
        })
      })
    },
    scrollTop: function(value){
      if (!this.length) return
      var hasScrollTop = 'scrollTop' in this[0]
      if (value === undefined) return hasScrollTop ? this[0].scrollTop : this[0].pageYOffset
      return this.each(hasScrollTop ?
        function(){ this.scrollTop = value } :
        function(){ this.scrollTo(this.scrollX, value) })
    },
    scrollLeft: function(value){
      if (!this.length) return
      var hasScrollLeft = 'scrollLeft' in this[0]
      if (value === undefined) return hasScrollLeft ? this[0].scrollLeft : this[0].pageXOffset
      return this.each(hasScrollLeft ?
        function(){ this.scrollLeft = value } :
        function(){ this.scrollTo(value, this.scrollY) })
    },
    position: function() {
      if (!this.length) return

      var elem = this[0],
        // Get *real* offsetParent
        offsetParent = this.offsetParent(),
        // Get correct offsets
        offset       = this.offset(),
        parentOffset = rootNodeRE.test(offsetParent[0].nodeName) ? { top: 0, left: 0 } : offsetParent.offset()

      // Subtract element margins
      // note: when an element has margin: auto the offsetLeft and marginLeft
      // are the same in Safari causing offset.left to incorrectly be 0
      offset.top  -= parseFloat( $(elem).css('margin-top') ) || 0
      offset.left -= parseFloat( $(elem).css('margin-left') ) || 0

      // Add offsetParent borders
      parentOffset.top  += parseFloat( $(offsetParent[0]).css('border-top-width') ) || 0
      parentOffset.left += parseFloat( $(offsetParent[0]).css('border-left-width') ) || 0

      // Subtract the two offsets
      return {
        top:  offset.top  - parentOffset.top,
        left: offset.left - parentOffset.left
      }
    },
    offsetParent: function() {
      return this.map(function(){
        var parent = this.offsetParent || document.body
        while (parent && !rootNodeRE.test(parent.nodeName) && $(parent).css("position") == "static")
          parent = parent.offsetParent
        return parent
      })
    }
  }

  // for now
  $.fn.detach = $.fn.remove

  // Generate the `width` and `height` functions
  ;['width', 'height'].forEach(function(dimension){
    var dimensionProperty =
      dimension.replace(/./, function(m){ return m[0].toUpperCase() })

    $.fn[dimension] = function(value){
      var offset, el = this[0]
      if (value === undefined) return isWindow(el) ? el['inner' + dimensionProperty] :
        isDocument(el) ? el.documentElement['scroll' + dimensionProperty] :
        (offset = this.offset()) && offset[dimension]
      else return this.each(function(idx){
        el = $(this)
        el.css(dimension, funcArg(this, value, idx, el[dimension]()))
      })
    }
  })

  function traverseNode(node, fun) {
    fun(node)
    for (var i = 0, len = node.childNodes.length; i < len; i++)
      traverseNode(node.childNodes[i], fun)
  }

  // Generate the `after`, `prepend`, `before`, `append`,
  // `insertAfter`, `insertBefore`, `appendTo`, and `prependTo` methods.
  adjacencyOperators.forEach(function(operator, operatorIndex) {
    var inside = operatorIndex % 2 //=> prepend, append

    $.fn[operator] = function(){
      // arguments can be nodes, arrays of nodes, Zepto objects and HTML strings
      var argType, nodes = $.map(arguments, function(arg) {
            argType = type(arg)
            return argType == "object" || argType == "array" || arg == null ?
              arg : zepto.fragment(arg)
          }),
          parent, copyByClone = this.length > 1
      if (nodes.length < 1) return this

      return this.each(function(_, target){
        parent = inside ? target : target.parentNode

        // convert all methods to a "before" operation
        target = operatorIndex == 0 ? target.nextSibling :
                 operatorIndex == 1 ? target.firstChild :
                 operatorIndex == 2 ? target :
                 null

        var parentInDocument = $.contains(document.documentElement, parent)

        nodes.forEach(function(node){
          if (copyByClone) node = node.cloneNode(true)
          else if (!parent) return $(node).remove()

          parent.insertBefore(node, target)
          if (parentInDocument) traverseNode(node, function(el){
            if (el.nodeName != null && el.nodeName.toUpperCase() === 'SCRIPT' &&
               (!el.type || el.type === 'text/javascript') && !el.src)
              window['eval'].call(window, el.innerHTML)
          })
        })
      })
    }

    // after    => insertAfter
    // prepend  => prependTo
    // before   => insertBefore
    // append   => appendTo
    $.fn[inside ? operator+'To' : 'insert'+(operatorIndex ? 'Before' : 'After')] = function(html){
      $(html)[operator](this)
      return this
    }
  })

  zepto.Z.prototype = $.fn

  // Export internal API functions in the `$.zepto` namespace
  zepto.uniq = uniq
  zepto.deserializeValue = deserializeValue
  $.zepto = zepto

  return $
})()

// If `$` is not yet defined, point it to `Zepto`
window.Zepto = Zepto
window.$ === undefined && (window.$ = Zepto)

//     Zepto.js
//     (c) 2010-2014 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function($){
  var jsonpID = 0,
      document = window.document,
      key,
      name,
      rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      scriptTypeRE = /^(?:text|application)\/javascript/i,
      xmlTypeRE = /^(?:text|application)\/xml/i,
      jsonType = 'application/json',
      htmlType = 'text/html',
      blankRE = /^\s*$/

  // trigger a custom event and return false if it was cancelled
  function triggerAndReturn(context, eventName, data) {
    var event = $.Event(eventName)
    $(context).trigger(event, data)
    return !event.isDefaultPrevented()
  }

  // trigger an Ajax "global" event
  function triggerGlobal(settings, context, eventName, data) {
    if (settings.global) return triggerAndReturn(context || document, eventName, data)
  }

  // Number of active Ajax requests
  $.active = 0

  function ajaxStart(settings) {
    if (settings.global && $.active++ === 0) triggerGlobal(settings, null, 'ajaxStart')
  }
  function ajaxStop(settings) {
    if (settings.global && !(--$.active)) triggerGlobal(settings, null, 'ajaxStop')
  }

  // triggers an extra global event "ajaxBeforeSend" that's like "ajaxSend" but cancelable
  function ajaxBeforeSend(xhr, settings) {
    var context = settings.context
    if (settings.beforeSend.call(context, xhr, settings) === false ||
        triggerGlobal(settings, context, 'ajaxBeforeSend', [xhr, settings]) === false)
      return false

    triggerGlobal(settings, context, 'ajaxSend', [xhr, settings])
  }
  function ajaxSuccess(data, xhr, settings, deferred) {
    var context = settings.context, status = 'success'
    settings.success.call(context, data, status, xhr)
    if (deferred) deferred.resolveWith(context, [data, status, xhr])
    triggerGlobal(settings, context, 'ajaxSuccess', [xhr, settings, data])
    ajaxComplete(status, xhr, settings)
  }
  // type: "timeout", "error", "abort", "parsererror"
  function ajaxError(error, type, xhr, settings, deferred) {
    var context = settings.context
    settings.error.call(context, xhr, type, error)
    if (deferred) deferred.rejectWith(context, [xhr, type, error])
    triggerGlobal(settings, context, 'ajaxError', [xhr, settings, error || type])
    ajaxComplete(type, xhr, settings)
  }
  // status: "success", "notmodified", "error", "timeout", "abort", "parsererror"
  function ajaxComplete(status, xhr, settings) {
    var context = settings.context
    settings.complete.call(context, xhr, status)
    triggerGlobal(settings, context, 'ajaxComplete', [xhr, settings])
    ajaxStop(settings)
  }

  // Empty function, used as default callback
  function empty() {}

  $.ajaxJSONP = function(options, deferred){
    if (!('type' in options)) return $.ajax(options)

    var _callbackName = options.jsonpCallback,
      callbackName = ($.isFunction(_callbackName) ?
        _callbackName() : _callbackName) || ('jsonp' + (++jsonpID)),
      script = document.createElement('script'),
      originalCallback = window[callbackName],
      responseData,
      abort = function(errorType) {
        $(script).triggerHandler('error', errorType || 'abort')
      },
      xhr = { abort: abort }, abortTimeout

    if (deferred) deferred.promise(xhr)

    $(script).on('load error', function(e, errorType){
      clearTimeout(abortTimeout)
      $(script).off().remove()

      if (e.type == 'error' || !responseData) {
        ajaxError(null, errorType || 'error', xhr, options, deferred)
      } else {
        ajaxSuccess(responseData[0], xhr, options, deferred)
      }

      window[callbackName] = originalCallback
      if (responseData && $.isFunction(originalCallback))
        originalCallback(responseData[0])

      originalCallback = responseData = undefined
    })

    if (ajaxBeforeSend(xhr, options) === false) {
      abort('abort')
      return xhr
    }

    window[callbackName] = function(){
      responseData = arguments
    }

    script.src = options.url.replace(/\?(.+)=\?/, '?$1=' + callbackName)
    document.head.appendChild(script)

    if (options.timeout > 0) abortTimeout = setTimeout(function(){
      abort('timeout')
    }, options.timeout)

    return xhr
  }

  $.ajaxSettings = {
    // Default type of request
    type: 'GET',
    // Callback that is executed before request
    beforeSend: empty,
    // Callback that is executed if the request succeeds
    success: empty,
    // Callback that is executed the the server drops error
    error: empty,
    // Callback that is executed on request complete (both: error and success)
    complete: empty,
    // The context for the callbacks
    context: null,
    // Whether to trigger "global" Ajax events
    global: true,
    // Transport
    xhr: function () {
      return new window.XMLHttpRequest()
    },
    // MIME types mapping
    // IIS returns Javascript as "application/x-javascript"
    accepts: {
      script: 'text/javascript, application/javascript, application/x-javascript',
      json:   jsonType,
      xml:    'application/xml, text/xml',
      html:   htmlType,
      text:   'text/plain'
    },
    // Whether the request is to another domain
    crossDomain: false,
    // Default timeout
    timeout: 0,
    // Whether data should be serialized to string
    processData: true,
    // Whether the browser should be allowed to cache GET responses
    cache: true
  }

  function mimeToDataType(mime) {
    if (mime) mime = mime.split(';', 2)[0]
    return mime && ( mime == htmlType ? 'html' :
      mime == jsonType ? 'json' :
      scriptTypeRE.test(mime) ? 'script' :
      xmlTypeRE.test(mime) && 'xml' ) || 'text'
  }

  function appendQuery(url, query) {
    if (query == '') return url
    return (url + '&' + query).replace(/[&?]{1,2}/, '?')
  }

  // serialize payload and append it to the URL for GET requests
  function serializeData(options) {
    if (options.processData && options.data && $.type(options.data) != "string")
      options.data = $.param(options.data, options.traditional)
    if (options.data && (!options.type || options.type.toUpperCase() == 'GET'))
      options.url = appendQuery(options.url, options.data), options.data = undefined
  }

  $.ajax = function(options){
    var settings = $.extend({}, options || {}),
        deferred = $.Deferred && $.Deferred()
    for (key in $.ajaxSettings) if (settings[key] === undefined) settings[key] = $.ajaxSettings[key]

    ajaxStart(settings)

    if (!settings.crossDomain) settings.crossDomain = /^([\w-]+:)?\/\/([^\/]+)/.test(settings.url) &&
      RegExp.$2 != window.location.host

    if (!settings.url) settings.url = window.location.toString()
    serializeData(settings)

    var dataType = settings.dataType, hasPlaceholder = /\?.+=\?/.test(settings.url)
    if (hasPlaceholder) dataType = 'jsonp'

    if (settings.cache === false || (
         (!options || options.cache !== true) &&
         ('script' == dataType || 'jsonp' == dataType)
        ))
      settings.url = appendQuery(settings.url, '_=' + Date.now())

    if ('jsonp' == dataType) {
      if (!hasPlaceholder)
        settings.url = appendQuery(settings.url,
          settings.jsonp ? (settings.jsonp + '=?') : settings.jsonp === false ? '' : 'callback=?')
      return $.ajaxJSONP(settings, deferred)
    }

    var mime = settings.accepts[dataType],
        headers = { },
        setHeader = function(name, value) { headers[name.toLowerCase()] = [name, value] },
        protocol = /^([\w-]+:)\/\//.test(settings.url) ? RegExp.$1 : window.location.protocol,
        xhr = settings.xhr(),
        nativeSetHeader = xhr.setRequestHeader,
        abortTimeout

    if (deferred) deferred.promise(xhr)

    if (!settings.crossDomain) setHeader('X-Requested-With', 'XMLHttpRequest')
    setHeader('Accept', mime || '*/*')
    if (mime = settings.mimeType || mime) {
      if (mime.indexOf(',') > -1) mime = mime.split(',', 2)[0]
      xhr.overrideMimeType && xhr.overrideMimeType(mime)
    }
    if (settings.contentType || (settings.contentType !== false && settings.data && settings.type.toUpperCase() != 'GET'))
      setHeader('Content-Type', settings.contentType || 'application/x-www-form-urlencoded')

    if (settings.headers) for (name in settings.headers) setHeader(name, settings.headers[name])
    xhr.setRequestHeader = setHeader

    xhr.onreadystatechange = function(){
      if (xhr.readyState == 4) {
        xhr.onreadystatechange = empty
        clearTimeout(abortTimeout)
        var result, error = false
        if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304 || (xhr.status == 0 && protocol == 'file:')) {
          dataType = dataType || mimeToDataType(settings.mimeType || xhr.getResponseHeader('content-type'))
          result = xhr.responseText

          try {
            // http://perfectionkills.com/global-eval-what-are-the-options/
            if (dataType == 'script')    (1,eval)(result)
            else if (dataType == 'xml')  result = xhr.responseXML
            else if (dataType == 'json') result = blankRE.test(result) ? null : $.parseJSON(result)
          } catch (e) { error = e }

          if (error) ajaxError(error, 'parsererror', xhr, settings, deferred)
          else ajaxSuccess(result, xhr, settings, deferred)
        } else {
          ajaxError(xhr.statusText || null, xhr.status ? 'error' : 'abort', xhr, settings, deferred)
        }
      }
    }

    if (ajaxBeforeSend(xhr, settings) === false) {
      xhr.abort()
      ajaxError(null, 'abort', xhr, settings, deferred)
      return xhr
    }

    if (settings.xhrFields) for (name in settings.xhrFields) xhr[name] = settings.xhrFields[name]

    var async = 'async' in settings ? settings.async : true
    xhr.open(settings.type, settings.url, async, settings.username, settings.password)

    for (name in headers) nativeSetHeader.apply(xhr, headers[name])

    if (settings.timeout > 0) abortTimeout = setTimeout(function(){
        xhr.onreadystatechange = empty
        xhr.abort()
        ajaxError(null, 'timeout', xhr, settings, deferred)
      }, settings.timeout)

    // avoid sending empty string (#319)
    xhr.send(settings.data ? settings.data : null)
    return xhr
  }

  // handle optional data/success arguments
  function parseArguments(url, data, success, dataType) {
    if ($.isFunction(data)) dataType = success, success = data, data = undefined
    if (!$.isFunction(success)) dataType = success, success = undefined
    return {
      url: url
    , data: data
    , success: success
    , dataType: dataType
    }
  }

  $.get = function(/* url, data, success, dataType */){
    return $.ajax(parseArguments.apply(null, arguments))
  }

  $.post = function(/* url, data, success, dataType */){
    var options = parseArguments.apply(null, arguments)
    options.type = 'POST'
    return $.ajax(options)
  }

  $.getJSON = function(/* url, data, success */){
    var options = parseArguments.apply(null, arguments)
    options.dataType = 'json'
    return $.ajax(options)
  }

  $.fn.load = function(url, data, success){
    if (!this.length) return this
    var self = this, parts = url.split(/\s/), selector,
        options = parseArguments(url, data, success),
        callback = options.success
    if (parts.length > 1) options.url = parts[0], selector = parts[1]
    options.success = function(response){
      self.html(selector ?
        $('<div>').html(response.replace(rscript, "")).find(selector)
        : response)
      callback && callback.apply(self, arguments)
    }
    $.ajax(options)
    return this
  }

  var escape = encodeURIComponent

  function serialize(params, obj, traditional, scope){
    var type, array = $.isArray(obj), hash = $.isPlainObject(obj)
    $.each(obj, function(key, value) {
      type = $.type(value)
      if (scope) key = traditional ? scope :
        scope + '[' + (hash || type == 'object' || type == 'array' ? key : '') + ']'
      // handle data in serializeArray() format
      if (!scope && array) params.add(value.name, value.value)
      // recurse into nested objects
      else if (type == "array" || (!traditional && type == "object"))
        serialize(params, value, traditional, key)
      else params.add(key, value)
    })
  }

  $.param = function(obj, traditional){
    var params = []
    params.add = function(k, v){ this.push(escape(k) + '=' + escape(v)) }
    serialize(params, obj, traditional)
    return params.join('&').replace(/%20/g, '+')
  }
})(Zepto)

//     Zepto.js
//     (c) 2010-2014 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function($){
  var cache = [], timeout

  $.fn.remove = function(){
    return this.each(function(){
      if(this.parentNode){
        if(this.tagName === 'IMG'){
          cache.push(this)
          this.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
          if (timeout) clearTimeout(timeout)
          timeout = setTimeout(function(){ cache = [] }, 60000)
        }
        this.parentNode.removeChild(this)
      }
    })
  }
})(Zepto)

//     Zepto.js
//     (c) 2010-2014 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function($){
  // Create a collection of callbacks to be fired in a sequence, with configurable behaviour
  // Option flags:
  //   - once: Callbacks fired at most one time.
  //   - memory: Remember the most recent context and arguments
  //   - stopOnFalse: Cease iterating over callback list
  //   - unique: Permit adding at most one instance of the same callback
  $.Callbacks = function(options) {
    options = $.extend({}, options)

    var memory, // Last fire value (for non-forgettable lists)
        fired,  // Flag to know if list was already fired
        firing, // Flag to know if list is currently firing
        firingStart, // First callback to fire (used internally by add and fireWith)
        firingLength, // End of the loop when firing
        firingIndex, // Index of currently firing callback (modified by remove if needed)
        list = [], // Actual callback list
        stack = !options.once && [], // Stack of fire calls for repeatable lists
        fire = function(data) {
          memory = options.memory && data
          fired = true
          firingIndex = firingStart || 0
          firingStart = 0
          firingLength = list.length
          firing = true
          for ( ; list && firingIndex < firingLength ; ++firingIndex ) {
            if (list[firingIndex].apply(data[0], data[1]) === false && options.stopOnFalse) {
              memory = false
              break
            }
          }
          firing = false
          if (list) {
            if (stack) stack.length && fire(stack.shift())
            else if (memory) list.length = 0
            else Callbacks.disable()
          }
        },

        Callbacks = {
          add: function() {
            if (list) {
              var start = list.length,
                  add = function(args) {
                    $.each(args, function(_, arg){
                      if (typeof arg === "function") {
                        if (!options.unique || !Callbacks.has(arg)) list.push(arg)
                      }
                      else if (arg && arg.length && typeof arg !== 'string') add(arg)
                    })
                  }
              add(arguments)
              if (firing) firingLength = list.length
              else if (memory) {
                firingStart = start
                fire(memory)
              }
            }
            return this
          },
          remove: function() {
            if (list) {
              $.each(arguments, function(_, arg){
                var index
                while ((index = $.inArray(arg, list, index)) > -1) {
                  list.splice(index, 1)
                  // Handle firing indexes
                  if (firing) {
                    if (index <= firingLength) --firingLength
                    if (index <= firingIndex) --firingIndex
                  }
                }
              })
            }
            return this
          },
          has: function(fn) {
            return !!(list && (fn ? $.inArray(fn, list) > -1 : list.length))
          },
          empty: function() {
            firingLength = list.length = 0
            return this
          },
          disable: function() {
            list = stack = memory = undefined
            return this
          },
          disabled: function() {
            return !list
          },
          lock: function() {
            stack = undefined;
            if (!memory) Callbacks.disable()
            return this
          },
          locked: function() {
            return !stack
          },
          fireWith: function(context, args) {
            if (list && (!fired || stack)) {
              args = args || []
              args = [context, args.slice ? args.slice() : args]
              if (firing) stack.push(args)
              else fire(args)
            }
            return this
          },
          fire: function() {
            return Callbacks.fireWith(this, arguments)
          },
          fired: function() {
            return !!fired
          }
        }

    return Callbacks
  }
})(Zepto)

//     Zepto.js
//     (c) 2010-2014 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

// The following code is heavily inspired by jQuery's $.fn.data()

;(function($){
  var data = {}, dataAttr = $.fn.data, camelize = $.camelCase,
    exp = $.expando = 'Zepto' + (+new Date()), emptyArray = []

  // Get value from node:
  // 1. first try key as given,
  // 2. then try camelized key,
  // 3. fall back to reading "data-*" attribute.
  function getData(node, name) {
    var id = node[exp], store = id && data[id]
    if (name === undefined) return store || setData(node)
    else {
      if (store) {
        if (name in store) return store[name]
        var camelName = camelize(name)
        if (camelName in store) return store[camelName]
      }
      return dataAttr.call($(node), name)
    }
  }

  // Store value under camelized key on node
  function setData(node, name, value) {
    var id = node[exp] || (node[exp] = ++$.uuid),
      store = data[id] || (data[id] = attributeData(node))
    if (name !== undefined) store[camelize(name)] = value
    return store
  }

  // Read all "data-*" attributes from a node
  function attributeData(node) {
    var store = {}
    $.each(node.attributes || emptyArray, function(i, attr){
      if (attr.name.indexOf('data-') == 0)
        store[camelize(attr.name.replace('data-', ''))] =
          $.zepto.deserializeValue(attr.value)
    })
    return store
  }

  $.fn.data = function(name, value) {
    return value === undefined ?
      // set multiple values via object
      $.isPlainObject(name) ?
        this.each(function(i, node){
          $.each(name, function(key, value){ setData(node, key, value) })
        }) :
        // get value from first element
        (0 in this ? getData(this[0], name) : undefined) :
      // set value on all elements
      this.each(function(){ setData(this, name, value) })
  }

  $.fn.removeData = function(names) {
    if (typeof names == 'string') names = names.split(/\s+/)
    return this.each(function(){
      var id = this[exp], store = id && data[id]
      if (store) $.each(names || store, function(key){
        delete store[names ? camelize(this) : key]
      })
    })
  }

  // Generate extended `remove` and `empty` functions
  ;['remove', 'empty'].forEach(function(methodName){
    var origFn = $.fn[methodName]
    $.fn[methodName] = function() {
      var elements = this.find('*')
      if (methodName === 'remove') elements = elements.add(this)
      elements.removeData()
      return origFn.call(this)
    }
  })
})(Zepto)

//     Zepto.js
//     (c) 2010-2014 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.
//
//     Some code (c) 2005, 2013 jQuery Foundation, Inc. and other contributors

;(function($){
  var slice = Array.prototype.slice

  function Deferred(func) {
    var tuples = [
          // action, add listener, listener list, final state
          [ "resolve", "done", $.Callbacks({once:1, memory:1}), "resolved" ],
          [ "reject", "fail", $.Callbacks({once:1, memory:1}), "rejected" ],
          [ "notify", "progress", $.Callbacks({memory:1}) ]
        ],
        state = "pending",
        promise = {
          state: function() {
            return state
          },
          always: function() {
            deferred.done(arguments).fail(arguments)
            return this
          },
          then: function(/* fnDone [, fnFailed [, fnProgress]] */) {
            var fns = arguments
            return Deferred(function(defer){
              $.each(tuples, function(i, tuple){
                var fn = $.isFunction(fns[i]) && fns[i]
                deferred[tuple[1]](function(){
                  var returned = fn && fn.apply(this, arguments)
                  if (returned && $.isFunction(returned.promise)) {
                    returned.promise()
                      .done(defer.resolve)
                      .fail(defer.reject)
                      .progress(defer.notify)
                  } else {
                    var context = this === promise ? defer.promise() : this,
                        values = fn ? [returned] : arguments
                    defer[tuple[0] + "With"](context, values)
                  }
                })
              })
              fns = null
            }).promise()
          },

          promise: function(obj) {
            return obj != null ? $.extend( obj, promise ) : promise
          }
        },
        deferred = {}

    $.each(tuples, function(i, tuple){
      var list = tuple[2],
          stateString = tuple[3]

      promise[tuple[1]] = list.add

      if (stateString) {
        list.add(function(){
          state = stateString
        }, tuples[i^1][2].disable, tuples[2][2].lock)
      }

      deferred[tuple[0]] = function(){
        deferred[tuple[0] + "With"](this === deferred ? promise : this, arguments)
        return this
      }
      deferred[tuple[0] + "With"] = list.fireWith
    })

    promise.promise(deferred)
    if (func) func.call(deferred, deferred)
    return deferred
  }

  $.when = function(sub) {
    var resolveValues = slice.call(arguments),
        len = resolveValues.length,
        i = 0,
        remain = len !== 1 || (sub && $.isFunction(sub.promise)) ? len : 0,
        deferred = remain === 1 ? sub : Deferred(),
        progressValues, progressContexts, resolveContexts,
        updateFn = function(i, ctx, val){
          return function(value){
            ctx[i] = this
            val[i] = arguments.length > 1 ? slice.call(arguments) : value
            if (val === progressValues) {
              deferred.notifyWith(ctx, val)
            } else if (!(--remain)) {
              deferred.resolveWith(ctx, val)
            }
          }
        }

    if (len > 1) {
      progressValues = new Array(len)
      progressContexts = new Array(len)
      resolveContexts = new Array(len)
      for ( ; i < len; ++i ) {
        if (resolveValues[i] && $.isFunction(resolveValues[i].promise)) {
          resolveValues[i].promise()
            .done(updateFn(i, resolveContexts, resolveValues))
            .fail(deferred.reject)
            .progress(updateFn(i, progressContexts, progressValues))
        } else {
          --remain
        }
      }
    }
    if (!remain) deferred.resolveWith(resolveContexts, resolveValues)
    return deferred.promise()
  }

  $.Deferred = Deferred
})(Zepto)

//     Zepto.js
//     (c) 2010-2014 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function($){
  function detect(ua){
    var os = this.os = {}, browser = this.browser = {},
      webkit = ua.match(/Web[kK]it[\/]{0,1}([\d.]+)/),
      android = ua.match(/(Android);?[\s\/]+([\d.]+)?/),
      osx = !!ua.match(/\(Macintosh\; Intel /),
      ipad = ua.match(/(iPad).*OS\s([\d_]+)/),
      ipod = ua.match(/(iPod)(.*OS\s([\d_]+))?/),
      iphone = !ipad && ua.match(/(iPhone\sOS)\s([\d_]+)/),
      webos = ua.match(/(webOS|hpwOS)[\s\/]([\d.]+)/),
      wp = ua.match(/Windows Phone ([\d.]+)/),
      touchpad = webos && ua.match(/TouchPad/),
      kindle = ua.match(/Kindle\/([\d.]+)/),
      silk = ua.match(/Silk\/([\d._]+)/),
      blackberry = ua.match(/(BlackBerry).*Version\/([\d.]+)/),
      bb10 = ua.match(/(BB10).*Version\/([\d.]+)/),
      rimtabletos = ua.match(/(RIM\sTablet\sOS)\s([\d.]+)/),
      playbook = ua.match(/PlayBook/),
      chrome = ua.match(/Chrome\/([\d.]+)/) || ua.match(/CriOS\/([\d.]+)/),
      firefox = ua.match(/Firefox\/([\d.]+)/),
      ie = ua.match(/MSIE\s([\d.]+)/) || ua.match(/Trident\/[\d](?=[^\?]+).*rv:([0-9.].)/),
      webview = !chrome && ua.match(/(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/),
      safari = webview || ua.match(/Version\/([\d.]+)([^S](Safari)|[^M]*(Mobile)[^S]*(Safari))/)

    // Todo: clean this up with a better OS/browser seperation:
    // - discern (more) between multiple browsers on android
    // - decide if kindle fire in silk mode is android or not
    // - Firefox on Android doesn't specify the Android version
    // - possibly devide in os, device and browser hashes

    if (browser.webkit = !!webkit) browser.version = webkit[1]

    if (android) os.android = true, os.version = android[2]
    if (iphone && !ipod) os.ios = os.iphone = true, os.version = iphone[2].replace(/_/g, '.')
    if (ipad) os.ios = os.ipad = true, os.version = ipad[2].replace(/_/g, '.')
    if (ipod) os.ios = os.ipod = true, os.version = ipod[3] ? ipod[3].replace(/_/g, '.') : null
    if (wp) os.wp = true, os.version = wp[1]
    if (webos) os.webos = true, os.version = webos[2]
    if (touchpad) os.touchpad = true
    if (blackberry) os.blackberry = true, os.version = blackberry[2]
    if (bb10) os.bb10 = true, os.version = bb10[2]
    if (rimtabletos) os.rimtabletos = true, os.version = rimtabletos[2]
    if (playbook) browser.playbook = true
    if (kindle) os.kindle = true, os.version = kindle[1]
    if (silk) browser.silk = true, browser.version = silk[1]
    if (!silk && os.android && ua.match(/Kindle Fire/)) browser.silk = true
    if (chrome) browser.chrome = true, browser.version = chrome[1]
    if (firefox) browser.firefox = true, browser.version = firefox[1]
    if (ie) browser.ie = true, browser.version = ie[1]
    if (safari && (osx || os.ios)) {browser.safari = true; if (osx) browser.version = safari[1]}
    if (webview) browser.webview = true

    os.tablet = !!(ipad || playbook || (android && !ua.match(/Mobile/)) ||
      (firefox && ua.match(/Tablet/)) || (ie && !ua.match(/Phone/) && ua.match(/Touch/)))
    os.phone  = !!(!os.tablet && !os.ipod && (android || iphone || webos || blackberry || bb10 ||
      (chrome && ua.match(/Android/)) || (chrome && ua.match(/CriOS\/([\d.]+)/)) ||
      (firefox && ua.match(/Mobile/)) || (ie && ua.match(/Touch/))))
  }

  detect.call($, navigator.userAgent)
  // make available to unit tests
  $.__detect = detect

})(Zepto)

//     Zepto.js
//     (c) 2010-2014 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function($){
  var _zid = 1, undefined,
      slice = Array.prototype.slice,
      isFunction = $.isFunction,
      isString = function(obj){ return typeof obj == 'string' },
      handlers = {},
      specialEvents={},
      focusinSupported = 'onfocusin' in window,
      focus = { focus: 'focusin', blur: 'focusout' },
      hover = { mouseenter: 'mouseover', mouseleave: 'mouseout' }

  specialEvents.click = specialEvents.mousedown = specialEvents.mouseup = specialEvents.mousemove = 'MouseEvents'

  function zid(element) {
    return element._zid || (element._zid = _zid++)
  }
  function findHandlers(element, event, fn, selector) {
    event = parse(event)
    if (event.ns) var matcher = matcherFor(event.ns)
    return (handlers[zid(element)] || []).filter(function(handler) {
      return handler
        && (!event.e  || handler.e == event.e)
        && (!event.ns || matcher.test(handler.ns))
        && (!fn       || zid(handler.fn) === zid(fn))
        && (!selector || handler.sel == selector)
    })
  }
  function parse(event) {
    var parts = ('' + event).split('.')
    return {e: parts[0], ns: parts.slice(1).sort().join(' ')}
  }
  function matcherFor(ns) {
    return new RegExp('(?:^| )' + ns.replace(' ', ' .* ?') + '(?: |$)')
  }

  function eventCapture(handler, captureSetting) {
    return handler.del &&
      (!focusinSupported && (handler.e in focus)) ||
      !!captureSetting
  }

  function realEvent(type) {
    return hover[type] || (focusinSupported && focus[type]) || type
  }

  function add(element, events, fn, data, selector, delegator, capture){
    var id = zid(element), set = (handlers[id] || (handlers[id] = []))
    events.split(/\s/).forEach(function(event){
      if (event == 'ready') return $(document).ready(fn)
      var handler   = parse(event)
      handler.fn    = fn
      handler.sel   = selector
      // emulate mouseenter, mouseleave
      if (handler.e in hover) fn = function(e){
        var related = e.relatedTarget
        if (!related || (related !== this && !$.contains(this, related)))
          return handler.fn.apply(this, arguments)
      }
      handler.del   = delegator
      var callback  = delegator || fn
      handler.proxy = function(e){
        e = compatible(e)
        if (e.isImmediatePropagationStopped()) return
        e.data = data
        var result = callback.apply(element, e._args == undefined ? [e] : [e].concat(e._args))
        if (result === false) e.preventDefault(), e.stopPropagation()
        return result
      }
      handler.i = set.length
      set.push(handler)
      if ('addEventListener' in element)
        element.addEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))
    })
  }
  function remove(element, events, fn, selector, capture){
    var id = zid(element)
    ;(events || '').split(/\s/).forEach(function(event){
      findHandlers(element, event, fn, selector).forEach(function(handler){
        delete handlers[id][handler.i]
      if ('removeEventListener' in element)
        element.removeEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))
      })
    })
  }

  $.event = { add: add, remove: remove }

  $.proxy = function(fn, context) {
    var args = (2 in arguments) && slice.call(arguments, 2)
    if (isFunction(fn)) {
      var proxyFn = function(){ return fn.apply(context, args ? args.concat(slice.call(arguments)) : arguments) }
      proxyFn._zid = zid(fn)
      return proxyFn
    } else if (isString(context)) {
      if (args) {
        args.unshift(fn[context], fn)
        return $.proxy.apply(null, args)
      } else {
        return $.proxy(fn[context], fn)
      }
    } else {
      throw new TypeError("expected function")
    }
  }

  $.fn.bind = function(event, data, callback){
    return this.on(event, data, callback)
  }
  $.fn.unbind = function(event, callback){
    return this.off(event, callback)
  }
  $.fn.one = function(event, selector, data, callback){
    return this.on(event, selector, data, callback, 1)
  }

  var returnTrue = function(){return true},
      returnFalse = function(){return false},
      ignoreProperties = /^([A-Z]|returnValue$|layer[XY]$)/,
      eventMethods = {
        preventDefault: 'isDefaultPrevented',
        stopImmediatePropagation: 'isImmediatePropagationStopped',
        stopPropagation: 'isPropagationStopped'
      }

  function compatible(event, source) {
    if (source || !event.isDefaultPrevented) {
      source || (source = event)

      $.each(eventMethods, function(name, predicate) {
        var sourceMethod = source[name]
        event[name] = function(){
          this[predicate] = returnTrue
          return sourceMethod && sourceMethod.apply(source, arguments)
        }
        event[predicate] = returnFalse
      })

      if (source.defaultPrevented !== undefined ? source.defaultPrevented :
          'returnValue' in source ? source.returnValue === false :
          source.getPreventDefault && source.getPreventDefault())
        event.isDefaultPrevented = returnTrue
    }
    return event
  }

  function createProxy(event) {
    var key, proxy = { originalEvent: event }
    for (key in event)
      if (!ignoreProperties.test(key) && event[key] !== undefined) proxy[key] = event[key]

    return compatible(proxy, event)
  }

  $.fn.delegate = function(selector, event, callback){
    return this.on(event, selector, callback)
  }
  $.fn.undelegate = function(selector, event, callback){
    return this.off(event, selector, callback)
  }

  $.fn.live = function(event, callback){
    $(document.body).delegate(this.selector, event, callback)
    return this
  }
  $.fn.die = function(event, callback){
    $(document.body).undelegate(this.selector, event, callback)
    return this
  }

  $.fn.on = function(event, selector, data, callback, one){
    var autoRemove, delegator, $this = this
    if (event && !isString(event)) {
      $.each(event, function(type, fn){
        $this.on(type, selector, data, fn, one)
      })
      return $this
    }

    if (!isString(selector) && !isFunction(callback) && callback !== false)
      callback = data, data = selector, selector = undefined
    if (isFunction(data) || data === false)
      callback = data, data = undefined

    if (callback === false) callback = returnFalse

    return $this.each(function(_, element){
      if (one) autoRemove = function(e){
        remove(element, e.type, callback)
        return callback.apply(this, arguments)
      }

      if (selector) delegator = function(e){
        var evt, match = $(e.target).closest(selector, element).get(0)
        if (match && match !== element) {
          evt = $.extend(createProxy(e), {currentTarget: match, liveFired: element})
          return (autoRemove || callback).apply(match, [evt].concat(slice.call(arguments, 1)))
        }
      }

      add(element, event, callback, data, selector, delegator || autoRemove)
    })
  }
  $.fn.off = function(event, selector, callback){
    var $this = this
    if (event && !isString(event)) {
      $.each(event, function(type, fn){
        $this.off(type, selector, fn)
      })
      return $this
    }

    if (!isString(selector) && !isFunction(callback) && callback !== false)
      callback = selector, selector = undefined

    if (callback === false) callback = returnFalse

    return $this.each(function(){
      remove(this, event, callback, selector)
    })
  }

  $.fn.trigger = function(event, args){
    event = (isString(event) || $.isPlainObject(event)) ? $.Event(event) : compatible(event)
    event._args = args
    return this.each(function(){
      // items in the collection might not be DOM elements
      if('dispatchEvent' in this) this.dispatchEvent(event)
      else $(this).triggerHandler(event, args)
    })
  }

  // triggers event handlers on current element just as if an event occurred,
  // doesn't trigger an actual event, doesn't bubble
  $.fn.triggerHandler = function(event, args){
    var e, result
    this.each(function(i, element){
      e = createProxy(isString(event) ? $.Event(event) : event)
      e._args = args
      e.target = element
      $.each(findHandlers(element, event.type || event), function(i, handler){
        result = handler.proxy(e)
        if (e.isImmediatePropagationStopped()) return false
      })
    })
    return result
  }

  // shortcut methods for `.bind(event, fn)` for each event type
  ;('focusin focusout load resize scroll unload click dblclick '+
  'mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave '+
  'change select keydown keypress keyup error').split(' ').forEach(function(event) {
    $.fn[event] = function(callback) {
      return callback ?
        this.bind(event, callback) :
        this.trigger(event)
    }
  })

  ;['focus', 'blur'].forEach(function(name) {
    $.fn[name] = function(callback) {
      if (callback) this.bind(name, callback)
      else this.each(function(){
        try { this[name]() }
        catch(e) {}
      })
      return this
    }
  })

  $.Event = function(type, props) {
    if (!isString(type)) props = type, type = props.type
    var event = document.createEvent(specialEvents[type] || 'Events'), bubbles = true
    if (props) for (var name in props) (name == 'bubbles') ? (bubbles = !!props[name]) : (event[name] = props[name])
    event.initEvent(type, bubbles, true)
    return compatible(event)
  }

})(Zepto)

//     Zepto.js
//     (c) 2010-2014 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function($){
  $.fn.serializeArray = function() {
    var el, type, result = []
    $([].slice.call(this.get(0).elements)).each(function(){
      el = $(this)
      type = el.attr('type')
      if (this.nodeName.toLowerCase() != 'fieldset' &&
        !this.disabled && type != 'submit' && type != 'reset' && type != 'button' &&
        ((type != 'radio' && type != 'checkbox') || this.checked))
        result.push({
          name: el.attr('name'),
          value: el.val()
        })
    })
    return result
  }

  $.fn.serialize = function(){
    var result = []
    this.serializeArray().forEach(function(elm){
      result.push(encodeURIComponent(elm.name) + '=' + encodeURIComponent(elm.value))
    })
    return result.join('&')
  }

  $.fn.submit = function(callback) {
    if (callback) this.bind('submit', callback)
    else if (this.length) {
      var event = $.Event('submit')
      this.eq(0).trigger(event)
      if (!event.isDefaultPrevented()) this.get(0).submit()
    }
    return this
  }

})(Zepto)

//     Zepto.js
//     (c) 2010-2014 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function($, undefined){
  var prefix = '', eventPrefix, endEventName, endAnimationName,
    vendors = { Webkit: 'webkit', Moz: '', O: 'o' },
    document = window.document, testEl = document.createElement('div'),
    supportedTransforms = /^((translate|rotate|scale)(X|Y|Z|3d)?|matrix(3d)?|perspective|skew(X|Y)?)$/i,
    transform,
    transitionProperty, transitionDuration, transitionTiming, transitionDelay,
    animationName, animationDuration, animationTiming, animationDelay,
    cssReset = {}

  function dasherize(str) { return str.replace(/([a-z])([A-Z])/, '$1-$2').toLowerCase() }
  function normalizeEvent(name) { return eventPrefix ? eventPrefix + name : name.toLowerCase() }

  $.each(vendors, function(vendor, event){
    if (testEl.style[vendor + 'TransitionProperty'] !== undefined) {
      prefix = '-' + vendor.toLowerCase() + '-'
      eventPrefix = event
      return false
    }
  })

  transform = prefix + 'transform'
  cssReset[transitionProperty = prefix + 'transition-property'] =
  cssReset[transitionDuration = prefix + 'transition-duration'] =
  cssReset[transitionDelay    = prefix + 'transition-delay'] =
  cssReset[transitionTiming   = prefix + 'transition-timing-function'] =
  cssReset[animationName      = prefix + 'animation-name'] =
  cssReset[animationDuration  = prefix + 'animation-duration'] =
  cssReset[animationDelay     = prefix + 'animation-delay'] =
  cssReset[animationTiming    = prefix + 'animation-timing-function'] = ''

  $.fx = {
    off: (eventPrefix === undefined && testEl.style.transitionProperty === undefined),
    speeds: { _default: 400, fast: 200, slow: 600 },
    cssPrefix: prefix,
    transitionEnd: normalizeEvent('TransitionEnd'),
    animationEnd: normalizeEvent('AnimationEnd')
  }

  $.fn.animate = function(properties, duration, ease, callback, delay){
    if ($.isFunction(duration))
      callback = duration, ease = undefined, duration = undefined
    if ($.isFunction(ease))
      callback = ease, ease = undefined
    if ($.isPlainObject(duration))
      ease = duration.easing, callback = duration.complete, delay = duration.delay, duration = duration.duration
    if (duration) duration = (typeof duration == 'number' ? duration :
                    ($.fx.speeds[duration] || $.fx.speeds._default)) / 1000
    if (delay) delay = parseFloat(delay) / 1000
    return this.anim(properties, duration, ease, callback, delay)
  }

  $.fn.anim = function(properties, duration, ease, callback, delay){
    var key, cssValues = {}, cssProperties, transforms = '',
        that = this, wrappedCallback, endEvent = $.fx.transitionEnd,
        fired = false

    if (duration === undefined) duration = $.fx.speeds._default / 1000
    if (delay === undefined) delay = 0
    if ($.fx.off) duration = 0

    if (typeof properties == 'string') {
      // keyframe animation
      cssValues[animationName] = properties
      cssValues[animationDuration] = duration + 's'
      cssValues[animationDelay] = delay + 's'
      cssValues[animationTiming] = (ease || 'linear')
      endEvent = $.fx.animationEnd
    } else {
      cssProperties = []
      // CSS transitions
      for (key in properties)
        if (supportedTransforms.test(key)) transforms += key + '(' + properties[key] + ') '
        else cssValues[key] = properties[key], cssProperties.push(dasherize(key))

      if (transforms) cssValues[transform] = transforms, cssProperties.push(transform)
      if (duration > 0 && typeof properties === 'object') {
        cssValues[transitionProperty] = cssProperties.join(', ')
        cssValues[transitionDuration] = duration + 's'
        cssValues[transitionDelay] = delay + 's'
        cssValues[transitionTiming] = (ease || 'linear')
      }
    }

    wrappedCallback = function(event){
      if (typeof event !== 'undefined') {
        if (event.target !== event.currentTarget) return // makes sure the event didn't bubble from "below"
        $(event.target).unbind(endEvent, wrappedCallback)
      } else
        $(this).unbind(endEvent, wrappedCallback) // triggered by setTimeout

      fired = true
      $(this).css(cssReset)
      callback && callback.call(this)
    }
    if (duration > 0){
      this.bind(endEvent, wrappedCallback)
      // transitionEnd is not always firing on older Android phones
      // so make sure it gets fired
      setTimeout(function(){
        if (fired) return
        wrappedCallback.call(that)
      }, (duration * 1000) + 25)
    }

    // trigger page reflow so new elements can animate
    this.size() && this.get(0).clientLeft

    this.css(cssValues)

    if (duration <= 0) setTimeout(function() {
      that.each(function(){ wrappedCallback.call(this) })
    }, 0)

    return this
  }

  testEl = null
})(Zepto)

//     Zepto.js
//     (c) 2010-2014 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function($, undefined){
  var document = window.document, docElem = document.documentElement,
    origShow = $.fn.show, origHide = $.fn.hide, origToggle = $.fn.toggle

  function anim(el, speed, opacity, scale, callback) {
    if (typeof speed == 'function' && !callback) callback = speed, speed = undefined
    var props = { opacity: opacity }
    if (scale) {
      props.scale = scale
      el.css($.fx.cssPrefix + 'transform-origin', '0 0')
    }
    return el.animate(props, speed, null, callback)
  }

  function hide(el, speed, scale, callback) {
    return anim(el, speed, 0, scale, function(){
      origHide.call($(this))
      callback && callback.call(this)
    })
  }

  $.fn.show = function(speed, callback) {
    origShow.call(this)
    if (speed === undefined) speed = 0
    else this.css('opacity', 0)
    return anim(this, speed, 1, '1,1', callback)
  }

  $.fn.hide = function(speed, callback) {
    if (speed === undefined) return origHide.call(this)
    else return hide(this, speed, '0,0', callback)
  }

  $.fn.toggle = function(speed, callback) {
    if (speed === undefined || typeof speed == 'boolean')
      return origToggle.call(this, speed)
    else return this.each(function(){
      var el = $(this)
      el[el.css('display') == 'none' ? 'show' : 'hide'](speed, callback)
    })
  }

  $.fn.fadeTo = function(speed, opacity, callback) {
    return anim(this, speed, opacity, null, callback)
  }

  $.fn.fadeIn = function(speed, callback) {
    var target = this.css('opacity')
    if (target > 0) this.css('opacity', 0)
    else target = 1
    return origShow.call(this).fadeTo(speed, target, callback)
  }

  $.fn.fadeOut = function(speed, callback) {
    return hide(this, speed, null, callback)
  }

  $.fn.fadeToggle = function(speed, callback) {
    return this.each(function(){
      var el = $(this)
      el[
        (el.css('opacity') == 0 || el.css('display') == 'none') ? 'fadeIn' : 'fadeOut'
      ](speed, callback)
    })
  }

})(Zepto)

//     Zepto.js
//     (c) 2010-2014 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function($){
  if ($.os.ios) {
    var gesture = {}, gestureTimeout

    function parentIfText(node){
      return 'tagName' in node ? node : node.parentNode
    }

    $(document).bind('gesturestart', function(e){
      var now = Date.now(), delta = now - (gesture.last || now)
      gesture.target = parentIfText(e.target)
      gestureTimeout && clearTimeout(gestureTimeout)
      gesture.e1 = e.scale
      gesture.last = now
    }).bind('gesturechange', function(e){
      gesture.e2 = e.scale
    }).bind('gestureend', function(e){
      if (gesture.e2 > 0) {
        Math.abs(gesture.e1 - gesture.e2) != 0 && $(gesture.target).trigger('pinch') &&
          $(gesture.target).trigger('pinch' + (gesture.e1 - gesture.e2 > 0 ? 'In' : 'Out'))
        gesture.e1 = gesture.e2 = gesture.last = 0
      } else if ('last' in gesture) {
        gesture = {}
      }
    })

    ;['pinch', 'pinchIn', 'pinchOut'].forEach(function(m){
      $.fn[m] = function(callback){ return this.bind(m, callback) }
    })
  }
})(Zepto)

//     Zepto.js
//     (c) 2010-2014 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function($){
  // __proto__ doesn't exist on IE<11, so redefine
  // the Z function to use object extension instead
  if (!('__proto__' in {})) {
    $.extend($.zepto, {
      Z: function(dom, selector){
        dom = dom || []
        $.extend(dom, $.fn)
        dom.selector = selector || ''
        dom.__Z = true
        return dom
      },
      // this is a kludge but works
      isZ: function(object){
        return $.type(object) === 'array' && '__Z' in object
      }
    })
  }

  // getComputedStyle shouldn't freak out when called
  // without a valid element as argument
  try {
    getComputedStyle(undefined)
  } catch(e) {
    var nativeGetComputedStyle = getComputedStyle;
    window.getComputedStyle = function(element){
      try {
        return nativeGetComputedStyle(element)
      } catch(e) {
        return null
      }
    }
  }
})(Zepto)

//     Zepto.js
//     (c) 2010-2014 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function(undefined){
  if (String.prototype.trim === undefined) // fix for iOS 3.2
    String.prototype.trim = function(){ return this.replace(/^\s+|\s+$/g, '') }

  // For iOS 3.x
  // from https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/reduce
  if (Array.prototype.reduce === undefined)
    Array.prototype.reduce = function(fun){
      if(this === void 0 || this === null) throw new TypeError()
      var t = Object(this), len = t.length >>> 0, k = 0, accumulator
      if(typeof fun != 'function') throw new TypeError()
      if(len == 0 && arguments.length == 1) throw new TypeError()

      if(arguments.length >= 2)
       accumulator = arguments[1]
      else
        do{
          if(k in t){
            accumulator = t[k++]
            break
          }
          if(++k >= len) throw new TypeError()
        } while (true)

      while (k < len){
        if(k in t) accumulator = fun.call(undefined, accumulator, t[k], k, t)
        k++
      }
      return accumulator
    }

})()

//     Zepto.js
//     (c) 2010-2014 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function($){
  var zepto = $.zepto, oldQsa = zepto.qsa, oldMatches = zepto.matches

  function visible(elem){
    elem = $(elem)
    return !!(elem.width() || elem.height()) && elem.css("display") !== "none"
  }

  // Implements a subset from:
  // http://api.jquery.com/category/selectors/jquery-selector-extensions/
  //
  // Each filter function receives the current index, all nodes in the
  // considered set, and a value if there were parentheses. The value
  // of `this` is the node currently being considered. The function returns the
  // resulting node(s), null, or undefined.
  //
  // Complex selectors are not supported:
  //   li:has(label:contains("foo")) + li:has(label:contains("bar"))
  //   ul.inner:first > li
  var filters = $.expr[':'] = {
    visible:  function(){ if (visible(this)) return this },
    hidden:   function(){ if (!visible(this)) return this },
    selected: function(){ if (this.selected) return this },
    checked:  function(){ if (this.checked) return this },
    parent:   function(){ return this.parentNode },
    first:    function(idx){ if (idx === 0) return this },
    last:     function(idx, nodes){ if (idx === nodes.length - 1) return this },
    eq:       function(idx, _, value){ if (idx === value) return this },
    contains: function(idx, _, text){ if ($(this).text().indexOf(text) > -1) return this },
    has:      function(idx, _, sel){ if (zepto.qsa(this, sel).length) return this }
  }

  var filterRe = new RegExp('(.*):(\\w+)(?:\\(([^)]+)\\))?$\\s*'),
      childRe  = /^\s*>/,
      classTag = 'Zepto' + (+new Date())

  function process(sel, fn) {
    // quote the hash in `a[href^=#]` expression
    sel = sel.replace(/=#\]/g, '="#"]')
    var filter, arg, match = filterRe.exec(sel)
    if (match && match[2] in filters) {
      filter = filters[match[2]], arg = match[3]
      sel = match[1]
      if (arg) {
        var num = Number(arg)
        if (isNaN(num)) arg = arg.replace(/^["']|["']$/g, '')
        else arg = num
      }
    }
    return fn(sel, filter, arg)
  }

  zepto.qsa = function(node, selector) {
    return process(selector, function(sel, filter, arg){
      try {
        var taggedParent
        if (!sel && filter) sel = '*'
        else if (childRe.test(sel))
          // support "> *" child queries by tagging the parent node with a
          // unique class and prepending that classname onto the selector
          taggedParent = $(node).addClass(classTag), sel = '.'+classTag+' '+sel

        var nodes = oldQsa(node, sel)
      } catch(e) {
        console.error('error performing selector: %o', selector)
        throw e
      } finally {
        if (taggedParent) taggedParent.removeClass(classTag)
      }
      return !filter ? nodes :
        zepto.uniq($.map(nodes, function(n, i){ return filter.call(n, i, nodes, arg) }))
    })
  }

  zepto.matches = function(node, selector){
    return process(selector, function(sel, filter, arg){
      return (!sel || oldMatches(node, sel)) &&
        (!filter || filter.call(node, null, arg) === node)
    })
  }
})(Zepto)

//     Zepto.js
//     (c) 2010-2014 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function($){
  $.fn.end = function(){
    return this.prevObject || $()
  }

  $.fn.andSelf = function(){
    return this.add(this.prevObject || $())
  }

  'filter,add,not,eq,first,last,find,closest,parents,parent,children,siblings'.split(',').forEach(function(property){
    var fn = $.fn[property]
    $.fn[property] = function(){
      var ret = fn.apply(this, arguments)
      ret.prevObject = this
      return ret
    }
  })
})(Zepto)

//     Zepto.js
//     (c) 2010-2014 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function($){
  var touch = {},
    touchTimeout, tapTimeout, swipeTimeout, longTapTimeout,
    longTapDelay = 750,
    gesture

  function swipeDirection(x1, x2, y1, y2) {
    return Math.abs(x1 - x2) >=
      Math.abs(y1 - y2) ? (x1 - x2 > 0 ? 'Left' : 'Right') : (y1 - y2 > 0 ? 'Up' : 'Down')
  }

  function longTap() {
    longTapTimeout = null
    if (touch.last) {
      touch.el.trigger('longTap')
      touch = {}
    }
  }

  function cancelLongTap() {
    if (longTapTimeout) clearTimeout(longTapTimeout)
    longTapTimeout = null
  }

  function cancelAll() {
    if (touchTimeout) clearTimeout(touchTimeout)
    if (tapTimeout) clearTimeout(tapTimeout)
    if (swipeTimeout) clearTimeout(swipeTimeout)
    if (longTapTimeout) clearTimeout(longTapTimeout)
    touchTimeout = tapTimeout = swipeTimeout = longTapTimeout = null
    touch = {}
  }

  function isPrimaryTouch(event){
    return (event.pointerType == 'touch' ||
      event.pointerType == event.MSPOINTER_TYPE_TOUCH)
      && event.isPrimary
  }

  function isPointerEventType(e, type){
    return (e.type == 'pointer'+type ||
      e.type.toLowerCase() == 'mspointer'+type)
  }

  $(document).ready(function(){
    var now, delta, deltaX = 0, deltaY = 0, firstTouch, _isPointerType

    if ('MSGesture' in window) {
      gesture = new MSGesture()
      gesture.target = document.body
    }

    $(document)
      .bind('MSGestureEnd', function(e){
        var swipeDirectionFromVelocity =
          e.velocityX > 1 ? 'Right' : e.velocityX < -1 ? 'Left' : e.velocityY > 1 ? 'Down' : e.velocityY < -1 ? 'Up' : null;
        if (swipeDirectionFromVelocity) {
          touch.el.trigger('swipe')
          touch.el.trigger('swipe'+ swipeDirectionFromVelocity)
        }
      })
      .on('touchstart MSPointerDown pointerdown', function(e){
        if((_isPointerType = isPointerEventType(e, 'down')) &&
          !isPrimaryTouch(e)) return
        firstTouch = _isPointerType ? e : e.touches[0]
        if (e.touches && e.touches.length === 1 && touch.x2) {
          // Clear out touch movement data if we have it sticking around
          // This can occur if touchcancel doesn't fire due to preventDefault, etc.
          touch.x2 = undefined
          touch.y2 = undefined
        }
        now = Date.now()
        delta = now - (touch.last || now)
        touch.el = $('tagName' in firstTouch.target ?
          firstTouch.target : firstTouch.target.parentNode)
        touchTimeout && clearTimeout(touchTimeout)
        touch.x1 = firstTouch.pageX
        touch.y1 = firstTouch.pageY
        if (delta > 0 && delta <= 250) touch.isDoubleTap = true
        touch.last = now
        longTapTimeout = setTimeout(longTap, longTapDelay)
        // adds the current touch contact for IE gesture recognition
        if (gesture && _isPointerType) gesture.addPointer(e.pointerId);
      })
      .on('touchmove MSPointerMove pointermove', function(e){
        if((_isPointerType = isPointerEventType(e, 'move')) &&
          !isPrimaryTouch(e)) return
        firstTouch = _isPointerType ? e : e.touches[0]
        cancelLongTap()
        touch.x2 = firstTouch.pageX
        touch.y2 = firstTouch.pageY

        deltaX += Math.abs(touch.x1 - touch.x2)
        deltaY += Math.abs(touch.y1 - touch.y2)
      })
      .on('touchend MSPointerUp pointerup', function(e){
        if((_isPointerType = isPointerEventType(e, 'up')) &&
          !isPrimaryTouch(e)) return
        cancelLongTap()

        // swipe
        if ((touch.x2 && Math.abs(touch.x1 - touch.x2) > 30) ||
            (touch.y2 && Math.abs(touch.y1 - touch.y2) > 30))

          swipeTimeout = setTimeout(function() {
            touch.el.trigger('swipe')
            touch.el.trigger('swipe' + (swipeDirection(touch.x1, touch.x2, touch.y1, touch.y2)))
            touch = {}
          }, 0)

        // normal tap
        else if ('last' in touch)
          // don't fire tap when delta position changed by more than 30 pixels,
          // for instance when moving to a point and back to origin
          if (deltaX < 30 && deltaY < 30) {
            // delay by one tick so we can cancel the 'tap' event if 'scroll' fires
            // ('tap' fires before 'scroll')
            tapTimeout = setTimeout(function() {

              // trigger universal 'tap' with the option to cancelTouch()
              // (cancelTouch cancels processing of single vs double taps for faster 'tap' response)
              var event = $.Event('tap')
              event.cancelTouch = cancelAll
              touch.el.trigger(event)

              // trigger double tap immediately
              if (touch.isDoubleTap) {
                if (touch.el) touch.el.trigger('doubleTap')
                touch = {}
              }

              // trigger single tap after 250ms of inactivity
              else {
                touchTimeout = setTimeout(function(){
                  touchTimeout = null
                  if (touch.el) touch.el.trigger('singleTap')
                  touch = {}
                }, 250)
              }
            }, 0)
          } else {
            touch = {}
          }
          deltaX = deltaY = 0

      })
      // when the browser window loses focus,
      // for example when a modal dialog is shown,
      // cancel all ongoing events
      .on('touchcancel MSPointerCancel pointercancel', cancelAll)

    // scrolling the window indicates intention of the user
    // to scroll, not tap or swipe, so cancel all ongoing events
    $(window).on('scroll', cancelAll)
  })

  ;['swipe', 'swipeLeft', 'swipeRight', 'swipeUp', 'swipeDown',
    'doubleTap', 'tap', 'singleTap', 'longTap'].forEach(function(eventName){
    $.fn[eventName] = function(callback){ return this.on(eventName, callback) }
  })
})(Zepto)

///<jscompress sourcefile="template.m.js" />
/*!art-template - Template Engine | http://aui.github.com/artTemplate/*/
!function(){function a(a){return a.replace(t,"").replace(u,",").replace(v,"").replace(w,"").replace(x,"").split(y)}function b(a){return"'"+a.replace(/('|\\)/g,"\\$1").replace(/\r/g,"\\r").replace(/\n/g,"\\n")+"'"}function c(c,d){function e(a){return m+=a.split(/\n/).length-1,k&&(a=a.replace(/\s+/g," ").replace(/<!--[\w\W]*?-->/g,"")),a&&(a=s[1]+b(a)+s[2]+"\n"),a}function f(b){var c=m;if(j?b=j(b,d):g&&(b=b.replace(/\n/g,function(){return m++,"$line="+m+";"})),0===b.indexOf("=")){var e=l&&!/^=[=#]/.test(b);if(b=b.replace(/^=[=#]?|[\s;]*$/g,""),e){var f=b.replace(/\s*\([^\)]+\)/,"");n[f]||/^(include|print)$/.test(f)||(b="$escape("+b+")")}else b="$string("+b+")";b=s[1]+b+s[2]}return g&&(b="$line="+c+";"+b),r(a(b),function(a){if(a&&!p[a]){var b;b="print"===a?u:"include"===a?v:n[a]?"$utils."+a:o[a]?"$helpers."+a:"$data."+a,w+=a+"="+b+",",p[a]=!0}}),b+"\n"}var g=d.debug,h=d.openTag,i=d.closeTag,j=d.parser,k=d.compress,l=d.escape,m=1,p={$data:1,$filename:1,$utils:1,$helpers:1,$out:1,$line:1},q="".trim,s=q?["$out='';","$out+=",";","$out"]:["$out=[];","$out.push(",");","$out.join('')"],t=q?"$out+=text;return $out;":"$out.push(text);",u="function(){var text=''.concat.apply('',arguments);"+t+"}",v="function(filename,data){data=data||$data;var text=$utils.$include(filename,data,$filename);"+t+"}",w="'use strict';var $utils=this,$helpers=$utils.$helpers,"+(g?"$line=0,":""),x=s[0],y="return new String("+s[3]+");";r(c.split(h),function(a){a=a.split(i);var b=a[0],c=a[1];1===a.length?x+=e(b):(x+=f(b),c&&(x+=e(c)))});var z=w+x+y;g&&(z="try{"+z+"}catch(e){throw {filename:$filename,name:'Render Error',message:e.message,line:$line,source:"+b(c)+".split(/\\n/)[$line-1].replace(/^\\s+/,'')};}");try{var A=new Function("$data","$filename",z);return A.prototype=n,A}catch(B){throw B.temp="function anonymous($data,$filename) {"+z+"}",B}}var d=function(a,b){return"string"==typeof b?q(b,{filename:a}):g(a,b)};d.version="3.0.0",d.config=function(a,b){e[a]=b};var e=d.defaults={openTag:"<%",closeTag:"%>",escape:!0,cache:!0,compress:!1,parser:null},f=d.cache={};d.render=function(a,b){return q(a,b)};var g=d.renderFile=function(a,b){var c=d.get(a)||p({filename:a,name:"Render Error",message:"Template not found"});return b?c(b):c};d.get=function(a){var b;if(f[a])b=f[a];else if("object"==typeof document){var c=document.getElementById(a);if(c){var d=(c.value||c.innerHTML).replace(/^\s*|\s*$/g,"");b=q(d,{filename:a})}}return b};var h=function(a,b){return"string"!=typeof a&&(b=typeof a,"number"===b?a+="":a="function"===b?h(a.call(a)):""),a},i={"<":"&#60;",">":"&#62;",'"':"&#34;","'":"&#39;","&":"&#38;"},j=function(a){return i[a]},k=function(a){return h(a).replace(/&(?![\w#]+;)|[<>"']/g,j)},l=Array.isArray||function(a){return"[object Array]"==={}.toString.call(a)},m=function(a,b){var c,d;if(l(a))for(c=0,d=a.length;d>c;c++)b.call(a,a[c],c,a);else for(c in a)b.call(a,a[c],c)},n=d.utils={$helpers:{},$include:g,$string:h,$escape:k,$each:m};d.helper=function(a,b){o[a]=b};var o=d.helpers=n.$helpers;d.onerror=function(a){var b="Template Error\n\n";for(var c in a)b+="<"+c+">\n"+a[c]+"\n\n";"object"==typeof console&&console.error(b)};var p=function(a){return d.onerror(a),function(){return"{Template Error}"}},q=d.compile=function(a,b){function d(c){try{return new i(c,h)+""}catch(d){return b.debug?p(d)():(b.debug=!0,q(a,b)(c))}}b=b||{};for(var g in e)void 0===b[g]&&(b[g]=e[g]);var h=b.filename;try{var i=c(a,b)}catch(j){return j.filename=h||"anonymous",j.name="Syntax Error",p(j)}return d.prototype=i.prototype,d.toString=function(){return i.toString()},h&&b.cache&&(f[h]=d),d},r=n.$each,s="break,case,catch,continue,debugger,default,delete,do,else,false,finally,for,function,if,in,instanceof,new,null,return,switch,this,throw,true,try,typeof,var,void,while,with,abstract,boolean,byte,char,class,const,double,enum,export,extends,final,float,goto,implements,import,int,interface,long,native,package,private,protected,public,short,static,super,synchronized,throws,transient,volatile,arguments,let,yield,undefined",t=/\/\*[\w\W]*?\*\/|\/\/[^\n]*\n|\/\/[^\n]*$|"(?:[^"\\]|\\[\w\W])*"|'(?:[^'\\]|\\[\w\W])*'|\s*\.\s*[$\w\.]+/g,u=/[^\w$]+/g,v=new RegExp(["\\b"+s.replace(/,/g,"\\b|\\b")+"\\b"].join("|"),"g"),w=/^\d[^,]*|,\d[^,]*/g,x=/^,+|,+$/g,y=/^$|,+/;e.openTag="{{",e.closeTag="}}";var z=function(a,b){var c=b.split(":"),d=c.shift(),e=c.join(":")||"";return e&&(e=", "+e),"$helpers."+d+"("+a+e+")"};e.parser=function(a){a=a.replace(/^\s/,"");var b=a.split(" "),c=b.shift(),e=b.join(" ");switch(c){case"if":a="if("+e+"){";break;case"else":b="if"===b.shift()?" if("+b.join(" ")+")":"",a="}else"+b+"{";break;case"/if":a="}";break;case"each":var f=b[0]||"$data",g=b[1]||"as",h=b[2]||"$value",i=b[3]||"$index",j=h+","+i;"as"!==g&&(f="[]"),a="$each("+f+",function("+j+"){";break;case"/each":a="});";break;case"echo":a="print("+e+");";break;case"print":case"include":a=c+"("+b.join(",")+");";break;default:if(/^\s*\|\s*[\w\$]/.test(e)){var k=!0;0===a.indexOf("#")&&(a=a.substr(1),k=!1);for(var l=0,m=a.split("|"),n=m.length,o=m[l++];n>l;l++)o=z(o,m[l]);a=(k?"=":"=#")+o}else a=d.helpers[c]?"=#"+c+"("+b.join(",")+");":"="+a}return a},"function"==typeof define?define(function(){return d}):"undefined"!=typeof exports?module.exports=d:this.template=d}();
///<jscompress sourcefile="echarts.common.m.js" />
!function(t,e){"function"==typeof define&&define.amd?define([],e):"object"==typeof module&&module.exports?module.exports=e():t.echarts=e()}(this,function(){var t,e;!function(){function i(t,e){if(!e)return t;if(0===t.indexOf(".")){var i=e.split("/"),n=t.split("/"),r=i.length-1,a=n.length,o=0,s=0;t:for(var l=0;a>l;l++)switch(n[l]){case"..":if(!(r>o))break t;o++,s++;break;case".":s++;break;default:break t}return i.length=r-o,n=n.slice(s),i.concat(n).join("/")}return t}function n(t){function e(e,o){if("string"==typeof e){var s=n[e];return s||(s=a(i(e,t)),n[e]=s),s}e instanceof Array&&(o=o||function(){},o.apply(this,r(e,o,t)))}var n={};return e}function r(e,n,r){for(var s=[],l=o[r],c=0,u=Math.min(e.length,n.length);u>c;c++){var h,d=i(e[c],r);switch(d){case"require":h=l&&l.require||t;break;case"exports":h=l.exports;break;case"module":h=l;break;default:h=a(d)}s.push(h)}return s}function a(t){var e=o[t];if(!e)throw new Error("No "+t);if(!e.defined){var i=e.factory,n=i.apply(this,r(e.deps||[],i,t));"undefined"!=typeof n&&(e.exports=n),e.defined=1}return e.exports}var o={};e=function(t,e,i){if(2===arguments.length&&(i=e,e=[],"function"!=typeof i)){var r=i;i=function(){return r}}o[t]={id:t,deps:e,factory:i,defined:0,exports:{},require:n(t)}},t=n("")}();var i="padding",n="../../echarts",r="getRect",a="dataToCoord",o="getLabel",s="../echarts",l="getLineStyle",c="isHorizontal",u="getAxis",h="dataToPoint",d="getExtent",f="getOtherAxis",p="getBaseAxis",v="execute",m="getFormattedLabel",g="getItemStyle",y="circle",_="symbol",x="symbolSize",b="createSymbol",w="updateData",M="../../util/number",S="../../util/graphic",k="../../util/symbol",C="category",A="coordinateSystem",T="../../util/model",D="setItemGraphicEl",L="getItemVisual",P="setItemLayout",z="getItemLayout",I="getVisual",O="mapArray",R="getDataExtent",B="dimensions",E="extendComponentView",Z="extendComponentModel",N="registerVisualCoding",V="registerLayout",F="registerAction",G="registerProcessor",H="hostModel",W="eachComponent",q="dataZoom",j="itemStyle",U="eachSeries",X="eachSeriesByType",Y="setItemVisual",$="setVisual",Q="dispose",K="canvasSupported",J="clientHeight",tt="backgroundColor",et="appendChild",it="innerHTML",nt="intersect",rt="resize",at="update",ot="zlevel",st="getDisplayList",lt="storage",ct="parentNode",ut="offsetY",ht="offsetX",dt="mousemove",ft="zrender/core/event",pt="initProps",vt="updateProps",mt="getTextColor",gt="mouseout",yt="mouseover",_t="setHoverStyle",xt="hoverStyle",bt="setStyle",wt="subPixelOptimizeRect",Mt="extendShape",St="Polyline",kt="Sector",Ct="points",At="setShape",Tt="restore",Dt="buildPath",Lt="closePath",Pt="bezierCurveTo",zt="lineTo",It="moveTo",Ot="beginPath",Rt="contain",Bt="textBaseline",Et="textAlign",Zt="textPosition",Nt="eachItemGraphicEl",Vt="indexOfName",Ft="getItemGraphicEl",Gt="dataIndex",Ht="trigger",Wt="render",qt="removeAll",jt="updateLayout",Ut="invisible",Xt="traverse",Yt="delFromMap",$t="addToMap",Qt="remove",Kt="__dirty",Jt="refresh",te="ignore",ee="draggable",ie="animate",ne="stopAnimation",re="animation",ae="zrender/tool/color",oe="target",se="transformCoordToLocal",le="rotate",ce="getLocalTransform",ue="parent",he="transform",de="rotation",fe="zrender/mixin/Eventful",pe="addCommas",ve="getDataParams",me="getItemModel",ge="getName",ye="getRawIndex",_e="getRawValue",xe="ordinal",be="getData",we="seriesIndex",Me="normal",Se="emphasis",ke="axisIndex",Ce="radius",Ae="getComponent",Te="register",De="dispatchAction",Le="getHeight",Pe="getWidth",ze="getDom",Ie="splice",Oe="findComponents",Re="isString",Be="series",Ee="mergeOption",Ze="isObject",Ne="mergeDefaultAndTheme",Ve="getLayoutRect",Fe="vertical",Ge="horizontal",He="childAt",We="position",qe="eachChild",je="toUpperCase",Ue="toLowerCase",Xe="getPixelPrecision",Ye="toFixed",$e="parsePercent",Qe="isArray",Ke="linearMap",Je="replace",ti="option",ei="../util/clazz",ii="getFont",ni="getBoundingRect",ri="textStyle",ai="getModel",oi="ecModel",si="substr",li="defaults",ci="inside",ui="center",hi="middle",di="bottom",fi="../core/BoundingRect",pi="../core/util",vi="zrender/contain/text",mi="create",gi="height",yi="applyTransform",_i="zrender/core/BoundingRect",xi="distance",bi="undefined",wi="zrender/core/vector",Mi="opacity",Si="stroke",ki="lineWidth",Ci="getShallow",Ai="getClass",Ti="enableClassManagement",Di="inherits",Li="extend",Pi="enableClassExtend",zi="parseClassType",Ii="function",Oi="concat",Ri="number",Bi="string",Ei="indexOf",Zi="getContext",Ni="canvas",Vi="createElement",Fi="length",Gi="object",Hi="filter",Wi="zrender/core/util",qi="prototype",ji="require";e("zrender/graphic/Gradient",[ji],function(t){var e=function(t){this.colorStops=t||[]};return e[qi]={constructor:e,addColorStop:function(t,e){this.colorStops.push({offset:t,color:e})}},e}),e(Wi,[ji,"../graphic/Gradient"],function(t){function e(t){if(typeof t==Gi&&null!==t){var i=t;if(t instanceof Array){i=[];for(var n=0,r=t[Fi];r>n;n++)i[n]=e(t[n])}else if(!M(t)&&!S(t)){i={};for(var a in t)t.hasOwnProperty(a)&&(i[a]=e(t[a]))}return i}return t}function i(t,n,r){if(!w(n)||!w(t))return r?e(n):t;for(var a in n)if(n.hasOwnProperty(a)){var o=t[a],s=n[a];!w(s)||!w(o)||_(s)||_(o)||S(s)||S(o)||M(s)||M(o)?!r&&a in t||(t[a]=e(n[a],!0)):i(o,s,r)}return t}function n(t,e){for(var n=t[0],r=1,a=t[Fi];a>r;r++)n=i(n,t[r],e);return n}function r(t,e){for(var i in e)e.hasOwnProperty(i)&&(t[i]=e[i]);return t}function a(t,e,i){for(var n in e)e.hasOwnProperty(n)&&(i?null!=e[n]:null==t[n])&&(t[n]=e[n]);return t}function o(){return document[Vi](Ni)}function s(){return T||(T=Z.createCanvas()[Zi]("2d")),T}function l(t,e){if(t){if(t[Ei])return t[Ei](e);for(var i=0,n=t[Fi];n>i;i++)if(t[i]===e)return i}return-1}function c(t,e){function i(){}var n=t[qi];i[qi]=e[qi],t[qi]=new i;for(var r in n)t[qi][r]=n[r];t[qi].constructor=t,t.superClass=e}function u(t,e,i){t=qi in t?t[qi]:t,e=qi in e?e[qi]:e,a(t,e,i)}function h(t){return t?typeof t==Bi?!1:typeof t[Fi]==Ri:void 0}function d(t,e,i){if(t&&e)if(t.forEach&&t.forEach===I)t.forEach(e,i);else if(t[Fi]===+t[Fi])for(var n=0,r=t[Fi];r>n;n++)e.call(i,t[n],n,t);else for(var a in t)t.hasOwnProperty(a)&&e.call(i,t[a],a,t)}function f(t,e,i){if(t&&e){if(t.map&&t.map===B)return t.map(e,i);for(var n=[],r=0,a=t[Fi];a>r;r++)n.push(e.call(i,t[r],r,t));return n}}function p(t,e,i,n){if(t&&e){if(t.reduce&&t.reduce===E)return t.reduce(e,i,n);for(var r=0,a=t[Fi];a>r;r++)i=e.call(n,i,t[r],r,t);return i}}function v(t,e,i){if(t&&e){if(t[Hi]&&t[Hi]===O)return t[Hi](e,i);for(var n=[],r=0,a=t[Fi];a>r;r++)e.call(i,t[r],r,t)&&n.push(t[r]);return n}}function m(t,e,i){if(t&&e)for(var n=0,r=t[Fi];r>n;n++)if(e.call(i,t[n],n,t))return t[n]}function g(t,e){var i=R.call(arguments,2);return function(){return t.apply(e,i[Oi](R.call(arguments)))}}function y(t){var e=R.call(arguments,1);return function(){return t.apply(this,e[Oi](R.call(arguments)))}}function _(t){return"[object Array]"===P.call(t)}function x(t){return typeof t===Ii}function b(t){return"[object String]"===P.call(t)}function w(t){var e=typeof t;return e===Ii||!!t&&e==Gi}function M(t){return!!L[P.call(t)]||t instanceof D}function S(t){return t&&1===t.nodeType&&typeof t.nodeName==Bi}function k(t){for(var e=0,i=arguments[Fi];i>e;e++)if(null!=arguments[e])return arguments[e]}function C(){return Function.call.apply(R,arguments)}function A(t,e){if(!t)throw new Error(e)}var T,D=t("../graphic/Gradient"),L={"[object Function]":1,"[object RegExp]":1,"[object Date]":1,"[object Error]":1,"[object CanvasGradient]":1},P=Object[qi].toString,z=Array[qi],I=z.forEach,O=z[Hi],R=z.slice,B=z.map,E=z.reduce,Z={inherits:c,mixin:u,clone:e,merge:i,mergeAll:n,extend:r,defaults:a,getContext:s,createCanvas:o,indexOf:l,slice:C,find:m,isArrayLike:h,each:d,map:f,reduce:p,filter:v,bind:g,curry:y,isArray:_,isString:b,isObject:w,isFunction:x,isBuildInObject:M,isDom:S,retrieve:k,assert:A,noop:function(){}};return Z}),e("echarts/util/clazz",[ji,Wi],function(t){function e(t,e){for(var i,n=t.constructor,r=t[e];(n=n.$superClass)&&(i=n[qi][e])&&i===r;);return i}var i=t(Wi),n={},r=".",a="___EC__COMPONENT__CONTAINER___",o=n[zi]=function(t){var e={main:"",sub:""};return t&&(t=t.split(r),e.main=t[0]||"",e.sub=t[1]||""),e};return n[Pi]=function(t,n){t[Li]=function(r){var a=function(){n&&n.apply(this,arguments),t.apply(this,arguments)};return i[Li](a[qi],i[Li]({$superCall:function(t){var n=i.slice(arguments,1);return e(this,t).apply(this,n)},$superApply:function(t,i){return e(this,t).apply(this,i)}},r)),a[Li]=this[Li],i[Di](a,this),a.$superClass=this,a}},n[Ti]=function(t,e){function n(t){var e=r[t.main];return e&&e[a]||(e=r[t.main]={},e[a]=!0),e}e=e||{};var r={};if(t.registerClass=function(t,e){if(e)if(e=o(e),e.sub){if(e.sub!==a){var i=n(e);i[e.sub]=t}}else{if(r[e.main])throw new Error(e.main+"exists");r[e.main]=t}return t},t[Ai]=function(t,e,i){var n=r[t];if(n&&n[a]&&(n=e?n[e]:null),i&&!n)throw new Error("Component "+t+"."+(e||"")+" not exists");return n},t.getClassesByMainType=function(t){t=o(t);var e=[],n=r[t.main];return n&&n[a]?i.each(n,function(t,i){i!==a&&e.push(t)}):e.push(n),e},t.hasClass=function(t){return t=o(t),!!r[t.main]},t.getAllClassMainTypes=function(){var t=[];return i.each(r,function(e,i){t.push(i)}),t},t.hasSubTypes=function(t){t=o(t);var e=r[t.main];return e&&e[a]},t[zi]=o,e.registerWhenExtend){var s=t[Li];s&&(t[Li]=function(e){var i=s.call(this,e);return t.registerClass(i,e.type)})}return t},n.setReadOnly=function(t,e){},n}),e("echarts/model/mixin/makeStyleMapper",[ji,Wi],function(t){var e=t(Wi);return function(t){for(var i=0;i<t[Fi];i++)t[i][1]||(t[i][1]=t[i][0]);return function(i){for(var n={},r=0;r<t[Fi];r++){var a=t[r][1];if(!(i&&e[Ei](i,a)>=0)){var o=this[Ci](a);null!=o&&(n[t[r][0]]=o)}}return n}}}),e("echarts/model/mixin/lineStyle",[ji,"./makeStyleMapper"],function(t){var e=t("./makeStyleMapper")([[ki,"width"],[Si,"color"],[Mi],["shadowBlur"],["shadowOffsetX"],["shadowOffsetY"],["shadowColor"]]);return{getLineStyle:function(t){var i=e.call(this,t),n=this.getLineDash();return n&&(i.lineDash=n),i},getLineDash:function(){var t=this.get("type");return"solid"===t||null==t?null:"dashed"===t?[5,5]:[1,1]}}}),e("echarts/model/mixin/areaStyle",[ji,"./makeStyleMapper"],function(t){return{getAreaStyle:t("./makeStyleMapper")([["fill","color"],["shadowBlur"],["shadowOffsetX"],["shadowOffsetY"],[Mi],["shadowColor"]])}}),e(wi,[],function(){var t=typeof Float32Array===bi?Array:Float32Array,e={create:function(e,i){var n=new t(2);return n[0]=e||0,n[1]=i||0,n},copy:function(t,e){return t[0]=e[0],t[1]=e[1],t},clone:function(e){var i=new t(2);return i[0]=e[0],i[1]=e[1],i},set:function(t,e,i){return t[0]=e,t[1]=i,t},add:function(t,e,i){return t[0]=e[0]+i[0],t[1]=e[1]+i[1],t},scaleAndAdd:function(t,e,i,n){return t[0]=e[0]+i[0]*n,t[1]=e[1]+i[1]*n,t},sub:function(t,e,i){return t[0]=e[0]-i[0],t[1]=e[1]-i[1],t},len:function(t){return Math.sqrt(this.lenSquare(t))},lenSquare:function(t){return t[0]*t[0]+t[1]*t[1]},mul:function(t,e,i){return t[0]=e[0]*i[0],t[1]=e[1]*i[1],t},div:function(t,e,i){return t[0]=e[0]/i[0],t[1]=e[1]/i[1],t},dot:function(t,e){return t[0]*e[0]+t[1]*e[1]},scale:function(t,e,i){return t[0]=e[0]*i,t[1]=e[1]*i,t},normalize:function(t,i){var n=e.len(i);return 0===n?(t[0]=0,t[1]=0):(t[0]=i[0]/n,t[1]=i[1]/n),t},distance:function(t,e){return Math.sqrt((t[0]-e[0])*(t[0]-e[0])+(t[1]-e[1])*(t[1]-e[1]))},distanceSquare:function(t,e){return(t[0]-e[0])*(t[0]-e[0])+(t[1]-e[1])*(t[1]-e[1])},negate:function(t,e){return t[0]=-e[0],t[1]=-e[1],t},lerp:function(t,e,i,n){return t[0]=e[0]+n*(i[0]-e[0]),t[1]=e[1]+n*(i[1]-e[1]),t},applyTransform:function(t,e,i){var n=e[0],r=e[1];return t[0]=i[0]*n+i[2]*r+i[4],t[1]=i[1]*n+i[3]*r+i[5],t},min:function(t,e,i){return t[0]=Math.min(e[0],i[0]),t[1]=Math.min(e[1],i[1]),t},max:function(t,e,i){return t[0]=Math.max(e[0],i[0]),t[1]=Math.max(e[1],i[1]),t}};return e[Fi]=e.len,e.lengthSquare=e.lenSquare,e.dist=e[xi],e.distSquare=e.distanceSquare,e}),e("zrender/core/matrix",[],function(){var t=typeof Float32Array===bi?Array:Float32Array,e={create:function(){var i=new t(6);return e.identity(i),i},identity:function(t){return t[0]=1,t[1]=0,t[2]=0,t[3]=1,t[4]=0,t[5]=0,t},copy:function(t,e){return t[0]=e[0],t[1]=e[1],t[2]=e[2],t[3]=e[3],t[4]=e[4],t[5]=e[5],t},mul:function(t,e,i){var n=e[0]*i[0]+e[2]*i[1],r=e[1]*i[0]+e[3]*i[1],a=e[0]*i[2]+e[2]*i[3],o=e[1]*i[2]+e[3]*i[3],s=e[0]*i[4]+e[2]*i[5]+e[4],l=e[1]*i[4]+e[3]*i[5]+e[5];return t[0]=n,t[1]=r,t[2]=a,t[3]=o,t[4]=s,t[5]=l,t},translate:function(t,e,i){return t[0]=e[0],t[1]=e[1],t[2]=e[2],t[3]=e[3],t[4]=e[4]+i[0],t[5]=e[5]+i[1],t},rotate:function(t,e,i){var n=e[0],r=e[2],a=e[4],o=e[1],s=e[3],l=e[5],c=Math.sin(i),u=Math.cos(i);return t[0]=n*u+o*c,t[1]=-n*c+o*u,t[2]=r*u+s*c,t[3]=-r*c+u*s,t[4]=u*a+c*l,t[5]=u*l-c*a,t},scale:function(t,e,i){var n=i[0],r=i[1];return t[0]=e[0]*n,t[1]=e[1]*r,t[2]=e[2]*n,t[3]=e[3]*r,t[4]=e[4]*n,t[5]=e[5]*r,t},invert:function(t,e){var i=e[0],n=e[2],r=e[4],a=e[1],o=e[3],s=e[5],l=i*o-a*n;return l?(l=1/l,t[0]=o*l,t[1]=-a*l,t[2]=-n*l,t[3]=i*l,t[4]=(n*s-o*r)*l,t[5]=(a*r-i*s)*l,t):null}};return e}),e(_i,[ji,"./vector","./matrix"],function(t){function e(t,e,i,n){this.x=t,this.y=e,this.width=i,this[gi]=n}var i=t("./vector"),n=t("./matrix"),r=i[yi],a=Math.min,o=Math.abs,s=Math.max;return e[qi]={constructor:e,union:function(t){var e=a(t.x,this.x),i=a(t.y,this.y);this.width=s(t.x+t.width,this.x+this.width)-e,this[gi]=s(t.y+t[gi],this.y+this[gi])-i,this.x=e,this.y=i},applyTransform:function(){var t=[],e=[];return function(i){i&&(t[0]=this.x,t[1]=this.y,e[0]=this.x+this.width,e[1]=this.y+this[gi],r(t,t,i),r(e,e,i),this.x=a(t[0],e[0]),this.y=a(t[1],e[1]),this.width=o(e[0]-t[0]),this[gi]=o(e[1]-t[1]))}}(),calculateTransform:function(t){var e=this,i=t.width/e.width,r=t[gi]/e[gi],a=n[mi]();return n.translate(a,a,[-e.x,-e.y]),n.scale(a,a,[i,r]),n.translate(a,a,[t.x,t.y]),a},intersect:function(t){var e=this,i=e.x,n=e.x+e.width,r=e.y,a=e.y+e[gi],o=t.x,s=t.x+t.width,l=t.y,c=t.y+t[gi];return!(o>n||i>s||l>a||r>c)},contain:function(t,e){var i=this;return t>=i.x&&t<=i.x+i.width&&e>=i.y&&e<=i.y+i[gi]},clone:function(){return new e(this.x,this.y,this.width,this[gi])},copy:function(t){this.x=t.x,this.y=t.y,this.width=t.width,this[gi]=t[gi]}},e}),e(vi,[ji,pi,fi],function(t){function e(t,e){var i=t+":"+e;if(s[i])return s[i];for(var n=(t+"").split("\n"),r=0,a=0,o=n[Fi];o>a;a++)r=Math.max(d.measureText(n[a],e).width,r);return l>c&&(l=0,s={}),l++,s[i]=r,r}function i(t,i,n,r){var a=((t||"")+"").split("\n")[Fi],o=e(t,i),s=e("国",i),l=a*s,c=new h(0,0,o,l);switch(c.lineHeight=s,r){case di:case"alphabetic":c.y-=s;break;case hi:c.y-=s/2}switch(n){case"end":case"right":c.x-=c.width;break;case ui:c.x-=c.width/2}return c}function n(t,e,i,n){var r=e.x,a=e.y,o=e[gi],s=e.width,l=i[gi],c=o/2-l/2,u="left";switch(t){case"left":r-=n,a+=c,u="right";break;case"right":r+=n+s,a+=c,u="left";break;case"top":r+=s/2,a-=n+l,u=ui;break;case di:r+=s/2,a+=o+n,u=ui;break;case ci:r+=s/2,a+=c,u=ui;break;case"insideLeft":r+=n,a+=c,u="left";break;case"insideRight":r+=s-n,a+=c,u="right";break;case"insideTop":r+=s/2,a+=n,u=ui;break;case"insideBottom":r+=s/2,a+=o-l-n,u=ui;break;case"insideTopLeft":r+=n,a+=n,u="left";break;case"insideTopRight":r+=s-n,a+=n,u="right";break;case"insideBottomLeft":r+=n,a+=o-l-n;break;case"insideBottomRight":r+=s-n,a+=o-l-n,u="right"}return{x:r,y:a,textAlign:u,textBaseline:"top"}}function r(t,i,n,r){if(!n)return"";r=u[li]({ellipsis:"...",minCharacters:3,maxIterations:3,cnCharWidth:e("国",i),ascCharWidth:e("a",i)},r,!0),n-=e(r.ellipsis);for(var o=(t+"").split("\n"),s=0,l=o[Fi];l>s;s++)o[s]=a(o[s],i,n,r);return o.join("\n")}function a(t,i,n,r){for(var a=0;;a++){var s=e(t,i);if(n>s||a>=r.maxIterations){t+=r.ellipsis;break}var l=0===a?o(t,n,r):Math.floor(t[Fi]*n/s);if(l<r.minCharacters){t="";break}t=t[si](0,l)}return t}function o(t,e,i){for(var n=0,r=0,a=t[Fi];a>r&&e>n;r++){var o=t.charCodeAt(r);n+=o>=0&&127>=o?i.ascCharWidth:i.cnCharWidth}return r}var s={},l=0,c=5e3,u=t(pi),h=t(fi),d={getWidth:e,getBoundingRect:i,adjustTextPositionOnRect:n,ellipsis:r,measureText:function(t,e){var i=u[Zi]();return i.font=e,i.measureText(t)}};return d}),e("echarts/model/mixin/textStyle",[ji,vi],function(t){function e(t,e){return t&&t[Ci](e)}var i=t(vi);return{getTextColor:function(){var t=this[oi];return this[Ci]("color")||t&&t.get("textStyle.color")},getFont:function(){var t=this[oi],i=t&&t[ai](ri);return[this[Ci]("fontStyle")||e(i,"fontStyle"),this[Ci]("fontWeight")||e(i,"fontWeight"),(this[Ci]("fontSize")||e(i,"fontSize")||12)+"px",this[Ci]("fontFamily")||e(i,"fontFamily")||"sans-serif"].join(" ")},getTextRect:function(t){var e=this.get(ri)||{};return i[ni](t,this[ii](),e.align,e.baseline)},ellipsis:function(t,e,n){return i.ellipsis(t,this[ii](),e,n)}}}),e("echarts/model/mixin/itemStyle",[ji,"./makeStyleMapper"],function(t){return{getItemStyle:t("./makeStyleMapper")([["fill","color"],[Si,"borderColor"],[ki,"borderWidth"],[Mi],["shadowBlur"],["shadowOffsetX"],["shadowOffsetY"],["shadowColor"]])}}),e("echarts/model/Model",[ji,Wi,ei,"./mixin/lineStyle","./mixin/areaStyle","./mixin/textStyle","./mixin/itemStyle"],function(t){function e(t,e,i){this.parentModel=e||null,this[oi]=i||null,this[ti]=t,this.init.apply(this,arguments)}var i=t(Wi),n=t(ei);e[qi]={constructor:e,init:function(t){},mergeOption:function(t){i.merge(this[ti],t,!0)},get:function(t,e){if(!t)return this[ti];typeof t===Bi&&(t=t.split("."));for(var i=this[ti],n=this.parentModel,r=0;r<t[Fi]&&(i=i&&typeof i===Gi?i[t[r]]:null,null!=i);r++);return null==i&&n&&!e&&(i=n.get(t)),i},getShallow:function(t,e){var i=this[ti],n=i&&i[t],r=this.parentModel;return null==n&&r&&!e&&(n=r[Ci](t)),n},getModel:function(t,i){var n=this.get(t,!0),r=this.parentModel,a=new e(n,i||r&&r[ai](t),this[oi]);return a},isEmpty:function(){return null==this[ti]},restoreData:function(){},clone:function(){var t=this.constructor;return new t(i.clone(this[ti]))},setReadOnly:function(t){n.setReadOnly(this,t)}},n[Pi](e);var r=i.mixin;return r(e,t("./mixin/lineStyle")),r(e,t("./mixin/areaStyle")),r(e,t("./mixin/textStyle")),r(e,t("./mixin/itemStyle")),e}),e("echarts/util/component",[ji,Wi,"./clazz"],function(t){var e=t(Wi),i=t("./clazz"),n=i[zi],r=0,a={},o="_";return a.getUID=function(t){return[t||"",r++,Math.random()].join(o)},a.enableSubTypeDefaulter=function(t){var e={};return t.registerSubTypeDefaulter=function(t,i){t=n(t),e[t.main]=i},t.determineSubType=function(i,r){var a=r.type;if(!a){var o=n(i).main;t.hasSubTypes(i)&&e[o]&&(a=e[o](r))}return a},t},a.enableTopologicalTravel=function(t,i){function n(t){var n={},o=[];return e.each(t,function(s){var l=r(n,s),c=l.originalDeps=i(s),u=a(c,t);l.entryCount=u[Fi],0===l.entryCount&&o.push(s),e.each(u,function(t){e[Ei](l.predecessor,t)<0&&l.predecessor.push(t);var i=r(n,t);e[Ei](i.successor,t)<0&&i.successor.push(s)})}),{graph:n,noEntryList:o}}function r(t,e){return t[e]||(t[e]={predecessor:[],successor:[]}),t[e]}function a(t,i){var n=[];return e.each(t,function(t){e[Ei](i,t)>=0&&n.push(t)}),n}t.topologicalTravel=function(t,i,r,a){function o(t){c[t].entryCount--,0===c[t].entryCount&&u.push(t)}function s(t){h[t]=!0,o(t)}if(t[Fi]){var l=n(i),c=l.graph,u=l.noEntryList,h={};for(e.each(t,function(t){h[t]=!0});u[Fi];){var d=u.pop(),f=c[d],p=!!h[d];p&&(r.call(a,d,f.originalDeps.slice()),delete h[d]),e.each(f.successor,p?s:o)}e.each(h,function(){throw new Error("Circle dependency may exists")})}}},a}),e("echarts/util/number",[ji,Wi],function(t){function e(t){return t[Je](/^\s+/,"")[Je](/\s+$/,"")}var i=t(Wi),n={},r=1e-4;return n[Ke]=function(t,e,r,a){if(i[Qe](t))return i.map(t,function(t){return n[Ke](t,e,r,a)});var o=e[1]-e[0];if(0===o)return(r[0]+r[1])/2;var s=(t-e[0])/o;return a&&(s=Math.min(Math.max(s,0),1)),s*(r[1]-r[0])+r[0]},n[$e]=function(t,i){switch(t){case ui:case hi:t="50%";break;case"left":case"top":t="0%";break;case"right":case di:t="100%"}return typeof t===Bi?e(t).match(/%$/)?parseFloat(t)/100*i:parseFloat(t):null==t?NaN:+t},n.round=function(t){return+(+t)[Ye](12)},n.asc=function(t){return t.sort(function(t,e){return t-e}),t},n.getPrecision=function(t){for(var e=1,i=0;Math.round(t*e)/e!==t;)e*=10,i++;return i},n[Xe]=function(t,e){var i=Math.log,n=Math.LN10,r=Math.floor(i(t[1]-t[0])/n),a=Math.round(i(Math.abs(e[1]-e[0]))/n);return Math.max(-r+a,0)},n.MAX_SAFE_INTEGER=9007199254740991,n.remRadian=function(t){var e=2*Math.PI;return(t%e+e)%e},n.isRadianAroundZero=function(t){return t>-r&&r>t},n.parseDate=function(t){return t instanceof Date?t:new Date(typeof t===Bi?t[Je](/-/g,"/"):t)},n}),e("echarts/util/format",[ji,Wi,"./number"],function(t){function e(t){return isNaN(t)?"-":(t=(t+"").split("."),t[0][Je](/(\d{1,3})(?=(?:\d{3})+(?!\d))/g,"$1,")+(t[Fi]>1?"."+t[1]:""))}function i(t){return t[Ue]()[Je](/-(.)/g,function(t,e){return e[je]()})}function n(t){var e=t[Fi];return typeof t===Ri?[t,t,t,t]:2===e?[t[0],t[1],t[0],t[1]]:3===e?[t[0],t[1],t[2],t[1]]:t}function r(t){return String(t)[Je](/&/g,"&amp;")[Je](/</g,"&lt;")[Je](/>/g,"&gt;")[Je](/"/g,"&quot;")[Je](/'/g,"&#39;")}function a(t,e){return"{"+t+(null==e?"":e)+"}"}function o(t,e){c[Qe](e)||(e=[e]);var i=e[Fi];if(!i)return"";for(var n=e[0].$vars,r=0;r<n[Fi];r++){var o=h[r];t=t[Je](a(o),a(o,0))}for(var s=0;i>s;s++)for(var l=0;l<n[Fi];l++)t=t[Je](a(h[l],s),e[s][n[l]]);return t}function s(t,e){("week"===t||"month"===t||"quarter"===t||"half-year"===t||"year"===t)&&(t="MM-dd\nyyyy");var i=u.parseDate(e),n=i.getFullYear(),r=i.getMonth()+1,a=i.getDate(),o=i.getHours(),s=i.getMinutes(),c=i.getSeconds();return t=t[Je]("MM",l(r))[Ue]()[Je]("yyyy",n)[Je]("yy",n%100)[Je]("dd",l(a))[Je]("d",a)[Je]("hh",l(o))[Je]("h",o)[Je]("mm",l(s))[Je]("m",s)[Je]("ss",l(c))[Je]("s",c)}function l(t){return 10>t?"0"+t:t}var c=t(Wi),u=t("./number"),h=["a","b","c","d","e","f","g"];return{normalizeCssArray:n,addCommas:e,toCamelCase:i,encodeHTML:r,formatTpl:o,formatTime:s}}),e("echarts/util/layout",[ji,Wi,_i,"./number","./format"],function(t){function e(t,e,i,n,r){var a=0,o=0;null==n&&(n=1/0),null==r&&(r=1/0);var s=0;e[qe](function(l,c){var u,h,d=l[We],f=l[ni](),p=e[He](c+1),v=p&&p[ni]();if(t===Ge){var m=f.width+(v?-v.x+f.x:0);u=a+m,u>n||l.newline?(a=0,u=m,o+=s+i,s=0):s=Math.max(s,f[gi])}else{var g=f[gi]+(v?-v.y+f.y:0);h=o+g,h>r||l.newline?(a+=s+i,o=0,h=g,s=0):s=Math.max(s,f.width)}l.newline||(d[0]=a,d[1]=o,t===Ge?a=u+i:o=h+i)})}var i=t(Wi),n=t(_i),r=t("./number"),a=t("./format"),o=r[$e],s=i.each,l={};return l.box=e,l.vbox=i.curry(e,Fe),l.hbox=i.curry(e,Ge),l.getAvailableSize=function(t,e,i){var n=e.width,r=e[gi],s=o(t.x,n),l=o(t.y,r),c=o(t.x2,n),u=o(t.y2,r);return(isNaN(s)||isNaN(parseFloat(t.x)))&&(s=0),(isNaN(c)||isNaN(parseFloat(t.x2)))&&(c=n),(isNaN(l)||isNaN(parseFloat(t.y)))&&(l=0),(isNaN(u)||isNaN(parseFloat(t.y2)))&&(u=r),i=a.normalizeCssArray(i||0),{width:Math.max(c-s-i[1]-i[3],0),height:Math.max(u-l-i[0]-i[2],0)}},l[Ve]=function(t,e,i){i=a.normalizeCssArray(i||0);var r=e.width,s=e[gi],l=o(t.left,r),c=o(t.top,s),u=o(t.right,r),h=o(t[di],s),d=o(t.width,r),f=o(t[gi],s),p=i[2]+i[0],v=i[1]+i[3],m=t.aspect;switch(isNaN(d)&&(d=r-u-v-l),isNaN(f)&&(f=s-h-p-c),isNaN(d)&&isNaN(f)&&(m>r/s?d=.8*r:f=.8*s),null!=m&&(isNaN(d)&&(d=m*f),isNaN(f)&&(f=d/m)),isNaN(l)&&(l=r-u-d-v),isNaN(c)&&(c=s-h-f-p),t.left||t.right){case ui:l=r/2-d/2-i[3];break;case"right":l=r-d-v}switch(t.top||t[di]){case hi:case ui:c=s/2-f/2-i[0];break;case di:c=s-f-p}var g=new n(l+i[3],c+i[0],d,f);return g.margin=i,g},l.positionGroup=function(t,e,n,r){var a=t[ni]();e=i[Li](i.clone(e),{width:a.width,height:a[gi]}),e=l[Ve](e,n,r),t[We]=[e.x-a.x,e.y-a.y]},l.mergeLayoutParam=function(t,e,i){function n(n){var o={},l=0,c={},u=0,h=i.ignoreSize?1:2;if(s(n,function(e){c[e]=t[e]}),s(n,function(t){r(e,t)&&(o[t]=c[t]=e[t]),a(o,t)&&l++,a(c,t)&&u++}),u!==h&&l){if(h>u){var d=0;return s(n,function(t){"auto"===c[t]&&(h-u>d?d++:c[t]=null)}),c}if(l>=h)return o;for(var f=0;f<n[Fi];f++){var p=n[f];if(!r(o,p)&&r(t,p)){o[p]=t[p];break}}return o}return c}function r(t,e){return t.hasOwnProperty(e)}function a(t,e){return null!=t[e]&&"auto"!==t[e]}function o(t,e,i){s(t,function(t){e[t]=i[t]})}i=i||{};var l=["width","left","right"],c=[gi,"top",di],u=n(l),h=n(c);o(l,t,u),o(c,t,h)},l.getLayoutParams=function(t){var e={};return t&&s(["left","right","top",di,"width",gi],function(i){t.hasOwnProperty(i)&&(e[i]=t[i])}),e},l}),e("echarts/model/mixin/boxLayout",[ji],function(t){return{getBoxLayoutParams:function(){return{left:this.get("left"),top:this.get("top"),right:this.get("right"),bottom:this.get(di),width:this.get("width"),height:this.get(gi)}}}}),e("echarts/model/Component",[ji,"./Model",Wi,"../util/component",ei,"../util/layout","./mixin/boxLayout"],function(t){function e(t){var e=[];return n.each(l.getClassesByMainType(t),function(t){r.apply(e,t[qi].dependencies||[])}),n.map(e,function(t){return o[zi](t).main})}var i=t("./Model"),n=t(Wi),r=Array[qi].push,a=t("../util/component"),o=t(ei),s=t("../util/layout"),l=i[Li]({type:"component",id:"",name:"",mainType:"",subType:"",componentIndex:0,defaultOption:null,ecModel:null,dependentModels:[],uid:null,layoutMode:null,init:function(t,e,i,n){this[Ne](this[ti],this[oi])},mergeDefaultAndTheme:function(t,e){var i=this.layoutMode,r=i?s.getLayoutParams(t):{},a=e.getTheme();n.merge(t,a.get(this.mainType)),n.merge(t,this.getDefaultOption()),i&&s.mergeLayoutParam(t,r,i)},mergeOption:function(t){n.merge(this[ti],t,!0);var e=this.layoutMode;e&&s.mergeLayoutParam(this[ti],t,e)},getDefaultOption:function(){if(!this.hasOwnProperty("__defaultOption")){for(var t=[],e=this.constructor;e;){var i=e[qi].defaultOption;i&&t.push(i),e=e.superClass}for(var r={},a=t[Fi]-1;a>=0;a--)r=n.merge(r,t[a],!0);this.__defaultOption=r}return this.__defaultOption}});return o[Pi](l,function(t,e,i,r){n[Li](this,r),this.uid=a.getUID("componentModel"),this.setReadOnly(["type","id","uid","name","mainType","subType","dependentModels","componentIndex"])}),o[Ti](l,{registerWhenExtend:!0}),a.enableSubTypeDefaulter(l),a.enableTopologicalTravel(l,e),n.mixin(l,t("./mixin/boxLayout")),l}),e("echarts/model/globalDefault",[],function(){var t="";return typeof navigator!==bi&&(t=navigator.platform||""),{color:["#c23531","#314656","#61a0a8","#dd8668","#91c7ae","#6e7074","#61a0a8","#bda29a","#44525d","#c4ccd3"],grid:{},textStyle:{fontFamily:t.match(/^Win/)?"Microsoft YaHei":"sans-serif",fontSize:12,fontStyle:"normal",fontWeight:"normal"},animation:!0,animationThreshold:2e3,animationDuration:1e3,animationDurationUpdate:300,animationEasing:"exponentialOut",animationEasingUpdate:"cubicOut"}}),e("echarts/model/Global",[ji,Wi,"./Model","./Component","./globalDefault"],function(t){function e(t,e){for(var i in e)_.hasClass(i)||(typeof e[i]===Gi?t[i]=t[i]?h.merge(t[i],e[i],!1):h.clone(e[i]):t[i]=e[i])}function i(t){t=t,this[ti]={},this._componentsMap={},this._seriesIndices=null,e(t,this._theme[ti]),h.merge(t,x,!1),this[Ee](t)}function n(t,e){h[Qe](e)||(e=e?[e]:[]);var i={};return f(e,function(e){i[e]=(t[e]||[]).slice()}),i}function r(t,e){t=(t||[]).slice();var i=[];return f(e,function(e,n){if(y(e)&&e.id)for(var r=0,a=t[Fi];a>r;r++)if(t[r].id===e.id)return void(i[n]=t[Ie](r,1)[0])}),f(e,function(e,n){if(y(e)&&e.name&&!c(e))for(var r=0,a=t[Fi];a>r;r++)if(t[r].name===e.name)return void(i[n]=t[Ie](r,1)[0])}),f(e,function(e,n){i[n]||!t[n]||c(e)||(i[n]=t[n])}),i}function a(t,e,i){function n(n){f(e,function(e,a){if(y(e)){var o=i[a],s=r[a],l=t+"."+s.subType;n(s,e,o,l)}})}var r=[],a="\x00",s={},l={};return f(e,function(e,n){if(y(e)){var a=i[n],s=o(t,e,a),l={mainType:t,subType:s};r[n]=l}}),n(function(t,e,i,n){t.name=i?i.name:null!=e.name?e.name:a+"-",l[t.name]=0}),n(function(t,e,i,n){var r=t.name;if(t.id=i?i.id:null!=e.id?e.id:a+[n,r,l[r]++].join("|"),s[t.id])throw new Error("id duplicates: "+t.id);s[t.id]=1}),r}function o(t,e,i){var n=e.type?e.type:i?i.subType:_.determineSubType(t,e);return n}function s(t){return v(t,function(t){return t.componentIndex})||[]}function l(t,e){return e.hasOwnProperty("subType")?p(t,function(t){return t.subType===e.subType}):t}function c(t){return t.id&&0===(t.id+"")[Ei]("\x00_ec_\x00")}function u(t){if(!t._seriesIndices)throw new Error("Series is not initialized. Please depends sereis.")}var h=t(Wi),d=t("./Model"),f=h.each,p=h[Hi],v=h.map,m=h[Qe],g=h[Ei],y=h[Ze],_=t("./Component"),x=t("./globalDefault"),b=d[Li]({constructor:b,init:function(t,e,i,n){i=i||{},this[ti]=null,this._theme=new d(i),this._optionManager=n},setOption:function(t,e){this._optionManager.setOption(t,e),this.resetOption()},resetOption:function(t){var e=!1,n=this._optionManager;if(!t||"recreate"===t){var r=n.mountOption();this[ti]&&"recreate"!==t?(this.restoreData(),this[Ee](r)):i.call(this,r),e=!0}if(("timeline"===t||"media"===t)&&this.restoreData(),!t||"recreate"===t||"timeline"===t){var a=n.getTimelineOption(this);a&&(this[Ee](a),e=!0)}if(!t||"recreate"===t||"media"===t){var o=n.getMediaOption(this,this._api);o[Fi]&&f(o,function(t){this[Ee](t,e=!0)},this)}return e},mergeOption:function(t){function e(e,n){var r=t[e];r?o.call(this,e,r,n):i.call(this,e),e===Be&&(this._seriesIndices=s(c[Be]))}function i(t){f(c[t],function(t){t[Ee]({},this)},this)}function o(t,e,i){h[Qe](e)||(e=[e]),c[t]||(c[t]=[]);var o=r(c[t],e),s=a(t,e,o),u=n(c,i);l[t]=[],f(e,function(e,i){if(y(e)){var n=o[i],r=_[Ai](t,s[i].subType,!0);n&&n instanceof r?n[Ee](e,this):(n=new r(e,this,this,h[Li]({dependentModels:u,componentIndex:i},s[i])),c[t][i]=n),l[t][i]=n[ti]}},this)}var l=this[ti],c=this._componentsMap,u=[];f(t,function(t,e){null!=t&&(_.hasClass(e)?u.push(e):l[e]=null==l[e]?h.clone(t):h.merge(l[e],t,!0))}),_.topologicalTravel(u,_.getAllClassMainTypes(),e,this)},getTheme:function(){return this._theme},getComponent:function(t,e){var i=this._componentsMap[t];return i?i[e||0]:void 0},queryComponents:function(t){var e=t.mainType;if(!e)return[];var i=t.index,n=t.id,r=t.name,a=this._componentsMap[e];if(!a||!a[Fi])return[];var o;if(null!=i)m(i)||(i=[i]),o=p(v(i,function(t){return a[t]}),function(t){return!!t});else if(null!=n){var s=m(n);o=p(a,function(t){return s&&g(n,t.id)>=0||!s&&t.id===n})}else if(null!=r){var c=m(r);o=p(a,function(t){return c&&g(r,t.name)>=0||!c&&t.name===r})}return l(o,t)},findComponents:function(t){function e(t){var e=r+"Index",i=r+"Id",n=r+"Name";return t&&(t.hasOwnProperty(e)||t.hasOwnProperty(i)||t.hasOwnProperty(n))?{mainType:r,index:t[e],id:t[i],name:t[n]}:null}function i(e){return t[Hi]?p(e,t[Hi]):e}var n=t.query,r=t.mainType,a=e(n),o=a?this.queryComponents(a):this._componentsMap[r];return i(l(o,t))},eachComponent:function(t,e,i){var n=this._componentsMap;if(typeof t===Ii)i=e,e=t,f(n,function(t,n){f(t,function(t,r){e.call(i,n,t,r)})});else if(h[Re](t))f(n[t],e,i);else if(y(t)){var r=this[Oe](t);f(r,e,i)}},getSeriesByName:function(t){var e=this._componentsMap[Be];return p(e,function(e){return e.name===t})},getSeriesByIndex:function(t){return this._componentsMap[Be][t]},getSeriesByType:function(t){var e=this._componentsMap[Be];return p(e,function(e){return e.subType===t})},getSeries:function(){return this._componentsMap[Be].slice()},eachSeries:function(t,e){u(this),f(this._seriesIndices,function(i){var n=this._componentsMap[Be][i];t.call(e,n,i)},this)},eachRawSeries:function(t,e){f(this._componentsMap[Be],t,e)},eachSeriesByType:function(t,e,i){u(this),f(this._seriesIndices,function(n){var r=this._componentsMap[Be][n];r.subType===t&&e.call(i,r,n)},this)},eachRawSeriesByType:function(t,e,i){return f(this.getSeriesByType(t),e,i)},isSeriesFiltered:function(t){return u(this),h[Ei](this._seriesIndices,t.componentIndex)<0},filterSeries:function(t,e){u(this);var i=p(this._componentsMap[Be],t,e);this._seriesIndices=s(i)},restoreData:function(){var t=this._componentsMap;this._seriesIndices=s(t[Be]);var e=[];f(t,function(t,i){e.push(i)}),_.topologicalTravel(e,_.getAllClassMainTypes(),function(e,i){f(t[e],function(t){t.restoreData()})})}});return b}),e("echarts/ExtensionAPI",[ji,Wi],function(t){function e(t){i.each(n,function(e){this[e]=i.bind(t[e],t)},this)}var i=t(Wi),n=[ze,"getZr",Pe,Le,De,"on","off","getDataURL","getConnectedDataURL"];return e}),e("echarts/CoordinateSystem",[ji],function(t){
function e(){this._coordinateSystems={},this._coordinateSystemsList=[]}var i={};return e[qi]={constructor:e,update:function(t,e){var n={};for(var r in i)n[r]=i[r][mi](t,e);this._coordinateSystems=n},get:function(t,e){var i=this._coordinateSystems[t];return i?i[e||0]:void 0}},e[Te]=function(t,e){i[t]=e},e}),e("echarts/model/OptionManager",[ji,Wi],function(t){function e(t){this._api=t,this._timelineOptions,this._mediaList,this._mediaDefault,this._currentMediaIndices=[],this._optionBackup}function i(t,e){var i,n,r=[],a=[],l=t.timeline;if(t.baseOption&&(n=t.baseOption),(l||t.options)&&(n=n||{},r=(t.options||[]).slice()),t.media){n=n||{};var c=t.media;s(c,function(t){t&&t[ti]&&(t.query?a.push(t):i||(i=t))})}return n||(n=t),n.timeline||(n.timeline=l),s([n][Oi](r)[Oi](o.map(a,function(t){return t[ti]})),function(t){s(e,function(e){e(t)})}),{baseOption:n,timelineOptions:r,mediaDefault:i,mediaList:a}}function n(t,e,i){var n={width:e,height:i,aspectratio:e/i},a=!0;return o.each(t,function(t,e){var i=e.match(u);if(i&&i[1]&&i[2]){var o=i[1],s=i[2][Ue]();r(n[s],t,o)||(a=!1)}}),a}function r(t,e,i){return"min"===i?t>=e:"max"===i?e>=t:t===e}function a(t,e){return t.join(",")===e.join(",")}var o=t(Wi),s=o.each,l=o.clone,c=o.map,u=/^(min|max)?(.+)$/;return e[qi]={constructor:e,setOption:function(t,e){t=l(t,!0),this._optionBackup=i.call(this,t,e)},mountOption:function(){var t=this._optionBackup;return this._timelineOptions=c(t.timelineOptions,l),this._mediaList=c(t.mediaList,l),this._mediaDefault=l(t.mediaDefault),this._currentMediaIndices=[],l(t.baseOption)},getTimelineOption:function(t){var e,i=this._timelineOptions;if(i[Fi]){var n=t[Ae]("timeline");n&&(e=l(i[n.getCurrentIndex()],!0))}return e},getMediaOption:function(t){var e=this._api[Pe](),i=this._api[Le](),r=this._mediaList,o=this._mediaDefault,s=[],u=[];if(!r[Fi]&&!o)return u;for(var h=0,d=r[Fi];d>h;h++)n(r[h].query,e,i)&&s.push(h);return!s[Fi]&&o&&(s=[-1]),s[Fi]&&!a(s,this._currentMediaIndices)&&(u=c(s,function(t){return l(-1===t?o[ti]:r[t][ti])})),this._currentMediaIndices=s,u}},e}),e("echarts/util/model",[ji,"./format","./number",Wi,"../model/Model"],function(t){var e=t("./format"),i=t("./number"),n=t(Wi),r=t("../model/Model"),a=["x","y","z",Ce,"angle"],o={};return o.createNameEach=function(t,e){t=t.slice();var i=n.map(t,o.capitalFirst);e=(e||[]).slice();var r=n.map(e,o.capitalFirst);return function(a,o){n.each(t,function(t,n){for(var s={name:t,capital:i[n]},l=0;l<e[Fi];l++)s[e[l]]=t+r[l];a.call(o,s)})}},o.capitalFirst=function(t){return t?t.charAt(0)[je]()+t[si](1):t},o.eachAxisDim=o.createNameEach(a,[ke,"axis","index"]),o.normalizeToArray=function(t){return n[Qe](t)?t:null==t?[]:[t]},o.createLinkedNodesFinder=function(t,e,i){function r(t,e){return n[Ei](e.nodes,t)>=0}function a(t,r){var a=!1;return e(function(e){n.each(i(t,e)||[],function(t){r.records[e.name][t]&&(a=!0)})}),a}function o(t,r){r.nodes.push(t),e(function(e){n.each(i(t,e)||[],function(t){r.records[e.name][t]=!0})})}return function(i){function n(t){!r(t,s)&&a(t,s)&&(o(t,s),l=!0)}var s={nodes:[],records:{}};if(e(function(t){s.records[t.name]={}}),!i)return s;o(i,s);var l;do l=!1,t(n);while(l);return s}},o.defaultEmphasis=function(t,e){if(t){var i=t[Se]=t[Se]||{},r=t[Me]=t[Me]||{};n.each(e,function(t){var e=n.retrieve(i[t],r[t]);null!=e&&(i[t]=e)})}},o.createDataFormatModel=function(t,e,i){var a=new r;return n.mixin(a,o.dataFormatMixin),a[we]=t[we],a.name=t.name||"",a[be]=function(){return e},a.getRawDataArray=function(){return i},a},o.getDataItemValue=function(t){return t&&(null==t.value?t:t.value)},o.converDataValue=function(t,e){var n=e&&e.type;return n===xe?t:("time"!==n||isFinite(t)||null==t||"-"===t||(t=+i.parseDate(t)),null==t||""===t?NaN:+t)},o.dataFormatMixin={getDataParams:function(t){var e=this[be](),i=this[we],n=this.name,r=this[_e](t),a=e[ye](t),o=e[ge](t,!0),s=this.getRawDataArray(),l=s&&s[a];return{seriesIndex:i,seriesName:n,name:o,dataIndex:a,data:l,value:r,$vars:["seriesName","name","value"]}},getFormattedLabel:function(t,i,n){i=i||Me;var r=this[be](),a=r[me](t),o=this[ve](t);return n||(n=a.get(["label",i,"formatter"])),typeof n===Ii?(o.status=i,n(o)):typeof n===Bi?e.formatTpl(n,o):void 0},getRawValue:function(t){var e=this[be]()[me](t);if(e&&null!=e[ti]){var i=e[ti];return n[Ze](i)&&!n[Qe](i)?i.value:i}}},o}),e("echarts/model/Series",[ji,Wi,"../util/format","../util/model","./Component"],function(t){var e=t(Wi),i=t("../util/format"),n=t("../util/model"),r=t("./Component"),a=i.encodeHTML,o=i[pe],s=r[Li]({type:"series",seriesIndex:0,coordinateSystem:null,defaultOption:null,legendDataProvider:null,init:function(t,e,i,n){this[we]=this.componentIndex,this[Ne](t,i),this._dataBeforeProcessed=this.getInitialData(t,i),this._data=this._dataBeforeProcessed.cloneShallow()},mergeDefaultAndTheme:function(t,i){e.merge(t,i.getTheme().get(this.subType)),e.merge(t,this.getDefaultOption()),n.defaultEmphasis(t.label,[We,"show",ri,xi,"formatter"])},mergeOption:function(t,i){t=e.merge(this[ti],t,!0);var n=this.getInitialData(t,i);n&&(this._data=n,this._dataBeforeProcessed=n.cloneShallow())},getInitialData:function(){},getData:function(){return this._data},setData:function(t){this._data=t},getRawData:function(){return this._dataBeforeProcessed},getRawDataArray:function(){return this[ti].data},getDimensionsOnAxis:function(t){return[t]},formatTooltip:function(t,i){var n=this._data,r=this[_e](t),s=e[Qe](r)?e.map(r,o).join(", "):o(r),l=n[ge](t);return i?a(this.name)+" : "+s:a(this.name)+"<br />"+(l?a(l)+" : "+s:s)},restoreData:function(){this._data=this._dataBeforeProcessed.cloneShallow()}});return e.mixin(s,n.dataFormatMixin),s}),e("zrender/core/guid",[],function(){var t=2311;return function(){return"zr_"+t++}}),e(fe,[ji,pi],function(t){var e=Array[qi].slice,i=t(pi),n=i[Ei],r=function(){this._$handlers={}};return r[qi]={constructor:r,one:function(t,e,i){var r=this._$handlers;return e&&t?(r[t]||(r[t]=[]),n(r[t],t)>=0?this:(r[t].push({h:e,one:!0,ctx:i||this}),this)):this},on:function(t,e,i){var n=this._$handlers;return e&&t?(n[t]||(n[t]=[]),n[t].push({h:e,one:!1,ctx:i||this}),this):this},isSilent:function(t){var e=this._$handlers;return e[t]&&e[t][Fi]},off:function(t,e){var i=this._$handlers;if(!t)return this._$handlers={},this;if(e){if(i[t]){for(var n=[],r=0,a=i[t][Fi];a>r;r++)i[t][r].h!=e&&n.push(i[t][r]);i[t]=n}i[t]&&0===i[t][Fi]&&delete i[t]}else delete i[t];return this},trigger:function(t){if(this._$handlers[t]){var i=arguments,n=i[Fi];n>3&&(i=e.call(i,1));for(var r=this._$handlers[t],a=r[Fi],o=0;a>o;){switch(n){case 1:r[o].h.call(r[o].ctx);break;case 2:r[o].h.call(r[o].ctx,i[1]);break;case 3:r[o].h.call(r[o].ctx,i[1],i[2]);break;default:r[o].h.apply(r[o].ctx,i)}r[o].one?(r[Ie](o,1),a--):o++}}return this},triggerWithContext:function(t){if(this._$handlers[t]){var i=arguments,n=i[Fi];n>4&&(i=e.call(i,1,i[Fi]-1));for(var r=i[i[Fi]-1],a=this._$handlers[t],o=a[Fi],s=0;o>s;){switch(n){case 1:a[s].h.call(r);break;case 2:a[s].h.call(r,i[1]);break;case 3:a[s].h.call(r,i[1],i[2]);break;default:a[s].h.apply(r,i)}a[s].one?(a[Ie](s,1),o--):s++}}return this}},r}),e("zrender/mixin/Transformable",[ji,"../core/matrix","../core/vector"],function(t){function e(t){return t>a||-a>t}var i=t("../core/matrix"),n=t("../core/vector"),r=i.identity,a=5e-5,o=function(t){t=t||{},t[We]||(this[We]=[0,0]),null==t[de]&&(this[de]=0),t.scale||(this.scale=[1,1]),this.origin=this.origin||null},s=o[qi];s[he]=null,s.needLocalTransform=function(){return e(this[de])||e(this[We][0])||e(this[We][1])||e(this.scale[0]-1)||e(this.scale[1]-1)},s.updateTransform=function(){var t=this[ue],e=t&&t[he],n=this.needLocalTransform(),a=this[he];return n||e?(a=a||i[mi](),n?this[ce](a):r(a),e&&(n?i.mul(a,t[he],a):i.copy(a,t[he])),this[he]=a,this.invTransform=this.invTransform||i[mi](),void i.invert(this.invTransform,a)):void(a&&r(a))},s[ce]=function(t){t=t||[],r(t);var e=this.origin,n=this.scale,a=this[de],o=this[We];return e&&(t[4]-=e[0],t[5]-=e[1]),i.scale(t,t,n),a&&i[le](t,t,a),e&&(t[4]+=e[0],t[5]+=e[1]),t[4]+=o[0],t[5]+=o[1],t},s.setTransform=function(t){var e=this[he];e&&t[he](e[0],e[1],e[2],e[3],e[4],e[5])};var l=[];return s.decomposeTransform=function(){if(this[he]){var t=this[ue],n=this[he];t&&t[he]&&(i.mul(l,t.invTransform,n),n=l);var r=n[0]*n[0]+n[1]*n[1],a=n[2]*n[2]+n[3]*n[3],o=this[We],s=this.scale;e(r-1)&&(r=Math.sqrt(r)),e(a-1)&&(a=Math.sqrt(a)),n[0]<0&&(r=-r),n[3]<0&&(a=-a),o[0]=n[4],o[1]=n[5],s[0]=r,s[1]=a,this[de]=Math.atan2(-n[1]/a,n[0]/r)}},s[se]=function(t,e){var i=[t,e],r=this.invTransform;return r&&n[yi](i,i,r),i},s.transformCoordToGlobal=function(t,e){var i=[t,e],r=this[he];return r&&n[yi](i,i,r),i},o}),e("zrender/animation/easing",[],function(){var t={linear:function(t){return t},quadraticIn:function(t){return t*t},quadraticOut:function(t){return t*(2-t)},quadraticInOut:function(t){return(t*=2)<1?.5*t*t:-.5*(--t*(t-2)-1)},cubicIn:function(t){return t*t*t},cubicOut:function(t){return--t*t*t+1},cubicInOut:function(t){return(t*=2)<1?.5*t*t*t:.5*((t-=2)*t*t+2)},quarticIn:function(t){return t*t*t*t},quarticOut:function(t){return 1- --t*t*t*t},quarticInOut:function(t){return(t*=2)<1?.5*t*t*t*t:-.5*((t-=2)*t*t*t-2)},quinticIn:function(t){return t*t*t*t*t},quinticOut:function(t){return--t*t*t*t*t+1},quinticInOut:function(t){return(t*=2)<1?.5*t*t*t*t*t:.5*((t-=2)*t*t*t*t+2)},sinusoidalIn:function(t){return 1-Math.cos(t*Math.PI/2)},sinusoidalOut:function(t){return Math.sin(t*Math.PI/2)},sinusoidalInOut:function(t){return.5*(1-Math.cos(Math.PI*t))},exponentialIn:function(t){return 0===t?0:Math.pow(1024,t-1)},exponentialOut:function(t){return 1===t?1:1-Math.pow(2,-10*t)},exponentialInOut:function(t){return 0===t?0:1===t?1:(t*=2)<1?.5*Math.pow(1024,t-1):.5*(-Math.pow(2,-10*(t-1))+2)},circularIn:function(t){return 1-Math.sqrt(1-t*t)},circularOut:function(t){return Math.sqrt(1- --t*t)},circularInOut:function(t){return(t*=2)<1?-.5*(Math.sqrt(1-t*t)-1):.5*(Math.sqrt(1-(t-=2)*t)+1)},elasticIn:function(t){var e,i=.1,n=.4;return 0===t?0:1===t?1:(!i||1>i?(i=1,e=n/4):e=n*Math.asin(1/i)/(2*Math.PI),-(i*Math.pow(2,10*(t-=1))*Math.sin((t-e)*(2*Math.PI)/n)))},elasticOut:function(t){var e,i=.1,n=.4;return 0===t?0:1===t?1:(!i||1>i?(i=1,e=n/4):e=n*Math.asin(1/i)/(2*Math.PI),i*Math.pow(2,-10*t)*Math.sin((t-e)*(2*Math.PI)/n)+1)},elasticInOut:function(t){var e,i=.1,n=.4;return 0===t?0:1===t?1:(!i||1>i?(i=1,e=n/4):e=n*Math.asin(1/i)/(2*Math.PI),(t*=2)<1?-.5*(i*Math.pow(2,10*(t-=1))*Math.sin((t-e)*(2*Math.PI)/n)):i*Math.pow(2,-10*(t-=1))*Math.sin((t-e)*(2*Math.PI)/n)*.5+1)},backIn:function(t){var e=1.70158;return t*t*((e+1)*t-e)},backOut:function(t){var e=1.70158;return--t*t*((e+1)*t+e)+1},backInOut:function(t){var e=2.5949095;return(t*=2)<1?.5*(t*t*((e+1)*t-e)):.5*((t-=2)*t*((e+1)*t+e)+2)},bounceIn:function(e){return 1-t.bounceOut(1-e)},bounceOut:function(t){return 1/2.75>t?7.5625*t*t:2/2.75>t?7.5625*(t-=1.5/2.75)*t+.75:2.5/2.75>t?7.5625*(t-=2.25/2.75)*t+.9375:7.5625*(t-=2.625/2.75)*t+.984375},bounceInOut:function(e){return.5>e?.5*t.bounceIn(2*e):.5*t.bounceOut(2*e-1)+.5}};return t}),e("zrender/animation/Clip",[ji,"./easing"],function(t){function e(t){this._target=t[oe],this._life=t.life||1e3,this._delay=t.delay||0,this._initialized=!1,this.loop=null==t.loop?!1:t.loop,this.gap=t.gap||0,this.easing=t.easing||"Linear",this.onframe=t.onframe,this.ondestroy=t.ondestroy,this.onrestart=t.onrestart}var i=t("./easing");return e[qi]={constructor:e,step:function(t){this._initialized||(this._startTime=(new Date).getTime()+this._delay,this._initialized=!0);var e=(t-this._startTime)/this._life;if(!(0>e)){e=Math.min(e,1);var n=this.easing,r=typeof n==Bi?i[n]:n,a=typeof r===Ii?r(e):e;return this.fire("frame",a),1==e?this.loop?(this.restart(),"restart"):(this._needsRemove=!0,"destroy"):null}},restart:function(){var t=(new Date).getTime(),e=(t-this._startTime)%this._life;this._startTime=(new Date).getTime()-e+this.gap,this._needsRemove=!1},fire:function(t,e){t="on"+t,this[t]&&this[t](this._target,e)}},e}),e(ae,[ji],function(t){function e(t){return t=Math.round(t),0>t?0:t>255?255:t}function i(t){return t=Math.round(t),0>t?0:t>360?360:t}function n(t){return 0>t?0:t>1?1:t}function r(t){return e(t[Fi]&&"%"===t.charAt(t[Fi]-1)?parseFloat(t)/100*255:parseInt(t,10))}function a(t){return n(t[Fi]&&"%"===t.charAt(t[Fi]-1)?parseFloat(t)/100:parseFloat(t))}function o(t,e,i){return 0>i?i+=1:i>1&&(i-=1),1>6*i?t+(e-t)*i*6:1>2*i?e:2>3*i?t+(e-t)*(2/3-i)*6:t}function s(t,e,i){return t+(e-t)*i}function l(t){if(t){t+="";var e=t[Je](/ /g,"")[Ue]();if(e in _)return _[e].slice();if("#"!==e.charAt(0)){var i=e[Ei]("("),n=e[Ei](")");if(-1!==i&&n+1===e[Fi]){var o=e[si](0,i),s=e[si](i+1,n-(i+1)).split(","),l=1;switch(o){case"rgba":if(4!==s[Fi])return;l=a(s.pop());case"rgb":if(3!==s[Fi])return;return[r(s[0]),r(s[1]),r(s[2]),l];case"hsla":if(4!==s[Fi])return;return s[3]=a(s[3]),c(s);case"hsl":if(3!==s[Fi])return;return c(s);default:return}}}else{if(4===e[Fi]){var u=parseInt(e[si](1),16);if(!(u>=0&&4095>=u))return;return[(3840&u)>>4|(3840&u)>>8,240&u|(240&u)>>4,15&u|(15&u)<<4,1]}if(7===e[Fi]){var u=parseInt(e[si](1),16);if(!(u>=0&&16777215>=u))return;return[(16711680&u)>>16,(65280&u)>>8,255&u,1]}}}}function c(t){var i=(parseFloat(t[0])%360+360)%360/360,n=a(t[1]),r=a(t[2]),s=.5>=r?r*(n+1):r+n-r*n,l=2*r-s,c=[e(255*o(l,s,i+1/3)),e(255*o(l,s,i)),e(255*o(l,s,i-1/3))];return 4===t[Fi]&&(c[3]=t[3]),c}function u(t){if(t){var e,i,n=t[0]/255,r=t[1]/255,a=t[2]/255,o=Math.min(n,r,a),s=Math.max(n,r,a),l=s-o,c=(s+o)/2;if(0===l)e=0,i=0;else{i=.5>c?l/(s+o):l/(2-s-o);var u=((s-n)/6+l/2)/l,h=((s-r)/6+l/2)/l,d=((s-a)/6+l/2)/l;n===s?e=d-h:r===s?e=1/3+u-d:a===s&&(e=2/3+h-u),0>e&&(e+=1),e>1&&(e-=1)}var f=[360*e,i,c];return null!=t[3]&&f.push(t[3]),f}}function h(t,e){var i=l(t);if(i){for(var n=0;3>n;n++)0>e?i[n]=i[n]*(1-e)|0:i[n]=(255-i[n])*e+i[n]|0;return y(i,4===i[Fi]?"rgba":"rgb")}}function d(t,e){var i=l(t);return i?((1<<24)+(i[0]<<16)+(i[1]<<8)+ +i[2]).toString(16).slice(1):void 0}function f(t,i,n){if(i&&i[Fi]&&t>=0&&1>=t){n=n||[0,0,0,0];var r=t*(i[Fi]-1),a=Math.floor(r),o=Math.ceil(r),l=i[a],c=i[o],u=r-a;return n[0]=e(s(l[0],c[0],u)),n[1]=e(s(l[1],c[1],u)),n[2]=e(s(l[2],c[2],u)),n[3]=e(s(l[3],c[3],u)),n}}function p(t,i,r){if(i&&i[Fi]&&t>=0&&1>=t){var a=t*(i[Fi]-1),o=Math.floor(a),c=Math.ceil(a),u=l(i[o]),h=l(i[c]),d=a-o,f=y([e(s(u[0],h[0],d)),e(s(u[1],h[1],d)),e(s(u[2],h[2],d)),n(s(u[3],h[3],d))],"rgba");return r?{color:f,leftIndex:o,rightIndex:c,value:a}:f}}function v(t,e){if(!(2!==t[Fi]||t[1]<t[0])){for(var i=p(t[0],e,!0),n=p(t[1],e,!0),r=[{color:i.color,offset:0}],a=n.value-i.value,o=Math.max(i.value,i.rightIndex),s=Math.min(n.value,n.leftIndex),l=o;a>0&&s>=l;l++)r.push({color:e[l],offset:(l-i.value)/a});return r.push({color:n.color,offset:1}),r}}function m(t,e,n,r){return t=l(t),t?(t=u(t),null!=e&&(t[0]=i(e)),null!=n&&(t[1]=a(n)),null!=r&&(t[2]=a(r)),y(c(t),"rgba")):void 0}function g(t,e){return t=l(t),t&&null!=e?(t[3]=n(e),y(t,"rgba")):void 0}function y(t,e){return("rgb"===e||"hsv"===e||"hsl"===e)&&(t=t.slice(0,3)),e+"("+t.join(",")+")"}var _={transparent:[0,0,0,0],aliceblue:[240,248,255,1],antiquewhite:[250,235,215,1],aqua:[0,255,255,1],aquamarine:[127,255,212,1],azure:[240,255,255,1],beige:[245,245,220,1],bisque:[255,228,196,1],black:[0,0,0,1],blanchedalmond:[255,235,205,1],blue:[0,0,255,1],blueviolet:[138,43,226,1],brown:[165,42,42,1],burlywood:[222,184,135,1],cadetblue:[95,158,160,1],chartreuse:[127,255,0,1],chocolate:[210,105,30,1],coral:[255,127,80,1],cornflowerblue:[100,149,237,1],cornsilk:[255,248,220,1],crimson:[220,20,60,1],cyan:[0,255,255,1],darkblue:[0,0,139,1],darkcyan:[0,139,139,1],darkgoldenrod:[184,134,11,1],darkgray:[169,169,169,1],darkgreen:[0,100,0,1],darkgrey:[169,169,169,1],darkkhaki:[189,183,107,1],darkmagenta:[139,0,139,1],darkolivegreen:[85,107,47,1],darkorange:[255,140,0,1],darkorchid:[153,50,204,1],darkred:[139,0,0,1],darksalmon:[233,150,122,1],darkseagreen:[143,188,143,1],darkslateblue:[72,61,139,1],darkslategray:[47,79,79,1],darkslategrey:[47,79,79,1],darkturquoise:[0,206,209,1],darkviolet:[148,0,211,1],deeppink:[255,20,147,1],deepskyblue:[0,191,255,1],dimgray:[105,105,105,1],dimgrey:[105,105,105,1],dodgerblue:[30,144,255,1],firebrick:[178,34,34,1],floralwhite:[255,250,240,1],forestgreen:[34,139,34,1],fuchsia:[255,0,255,1],gainsboro:[220,220,220,1],ghostwhite:[248,248,255,1],gold:[255,215,0,1],goldenrod:[218,165,32,1],gray:[128,128,128,1],green:[0,128,0,1],greenyellow:[173,255,47,1],grey:[128,128,128,1],honeydew:[240,255,240,1],hotpink:[255,105,180,1],indianred:[205,92,92,1],indigo:[75,0,130,1],ivory:[255,255,240,1],khaki:[240,230,140,1],lavender:[230,230,250,1],lavenderblush:[255,240,245,1],lawngreen:[124,252,0,1],lemonchiffon:[255,250,205,1],lightblue:[173,216,230,1],lightcoral:[240,128,128,1],lightcyan:[224,255,255,1],lightgoldenrodyellow:[250,250,210,1],lightgray:[211,211,211,1],lightgreen:[144,238,144,1],lightgrey:[211,211,211,1],lightpink:[255,182,193,1],lightsalmon:[255,160,122,1],lightseagreen:[32,178,170,1],lightskyblue:[135,206,250,1],lightslategray:[119,136,153,1],lightslategrey:[119,136,153,1],lightsteelblue:[176,196,222,1],lightyellow:[255,255,224,1],lime:[0,255,0,1],limegreen:[50,205,50,1],linen:[250,240,230,1],magenta:[255,0,255,1],maroon:[128,0,0,1],mediumaquamarine:[102,205,170,1],mediumblue:[0,0,205,1],mediumorchid:[186,85,211,1],mediumpurple:[147,112,219,1],mediumseagreen:[60,179,113,1],mediumslateblue:[123,104,238,1],mediumspringgreen:[0,250,154,1],mediumturquoise:[72,209,204,1],mediumvioletred:[199,21,133,1],midnightblue:[25,25,112,1],mintcream:[245,255,250,1],mistyrose:[255,228,225,1],moccasin:[255,228,181,1],navajowhite:[255,222,173,1],navy:[0,0,128,1],oldlace:[253,245,230,1],olive:[128,128,0,1],olivedrab:[107,142,35,1],orange:[255,165,0,1],orangered:[255,69,0,1],orchid:[218,112,214,1],palegoldenrod:[238,232,170,1],palegreen:[152,251,152,1],paleturquoise:[175,238,238,1],palevioletred:[219,112,147,1],papayawhip:[255,239,213,1],peachpuff:[255,218,185,1],peru:[205,133,63,1],pink:[255,192,203,1],plum:[221,160,221,1],powderblue:[176,224,230,1],purple:[128,0,128,1],red:[255,0,0,1],rosybrown:[188,143,143,1],royalblue:[65,105,225,1],saddlebrown:[139,69,19,1],salmon:[250,128,114,1],sandybrown:[244,164,96,1],seagreen:[46,139,87,1],seashell:[255,245,238,1],sienna:[160,82,45,1],silver:[192,192,192,1],skyblue:[135,206,235,1],slateblue:[106,90,205,1],slategray:[112,128,144,1],slategrey:[112,128,144,1],snow:[255,250,250,1],springgreen:[0,255,127,1],steelblue:[70,130,180,1],tan:[210,180,140,1],teal:[0,128,128,1],thistle:[216,191,216,1],tomato:[255,99,71,1],turquoise:[64,224,208,1],violet:[238,130,238,1],wheat:[245,222,179,1],white:[255,255,255,1],whitesmoke:[245,245,245,1],yellow:[255,255,0,1],yellowgreen:[154,205,50,1]};return{parse:l,lift:h,toHex:d,fastMapToColor:f,mapToColor:p,mapIntervalToColor:v,modifyHSL:m,modifyAlpha:g,stringify:y}}),e("zrender/animation/Animator",[ji,"./Clip","../tool/color",pi],function(t){function e(t,e){return t[e]}function i(t,e,i){t[e]=i}function n(t,e,i){return(e-t)*i+t}function r(t,e,i){return i>.5?e:t}function a(t,e,i,r,a){var o=t[Fi];if(1==a)for(var s=0;o>s;s++)r[s]=n(t[s],e[s],i);else for(var l=t[0][Fi],s=0;o>s;s++)for(var c=0;l>c;c++)r[s][c]=n(t[s][c],e[s][c],i)}function o(t,e,i){var n=t[Fi],r=e[Fi];if(n!==r){var a=n>r;if(a)t[Fi]=r;else for(var o=n;r>o;o++)t.push(1===i?e[o]:g.call(e[o]))}}function s(t,e,i){if(t===e)return!0;var n=t[Fi];if(n!==e[Fi])return!1;if(1===i){for(var r=0;n>r;r++)if(t[r]!==e[r])return!1}else for(var a=t[0][Fi],r=0;n>r;r++)for(var o=0;a>o;o++)if(t[r][o]!==e[r][o])return!1;return!0}function l(t,e,i,n,r,a,o,s,l){var u=t[Fi];if(1==l)for(var h=0;u>h;h++)s[h]=c(t[h],e[h],i[h],n[h],r,a,o);else for(var d=t[0][Fi],h=0;u>h;h++)for(var f=0;d>f;f++)s[h][f]=c(t[h][f],e[h][f],i[h][f],n[h][f],r,a,o)}function c(t,e,i,n,r,a,o){var s=.5*(i-t),l=.5*(n-e);return(2*(e-i)+s+l)*o+(-3*(e-i)-2*s-l)*a+s*r+e}function u(t){if(m(t)){var e=t[Fi];if(m(t[0])){for(var i=[],n=0;e>n;n++)i.push(g.call(t[n]));return i}return g.call(t)}return t}function h(t){return t[0]=Math.floor(t[0]),t[1]=Math.floor(t[1]),t[2]=Math.floor(t[2]),"rgba("+t.join(",")+")"}function d(t,e,i,u,d){var v=t._getter,g=t._setter,y="spline"===e,_=u[Fi];if(_){var x,b=u[0].value,w=m(b),M=!1,S=!1,k=w&&m(b[0])?2:1;u.sort(function(t,e){return t.time-e.time}),x=u[_-1].time;for(var C=[],A=[],T=u[0].value,D=!0,L=0;_>L;L++){C.push(u[L].time/x);var P=u[L].value;if(w&&s(P,T,k)||!w&&P===T||(D=!1),T=P,typeof P==Bi){var z=p.parse(P);z?(P=z,M=!0):S=!0}A.push(P)}if(!D){if(w){for(var I=A[_-1],L=0;_-1>L;L++)o(A[L],I,k);o(v(t._target,d),I,k)}var O,R,B,E,Z,N,V=0,F=0;if(M)var G=[0,0,0,0];var H=function(t,e){var i;if(F>e){for(O=Math.min(V+1,_-1),i=O;i>=0&&!(C[i]<=e);i--);i=Math.min(i,_-2)}else{for(i=V;_>i&&!(C[i]>e);i++);i=Math.min(i-1,_-2)}V=i,F=e;var o=C[i+1]-C[i];if(0!==o)if(R=(e-C[i])/o,y)if(E=A[i],B=A[0===i?i:i-1],Z=A[i>_-2?_-1:i+1],N=A[i>_-3?_-1:i+2],w)l(B,E,Z,N,R,R*R,R*R*R,v(t,d),k);else{var s;if(M)s=l(B,E,Z,N,R,R*R,R*R*R,G,1),s=h(G);else{if(S)return r(E,Z,R);s=c(B,E,Z,N,R,R*R,R*R*R)}g(t,d,s)}else if(w)a(A[i],A[i+1],R,v(t,d),k);else{var s;if(M)a(A[i],A[i+1],R,G,1),s=h(G);else{if(S)return r(A[i],A[i+1],R);s=n(A[i],A[i+1],R)}g(t,d,s)}},W=new f({target:t._target,life:x,loop:t._loop,delay:t._delay,onframe:H,ondestroy:i});return e&&"spline"!==e&&(W.easing=e),W}}}var f=t("./Clip"),p=t("../tool/color"),v=t(pi),m=v.isArrayLike,g=Array[qi].slice,y=function(t,n,r,a){this._tracks={},this._target=t,this._loop=n||!1,this._getter=r||e,this._setter=a||i,this._clipCount=0,this._delay=0,this._doneList=[],this._onframeList=[],this._clipList=[]};return y[qi]={when:function(t,e){var i=this._tracks;for(var n in e){if(!i[n]){i[n]=[];var r=this._getter(this._target,n);if(null==r)continue;0!==t&&i[n].push({time:0,value:u(r)})}i[n].push({time:t,value:e[n]})}return this},during:function(t){return this._onframeList.push(t),this},_doneCallback:function(){this._tracks={},this._clipList[Fi]=0;for(var t=this._doneList,e=t[Fi],i=0;e>i;i++)t[i].call(this)},start:function(t){var e,i=this,n=0,r=function(){n--,n||i._doneCallback()};for(var a in this._tracks){var o=d(this,t,r,this._tracks[a],a);o&&(this._clipList.push(o),n++,this[re]&&this[re].addClip(o),e=o)}if(e){var s=e.onframe;e.onframe=function(t,e){s(t,e);for(var n=0;n<i._onframeList[Fi];n++)i._onframeList[n](t,e)}}return n||this._doneCallback(),this},stop:function(t){for(var e=this._clipList,i=this[re],n=0;n<e[Fi];n++){var r=e[n];t&&r.onframe(this._target,1),i&&i.removeClip(r)}e[Fi]=0},delay:function(t){return this._delay=t,this},done:function(t){return t&&this._doneList.push(t),this},getClips:function(){return this._clipList}},y}),e("zrender/config",[],function(){var t=1;typeof window!==bi&&(t=Math.max(window.devicePixelRatio||1,1));var e={debugMode:0,devicePixelRatio:t};return e}),e("zrender/core/log",[ji,"../config"],function(t){var e=t("../config");return function(){if(0!==e.debugMode)if(1==e.debugMode)for(var t in arguments)throw new Error(arguments[t]);else if(e.debugMode>1)for(var t in arguments)console.log(arguments[t])}}),e("zrender/mixin/Animatable",[ji,"../animation/Animator",pi,"../core/log"],function(t){var e=t("../animation/Animator"),i=t(pi),n=i[Re],r=i.isFunction,a=i[Ze],o=t("../core/log"),s=function(){this.animators=[]};return s[qi]={constructor:s,animate:function(t,n){var r,a=!1,s=this,l=this.__zr;if(t){var c=t.split("."),u=s;a="shape"===c[0];for(var h=0,d=c[Fi];d>h;h++)u&&(u=u[c[h]]);u&&(r=u)}else r=s;if(!r)return void o('Property "'+t+'" is not existed in element '+s.id);var f=s.animators,p=new e(r,n);return p.during(function(t){s.dirty(a)}).done(function(){f[Ie](i[Ei](f,p),1)}),f.push(p),l&&l[re].addAnimator(p),p},stopAnimation:function(t){for(var e=this.animators,i=e[Fi],n=0;i>n;n++)e[n].stop(t);return e[Fi]=0,this},animateTo:function(t,e,i,a,o){function s(){c--,c||o&&o()}n(i)?(o=a,a=i,i=0):r(a)?(o=a,a="linear",i=0):r(i)?(o=i,i=0):r(e)?(o=e,e=500):e||(e=500),this[ne](),this._animateToShallow("",this,t,e,i,a,o);var l=this.animators.slice(),c=l[Fi];c||o&&o();for(var u=0;u<l[Fi];u++)l[u].done(s).start(a)},_animateToShallow:function(t,e,n,r,o){var s={},l=0;for(var c in n)if(null!=e[c])a(n[c])&&!i.isArrayLike(n[c])?this._animateToShallow(t?t+"."+c:c,e[c],n[c],r,o):(s[c]=n[c],l++);else if(null!=n[c])if(t){var u={};u[t]={},u[t][c]=n[c],this.attr(u)}else this.attr(c,n[c]);return l>0&&this[ie](t,!1).when(null==r?500:r,s).delay(o||0),this}},s}),e("zrender/Element",[ji,"./core/guid","./mixin/Eventful","./mixin/Transformable","./mixin/Animatable","./core/util"],function(t){var e=t("./core/guid"),i=t("./mixin/Eventful"),n=t("./mixin/Transformable"),r=t("./mixin/Animatable"),a=t("./core/util"),o=function(t){n.call(this,t),i.call(this,t),r.call(this,t),this.id=t.id||e()};return o[qi]={type:"element",name:"",__zr:null,ignore:!1,clipPath:null,drift:function(t,e){switch(this[ee]){case Ge:e=0;break;case Fe:t=0}var i=this[he];i||(i=this[he]=[1,0,0,1,0,0]),i[4]+=t,i[5]+=e,this.decomposeTransform(),this.dirty()},beforeUpdate:function(){},afterUpdate:function(){},update:function(){this.updateTransform()},traverse:function(t,e){},attrKV:function(t,e){if(t===We||"scale"===t||"origin"===t){if(e){var i=this[t];i||(i=this[t]=[]),i[0]=e[0],i[1]=e[1]}}else this[t]=e},hide:function(){this[te]=!0,this.__zr&&this.__zr[Jt]()},show:function(){this[te]=!1,this.__zr&&this.__zr[Jt]()},attr:function(t,e){if(typeof t===Bi)this.attrKV(t,e);else if(a[Ze](t))for(var i in t)t.hasOwnProperty(i)&&this.attrKV(i,t[i]);return this.dirty(),this},setClipPath:function(t){var e=this.__zr;e&&t.addSelfToZr(e),this.clipPath&&this.clipPath!==t&&this.removeClipPath(),this.clipPath=t,t.__zr=e,t.__clipTarget=this,this.dirty()},removeClipPath:function(){var t=this.clipPath;t&&(t.__zr&&t.removeSelfFromZr(t.__zr),t.__zr=null,t.__clipTarget=null,this.clipPath=null,this.dirty())},addSelfToZr:function(t){this.__zr=t;var e=this.animators;if(e)for(var i=0;i<e[Fi];i++)t[re].addAnimator(e[i]);this.clipPath&&this.clipPath.addSelfToZr(t)},removeSelfFromZr:function(t){this.__zr=null;var e=this.animators;if(e)for(var i=0;i<e[Fi];i++)t[re].removeAnimator(e[i]);this.clipPath&&this.clipPath.removeSelfFromZr(t)}},a.mixin(o,r),a.mixin(o,n),a.mixin(o,i),o}),e("zrender/container/Group",[ji,pi,"../Element",fi],function(t){var e=t(pi),i=t("../Element"),n=t(fi),r=function(t){t=t||{},i.call(this,t);for(var e in t)this[e]=t[e];this._children=[],this.__storage=null,this[Kt]=!0};return r[qi]={constructor:r,type:"group",children:function(){return this._children.slice()},childAt:function(t){return this._children[t]},childOfName:function(t){for(var e=this._children,i=0;i<e[Fi];i++)if(e[i].name===t)return e[i]},childCount:function(){return this._children[Fi]},add:function(t){return t&&t!==this&&t[ue]!==this&&(this._children.push(t),this._doAdd(t)),this},addBefore:function(t,e){if(t&&t!==this&&t[ue]!==this&&e&&e[ue]===this){var i=this._children,n=i[Ei](e);n>=0&&(i[Ie](n,0,t),this._doAdd(t))}return this},_doAdd:function(t){t[ue]&&t[ue][Qt](t),t[ue]=this;var e=this.__storage,i=this.__zr;e&&e!==t.__storage&&(e[$t](t),t instanceof r&&t.addChildrenToStorage(e)),i&&i[Jt]()},remove:function(t){var i=this.__zr,n=this.__storage,a=this._children,o=e[Ei](a,t);return 0>o?this:(a[Ie](o,1),t[ue]=null,n&&(n[Yt](t.id),t instanceof r&&t.delChildrenFromStorage(n)),i&&i[Jt](),this)},removeAll:function(){var t,e,i=this._children,n=this.__storage;for(e=0;e<i[Fi];e++)t=i[e],n&&(n[Yt](t.id),t instanceof r&&t.delChildrenFromStorage(n)),t[ue]=null;return i[Fi]=0,this},eachChild:function(t,e){for(var i=this._children,n=0;n<i[Fi];n++){var r=i[n];t.call(e,r,n)}return this},traverse:function(t,e){for(var i=0;i<this._children[Fi];i++){var n=this._children[i];t.call(e,n),"group"===n.type&&n[Xt](t,e)}return this},addChildrenToStorage:function(t){for(var e=0;e<this._children[Fi];e++){var i=this._children[e];t[$t](i),i instanceof r&&i.addChildrenToStorage(t)}},delChildrenFromStorage:function(t){for(var e=0;e<this._children[Fi];e++){var i=this._children[e];t[Yt](i.id),i instanceof r&&i.delChildrenFromStorage(t)}},dirty:function(){return this[Kt]=!0,this.__zr&&this.__zr[Jt](),this},getBoundingRect:function(t){for(var e=null,i=new n(0,0,0,0),r=t||this._children,a=[],o=0;o<r[Fi];o++){var s=r[o];if(!s[te]&&!s[Ut]){var l=s[ni](),c=s[ce](a);c?(i.copy(l),i[yi](c),e=e||i.clone(),e.union(i)):(e=e||l.clone(),e.union(l))}}return e||i}},e[Di](r,i),r}),e("echarts/view/Component",[ji,"zrender/container/Group","../util/component",ei],function(t){var e=t("zrender/container/Group"),i=t("../util/component"),n=t(ei),r=function(){this.group=new e,this.uid=i.getUID("viewComponent")};r[qi]={constructor:r,init:function(t,e){},render:function(t,e,i,n){},dispose:function(){}};var a=r[qi];return a.updateView=a[jt]=a.updateVisual=function(t,e,i,n){},n[Pi](r),n[Ti](r,{registerWhenExtend:!0}),r}),e("echarts/view/Chart",[ji,"zrender/container/Group","../util/component",ei],function(t){function e(){this.group=new r,this.uid=a.getUID("viewChart")}function i(t,e){if(t&&(t[Ht](e),"group"===t.type))for(var n=0;n<t.childCount();n++)i(t[He](n),e)}function n(t,e,n){if(null!=e[Gt]){var r=t[Ft](e[Gt]);i(r,n)}else if(e.name){var a=t[Vt](e.name),r=t[Ft](a);i(r,n)}else t[Nt](function(t){i(t,n)})}var r=t("zrender/container/Group"),a=t("../util/component"),o=t(ei);e[qi]={type:"chart",init:function(t,e){},render:function(t,e,i,n){},highlight:function(t,e,i,r){n(t[be](),r,Se)},downplay:function(t,e,i,r){n(t[be](),r,Me)},remove:function(t,e){this.group[qt]()},dispose:function(){}};var s=e[qi];return s.updateView=s[jt]=s.updateVisual=function(t,e,i,n){this[Wt](t,e,i,n)},o[Pi](e),o[Ti](e,{registerWhenExtend:!0}),e}),e("zrender/graphic/Style",[ji],function(t){var e=["lineCap","lineJoin","miterLimit","shadowBlur","shadowOffsetX","shadowOffsetY","shadowColor"],i=function(t){this.extendFrom(t)};i[qi]={constructor:i,fill:"#000000",stroke:null,opacity:1,lineDash:null,lineDashOffset:0,shadowBlur:0,shadowOffsetX:0,shadowOffsetY:0,lineWidth:1,strokeNoScale:!1,text:null,textFill:"#000",textStroke:null,textPosition:"inside",textBaseline:null,textAlign:null,textDistance:5,textShadowBlur:0,textShadowOffsetX:0,textShadowOffsetY:0,bind:function(t,i){for(var n=this.fill,r=this[Si],a=0;a<e[Fi];a++){var o=e[a];null!=this[o]&&(t[o]=this[o])}if(null!=r){var s=this[ki];t[ki]=s/(this.strokeNoScale&&i&&i.getLineScale?i.getLineScale():1)}null!=n&&(t.fillStyle=n.canvasGradient?n.canvasGradient:n),null!=r&&(t.strokeStyle=r.canvasGradient?r.canvasGradient:r),null!=this[Mi]&&(t.globalAlpha=this[Mi])},extendFrom:function(t,e){if(t){var i=this;for(var n in t)!t.hasOwnProperty(n)||!e&&i.hasOwnProperty(n)||(i[n]=t[n])}},set:function(t,e){typeof t===Bi?this[t]=e:this.extendFrom(t,!0)},clone:function(){var t=new this.constructor;return t.extendFrom(this,!0),t}};var n,r,a=i[qi];for(r=0;r<e[Fi];r++)n=e[r],n in a||(a[n]=null);return i}),e("zrender/graphic/mixin/RectText",[ji,"../../contain/text","../../core/BoundingRect"],function(t){function e(t,e){return typeof t===Bi?t.lastIndexOf("%")>=0?parseFloat(t)/100*e:parseFloat(t):t}function i(t,e){t[he](e[0],e[1],e[2],e[3],e[4],e[5])}var n=t("../../contain/text"),r=t("../../core/BoundingRect"),a=new r,o=function(){};return o[qi]={constructor:o,drawRectText:function(t,r,o){var s=this.style,l=s.text;if(null!=l&&(l+=""),l){var c,u,h=s[Zt],d=s.textDistance,f=s[Et],p=s.textFont||s.font,v=s[Bt];o=o||n[ni](l,p,f,v);var m=this[he],g=this.invTransform;if(m&&(a.copy(r),a[yi](m),r=a,i(t,g)),h instanceof Array)c=r.x+e(h[0],r.width),u=r.y+e(h[1],r[gi]),f=f||"left",v=v||"top";else{var y=n.adjustTextPositionOnRect(h,r,o,d);c=y.x,u=y.y,f=f||y[Et],v=v||y[Bt]}t[Et]=f,t[Bt]=v;var _=s.textFill,x=s.textStroke;_&&(t.fillStyle=_),x&&(t.strokeStyle=x),t.font=p,t.shadowColor=s.textShadowColor,t.shadowBlur=s.textShadowBlur,t.shadowOffsetX=s.textShadowOffsetX,t.shadowOffsetY=s.textShadowOffsetY;for(var b=l.split("\n"),w=0;w<b[Fi];w++)_&&t.fillText(b[w],c,u),x&&t.strokeText(b[w],c,u),u+=o.lineHeight;m&&i(t,m)}}},o}),e("zrender/graphic/Displayable",[ji,pi,"./Style","../Element","./mixin/RectText"],function(t){function e(t){t=t||{},r.call(this,t);
for(var e in t)t.hasOwnProperty(e)&&"style"!==e&&(this[e]=t[e]);this.style=new n(t.style),this._rect=null,this.__clipPaths=[]}var i=t(pi),n=t("./Style"),r=t("../Element"),a=t("./mixin/RectText");return e[qi]={constructor:e,type:"displayable",__dirty:!0,invisible:!1,z:0,z2:0,zlevel:0,draggable:!1,dragging:!1,silent:!1,culling:!1,cursor:"pointer",rectHover:!1,beforeBrush:function(t){},afterBrush:function(t){},brush:function(t){},getBoundingRect:function(){},contain:function(t,e){return this.rectContain(t,e)},traverse:function(t,e){t.call(e,this)},rectContain:function(t,e){var i=this[se](t,e),n=this[ni]();return n[Rt](i[0],i[1])},dirty:function(){this[Kt]=!0,this._rect=null,this.__zr&&this.__zr[Jt]()},animateStyle:function(t){return this[ie]("style",t)},attrKV:function(t,e){"style"!==t?r[qi].attrKV.call(this,t,e):this.style.set(e)},setStyle:function(t,e){return this.style.set(t,e),this.dirty(),this}},i[Di](e,r),i.mixin(e,a),e}),e("zrender/core/curve",[ji,"./vector"],function(t){function e(t){return t>-x&&x>t}function i(t){return t>x||-x>t}function n(t,e,i,n,r){var a=1-r;return a*a*(a*t+3*r*e)+r*r*(r*n+3*a*i)}function r(t,e,i,n,r){var a=1-r;return 3*(((e-t)*a+2*(i-e)*r)*a+(n-i)*r*r)}function a(t,i,n,r,a,o){var s=r+3*(i-n)-t,l=3*(n-2*i+t),c=3*(i-t),u=t-a,h=l*l-3*s*c,d=l*c-9*s*u,f=c*c-3*l*u,p=0;if(e(h)&&e(d))if(e(l))o[0]=0;else{var v=-c/l;v>=0&&1>=v&&(o[p++]=v)}else{var m=d*d-4*h*f;if(e(m)){var g=d/h,v=-l/s+g,x=-g/2;v>=0&&1>=v&&(o[p++]=v),x>=0&&1>=x&&(o[p++]=x)}else if(m>0){var M=_(m),S=h*l+1.5*s*(-d+M),k=h*l+1.5*s*(-d-M);S=0>S?-y(-S,w):y(S,w),k=0>k?-y(-k,w):y(k,w);var v=(-l-(S+k))/(3*s);v>=0&&1>=v&&(o[p++]=v)}else{var C=(2*h*l-3*s*d)/(2*_(h*h*h)),A=Math.acos(C)/3,T=_(h),D=Math.cos(A),v=(-l-2*T*D)/(3*s),x=(-l+T*(D+b*Math.sin(A)))/(3*s),L=(-l+T*(D-b*Math.sin(A)))/(3*s);v>=0&&1>=v&&(o[p++]=v),x>=0&&1>=x&&(o[p++]=x),L>=0&&1>=L&&(o[p++]=L)}}return p}function o(t,n,r,a,o){var s=6*r-12*n+6*t,l=9*n+3*a-3*t-9*r,c=3*n-3*t,u=0;if(e(l)){if(i(s)){var h=-c/s;h>=0&&1>=h&&(o[u++]=h)}}else{var d=s*s-4*l*c;if(e(d))o[0]=-s/(2*l);else if(d>0){var f=_(d),h=(-s+f)/(2*l),p=(-s-f)/(2*l);h>=0&&1>=h&&(o[u++]=h),p>=0&&1>=p&&(o[u++]=p)}}return u}function s(t,e,i,n,r,a){var o=(e-t)*r+t,s=(i-e)*r+e,l=(n-i)*r+i,c=(s-o)*r+o,u=(l-s)*r+s,h=(u-c)*r+c;a[0]=t,a[1]=o,a[2]=c,a[3]=h,a[4]=h,a[5]=u,a[6]=l,a[7]=n}function l(t,e,i,r,a,o,s,l,c,u,h){var d,f,p,v,m,y=.005,b=1/0;M[0]=c,M[1]=u;for(var w=0;1>w;w+=.05)S[0]=n(t,i,a,s,w),S[1]=n(e,r,o,l,w),v=g(M,S),b>v&&(d=w,b=v);b=1/0;for(var C=0;32>C&&!(x>y);C++)f=d-y,p=d+y,S[0]=n(t,i,a,s,f),S[1]=n(e,r,o,l,f),v=g(S,M),f>=0&&b>v?(d=f,b=v):(k[0]=n(t,i,a,s,p),k[1]=n(e,r,o,l,p),m=g(k,M),1>=p&&b>m?(d=p,b=m):y*=.5);return h&&(h[0]=n(t,i,a,s,d),h[1]=n(e,r,o,l,d)),_(b)}function c(t,e,i,n){var r=1-n;return r*(r*t+2*n*e)+n*n*i}function u(t,e,i,n){return 2*((1-n)*(e-t)+n*(i-e))}function h(t,n,r,a,o){var s=t-2*n+r,l=2*(n-t),c=t-a,u=0;if(e(s)){if(i(l)){var h=-c/l;h>=0&&1>=h&&(o[u++]=h)}}else{var d=l*l-4*s*c;if(e(d)){var h=-l/(2*s);h>=0&&1>=h&&(o[u++]=h)}else if(d>0){var f=_(d),h=(-l+f)/(2*s),p=(-l-f)/(2*s);h>=0&&1>=h&&(o[u++]=h),p>=0&&1>=p&&(o[u++]=p)}}return u}function d(t,e,i){var n=t+i-2*e;return 0===n?.5:(t-e)/n}function f(t,e,i,n,r){var a=(e-t)*n+t,o=(i-e)*n+e,s=(o-a)*n+a;r[0]=t,r[1]=a,r[2]=s,r[3]=s,r[4]=o,r[5]=i}function p(t,e,i,n,r,a,o,s,l){var u,h=.005,d=1/0;M[0]=o,M[1]=s;for(var f=0;1>f;f+=.05){S[0]=c(t,i,r,f),S[1]=c(e,n,a,f);var p=g(M,S);d>p&&(u=f,d=p)}d=1/0;for(var v=0;32>v&&!(x>h);v++){var m=u-h,y=u+h;S[0]=c(t,i,r,m),S[1]=c(e,n,a,m);var p=g(S,M);if(m>=0&&d>p)u=m,d=p;else{k[0]=c(t,i,r,y),k[1]=c(e,n,a,y);var b=g(k,M);1>=y&&d>b?(u=y,d=b):h*=.5}}return l&&(l[0]=c(t,i,r,u),l[1]=c(e,n,a,u)),_(d)}var v=t("./vector"),m=v[mi],g=v.distSquare,y=Math.pow,_=Math.sqrt,x=1e-4,b=_(3),w=1/3,M=m(),S=m(),k=m();return{cubicAt:n,cubicDerivativeAt:r,cubicRootAt:a,cubicExtrema:o,cubicSubdivide:s,cubicProjectPoint:l,quadraticAt:c,quadraticDerivativeAt:u,quadraticRootAt:h,quadraticExtremum:d,quadraticSubdivide:f,quadraticProjectPoint:p}}),e("zrender/core/bbox",[ji,"./vector","./curve"],function(t){var e=t("./vector"),i=t("./curve"),n={},r=Math.min,a=Math.max,o=Math.sin,s=Math.cos,l=e[mi](),c=e[mi](),u=e[mi](),h=2*Math.PI;return n.fromPoints=function(t,e,i){if(0!==t[Fi]){var n,o=t[0],s=o[0],l=o[0],c=o[1],u=o[1];for(n=1;n<t[Fi];n++)o=t[n],s=r(s,o[0]),l=a(l,o[0]),c=r(c,o[1]),u=a(u,o[1]);e[0]=s,e[1]=c,i[0]=l,i[1]=u}},n.fromLine=function(t,e,i,n,o,s){o[0]=r(t,i),o[1]=r(e,n),s[0]=a(t,i),s[1]=a(e,n)},n.fromCubic=function(t,e,n,o,s,l,c,u,h,d){var f,p,v,m,g,y=[],_=[],x=i.cubicExtrema,b=i.cubicAt,w=x(t,n,s,c,y);for(g=0;w>g;g++)y[g]=b(t,n,s,c,y[g]);for(w=x(e,o,l,u,_),g=0;w>g;g++)_[g]=b(e,o,l,u,_[g]);y.push(t,c),_.push(e,u),f=r.apply(null,y),p=a.apply(null,y),v=r.apply(null,_),m=a.apply(null,_),h[0]=f,h[1]=v,d[0]=p,d[1]=m},n.fromQuadratic=function(t,e,n,o,s,l,c,u){var h=i.quadraticExtremum,d=i.quadraticAt,f=a(r(h(t,n,s),1),0),p=a(r(h(e,o,l),1),0),v=d(t,n,s,f),m=d(e,o,l,p);c[0]=r(t,s,v),c[1]=r(e,l,m),u[0]=a(t,s,v),u[1]=a(e,l,m)},n.fromArc=function(t,i,n,r,a,d,f,p,v){var m=e.min,g=e.max,y=Math.abs(a-d);if(1e-4>y%h&&y>1e-4)return p[0]=t-n,p[1]=i-r,v[0]=t+n,void(v[1]=i+r);if(l[0]=s(a)*n+t,l[1]=o(a)*r+i,c[0]=s(d)*n+t,c[1]=o(d)*r+i,m(p,l,c),g(v,l,c),a%=h,0>a&&(a+=h),d%=h,0>d&&(d+=h),a>d&&!f?d+=h:d>a&&f&&(a+=h),f){var _=d;d=a,a=_}for(var x=0;d>x;x+=Math.PI/2)x>a&&(u[0]=s(x)*n+t,u[1]=o(x)*r+i,m(p,u,p),g(v,u,v))},n}),e("zrender/core/PathProxy",[ji,"./curve","./vector","./bbox","./BoundingRect"],function(t){var e=t("./curve"),i=t("./vector"),n=t("./bbox"),r=t("./BoundingRect"),a={M:1,L:2,C:3,Q:4,A:5,Z:6,R:7},o=[],s=[],l=[],c=[],u=Math.min,h=Math.max,d=Math.cos,f=Math.sin,p=Math.sqrt,v=typeof Float32Array!=bi,m=function(){this.data=[],this._len=0,this._ctx=null,this._xi=0,this._yi=0,this._x0=0,this._y0=0};return m[qi]={constructor:m,_lineDash:null,_dashOffset:0,_dashIdx:0,_dashSum:0,getContext:function(){return this._ctx},beginPath:function(t){return this._ctx=t,t&&t[Ot](),this._len=0,this._lineDash&&(this._lineDash=null,this._dashOffset=0),this},moveTo:function(t,e){return this.addData(a.M,t,e),this._ctx&&this._ctx[It](t,e),this._x0=t,this._y0=e,this._xi=t,this._yi=e,this},lineTo:function(t,e){return this.addData(a.L,t,e),this._ctx&&(this._needsDash()?this._dashedLineTo(t,e):this._ctx[zt](t,e)),this._xi=t,this._yi=e,this},bezierCurveTo:function(t,e,i,n,r,o){return this.addData(a.C,t,e,i,n,r,o),this._ctx&&(this._needsDash()?this._dashedBezierTo(t,e,i,n,r,o):this._ctx[Pt](t,e,i,n,r,o)),this._xi=r,this._yi=o,this},quadraticCurveTo:function(t,e,i,n){return this.addData(a.Q,t,e,i,n),this._ctx&&(this._needsDash()?this._dashedQuadraticTo(t,e,i,n):this._ctx.quadraticCurveTo(t,e,i,n)),this._xi=i,this._yi=n,this},arc:function(t,e,i,n,r,o){return this.addData(a.A,t,e,i,i,n,r-n,0,o?0:1),this._ctx&&this._ctx.arc(t,e,i,n,r,o),this._xi=d(r)*i+t,this._xi=f(r)*i+t,this},arcTo:function(t,e,i,n,r){return this._ctx&&this._ctx.arcTo(t,e,i,n,r),this},rect:function(t,e,i,n){return this._ctx&&this._ctx.rect(t,e,i,n),this.addData(a.R,t,e,i,n),this},closePath:function(){this.addData(a.Z);var t=this._ctx,e=this._x0,i=this._y0;return t&&(this._needsDash()&&this._dashedLineTo(e,i),t[Lt]()),this._xi=e,this._yi=i,this},fill:function(t){t&&t.fill(),this.toStatic()},stroke:function(t){t&&t[Si](),this.toStatic()},setLineDash:function(t){if(t instanceof Array){this._lineDash=t,this._dashIdx=0;for(var e=0,i=0;i<t[Fi];i++)e+=t[i];this._dashSum=e}return this},setLineDashOffset:function(t){return this._dashOffset=t,this},len:function(){return this._len},setData:function(t){var e=t[Fi];this.data&&this.data[Fi]==e||!v||(this.data=new Float32Array(e));for(var i=0;e>i;i++)this.data[i]=t[i];this._len=e},appendPath:function(t){t instanceof Array||(t=[t]);for(var e=t[Fi],i=0,n=this._len,r=0;e>r;r++)i+=t[r].len();v&&this.data instanceof Float32Array&&(this.data=new Float32Array(n+i));for(var r=0;e>r;r++)for(var a=t[r].data,o=0;o<a[Fi];o++)this.data[n++]=a[o];this._len=n},addData:function(t){var e=this.data;this._len+arguments[Fi]>e[Fi]&&(this._expandData(),e=this.data);for(var i=0;i<arguments[Fi];i++)e[this._len++]=arguments[i];this._prevCmd=t},_expandData:function(){if(!(this.data instanceof Array)){for(var t=[],e=0;e<this._len;e++)t[e]=this.data[e];this.data=t}},_needsDash:function(){return this._lineDash},_dashedLineTo:function(t,e){var i,n,r=this._dashSum,a=this._dashOffset,o=this._lineDash,s=this._ctx,l=this._xi,c=this._yi,d=t-l,f=e-c,v=p(d*d+f*f),m=l,g=c,y=o[Fi];for(d/=v,f/=v,0>a&&(a=r+a),a%=r,m-=a*d,g-=a*f;d>=0&&t>=m||0>d&&m>t;)n=this._dashIdx,i=o[n],m+=d*i,g+=f*i,this._dashIdx=(n+1)%y,d>0&&l>m||0>d&&m>l||s[n%2?It:zt](d>=0?u(m,t):h(m,t),f>=0?u(g,e):h(g,e));d=m-t,f=g-e,this._dashOffset=-p(d*d+f*f)},_dashedBezierTo:function(t,i,n,r,a,o){var s,l,c,u,h,d=this._dashSum,f=this._dashOffset,v=this._lineDash,m=this._ctx,g=this._xi,y=this._yi,_=e.cubicAt,x=0,b=this._dashIdx,w=v[Fi],M=0;for(0>f&&(f=d+f),f%=d,s=0;1>s;s+=.1)l=_(g,t,n,a,s+.1)-_(g,t,n,a,s),c=_(y,i,r,o,s+.1)-_(y,i,r,o,s),x+=p(l*l+c*c);for(;w>b&&(M+=v[b],!(M>f));b++);for(s=(M-f)/x;1>=s;)u=_(g,t,n,a,s),h=_(y,i,r,o,s),b%2?m[It](u,h):m[zt](u,h),s+=v[b]/x,b=(b+1)%w;b%2!==0&&m[zt](a,o),l=a-u,c=o-h,this._dashOffset=-p(l*l+c*c)},_dashedQuadraticTo:function(t,e,i,n){var r=i,a=n;i=(i+2*t)/3,n=(n+2*e)/3,t=(this._xi+2*t)/3,e=(this._yi+2*e)/3,this._dashedBezierTo(t,e,i,n,r,a)},toStatic:function(){this.data[Fi]=this._len,v&&this.data instanceof Array&&(this.data=new Float32Array(this.data))},getBoundingRect:function(){o[0]=o[1]=l[0]=l[1]=Number.MAX_VALUE,s[0]=s[1]=c[0]=c[1]=-Number.MAX_VALUE;for(var t=this.data,e=0,u=0,h=0,p=0,v=0;v<t[Fi];){var m=t[v++];switch(1==v&&(e=t[v],u=t[v+1],h=e,p=u),m){case a.M:h=t[v++],p=t[v++],e=h,u=p,l[0]=h,l[1]=p,c[0]=h,c[1]=p;break;case a.L:n.fromLine(e,u,t[v],t[v+1],l,c),e=t[v++],u=t[v++];break;case a.C:n.fromCubic(e,u,t[v++],t[v++],t[v++],t[v++],t[v],t[v+1],l,c),e=t[v++],u=t[v++];break;case a.Q:n.fromQuadratic(e,u,t[v++],t[v++],t[v],t[v+1],l,c),e=t[v++],u=t[v++];break;case a.A:var g=t[v++],y=t[v++],_=t[v++],x=t[v++],b=t[v++],w=t[v++]+b,M=(t[v++],1-t[v++]);1==v&&(h=d(b)*_+g,p=f(b)*x+y),n.fromArc(g,y,_,x,b,w,M,l,c),e=d(w)*_+g,u=f(w)*x+y;break;case a.R:h=e=t[v++],p=u=t[v++];var S=t[v++],k=t[v++];n.fromLine(h,p,h+S,p+k,l,c);break;case a.Z:e=h,u=p}i.min(o,o,l),i.max(s,s,c)}return 0===v&&(o[0]=o[1]=s[0]=s[1]=0),new r(o[0],o[1],s[0]-o[0],s[1]-o[1])},rebuildPath:function(t){for(var e=this.data,i=0;i<this._len;){var n=e[i++];switch(n){case a.M:t[It](e[i++],e[i++]);break;case a.L:t[zt](e[i++],e[i++]);break;case a.C:t[Pt](e[i++],e[i++],e[i++],e[i++],e[i++],e[i++]);break;case a.Q:t.quadraticCurveTo(e[i++],e[i++],e[i++],e[i++]);break;case a.A:var r=e[i++],o=e[i++],s=e[i++],l=e[i++],c=e[i++],u=e[i++],h=e[i++],d=e[i++],f=s>l?s:l,p=s>l?1:s/l,v=s>l?l/s:1,m=Math.abs(s-l)>.001;m?(t.translate(r,o),t[le](h),t.scale(p,v),t.arc(0,0,f,c,c+u,1-d),t.scale(1/p,1/v),t[le](-h),t.translate(-r,-o)):t.arc(r,o,f,c,c+u,1-d);break;case a.R:t.rect(e[i++],e[i++],e[i++],e[i++]);break;case a.Z:t[Lt]()}}}},m.CMD=a,m}),e("zrender/contain/line",[],function(){return{containStroke:function(t,e,i,n,r,a,o){if(0===r)return!1;var s=r,l=0,c=t;if(o>e+s&&o>n+s||e-s>o&&n-s>o||a>t+s&&a>i+s||t-s>a&&i-s>a)return!1;if(t===i)return Math.abs(a-t)<=s/2;l=(e-n)/(t-i),c=(t*n-i*e)/(t-i);var u=l*a-o+c,h=u*u/(l*l+1);return s/2*s/2>=h}}}),e("zrender/contain/cubic",[ji,"../core/curve"],function(t){var e=t("../core/curve");return{containStroke:function(t,i,n,r,a,o,s,l,c,u,h){if(0===c)return!1;var d=c;if(h>i+d&&h>r+d&&h>o+d&&h>l+d||i-d>h&&r-d>h&&o-d>h&&l-d>h||u>t+d&&u>n+d&&u>a+d&&u>s+d||t-d>u&&n-d>u&&a-d>u&&s-d>u)return!1;var f=e.cubicProjectPoint(t,i,n,r,a,o,s,l,u,h,null);return d/2>=f}}}),e("zrender/contain/quadratic",[ji,"../core/curve"],function(t){var e=t("../core/curve");return{containStroke:function(t,i,n,r,a,o,s,l,c){if(0===s)return!1;var u=s;if(c>i+u&&c>r+u&&c>o+u||i-u>c&&r-u>c&&o-u>c||l>t+u&&l>n+u&&l>a+u||t-u>l&&n-u>l&&a-u>l)return!1;var h=e.quadraticProjectPoint(t,i,n,r,a,o,l,c,null);return u/2>=h}}}),e("zrender/contain/util",[ji],function(t){var e=2*Math.PI;return{normalizeRadian:function(t){return t%=e,0>t&&(t+=e),t}}}),e("zrender/contain/arc",[ji,"./util"],function(t){var e=t("./util").normalizeRadian,i=2*Math.PI;return{containStroke:function(t,n,r,a,o,s,l,c,u){if(0===l)return!1;var h=l;c-=t,u-=n;var d=Math.sqrt(c*c+u*u);if(d-h>r||r>d+h)return!1;if(Math.abs(a-o)%i<1e-4)return!0;if(s){var f=a;a=e(o),o=e(f)}else a=e(a),o=e(o);a>o&&(o+=i);var p=Math.atan2(u,c);return 0>p&&(p+=i),p>=a&&o>=p||p+i>=a&&o>=p+i}}}),e("zrender/contain/windingLine",[],function(){return function(t,e,i,n,r,a){if(a>e&&a>n||e>a&&n>a)return 0;if(n===e)return 0;var o=e>n?1:-1,s=(a-e)/(n-e),l=s*(i-t)+t;return l>r?o:0}}),e("zrender/contain/path",[ji,"../core/PathProxy","./line","./cubic","./quadratic","./arc","./util","../core/curve","./windingLine"],function(t){function e(t,e){return Math.abs(t-e)<g}function i(){var t=_[0];_[0]=_[1],_[1]=t}function n(t,e,n,r,a,o,s,l,c,u){if(u>e&&u>r&&u>o&&u>l||e>u&&r>u&&o>u&&l>u)return 0;var h=f.cubicRootAt(e,r,o,l,u,y);if(0===h)return 0;for(var d,p,v=0,m=-1,g=0;h>g;g++){var x=y[g],b=f.cubicAt(t,n,a,s,x);c>b||(0>m&&(m=f.cubicExtrema(e,r,o,l,_),_[1]<_[0]&&m>1&&i(),d=f.cubicAt(e,r,o,l,_[0]),m>1&&(p=f.cubicAt(e,r,o,l,_[1]))),v+=2==m?x<_[0]?e>d?1:-1:x<_[1]?d>p?1:-1:p>l?1:-1:x<_[0]?e>d?1:-1:d>l?1:-1)}return v}function r(t,e,i,n,r,a,o,s){if(s>e&&s>n&&s>a||e>s&&n>s&&a>s)return 0;var l=f.quadraticRootAt(e,n,a,s,y);if(0===l)return 0;var c=f.quadraticExtremum(e,n,a);if(c>=0&&1>=c){for(var u=0,h=f.quadraticAt(e,n,a,c),d=0;l>d;d++){var p=f.quadraticAt(t,i,r,y[d]);p>o||(u+=y[d]<c?e>h?1:-1:h>a?1:-1)}return u}var p=f.quadraticAt(t,i,r,y[0]);return p>o?0:e>a?1:-1}function a(t,e,i,n,r,a,o,s){if(s-=e,s>i||-i>s)return 0;var l=Math.sqrt(i*i-s*s);y[0]=-l,y[1]=l;var c=Math.abs(n-r);if(1e-4>c)return 0;if(1e-4>c%m){n=0,r=m;var u=a?1:-1;return o>=y[0]+t&&o<=y[1]+t?u:0}if(a){var l=n;n=d(r),r=d(l)}else n=d(n),r=d(r);n>r&&(r+=m);for(var h=0,f=0;2>f;f++){var p=y[f];if(p+t>o){var v=Math.atan2(s,p),u=a?1:-1;0>v&&(v=m+v),(v>=n&&r>=v||v+m>=n&&r>=v+m)&&(v>Math.PI/2&&v<1.5*Math.PI&&(u=-u),h+=u)}}return h}function o(t,i,o,l,d){for(var f=0,m=0,g=0,y=0,_=0,x=0;x<t[Fi];){var b=t[x++];if(b===s.M&&x>1&&(o||(f+=p(m,g,y,_,l,d)),0!==f))return!0;switch(1==x&&(m=t[x],g=t[x+1],y=m,_=g),b){case s.M:y=t[x++],_=t[x++],m=y,g=_;break;case s.L:if(o){if(v(m,g,t[x],t[x+1],i,l,d))return!0}else f+=p(m,g,t[x],t[x+1],l,d)||0;m=t[x++],g=t[x++];break;case s.C:if(o){if(c.containStroke(m,g,t[x++],t[x++],t[x++],t[x++],t[x],t[x+1],i,l,d))return!0}else f+=n(m,g,t[x++],t[x++],t[x++],t[x++],t[x],t[x+1],l,d)||0;m=t[x++],g=t[x++];break;case s.Q:if(o){if(u.containStroke(m,g,t[x++],t[x++],t[x],t[x+1],i,l,d))return!0}else f+=r(m,g,t[x++],t[x++],t[x],t[x+1],l,d)||0;m=t[x++],g=t[x++];break;case s.A:var w=t[x++],M=t[x++],S=t[x++],k=t[x++],C=t[x++],A=t[x++],T=(t[x++],1-t[x++]),D=Math.cos(C)*S+w,L=Math.sin(C)*k+M;x>1?f+=p(m,g,D,L,l,d):(y=D,_=L);var P=(l-w)*k/S+w;if(o){if(h.containStroke(w,M,k,C,C+A,T,i,P,d))return!0}else f+=a(w,M,k,C,C+A,T,P,d);m=Math.cos(C+A)*S+w,g=Math.sin(C+A)*k+M;break;case s.R:y=m=t[x++],_=g=t[x++];var z=t[x++],I=t[x++],D=y+z,L=_+I;if(o){if(v(y,_,D,_,i,l,d)||v(D,_,D,L,i,l,d)||v(D,L,y,L,i,l,d)||v(y,L,D,L,i,l,d))return!0}else f+=p(D,_,D,L,l,d),f+=p(y,L,y,_,l,d);break;case s.Z:if(o){if(v(m,g,y,_,i,l,d))return!0}else if(f+=p(m,g,y,_,l,d),0!==f)return!0;m=y,g=_}}return o||e(g,_)||(f+=p(m,g,y,_,l,d)||0),0!==f}var s=t("../core/PathProxy").CMD,l=t("./line"),c=t("./cubic"),u=t("./quadratic"),h=t("./arc"),d=t("./util").normalizeRadian,f=t("../core/curve"),p=t("./windingLine"),v=l.containStroke,m=2*Math.PI,g=1e-4,y=[-1,-1,-1],_=[-1,-1];return{contain:function(t,e,i){return o(t,0,!1,e,i)},containStroke:function(t,e,i,n){return o(t,e,!0,i,n)}}}),e("zrender/graphic/Path",[ji,"./Displayable",pi,"../core/PathProxy","../contain/path","./Gradient"],function(t){function e(t){var e=t.fill;return null!=e&&"none"!==e}function i(t){var e=t[Si];return null!=e&&"none"!==e&&t[ki]>0}function n(t){r.call(this,t),this.path=new o}var r=t("./Displayable"),a=t(pi),o=t("../core/PathProxy"),s=t("../contain/path"),l=t("./Gradient"),c=Math.abs;return n[qi]={constructor:n,type:"path",__dirtyPath:!0,strokeContainThreshold:5,brush:function(t){t.save();var n=this.style,r=this.path,a=i(n),o=e(n);this.__dirtyPath&&(o&&n.fill instanceof l&&n.fill.updateCanvasGradient(this,t),a&&n[Si]instanceof l&&n[Si].updateCanvasGradient(this,t)),n.bind(t,this),this.setTransform(t);var s=n.lineDash,c=n.lineDashOffset,u=!!t.setLineDash;this.__dirtyPath||s&&!u&&a?(r=this.path[Ot](t),s&&!u&&(r.setLineDash(s),r.setLineDashOffset(c)),this[Dt](r,this.shape),this.__dirtyPath=!1):(t[Ot](),this.path.rebuildPath(t)),o&&r.fill(t),s&&u&&(t.setLineDash(s),t.lineDashOffset=c),a&&r[Si](t),null!=n.text&&this.drawRectText(t,this[ni]()),t[Tt]()},buildPath:function(t,e){},getBoundingRect:function(){var t=this._rect,e=this.style;if(!t){var n=this.path;this.__dirtyPath&&(n[Ot](),this[Dt](n,this.shape)),t=n[ni]()}if(i(e)&&(this[Kt]||!this._rect)){var r=this._rectWithStroke||(this._rectWithStroke=t.clone());r.copy(t);var a=e[ki],o=e.strokeNoScale?this.getLineScale():1;return a=Math.max(a,this.strokeContainThreshold),o>1e-10&&(r.width+=a/o,r[gi]+=a/o,r.x-=a/o/2,r.y-=a/o/2),r}return this._rect=t,t},contain:function(t,n){var r=this[se](t,n),a=this[ni](),o=this.style;if(t=r[0],n=r[1],a[Rt](t,n)){var l=this.path.data;if(i(o)){var c=o[ki],u=o.strokeNoScale?this.getLineScale():1;if(1e-10>u)return!1;if(c=Math.max(c,this.strokeContainThreshold),s.containStroke(l,c/u,t,n))return!0}if(e(o))return s[Rt](l,t,n)}return!1},dirty:function(t){0===arguments[Fi]&&(t=!0),t&&(this.__dirtyPath=t,this._rect=null),this[Kt]=!0,this.__zr&&this.__zr[Jt](),this.__clipTarget&&this.__clipTarget.dirty()},animateShape:function(t){return this[ie]("shape",t)},attrKV:function(t,e){"shape"===t?this[At](e):r[qi].attrKV.call(this,t,e)},setShape:function(t,e){var i=this.shape;if(i){if(a[Ze](t))for(var n in t)i[n]=t[n];else i[t]=e;this.dirty(!0)}return this},getLineScale:function(){var t=this[he];return t&&c(t[0]-1)>1e-10&&c(t[3]-1)>1e-10?Math.sqrt(c(t[0]*t[3]-t[2]*t[1])):1}},n[Li]=function(t){var e=function(e){n.call(this,e),t.style&&this.style.extendFrom(t.style,!1);var i=t.shape;if(i){this.shape=this.shape||{};var r=this.shape;for(var a in i)!r.hasOwnProperty(a)&&i.hasOwnProperty(a)&&(r[a]=i[a])}t.init&&t.init.call(this,e)};a[Di](e,n);for(var i in t)"style"!==i&&"shape"!==i&&(e[qi][i]=t[i]);return e},a[Di](n,r),n}),e("zrender/tool/transformPath",[ji,"../core/PathProxy","../core/vector"],function(t){function e(t,e){var n,l,c,u,h,d=t.data,f=i.M,p=i.C,v=i.L,m=i.R,g=i.A,y=i.Q;for(c=0,u=0;c<d[Fi];){switch(n=d[c++],u=c,l=0,n){case f:l=1;break;case v:l=1;break;case p:l=3;break;case y:l=2;break;case g:var _=e[4],x=e[5],b=o(e[0]*e[0]+e[1]*e[1]),w=o(e[2]*e[2]+e[3]*e[3]),M=s(-e[1]/w,e[0]/b);d[c+7];d[c++]+=_,d[c++]+=x,d[c++]*=b,d[c++]*=w,d[c++]+=M,d[c++]+=M,c+=2,u=c;break;case m:S[0]=d[c++],S[1]=d[c++],r(S,S,e),d[u++]=S[0],d[u++]=S[1],S[0]+=d[c++],S[1]+=d[c++],r(S,S,e),d[u++]=S[0],d[u++]=S[1]}for(h=0;l>h;h++){var S=a[h];S[0]=d[c++],S[1]=d[c++],r(S,S,e),d[u++]=S[0],d[u++]=S[1]}}}var i=t("../core/PathProxy").CMD,n=t("../core/vector"),r=n[yi],a=[[],[],[]],o=Math.sqrt,s=Math.atan2;return e}),e("zrender/tool/path",[ji,"../graphic/Path","../core/PathProxy","./transformPath","../core/matrix"],function(t){function e(t,e,i,n,r,a,o,s,l,f,m){var g=l*(d/180),y=h(g)*(t-i)/2+u(g)*(e-n)/2,_=-1*u(g)*(t-i)/2+h(g)*(e-n)/2,x=y*y/(o*o)+_*_/(s*s);x>1&&(o*=c(x),s*=c(x));var b=(r===a?-1:1)*c((o*o*(s*s)-o*o*(_*_)-s*s*(y*y))/(o*o*(_*_)+s*s*(y*y)))||0,w=b*o*_/s,M=b*-s*y/o,S=(t+i)/2+h(g)*w-u(g)*M,k=(e+n)/2+u(g)*w+h(g)*M,C=v([1,0],[(y-w)/o,(_-M)/s]),A=[(y-w)/o,(_-M)/s],T=[(-1*y-w)/o,(-1*_-M)/s],D=v(A,T);p(A,T)<=-1&&(D=d),p(A,T)>=1&&(D=0),0===a&&D>0&&(D-=2*d),1===a&&0>D&&(D+=2*d),m.addData(f,S,k,o,s,C,D,g,a)}function i(t){if(!t)return[];var i,n=t[Je](/-/g," -")[Je](/  /g," ")[Je](/ /g,",")[Je](/,,/g,",");for(i=0;i<l[Fi];i++)n=n[Je](new RegExp(l[i],"g"),"|"+l[i]);var r,o=n.split("|"),s=0,c=0,u=new a,h=a.CMD;for(i=1;i<o[Fi];i++){var d,f=o[i],p=f.charAt(0),v=0,m=f.slice(1)[Je](/e,-/g,"e-").split(",");m[Fi]>0&&""===m[0]&&m.shift();for(var g=0;g<m[Fi];g++)m[g]=parseFloat(m[g]);for(;v<m[Fi]&&!isNaN(m[v])&&!isNaN(m[0]);){var y,_,x,b,w,M,S,k=s,C=c;switch(p){case"l":s+=m[v++],c+=m[v++],d=h.L,u.addData(d,s,c);break;case"L":s=m[v++],c=m[v++],d=h.L,u.addData(d,s,c);break;case"m":s+=m[v++],c+=m[v++],d=h.M,u.addData(d,s,c),p="l";break;case"M":s=m[v++],c=m[v++],d=h.M,u.addData(d,s,c),p="L";break;case"h":s+=m[v++],d=h.L,u.addData(d,s,c);break;case"H":s=m[v++],d=h.L,u.addData(d,s,c);break;case"v":c+=m[v++],d=h.L,u.addData(d,s,c);break;case"V":c=m[v++],d=h.L,u.addData(d,s,c);break;case"C":d=h.C,u.addData(d,m[v++],m[v++],m[v++],m[v++],m[v++],m[v++]),s=m[v-2],c=m[v-1];break;case"c":d=h.C,u.addData(d,m[v++]+s,m[v++]+c,m[v++]+s,m[v++]+c,m[v++]+s,m[v++]+c),s+=m[v-2],c+=m[v-1];break;case"S":y=s,_=c;var A=u.len(),T=u.data;r===h.C&&(y+=s-T[A-4],_+=c-T[A-3]),d=h.C,k=m[v++],C=m[v++],s=m[v++],c=m[v++],u.addData(d,y,_,k,C,s,c);break;case"s":y=s,_=c;var A=u.len(),T=u.data;r===h.C&&(y+=s-T[A-4],_+=c-T[A-3]),d=h.C,k=s+m[v++],C=c+m[v++],s+=m[v++],c+=m[v++],u.addData(d,y,_,k,C,s,c);break;case"Q":k=m[v++],C=m[v++],s=m[v++],c=m[v++],d=h.Q,u.addData(d,k,C,s,c);break;case"q":k=m[v++]+s,C=m[v++]+c,s+=m[v++],c+=m[v++],d=h.Q,u.addData(d,k,C,s,c);break;case"T":y=s,_=c;var A=u.len(),T=u.data;r===h.Q&&(y+=s-T[A-4],_+=c-T[A-3]),s=m[v++],c=m[v++],d=h.Q,u.addData(d,y,_,s,c);break;case"t":y=s,_=c;var A=u.len(),T=u.data;r===h.Q&&(y+=s-T[A-4],_+=c-T[A-3]),s+=m[v++],c+=m[v++],d=h.Q,u.addData(d,y,_,s,c);break;case"A":x=m[v++],b=m[v++],w=m[v++],M=m[v++],S=m[v++],k=s,C=c,s=m[v++],c=m[v++],d=h.A,e(k,C,s,c,M,S,x,b,w,d,u);break;case"a":x=m[v++],b=m[v++],w=m[v++],M=m[v++],S=m[v++],k=s,C=c,s+=m[v++],c+=m[v++],d=h.A,e(k,C,s,c,M,S,x,b,w,d,u)}}("z"===p||"Z"===p)&&(d=h.Z,u.addData(d)),r=d}return u.toStatic(),u}function n(t,e){var n,r=i(t);return e=e||{},e[Dt]=function(t){t.setData(r.data),n&&o(t,n);var e=t[Zi]();e&&t.rebuildPath(e)},e[yi]=function(t){n||(n=s[mi]()),s.mul(n,t,n)},e}var r=t("../graphic/Path"),a=t("../core/PathProxy"),o=t("./transformPath"),s=t("../core/matrix"),l=["m","M","l","L","v","V","h","H","z","Z","c","C","q","Q","t","T","s","S","a","A"],c=Math.sqrt,u=Math.sin,h=Math.cos,d=Math.PI,f=function(t){return Math.sqrt(t[0]*t[0]+t[1]*t[1])},p=function(t,e){return(t[0]*e[0]+t[1]*e[1])/(f(t)*f(e))},v=function(t,e){return(t[0]*e[1]<t[1]*e[0]?-1:1)*Math.acos(p(t,e))};return{createFromString:function(t,e){return new r(n(t,e))},extendFromString:function(t,e){return r[Li](n(t,e))},mergePath:function(t,e){var i,n,a=[],o=t[Fi];for(n=0;o>n;n++)i=t[n],i[Kt]&&i[Dt](i.path,i.shape),a.push(i.path);var s=new r(e);return s[Dt]=function(t){t.appendPath(a);var e=t[Zi]();e&&t.rebuildPath(e)},s}}}),e("zrender/graphic/helper/roundRect",[ji],function(t){return{buildPath:function(t,e){var i,n,r,a,o=e.x,s=e.y,l=e.width,c=e[gi],u=e.r;typeof u===Ri?i=n=r=a=u:u instanceof Array?1===u[Fi]?i=n=r=a=u[0]:2===u[Fi]?(i=r=u[0],n=a=u[1]):3===u[Fi]?(i=u[0],n=a=u[1],r=u[2]):(i=u[0],n=u[1],r=u[2],a=u[3]):i=n=r=a=0;var h;i+n>l&&(h=i+n,i*=l/h,n*=l/h),r+a>l&&(h=r+a,r*=l/h,a*=l/h),n+r>c&&(h=n+r,n*=c/h,r*=c/h),i+a>c&&(h=i+a,i*=c/h,a*=c/h),t[It](o+i,s),t[zt](o+l-n,s),0!==n&&t.quadraticCurveTo(o+l,s,o+l,s+n),t[zt](o+l,s+c-r),0!==r&&t.quadraticCurveTo(o+l,s+c,o+l-r,s+c),t[zt](o+a,s+c),0!==a&&t.quadraticCurveTo(o,s+c,o,s+c-a),t[zt](o,s+i),0!==i&&t.quadraticCurveTo(o,s,o+i,s)}}}),e("zrender/core/LRU",[ji],function(t){var e=function(){this.head=null,this.tail=null,this._len=0},i=e[qi];i.insert=function(t){var e=new n(t);return this.insertEntry(e),e},i.insertEntry=function(t){this.head?(this.tail.next=t,t.prev=this.tail,this.tail=t):this.head=this.tail=t,this._len++},i[Qt]=function(t){var e=t.prev,i=t.next;e?e.next=i:this.head=i,i?i.prev=e:this.tail=e,t.next=t.prev=null,this._len--},i.len=function(){return this._len};var n=function(t){this.value=t,this.next,this.prev},r=function(t){this._list=new e,this._map={},this._maxSize=t||10},a=r[qi];return a.put=function(t,e){var i=this._list,n=this._map;if(null==n[t]){var r=i.len();if(r>=this._maxSize&&r>0){var a=i.head;i[Qt](a),delete n[a.key]}var o=i.insert(e);o.key=t,n[t]=o}},a.get=function(t){var e=this._map[t],i=this._list;return null!=e?(e!==i.tail&&(i[Qt](e),i.insertEntry(e)),e.value):void 0},a.clear=function(){this._list.clear(),this._map={}},r}),e("zrender/graphic/Image",[ji,"./Displayable",fi,pi,"./helper/roundRect","../core/LRU"],function(t){var e=t("./Displayable"),i=t(fi),n=t(pi),r=t("./helper/roundRect"),a=t("../core/LRU"),o=new a(50),s=function(t){e.call(this,t)};return s[qi]={constructor:s,type:"image",brush:function(t){var e,i=this.style,n=i.image;if(e=typeof n===Bi?this._image:n,!e&&n){var a=o.get(n);if(!a)return e=new Image,e.onload=function(){e.onload=null;for(var t=0;t<a.pending[Fi];t++)a.pending[t].dirty()},a={image:e,pending:[this]},e.src=n,o.put(n,a),void(this._image=e);if(e=a.image,this._image=e,!e.width||!e[gi])return void a.pending.push(this)}if(e){var s=i.width||e.width,l=i[gi]||e[gi],c=i.x||0,u=i.y||0;if(!e.width||!e[gi])return;if(t.save(),i.bind(t),this.setTransform(t),i.r&&(t[Ot](),r[Dt](t,i),t.clip()),i.sWidth&&i.sHeight){var h=i.sx||0,d=i.sy||0;t.drawImage(e,h,d,i.sWidth,i.sHeight,c,u,s,l)}else if(i.sx&&i.sy){var h=i.sx,d=i.sy,f=s-h,p=l-d;t.drawImage(e,h,d,f,p,c,u,s,l)}else t.drawImage(e,c,u,s,l);null==i.width&&(i.width=s),null==i[gi]&&(i[gi]=l),null!=i.text&&this.drawRectText(t,this[ni]()),t[Tt]()}},getBoundingRect:function(){var t=this.style;return this._rect||(this._rect=new i(t.x||0,t.y||0,t.width||0,t[gi]||0)),this._rect}},n[Di](s,e),s}),e("zrender/graphic/Text",[ji,"./Displayable",pi,"../contain/text"],function(t){var e=t("./Displayable"),i=t(pi),n=t("../contain/text"),r=function(t){e.call(this,t)};return r[qi]={constructor:r,type:"text",brush:function(t){var e=this.style,i=e.x||0,r=e.y||0,a=e.text,o=e.fill,s=e[Si];if(null!=a&&(a+=""),a){t.save(),this.style.bind(t),this.setTransform(t),o&&(t.fillStyle=o),s&&(t.strokeStyle=s),t.font=e.textFont||e.font,t[Et]=e[Et],t[Bt]=e[Bt];for(var l=n.measureText("国",t.font).width,c=a.split("\n"),u=0;u<c[Fi];u++)o&&t.fillText(c[u],i,r),s&&t.strokeText(c[u],i,r),r+=l;t[Tt]()}},getBoundingRect:function(){if(!this._rect){var t=this.style,e=n[ni](t.text+"",t.textFont,t[Et],t[Bt]);e.x+=t.x||0,e.y+=t.y||0,this._rect=e}return this._rect}},i[Di](r,e),r}),e("zrender/graphic/shape/Circle",[ji,"../Path"],function(t){return t("../Path")[Li]({type:"circle",shape:{cx:0,cy:0,r:0},buildPath:function(t,e){t[It](e.cx+e.r,e.cy),t.arc(e.cx,e.cy,e.r,0,2*Math.PI,!0)}})}),e("zrender/graphic/shape/Sector",[ji,"../Path"],function(t){return t("../Path")[Li]({type:"sector",shape:{cx:0,cy:0,r0:0,r:0,startAngle:0,endAngle:2*Math.PI,clockwise:!0},buildPath:function(t,e){var i=e.cx,n=e.cy,r=Math.max(e.r0||0,0),a=Math.max(e.r,0),o=e.startAngle,s=e.endAngle,l=e.clockwise,c=Math.cos(o),u=Math.sin(o);t[It](c*r+i,u*r+n),t[zt](c*a+i,u*a+n),t.arc(i,n,a,o,s,!l),t[zt](Math.cos(s)*r+i,Math.sin(s)*r+n),0!==r&&t.arc(i,n,r,s,o,l),t[Lt]()}})}),e("zrender/graphic/helper/smoothSpline",[ji,"../../core/vector"],function(t){function e(t,e,i,n,r,a,o){var s=.5*(i-t),l=.5*(n-e);return(2*(e-i)+s+l)*o+(-3*(e-i)-2*s-l)*a+s*r+e}var i=t("../../core/vector");return function(t,n){for(var r=t[Fi],a=[],o=0,s=1;r>s;s++)o+=i[xi](t[s-1],t[s]);var l=o/2;l=r>l?r:l;for(var s=0;l>s;s++){var c,u,h,d=s/(l-1)*(n?r:r-1),f=Math.floor(d),p=d-f,v=t[f%r];n?(c=t[(f-1+r)%r],u=t[(f+1)%r],h=t[(f+2)%r]):(c=t[0===f?f:f-1],u=t[f>r-2?r-1:f+1],h=t[f>r-3?r-1:f+2]);var m=p*p,g=p*m;a.push([e(c[0],v[0],u[0],h[0],p,m,g),e(c[1],v[1],u[1],h[1],p,m,g)])}return a}}),e("zrender/graphic/helper/smoothBezier",[ji,"../../core/vector"],function(t){var e=t("../../core/vector"),i=e.min,n=e.max,r=e.scale,a=e[xi],o=e.add;return function(t,s,l,c){var u,h,d,f,p=[],v=[],m=[],g=[];if(c){d=[1/0,1/0],f=[-(1/0),-(1/0)];for(var y=0,_=t[Fi];_>y;y++)i(d,d,t[y]),n(f,f,t[y]);i(d,d,c[0]),n(f,f,c[1])}for(var y=0,_=t[Fi];_>y;y++){var x=t[y];if(l)u=t[y?y-1:_-1],h=t[(y+1)%_];else{if(0===y||y===_-1){p.push(e.clone(t[y]));continue}u=t[y-1],h=t[y+1]}e.sub(v,h,u),r(v,v,s);var b=a(x,u),w=a(x,h),M=b+w;0!==M&&(b/=M,w/=M),r(m,v,-b),r(g,v,w);var S=o([],x,m),k=o([],x,g);c&&(n(S,S,d),i(S,S,f),n(k,k,d),i(k,k,f)),p.push(S),p.push(k)}return l&&p.push(p.shift()),p}}),e("zrender/graphic/helper/poly",[ji,"./smoothSpline","./smoothBezier"],function(t){var e=t("./smoothSpline"),i=t("./smoothBezier");return{buildPath:function(t,n,r){var a=n[Ct],o=n.smooth;if(a&&a[Fi]>=2){if(o&&"spline"!==o){var s=i(a,o,r,n.smoothConstraint);t[It](a[0][0],a[0][1]);for(var l=a[Fi],c=0;(r?l:l-1)>c;c++){var u=s[2*c],h=s[2*c+1],d=a[(c+1)%l];t[Pt](u[0],u[1],h[0],h[1],d[0],d[1])}}else{"spline"===o&&(a=e(a,r)),t[It](a[0][0],a[0][1]);for(var c=1,f=a[Fi];f>c;c++)t[zt](a[c][0],a[c][1])}r&&t[Lt]()}}}}),e("zrender/graphic/shape/Polygon",[ji,"../helper/poly","../Path"],function(t){var e=t("../helper/poly");return t("../Path")[Li]({type:"polygon",shape:{points:null,smooth:!1,smoothConstraint:null},buildPath:function(t,i){e[Dt](t,i,!0)}})}),e("zrender/graphic/shape/Polyline",[ji,"../helper/poly","../Path"],function(t){var e=t("../helper/poly");return t("../Path")[Li]({type:"polyline",shape:{points:null,smooth:!1,smoothConstraint:null},style:{stroke:"#000",fill:null},buildPath:function(t,i){e[Dt](t,i,!1)}})}),e("zrender/graphic/shape/Rect",[ji,"../helper/roundRect","../Path"],function(t){var e=t("../helper/roundRect");return t("../Path")[Li]({type:"rect",shape:{r:0,x:0,y:0,width:0,height:0},buildPath:function(t,i){var n=i.x,r=i.y,a=i.width,o=i[gi];i.r?e[Dt](t,i):t.rect(n,r,a,o),t[Lt]()}})}),e("zrender/graphic/shape/Line",[ji,"../Path"],function(t){return t("../Path")[Li]({type:"line",shape:{x1:0,y1:0,x2:0,y2:0,percent:1},style:{stroke:"#000",fill:null},buildPath:function(t,e){var i=e.x1,n=e.y1,r=e.x2,a=e.y2,o=e.percent;0!==o&&(t[It](i,n),1>o&&(r=i*(1-o)+r*o,a=n*(1-o)+a*o),t[zt](r,a))},pointAt:function(t){var e=this.shape;return[e.x1*(1-t)+e.x2*t,e.y1*(1-t)+e.y2*t]}})}),e("zrender/graphic/shape/BezierCurve",[ji,"../../core/curve","../Path"],function(t){var e=t("../../core/curve"),i=e.quadraticSubdivide,n=e.cubicSubdivide,r=e.quadraticAt,a=e.cubicAt,o=[];return t("../Path")[Li]({type:"bezier-curve",shape:{x1:0,y1:0,x2:0,y2:0,cpx1:0,cpy1:0,percent:1},style:{stroke:"#000",fill:null},buildPath:function(t,e){var r=e.x1,a=e.y1,s=e.x2,l=e.y2,c=e.cpx1,u=e.cpy1,h=e.cpx2,d=e.cpy2,f=e.percent;0!==f&&(t[It](r,a),null==h||null==d?(1>f&&(i(r,c,s,f,o),c=o[1],s=o[2],i(a,u,l,f,o),u=o[1],l=o[2]),t.quadraticCurveTo(c,u,s,l)):(1>f&&(n(r,c,h,s,f,o),c=o[1],h=o[2],s=o[3],n(a,u,d,l,f,o),u=o[1],d=o[2],l=o[3]),t[Pt](c,u,h,d,s,l)))},pointAt:function(t){var e=this.shape,i=e.cpx2,n=e.cpy2;return null===i||null===n?[r(e.x1,e.cpx1,e.x2,t),r(e.y1,e.cpy1,e.y2,t)]:[a(e.x1,e.cpx1,e.cpx1,e.x2,t),a(e.y1,e.cpy1,e.cpy1,e.y2,t)]}})}),e("zrender/graphic/shape/Arc",[ji,"../Path"],function(t){return t("../Path")[Li]({type:"arc",shape:{cx:0,cy:0,r:0,startAngle:0,endAngle:2*Math.PI,clockwise:!0},style:{stroke:"#000",fill:null},buildPath:function(t,e){var i=e.cx,n=e.cy,r=Math.max(e.r,0),a=e.startAngle,o=e.endAngle,s=e.clockwise,l=Math.cos(a),c=Math.sin(a);t[It](l*r+i,c*r+n),t.arc(i,n,r,a,o,!s)}})}),e("zrender/graphic/LinearGradient",[ji,pi,"./Gradient"],function(t){var e=t(pi),i=t("./Gradient"),n=function(t,e,n,r,a){this.x=null==t?0:t,this.y=null==e?0:e,this.x2=null==n?1:n,this.y2=null==r?0:r,i.call(this,a)};return n[qi]={constructor:n,type:"linear",updateCanvasGradient:function(t,e){for(var i=t[ni](),n=this.x*i.width+i.x,r=this.x2*i.width+i.x,a=this.y*i[gi]+i.y,o=this.y2*i[gi]+i.y,s=e.createLinearGradient(n,a,r,o),l=this.colorStops,c=0;c<l[Fi];c++)s.addColorStop(l[c].offset,l[c].color);this.canvasGradient=s}},e[Di](n,i),n}),e("zrender/graphic/RadialGradient",[ji,pi,"./Gradient"],function(t){var e=t(pi),i=t("./Gradient"),n=function(t,e,n,r){this.x=null==t?.5:t,this.y=null==e?.5:e,this.r=null==n?.5:n,i.call(this,r)};return n[qi]={constructor:n,type:"radial",updateCanvasGradient:function(t,e){
for(var i=t[ni](),n=i.width,r=i[gi],a=Math.min(n,r),o=this.x*n+i.x,s=this.y*r+i.y,l=this.r*a,c=e.createRadialGradient(o,s,0,o,s,l),u=this.colorStops,h=0;h<u[Fi];h++)c.addColorStop(u[h].offset,u[h].color);this.canvasGradient=c}},e[Di](n,i),n}),e("echarts/util/graphic",[ji,Wi,"zrender/tool/path","zrender/graphic/Path",ae,"zrender/core/matrix",wi,"zrender/graphic/Gradient","zrender/container/Group","zrender/graphic/Image","zrender/graphic/Text","zrender/graphic/shape/Circle","zrender/graphic/shape/Sector","zrender/graphic/shape/Polygon","zrender/graphic/shape/Polyline","zrender/graphic/shape/Rect","zrender/graphic/shape/Line","zrender/graphic/shape/BezierCurve","zrender/graphic/shape/Arc","zrender/graphic/LinearGradient","zrender/graphic/RadialGradient"],function(t){function e(t){if(!t.__isHover){if(t.__hoverStlDirty){var e=t.style[Si],i=t.style.fill,n=t.__hoverStl;n.fill=n.fill||(i instanceof y?i:v.lift(i,-.1)),n[Si]=n[Si]||(e instanceof y?e:v.lift(e,-.1));var r={};for(var a in n)n.hasOwnProperty(a)&&(r[a]=t.style[a]);t.__normalStl=r,t.__hoverStlDirty=!1}t[bt](t.__hoverStl),t.z2+=1,t.__isHover=!0}}function i(t){if(t.__isHover){var e=t.__normalStl;e&&t[bt](e),t.z2-=1,t.__isHover=!1}}function n(t){"group"===t.type?t[Xt](function(t){"group"!==t.type&&e(t)}):e(t)}function r(t){"group"===t.type?t[Xt](function(t){"group"!==t.type&&i(t)}):i(t)}function a(t,e){t.__hoverStl=t[xt]||e,t.__hoverStlDirty=!0}function o(){!this.__isEmphasis&&n(this)}function s(){!this.__isEmphasis&&r(this)}function l(){this.__isEmphasis=!0,n(this)}function c(){this.__isEmphasis=!1,r(this)}function u(t,e,i,n,r){var a=t?"Update":"",o=n&&n[Ci]("animationDuration"+a),s=n&&n[Ci]("animationEasing"+a);n&&n[Ci](re)?e.animateTo(i,o,s,r):(e.attr(i),r&&r())}var h=t(Wi),d=t("zrender/tool/path"),f=Math.round,p=t("zrender/graphic/Path"),v=t(ae),m=t("zrender/core/matrix"),g=t(wi),y=t("zrender/graphic/Gradient"),_={};return _.Group=t("zrender/container/Group"),_.Image=t("zrender/graphic/Image"),_.Text=t("zrender/graphic/Text"),_.Circle=t("zrender/graphic/shape/Circle"),_[kt]=t("zrender/graphic/shape/Sector"),_.Polygon=t("zrender/graphic/shape/Polygon"),_[St]=t("zrender/graphic/shape/Polyline"),_.Rect=t("zrender/graphic/shape/Rect"),_.Line=t("zrender/graphic/shape/Line"),_.BezierCurve=t("zrender/graphic/shape/BezierCurve"),_.Arc=t("zrender/graphic/shape/Arc"),_.LinearGradient=t("zrender/graphic/LinearGradient"),_.RadialGradient=t("zrender/graphic/RadialGradient"),_[Mt]=function(t){return p[Li](t)},_.extendPath=function(t,e){return d.extendFromString(t,e)},_.makePath=function(t,e,i,n){var r=d.createFromString(t,e),a=r[ni]();if(i){var o=a.width/a[gi];if(n===ui){var s,l=i[gi]*o;l<=i.width?s=i[gi]:(l=i.width,s=l/o);var c=i.x+i.width/2,u=i.y+i[gi]/2;i.x=c-l/2,i.y=u-s/2,i.width=l,i[gi]=s}this.resizePath(r,i)}return r},_.mergePath=d.mergePath,_.resizePath=function(t,e){if(t[yi]){var i=t[ni](),n=i.calculateTransform(e);t[yi](n)}},_.subPixelOptimizeLine=function(t){var e=_.subPixelOptimize,i=t.shape,n=t.style[ki];return f(2*i.x1)===f(2*i.x2)&&(i.x1=i.x2=e(i.x1,n,!0)),f(2*i.y1)===f(2*i.y2)&&(i.y1=i.y2=e(i.y1,n,!0)),t},_[wt]=function(t){var e=_.subPixelOptimize,i=t.shape,n=t.style[ki],r=i.x,a=i.y,o=i.width,s=i[gi];return i.x=e(i.x,n,!0),i.y=e(i.y,n,!0),i.width=Math.max(e(r+o,n,!1)-i.x,0===o?0:1),i[gi]=Math.max(e(a+s,n,!1)-i.y,0===s?0:1),t},_.subPixelOptimize=function(t,e,i){var n=f(2*t);return(n+f(e))%2===0?n/2:(n+(i?1:-1))/2},_[_t]=function(t,e){e=e||{},"group"===t.type?t[Xt](function(t){"group"!==t.type&&a(t,e)}):a(t,e),t.on(yt,o).on(gt,s),t.on(Se,l).on(Me,c)},_.setText=function(t,e,i){var n=e[Ci](We)||ci,r=n[Ei](ci)>=0?"white":i,a=e[ai](ri);h[Li](t,{textDistance:e[Ci](xi)||5,textFont:a[ii](),textPosition:n,textFill:a[mt]()||r})},_[vt]=h.curry(u,!0),_[pt]=h.curry(u,!1),_.getTransform=function(t,e){for(var i=m.identity([]);t&&t!==e;)m.mul(i,t[ce](),i),t=t[ue];return i},_[yi]=function(t,e,i){return i&&(e=m.invert([],e)),g[yi]([],t,e)},_.transformDirection=function(t,e,i){var n=0===e[4]||0===e[5]||0===e[0]?1:Math.abs(2*e[4]/e[0]),r=0===e[4]||0===e[5]||0===e[2]?1:Math.abs(2*e[4]/e[2]),a=["left"===t?-n:"right"===t?n:0,"top"===t?-r:t===di?r:0];return a=_[yi](a,e,i),Math.abs(a[0])>Math.abs(a[1])?a[0]>0?"right":"left":a[1]>0?di:"top"},_}),e("zrender/core/env",[],function(){function t(t){var e=this.os={},i=this.browser={},n=t.match(/Web[kK]it[\/]{0,1}([\d.]+)/),r=t.match(/(Android);?[\s\/]+([\d.]+)?/),a=t.match(/(iPad).*OS\s([\d_]+)/),o=t.match(/(iPod)(.*OS\s([\d_]+))?/),s=!a&&t.match(/(iPhone\sOS)\s([\d_]+)/),l=t.match(/(webOS|hpwOS)[\s\/]([\d.]+)/),c=l&&t.match(/TouchPad/),u=t.match(/Kindle\/([\d.]+)/),h=t.match(/Silk\/([\d._]+)/),d=t.match(/(BlackBerry).*Version\/([\d.]+)/),f=t.match(/(BB10).*Version\/([\d.]+)/),p=t.match(/(RIM\sTablet\sOS)\s([\d.]+)/),v=t.match(/PlayBook/),m=t.match(/Chrome\/([\d.]+)/)||t.match(/CriOS\/([\d.]+)/),g=t.match(/Firefox\/([\d.]+)/),y=t.match(/MSIE ([\d.]+)/),_=n&&t.match(/Mobile\//)&&!m,x=t.match(/(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/)&&!m,y=t.match(/MSIE\s([\d.]+)/);return(i.webkit=!!n)&&(i.version=n[1]),r&&(e.android=!0,e.version=r[2]),s&&!o&&(e.ios=e.iphone=!0,e.version=s[2][Je](/_/g,".")),a&&(e.ios=e.ipad=!0,e.version=a[2][Je](/_/g,".")),o&&(e.ios=e.ipod=!0,e.version=o[3]?o[3][Je](/_/g,"."):null),l&&(e.webos=!0,e.version=l[2]),c&&(e.touchpad=!0),d&&(e.blackberry=!0,e.version=d[2]),f&&(e.bb10=!0,e.version=f[2]),p&&(e.rimtabletos=!0,e.version=p[2]),v&&(i.playbook=!0),u&&(e.kindle=!0,e.version=u[1]),h&&(i.silk=!0,i.version=h[1]),!h&&e.android&&t.match(/Kindle Fire/)&&(i.silk=!0),m&&(i.chrome=!0,i.version=m[1]),g&&(i.firefox=!0,i.version=g[1]),y&&(i.ie=!0,i.version=y[1]),_&&(t.match(/Safari/)||e.ios)&&(i.safari=!0),x&&(i.webview=!0),y&&(i.ie=!0,i.version=y[1]),e.tablet=!!(a||v||r&&!t.match(/Mobile/)||g&&t.match(/Tablet/)||y&&!t.match(/Phone/)&&t.match(/Touch/)),e.phone=!(e.tablet||e.ipod||!(r||s||l||d||f||m&&t.match(/Android/)||m&&t.match(/CriOS\/([\d.]+)/)||g&&t.match(/Mobile/)||y&&t.match(/Touch/))),{browser:i,os:e,node:!1,canvasSupported:document[Vi](Ni)[Zi]?!0:!1,touchEventsSupported:"ontouchstart"in window||navigator.maxTouchPoints}}return typeof navigator===bi?{browser:{},os:{},node:!0,canvasSupported:!0}:t(navigator.userAgent)}),e(ft,[ji,"../mixin/Eventful"],function(t){function e(t){return t.getBoundingClientRect?t.getBoundingClientRect():{left:0,top:0}}function i(t,i){if(i=i||window.event,null!=i.zrX)return i;var n=i.type,r=n&&n[Ei]("touch")>=0;if(r){var a="touchend"!=n?i.targetTouches[0]:i.changedTouches[0];if(a){var o=e(t);i.zrX=a.clientX-o.left,i.zrY=a.clientY-o.top}}else{var s=0,l=0;i.pageX||i.pageY?(s=i.pageX,l=i.pageY):(s=i.clientX+document.body.scrollLeft+document.documentElement.scrollLeft,l=i.clientY+document.body.scrollTop+document.documentElement.scrollTop);var c=e(t),u=c.top+(window.pageYOffset||t.scrollTop)-(t.clientTop||0),h=c.left+(window.pageXOffset||t.scrollLeft)-(t.clientLeft||0);i.zrX=s-h,i.zrY=l-u,i.zrDelta=i.wheelDelta?i.wheelDelta/120:-(i.detail||0)/3}return i}function n(t,e,i){o?t.addEventListener(e,i):t.attachEvent("on"+e,i)}function r(t,e,i){o?t.removeEventListener(e,i):t.detachEvent("on"+e,i)}var a=t("../mixin/Eventful"),o=typeof window!==bi&&!!window.addEventListener,s=o?function(t){t.preventDefault(),t.stopPropagation(),t.cancelBubble=!0}:function(t){t.returnValue=!1,t.cancelBubble=!0};return{normalizeEvent:i,addEventListener:n,removeEventListener:r,stop:s,Dispatcher:a}}),e("zrender/mixin/Draggable",[ji],function(t){function e(){this.on("mousedown",this._dragStart,this),this.on(dt,this._drag,this),this.on("mouseup",this._dragEnd,this),this.on("globalout",this._dragEnd,this)}return e[qi]={constructor:e,_dragStart:function(t){var e=t[oe];e&&e[ee]&&(this._draggingTarget=e,e.dragging=!0,this._x=t[ht],this._y=t[ut],this._dispatchProxy(e,"dragstart",t.event))},_drag:function(t){var e=this._draggingTarget;if(e){var i=t[ht],n=t[ut],r=i-this._x,a=n-this._y;this._x=i,this._y=n,e.drift(r,a,t),this._dispatchProxy(e,"drag",t.event);var o=this._findHover(i,n,e),s=this._dropTarget;this._dropTarget=o,e!==o&&(s&&o!==s&&this._dispatchProxy(s,"dragleave",t.event),o&&o!==s&&this._dispatchProxy(o,"dragenter",t.event))}},_dragEnd:function(t){var e=this._draggingTarget;e&&(e.dragging=!1),this._dispatchProxy(e,"dragend",t.event),this._dropTarget&&this._dispatchProxy(this._dropTarget,"drop",t.event),this._draggingTarget=null,this._dropTarget=null}},e}),e("zrender/core/GestureMgr",[ji],function(t){function e(t){var e=t[1][0]-t[0][0],i=t[1][1]-t[0][1];return Math.sqrt(e*e+i*i)}function i(t){return[(t[0][0]+t[1][0])/2,(t[0][1]+t[1][1])/2]}var n=function(){this._track=[]};n[qi]={constructor:n,recognize:function(t,e){return this._doTrack(t,e),this._recognize(t)},clear:function(){return this._track[Fi]=0,this},_doTrack:function(t,e){var i=t.touches;if(i){for(var n={points:[],touches:[],target:e,event:t},r=0,a=i[Fi];a>r;r++){var o=i[r];n[Ct].push([o.clientX,o.clientY]),n.touches.push(o)}this._track.push(n)}},_recognize:function(t){for(var e in r)if(r.hasOwnProperty(e)){var i=r[e](this._track,t);if(i)return i}}};var r={pinch:function(t,n){var r=t[Fi];if(r){var a=(t[r-1]||{})[Ct],o=(t[r-2]||{})[Ct]||a;if(o&&o[Fi]>1&&a&&a[Fi]>1){var s=e(a)/e(o);!isFinite(s)&&(s=1),n.pinchScale=s;var l=i(a);return n.pinchX=l[0],n.pinchY=l[1],{type:"pinch",target:t[0][oe],event:n}}}}};return n}),e("zrender/Handler",[ji,"./core/env","./core/event","./core/util","./mixin/Draggable","./core/GestureMgr","./mixin/Eventful"],function(t){function e(t){return"_"+t+"Handler"}function i(t,e,i){return{type:t,event:i,target:e,cancelBubble:!1,offsetX:i.zrX,offsetY:i.zrY,gestureEvent:i.gestureEvent,pinchX:i.pinchX,pinchY:i.pinchY,pinchScale:i.pinchScale,wheelDelta:i.zrDelta}}function n(t,e,i){var n=t._gestureMgr;"start"===i&&n.clear();var r=n.recognize(e,t._findHover(e.zrX,e.zrY,null));if("end"===i&&n.clear(),r){var a=r.type;e.gestureEvent=a,t._dispatchProxy(r[oe],a,r.event)}}function r(t){for(var i=d[Oi](f),n=i[Fi];n--;){var r=i[n];t[e(r)]=l.bind(y[r],t)}}function a(t,e,i){if(t[t.rectHover?"rectContain":Rt](e,i)){for(var n=t[ue];n;){if(n.clipPath&&!n.clipPath[Rt](e,i))return!1;n=n[ue]}return!0}return!1}var o=t("./core/env"),s=t("./core/event"),l=t("./core/util"),c=t("./mixin/Draggable"),u=t("./core/GestureMgr"),h=t("./mixin/Eventful"),d=["click","dblclick","mousewheel",dt,gt,"mouseup","mousedown"],f=["touchstart","touchend","touchmove"],p=300,v=s.addEventListener,m=s.removeEventListener,g=s.normalizeEvent,y={mousemove:function(t){t=g(this.root,t);var e=t.zrX,i=t.zrY,n=this._findHover(e,i,null),r=this._hovered;this._hovered=n,this.root.style.cursor=n?n.cursor:this._defaultCursorStyle,r&&n!==r&&r.__zr&&this._dispatchProxy(r,gt,t),this._dispatchProxy(n,dt,t),n&&n!==r&&this._dispatchProxy(n,yt,t)},mouseout:function(t){t=g(this.root,t);var e=t.toElement||t.relatedTarget;if(e!=this.root)for(;e&&9!=e.nodeType;){if(e===this.root)return;e=e[ct]}this._dispatchProxy(this._hovered,gt,t),this[Ht]("globalout",{event:t})},touchstart:function(t){t=g(this.root,t),this._lastTouchMoment=new Date,n(this,t,"start"),this._mousemoveHandler(t),this._mousedownHandler(t)},touchmove:function(t){t=g(this.root,t),n(this,t,"change"),this._mousemoveHandler(t)},touchend:function(t){t=g(this.root,t),n(this,t,"end"),this._mouseupHandler(t),+new Date-this._lastTouchMoment<p&&this._clickHandler(t)}};l.each(["click","mousedown","mouseup","mousewheel","dblclick"],function(t){y[t]=function(e){e=g(this.root,e);var i=this._findHover(e.zrX,e.zrY,null);this._dispatchProxy(i,t,e)}});var _=function(t,i,n){h.call(this),this.root=t,this[lt]=i,this.painter=n,this._hovered,this._lastTouchMoment,this._lastX,this._lastY,this._defaultCursorStyle="default",this._gestureMgr=new u,r(this),o.touchEventsSupported?(l.each(f,function(i){v(t,i,this[e(i)])},this),v(t,gt,this._mouseoutHandler)):(l.each(d,function(i){v(t,i,this[e(i)])},this),v(t,"DOMMouseScroll",this._mousewheelHandler)),c.call(this)};return _[qi]={constructor:_,resize:function(t){this._hovered=null},dispatch:function(t,i){var n=this[e(t)];n&&n(i)},dispose:function(){for(var t=this.root,i=d[Oi](f),n=0;n<i[Fi];n++){var r=i[n];m(t,r,this[e(r)])}m(t,"DOMMouseScroll",this._mousewheelHandler),this.root=this[lt]=this.painter=null},setDefaultCursorStyle:function(t){this._defaultCursorStyle=t},_dispatchProxy:function(t,e,n){for(var r="on"+e,a=i(e,t,n),o=t;o&&(o[r]&&(a.cancelBubble=o[r].call(o,a)),o[Ht](e,a),o=o[ue],!a.cancelBubble););a.cancelBubble||(this[Ht](e,a),this.painter&&this.painter.eachOtherLayer(function(t){typeof t[r]==Ii&&t[r].call(t,a),t[Ht]&&t[Ht](e,a)}))},_findHover:function(t,e,i){for(var n=this[lt][st](),r=n[Fi]-1;r>=0;r--)if(!n[r].silent&&n[r]!==i&&a(n[r],t,e))return n[r]}},l.mixin(_,h),l.mixin(_,c),_}),e("zrender/Storage",[ji,"./core/util","./container/Group"],function(t){function e(t,e){return t[ot]===e[ot]?t.z===e.z?t.z2===e.z2?t.__renderidx-e.__renderidx:t.z2-e.z2:t.z-e.z:t[ot]-e[ot]}var i=t("./core/util"),n=t("./container/Group"),r=function(){this._elements={},this._roots=[],this._displayList=[],this._displayListLen=0};return r[qi]={constructor:r,getDisplayList:function(t){return t&&this.updateDisplayList(),this._displayList},updateDisplayList:function(){this._displayListLen=0;for(var t=this._roots,i=this._displayList,n=0,r=t[Fi];r>n;n++){var a=t[n];this._updateAndAddDisplayable(a)}i[Fi]=this._displayListLen;for(var n=0,r=i[Fi];r>n;n++)i[n].__renderidx=n;i.sort(e)},_updateAndAddDisplayable:function(t,e){if(!t[te]){t.beforeUpdate(),t[at](),t.afterUpdate();var i=t.clipPath;if(i&&(i[ue]=t,i.updateTransform(),e?(e=e.slice(),e.push(i)):e=[i]),"group"==t.type){for(var n=t._children,r=0;r<n[Fi];r++){var a=n[r];a[Kt]=t[Kt]||a[Kt],this._updateAndAddDisplayable(a,e)}t[Kt]=!1}else t.__clipPaths=e,this._displayList[this._displayListLen++]=t}},addRoot:function(t){this._elements[t.id]||(t instanceof n&&t.addChildrenToStorage(this),this[$t](t),this._roots.push(t))},delRoot:function(t){if(null==t){for(var e=0;e<this._roots[Fi];e++){var r=this._roots[e];r instanceof n&&r.delChildrenFromStorage(this)}return this._elements={},this._roots=[],this._displayList=[],void(this._displayListLen=0)}if(t instanceof Array)for(var e=0,a=t[Fi];a>e;e++)this.delRoot(t[e]);else{var o;o=typeof t==Bi?this._elements[t]:t;var s=i[Ei](this._roots,o);s>=0&&(this[Yt](o.id),this._roots[Ie](s,1),o instanceof n&&o.delChildrenFromStorage(this))}},addToMap:function(t){return t instanceof n&&(t.__storage=this),t.dirty(),this._elements[t.id]=t,this},get:function(t){return this._elements[t]},delFromMap:function(t){var e=this._elements,i=e[t];return i&&(delete e[t],i instanceof n&&(i.__storage=null)),this},dispose:function(){this._elements=this._renderList=this._roots=null}},r}),e("zrender/animation/Animation",[ji,pi,"../core/event","./Animator"],function(t){var e=t(pi),i=t("../core/event").Dispatcher,n=typeof window!==bi&&(window.requestAnimationFrame||window.msRequestAnimationFrame||window.mozRequestAnimationFrame||window.webkitRequestAnimationFrame)||function(t){setTimeout(t,16)},r=t("./Animator"),a=function(t){t=t||{},this.stage=t.stage||{},this.onframe=t.onframe||function(){},this._clips=[],this._running=!1,this._time=0,i.call(this)};return a[qi]={constructor:a,addClip:function(t){this._clips.push(t)},addAnimator:function(t){t[re]=this;for(var e=t.getClips(),i=0;i<e[Fi];i++)this.addClip(e[i])},removeClip:function(t){var i=e[Ei](this._clips,t);i>=0&&this._clips[Ie](i,1)},removeAnimator:function(t){for(var e=t.getClips(),i=0;i<e[Fi];i++)this.removeClip(e[i]);t[re]=null},_update:function(){for(var t=(new Date).getTime(),e=t-this._time,i=this._clips,n=i[Fi],r=[],a=[],o=0;n>o;o++){var s=i[o],l=s.step(t);l&&(r.push(l),a.push(s))}for(var o=0;n>o;)i[o]._needsRemove?(i[o]=i[n-1],i.pop(),n--):o++;n=r[Fi];for(var o=0;n>o;o++)a[o].fire(r[o]);this._time=t,this.onframe(e),this[Ht]("frame",e),this.stage[at]&&this.stage[at]()},start:function(){function t(){e._running&&(n(t),e._update())}var e=this;this._running=!0,this._time=(new Date).getTime(),n(t)},stop:function(){this._running=!1},clear:function(){this._clips=[]},animate:function(t,e){e=e||{};var i=new r(t,e.loop,e.getter,e.setter);return i}},e.mixin(a,i),a}),e("zrender/Layer",[ji,"./core/util","./config"],function(t){function e(){return!1}function i(t,e,i,n){var r=document[Vi](e),a=i[Pe](),o=i[Le](),s=r.style;return s[We]="absolute",s.left=0,s.top=0,s.width=a+"px",s[gi]=o+"px",r.width=a*n,r[gi]=o*n,r.setAttribute("data-zr-dom-id",t),r}var n=t("./core/util"),r=t("./config"),a=function(t,a,o){var s;o=o||r.devicePixelRatio,typeof t===Bi?s=i(t,Ni,a,o):n[Ze](t)&&(s=t,t=s.id),this.id=t,this.dom=s;var l=s.style;l&&(s.onselectstart=e,l["-webkit-user-select"]="none",l["user-select"]="none",l["-webkit-touch-callout"]="none",l["-webkit-tap-highlight-color"]="rgba(0,0,0,0)"),this.domBack=null,this.ctxBack=null,this.painter=a,this.config=null,this.clearColor=0,this.motionBlur=!1,this.lastFrameAlpha=.7,this.dpr=o};return a[qi]={constructor:a,elCount:0,__dirty:!0,initContext:function(){this.ctx=this.dom[Zi]("2d");var t=this.dpr;1!=t&&this.ctx.scale(t,t)},createBackBuffer:function(){var t=this.dpr;this.domBack=i("back-"+this.id,Ni,this.painter,t),this.ctxBack=this.domBack[Zi]("2d"),1!=t&&this.ctxBack.scale(t,t)},resize:function(t,e){var i=this.dpr,n=this.dom,r=n.style,a=this.domBack;r.width=t+"px",r[gi]=e+"px",n.width=t*i,n[gi]=e*i,1!=i&&this.ctx.scale(i,i),a&&(a.width=t*i,a[gi]=e*i,1!=i&&this.ctxBack.scale(i,i))},clear:function(t){var e=this.dom,i=this.ctx,n=e.width,r=e[gi],a=this.clearColor,o=this.motionBlur&&!t,s=this.lastFrameAlpha,l=this.dpr;if(o&&(this.domBack||this.createBackBuffer(),this.ctxBack.globalCompositeOperation="copy",this.ctxBack.drawImage(e,0,0,n/l,r/l)),i.clearRect(0,0,n/l,r/l),a&&(i.save(),i.fillStyle=this.clearColor,i.fillRect(0,0,n/l,r/l),i[Tt]()),o){var c=this.domBack;i.save(),i.globalAlpha=s,i.drawImage(c,0,0,n/l,r/l),i[Tt]()}}},a}),e("zrender/Painter",[ji,"./config","./core/util","./core/log","./core/BoundingRect","./Layer","./graphic/Image"],function(t){function e(t){return parseInt(t,10)}function i(t){return t?t.isBuildin?!0:typeof t[rt]!==Ii||typeof t[Jt]!==Ii?!1:!0:!1}function n(t){t.__unusedCount++}function r(t){t[Kt]=!1,1==t.__unusedCount&&t.clear()}function a(t,e,i){return f.copy(t[ni]()),t[he]&&f[yi](t[he]),p.width=e,p[gi]=i,!f[nt](p)}function o(t,e){if(!t||!e||t[Fi]!==e[Fi])return!0;for(var i=0;i<t[Fi];i++)if(t[i]!==e[i])return!0}function s(t,e){for(var i=0;i<t[Fi];i++){var n,r=t[i];r[he]&&(n=r[he],e[he](n[0],n[1],n[2],n[3],n[4],n[5]));var a=r.path;a[Ot](e),r[Dt](a,r.shape),e.clip(),r[he]&&(n=r.invTransform,e[he](n[0],n[1],n[2],n[3],n[4],n[5]))}}var l=t("./config"),c=t("./core/util"),u=t("./core/log"),h=t("./core/BoundingRect"),d=t("./Layer"),f=new h(0,0,0,0),p=new h(0,0,0,0),v=function(t,e,i){var n=!t.nodeName||"CANVAS"===t.nodeName[je]();i=i||{},this.dpr=i.devicePixelRatio||l.devicePixelRatio,this._singleCanvas=n,this.root=t;var r=t.style;if(r&&(r["-webkit-tap-highlight-color"]="transparent",r["-webkit-user-select"]="none",r["user-select"]="none",r["-webkit-touch-callout"]="none",t[it]=""),this[lt]=e,n){var a=t.width,o=t[gi];this._width=a,this._height=o;var s=new d(t,this,1);s.initContext(),this._layers={0:s},this._zlevelList=[0]}else{var a=this._getWidth(),o=this._getHeight();this._width=a,this._height=o;var c=document[Vi]("div");this._domRoot=c;var u=c.style;u[We]="relative",u.overflow="hidden",u.width=this._width+"px",u[gi]=this._height+"px",t[et](c),this._layers={},this._zlevelList=[]}this._layerConfig={},this.pathToImage=this._createPathToImage()};return v[qi]={constructor:v,isSingleCanvas:function(){return this._singleCanvas},getViewportRoot:function(){return this._singleCanvas?this._layers[0].dom:this._domRoot},refresh:function(t){var e=this[lt][st](!0),i=this._zlevelList;this._paintList(e,t);for(var n=0;n<i[Fi];n++){var r=i[n],a=this._layers[r];!a.isBuildin&&a[Jt]&&a[Jt]()}return this},_paintList:function(t,e){null==e&&(e=!1),this._updateLayerStatus(t);var i,l,c,h=this._width,d=this._height;this.eachBuildinLayer(n);for(var f=null,p=0,v=t[Fi];v>p;p++){var m=t[p],g=this._singleCanvas?0:m[ot];if(l!==g&&(l=g,i=this.getLayer(l),i.isBuildin||u("ZLevel "+l+" has been used by unkown layer "+i.id),c=i.ctx,i.__unusedCount=0,(i[Kt]||e)&&i.clear()),(i[Kt]||e)&&!m[Ut]&&0!==m.style[Mi]&&m.scale[0]&&m.scale[1]&&(!m.culling||!a(m,h,d))){var y=m.__clipPaths;o(y,f)&&(f&&c[Tt](),y&&(c.save(),s(y,c)),f=y),m.beforeBrush&&m.beforeBrush(c),m.brush(c,!1),m.afterBrush&&m.afterBrush(c)}m[Kt]=!1}f&&c[Tt](),this.eachBuildinLayer(r)},getLayer:function(t){if(this._singleCanvas)return this._layers[0];var e=this._layers[t];return e||(e=new d("zr_"+t,this,this.dpr),e.isBuildin=!0,this._layerConfig[t]&&c.merge(e,this._layerConfig[t],!0),this.insertLayer(t,e),e.initContext()),e},insertLayer:function(t,e){var n=this._layers,r=this._zlevelList,a=r[Fi],o=null,s=-1,l=this._domRoot;if(n[t])return void u("ZLevel "+t+" has been used already");if(!i(e))return void u("Layer of zlevel "+t+" is not valid");if(a>0&&t>r[0]){for(s=0;a-1>s&&!(r[s]<t&&r[s+1]>t);s++);o=n[r[s]]}if(r[Ie](s+1,0,t),o){var c=o.dom;c.nextSibling?l.insertBefore(e.dom,c.nextSibling):l[et](e.dom)}else l.firstChild?l.insertBefore(e.dom,l.firstChild):l[et](e.dom);n[t]=e},eachLayer:function(t,e){var i,n,r=this._zlevelList;for(n=0;n<r[Fi];n++)i=r[n],t.call(e,this._layers[i],i)},eachBuildinLayer:function(t,e){var i,n,r,a=this._zlevelList;for(r=0;r<a[Fi];r++)n=a[r],i=this._layers[n],i.isBuildin&&t.call(e,i,n)},eachOtherLayer:function(t,e){var i,n,r,a=this._zlevelList;for(r=0;r<a[Fi];r++)n=a[r],i=this._layers[n],i.isBuildin||t.call(e,i,n)},getLayers:function(){return this._layers},_updateLayerStatus:function(t){var e=this._layers,i={};this.eachBuildinLayer(function(t,e){i[e]=t.elCount,t.elCount=0});for(var n=0,r=t[Fi];r>n;n++){var a=t[n],o=this._singleCanvas?0:a[ot],s=e[o];if(s){if(s.elCount++,s[Kt])continue;s[Kt]=a[Kt]}}this.eachBuildinLayer(function(t,e){i[e]!==t.elCount&&(t[Kt]=!0)})},clear:function(){return this.eachBuildinLayer(this._clearLayer),this},_clearLayer:function(t){t.clear()},configLayer:function(t,e){if(e){var i=this._layerConfig;i[t]?c.merge(i[t],e,!0):i[t]=e;var n=this._layers[t];n&&c.merge(n,i[t],!0)}},delLayer:function(t){var e=this._layers,i=this._zlevelList,n=e[t];n&&(n.dom[ct].removeChild(n.dom),delete e[t],i[Ie](c[Ei](i,t),1))},resize:function(t,e){var i=this._domRoot;if(i.style.display="none",t=t||this._getWidth(),e=e||this._getHeight(),i.style.display="",this._width!=t||e!=this._height){i.style.width=t+"px",i.style[gi]=e+"px";for(var n in this._layers)this._layers[n][rt](t,e);this[Jt](!0)}return this._width=t,this._height=e,this},clearLayer:function(t){var e=this._layers[t];e&&e.clear()},dispose:function(){this.root[it]="",this.root=this[lt]=this._domRoot=this._layers=null},getRenderedCanvas:function(t){if(t=t||{},this._singleCanvas)return this._layers[0].dom;var e=new d("image",this,t.pixelRatio||this.dpr);e.initContext();var i=e.ctx;e.clearColor=t[tt],e.clear();for(var n=this[lt][st](!0),r=0;r<n[Fi];r++){var a=n[r];a[Ut]||(a.beforeBrush&&a.beforeBrush(i),a.brush(i,!1),a.afterBrush&&a.afterBrush(i))}return e.dom},getWidth:function(){return this._width},getHeight:function(){return this._height},_getWidth:function(){var t=this.root,i=document.defaultView.getComputedStyle(t);return(t.clientWidth||e(i.width)||e(t.style.width))-(e(i.paddingLeft)||0)-(e(i.paddingRight)||0)|0},_getHeight:function(){var t=this.root,i=document.defaultView.getComputedStyle(t);return(t[J]||e(i[gi])||e(t.style[gi]))-(e(i.paddingTop)||0)-(e(i.paddingBottom)||0)|0},_pathToImage:function(e,i,n,r,a){var o=document[Vi](Ni),s=o[Zi]("2d");o.width=n*a,o[gi]=r*a,s.clearRect(0,0,n*a,r*a);var l={position:i[We],rotation:i[de],scale:i.scale};i[We]=[0,0,0],i[de]=0,i.scale=[1,1],i&&i.brush(s);var c=t("./graphic/Image"),u=new c({id:e,style:{x:0,y:0,image:o}});return null!=l[We]&&(u[We]=i[We]=l[We]),null!=l[de]&&(u[de]=i[de]=l[de]),null!=l.scale&&(u.scale=i.scale=l.scale),u},_createPathToImage:function(){var t=this;return function(e,i,n,r){return t._pathToImage(e,i,n,r,t.dpr)}}},v}),e("zrender/zrender",[ji,"./core/guid","./core/env","./Handler","./Storage","./animation/Animation","./Painter"],function(t){function e(t){delete c[t]}var i=t("./core/guid"),n=t("./core/env"),r=t("./Handler"),a=t("./Storage"),o=t("./animation/Animation"),s=!n[K],l={canvas:t("./Painter")},c={},u={};u.version="3.0.1",u.init=function(t,e){var n=new h(i(),t,e);return c[n.id]=n,n},u[Q]=function(t){if(t)t[Q]();else{for(var e in c)c[e][Q]();c={}}return u},u.getInstance=function(t){return c[t]},u.registerPainter=function(t,e){l[t]=e};var h=function(t,e,i){i=i||{},this.dom=e,this.id=t;var c=this,u=new a,h=i.renderer;if(s){if(!l.vml)throw new Error("You need to require 'zrender/vml/vml' to support IE8");h="vml"}else h&&l[h]||(h=Ni);var d=new l[h](e,u,i);this[lt]=u,this.painter=d,n.node||(this.handler=new r(d.getViewportRoot(),u,d)),this[re]=new o({stage:{update:function(){c._needsRefresh&&c.refreshImmediately()}}}),this[re].start(),this._needsRefresh;var f=u[Yt],p=u[$t];u[Yt]=function(t){var e=u.get(t);f.call(u,t),e&&e.removeSelfFromZr(c)},u[$t]=function(t){p.call(u,t),t.addSelfToZr(c)}};return h[qi]={constructor:h,getId:function(){return this.id},add:function(t){this[lt].addRoot(t),this._needsRefresh=!0},remove:function(t){this[lt].delRoot(t),this._needsRefresh=!0},configLayer:function(t,e){this.painter.configLayer(t,e),this._needsRefresh=!0},refreshImmediately:function(){this._needsRefresh=!1,this.painter[Jt](),this._needsRefresh=!1},refresh:function(){this._needsRefresh=!0},resize:function(){this.painter[rt](),this.handler&&this.handler[rt]()},clearAnimation:function(){this[re].clear()},getWidth:function(){return this.painter[Pe]()},getHeight:function(){return this.painter[Le]()},toDataURL:function(t,e,i){return this.painter.toDataURL(t,e,i)},pathToImage:function(t,e,n){var r=i();return this.painter.pathToImage(r,t,e,n)},setDefaultCursorStyle:function(t){this.handler.setDefaultCursorStyle(t)},on:function(t,e,i){this.handler&&this.handler.on(t,e,i)},off:function(t,e){this.handler&&this.handler.off(t,e)},trigger:function(t,e){this.handler&&this.handler[Ht](t,e)},clear:function(){this[lt].delRoot(),this.painter.clear()},dispose:function(){this[re].stop(),this.clear(),this[lt][Q](),this.painter[Q](),this.handler&&this.handler[Q](),this[re]=this[lt]=this.painter=this.handler=null,e(this.id)}},u}),e("zrender",["zrender/zrender"],function(t){return t}),e("echarts/loading/default",[ji,"../util/graphic",Wi],function(t){var e=t("../util/graphic"),i=t(Wi),n=Math.PI;return function(t,r){r=r||{},i[li](r,{text:"loading",color:"#c23531",textColor:"#000",maskColor:"rgba(255, 255, 255, 0.8)",zlevel:0});var a=new e.Rect({style:{fill:r.maskColor},zlevel:r[ot],z:1e4}),o=new e.Arc({shape:{startAngle:-n/2,endAngle:-n/2+.1,r:10},style:{stroke:r.color,lineCap:"round",lineWidth:5},zlevel:r[ot],z:10001}),s=new e.Rect({style:{fill:"none",text:r.text,textPosition:"right",textDistance:10,textFill:r.textColor},zlevel:r[ot],z:10001});o.animateShape(!0).when(1e3,{endAngle:3*n/2}).start("circularInOut"),o.animateShape(!0).when(1e3,{startAngle:3*n/2}).delay(300).start("circularInOut");var l=new e.Group;return l.add(o),l.add(s),l.add(a),l[rt]=function(){var e=t[Pe]()/2,i=t[Le]()/2;o[At]({cx:e,cy:i});var n=o.shape.r;s[At]({x:e-n,y:i-n,width:2*n,height:2*n}),a[At]({x:0,y:0,width:t[Pe](),height:t[Le]()})},l[rt](),l}}),e("echarts/visual/seriesColor",[ji,"zrender/graphic/Gradient"],function(t){var e=t("zrender/graphic/Gradient");return function(t,i,n){function r(t){var r=[i,Me,"color"],a=n.get("color"),o=t[be](),s=t.get(r)||a[t[we]%a[Fi]];o[$]("color",s),n.isSeriesFiltered(t)||(typeof s!==Ii||s instanceof e||o.each(function(e){o[Y](e,"color",s(t[ve](e)))}),o.each(function(t){var e=o[me](t),i=e.get(r,!0);null!=i&&o[Y](t,"color",i)}))}t?n[X](t,r):n[U](r)}}),e("echarts/preprocessor/helper/compatStyle",[ji,Wi],function(t){function e(t){var e=t&&t[j];e&&i.each(n,function(n){var r=e[Me],a=e[Se];r&&r[n]&&(t[n]=t[n]||{},t[n][Me]?i.merge(t[n][Me],r[n]):t[n][Me]=r[n],r[n]=null),a&&a[n]&&(t[n]=t[n]||{},t[n][Se]?i.merge(t[n][Se],a[n]):t[n][Se]=a[n],a[n]=null)})}var i=t(Wi),n=["areaStyle","lineStyle","nodeStyle","linkStyle","chordStyle","label","labelLine"];return function(t){e(t);var n=t.data;if(n){for(var r=0;r<n[Fi];r++)e(n[r]);var a=t.markPoint;if(a&&a.data)for(var o=a.data,r=0;r<o[Fi];r++)e(o[r]);var s=t.markLine;if(s&&s.data)for(var l=s.data,r=0;r<l[Fi];r++)i[Qe](l[r])?(e(l[r][0]),e(l[r][1])):e(l[r])}}}),e("echarts/preprocessor/backwardCompat",[ji,Wi,"./helper/compatStyle"],function(t){function e(t,e){e=e.split(",");for(var i=t,n=0;n<e[Fi]&&(i=i&&i[e[n]],null!=i);n++);return i}function i(t,e,i,n){e=e.split(",");for(var r,a=t,o=0;o<e[Fi]-1;o++)r=e[o],null==a[r]&&(a[r]={}),a=a[r];(n||null==a[e[o]])&&(a[e[o]]=i)}function n(t){c(o,function(e){e[0]in t&&!(e[1]in t)&&(t[e[1]]=t[e[0]])})}var r=t(Wi),a=t("./helper/compatStyle"),o=[["x","left"],["y","top"],["x2","right"],["y2",di]],s=["grid","geo","parallel","legend","toolbox","title","visualMap",q,"timeline"],l=["bar","boxplot","candlestick","chord","effectScatter","funnel","gauge","lines","graph","heatmap","line","map","parallel","pie","radar","sankey","scatter","treemap"],c=r.each;return function(t){c(t[Be],function(t){if(r[Ze](t)){var o=t.type;if(a(t),("pie"===o||"gauge"===o)&&null!=t.clockWise&&(t.clockwise=t.clockWise),"gauge"===o){var s=e(t,"pointer.color");null!=s&&i(t,"itemStyle.normal.color",s)}for(var c=0;c<l[Fi];c++)if(l[c]===t.type){n(t);break}}}),t.dataRange&&(t.visualMap=t.dataRange),c(s,function(e){var i=t[e];i&&(r[Qe](i)||(i=[i]),c(i,function(t){n(t)}))})}}),e("echarts/echarts",[ji,"./model/Global","./ExtensionAPI","./CoordinateSystem","./model/OptionManager","./model/Component","./model/Series","./view/Component","./view/Chart","./util/graphic","zrender",Wi,ae,"zrender/core/env",fe,"./loading/default","./visual/seriesColor","./preprocessor/backwardCompat","./util/graphic","./util/number","./util/format"],function(t){function e(t){return function(e,i,n){e=e&&e[Ue](),A[qi][t].call(this,e,i,n)}}function i(){A.call(this)}function n(t,e,n){n=n||{},e&&T(Y,function(t){t(e)}),this.id,this.group,this._dom=t,this._zr=M.init(t,{renderer:n.renderer||Ni,devicePixelRatio:n.devicePixelRatio}),typeof e===Bi&&(e=J[e]),this._theme=S.clone(e),this._chartsViews=[],this._chartsMap={},this._componentsViews=[],this._componentsMap={},this._api=new v(this),this._coordinateSystem=new m,A.call(this),this._messageCenter=new i,this._initEvents(),this[rt]=S.bind(this[rt],this)}function r(t,e){var i=this._model;i&&i[W]({mainType:"series",query:e},function(n,r){var a=this._chartsMap[n.__viewId];a&&a.__alive&&a[t](n,i,this._api,e)},this)}function a(t,e,i){var n=this._api;T(this._componentsViews,function(r){var a=r.__model;r[t](a,e,n,i),d(a,r)},this),e[U](function(r,a){var o=this._chartsMap[r.__viewId];o[t](r,e,n,i),d(r,o)},this)}function o(t,e){for(var i="component"===t,n=i?this._componentsViews:this._chartsViews,r=i?this._componentsMap:this._chartsMap,a=this._zr,o=0;o<n[Fi];o++)n[o].__alive=!1;e[i?W:U](function(t,o){if(i){if(t===Be)return}else o=t;var s=o.id+"_"+o.type,l=r[s];if(!l){var c=y[zi](o.type),u=i?x[Ai](c.main,c.sub):b[Ai](c.sub);if(!u)return;l=new u,l.init(e,this._api),r[s]=l,n.push(l),a.add(l.group)}o.__viewId=s,l.__alive=!0,l.__id=s,l.__model=o},this);for(var o=0;o<n[Fi];){var s=n[o];s.__alive?o++:(a[Qt](s.group),s[Q](e,this._api),n[Ie](o,1),delete r[s.__id])}}function s(t){T(L,function(e){T(X[e]||[],function(e){e(t)})})}function l(t){var e={};t[U](function(t){var i=t.get("stack"),n=t[be]();if(i&&"list"===n.type){var r=e[i];r&&(n.stackedOn=r),e[i]=n}})}function c(t,e){var i=this._api;T(q,function(n){n(t,i,e)})}function u(t,e){T(D,function(i){T($[i]||[],function(i){i(t,e)})})}function h(t,e){var i=this._api;T(this._componentsViews,function(n){var r=n.__model;n[Wt](r,t,i,e),d(r,n)},this),T(this._chartsViews,function(t){t.__alive=!1},this),t[U](function(n,r){var a=this._chartsMap[n.__viewId];a.__alive=!0,a[Wt](n,t,i,e),d(n,a)},this),T(this._chartsViews,function(e){
e.__alive||e[Qt](t,i)},this)}function d(t,e){var i=t.get("z"),n=t.get(ot);e.group[Xt](function(t){null!=i&&(t.z=i),null!=n&&(t[ot]=n)})}function f(t){function e(t,e){for(var i=0;i<t[Fi];i++){var n=t[i];n[a]=e}}var i=0,n=1,r=2,a="__connectUpdateStatus";S.each(B,function(o,s){t._messageCenter.on(s,function(o){if(it[t.group]&&t[a]!==i){var s=t.makeActionFromEvent(o),l=[];for(var c in et){var u=et[c];u!==t&&u.group===t.group&&l.push(u)}e(l,i),T(l,function(t){t[a]!==n&&t[De](s)}),e(l,r)}})})}var p=t("./model/Global"),v=t("./ExtensionAPI"),m=t("./CoordinateSystem"),g=t("./model/OptionManager"),y=t("./model/Component"),_=t("./model/Series"),x=t("./view/Component"),b=t("./view/Chart"),w=t("./util/graphic"),M=t("zrender"),S=t(Wi),k=t(ae),C=t("zrender/core/env"),A=t(fe),T=S.each,D=["echarts","chart","component"],L=[he,Hi,"statistic"];i[qi].on=e("on"),i[qi].off=e("off"),i[qi].one=e("one"),S.mixin(i,A);var P=n[qi];P[ze]=function(){return this._dom},P.getZr=function(){return this._zr},P.setOption=function(t,e,i){(!this._model||e)&&(this._model=new p(null,null,this._theme,new g(this._api))),this._model.setOption(t,Y),z.prepareAndUpdate.call(this),!i&&this._zr.refreshImmediately()},P.setTheme=function(){console.log("ECharts#setTheme() is DEPRECATED in ECharts 3.0")},P[ai]=function(){return this._model},P.getOption=function(){return S.clone(this._model[ti])},P[Pe]=function(){return this._zr[Pe]()},P[Le]=function(){return this._zr[Le]()},P.getRenderedCanvas=function(t){if(C[K]){t=t||{},t.pixelRatio=t.pixelRatio||1,t[tt]=t[tt]||this._model.get(tt);var e=this._zr,i=e[lt][st]();return S.each(i,function(t){t[ne](!0)}),e.painter.getRenderedCanvas(t)}},P.getDataURL=function(t){t=t||{};var e=t.excludeComponents,i=this._model,n=[],r=this;T(e,function(t){i[W]({mainType:t},function(t){var e=r._componentsMap[t.__viewId];e.group[te]||(n.push(e),e.group[te]=!0)})});var a=this.getRenderedCanvas(t).toDataURL("image/"+(t&&t.type||"png"));return T(n,function(t){t.group[te]=!1}),a},P.getConnectedDataURL=function(t){if(C[K]){var e=this.group,i=Math.min,n=Math.max,r=1/0;if(it[e]){var a=r,o=r,s=-r,l=-r,c=[],u=t&&t.pixelRatio||1;for(var h in et){var d=et[h];if(d.group===e){var f=d.getRenderedCanvas(S.clone(t)),p=d[ze]().getBoundingClientRect();a=i(p.left,a),o=i(p.top,o),s=n(p.right,s),l=n(p[di],l),c.push({dom:f,left:p.left,top:p.top})}}a*=u,o*=u,s*=u,l*=u;var v=s-a,m=l-o,g=S.createCanvas();g.width=v,g[gi]=m;var y=M.init(g);return T(c,function(t){var e=new w.Image({style:{x:t.left*u-a,y:t.top*u-o,image:t.dom}});y.add(e)}),y.refreshImmediately(),g.toDataURL("image/"+(t&&t.type||"png"))}return this.getDataURL(t)}};var z={update:function(t){var e=this._model;if(e){e.restoreData(),s.call(this,e),l.call(this,e),this._coordinateSystem[at](e,this._api),c.call(this,e,t),u.call(this,e,t),h.call(this,e,t);var i=e.get(tt)||"transparent",n=this._zr.painter;if(n.isSingleCanvas&&n.isSingleCanvas())this._zr.configLayer(0,{clearColor:i});else{if(!C[K]){var r=k.parse(i);i=k.stringify(r,"rgb"),0===r[3]&&(i="transparent")}i=i,this._dom.style[tt]=i}}},updateView:function(t){var e=this._model;e&&(c.call(this,e,t),u.call(this,e,t),a.call(this,"updateView",e,t))},updateVisual:function(t){var e=this._model;e&&(u.call(this,e,t),a.call(this,"updateVisual",e,t))},updateLayout:function(t){var e=this._model;e&&(c.call(this,e,t),a.call(this,jt,e,t))},highlight:function(t){r.call(this,"highlight",t)},downplay:function(t){r.call(this,"downplay",t)},prepareAndUpdate:function(t){var e=this._model;o.call(this,"component",e),o.call(this,"chart",e),z[at].call(this,t)}};P[rt]=function(){this._zr[rt]();var t=this._model&&this._model.resetOption("media");z[t?"prepareAndUpdate":at].call(this),this._loadingFX&&this._loadingFX[rt]()};var I=t("./loading/default");P.showLoading=function(t,e){S[Ze](t)&&(e=t,t="default");var i=I(this._api,e),n=this._zr;this._loadingFX=i,n.add(i)},P.hideLoading=function(){this._loadingFX&&this._zr[Qt](this._loadingFX),this._loadingFX=null},P.makeActionFromEvent=function(t){var e=S[Li]({},t);return e.type=B[t.type],e},P[De]=function(t,e){var i=R[t.type];if(i){var n=i.actionInfo,r=n[at]||at,a=[t],o=!1;t.batch&&(o=!0,a=S.map(t.batch,function(e){return e=S[li](S[Li]({},e),t),e.batch=null,e}));for(var s,l=[],c="highlight"===t.type||"downplay"===t.type,u=0;u<a[Fi];u++){var h=a[u];s=i.action(h,this._model),s=s||S[Li]({},h),s.type=n.event||s.type,l.push(s),c&&z[r].call(this,h)}"none"!==r&&!c&&z[r].call(this,t),e||(s=o?{type:l[0].type,batch:l}:l[0],this._messageCenter[Ht](s.type,s))}},P.on=e("on"),P.off=e("off"),P.one=e("one");var O=["click","dblclick",yt,gt,"globalout"];P._initEvents=function(){var t=this._zr;T(O,function(e){t.on(e,function(t){var i=this[ai](),n=t[oe];if(n&&null!=n[Gt]){var r=n[H]||i.getSeriesByIndex(n[we]),a=r&&r[ve](n[Gt])||{};a.event=t,a.type=e,this[Ht](e,a)}},this)},this),T(B,function(t,e){this._messageCenter.on(e,function(t){this[Ht](e,t)},this)},this)},P.isDisposed=function(){return this._disposed},P.clear=function(){this.setOption({},!0)},P[Q]=function(){this._disposed=!0;var t=this._api,e=this._model;T(this._componentsViews,function(i){i[Q](e,t)}),T(this._chartsViews,function(i){i[Q](e,t)}),this._zr[Q](),et[this.id]=null},S.mixin(n,A);var R=[],B={},q=[],X={},Y=[],$={},J={},et={},it={},nt=new Date-0,ct=new Date-0,ut="_echarts_instance_",ht={version:"3.0.2",dependencies:{zrender:"3.0.1"}};return ht.init=function(t,e,i){if(M.version[Je](".","")-0<ht.dependencies.zrender[Je](".","")-0)throw new Error("ZRender "+M.version+" is too old for ECharts "+ht.version+". Current version need ZRender "+ht.dependencies.zrender+"+");if(!t)throw new Error("Initialize failed: invalid dom.");var r=new n(t,e,i);return r.id="ec_"+nt++,et[r.id]=r,t.setAttribute&&t.setAttribute(ut,r.id),f(r),r},ht.connect=function(t){if(S[Qe](t)){var e=t;t=null,S.each(e,function(e){null!=e.group&&(t=e.group)}),t=t||"g_"+ct++,S.each(e,function(e){e.group=t})}return it[t]=!0,t},ht.disConnect=function(t){it[t]=!1},ht[Q]=function(t){S.isDom(t)?t=ht.getInstanceByDom(t):typeof t===Bi&&(t=et[t]),t instanceof n&&!t.isDisposed()&&t[Q]()},ht.getInstanceByDom=function(t){var e=t.getAttribute(ut);return et[e]},ht.getInstanceById=function(t){return et[t]},ht.registerTheme=function(t,e){J[t]=e},ht.registerPreprocessor=function(t){Y.push(t)},ht[G]=function(t,e){if(S[Ei](L,t)<0)throw new Error("stage should be one of "+L);var i=X[t]||(X[t]=[]);i.push(e)},ht[F]=function(t,e,i){typeof e===Ii&&(i=e,e="");var n=S[Ze](t)?t.type:[t,t={event:e}][0];t.event=(t.event||n)[Ue](),e=t.event,R[n]||(R[n]={action:i,actionInfo:t}),B[e]=n},ht.registerCoordinateSystem=function(t,e){m[Te](t,e)},ht[V]=function(t){S[Ei](q,t)<0&&q.push(t)},ht[N]=function(t,e){if(S[Ei](D,t)<0)throw new Error("stage should be one of "+D);var i=$[t]||($[t]=[]);i.push(e)},ht.extendChartView=function(t){return b[Li](t)},ht[Z]=function(t){return y[Li](t)},ht.extendSeriesModel=function(t){return _[Li](t)},ht[E]=function(t){return x[Li](t)},ht.setCanvasCreator=function(t){S.createCanvas=t},ht[N]("echarts",S.curry(t("./visual/seriesColor"),"",j)),ht.registerPreprocessor(t("./preprocessor/backwardCompat")),ht[F]({type:"highlight",event:"highlight",update:"highlight"},S.noop),ht[F]({type:"downplay",event:"downplay",update:"downplay"},S.noop),ht.graphic=t("./util/graphic"),ht[Ri]=t("./util/number"),ht.format=t("./util/format"),ht.util={},T(["map","each",Hi,Ei,Di,"reduce",Hi,"bind","curry",Qe,Re,Ze,"isFunction",Li],function(t){ht.util[t]=S[t]}),ht}),e("echarts",["echarts/echarts"],function(t){return t}),e("echarts/data/DataDiffer",[ji],function(t){function e(t){return t}function i(t,i,n,r){this._old=t,this._new=i,this._oldKeyGetter=n||e,this._newKeyGetter=r||e}function n(t,e,i){for(var n=0;n<t[Fi];n++){var r=i(t[n]),a=e[r];null==a?e[r]=n:(a[Fi]||(e[r]=a=[a]),a.push(n))}}return i[qi]={constructor:i,add:function(t){return this._add=t,this},update:function(t){return this._update=t,this},remove:function(t){return this._remove=t,this},execute:function(){var t,e=this._old,i=this._new,r=this._oldKeyGetter,a=this._newKeyGetter,o={},s={};for(n(e,o,r),n(i,s,a),t=0;t<e[Fi];t++){var l=r(e[t]),c=s[l];if(null!=c){var u=c[Fi];u?(1===u&&(s[l]=null),c=c.unshift()):s[l]=null,this._update&&this._update(c,t)}else this._remove&&this._remove(t)}for(var l in s)if(s.hasOwnProperty(l)){var c=s[l];if(null==c)continue;if(c[Fi])for(var t=0,u=c[Fi];u>t;t++)this._add&&this._add(c[t]);else this._add&&this._add(c)}}},i}),e("echarts/data/List",[ji,"../model/Model","./DataDiffer",Wi,"../util/model"],function(t){function e(t){return c[Qe](t)||(t=[t]),t}var i=bi,n=typeof window===bi?global:window,r=typeof n.Float64Array===i?Array:n.Float64Array,a=typeof n.Int32Array===i?Array:n.Int32Array,o={"float":r,"int":a,ordinal:Array,number:Array,time:Array},s=t("../model/Model"),l=t("./DataDiffer"),c=t(Wi),u=t("../util/model"),h=c[Ze],d=["stackedOn","_nameList","_idList","_rawData"],f=function(t,e,i){c.each(d[Oi](i||[]),function(i){e.hasOwnProperty(i)&&(t[i]=e[i])})},p=function(t,e){t=t||["x","y"];for(var i={},n=[],r=0;r<t[Fi];r++){var a,o={};typeof t[r]===Bi?(a=t[r],o={name:a,stackable:!1,type:"number"}):(o=t[r],a=o.name,o.type=o.type||Ri),n.push(a),i[a]=o}this[B]=n,this._dimensionInfos=i,this[H]=e,this.indices=[],this._storage={},this._nameList=[],this._idList=[],this._optionModels=[],this.stackedOn=null,this._visual={},this._layout={},this._itemVisuals=[],this._itemLayouts=[],this._graphicEls=[],this._rawData},v=p[qi];v.type="list",v.getDimension=function(t){return isNaN(t)||(t=this[B][t]||t),t},v.getDimensionInfo=function(t){return this._dimensionInfos[this.getDimension(t)]},v.initData=function(t,e,i){t=t||[],this._rawData=t;var n=this._storage={},r=this.indices=[],a=this[B],s=t[Fi],l=this._dimensionInfos,h=[],d={};e=e||[];for(var f=0;f<a[Fi];f++){var p=l[a[f]],v=o[p.type];n[a[f]]=new v(s)}i=i||function(t,e,i,n){var r=u.getDataItemValue(t);return u.converDataValue(c[Qe](r)?r[n]:r,l[e])};for(var m=0;m<t[Fi];m++){for(var g=t[m],y=0;y<a[Fi];y++){var _=a[y],x=n[_];x[m]=i(g,_,m,y)}r.push(m)}for(var f=0;f<t[Fi];f++){var b="";e[f]||(e[f]=t[f].name,b=t[f].id);var w=e[f]||"";!b&&w&&(d[w]=d[w]||0,b=w,d[w]>0&&(b+="__ec__"+d[w]),d[w]++),b&&(h[f]=b)}this._nameList=e,this._idList=h},v.count=function(){return this.indices[Fi]},v.get=function(t,e,i){var n=this._storage,r=this.indices[e],a=n[t]&&n[t][r],o=this._dimensionInfos[t];if(i&&o&&o.stackable)for(var s=this.stackedOn;s;){var l=s.get(t,e);(a>=0&&l>0||0>=a&&0>l)&&(a+=l),s=s.stackedOn}return a},v.getValues=function(t,e,i){var n=[];c[Qe](t)||(i=e,e=t,t=this[B]);for(var r=0,a=t[Fi];a>r;r++)n.push(this.get(t[r],e,i));return n},v.hasValue=function(t){for(var e=this[B],i=this._dimensionInfos,n=0,r=e[Fi];r>n;n++)if(i[e[n]].type!==xe&&isNaN(this.get(e[n],t)))return!1;return!0},v[R]=function(t,e){var i=this._storage[t],n=this.getDimensionInfo(t);e=n&&n.stackable&&e;var r,a=(this._extent||(this._extent={}))[t+!!e];if(a)return a;if(i){for(var o=1/0,s=-(1/0),l=0,c=this.count();c>l;l++)r=this.get(t,l,e),o>r&&(o=r),r>s&&(s=r);return this._extent[t+e]=[o,s]}return[1/0,-(1/0)]},v.getSum=function(t,e){var i=this._storage[t],n=0;if(i)for(var r=0,a=this.count();a>r;r++){var o=this.get(t,r,e);isNaN(o)||(n+=o)}return n},v[Ei]=function(t,e){var i=this._storage,n=i[t],r=this.indices;if(n)for(var a=0,o=r[Fi];o>a;a++){var s=r[a];if(n[s]===e)return a}return-1},v[Vt]=function(t){for(var e=this.indices,i=this._nameList,n=0,r=e[Fi];r>n;n++){var a=e[n];if(i[a]===t)return n}return-1},v.indexOfNearest=function(t,e,i){c[Qe](t)||(t=t?[t]:[]);var n=this._storage,r=n[t];if(r){for(var a=Number.MAX_VALUE,o=-1,s=0,l=t[Fi];l>s;s++)for(var u=0,h=this.count();h>u;u++){var d=Math.abs(this.get(t[s],u,i)-e);a>=d&&(a=d,o=u)}return o}return-1},v[ye]=function(t){var e=this.indices[t];return null==e?-1:e},v[ge]=function(t){return this._nameList[this.indices[t]]||""},v.getId=function(t){return this._idList[this.indices[t]]||this[ye](t)+""},v.each=function(t,i,n,r){typeof t===Ii&&(r=n,n=i,i=t,t=[]),t=c.map(e(t),this.getDimension,this);var a=[],o=t[Fi],s=this.indices;r=r||this;for(var l=0;l<s[Fi];l++)if(0===o)i.call(r,l);else if(1===o)i.call(r,this.get(t[0],l,n),l);else{for(var u=0;o>u;u++)a[u]=this.get(t[u],l,n);a[u]=l,i.apply(r,a)}},v.filterSelf=function(t,i,n,r){typeof t===Ii&&(r=n,n=i,i=t,t=[]),t=c.map(e(t),this.getDimension,this);var a=[],o=[],s=t[Fi],l=this.indices;r=r||this;for(var u=0;u<l[Fi];u++){var h;if(1===s)h=i.call(r,this.get(t[0],u,n),u);else{for(var d=0;s>d;d++)o[d]=this.get(t[d],u,n);o[d]=u,h=i.apply(r,o)}h&&a.push(l[u])}return this.indices=a,this._extent={},this},v[O]=function(t,e,i,n){typeof t===Ii&&(n=i,i=e,e=t,t=[]);var r=[];return this.each(t,function(){r.push(e&&e.apply(this,arguments))},i,n),r},v.map=function(t,i,n,r){t=c.map(e(t),this.getDimension,this);var a=this[B],o=new p(c.map(a,this.getDimensionInfo,this),this[H]),s=o.indices=this.indices;f(o,this,this._wrappedMethods);for(var l=o._storage={},u=this._storage,h=0;h<a[Fi];h++){var d=a[h],v=u[d];c[Ei](t,d)>=0?l[d]=new v.constructor(u[d][Fi]):l[d]=u[d]}var m=[];return this.each(t,function(){var e=arguments[arguments[Fi]-1],n=i&&i.apply(this,arguments);if(null!=n){typeof n===Ri&&(m[0]=n,n=m);for(var r=0;r<n[Fi];r++){var a=t[r],o=l[a],c=s[e];o&&(o[c]=n[r])}}}),o};var m=new s(null);v[me]=function(t,e){var i,n=this[H];return t=this.indices[t],i=e?new s(null,n):m,i[ti]=this._rawData[t],i.parentModel=n,i[oi]=n[oi],i},v.diff=function(t){var e=this._idList,i=t&&t._idList;return new l(t?t.indices:[],this.indices,function(t){return i[t]||t+""},function(t){return e[t]||t+""})},v[I]=function(t){var e=this._visual;return e&&e[t]},v[$]=function(t,e){if(h(t))for(var i in t)t.hasOwnProperty(i)&&this[$](i,t[i]);else this._visual=this._visual||{},this._visual[t]=e},v.setLayout=function(t,e){this._layout[t]=e},v.getLayout=function(t){return this._layout[t]},v[z]=function(t){return this._itemLayouts[t]},v[P]=function(t,e,i){this._itemLayouts[t]=i?c[Li](this._itemLayouts[t]||{},e):e},v[L]=function(t,e,i){var n=this._itemVisuals[t],r=n&&n[e];return null!=r||i?r:this[I](e)},v[Y]=function(t,e,i){var n=this._itemVisuals[t]||{};if(this._itemVisuals[t]=n,h(e))for(var r in e)e.hasOwnProperty(r)&&(n[r]=e[r]);else n[e]=i};var g=function(t){t[we]=this[we],t[Gt]=this[Gt]};return v[D]=function(t,e){var i=this[H];e&&(e[Gt]=t,e[we]=i&&i[we],"group"===e.type&&e[Xt](g,e)),this._graphicEls[t]=e},v[Ft]=function(t){return this._graphicEls[t]},v[Nt]=function(t,e){c.each(this._graphicEls,function(i,n){i&&t&&t.call(e,i,n)})},v.cloneShallow=function(){var t=c.map(this[B],this.getDimensionInfo,this),e=new p(t,this[H]);return e._storage=this._storage,f(e,this,this._wrappedMethods),e.indices=this.indices.slice(),e},v.wrapMethod=function(t,e){var i=this[t];typeof i===Ii&&(this._wrappedMethods=this._wrappedMethods||[],this._wrappedMethods.push(t),this[t]=function(){var t=i.apply(this,arguments);return e.call(this,t)})},p}),e("echarts/data/helper/completeDimensions",[ji,Wi],function(t){function e(t,e,a){if(!e)return t;var o=n(e[0]),s=r[Qe](o)&&o[Fi]||1;a=a||[];for(var l=0;s>l;l++)if(!t[l]){var c=a[l]||"extra"+(l-a[Fi]);t[l]=i(e,l)?{type:"ordinal",name:c}:c}return t}function i(t,e){for(var i=0,a=t[Fi];a>i;i++){var o=n(t[i]);if(!r[Qe](o))return!1;var o=o[e];if(null!=o&&isFinite(o))return!1;if(r[Re](o)&&"-"!==o)return!0}return!1}function n(t){return r[Qe](t)?t:r[Ze](t)?t.value:t}var r=t(Wi);return e}),e("echarts/chart/helper/createListFromArray",[ji,"../../data/List","../../data/helper/completeDimensions",Wi,T],function(t){function e(t){for(var e=0;e<t[Fi]&&null==t[e];)e++;return t[e]}function i(t){var i=e(t);return null!=i&&!l[Qe](u(i))}function n(t,e,n){t=t||[];var r=d[e.get(A)](t,e,n),s=r[B],l=r.categoryAxisModel,c=s[0].type===xe?0:s[1].type===xe?1:-1,f=new o(s,e),p=a(r,t),v=l&&i(t)?function(t,e,i,n){return n===c?i:h(u(t),s[n])}:function(t,e,i,n){var r=u(t);return h(r&&r[n],s[n])};return f.initData(t,p,v),f}function r(t){return t!==C&&"time"!==t}function a(t,e){var i=[];if(t.categoryAxisModel){var n=t.categoryAxisModel.getCategories();if(n){var r=e[Fi];if(l[Qe](e[0])&&e[0][Fi]>1){i=[];for(var a=0;r>a;a++)i[a]=n[e[a][0]]}else i=n.slice(0)}}return i}var o=t("../../data/List"),s=t("../../data/helper/completeDimensions"),l=t(Wi),c=t(T),u=c.getDataItemValue,h=c.converDataValue,d={cartesian2d:function(t,e,i){var n=i[Ae]("xAxis",e.get("xAxisIndex")),a=i[Ae]("yAxis",e.get("yAxisIndex")),o=n.get("type"),l=a.get("type"),c=l===C,u=o===C,h=[{name:"x",type:u?xe:"float",stackable:r(o)},{name:"y",type:c?xe:"float",stackable:r(l)}];return s(h,t,["x","y","z"]),{dimensions:h,categoryAxisModel:u?n:c?a:null}},polar:function(t,e,i){var n=e.get("polarIndex")||0,a=function(t){return t.get("polarIndex")===n},o=i[Oe]({mainType:"angleAxis",filter:a})[0],l=i[Oe]({mainType:"radiusAxis",filter:a})[0],c=l.get("type")===C,u=o.get("type")===C,h=[{name:"radius",type:c?xe:"float",stackable:r(l.get("type"))},{name:"angle",type:u?xe:"float",stackable:r(o.get("type"))}];return s(h,t,[Ce,"angle","value"]),{dimensions:h,categoryAxisModel:u?o:c?l:null}},geo:function(t,e,i){return{dimensions:s([{name:"lng"},{name:"lat"}],t,["lng","lat","value"])}}};return n}),e("echarts/chart/line/LineSeries",[ji,"../helper/createListFromArray","../../model/Series"],function(t){var e=t("../helper/createListFromArray"),i=t("../../model/Series");return i[Li]({type:"series.line",dependencies:["grid","polar"],getInitialData:function(t,i){return e(t.data,this,i)},defaultOption:{zlevel:0,z:2,coordinateSystem:"cartesian2d",legendHoverLink:!0,hoverAnimation:!0,xAxisIndex:0,yAxisIndex:0,polarIndex:0,clipOverflow:!0,label:{normal:{position:"top"},emphasis:{position:"top"}},lineStyle:{normal:{width:2,type:"solid"}},symbol:"emptyCircle",symbolSize:4,showSymbol:!0,animationEasing:"linear"}})}),e("echarts/util/symbol",[ji,"./graphic",_i],function(t){var e=t("./graphic"),i=t(_i),n=e[Mt]({type:"triangle",shape:{cx:0,cy:0,width:0,height:0},buildPath:function(t,e){var i=e.cx,n=e.cy,r=e.width/2,a=e[gi]/2;t[It](i,n-a),t[zt](i+r,n+a),t[zt](i-r,n+a),t[Lt]()}}),r=e[Mt]({type:"diamond",shape:{cx:0,cy:0,width:0,height:0},buildPath:function(t,e){var i=e.cx,n=e.cy,r=e.width/2,a=e[gi]/2;t[It](i,n-a),t[zt](i+r,n),t[zt](i,n+a),t[zt](i-r,n),t[Lt]()}}),a=e[Mt]({type:"pin",shape:{x:0,y:0,width:0,height:0},buildPath:function(t,e){var i=e.x,n=e.y,r=e.width/5*3,a=Math.max(r,e[gi]),o=r/2,s=o*o/(a-o),l=n-a+o+s,c=Math.asin(s/o),u=Math.cos(c)*o,h=Math.sin(c),d=Math.cos(c);t.arc(i,l,o,Math.PI-c,2*Math.PI+c);var f=.6*o,p=.7*o;t[Pt](i+u-h*f,l+s+d*f,i,n-p,i,n),t[Pt](i,n-p,i-u+h*f,l+s+d*f,i-u,l+s),t[Lt]()}}),o=e[Mt]({type:"arrow",shape:{x:0,y:0,width:0,height:0},buildPath:function(t,e){var i=e[gi],n=e.width,r=e.x,a=e.y,o=n/3*2;t[It](r,a),t[zt](r+o,a+i),t[zt](r,a+i/4*3),t[zt](r-o,a+i),t[zt](r,a),t[Lt]()}}),s={line:e.Line,rect:e.Rect,roundRect:e.Rect,square:e.Rect,circle:e.Circle,diamond:r,pin:a,arrow:o,triangle:n},l={line:function(t,e,i,n,r){r.x1=t,r.y1=e+n/2,r.x2=t+i,r.y2=e+n/2},rect:function(t,e,i,n,r){r.x=t,r.y=e,r.width=i,r[gi]=n},roundRect:function(t,e,i,n,r){r.x=t,r.y=e,r.width=i,r[gi]=n,r.r=Math.min(i,n)/4},square:function(t,e,i,n,r){var a=Math.min(i,n);r.x=t,r.y=e,r.width=a,r[gi]=a},circle:function(t,e,i,n,r){r.cx=t+i/2,r.cy=e+n/2,r.r=Math.min(i,n)/2},diamond:function(t,e,i,n,r){r.cx=t+i/2,r.cy=e+n/2,r.width=i,r[gi]=n},pin:function(t,e,i,n,r){r.x=t+i/2,r.y=e+n/2,r.width=i,r[gi]=n},arrow:function(t,e,i,n,r){r.x=t+i/2,r.y=e+n/2,r.width=i,r[gi]=n},triangle:function(t,e,i,n,r){r.cx=t+i/2,r.cy=e+n/2,r.width=i,r[gi]=n}},c={};for(var u in s)c[u]=new s[u];var h=e[Mt]({type:"symbol",shape:{symbolType:"",x:0,y:0,width:0,height:0},beforeBrush:function(){var t=this.style,e=this.shape;"pin"===e.symbolType&&t[Zt]===ci&&(t[Zt]=["50%","40%"],t[Et]=ui,t[Bt]=hi)},buildPath:function(t,e){var i=e.symbolType,n=c[i];"none"!==e.symbolType&&(n||(i="rect",n=c[i]),l[i](e.x,e.y,e.width,e[gi],n.shape),n[Dt](t,n.shape))}}),d=function(t){if("image"!==this.type){var e=this.style,i=this.shape;i&&"line"===i.symbolType?e[Si]=t:this.__isEmptyBrush?(e[Si]=t,e.fill="#fff"):(e.fill&&(e.fill=t),e[Si]&&(e[Si]=t)),this.dirty()}},f={createSymbol:function(t,n,r,a,o,s){var l=0===t[Ei]("empty");l&&(t=t[si](5,1)[Ue]()+t[si](6));var c;return c=0===t[Ei]("image://")?new e.Image({style:{image:t.slice(8),x:n,y:r,width:a,height:o}}):0===t[Ei]("path://")?e.makePath(t.slice(7),{},new i(n,r,a,o)):new h({shape:{symbolType:t,x:n,y:r,width:a,height:o}}),c.__isEmptyBrush=l,c.setColor=d,c.setColor(s),c}};return f}),e("echarts/chart/helper/Symbol",[ji,Wi,k,S,M],function(t){function e(t){return r[Qe](t)||(t=[+t,+t]),t}function i(t,e){o.Group.call(this),this[w](t,e)}function n(t,e){this[ue].drift(t,e)}var r=t(Wi),a=t(k),o=t(S),s=t(M),l=i[qi];l._createSymbol=function(t,i,r){this[qt]();var s=i[H],l=i[L](r,"color"),c=a[b](t,-.5,-.5,1,1,l);c.attr({style:{strokeNoScale:!0},z2:100,scale:[0,0]}),c.drift=n;var u=e(i[L](r,x));o[pt](c,{scale:u},s),this._symbolType=t,this.add(c)},l.stopSymbolAnimation=function(t){this[He](0)[ne](t)},l.getScale=function(){return this[He](0).scale},l.highlight=function(){this[He](0)[Ht](Se)},l.downplay=function(){this[He](0)[Ht](Me)},l.setZ=function(t,e){var i=this[He](0);i[ot]=t,i.z=e},l.setDraggable=function(t){var e=this[He](0);e[ee]=t,e.cursor=t?"move":"pointer"},l[w]=function(t,i){var n=t[L](i,_)||y,r=t[H],a=e(t[L](i,x));if(n!==this._symbolType)this._createSymbol(n,t,i);else{var s=this[He](0);o[vt](s,{scale:a},r)}this._updateCommon(t,i,a),this._seriesModel=r};var c=[j,Me],u=[j,Se],h=["label",Me],d=["label",Se];return l._updateCommon=function(t,i,n){var a=this[He](0),l=t[H],f=t[me](i),p=f[ai](c),v=t[L](i,"color"),y=f[ai](u)[g]();a[de]=f[Ci]("symbolRotate")*Math.PI/180||0;var _=f[Ci]("symbolOffset");if(_){var b=a[We];b[0]=s[$e](_[0],n[0]),b[1]=s[$e](_[1],n[1])}a.setColor(v),r[Li](a.style,p[g](["color"]));var w=f[ai](h),M=f[ai](d),S=t[B][t[B][Fi]-1],k=l[m](i,Me)||t.get(S,i),C=a.style;w.get("show")?(o.setText(C,w,v),C.text=k):C.text="",M[Ci]("show")?(o.setText(y,M,v),y.text=k):y.text="";var A=e(t[L](i,x));if(a.off(yt).off(gt).off(Se).off(Me),o[_t](a,y),f[Ci]("hoverAnimation")){var T=function(){var t=A[1]/A[0];this.animateTo({scale:[Math.max(1.1*A[0],A[0]+3),Math.max(1.1*A[1],A[1]+3*t)]},400,"elasticOut")},D=function(){this.animateTo({scale:A},400,"elasticOut")};a.on(yt,T).on(gt,D).on(Se,T).on(Me,D)}},l.fadeOut=function(t){var e=this[He](0);e.style.text="",o[vt](e,{scale:[0,0]},this._seriesModel,t)},r[Di](i,o.Group),i}),e("echarts/chart/helper/SymbolDraw",[ji,S,"./Symbol"],function(t){function e(t){this.group=new n.Group,this._symbolCtor=t||r}function i(t,e,i){var n=t[z](e);return n&&!isNaN(n[0])&&!isNaN(n[1])&&!(i&&i(e))&&"none"!==t[L](e,_)}var n=t(S),r=t("./Symbol"),a=e[qi];return a[w]=function(t,e){var r=this.group,a=t[H],o=this._data,s=this._symbolCtor;t.diff(o).add(function(n){var a=t[z](n);if(i(t,n,e)){var o=new s(t,n);o.attr(We,a),t[D](n,o),r.add(o)}})[at](function(l,c){var u=o[Ft](c),h=t[z](l);return i(t,l,e)?(u?(u[w](t,l),n[vt](u,{position:h},a)):(u=new s(t,l),u.attr(We,h)),r.add(u),void t[D](l,u)):void r[Qt](u)})[Qt](function(t){var e=o[Ft](t);e&&e.fadeOut(function(){r[Qt](e)})})[v](),this._data=t},a[jt]=function(){var t=this._data;t&&t[Nt](function(e,i){e.attr(We,t[z](i))})},a[Qt]=function(t){var e=this.group,i=this._data;i&&(t?i[Nt](function(t){t.fadeOut(function(){e[Qt](t)})}):e[qt]())},e}),e("zrender/core/arrayDiff",[ji],function(t){function e(t,e){return t===e}function i(t,e,i){var n={cmd:t,idx:e};return"="===t&&(n.idx1=i),n}function n(t,e,n,r){t.push(i(e,n,r))}function r(t,e,i,n,r,a,o,l){var c,u,h,d=i>n,f=r>a,p=s(n-i),v=s(a-r);for(u=0;p>=u;u++)for(h=0;v>=h;h++)if(0===u)l[h]=h;else if(0===h)c=l[h],l[h]=u;else{var m=t[d?i-u:u-1+i],g=e[f?r-h:h-1+r],y=c+(o(m,g)?0:2),_=l[h]+1,x=l[h-1]+1;c=l[h],l[h]=_>y?y:_,x<l[h]&&(l[h]=x)}return l}function a(t,e,i,o,s,l,c,u,h){var d,f,p=[],v=o-i,m=l-s;if(v)if(m)if(1===v){var g=t[i],y=!1;for(f=0;m>f;f++)c(g,e[f+s])&&!y?(y=!0,n(p,"=",i,f+s)):n(p,"+",f+s);y||n(p,"-",i)}else if(1===m){var _=e[s],y=!1;for(d=0;v>d;d++)c(_,t[d+i])&&!y?(y=!0,n(p,"=",d+i,s)):n(p,"-",d+i);y||n(p,"+",s)}else{var x=(v/2|0)+i;r(t,e,i,x,s,l,c,u),r(t,e,o,x+1,l,s,c,h);var b,w=1/0,M=0;for(f=0;m>=f;f++)b=u[f]+h[m-f],w>b&&(w=b,M=f);M+=s,p=a(t,e,i,x,s,M,c,u,h);var S=a(t,e,x,o,M,l,c,u,h);for(d=0;d<S[Fi];d++)p.push(S[d])}else for(d=0;v>d;d++)n(p,"-",d+i);else for(f=0;m>f;f++)n(p,"+",f+s);return p}function o(t,i,r){r=r||e;var o,s,l=t[Fi],c=i[Fi],u=Math.min(l,c),h=[];for(o=0;u>o&&r(t[o],i[o]);o++)n(h,"=",o,o);for(s=0;u>s&&r(t[l-s-1],i[c-s-1]);s++);if(l-s>=o||c-s>=o){var d=a(t,i,o,l-s,o,c-s,r,[],[]);for(o=0;o<d[Fi];o++)h.push(d[o]);for(o=0;s>o;o++)n(h,"=",l-s+o,c-s+o)}return h}var s=Math.abs;return o}),e("echarts/chart/line/lineAnimationDiff",[ji,"zrender/core/arrayDiff"],function(t){function e(t){return t>=0?1:-1}function i(t,i,n){for(var r,a=t[p](),o=t[f](a),s=a.onZero?0:o.scale[d]()[0],l=o.dim,c="x"===l||l===Ce?1:0,u=i.stackedOn,v=i.get(l,n);u&&e(u.get(l,n))===e(v);){r=u;break}var m=[];return m[c]=i.get(a.dim,n),m[1-c]=r?r.get(l,n,!0):s,t[h](m)}var n=t("zrender/core/arrayDiff");return function(t,e,r,a,o,s){for(var l=e[O](e.getId),c=t[O](t.getId),u=[],d=[],f=[],p=[],v=[],m=[],g=[],y=n(c,l),_=s[B],x=0;x<y[Fi];x++){var b=y[x],w=!0;switch(b.cmd){case"=":var M=t[z](b.idx),S=e[z](b.idx1);(isNaN(M[0])||isNaN(M[1]))&&(M=S.slice()),u.push(M),d.push(S),f.push(r[b.idx]),p.push(a[b.idx1]),g.push(e[ye](b.idx1));break;case"+":var k=b.idx;u.push(o[h]([e.get(_[0],k,!0),e.get(_[1],k,!0)])),d.push(e[z](k).slice()),f.push(i(o,e,k)),p.push(a[k]),g.push(e[ye](k));break;case"-":var k=b.idx,C=t[ye](k);C!==k?(u.push(t[z](k)),d.push(s[h]([t.get(_[0],k,!0),t.get(_[1],k,!0)])),f.push(r[k]),p.push(i(s,t,k)),g.push(C)):w=!1}w&&(v.push(b),m.push(m[Fi]))}m.sort(function(t,e){return g[t]-g[e]});for(var A=[],T=[],D=[],L=[],P=[],x=0;x<m[Fi];x++){var k=m[x];A[x]=u[k],T[x]=d[k],D[x]=f[k],L[x]=p[k],P[x]=v[k]}return{current:A,next:T,stackedOnCurrent:D,stackedOnNext:L,status:P}}}),e("echarts/chart/line/poly",[ji,"zrender/graphic/Path",wi],function(t){function e(t,e,i,n,d,f,p,v,m){for(var g=i,y=0;d>y;y++){var _=e[g];if(g>=n||0>g||isNaN(_[0])||isNaN(_[1]))break;if(g===i)t[f>0?It:zt](_[0],_[1]),l(u,_);else if(m>0){var x=g-f,b=g+f;if(f>0&&g===n-1||0>=f&&0===g)l(h,_);else{var w=e[x],M=e[b];(isNaN(M[0])||isNaN(M[1]))&&(M=_),r.sub(c,M,w),s(h,_,c,-m/2)}a(u,u,v),o(u,u,p),a(h,h,v),o(h,h,p),t[Pt](u[0],u[1],h[0],h[1],_[0],_[1]),s(u,_,c,m/2)}else t[zt](_[0],_[1]);g+=f}return y}function i(t,e){var i=[1/0,1/0],n=[-(1/0),-(1/0)];if(e)for(var r=0;r<t[Fi];r++){var a=t[r];a[0]<i[0]&&(i[0]=a[0]),a[1]<i[1]&&(i[1]=a[1]),a[0]>n[0]&&(n[0]=a[0]),a[1]>n[1]&&(n[1]=a[1])}return{min:e?i:n,max:e?n:i}}var n=t("zrender/graphic/Path"),r=t(wi),a=(Math.min,Math.max,r.min),o=r.max,s=r.scaleAndAdd,l=r.copy,c=[],u=[],h=[];return{Polyline:n[Li]({type:"ec-polyline",shape:{points:[],smooth:0,smoothConstraint:!0},style:{fill:null,stroke:"#000"},buildPath:function(t,n){for(var r=n[Ct],a=0,o=r[Fi],s=i(r,n.smoothConstraint);o>a;)a+=e(t,r,a,o,o,1,s.min,s.max,n.smooth)+1}}),Polygon:n[Li]({type:"ec-polygon",shape:{points:[],stackedOnPoints:[],smooth:0,stackedOnSmooth:0,smoothConstraint:!0},buildPath:function(t,n){for(var r=n[Ct],a=n.stackedOnPoints,o=0,s=r[Fi],l=i(r,n.smoothConstraint),c=i(a,n.smoothConstraint);s>o;){var u=e(t,r,o,s,s,1,l.min,l.max,n.smooth);e(t,a,o+u-1,s,u,-1,c.min,c.max,n.stackedOnSmooth),o+=u+1,t[Lt]()}}})}}),e("echarts/chart/line/LineView",[ji,Wi,"../helper/SymbolDraw","../helper/Symbol","./lineAnimationDiff",S,"./poly","../../view/Chart"],function(t){function e(t,e){if(t[Fi]===e[Fi]){for(var i=0;i<t[Fi];i++){var n=t[i],r=e[i];if(n[0]!==r[0]||n[1]!==r[1])return}return!0}}function i(t){return typeof t===Ri?t:t?.3:0}function n(t){var e=t.getGlobalExtent();if(t.onBand){var i=t.getBandWidth()/2-1,n=e[1]>e[0]?1:-1;e[0]+=n*i,e[1]-=n*i}return e}function r(t){return t>=0?1:-1}function a(t,e){var i=t[p](),n=t[f](i),a=i.onZero?0:n.scale[d]()[0],o=n.dim,s="x"===o||o===Ce?1:0;return e[O]([o],function(n,l){for(var c,u=e.stackedOn;u&&r(u.get(o,l))===r(n);){c=u;break}var d=[];return d[s]=e.get(i.dim,l),d[1-s]=c?c.get(o,l,!0):a,t[h](d)},!0)}function o(t,e){return null!=e[Gt]?e[Gt]:null!=e.name?t[Vt](e.name):void 0}function s(t,e,i){var r=n(t[u]("x")),a=n(t[u]("y")),o=t[p]()[c](),s=r[0],l=a[0],h=r[1]-s,d=a[1]-l;i.get("clipOverflow")||(o?(l-=d,d*=3):(s-=h,h*=3));var f=new b.Rect({shape:{x:s,y:l,width:h,height:d}});return e&&(f.shape[o?"width":gi]=0,b[pt](f,{shape:{width:h,height:d}},i)),f}function v(t,e,i){var n=t.getAngleAxis(),r=t.getRadiusAxis(),a=r[d](),o=n[d](),s=Math.PI/180,l=new b[kt]({shape:{cx:t.cx,cy:t.cy,r0:a[0],r:a[1],startAngle:-o[0]*s,endAngle:-o[1]*s,clockwise:n.inverse}});return e&&(l.shape.endAngle=-o[0]*s,b[pt](l,{shape:{endAngle:-o[1]*s}},i)),l}function m(t,e,i){return"polar"===t.type?v(t,e,i):s(t,e,i)}var g=t(Wi),y=t("../helper/SymbolDraw"),_=t("../helper/Symbol"),x=t("./lineAnimationDiff"),b=t(S),M=t("./poly"),k=t("../../view/Chart");return k[Li]({type:"line",init:function(){var t=new b.Group,e=new y;this.group.add(e.group),this._symbolDraw=e,this._lineGroup=t},render:function(t,n,r){var o=t[A],s=this.group,c=t[be](),u=t[ai]("lineStyle.normal"),h=t[ai]("areaStyle.normal"),d=c[O](c[z],!0),f="polar"===o.type,p=this._coordSys,v=this._symbolDraw,y=this._polyline,_=this._polygon,x=this._lineGroup,b=t.get(re),M=!h.isEmpty(),S=a(o,c),k=t.get("showSymbol"),C=k&&!f&&!t.get("showAllSymbol")&&this._getSymbolIgnoreFunc(c,o),T=this._data;T&&T[Nt](function(t,e){t.__temp&&(s[Qt](t),T[D](e,null))}),k||v[Qt](),s.add(x),y&&p.type===o.type?(b&&x.setClipPath(m(o,!1,t)),k&&v[w](c,C),c[Nt](function(t){t[ne](!0)}),e(this._stackedOnPoints,S)&&e(this._points,d)||(b?this._updateAnimation(c,S,o,r):(y[At]({points:d}),_&&_[At]({points:d,stackedOnPoints:S})))):(k&&v[w](c,C),y=this._newPolyline(s,d,o,b),M&&(_=this._newPolygon(s,d,S,o,b)),x.setClipPath(m(o,!0,t))),y[bt](g[li](u[l](),{stroke:c[I]("color"),lineJoin:"bevel"}));var L=t.get("smooth");if(L=i(t.get("smooth")),y.shape.smooth=L,_){var P=_.shape,R=c.stackedOn,B=0;if(_.style[Mi]=.7,_[bt](g[li](h.getAreaStyle(),{fill:c[I]("color"),lineJoin:"bevel"})),P.smooth=L,R){var E=R[H];B=i(E.get("smooth"))}P.stackedOnSmooth=B}this._data=c,this._coordSys=o,this._stackedOnPoints=S,this._points=d},highlight:function(t,e,i,n){var r=t[be](),a=o(r,n);if(null!=a&&a>=0){var s=r[Ft](a);if(!s){var l=r[z](a);s=new _(r,a,i),s[We]=l,s.setZ(t.get(ot),t.get("z")),s[te]=isNaN(l[0])||isNaN(l[1]),s.__temp=!0,r[D](a,s),s.stopSymbolAnimation(!0),this.group.add(s)}s.highlight()}else k[qi].highlight.call(this,t,e,i,n)},downplay:function(t,e,i,n){var r=t[be](),a=o(r,n);if(null!=a&&a>=0){var s=r[Ft](a);s&&(s.__temp?(r[D](a,null),this.group[Qt](s)):s.downplay())}else k[qi].downplay.call(this,t,e,i,n)},_newPolyline:function(t,e){var i=this._polyline;return i&&t[Qt](i),i=new M[St]({shape:{points:e},silent:!0,z2:10}),this._lineGroup.add(i),this._polyline=i,i},_newPolygon:function(t,e,i){var n=this._polygon;return n&&t[Qt](n),n=new M.Polygon({shape:{points:e,stackedOnPoints:i},silent:!0}),this._lineGroup.add(n),this._polygon=n,n},_getSymbolIgnoreFunc:function(t,e){var i=e.getAxesByScale(xe)[0];return i&&i.isLabelIgnored?g.bind(i.isLabelIgnored,i):void 0},_updateAnimation:function(t,e,i,n){var r=this._polyline,a=this._polygon,o=t[H],s=x(this._data,t,this._stackedOnPoints,e,this._coordSys,i);r.shape[Ct]=s.current,b[vt](r,{shape:{points:s.next}},o),a&&(a[At]({points:s.current,stackedOnPoints:s.stackedOnCurrent}),b[vt](a,{shape:{points:s.next,stackedOnPoints:s.stackedOnNext}},o));for(var l=[],c=s.status,u=0;u<c[Fi];u++){var h=c[u].cmd;if("="===h){var d=t[Ft](c[u].idx1);d&&l.push({el:d,ptIdx:u})}}r.animators&&r.animators[Fi]&&r.animators[0].during(function(){for(var t=0;t<l[Fi];t++){var e=l[t].el;e.attr(We,r.shape[Ct][l[t].ptIdx])}})},remove:function(t){this._lineGroup[qt](),this._symbolDraw[Qt](!0),this._polyline=this._polygon=this._coordSys=this._points=this._stackedOnPoints=this._data=null}})}),e("echarts/visual/symbol",[ji],function(t){return function(t,e,i,n,r){n.eachRawSeriesByType(t,function(t){var r=t[be](),a=t.get(_)||e,o=t.get(x);r[$]({legendSymbol:i||a,
symbol:a,symbolSize:o}),n.isSeriesFiltered(t)||(typeof o===Ii&&r.each(function(e){var i=t[_e](e),n=t[ve](e);r[Y](e,x,o(i,n))}),r.each(function(t){var e=r[me](t),i=e.get(_,!0),n=e.get(x,!0);null!=i&&r[Y](t,_,i),null!=n&&r[Y](t,x,n)}))})}}),e("echarts/layout/points",[ji],function(t){return function(t,e,i){e[X](t,function(t){var e=t[be](),i=t[A],n=i[B];e.each(n,function(t,n,r){var a;a=isNaN(t)||isNaN(n)?[NaN,NaN]:i[h]([t,n]),e[P](r,a)},!0)})}}),e("echarts/chart/line",[ji,Wi,s,"./line/LineSeries","./line/LineView","../visual/symbol","../layout/points"],function(t){var e=t(Wi),i=t(s);t("./line/LineSeries"),t("./line/LineView"),i[N]("chart",e.curry(t("../visual/symbol"),"line",y,"line")),i[V](e.curry(t("../layout/points"),"line"))}),e("echarts/scale/Scale",[ji,ei],function(t){function e(){this._extent=[1/0,-(1/0)],this._interval=0,this.init&&this.init.apply(this,arguments)}var i=t(ei),n=e[qi];return n[Rt]=function(t){var e=this._extent;return t>=e[0]&&t<=e[1]},n.normalize=function(t){var e=this._extent;return e[1]===e[0]?.5:(t-e[0])/(e[1]-e[0])},n.scale=function(t){var e=this._extent;return t*(e[1]-e[0])+e[0]},n.unionExtent=function(t){var e=this._extent;t[0]<e[0]&&(e[0]=t[0]),t[1]>e[1]&&(e[1]=t[1])},n[d]=function(){return this._extent.slice()},n.setExtent=function(t,e){var i=this._extent;isNaN(t)||(i[0]=t),isNaN(e)||(i[1]=e)},n.getTicksLabels=function(){for(var t=[],e=this.getTicks(),i=0;i<e[Fi];i++)t.push(this[o](e[i]));return t},i[Pi](e),i[Ti](e,{registerWhenExtend:!0}),e}),e("echarts/scale/Ordinal",[ji,Wi,"./Scale"],function(t){var e=t(Wi),i=t("./Scale"),n=i[qi],r=i[Li]({type:"ordinal",init:function(t,e){this._data=t,this._extent=e||[0,t[Fi]-1]},contain:function(t){return n[Rt].call(this,t)&&null!=this._data[t]},normalize:function(t){return typeof t===Bi&&(t=e[Ei](this._data,t)),n.normalize.call(this,t)},scale:function(t){return Math.round(n.scale.call(this,t))},getTicks:function(){for(var t=[],e=this._extent,i=e[0];i<=e[1];)t.push(i),i++;return t},getLabel:function(t){return this._data[t]},count:function(){return this._extent[1]-this._extent[0]+1},niceTicks:e.noop,niceExtent:e.noop});return r[mi]=function(){return new r},r}),e("echarts/scale/Interval",[ji,"../util/number","../util/format","./Scale"],function(t){var e=t("../util/number"),i=t("../util/format"),n=t("./Scale"),r=Math.floor,a=Math.ceil,s=n[Li]({type:"interval",_interval:0,setExtent:function(t,e){var i=this._extent;isNaN(t)||(i[0]=parseFloat(t)),isNaN(e)||(i[1]=parseFloat(e))},unionExtent:function(t){var e=this._extent;t[0]<e[0]&&(e[0]=t[0]),t[1]>e[1]&&(e[1]=t[1]),s[qi].setExtent.call(this,e[0],e[1])},getInterval:function(){return this._interval||this.niceTicks(),this._interval},setInterval:function(t){this._interval=t,this._niceExtent=this._extent.slice()},getTicks:function(){this._interval||this.niceTicks();var t=this._interval,i=this._extent,n=[],r=1e4;if(t){var a=this._niceExtent;i[0]<a[0]&&n.push(i[0]);for(var o=a[0];o<=a[1];)if(n.push(o),o=e.round(o+t),n[Fi]>r)return[];i[1]>a[1]&&n.push(i[1])}return n},getTicksLabels:function(){for(var t=[],e=this.getTicks(),i=0;i<e[Fi];i++)t.push(this[o](e[i]));return t},getLabel:function(t){return i[pe](t)},niceTicks:function(t){t=t||10;var i=this._extent,n=i[1]-i[0];if(!(n===1/0||0>=n)){var o=Math.pow(10,Math.floor(Math.log(n/t)/Math.LN10)),s=t/n*o;.15>=s?o*=10:.3>=s?o*=5:.45>=s?o*=3:.75>=s&&(o*=2);var l=[e.round(a(i[0]/o)*o),e.round(r(i[1]/o)*o)];this._interval=o,this._niceExtent=l}},niceExtent:function(t,i,n){var o=this._extent;if(o[0]===o[1])if(0!==o[0]){var s=o[0]/2;o[0]-=s,o[1]+=s}else o[1]=1;o[1]===-(1/0)&&o[0]===1/0&&(o[0]=0,o[1]=1),this.niceTicks(t,i,n);var l=this._interval;i||(o[0]=e.round(r(o[0]/l)*l)),n||(o[1]=e.round(a(o[1]/l)*l))}});return s[mi]=function(){return new s},s}),e("echarts/scale/Time",[ji,Wi,"../util/number","../util/format","./Interval"],function(t){var e=t(Wi),i=t("../util/number"),n=t("../util/format"),r=t("./Interval"),a=r[qi],o=Math.ceil,s=Math.floor,l=864e5,c=function(t,e,i,n){for(;n>i;){var r=i+n>>>1;t[r][2]<e?i=r+1:n=r}return i},u=r[Li]({type:"time",getLabel:function(t){var e=this._stepLvl,i=new Date(t);return n.formatTime(e[0],i)},niceExtent:function(t,e,n){var r=this._extent;if(r[0]===r[1]&&(r[0]-=l,r[1]+=l),r[1]===-(1/0)&&r[0]===1/0){var a=new Date;r[1]=new Date(a.getFullYear(),a.getMonth(),a.getDate()),r[0]=r[1]-l}this.niceTicks(t,e,n);var c=this._interval;e||(r[0]=i.round(s(r[0]/c)*c)),n||(r[1]=i.round(o(r[1]/c)*c))},niceTicks:function(t){t=t||10;var e=this._extent,i=e[1]-e[0],n=i/t,r=h[Fi],a=c(h,n,0,r),l=h[Math.min(a,r-1)],u=l[2],d=[o(e[0]/u)*u,s(e[1]/u)*u];this._stepLvl=l,this._interval=u,this._niceExtent=d}});e.each([Rt,"normalize"],function(t){u[qi][t]=function(e){return e=+i.parseDate(e),a[t].call(this,e)}});var h=[["hh:mm:ss",1,1e3],["hh:mm:ss",5,5e3],["hh:mm:ss",10,1e4],["hh:mm:ss",15,15e3],["hh:mm:ss",30,3e4],["hh:mm\nMM-dd",1,6e4],["hh:mm\nMM-dd",5,3e5],["hh:mm\nMM-dd",10,6e5],["hh:mm\nMM-dd",15,9e5],["hh:mm\nMM-dd",30,18e5],["hh:mm\nMM-dd",1,36e5],["hh:mm\nMM-dd",2,72e5],["hh:mm\nMM-dd",6,216e5],["hh:mm\nMM-dd",12,432e5],["MM-dd\nyyyy",1,l],["week",7,7*l],["month",1,31*l],["quarter",3,380*l/4],["half-year",6,380*l/2],["year",1,380*l]];return u[mi]=function(){return new u},u}),e("echarts/scale/Log",[ji,Wi,"./Scale","../util/number","./Interval"],function(t){var e=t(Wi),i=t("./Scale"),n=t("../util/number"),r=t("./Interval"),a=i[qi],s=r[qi],l=Math.floor,c=Math.ceil,u=Math.pow,h=10,f=Math.log,p=i[Li]({type:"log",getTicks:function(){return e.map(s.getTicks.call(this),function(t){return n.round(u(h,t))})},getLabel:s[o],scale:function(t){return t=a.scale.call(this,t),u(h,t)},setExtent:function(t,e){t=f(t)/f(h),e=f(e)/f(h),s.setExtent.call(this,t,e)},getExtent:function(){var t=a[d].call(this);return t[0]=u(h,t[0]),t[1]=u(h,t[1]),t},unionExtent:function(t){t[0]=f(t[0])/f(h),t[1]=f(t[1])/f(h),a.unionExtent.call(this,t)},niceTicks:function(t){t=t||10;var e=this._extent,i=e[1]-e[0];if(!(i===1/0||0>=i)){var r=u(10,l(f(i/t)/Math.LN10)),a=t/i*r;.5>=a&&(r*=10);var o=[n.round(c(e[0]/r)*r),n.round(l(e[1]/r)*r)];this._interval=r,this._niceExtent=o}},niceExtent:s.niceExtent});return e.each([Rt,"normalize"],function(t){p[qi][t]=function(e){return e=f(e)/f(h),a[t].call(this,e)}}),p[mi]=function(){return new p},p}),e("echarts/coord/axisHelper",[ji,"../scale/Ordinal","../scale/Interval","../scale/Time","../scale/Log","../scale/Scale","../util/number",Wi,vi],function(t){var e=t("../scale/Ordinal"),i=t("../scale/Interval");t("../scale/Time"),t("../scale/Log");var n=t("../scale/Scale"),r=t("../util/number"),a=t(Wi),s=t(vi),l={};return l.niceScaleExtent=function(t,e){var i=t.scale;if(i.type!==xe){var n=e.get("min"),o=e.get("max"),s=e.get("boundaryGap");a[Qe](s)||(s=[s||0,s||0]),s[0]=r[$e](s[0],1),s[1]=r[$e](s[1],1);var l=i[d](),c=l[1]-l[0],u=!0,h=!0;null==n&&(n=l[0]-s[0]*c,u=!1),null==o&&(o=l[1]+s[1]*c,h=!1),"dataMin"===n&&(n=l[0]),"dataMax"===o&&(o=l[1]),i.setExtent(n,o),i.niceExtent(e.get("splitNumber"),u,h);var f=e.get("interval");null!=f&&i.setInterval&&i.setInterval(f)}},l.createScaleByModel=function(t,r){if(r=r||t.get("type"))switch(r){case C:return new e(t.getCategories(),[1/0,-(1/0)]);case"value":return new i;default:return(n[Ai](r)||i)[mi](t)}},l.ifAxisCrossZero=function(t){var e=t.scale[d](),i=e[0],n=e[1],r=t.model.get("min"),a=t.model.get("max");return isNaN(r)||(i=Math.min(r,i)),isNaN(a)||(n=Math.max(a,n)),!(i>0&&n>0||0>i&&0>n)||l.ifAxisNeedsCrossZero(t)},l.ifAxisNeedsCrossZero=function(t){return!t.model.get("scale")},l.getAxisLabelInterval=function(t,e,i,n){for(var r,a=0,o=0,l=0;l<t[Fi];l++){var c=t[l],u=s[ni](e[l],i,ui,"top");u[n?"x":"y"]+=c,u[n?"width":gi]*=1.5,r?r[nt](u)?(o++,a=Math.max(a,o)):(r.union(u),o=0):r=u.clone()}return a},l.getFormattedLabels=function(t,e){var i=t.scale,n=i.getTicksLabels(),r=i.getTicks();return typeof e===Bi?(e=function(t){return function(e){return t[Je]("{value}",e)}}(e),a.map(n,e)):typeof e===Ii?a.map(r,function(n,r){return e(t.type===C?i[o](n):n,r)},this):n},l}),e("echarts/coord/cartesian/Cartesian",[ji,Wi],function(t){function e(t){return this._axes[t]}var i=t(Wi),n=function(t){this._axes={},this._dimList=[],this.name=t||""};return n[qi]={constructor:n,type:"cartesian",getAxis:function(t){return this._axes[t]},getAxes:function(){return i.map(this._dimList,e,this)},getAxesByScale:function(t){return t=t[Ue](),i[Hi](this.getAxes(),function(e){return e.scale.type===t})},addAxis:function(t){var e=t.dim;this._axes[e]=t,this._dimList.push(e)},dataToCoord:function(t){return this._dataCoordConvert(t,a)},coordToData:function(t){return this._dataCoordConvert(t,"coordToData")},_dataCoordConvert:function(t,e){for(var i=this._dimList,n=t instanceof Array?[]:{},r=0;r<i[Fi];r++){var a=i[r],o=this._axes[a];n[a]=o[e](t[a])}return n}},n}),e("echarts/coord/cartesian/Cartesian2D",[ji,Wi,"./Cartesian"],function(t){function e(t){n.call(this,t),this[B]=["x","y"]}var i=t(Wi),n=t("./Cartesian");return e[qi]={constructor:e,type:"cartesian2d",getBaseAxis:function(){return this.getAxesByScale(xe)[0]||this.getAxesByScale("time")[0]||this[u]("x")},containPoint:function(t){var e=this[u]("x"),i=this[u]("y");return e[Rt](e.toLocalCoord(t[0]))&&i[Rt](i.toLocalCoord(t[1]))},containData:function(t){return this[u]("x").containData(t[0])&&this[u]("y").containData(t[1])},dataToPoints:function(t,e){return t[O](["x","y"],function(t,e){return this[h]([t,e])},e,this)},dataToPoint:function(t,e){var i=this[u]("x"),n=this[u]("y");return[i.toGlobalCoord(i[a](t[0],e)),n.toGlobalCoord(n[a](t[1],e))]},pointToData:function(t,e){var i=this[u]("x"),n=this[u]("y");return[i.coordToData(i.toLocalCoord(t[0]),e),n.coordToData(n.toLocalCoord(t[1]),e)]},getOtherAxis:function(t){return this[u]("x"===t.dim?"y":"x")}},i[Di](e,n),e}),e("echarts/coord/Axis",[ji,"../util/number",Wi],function(t){function e(t,e){var i=t[1]-t[0],n=e,r=i/n/2;t[0]+=r,t[1]-=r}var i=t("../util/number"),n=i[Ke],r=t(Wi),o=function(t,e,i){this.dim=t,this.scale=e,this._extent=i||[0,0],this.inverse=!1,this.onBand=!1};return o[qi]={constructor:o,contain:function(t){var e=this._extent,i=Math.min(e[0],e[1]),n=Math.max(e[0],e[1]);return t>=i&&n>=t},containData:function(t){return this[Rt](this[a](t))},getExtent:function(){var t=this._extent.slice();return t},getPixelPrecision:function(t){return i[Xe](t||this.scale[d](),this._extent)},setExtent:function(t,e){var i=this._extent;i[0]=t,i[1]=e},dataToCoord:function(t,i){t=this.scale.normalize(t);var r=this[d](),a=this.scale;return this.onBand&&a.type===xe&&e(r,a.count()),n(t,[0,1],r,i)},coordToData:function(t,i){var r=this[d]();this.onBand&&e(r,this.scale.count());var a=n(t,r,[0,1],i);return this.scale.scale(a)},getTicksCoords:function(){if(this.onBand){for(var t=this.getBands(),e=[],i=0;i<t[Fi];i++)e.push(t[i][0]);return t[i-1]&&e.push(t[i-1][1]),e}return r.map(this.scale.getTicks(),this[a],this)},getLabelsCoords:function(){if(this.onBand){for(var t,e=this.getBands(),i=[],n=0;n<e[Fi];n++)t=e[n],i.push((t[0]+t[1])/2);return i}return r.map(this.scale.getTicks(),this[a],this)},getBands:function(){for(var t=this[d](),e=[],i=this.scale.count(),n=t[0],r=t[1],a=r-n,o=0;i>o;o++)e.push([a*o/i+n,a*(o+1)/i+n]);return e},getBandWidth:function(){var t=this._extent,e=this.scale[d](),i=e[1]-e[0]+(this.onBand?1:0),n=Math.abs(t[1]-t[0]);return Math.abs(n)/i}},o}),e("echarts/coord/cartesian/axisLabelInterval",[ji,Wi,"../axisHelper"],function(t){var e=t(Wi),i=t("../axisHelper");return function(t){var n=t.model,r=n[ai]("axisLabel"),o=r.get("interval");return t.type!==C||"auto"!==o?"auto"===o?0:o:i.getAxisLabelInterval(e.map(t.scale.getTicks(),t[a],t),n.getFormattedLabels(),r[ai](ri)[ii](),t[c]())}}),e("echarts/coord/cartesian/Axis2D",[ji,Wi,"../Axis","./axisLabelInterval"],function(t){var e=t(Wi),i=t("../Axis"),n=t("./axisLabelInterval"),r=function(t,e,n,r,a){i.call(this,t,e,n),this.type=r||"value",this[We]=a||di};return r[qi]={constructor:r,index:0,onZero:!1,model:null,isHorizontal:function(){var t=this[We];return"top"===t||t===di},getGlobalExtent:function(){var t=this[d]();return t[0]=this.toGlobalCoord(t[0]),t[1]=this.toGlobalCoord(t[1]),t},getLabelInterval:function(){var t=this._labelInterval;return t||(t=this._labelInterval=n(this)),t},isLabelIgnored:function(t){if(this.type===C){var e=this.getLabelInterval();return typeof e===Ii&&!e(t,this.scale[o](t))||t%(e+1)}},toLocalCoord:null,toGlobalCoord:null},e[Di](r,i),r}),e("echarts/coord/axisDefault",[ji,Wi],function(t){var e=t(Wi),i={show:!0,zlevel:0,z:0,inverse:!1,name:"",nameLocation:"end",nameTextStyle:{},nameGap:15,axisLine:{show:!0,onZero:!0,lineStyle:{color:"#333",width:1,type:"solid"}},axisTick:{show:!0,inside:!1,length:5,lineStyle:{color:"#333",width:1}},axisLabel:{show:!0,inside:!1,rotate:0,margin:8,textStyle:{color:"#333",fontSize:12}},splitLine:{show:!0,lineStyle:{color:["#ccc"],width:1,type:"solid"}},splitArea:{show:!1,areaStyle:{color:["rgba(250,250,250,0.3)","rgba(200,200,200,0.3)"]}}},n=e.merge({boundaryGap:!0,axisTick:{interval:"auto"},axisLabel:{interval:"auto"}},i),r=e[li]({boundaryGap:[0,0],splitNumber:5},i),a=e[li]({scale:!0,min:"dataMin",max:"dataMax"},r),o=e[li]({},r);return o.scale=!0,{categoryAxis:n,valueAxis:r,timeAxis:a,logAxis:o}}),e("echarts/coord/axisModelCreator",[ji,"./axisDefault",Wi,"../model/Component","../util/layout"],function(t){var e=t("./axisDefault"),i=t(Wi),n=t("../model/Component"),r=t("../util/layout"),a=["value",C,"time","log"];return function(t,o,s,l){i.each(a,function(n){o[Li]({type:t+"Axis."+n,mergeDefaultAndTheme:function(e,a){var o=this.layoutMode,l=o?r.getLayoutParams(e):{},c=a.getTheme();i.merge(e,c.get(n+"Axis")),i.merge(e,this.getDefaultOption()),e.type=s(t,e),o&&r.mergeLayoutParam(e,l,o)},defaultOption:i.mergeAll([{},e[n+"Axis"],l],!0)})}),n.registerSubTypeDefaulter(t+"Axis",i.curry(s,t))}}),e("echarts/coord/axisModelCommonMixin",[ji,Wi,"./axisHelper"],function(t){function e(t){return r[Ze](t)&&null!=t.value?t.value:t}function i(){return this.get("type")===C&&r.map(this.get("data"),e)}function n(){return a.getFormattedLabels(this.axis,this.get("axisLabel.formatter"))}var r=t(Wi),a=t("./axisHelper");return{getFormattedLabels:n,getCategories:i}}),e("echarts/coord/cartesian/AxisModel",[ji,"../../model/Component",Wi,"../axisModelCreator","../axisModelCommonMixin"],function(t){function e(t,e){return e.type||(e.data?C:"value")}var i=t("../../model/Component"),n=t(Wi),r=t("../axisModelCreator"),a=i[Li]({type:"cartesian2dAxis",axis:null,setNeedsCrossZero:function(t){this[ti].scale=!t},setMin:function(t){this[ti].min=t},setMax:function(t){this[ti].max=t}});n.merge(a[qi],t("../axisModelCommonMixin"));var o={gridIndex:0};return r("x",a,e,o),r("y",a,e,o),a}),e("echarts/coord/cartesian/GridModel",[ji,"./AxisModel","../../model/Component"],function(t){t("./AxisModel");var e=t("../../model/Component");return e[Li]({type:"grid",dependencies:["xAxis","yAxis"],layoutMode:"box",coordinateSystem:null,defaultOption:{show:!1,zlevel:0,z:0,left:"10%",top:60,right:"10%",bottom:60,containLabel:!1,backgroundColor:"rgba(0,0,0,0)",borderWidth:1,borderColor:"#ccc"}})}),e("echarts/coord/cartesian/Grid",[ji,"exports","module","../../util/layout","../../coord/axisHelper",Wi,"./Cartesian2D","./Axis2D","./GridModel","../../CoordinateSystem"],function(t,e){function i(t,e,i){return i[Ae]("grid",t.get("gridIndex"))===e}function n(t){for(var e,i=t.model,n=i.getFormattedLabels(),r=0;r<n[Fi];r++)if(!t.isLabelIgnored(r)){var a=i.getTextRect(n[r]);e?e.union(a):e=a}return e}function a(t,e,i){this._coordsMap={},this._coordsList=[],this._axesMap={},this._axesList=[],this._initCartesian(t,e,i)}function o(t,e){var i=t[d](),n=i[0]+i[1];t.toGlobalCoord="x"===t.dim?function(t){return t+e}:function(t){return n-t+e},t.toLocalCoord="x"===t.dim?function(t){return t-e}:function(t){return n-t+e}}var s=t("../../util/layout"),l=t("../../coord/axisHelper"),h=t(Wi),f=t("./Cartesian2D"),p=t("./Axis2D"),v=h.each,m=l.ifAxisCrossZero,g=l.ifAxisNeedsCrossZero,y=l.niceScaleExtent;t("./GridModel");var _=a[qi];return _.type="grid",_[r]=function(){return this._rect},_[rt]=function(t,e){function i(){v(a,function(t){var e=t[c](),i=e?[0,r.width]:[0,r[gi]],n=t.inverse?1:0;t.setExtent(i[n],i[1-n]),o(t,e?r.x:r.y)})}var r=s[Ve](t.getBoxLayoutParams(),{width:e[Pe](),height:e[Le]()});this._rect=r;var a=this._axesList;i(),t.get("containLabel")&&(v(a,function(t){if(!t.model.get("axisLabel.inside")){var e=n(t);if(e){var i=t[c]()?gi:"width",a=t.model.get("axisLabel.margin");r[i]-=e[i]+a,"top"===t[We]?r.y+=e[gi]+a:"left"===t[We]&&(r.x+=e.width+a)}}}),i())},_[u]=function(t,e){if(null!=e){var i=t+e;return this._axesMap[i]}for(var n=this._axesList,r=0;r<n[Fi];r++)if(n[r].dim===t)return n[r]},_.getCartesian=function(t,e){var i="x"+t+"y"+e;return this._coordsMap[i]},_._initCartesian=function(t,e,n){function r(t){var e=s[t];return e[0]&&(e[0].type===C||!m(e[0]))||e[1]&&(e[1].type===C||!m(e[1]))}function a(n){return function(r,a){if(i(r,t,e)){var u=r.get(We);"x"===n?("top"!==u&&u!==di&&(u=di),o[u]&&(u="top"===u?di:"top")):("left"!==u&&"right"!==u&&(u="left"),o[u]&&(u="left"===u?"right":"left")),o[u]=!0;var h=new p(n,l.createScaleByModel(r),[0,0],r.get("type"),u),d=h.type===C;h.onBand=d&&r.get("boundaryGap"),h.inverse=r.get("inverse"),h.onZero=r.get("axisLine.onZero"),r.axis=h,h.model=r,h.index=a,this._axesList.push(h),this._axesMap[n+a]=h,s[n][a]=h,c[n]++}}}var o={left:!1,right:!1,top:!1,bottom:!1},s={x:{},y:{}},c={x:0,y:0};return e[W]("xAxis",a("x"),this),e[W]("yAxis",a("y"),this),c.x&&c.y?(v(s.x,function(t,e){v(s.y,function(i,n){var r="x"+e+"y"+n,a=new f(r);a.grid=this,this._coordsMap[r]=a,this._coordsList.push(a),a.addAxis(t),a.addAxis(i)},this)},this),this._updateCartesianFromSeries(e,t),v(s.x,function(t){r("y")&&(t.onZero=!1),g(t)&&t.scale.unionExtent([0,0]),y(t,t.model)},this),void v(s.y,function(t){r("x")&&(t.onZero=!1),g(t)&&t.scale.unionExtent([0,0]),y(t,t.model)},this)):(this._axesMap={},void(this._axesList=[]))},_._updateCartesianFromSeries=function(t,e){function n(t,e,i,n){v(n.getDimensionsOnAxis(i),function(i){e.scale.unionExtent(t[R](i,e.scale.type!==xe))})}t[U](function(r){if("cartesian2d"===r.get(A)){var a=r.get("xAxisIndex"),o=r.get("yAxisIndex"),s=t[Ae]("xAxis",a),l=t[Ae]("yAxis",o);if(!i(s,e,t)||!i(l,e,t))return;var c=this.getCartesian(a,o),h=r[be]();"list"===h.type&&(n(h,c[u]("x"),"x",r),n(h,c[u]("y"),"y",r))}},this)},a[mi]=function(t,e){var i=[];return t[W]("grid",function(n,r){var o=new a(n,t,e);o.name="grid_"+r,o[rt](n,e),n[A]=o,i.push(o)}),t[U](function(e){if("cartesian2d"===e.get(A)){var n=e.get("xAxisIndex"),r=t[Ae]("xAxis",n),a=i[r.get("gridIndex")];e[A]=a.getCartesian(n,e.get("yAxisIndex"))}}),i},t("../../CoordinateSystem")[Te]("grid",a),a}),e("echarts/chart/bar/BarSeries",[ji,"../../model/Series","../helper/createListFromArray"],function(t){var e=t("../../model/Series"),i=t("../helper/createListFromArray");return e[Li]({type:"series.bar",dependencies:["grid","polar"],getInitialData:function(t,e){return i(t.data,this,e)},defaultOption:{zlevel:0,z:2,coordinateSystem:"cartesian2d",legendHoverLink:!0,xAxisIndex:0,yAxisIndex:0,barMinHeight:0,barGap:"30%",barCategoryGap:"20%",itemStyle:{normal:{barBorderColor:"#fff",barBorderWidth:0},emphasis:{barBorderColor:"#fff",barBorderWidth:0}}}})}),e("echarts/chart/bar/barItemStyle",[ji,"../../model/mixin/makeStyleMapper"],function(t){return{getBarItemStyle:t("../../model/mixin/makeStyleMapper")([["fill","color"],[Si,"barBorderColor"],[ki,"barBorderWidth"],[Mi],["shadowBlur"],["shadowOffsetX"],["shadowOffsetY"],["shadowColor"]])}}),e("echarts/chart/bar/BarView",[ji,Wi,S,"../../model/Model","./barItemStyle",n],function(t){function e(t,e){var i=t.width>0?1:-1,n=t[gi]>0?1:-1;e=Math.min(e,Math.abs(t.width),Math.abs(t[gi])),t.x+=i*e/2,t.y+=n*e/2,t.width-=i*e,t[gi]-=n*e}var i=t(Wi),r=t(S);return i[Li](t("../../model/Model")[qi],t("./barItemStyle")),t(n).extendChartView({type:"bar",render:function(t,e,i){var n=t.get(A);return"cartesian2d"===n&&this._renderOnCartesian(t,e,i),this.group},_renderOnCartesian:function(t,n,a){function o(n,a){var o=l[z](n),s=l[me](n).get(g)||0;e(o,s);var c=new r.Rect({shape:i[Li]({},o)});if(m){var u=c.shape,h=f?gi:"width",d={};u[h]=0,d[h]=o[h],r[a?vt:pt](c,{shape:d},t)}return c}var s=this.group,l=t[be](),u=this._data,h=t[A],d=h[p](),f=d[c](),m=t.get(re),g=[j,Me,"barBorderWidth"];l.diff(u).add(function(t){if(l.hasValue(t)){var e=o(t);l[D](t,e),s.add(e)}})[at](function(i,n){var a=u[Ft](n);if(!l.hasValue(i))return void s[Qt](a);a||(a=o(i,!0));var c=l[z](i),h=l[me](i).get(g)||0;e(c,h),r[vt](a,{shape:c},t),l[D](i,a),s.add(a)})[Qt](function(e){var i=u[Ft](e);i&&(i.style.text="",r[vt](i,{shape:{width:0}},t,function(){s[Qt](i)}))})[v](),this._updateStyle(t,l,f),this._data=l},_updateStyle:function(t,e,n){function a(t,e,i,n,a){r.setText(t,e,i),t.text=n,"outside"===t[Zt]&&(t[Zt]=a)}e[Nt](function(o,s){var l=e[me](s),c=l[ai]("label.normal"),u=e[L](s,"color"),h=e[z](s),d=l[ai]("itemStyle.emphasis")[g]();o[bt](i[li]({fill:u},l[ai]("itemStyle.normal").getBarItemStyle()));var f=n?h[gi]>0?di:"top":h.width>0?"left":"right",c=l[ai]("label.normal"),p=l[ai]("label.emphasis"),v=o.style;c.get("show")?a(v,c,u,t[m](s,Me)||t[_e](s),f):v.text="",p.get("show")?a(d,p,u,t[m](s,Se)||t[_e](s),f):d.text="",r[_t](o,d)})},remove:function(t,e){var i=this.group;t.get(re)?this._data&&this._data[Nt](function(e){e.style.text="",r[vt](e,{shape:{width:0}},t,function(){i[Qt](e)})}):i[qt]()}})}),e("echarts/layout/barGrid",[ji,Wi,"../util/number"],function(t){function e(t){return t.get("stack")||"__ec_stack_"+t[we]}function i(t,i){var n={};r.each(t,function(t,i){var r=t[A],a=r[p](),o=n[a.index]||{remainedWidth:a.getBandWidth(),autoWidthCount:0,categoryGap:"20%",gap:"30%",axis:a,stacks:{}},s=o.stacks;n[a.index]=o;var l=e(t);s[l]||o.autoWidthCount++,s[l]=s[l]||{width:0,maxWidth:0};var c=t.get("barWidth"),u=t.get("barMaxWidth"),h=t.get("barGap"),d=t.get("barCategoryGap");c&&!s[l].width&&(c=Math.min(o.remainedWidth,c),s[l].width=c,o.remainedWidth-=c),u&&(s[l].maxWidth=u),null!=h&&(o.gap=h),null!=d&&(o.categoryGap=d)});var a={};return r.each(n,function(t,e){a[e]={};var i=t.stacks,n=t.axis,o=n.getBandWidth(),l=s(t.categoryGap,o),c=s(t.gap,1),u=t.remainedWidth,h=t.autoWidthCount,d=(u-l)/(h+(h-1)*c);d=Math.max(d,0),r.each(i,function(t,e){var i=t.maxWidth;!t.width&&i&&d>i&&(i=Math.min(i,u),u-=i,t.width=i,h--)}),d=(u-l)/(h+(h-1)*c),d=Math.max(d,0);var f,p=0;r.each(i,function(t,e){t.width||(t.width=d),f=t,p+=t.width*(1+c)}),f&&(p-=f.width*c);var v=-p/2;r.each(i,function(t,i){a[e][i]=a[e][i]||{offset:v,width:t.width},v+=t.width*(1+c)})}),a}function n(t,n,o){var s=i(r[Hi](n.getSeriesByType(t),function(t){return!n.isSeriesFiltered(t)&&t[A]&&"cartesian2d"===t[A].type})),l={};n[X](t,function(t){var i=t[be](),n=t[A],r=n[p](),o=e(t),u=s[r.index][o],h=u.offset,d=u.width,v=n[f](r),m=t.get("barMinHeight")||0,g=r.onZero?v.toGlobalCoord(v[a](0)):v.getGlobalExtent()[0],y=n.dataToPoints(i,!0);l[o]=l[o]||[],i.each(v.dim,function(t,e){if(!isNaN(t)){l[o][e]||(l[o][e]={p:g,n:g});var n,r,a,s,u=t>=0?"p":"n",f=y[e],p=l[o][e][u];v[c]()?(n=p,r=f[1]+h,a=f[0]-p,s=d,Math.abs(a)<m&&(a=(0>a?-1:1)*m),l[o][e][u]+=a):(n=f[0]+h,r=p,a=d,s=f[1]-p,Math.abs(s)<m&&(s=(0>=s?-1:1)*m),l[o][e][u]+=s),i[P](e,{x:n,y:r,width:a,height:s})}},!0)},this)}var r=t(Wi),o=t("../util/number"),s=o[$e];return n}),e("echarts/chart/bar",[ji,Wi,"../coord/cartesian/Grid","./bar/BarSeries","./bar/BarView","../layout/barGrid",s],function(t){var e=t(Wi);t("../coord/cartesian/Grid"),t("./bar/BarSeries"),t("./bar/BarView");var i=t("../layout/barGrid"),n=t(s);n[V](e.curry(i,"bar")),n[N]("chart",function(t){t[X]("bar",function(t){var e=t[be]();e[$]("legendSymbol","roundRect")})})}),e("echarts/chart/helper/dataSelectableMixin",[ji,Wi],function(t){var e=t(Wi);return{updateSelectedMap:function(){var t=this[ti];this._dataOptMap=e.reduce(t.data,function(t,e){return t[e.name]=e,t},{})},select:function(t){var i=this._dataOptMap,n=i[t],r=this.get("selectedMode");"single"===r&&e.each(i,function(t){t.selected=!1}),n&&(n.selected=!0)},unSelect:function(t){var e=this._dataOptMap[t];e&&(e.selected=!1)},toggleSelected:function(t){var e=this._dataOptMap[t];return null!=e?(this[e.selected?"unSelect":"select"](t),e.selected):void 0},isSelected:function(t){var e=this._dataOptMap[t];return e&&e.selected}}}),e("echarts/chart/pie/PieSeries",[ji,"../../data/List",Wi,T,"../../data/helper/completeDimensions","../helper/dataSelectableMixin",n],function(t){var e=t("../../data/List"),i=t(Wi),r=t(T),a=t("../../data/helper/completeDimensions"),o=t("../helper/dataSelectableMixin"),s=t(n).extendSeriesModel({type:"series.pie",init:function(t){this.$superApply("init",arguments),this.legendDataProvider=function(){return this._dataBeforeProcessed},this.updateSelectedMap(),this._defaultLabelLine(t)},mergeOption:function(t){this.$superCall(Ee,t),this.updateSelectedMap()},getInitialData:function(t,i){var n=a(["value"],t.data),r=new e(n,this);return r.initData(t.data),r},getDataParams:function(t){var e=this._data,i=this.$superCall(ve,t);return i.percent=+(e.get("value",t)/e.getSum("value")*100)[Ye](2),i.$vars.push("percent"),i},_defaultLabelLine:function(t){r.defaultEmphasis(t.labelLine,["show"]);var e=t.labelLine[Me],i=t.labelLine[Se];e.show=e.show&&t.label[Me].show,i.show=i.show&&t.label[Se].show},defaultOption:{zlevel:0,z:2,legendHoverLink:!0,hoverAnimation:!0,center:["50%","50%"],radius:[0,"75%"],clockwise:!0,startAngle:90,minAngle:0,selectedOffset:10,avoidLabelOverlap:!0,label:{normal:{rotate:!1,show:!0,position:"outer"},emphasis:{}},labelLine:{normal:{show:!0,length:20,length2:5,smooth:!1,lineStyle:{width:1,type:"solid"}}},itemStyle:{normal:{borderColor:"rgba(0,0,0,0)",borderWidth:1},emphasis:{borderColor:"rgba(0,0,0,0)",borderWidth:1}},animationEasing:"cubicOut",data:[]}});return i.mixin(s,o),s}),e("echarts/chart/pie/PieView",[ji,S,Wi,"../../view/Chart"],function(t){function e(t,e,n,r){var a=e[be](),o=this[Gt],s=a[ge](o),l=e.get("selectedOffset");r[De]({type:"pieToggleSelect",from:t,name:s,seriesId:e.id}),a.each(function(t){i(a[Ft](t),a[z](t),e.isSelected(a[ge](t)),l,n)})}function i(t,e,i,n,r){var a=(e.startAngle+e.endAngle)/2,o=Math.cos(a),s=Math.sin(a),l=i?n:0,c=[o*l,s*l];r?t[ie]().when(200,{position:c}).start("bounceOut"):t.attr(We,c)}function n(t,e){function i(){o[te]=o.hoverIgnore,s[te]=s.hoverIgnore}function n(){o[te]=o.normalIgnore,s[te]=s.normalIgnore}a.Group.call(this);var r=new a[kt]({z2:2}),o=new a[St],s=new a.Text;this.add(r),this.add(o),this.add(s),this[w](t,e,!0),this.on(Se,i).on(Me,n).on(yt,i).on(gt,n)}function r(t,e,i,n){var r=n[ai](ri),a=n.get(We),o=a===ci||"inner"===a;return{fill:r[mt]()||(o?"#fff":t[L](e,"color")),textFont:r[ii](),text:t[H][m](e,i)||t[ge](e)}}var a=t(S),o=t(Wi),s=n[qi];s[w]=function(t,e,n){function r(){l[ne](!0),l.animateTo({shape:{r:h.r+10}},300,"elasticOut")}function s(){l[ne](!0),l.animateTo({shape:{r:h.r}},300,"elasticOut")}var l=this[He](0),c=t[H],u=t[me](e),h=t[z](e),d=o[Li]({},h);d.label=null,n?(l[At](d),l.shape.endAngle=h.startAngle,a[vt](l,{shape:{endAngle:h.endAngle}},c)):a[vt](l,{shape:d},c);var f=u[ai](j),p=t[L](e,"color");l[bt](o[li]({fill:p},f[ai](Me)[g]())),l[xt]=f[ai](Se)[g](),i(this,t[z](e),u.get("selected"),c.get("selectedOffset"),c.get(re)),l.off(yt).off(gt).off(Se).off(Me),u.get("hoverAnimation")&&l.on(yt,r).on(gt,s).on(Se,r).on(Me,s),this._updateLabel(t,e),a[_t](this)},s._updateLabel=function(t,e){var i=this[He](1),n=this[He](2),o=t[H],s=t[me](e),c=t[z](e),u=c.label,h=t[L](e,"color");a[vt](i,{shape:{points:u.linePoints||[[u.x,u.y],[u.x,u.y],[u.x,u.y]]}},o),a[vt](n,{style:{x:u.x,y:u.y}},o),n.attr({style:{textAlign:u[Et],textBaseline:u[Bt],textFont:u.font},rotation:u[de],origin:[u.x,u.y],z2:10});var d=s[ai]("label.normal"),f=s[ai]("label.emphasis"),p=s[ai]("labelLine.normal"),v=s[ai]("labelLine.emphasis");n[bt](r(t,e,Me,d)),n[te]=n.normalIgnore=!d.get("show"),n.hoverIgnore=!f.get("show"),i[te]=i.normalIgnore=!p.get("show"),i.hoverIgnore=!v.get("show"),i[bt]({stroke:h}),i[bt](p[ai]("lineStyle")[l]()),n[xt]=r(t,e,Se,f),i[xt]=v[ai]("lineStyle")[l]();var m=p.get("smooth");m&&m===!0&&(m=.4),i[At]({smooth:m})},o[Di](n,a.Group);var c=t("../../view/Chart")[Li]({type:"pie",init:function(){var t=new a.Group;this._sectorGroup=t},render:function(t,i,r,a){if(!a||a.from!==this.uid){var s=t[be](),l=this._data,c=this.group,u=i.get(re),h=!l,d=o.curry(e,this.uid,t,u,r),f=t.get("selectedMode");if(s.diff(l).add(function(t){var e=new n(s,t);h&&e[qe](function(t){t[ne](!0)}),f&&e.on("click",d),s[D](t,e),c.add(e)})[at](function(t,e){var i=l[Ft](e);i[w](s,t),i.off("click"),f&&i.on("click",d),c.add(i),s[D](t,i)})[Qt](function(t){var e=l[Ft](t);c[Qt](e)})[v](),u&&h&&s.count()>0){var p=s[z](0),m=Math.max(r[Pe](),r[Le]())/2,g=o.bind(c.removeClipPath,c);c.setClipPath(this._createClipPath(p.cx,p.cy,m,p.startAngle,p.clockwise,g,t))}this._data=s}},_createClipPath:function(t,e,i,n,r,o,s){var l=new a[kt]({shape:{cx:t,cy:e,r0:0,r:i,startAngle:n,endAngle:n,clockwise:r}});return a[pt](l,{shape:{endAngle:n+(r?1:-1)*Math.PI*2}},s,o),l}});return c}),e("echarts/action/createDataSelectAction",[ji,s,Wi],function(t){var e=t(s),i=t(Wi);return function(t,n){i.each(n,function(i){i[at]="updateView",e[F](i,function(e,n){var r={};return n[W]({mainType:"series",subType:t,query:e},function(t){t[i.method]&&t[i.method](e.name);var n=t[be]();n.each(function(e){var i=n[ge](e);r[i]=t.isSelected(i)||!1})}),{name:e.name,selected:r}})})}}),e("echarts/visual/dataColor",[ji],function(t){return function(t,e){var i=e.get("color"),n=0;e.eachRawSeriesByType(t,function(t){var r=t.get("color",!0),a=t.getRawData();if(!e.isSeriesFiltered(t)){var o=t[be]();o.each(function(t){var e=o[me](t),s=o[ye](t),l=o[L](t,"color",!0);if(l)a[Y](s,"color",l);else{var c=r?r[s%r[Fi]]:i[(s+n)%i[Fi]],u=e.get("itemStyle.normal.color")||c;a[Y](s,"color",u),o[Y](t,"color",u)}})}n+=a.count()})}}),e("echarts/chart/pie/labelLayout",[ji,vi],function(t){function e(t,e,i,n,r,a,o){function s(e,i,n,r){for(var a=e;i>a;a++)if(t[a].y+=n,a>e&&i>a+1&&t[a+1].y>t[a].y+t[a][gi])return void l(a,n/2);l(i-1,n/2)}function l(e,i){for(var n=e;n>=0&&(t[n].y-=i,!(n>0&&t[n].y>t[n-1].y+t[n-1][gi]));n--);}t.sort(function(t,e){return t.y-e.y});for(var c,u=0,h=t[Fi],d=[],f=[],p=0;h>p;p++)c=t[p].y-u,0>c&&s(p,h,-c,r),u=t[p].y+t[p][gi];0>o-u&&l(h-1,u-o);for(var p=0;h>p;p++)t[p].y>=i?f.push(t[p]):d.push(t[p])}function i(t,i,n,r,a,o){for(var s=[],l=[],c=0;c<t[Fi];c++)t[c].x<i?s.push(t[c]):l.push(t[c]);e(s,i,n,r,-1,a,o),e(l,i,n,r,1,a,o);for(var c=0;c<t[Fi];c++){var u=t[c].linePoints;u&&(t[c].x<i?u[2][0]=t[c].x+3:u[2][0]=t[c].x-3,u[1][1]=u[2][1]=t[c].y)}}var n=t(vi);return function(t,e,r,a){var o,s,l=t[be](),c=[],u=!1;l.each(function(i){var r,a,h,d,f=l[z](i),p=l[me](i),v=p[ai]("label.normal"),g=v.get(We),y=p[ai]("labelLine.normal"),_=y.get(Fi),x=y.get("length2"),b=(f.startAngle+f.endAngle)/2,w=Math.cos(b),M=Math.sin(b);if(o=f.cx,s=f.cy,g===ui)r=f.cx,a=f.cy,d=ui;else{var S=g===ci||"inner"===g,k=(S?f.r/2*w:f.r*w)+o,C=(S?f.r/2*M:f.r*M)+s;if(_+=e-f.r,r=k+3*w,a=C+3*M,!S){var A=k+w*_,T=C+M*_,D=A+(0>w?-1:1)*x,L=T;r=D+(0>w?-5:5),a=L,h=[[k,C],[A,T],[D,L]]}d=S?ui:w>0?"left":"right"}var P=hi,I=v[ai](ri)[ii](),O=v.get(le)?0>w?-b+Math.PI:-b:0,R=t[m](i,Me)||l[ge](i),B=n[ni](R,I,d,P);u=!!O,f.label={x:r,y:a,height:B[gi],length:_,length2:x,linePoints:h,textAlign:d,textBaseline:P,font:I,rotation:O},c.push(f.label)}),!u&&t.get("avoidLabelOverlap")&&i(c,o,s,e,r,a)}}),e("echarts/chart/pie/pieLayout",[ji,M,"./labelLayout",Wi],function(t){var e=t(M),i=e[$e],n=t("./labelLayout"),r=t(Wi),a=2*Math.PI,o=Math.PI/180;return function(t,s,l){s[X](t,function(t){var s=t.get(ui),c=t.get(Ce);r[Qe](c)||(c=[0,c]),r[Qe](s)||(s=[s,s]);var u=l[Pe](),h=l[Le](),d=Math.min(u,h),f=i(s[0],u),p=i(s[1],h),v=i(c[0],d/2),m=i(c[1],d/2),g=t[be](),y=-t.get("startAngle")*o,_=t.get("minAngle")*o,x=g.getSum("value"),b=Math.PI/(x||g.count())*2,w=t.get("clockwise"),M=t.get("roseType"),S=g[R]("value");S[0]=0;var k=a,C=0,A=y,T=w?1:-1;if(g.each("value",function(t,i){var n;n="area"!==M?0===x?b:t*b:a/(g.count()||1),_>n?(n=_,k-=_):C+=t;var r=A+T*n;g[P](i,{angle:n,startAngle:A,
endAngle:r,clockwise:w,cx:f,cy:p,r0:v,r:M?e[Ke](t,S,[v,m]):m}),A=r},!0),a>k)if(.001>=k){var D=a/g.count();g.each(function(t){var e=g[z](t);e.startAngle=y+T*t*D,e.endAngle=y+T*(t+1)*D})}else b=k/C,A=y,g.each("value",function(t,e){var i=g[z](e),n=i.angle===_?_:t*b;i.startAngle=A,i.endAngle=A+T*n,A+=n});n(t,m,u,h)})}}),e("echarts/processor/dataFilter",[],function(){return function(t,e){var i=e[Oe]({mainType:"legend"});i&&i[Fi]&&e[X](t,function(t){var e=t[be]();e.filterSelf(function(t){for(var n=e[ge](t),r=0;r<i[Fi];r++)if(!i[r].isSelected(n))return!1;return!0},this)},this)}}),e("echarts/chart/pie",[ji,Wi,s,"./pie/PieSeries","./pie/PieView","../action/createDataSelectAction","../visual/dataColor","./pie/pieLayout","../processor/dataFilter"],function(t){var e=t(Wi),i=t(s);t("./pie/PieSeries"),t("./pie/PieView"),t("../action/createDataSelectAction")("pie",[{type:"pieToggleSelect",event:"pieselectchanged",method:"toggleSelected"},{type:"pieSelect",event:"pieselected",method:"select"},{type:"pieUnSelect",event:"pieunselected",method:"unSelect"}]),i[N]("chart",e.curry(t("../visual/dataColor"),"pie")),i[V](e.curry(t("./pie/pieLayout"),"pie")),i[G](Hi,e.curry(t("../processor/dataFilter"),"pie"))}),e("echarts/chart/scatter/ScatterSeries",[ji,"../helper/createListFromArray","../../model/Series"],function(t){var e=t("../helper/createListFromArray"),i=t("../../model/Series");return i[Li]({type:"series.scatter",dependencies:["grid","polar"],getInitialData:function(t,i){var n=e(t.data,this,i);return n},defaultOption:{coordinateSystem:"cartesian2d",zlevel:0,z:2,legendHoverLink:!0,hoverAnimation:!0,xAxisIndex:0,yAxisIndex:0,polarIndex:0,geoIndex:0,symbolSize:10,large:!1,largeThreshold:2e3,itemStyle:{normal:{opacity:.8}}}})}),e("echarts/chart/helper/LargeSymbolDraw",[ji,S,k,Wi],function(t){function e(){this.group=new i.Group,this._symbolEl=new a({silent:!0})}var i=t(S),n=t(k),r=t(Wi),a=i[Mt]({shape:{points:null,sizes:null},symbolProxy:null,buildPath:function(t,e){for(var i=e[Ct],n=e.sizes,r=this.symbolProxy,a=r.shape,o=0;o<i[Fi];o++){var s=i[o],l=n[o];l[0]<4?t.rect(s[0]-l[0]/2,s[1]-l[1]/2,l[0],l[1]):(a.x=s[0]-l[0]/2,a.y=s[1]-l[1]/2,a.width=l[0],a[gi]=l[1],r[Dt](t,a))}}}),o=e[qi];return o[w]=function(t){this.group[qt]();var e=this._symbolEl,i=t[H];e[At]({points:t[O](t[z]),sizes:t[O](function(e){var i=t[L](e,x);return r[Qe](i)||(i=[i,i]),i})}),e.symbolProxy=n[b](t[I](_),0,0,0,0),e.setColor=e.symbolProxy.setColor,e[bt](i[ai]("itemStyle.normal")[g](["color"]));var a=t[I]("color");a&&e.setColor(a),this.group.add(this._symbolEl)},o[jt]=function(t){var e=t[be]();this._symbolEl[At]({points:e[O](e[z])})},o[Qt]=function(){this.group[qt]()},e}),e("echarts/chart/scatter/ScatterView",[ji,"../helper/SymbolDraw","../helper/LargeSymbolDraw",n],function(t){var e=t("../helper/SymbolDraw"),i=t("../helper/LargeSymbolDraw");t(n).extendChartView({type:"scatter",init:function(){this._normalSymbolDraw=new e,this._largeSymbolDraw=new i},render:function(t,e,i){var n=t[be](),r=this._largeSymbolDraw,a=this._normalSymbolDraw,o=this.group,s=t.get("large")&&n.count()>t.get("largeThreshold")?r:a;this._symbolDraw=s,s[w](n),o.add(s.group),o[Qt](s===r?a.group:r.group)},updateLayout:function(){this._symbolDraw[jt]()},remove:function(t,e){this._symbolDraw&&this._symbolDraw[Qt](e,!0)}})}),e("echarts/chart/scatter",[ji,Wi,s,"./scatter/ScatterSeries","./scatter/ScatterView","../visual/symbol","../layout/points"],function(t){var e=t(Wi),i=t(s);t("./scatter/ScatterSeries"),t("./scatter/ScatterView"),i[N]("chart",e.curry(t("../visual/symbol"),"scatter",y,null)),i[V](e.curry(t("../layout/points"),"scatter"))}),e("echarts/component/tooltip/TooltipModel",[ji,n],function(t){t(n)[Z]({type:"tooltip",defaultOption:{zlevel:0,z:8,show:!0,showContent:!0,trigger:"item",triggerOn:"mousemove",alwaysShowContent:!1,hideDelay:100,transitionDuration:.4,enterable:!1,backgroundColor:"rgba(50,50,50,0.7)",borderColor:"#333",borderRadius:4,borderWidth:0,padding:5,axisPointer:{type:"line",axis:"auto",animation:!0,animationDurationUpdate:200,animationEasingUpdate:"exponentialOut",lineStyle:{color:"#555",width:1,type:"solid"},crossStyle:{color:"#555",width:1,type:"dashed",textStyle:{}},shadowStyle:{color:"rgba(150,150,150,0.3)"}},textStyle:{color:"#fff",fontSize:14}}})}),e("echarts/component/tooltip/TooltipContent",[ji,Wi,ae,ft,"../../util/format"],function(t){function e(t){var e="cubic-bezier(0.23, 1, 0.32, 1)",i="left "+t+"s "+e+",top "+t+"s "+e;return s.map(f,function(t){return t+"transition:"+i}).join(";")}function n(t){var e=[],i=t.get("fontSize"),n=t[mt]();return n&&e.push("color:"+n),e.push("font:"+t[ii]()),i&&e.push("line-height:"+Math.round(3*i/2)+"px"),h(["decoration","align"],function(i){var n=t.get(i);n&&e.push("text-"+i+":"+n)}),e.join(";")}function r(t){t=t;var r=[],a=t.get("transitionDuration"),o=t.get(tt),s=t[ai](ri),c=t.get(i);return a&&r.push(e(a)),o&&(r.push("background-Color:"+l.toHex(o)),r.push("filter:alpha(opacity=70)"),r.push("background-Color:"+o)),h(["width","color",Ce],function(e){var i="border-"+e,n=d(i),a=t.get(n);null!=a&&r.push(i+":"+a+("color"===e?"":"px"))}),r.push(n(s)),null!=c&&r.push("padding:"+u.normalizeCssArray(c).join("px ")+"px"),r.join(";")+";"}function a(t,e){var i=document[Vi]("div"),n=e.getZr();this.el=i,this._x=e[Pe]()/2,this._y=e[Le]()/2,t[et](i),this._container=t,this._show=!1,this._hideTimeout;var r=this;i.onmouseenter=function(){r.enterable&&(clearTimeout(r._hideTimeout),r._show=!0),r._inContent=!0},i.onmousemove=function(e){if(!r.enterable){var i=n.handler;c.normalizeEvent(t,e),i.dispatch(dt,e)}},i.onmouseleave=function(){r.enterable&&r._show&&r.hideLater(r._hideDelay),r._inContent=!1},o(i,t)}function o(t,e){function i(t){n(t[oe])&&t.preventDefault()}function n(i){for(;i&&i!==e;){if(i===t)return!0;i=i[ct]}}c.addEventListener(e,"touchstart",i),c.addEventListener(e,"touchmove",i),c.addEventListener(e,"touchend",i)}var s=t(Wi),l=t(ae),c=t(ft),u=t("../../util/format"),h=s.each,d=u.toCamelCase,f=["","-webkit-","-moz-","-o-"],p="position:absolute;display:block;border-style:solid;white-space:nowrap;";return a[qi]={constructor:a,enterable:!0,update:function(){var t=this._container,e=t.currentStyle||document.defaultView.getComputedStyle(t),i=t.style;"absolute"!==i[We]&&"absolute"!==e[We]&&(i[We]="relative"),this.hide()},show:function(t){clearTimeout(this._hideTimeout),this.el.style.cssText=p+r(t)+";left:"+this._x+"px;top:"+this._y+"px;",this._show=!0},setContent:function(t){var e=this.el;e[it]=t,e.style.display=t?"block":"none"},moveTo:function(t,e){var i=this.el.style;i.left=t+"px",i.top=e+"px",this._x=t,this._y=e},hide:function(){this.el.style.display="none",this._show=!1},hideLater:function(t){!this._show||this._inContent&&this.enterable||(t?(this._hideDelay=t,this._show=!1,this._hideTimeout=setTimeout(s.bind(this.hide,this),t)):this.hide())},isShow:function(){return this._show}},a}),e("echarts/component/tooltip/TooltipView",[ji,"./TooltipContent",S,Wi,"../../util/format",M,n],function(t){function e(t,e){if(!t||!e)return!1;var i=b.round;return i(t[0])===i(e[0])&&i(t[1])===i(e[1])}function i(t,e,i,n){return{x1:t,y1:e,x2:i,y2:n}}function a(t,e,i,n){return{x:t,y:e,width:i,height:n}}function s(t,e,i,n,r,a){return{cx:t,cy:e,r0:i,r:n,startAngle:r,endAngle:a,clockwise:!0}}function c(t,e,i,n,r){var a=i.clientWidth,o=i[J],s=20;return t+a+s>n?t-=a+s:t+=s,e+o+s>r?e-=o+s:e+=s,[t,e]}function f(t,e,i){var n=i.clientWidth,r=i[J],a=5,o=0,s=0,l=e.width,c=e[gi];switch(t){case ci:o=e.x+l/2-n/2,s=e.y+c/2-r/2;break;case"top":o=e.x+l/2-n/2,s=e.y-r-a;break;case di:o=e.x+l/2-n/2,s=e.y+c+a;break;case"left":o=e.x-n-a,s=e.y+c/2-r/2;break;case"right":o=e.x+l+a,s=e.y+c/2-r/2}return[o,s]}function v(t,e,i,n,r,a,o){var s=o[Pe](),l=o[Le](),u=a&&a[ni]().clone();if(a&&u[yi](a[he]),typeof t===Ii&&(t=t([e,i],r,u)),_[Qe](t))e=w(t[0],s),i=w(t[1],l);else if(typeof t===Bi&&a){var h=f(t,u,n.el);e=h[0],i=h[1]}else{var h=c(e,i,n.el,s,l);e=h[0],i=h[1]}n[It](e,i)}function m(t){var e=t[A],i=t.get("tooltip.trigger",!0);return!(!e||"cartesian2d"!==e.type&&"polar"!==e.type&&"single"!==e.type||"item"===i)}var g=t("./TooltipContent"),y=t(S),_=t(Wi),x=t("../../util/format"),b=t(M),w=b[$e];t(n)[E]({type:"tooltip",_axisPointers:{},init:function(t,e){var i=new g(e[ze](),e);this._tooltipContent=i,e.on("showTip",this._manuallyShowTip,this),e.on("hideTip",this._manuallyHideTip,this)},render:function(t,e,i){this.group[qt](),this._axisPointers={},this._tooltipModel=t,this._ecModel=e,this._api=i,this._lastHover={};var n=this._tooltipContent;n[at](),n.enterable=t.get("enterable"),this._alwaysShowContent=t.get("alwaysShowContent"),this._seriesGroupByAxis=this._prepareAxisTriggerData(t,e);var r=this._crossText;r&&this.group.add(r);var a=this._api.getZr(),o=this._tryShow;a.off("click",o),a.off(dt,o),a.off(gt,this._hide),"click"===t.get("triggerOn")?a.on("click",o,this):(a.on(dt,o,this),a.on(gt,this._hide,this))},_manuallyShowTip:function(t){if(t.from!==this.uid){var e=this._ecModel,i=t[we],n=t[Gt],r=e.getSeriesByIndex(i),a=this._api;if(null==t.x||null==t.y){if(r||e[U](function(t){m(t)&&!r&&(r=t)}),r){var o=r[be]();null==n&&(n=o[Vt](t.name));var s,l,c=o[Ft](n),u=r[A];if(u&&u[h]){var d=u[h](o.getValues(u[B],n,!0));s=d&&d[0],l=d&&d[1]}else if(c){var f=c[ni]().clone();f[yi](c[he]),s=f.x+f.width/2,l=f.y+f[gi]/2}null!=s&&null!=l&&this._tryShow({offsetX:s,offsetY:l,target:c,event:{}})}}else a.getZr().handler.dispatch(dt,{zrX:t.x,zrY:t.y})}},_manuallyHideTip:function(t){t.from!==this.uid&&this._hide()},_prepareAxisTriggerData:function(t,e){var i={};return e[U](function(t){if(m(t)){var e,n,r=t[A];"cartesian2d"===r.type?(e=r[p](),n=e.dim+e.index):"single"===r.type?(e=r[u](),n=e.dim+e.type):(e=r[p](),n=e.dim+r.name),i[n]=i[n]||{coordSys:[],series:[]},i[n].coordSys.push(r),i[n][Be].push(t)}},this),i},_tryShow:function(t){var e=t[oe],i=this._tooltipModel,n=i.get(Ht),r=this._ecModel,a=this._api;if(i)if(e&&null!=e[Gt]){var o=e[H]||r.getSeriesByIndex(e[we]),s=e[Gt],l=o[be]()[me](s);"axis"===(l.get("tooltip.trigger")||n)?this._showAxisTooltip(i,r,t):(this._ticket="",this._hideAxisPointer(),this._resetLastHover(),this._showItemTooltipContent(o,s,t)),a[De]({type:"showTip",from:this.uid,dataIndex:e[Gt],seriesIndex:e[we]})}else"item"===n?this._hide():this._showAxisTooltip(i,r,t),"cross"===i.get("axisPointer.type")&&a[De]({type:"showTip",from:this.uid,x:t[ht],y:t[ut]})},_showAxisTooltip:function(t,i,n){var r=t[ai]("axisPointer"),a=r.get("type");if("cross"===a){var o=n[oe];if(o&&null!=o[Gt]){var s=i.getSeriesByIndex(o[we]),l=o[Gt];this._showItemTooltipContent(s,l,n)}}this._showAxisPointer();var c=!0;_.each(this._seriesGroupByAxis,function(t){var i=t.coordSys,o=i[0],s=[n[ht],n[ut]];if(!o.containPoint(s))return void this._hideAxisPointer(o.name);c=!1;var l=o[B],u=o.pointToData(s,!0);s=o[h](u);var d=o[p](),f=r.get("axis");"auto"===f&&(f=d.dim);var v=!1,m=this._lastHover;if("cross"===a)e(m.data,u)&&(v=!0),m.data=u;else{var g=_[Ei](l,f);m.data===u[g]&&(v=!0),m.data=u[g]}"cartesian2d"!==o.type||v?"polar"!==o.type||v?"single"!==o.type||v||this._showSinglePointer(r,o,f,s):this._showPolarPointer(r,o,f,s):this._showCartesianPointer(r,o,f,s),"cross"!==a&&this._dispatchAndShowSeriesTooltipContent(o,t[Be],s,u,v)},this),c&&this._hide()},_showCartesianPointer:function(t,e,n,r){function o(n,r,a){var o="x"===n?i(r[0],a[0],r[0],a[1]):i(a[0],r[1],a[1],r[1]),s=l._getPointerElement(e,t,n,o);h?y[vt](s,{shape:o},t):s.attr({shape:o})}function s(i,n,r){var o=e[u](i),s=o.getBandWidth(),c=r[1]-r[0],d="x"===i?a(n[0]-s/2,r[0],s,c):a(r[0],n[1]-s/2,c,s),f=l._getPointerElement(e,t,i,d);h?y[vt](f,{shape:d},t):f.attr({shape:d})}var l=this,c=t.get("type"),h="cross"!==c;if("cross"===c)o("x",r,e[u]("y").getGlobalExtent()),o("y",r,e[u]("x").getGlobalExtent()),this._updateCrossText(e,r,t);else{var d=e[u]("x"===n?"y":"x"),f=d.getGlobalExtent();"cartesian2d"===e.type&&("line"===c?o:s)(n,r,f)}},_showSinglePointer:function(t,e,n,a){function o(n,r,a){var o=e[u](),l=o.orient,h=l===Ge?i(r[0],a[0],r[0],a[1]):i(a[0],r[1],a[1],r[1]),d=s._getPointerElement(e,t,n,h);c?y[vt](d,{shape:h},t):d.attr({shape:h})}var s=this,l=t.get("type"),c="cross"!==l,h=e[r](),d=[h.y,h.y+h[gi]];o(n,a,d)},_showPolarPointer:function(t,e,n,r){function a(n,r,a){var o,s=e.pointToCoord(r);if("angle"===n){var c=e.coordToPoint([a[0],s[1]]),u=e.coordToPoint([a[1],s[1]]);o=i(c[0],c[1],u[0],u[1])}else o={cx:e.cx,cy:e.cy,r:s[0]};var h=l._getPointerElement(e,t,n,o);p?y[vt](h,{shape:o},t):h.attr({shape:o})}function o(i,n,r){var a,o=e[u](i),c=o.getBandWidth(),h=e.pointToCoord(n),d=Math.PI/180;a="angle"===i?s(e.cx,e.cy,r[0],r[1],(-h[1]-c/2)*d,(-h[1]+c/2)*d):s(e.cx,e.cy,h[0]-c/2,h[0]+c/2,0,2*Math.PI);var f=l._getPointerElement(e,t,i,a);p?y[vt](f,{shape:a},t):f.attr({shape:a})}var l=this,c=t.get("type"),h=e.getAngleAxis(),f=e.getRadiusAxis(),p="cross"!==c;if("cross"===c)a("angle",r,f[d]()),a(Ce,r,h[d]()),this._updateCrossText(e,r,t);else{var v=e[u](n===Ce?"angle":Ce),m=v[d]();("line"===c?a:o)(n,r,m)}},_updateCrossText:function(t,e,i){var n=i[ai]("crossStyle"),r=n[ai](ri),a=this._tooltipModel,s=this._crossText;s||(s=this._crossText=new y.Text({style:{textAlign:"left",textBaseline:"bottom"}}),this.group.add(s));var l=t.pointToData(e),c=t[B];l=_.map(l,function(e,i){var n=t[u](c[i]);return e=n.type===C||"time"===n.type?n.scale[o](e):x[pe](e[Ye](n[Xe]()))}),s[bt]({fill:r[mt]()||n.get("color"),textFont:r[ii](),text:l.join(", "),x:e[0]+5,y:e[1]-5}),s.z=a.get("z"),s[ot]=a.get(ot)},_getPointerElement:function(t,e,i,n){var r=this._tooltipModel,a=r.get("z"),o=r.get(ot),s=this._axisPointers,c=t.name;if(s[c]=s[c]||{},s[c][i])return s[c][i];var u=e.get("type"),h=e[ai](u+"Style"),d="shadow"===u,f=h[d?"getAreaStyle":l](),p="polar"===t.type?d?kt:i===Ce?"Circle":"Line":d?"Rect":"Line";d?f[Si]=null:f.fill=null;var v=s[c][i]=new y[p]({style:f,z:a,zlevel:o,silent:!0,shape:n});return this.group.add(v),v},_dispatchAndShowSeriesTooltipContent:function(t,e,i,n,r){var a=this._tooltipModel,o=this._tooltipContent,s=t[p](),l=_.map(e,function(t){return{seriesIndex:t[we],dataIndex:t.getAxisTooltipDataIndex?t.getAxisTooltipDataIndex(t.getDimensionsOnAxis(s.dim),n,s):t[be]().indexOfNearest(t.getDimensionsOnAxis(s.dim),n["x"===s.dim||s.dim===Ce?0:1])}}),c=this._lastHover,u=this._api;if(c.payloadBatch&&!r&&u[De]({type:"downplay",batch:c.payloadBatch}),r||(u[De]({type:"highlight",batch:l}),c.payloadBatch=l),u[De]({type:"showTip",dataIndex:l[0][Gt],seriesIndex:l[0][we],from:this.uid}),s&&a.get("showContent")){var h,d=a.get("formatter"),f=a.get(We),m=_.map(e,function(t,e){return t[ve](l[e][Gt])});o.show(a);var g=l[0][Gt];if(!r){if(this._ticket="",d){if(typeof d===Bi)h=x.formatTpl(d,m);else if(typeof d===Ii){var y=this,b="axis_"+t.name+"_"+g,w=function(t,e){t===y._ticket&&(o.setContent(e),v(f,i[0],i[1],o,m,null,u))};y._ticket=b,h=d(m,b,w)}}else{var M=e[0][be]()[ge](g);h=(M?M+"<br />":"")+_.map(e,function(t,e){return t.formatTooltip(l[e][Gt],!0)}).join("<br />")}o.setContent(h)}v(f,i[0],i[1],o,m,null,u)}},_showItemTooltipContent:function(t,e,i){var n=this._api,r=t[be](),a=r[me](e),o=this._tooltipModel,s=this._tooltipContent,l=a[ai]("tooltip");if(l.parentModel?l.parentModel.parentModel=o:l.parentModel=this._tooltipModel,l.get("showContent")){var c,u=l.get("formatter"),h=l.get(We),d=t[ve](e);if(u){if(typeof u===Bi)c=x.formatTpl(u,d);else if(typeof u===Ii){var f=this,p="item_"+t.name+"_"+e,m=function(t,e){t===f._ticket&&(s.setContent(e),v(h,i[ht],i[ut],s,d,i[oe],n))};f._ticket=p,c=u(d,p,m)}}else c=t.formatTooltip(e);s.show(l),s.setContent(c),v(h,i[ht],i[ut],s,d,i[oe],n)}},_showAxisPointer:function(t){if(t){var e=this._axisPointers[t];e&&_.each(e,function(t){t.show()})}else this.group[qe](function(t){t.show()}),this.group.show()},_resetLastHover:function(){var t=this._lastHover;t.payloadBatch&&this._api[De]({type:"downplay",batch:t.payloadBatch}),this._lastHover={}},_hideAxisPointer:function(t){if(t){var e=this._axisPointers[t];e&&_.each(e,function(t){t.hide()})}else this.group.hide()},_hide:function(){this._hideAxisPointer(),this._resetLastHover(),this._alwaysShowContent||this._tooltipContent.hideLater(this._tooltipModel.get("hideDelay")),this._api[De]({type:"hideTip",from:this.uid})},dispose:function(t,e){var i=e.getZr();this._tooltipContent.hide(),i.off("click",this._tryShow),i.off(dt,this._tryShow),i.off(gt,this._hide),e.off("showTip",this._manuallyShowTip),e.off("hideTip",this._manuallyHideTip)}})}),e("echarts/component/tooltip",[ji,"./tooltip/TooltipModel","./tooltip/TooltipView",s,s],function(t){t("./tooltip/TooltipModel"),t("./tooltip/TooltipView"),t(s)[F]({type:"showTip",event:"showTip",update:"none"},function(){}),t(s)[F]({type:"hideTip",event:"hideTip",update:"none"},function(){})}),e("echarts/component/legend/LegendModel",[ji,Wi,"../../model/Model",n],function(t){var e=t(Wi),i=t("../../model/Model");return t(n)[Z]({type:"legend",dependencies:[Be],layoutMode:{type:"box",ignoreSize:!0},init:function(t,e,i){this[Ne](t,i),t.selected=t.selected||{},this._updateData(i);var n=this._data,r=this[ti].selected;if(n[0]&&"single"===this.get("selectedMode")){var a=!1;for(var o in r)r[o]&&(this.select(o),a=!0);!a&&this.select(n[0].get("name"))}},mergeOption:function(t){this.$superCall(Ee,t),this._updateData(this[oi])},_updateData:function(t){var n=e.map(this.get("data")||[],function(t){return typeof t===Bi&&(t={name:t}),new i(t,this,this[oi])},this);this._data=n;var r=e.map(t.getSeries(),function(t){return t.name});t[U](function(t){if(t.legendDataProvider){var e=t.legendDataProvider();r=r[Oi](e[O](e[ge]))}}),this._availableNames=r},getData:function(){return this._data},select:function(t){var i=this[ti].selected,n=this.get("selectedMode");if("single"===n){var r=this._data;e.each(r,function(t){i[t.get("name")]=!1})}i[t]=!0},unSelect:function(t){"single"!==this.get("selectedMode")&&(this[ti].selected[t]=!1)},toggleSelected:function(t){var e=this[ti].selected;t in e||(e[t]=!0),this[e[t]?"unSelect":"select"](t)},isSelected:function(t){var i=this[ti].selected;return!(t in i&&!i[t])&&e[Ei](this._availableNames,t)>=0},defaultOption:{zlevel:0,z:4,show:!0,orient:"horizontal",left:"center",top:"top",align:"auto",backgroundColor:"rgba(0,0,0,0)",borderColor:"#ccc",borderWidth:0,padding:5,itemGap:10,itemWidth:25,itemHeight:14,textStyle:{color:"#333"},selectedMode:!0}})}),e("echarts/component/legend/legendAction",[ji,n,Wi],function(t){function e(t,e,i){var n,a={},o="toggleSelected"===t;return i[W]("legend",function(i){o&&null!=n?i[n?"select":"unSelect"](e.name):(i[t](e.name),n=i.isSelected(e.name));var s=i[be]();r.each(s,function(t){var e=t.get("name");if("\n"!==e&&""!==e){var n=i.isSelected(e);e in a?a[e]=a[e]&&n:a[e]=n}})}),{name:e.name,selected:a}}var i=t(n),r=t(Wi);i[F]("legendToggleSelect","legendselectchanged",r.curry(e,"toggleSelected")),i[F]("legendSelect","legendselected",r.curry(e,"select")),i[F]("legendUnSelect","legendunselected",r.curry(e,"unSelect"))}),e("echarts/component/helper/listComponent",[ji,"../../util/layout","../../util/format",S],function(t){function e(t,e,r){n.positionGroup(t,e.getBoxLayoutParams(),{width:r[Pe](),height:r[Le]()},e.get(i))}var n=t("../../util/layout"),r=t("../../util/format"),a=t(S);return{layout:function(t,i,r){n.box(i.get("orient"),t,i.get("itemGap"),r[Pe](),r[Le]()),e(t,i,r)},addBackground:function(t,e){var n=r.normalizeCssArray(e.get(i)),o=t[ni](),s=e[g](["color",Mi]);s.fill=e.get(tt);var l=new a.Rect({shape:{x:o.x-n[3],y:o.y-n[0],width:o.width+n[1]+n[3],height:o[gi]+n[0]+n[2]},style:s,silent:!0});a[wt](l),t.add(l)}}}),e("echarts/component/legend/LegendView",[ji,Wi,k,S,"../helper/listComponent",n],function(t){function e(t,e){e[De]({type:"legendToggleSelect",name:t})}function i(t,e,i){t.get("legendHoverLink")&&i[De]({type:"highlight",seriesName:t.name,name:e})}function r(t,e,i){t.get("legendHoverLink")&&i[De]({type:"downplay",seriesName:t.name,name:e})}var a=t(Wi),o=t(k),s=t(S),l=t("../helper/listComponent"),c=a.curry,u="#ccc";return t(n)[E]({type:"legend",init:function(){this._symbolTypeStore={}},render:function(t,n,o){var h=this.group;if(h[qt](),t.get("show")){var d=t.get("selectedMode"),f=t.get("itemWidth"),p=t.get("itemHeight"),v=t.get("align");"auto"===v&&(v="right"===t.get("left")&&t.get("orient")===Fe?"right":"left");var m={},g={};a.each(t[be](),function(a){var l=a.get("name");(""===l||"\n"===l)&&h.add(new s.Group({newline:!0}));var y=n.getSeriesByName(l)[0];if(m[l]=a,y&&!g[l]){var x=y[be](),b=x[I]("color");t.isSelected(l)||(b=u),typeof b===Ii&&(b=b(y[ve](0)));var w=x[I]("legendSymbol")||"roundRect",M=x[I](_),S=this._createItem(l,a,t,w,M,f,p,v,b,d);S.on("click",c(e,l,o)).on(yt,c(i,y,"",o)).on(gt,c(r,y,"",o)),g[l]=!0}},this),n.eachRawSeries(function(n){if(n.legendDataProvider){var a=n.legendDataProvider();a.each(function(s){var l=a[ge](s);if(m[l]&&!g[l]){var h=a[L](s,"color");t.isSelected(l)||(h=u);var y="roundRect",_=this._createItem(l,m[l],t,y,null,f,p,v,h,d);_.on("click",c(e,l,o)).on(yt,c(i,n,l,o)).on(gt,c(r,n,l,o)),g[l]=!0}},!1,this)}},this),l.layout(h,t,o),l.addBackground(h,t)}},_createItem:function(t,e,i,n,r,a,l,c,u,h){var d=new s.Group,f=e[ai](ri),p=e.get("icon");if(n=p||n,d.add(o[b](n,0,0,a,l,u)),!p&&r&&r!==n&&"none"!=r){var v=.8*l;d.add(o[b](r,(a-v)/2,(l-v)/2,v,v,u))}var m="left"===c?a+5:-5,g=c,y=i.get("formatter");typeof y===Bi&&y?t=y[Je]("{name}",t):typeof y===Ii&&(t=y(t));var _=new s.Text({style:{text:t,x:m,y:l/2,fill:f[mt](),textFont:f[ii](),textAlign:g,textBaseline:"middle"}});return d.add(_),d.add(new s.Rect({shape:d[ni](),invisible:!0})),d[qe](function(t){t.silent=!h}),this.group.add(d),d}})}),e("echarts/component/legend/legendFilter",[],function(){return function(t){var e=t[Oe]({mainType:"legend"});e&&e[Fi]&&t.filterSeries(function(t){for(var i=0;i<e[Fi];i++)if(!e[i].isSelected(t.name))return!1;return!0})}}),e("echarts/component/legend",[ji,"./legend/LegendModel","./legend/legendAction","./legend/LegendView",s,"./legend/legendFilter"],function(t){t("./legend/LegendModel"),t("./legend/legendAction"),t("./legend/LegendView");var e=t(s);e[G](Hi,t("./legend/legendFilter"))}),e("echarts/component/axis/AxisBuilder",[ji,Wi,S,"../../model/Model",M],function(t){function e(t,e,i){var n,r,a=u(e-t[de]);return h(a)?(r=i>0?"top":di,n=ui):h(a-f)?(r=i>0?di:"top",n=ui):(r=hi,n=a>0&&f>a?i>0?"right":"left":i>0?"left":"right"),{rotation:a,textAlign:n,textBaseline:r}}function i(t,e,i){var n,r,a=u(-t[de]),o=i[0]>i[1],s="start"===e&&!o||"start"!==e&&o;return h(a-f/2)?(r=s?di:"top",n=ui):h(a-1.5*f)?(r=s?"top":di,n=ui):(r=hi,n=1.5*f>a&&a>f/2?s?"left":"right":s?"right":"left"),{rotation:a,textAlign:n,textBaseline:r}}var n=t(Wi),r=t(S),s=t("../../model/Model"),c=t(M),u=c.remRadian,h=c.isRadianAroundZero,f=Math.PI,p=function(t,e){this.opt=e,this.axisModel=t,n[li](e,{labelOffset:0,nameDirection:1,tickDirection:1,labelDirection:1,silent:!0}),this.group=new r.Group({position:e[We].slice(),rotation:e[de]})};p[qi]={constructor:p,hasBuilder:function(t){return!!v[t]},add:function(t){v[t].call(this)},getGroup:function(){return this.group}};var v={axisLine:function(){var t=this.opt,e=this.axisModel;if(e.get("axisLine.show")){var i=this.axisModel.axis[d]();this.group.add(new r.Line({shape:{x1:i[0],y1:0,x2:i[1],y2:0},style:n[Li]({lineCap:"round"},e[ai]("axisLine.lineStyle")[l]()),strokeContainThreshold:t.strokeContainThreshold,silent:!!t.silent,z2:1}))}},axisTick:function(){var t=this.axisModel;if(t.get("axisTick.show")){for(var e=t.axis,i=t[ai]("axisTick"),n=this.opt,a=i[ai]("lineStyle"),o=i.get(Fi),s=g(i,n.labelInterval),c=e.getTicksCoords(),u=[],h=0;h<c[Fi];h++)if(!m(e,h,s)){var d=c[h];u.push(new r.Line(r.subPixelOptimizeLine({shape:{x1:d,y1:0,x2:d,y2:n.tickDirection*o},style:{lineWidth:a.get("width")},silent:!0})))}this.group.add(r.mergePath(u,{style:a[l](),silent:!0}))}},axisLabel:function(){function t(t,e){var i=t&&t[ni]().clone(),n=e&&e[ni]().clone();return i&&n?(i[yi](t[ce]()),n[yi](e[ce]()),i[nt](n)):void 0}var i=this.axisModel;if(i.get("axisLabel.show")){var n=this.opt,o=i.axis,l=i[ai]("axisLabel"),c=l[ai](ri),u=l.get("margin"),h=o.scale.getTicks(),d=i.getFormattedLabels(),p=n.labelRotation;null==p&&(p=l.get(le)||0),p=p*f/180;for(var v=e(n,p,n.labelDirection),g=i.get("data"),y=[],_=0;_<h[Fi];_++)if(!m(o,_,n.labelInterval)){var x=c;g&&g[_]&&g[_][ri]&&(x=new s(g[_][ri],c,i[oi]));var b=o[a](h[_]),w=[b,n.labelOffset+n.labelDirection*u],M=new r.Text({style:{text:d[_],textAlign:x.get("align",!0)||v[Et],textBaseline:x.get("baseline",!0)||v[Bt],textFont:x[ii](),fill:x[mt]()},position:w,rotation:v[de],silent:!0,z2:10});y.push(M),this.group.add(M)}if(o.type!==C){if(i.get("min")){var S=y[0],k=y[1];t(S,k)&&(S[te]=!0)}if(i.get("max")){var A=y[y[Fi]-1],T=y[y[Fi]-2];t(T,A)&&(A[te]=!0)}}}},axisName:function(){var t=this.opt,n=this.axisModel,a=this.opt.axisName;if(null==a&&(a=n.get("name")),a){var o,s=n.get("nameLocation"),l=t.nameDirection,c=n[ai]("nameTextStyle"),u=n.get("nameGap")||0,h=this.axisModel.axis[d](),f=h[0]>h[1]?-1:1,p=["start"===s?h[0]-f*u:"end"===s?h[1]+f*u:(h[0]+h[1])/2,s===hi?t.labelOffset+l*u:0];o=s===hi?e(t,t[de],l):i(t,s,h),this.group.add(new r.Text({style:{text:a,textFont:c[ii](),fill:c[mt]()||n.get("axisLine.lineStyle.color"),textAlign:o[Et],textBaseline:o[Bt]},position:p,rotation:o[de],silent:!0,z2:1}))}}},m=p.ifIgnoreOnTick=function(t,e,i){return t.scale.type===xe&&typeof i===Ii&&!i(e,t.scale[o](e))||e%(i+1)},g=p.getInterval=function(t,e){var i=t.get("interval");return(null==i||"auto"==i)&&(i=e),i};return p}),e("echarts/component/axis/AxisView",[ji,Wi,S,"./AxisBuilder",n],function(t){function e(t,e){function i(t,e){var i=n[u](t);return i.toGlobalCoord(i[a](0))}var n=t[A],o=e.axis,s={},l=o[We],c=o.onZero?"onZero":l,h=o.dim,d=n[r](),f=[d.x,d.x+d.width,d.y,d.y+d[gi]],p={x:{top:f[2],bottom:f[3]},y:{left:f[0],right:f[1]}};p.x.onZero=Math.max(Math.min(i("y"),p.x[di]),p.x.top),p.y.onZero=Math.max(Math.min(i("x"),p.y.right),p.y.left),s[We]=["y"===h?p.y[c]:f[0],"x"===h?p.x[c]:f[3]];var v={x:0,y:1};s[de]=Math.PI/2*v[h];var m={top:-1,bottom:1,left:-1,right:1};s.labelDirection=s.tickDirection=s.nameDirection=m[l],o.onZero&&(s.labelOffset=p[h][l]-p[h].onZero),e[ai]("axisTick").get(ci)&&(s.tickDirection=-s.tickDirection),e[ai]("axisLabel").get(ci)&&(s.labelDirection=-s.labelDirection);var g=e[ai]("axisLabel").get(le);return s.labelRotation="top"===c?-g:g,s.labelInterval=o.getLabelInterval(),s.z2=1,s}var i=t(Wi),o=t(S),s=t("./AxisBuilder"),l=s.ifIgnoreOnTick,h=s.getInterval,d=["axisLine","axisLabel","axisTick","axisName"],f=["splitLine","splitArea"],p=t(n)[E]({type:"axis",render:function(t,n){if(this.group[qt](),t.get("show")){var r=n[Ae]("grid",t.get("gridIndex")),a=e(r,t),o=new s(t,a);i.each(d,o.add,o),this.group.add(o.getGroup()),i.each(f,function(e){t.get(e+".show")&&this["_"+e](t,r,a.labelInterval)},this)}},_splitLine:function(t,e,i){var n=t.axis,a=t[ai]("splitLine"),s=a[ai]("lineStyle"),u=s.get("width"),d=s.get("color"),f=h(a,i);d=d instanceof Array?d:[d];for(var p=e[A][r](),v=n[c](),m=[],g=0,y=n.getTicksCoords(),_=[],x=[],b=0;b<y[Fi];b++)if(!l(n,b,f)){var w=n.toGlobalCoord(y[b]);v?(_[0]=w,_[1]=p.y,x[0]=w,x[1]=p.y+p[gi]):(_[0]=p.x,_[1]=w,x[0]=p.x+p.width,x[1]=w);var M=g++%d[Fi];m[M]=m[M]||[],m[M].push(new o.Line(o.subPixelOptimizeLine({shape:{x1:_[0],y1:_[1],x2:x[0],y2:x[1]},style:{lineWidth:u},silent:!0})))}for(var b=0;b<m[Fi];b++)this.group.add(o.mergePath(m[b],{style:{stroke:d[b%d[Fi]],lineDash:s.getLineDash(),lineWidth:u},silent:!0}))},_splitArea:function(t,e,i){var n=t.axis,a=t[ai]("splitArea"),s=a.get("areaStyle.color"),u=e[A][r](),d=n.getTicksCoords(),f=n.toGlobalCoord(d[0]),p=n.toGlobalCoord(d[0]),v=[],m=0,g=h(a,i);s=s instanceof Array?s:[s];for(var y=1;y<d[Fi];y++)if(!l(n,y,g)){var _,x,b,w,M=n.toGlobalCoord(d[y]);n[c]()?(_=f,x=u.y,b=M-_,w=u[gi]):(_=u.x,x=p,b=u.width,w=M-x);var S=m++%s[Fi];v[S]=v[S]||[],v[S].push(new o.Rect({shape:{x:_,y:x,width:b,height:w},silent:!0})),f=_+b,p=x+w}for(var y=0;y<v[Fi];y++)this.group.add(o.mergePath(v[y],{style:{fill:s[y%s[Fi]]},silent:!0}))}});p[Li]({type:"xAxis"}),p[Li]({type:"yAxis"})}),e("echarts/component/axis",[ji,"../coord/cartesian/AxisModel","./axis/AxisView"],function(t){t("../coord/cartesian/AxisModel"),t("./axis/AxisView")}),e("echarts/component/grid",[ji,"../util/graphic",Wi,"../coord/cartesian/Grid","./axis",s],function(t){var e=t("../util/graphic"),i=t(Wi);t("../coord/cartesian/Grid"),t("./axis"),t(s)[E]({type:"grid",render:function(t,n){this.group[qt](),t.get("show")&&this.group.add(new e.Rect({shape:t[A][r](),style:i[li]({fill:t.get(tt)},t[g]()),silent:!0}))}})}),e("echarts/component/title",[ji,s,"../util/graphic","../util/layout"],function(t){var e=t(s),n=t("../util/graphic"),r=t("../util/layout");e[Z]({type:"title",defaultOption:{zlevel:0,z:6,show:!0,text:"",target:"blank",subtext:"",subtarget:"blank",left:"left",top:"top",backgroundColor:"rgba(0,0,0,0)",borderColor:"#ccc",borderWidth:0,padding:5,itemGap:10,textStyle:{fontSize:18,fontWeight:"bolder",color:"#333"},subtextStyle:{color:"#aaa"}}}),e[E]({type:"title",render:function(t,e,a){if(this.group[qt](),t.get("show")){var o=this.group,s=t[ai](ri),l=t[ai]("subtextStyle"),c=t.get(Et),u=new n.Text({style:{text:t.get("text"),textFont:s[ii](),fill:s[mt](),textBaseline:"top"},z2:10}),h=u[ni](),d=t.get("subtext"),f=new n.Text({style:{text:d,textFont:l[ii](),fill:l[mt](),y:h[gi]+t.get("itemGap"),textBaseline:"top"},z2:10}),p=t.get("link"),v=t.get("sublink");u.silent=!p,f.silent=!v,p&&u.on("click",function(){window.open(p,t.get(oe))}),v&&f.on("click",function(){window.open(v,t.get("subtarget"))}),o.add(u),d&&o.add(f);var m=o[ni](),y=t.getBoxLayoutParams();y.width=m.width,y[gi]=m[gi];var _=r[Ve](y,{width:a[Pe](),height:a[Le]()},t.get(i));if(!c){var x=_.x/a[Pe](),b=(_.x+_.width)/a[Pe]();.2>x?c="left":b>.8?(_.x+=_.width,c="right"):(_.x+=_.width/2,c=ui)}o[We]=[_.x,_.y],u[bt](Et,c),f[bt](Et,c),m=o[ni]();var w=_.margin,M=t[g](["color",Mi]);M.fill=t.get(tt);var S=new n.Rect({shape:{x:m.x-w[3],y:m.y-w[0],width:m.width+w[1]+w[3],height:m[gi]+w[0]+w[2]},style:M,silent:!0});n[wt](S),o.add(S)}}})}),e("echarts/component/marker/MarkPointModel",[ji,"../../model/globalDefault",T,n],function(t){var e=t("../../model/globalDefault"),i=t(T);e.markPoint={};var r=t(n)[Z]({type:"markPoint",dependencies:[Be,"grid","polar"],init:function(t,e,i,n,r){this[Ne](t,i),this[Ee](t,r,!0)},mergeOption:function(t,e,n){if(!e){var a=this[oi];a[U](function(t){var e=t.get("markPoint"),o=t.markPointModel;if(!e||!e.data)return void(t.markPointModel=null);if(o)o[Ee](e,!0);else{n&&i.defaultEmphasis(e.label,[We,"show",ri,xi,"formatter"]);var s={seriesIndex:t[we],name:t.name};o=new r(e,this,a,s,!0)}t.markPointModel=o},this)}},defaultOption:{zlevel:0,z:5,symbol:"pin",symbolSize:50,tooltip:{trigger:"item"},label:{normal:{show:!0,position:"inside"},emphasis:{show:!0}},itemStyle:{normal:{borderWidth:2},emphasis:{}}}});return r}),e("echarts/component/marker/markerHelper",[ji,Wi,M],function(t){function e(t,e,i){var n=-1;do n=Math.max(r.getPrecision(t.get(e,i)),n),t=t.stackedOn;while(t);return n}function i(t,i,n,r,a){var o=[],s="average"===t?i.getSum(r,!0)/i.count():i[R](r)["max"===t?1:0],l=i.indexOfNearest(r,s);o[1-a]=i.get(n,l),o[a]=i.get(r,l,!0);var c=e(i,r,l);return c>=0&&(o[a]=+o[a][Ye](c)),o}var n=t(Wi),r=t(M),a=n.curry,o={min:a(i,"min"),max:a(i,"max"),average:a(i,"average")},s=function(t,e,i){if((isNaN(i.x)||isNaN(i.y))&&!n[Qe](i.coord)&&e){var r,a,s,l;null!=i.valueIndex?(r=e[B][i.valueIndex],a=e[B][1-i.valueIndex],s=e[u](r),l=e[u](a)):(l=e[p](),s=e[f](l),a=l.dim,r=s.dim);var c=null!=i.valueIndex?i.valueIndex:"angle"===r||"x"===r?0:1;i=n[Li]({},i),i.type&&o[i.type]&&l&&s?(i.coord=o[i.type](t,l.dim,r,c),i.value=i.coord[c]):i.coord=[null!=i.xAxis?i.xAxis:i.radiusAxis,null!=i.yAxis?i.yAxis:i.angleAxis]}return i},l=function(t,e){return t&&e.coord&&(null==e.x||null==e.y)?t.containData(e.coord):!0},c=function(t,e,i,n){return 2>n?t.coord&&t.coord[n]:void t.value};return{dataTransform:s,dataFilter:l,dimValueGetter:c}}),e("echarts/component/marker/MarkPointView",[ji,"../../chart/helper/SymbolDraw",Wi,"../../util/format",T,M,"../../data/List","./markerHelper",n],function(t){function e(t,e,i){
var n=e[B],a=new u(r.map(n,e.getDimensionInfo,e),i);return t&&a.initData(r[Hi](r.map(i.get("data"),r.curry(d.dataTransform,e,t)),r.curry(d.dataFilter,t)),null,d.dimValueGetter),a}var i=t("../../chart/helper/SymbolDraw"),r=t(Wi),a=t("../../util/format"),o=t(T),s=t(M),l=a[pe],c=a.encodeHTML,u=t("../../data/List"),d=t("./markerHelper"),f={getRawDataArray:function(){return this[ti].data},formatTooltip:function(t){var e=this[be](),i=this[_e](t),n=r[Qe](i)?r.map(i,l).join(", "):l(i),a=e[ge](t);return this.name+"<br />"+((a?c(a)+" : ":"")+n)},getData:function(){return this._data},setData:function(t){this._data=t}};r[li](f,o.dataFormatMixin),t(n)[E]({type:"markPoint",init:function(){this._symbolDrawMap={}},render:function(t,e,i){var n=this._symbolDrawMap;for(var r in n)n[r].__keep=!1;e[U](function(t){var e=t.markPointModel;e&&this._renderSeriesMP(t,e,i)},this);for(var r in n)n[r].__keep||(n[r][Qt](),this.group[Qt](n[r].group))},_renderSeriesMP:function(t,n,a){var o=t[A],l=t.name,c=t[be](),u=this._symbolDrawMap,d=u[l];d||(d=u[l]=new i);var p=e(o,c,n),v=o&&o[B];r.mixin(n,f),n.setData(p),p.each(function(t){var e,i=p[me](t),r=i[Ci]("x"),l=i[Ci]("y");if(null!=r&&null!=l)e=[s[$e](r,a[Pe]()),s[$e](l,a[Le]())];else if(o){var u=p.get(v[0],t),d=p.get(v[1],t);e=o[h]([u,d])}p[P](t,e);var f=i[Ci](x);typeof f===Ii&&(f=f(n[_e](t),n[ve](t))),p[Y](t,{symbolSize:f,color:i.get("itemStyle.normal.color")||c[I]("color"),symbol:i[Ci](_)})}),d[w](p),this.group.add(d.group),p[Nt](function(t){t[Xt](function(t){t[H]=n})}),d.__keep=!0}})}),e("echarts/component/markPoint",[ji,"./marker/MarkPointModel","./marker/MarkPointView"],function(t){t("./marker/MarkPointModel"),t("./marker/MarkPointView")}),e("echarts/component/marker/MarkLineModel",[ji,"../../model/globalDefault",T,n],function(t){var e=t("../../model/globalDefault"),i=t(T);e.markLine={};var r=t(n)[Z]({type:"markLine",dependencies:[Be,"grid","polar"],init:function(t,e,i,n,r){this[Ne](t,i),this[Ee](t,r,!0)},mergeOption:function(t,e,n){if(!e){var a=this[oi];a[U](function(t){var e=t.get("markLine"),o=t.markLineModel;if(!e||!e.data)return void(t.markLineModel=null);if(o)o[Ee](e,!0);else{n&&i.defaultEmphasis(e.label,[We,"show",ri,xi,"formatter"]);var s={seriesIndex:t[we],name:t.name};o=new r(e,this,a,s,!0)}t.markLineModel=o},this)}},defaultOption:{zlevel:0,z:5,symbol:[y,"arrow"],symbolSize:[8,16],precision:2,tooltip:{trigger:"item"},label:{normal:{show:!0,position:"end"},emphasis:{show:!0}},lineStyle:{normal:{type:"dashed"},emphasis:{width:3}},animationEasing:"linear"}});return r}),e("echarts/chart/helper/LinePath",[ji,S],function(t){var e=t(S),i=e.Line[qi],n=e.BezierCurve[qi];return e[Mt]({type:"ec-line",style:{stroke:"#000",fill:null},shape:{x1:0,y1:0,x2:0,y2:0,percent:1,cpx1:null,cpy1:null},buildPath:function(t,e){(null==e.cpx1||null==e.cpy1?i:n)[Dt](t,e)},pointAt:function(t){var e=this.shape;return null==e.cpx1||null==e.cpy1?i.pointAt.call(this,t):n.pointAt.call(this,t)}})}),e("echarts/chart/helper/Line",[ji,k,wi,"./LinePath",S,Wi,M],function(t){function e(t,e,i){var n=e[L](i,"color"),r=e[L](i,_),a=e[L](i,x);if("none"!==r){f[Qe](a)||(a=[a,a]);var o=c[b](r,-a[0]/2,-a[1]/2,a[0],a[1],n);return o.name=t,o}}function i(t){var e=new h({name:"line",style:{strokeNoScale:!0}});return n(e.shape,t),e}function n(t,e){var i=e[0],n=e[1],r=e[2];t.x1=i[0],t.y1=i[1],t.x2=n[0],t.y2=n[1],t.percent=1,r&&(t.cpx1=r[0],t.cpy1=r[1])}function r(t){return t.type===_&&"arrow"===t.shape.symbolType}function a(){var t=this,e=t.childOfName("line");if(this[Kt]||e[Kt]){var i=t.childOfName("fromSymbol"),n=t.childOfName("toSymbol"),a=t.childOfName("label"),s=e.pointAt(0),l=e.pointAt(e.shape.percent),c=u.sub([],l,s);u.normalize(c,c),i&&(i.attr(We,s),r(n)&&n.attr(de,o(s,l))),n&&(n.attr(We,l),r(i)&&i.attr(de,o(l,s))),a.attr(We,l);var h,d,f;"end"===a.__position?(h=[5*c[0]+l[0],5*c[1]+l[1]],d=c[0]>.8?"left":c[0]<-.8?"right":ui,f=c[1]>.8?"top":c[1]<-.8?di:hi):(h=[5*-c[0]+s[0],5*-c[1]+s[1]],d=c[0]>.8?"right":c[0]<-.8?"left":ui,f=c[1]>.8?di:c[1]<-.8?"top":hi),a.attr({style:{textBaseline:a.__textBaseline||f,textAlign:a.__textAlign||d},position:h})}}function o(t,e){return-Math.PI/2-Math.atan2(e[1]-t[1],e[0]-t[0])}function s(t,e,i,n){d.Group.call(this),this._createLine(t,e,i,n)}var c=t(k),u=t(wi),h=t("./LinePath"),d=t(S),f=t(Wi),p=t(M),v=s[qi];return v.beforeUpdate=a,v._createLine=function(t,n,r,a){var o=t[H],s=t[z](a),l=i(s);l.shape.percent=0,d[pt](l,{shape:{percent:1}},o),this.add(l);var c=new d.Text({name:"label"});if(this.add(c),n){var u=e("fromSymbol",n,a);this.add(u),this._fromSymbolType=n[L](a,_)}if(r){var h=e("toSymbol",r,a);this.add(h),this._toSymbolType=r[L](a,_)}this._updateCommonStl(t,n,r,a)},v[w]=function(t,i,r,a){var o=t[H],s=this.childOfName("line"),l=t[z](a),c={shape:{}};if(n(c.shape,l),d[vt](s,c,o),i){var u=i[L](a,_);if(this._fromSymbolType!==u){var h=e("fromSymbol",i,a);this[Qt](s.childOfName("fromSymbol")),this.add(h)}this._fromSymbolType=u}if(r){var f=r[L](a,_);if(f!==this._toSymbolType){var p=e("toSymbol",r,a);this[Qt](s.childOfName("toSymbol")),this.add(p)}this._toSymbolType=f}this._updateCommonStl(t,i,r,a)},v._updateCommonStl=function(t,e,i,n){var r=t[H],a=this.childOfName("line"),o=t[me](n),s=o[ai]("label.normal"),c=s[ai](ri),u=o[ai]("label.emphasis"),h=u[ai](ri),v=p.round(r[_e](n));isNaN(v)&&(v=t[ge](n)),a[bt](f[Li]({stroke:t[L](n,"color")},o[ai]("lineStyle.normal")[l]()));var g=this.childOfName("label");g[bt]({text:s.get("show")?r[m](n,Me)||v:"",textFont:c[ii](),fill:c[mt]()||t[L](n,"color")}),g[xt]={text:u.get("show")?r[m](n,Se)||v:"",textFont:c[ii](),fill:h[mt]()},g.__textAlign=c.get("align"),g.__textBaseline=c.get("baseline"),g.__position=s.get(We),d[_t](this,o[ai]("lineStyle.emphasis")[l]())},v[jt]=function(t,e,i,r){var a=t[z](r),o=this.childOfName("line");n(o.shape,a),o.dirty(!0),e&&e[Ft](r).attr(We,a[0]),i&&i[Ft](r).attr(We,a[1])},f[Di](s,d.Group),s}),e("echarts/chart/helper/LineDraw",[ji,S,"./Line"],function(t){function e(t){this._ctor=t||n,this.group=new i.Group}var i=t(S),n=t("./Line"),r=e[qi];return r[w]=function(t,e,i){var n=this._lineData,r=this.group,a=this._ctor;t.diff(n).add(function(n){var o=new a(t,e,i,n);t[D](n,o),r.add(o)})[at](function(a,o){var s=n[Ft](o);s[w](t,e,i,a),t[D](a,s),r.add(s)})[Qt](function(t){r[Qt](n[Ft](t))})[v](),this._lineData=t,this._fromData=e,this._toData=i},r[jt]=function(){var t=this._lineData;t[Nt](function(e,i){e[jt](t,this._fromData,this._toData,i)},this)},r[Qt]=function(){this.group[qt]()},e}),e("echarts/component/marker/MarkLineView",[ji,Wi,"../../data/List","../../util/format",T,M,"./markerHelper","../../chart/helper/LineDraw",n],function(t){function e(t,e){return g.dataFilter(t,e[0])&&g.dataFilter(t,e[1])}function i(t,i,n){var a=t[B],s=new o(a,n),l=new o(a,n),c=new o([],n);if(t){var u=t[p](),h=t[f](u),d=n.get("precision"),v=r[Hi](r.map(n.get("data"),r.curry(b,i,t,u,h,d)),r.curry(e,t));s.initData(r.map(v,function(t){return t[0]}),null,g.dimValueGetter),l.initData(r.map(v,function(t){return t[1]}),null,g.dimValueGetter),c.initData(r.map(v,function(t){return t[2]}))}return{from:s,to:l,line:c}}var r=t(Wi),o=t("../../data/List"),s=t("../../util/format"),l=t(T),c=t(M),v=s[pe],m=s.encodeHTML,g=t("./markerHelper"),y=t("../../chart/helper/LineDraw"),b=function(t,e,i,n,o,s){var l=s.type;if(!r[Qe](s)&&"min"===l||"max"===l||"average"===l){null!=s.valueIndex&&(i=e[u](e[B][1-s.valueIndex]),n=e[u](e[B][s.valueIndex]));var c=i.dim+"Axis",h=n.dim+"Axis",f=i.scale[d](),p=r[Li]({},s),v={};p.type=null,p[c]=f[0],v[c]=f[1];var m="average"===l?t.getSum(n.dim,!0)/t.count():t[R](n.dim)["max"===l?1:0];m=n.coordToData(n[a](m)),p[h]=v[h]=m,s=[p,v,{type:l,value:+m[Ye](o)}]}return s=[g.dataTransform(t,e,s[0]),g.dataTransform(t,e,s[1]),r[Li]({},s[2])],r.merge(s[2],s[0]),r.merge(s[2],s[1]),s},S={formatTooltip:function(t){var e=this._data,i=this[_e](t),n=r[Qe](i)?r.map(i,v).join(", "):v(i),a=e[ge](t);return this.name+"<br />"+((a?m(a)+" : ":"")+n)},getRawDataArray:function(){return this[ti].data},getData:function(){return this._data},setData:function(t){this._data=t}};r[li](S,l.dataFormatMixin),t(n)[E]({type:"markLine",init:function(){this._markLineMap={}},render:function(t,e,i){var n=this._markLineMap;for(var r in n)n[r].__keep=!1;e[U](function(t){var n=t.markLineModel;n&&this._renderSeriesML(t,n,e,i)},this);for(var r in n)n[r].__keep||this.group[Qt](n[r].group)},_renderSeriesML:function(t,e,n,a){function o(t,e,i){var n,r=t[me](e),o=r.get("x"),l=r.get("y");if(null!=o&&null!=l)n=[c[$e](o,a[Pe]()),c[$e](l,a[Le]())];else{var d=t.get(v[0],e),f=t.get(v[1],e);n=s[h]([d,f])}t[P](e,n),t[Y](e,{symbolSize:r.get(x)||k[i?0:1],symbol:r.get(_,!0)||M[i?0:1],color:r.get("itemStyle.normal.color")||u[I]("color")})}var s=t[A],l=t.name,u=t[be](),d=this._markLineMap,f=d[l];f||(f=d[l]=new y),this.group.add(f.group);var p=i(s,u,e),v=s[B],m=p.from,g=p.to,b=p.line;r[Li](e,S),e.setData(b);var M=e.get(_),k=e.get(x);r[Qe](M)||(M=[M,M]),typeof k===Ri&&(k=[k,k]),p.from.each(function(t){o(m,t,!0),o(g,t)}),b.each(function(t){var e=b[me](t).get("lineStyle.normal.color");b[Y](t,{color:e||m[L](t,"color")}),b[P](t,[m[z](t),g[z](t)])}),f[w](b,m,g),p.line[Nt](function(t,i){t[Xt](function(t){t[H]=e})}),f.__keep=!0}})}),e("echarts/component/markLine",[ji,"./marker/MarkLineModel","./marker/MarkLineView"],function(t){t("./marker/MarkLineModel"),t("./marker/MarkLineView")}),e("echarts/component/dataZoom/typeDefaulter",[ji,"../../model/Component"],function(t){t("../../model/Component").registerSubTypeDefaulter(q,function(t){return"slider"})}),e("echarts/component/dataZoom/AxisProxy",[ji,Wi,M],function(t){function e(t,e){var i=[Number.MAX_VALUE,Number.MIN_VALUE];return o(e,function(e){var n=e[be]();n&&o(e.getDimensionsOnAxis(t),function(t){var e=n[R](t);e[0]<i[0]&&(i[0]=e[0]),e[1]>i[1]&&(i[1]=e[1])})},this),i}function i(t,e,i){var r=[0,100],l=t[ti],c=[l.start,l.end],u=[l.startValue,l.endValue],h=["floor","ceil"];return o([0,1],function(t){var o,s=u[t],l=!0;n(s)&&(o=c[t],n(o)&&(o=r[t]),s=a[Ke](o,r,e,!0),l=!1),i&&(s=Math[h[t]](s)),l&&(o=a[Ke](s,e,r,!0)),u[t]=s,c[t]=o}),{valueWindow:s(u),percentWindow:s(c)}}function n(t){return isNaN(t)||null==t}var r=t(Wi),a=t(M),o=r.each,s=a.asc,l=function(t,e,i,n){this._dimName=t,this._axisIndex=e,this._backup,this._valueWindow,this._percentWindow,this._dataExtent,this[oi]=n,this._model=i};return l[qi]={constructor:l,hostedBy:function(t){return this._model===t},backup:function(t,e){t===this._model&&(this._backup=e)},getBackup:function(){return r.clone(this._backup)},getDataExtent:function(){return this._dataExtent.slice()},getDataValueWindow:function(){return this._valueWindow.slice()},getDataPercentWindow:function(){return this._percentWindow.slice()},getTargetSeriesModels:function(){var t=[];return this[oi][U](function(e){this._axisIndex===e.get(this._dimName+"AxisIndex")&&t.push(e)},this),t},getAxisModel:function(){return this[oi][Ae](this._dimName+"Axis",this._axisIndex)},getOtherAxisModel:function(){var t,e,i=this._dimName,n=this[oi],r=this.getAxisModel(),a="x"===i||"y"===i;a?(e="gridIndex",t="x"===i?"y":"x"):(e="polarIndex",t="angle"===i?Ce:"angle");var o;return n[W](t+"Axis",function(t){(t.get(e)||0)===(r.get(e)||0)&&(o=t)}),o},reset:function(t){if(t===this._model){var n=this._dimName,r=this.getAxisModel(),a=r.get("type")===C,o=this.getTargetSeriesModels(),s=e(n,o),l=i(t,s,a);this._dataExtent=s.slice(),this._valueWindow=l.valueWindow.slice(),this._percentWindow=l.percentWindow.slice()}},filterData:function(t){function e(t){return t>=a[0]&&t<=a[1]}if(t===this._model){var i=this._dimName,n=this.getTargetSeriesModels(),r=t.get("filterMode"),a=this._valueWindow,s=this.getOtherAxisModel();t.get("$fromToolbox")&&s&&s.get("type")===C&&(r="empty"),o(n,function(t){var n=t[be]();n&&o(t.getDimensionsOnAxis(i),function(i){"empty"===r?t.setData(n.map(i,function(t){return e(t)?t:NaN})):n.filterSelf(i,e)})})}}},l}),e("echarts/component/dataZoom/DataZoomModel",[ji,Wi,"zrender/core/env",n,T,"./AxisProxy"],function(t){var e=t(Wi),i=t("zrender/core/env"),r=t(n),a=t(T),o=t("./AxisProxy"),s=e.each,l=a.eachAxisDim;return r[Z]({type:"dataZoom",dependencies:["xAxis","yAxis","zAxis","radiusAxis","angleAxis",Be],defaultOption:{zlevel:0,z:4,orient:null,xAxisIndex:null,yAxisIndex:null,filterMode:"filter",throttle:100,start:0,end:100,startValue:null,endValue:null},init:function(t,e,i){this._autoMode,this._dataIntervalByAxis={},this._dataInfo={},this._axisProxies={},this.textStyleModel,this[Ne](t,i),this[Ee]({},!0)},mergeOption:function(t,n){var r=this[ti];t&&e.merge(r,t),i[K]||(r.realtime=!1),this.textStyleModel=this[ai](ri),this._resetTarget(t,n),this._giveAxisProxies(),this._backup()},_giveAxisProxies:function(){var t=this._axisProxies;this.eachTargetAxis(function(e,i,n,r){var a=this.dependentModels[e.axis][i],s=a.__dzAxisProxy||(a.__dzAxisProxy=new o(e.name,i,this,r));t[e.name+"_"+i]=s},this)},_resetTarget:function(t,e){this._resetAutoMode(t,e);var i=this[ti];l(function(t){var e=t[ke];i[e]=n===ke?[]:a.normalizeToArray(i[e])},this);var n=this._autoMode;n===ke?this._autoSetAxisIndex():"orient"===n&&this._autoSetOrient()},_resetAutoMode:function(t,e){var i=e?this[ti]:t,n=!1;l(function(t){null!=i[t[ke]]&&(n=!0)},this);var r=i.orient;null==r&&n?this._autoMode="orient":(null==r&&(this[ti].orient=Ge),n||(this._autoMode=ke))},_autoSetAxisIndex:function(){var t=this._autoMode===ke,i=this.get("orient"),n=this[ti];if(t){var r=i===Fe?{dim:"y",axisIndex:"yAxisIndex",axis:"yAxis"}:{dim:"x",axisIndex:"xAxisIndex",axis:"xAxis"};this.dependentModels[r.axis][Fi]&&(n[r[ke]]=[0],t=!1)}t&&l(function(e){if(t){var i=[],r=this.dependentModels[e.axis];if(r[Fi]&&!i[Fi])for(var a=0,o=r[Fi];o>a;a++)r[a].get("type")===C&&i.push(a);n[e[ke]]=i,i[Fi]&&(t=!1)}},this),t&&this[oi][U](function(t){this._isSeriesHasAllAxesTypeOf(t,"value")&&l(function(i){var r=n[i[ke]],a=t.get(i[ke]);e[Ei](r,a)<0&&r.push(a)})},this)},_autoSetOrient:function(){var t;this.eachTargetAxis(function(e){!t&&(t=e.name)},this),this[ti].orient="y"===t?Fe:Ge},_isSeriesHasAllAxesTypeOf:function(t,e){var i=!0;return l(function(n){var r=t.get(n[ke]),a=this.dependentModels[n.axis][r];a&&a.get("type")===e||(i=!1)},this),i},_backup:function(){this.eachTargetAxis(function(t,e,i,n){var r=n[Ae](t.axis,e);this.getAxisProxy(t.name,e).backup(this,{scale:r.get("scale",!0),min:r.get("min",!0),max:r.get("max",!0)})},this)},getFirstTargetAxisModel:function(){var t;return l(function(e){if(null==t){var i=this.get(e[ke]);i[Fi]&&(t=this.dependentModels[e.axis][i[0]])}},this),t},eachTargetAxis:function(t,e){var i=this[oi];l(function(n){s(this.get(n[ke]),function(r){t.call(e,n,r,this,i)},this)},this)},getAxisProxy:function(t,e){return this._axisProxies[t+"_"+e]},setRawRange:function(t){s(["start","end","startValue","endValue"],function(e){this[ti][e]=t[e]},this)},getPercentRange:function(){var t=this._axisProxies;for(var e in t)if(t.hasOwnProperty(e)&&t[e].hostedBy(this))return t[e].getDataPercentWindow();for(var e in t)if(t.hasOwnProperty(e)&&!t[e].hostedBy(this))return t[e].getDataPercentWindow()}})}),e("echarts/component/dataZoom/DataZoomView",[ji,"../../view/Component"],function(t){var e=t("../../view/Component");return e[Li]({type:"dataZoom",render:function(t,e,i,n){this.dataZoomModel=t,this[oi]=e,this.api=i},getTargetInfo:function(){function t(t,e,i,n){for(var r,a=0;a<i[Fi];a++)if(i[a].model===t){r=i[a];break}r||i.push(r={model:t,axisModels:[],coordIndex:n}),r.axisModels.push(e)}var e=this.dataZoomModel,i=this[oi],n=[],r=[],a=[];return e.eachTargetAxis(function(e,o){var s=i[Ae](e.axis,o);if(s){a.push(s);var l=s.get("gridIndex"),c=s.get("polarIndex");if(null!=l){var u=i[Ae]("grid",l);t(u,s,n,l)}else if(null!=c){var u=i[Ae]("polar",c);t(u,s,r,c)}}},this),{cartesians:n,polars:r,axisModels:a}}})}),e("echarts/component/dataZoom/SliderZoomModel",[ji,"./DataZoomModel"],function(t){var e=t("./DataZoomModel");return e[Li]({type:"dataZoom.slider",layoutMode:"box",defaultOption:{show:!0,left:"auto",right:"auto",top:"auto",bottom:"auto",width:"auto",height:"auto",backgroundColor:"rgba(47,69,84,0)",dataBackgroundColor:"#ddd",fillerColor:"rgba(47,69,84,0.25)",handleColor:"rgba(47,69,84,0.65)",handleSize:10,labelPrecision:null,labelFormatter:null,showDetail:!0,showDataShadow:"auto",realtime:!0,zoomLock:!1,textStyle:{color:"#333"}}})}),e("echarts/util/throttle",[],function(){var t={},e="\x00__throttleOriginMethod",i="\x00__throttleRate";return t.throttle=function(t,e,i,n){function r(r){function f(){u=(new Date).getTime(),h=null,(d?t:t[r]).apply(o,s||[])}var p=function(){l=(new Date).getTime(),o=this,s=arguments,a=l-(n?c:u)-e,clearTimeout(h),n?i?h=setTimeout(f,e):a>=0&&f():a>=0?f():i&&(h=setTimeout(f,-a)),c=l};return p.clear=function(){h&&(clearTimeout(h),h=null)},p}var a,o,s,l=(new Date).getTime(),c=0,u=0,h=null,d=typeof t===Ii;if(e=e||0,d)return r();for(var f=[],p=0;p<t[Fi];p++)f[p]=r(p);return f},t.fixRate=function(e,i){return null!=i?t.throttle(e,i,!0,!1):e},t.debounce=function(e,i){return null!=i?t.throttle(e,i,!0,!0):e},t.createOrUpdate=function(n,r,a,o){var s=n[r];if(s&&null!=a&&o){var l=s[e]||s,c=s[i];c!==a&&(s=n[r]=t[o](l,a),s[e]=l,s[i]=a)}},t.clear=function(t,i){var n=t[i];n&&n[e]&&(t[i]=n[e])},t}),e("echarts/component/helper/sliderMove",[ji],function(t){return function(t,e,i,n,r){function a(t,e,i){var n=e[Fi]?e.slice():[e,e];return e[0]>e[1]&&n.reverse(),0>t&&n[0]+t<i[0]&&(t=i[0]-n[0]),t>0&&n[1]+t>i[1]&&(t=i[1]-n[1]),t}return t?("rigid"===n?(t=a(t,e,i),e[0]+=t,e[1]+=t):(t=a(t,e[r],i),e[r]+=t,"push"===n&&e[0]>e[1]&&(e[1-r]=e[r])),e):e}}),e("echarts/component/dataZoom/SliderZoomView",[ji,Wi,S,"../../util/throttle","./DataZoomView",M,"../../util/layout","../helper/sliderMove"],function(t){function e(t){return"x"===t?"y":"x"}var n=t(Wi),a=t(S),s=t("../../util/throttle"),l=t("./DataZoomView"),c=a.Rect,u=t(M),h=u[Ke],d=t("../../util/layout"),p=t("../helper/sliderMove"),v=u.asc,m=n.bind,g=Math.round,y=Math.max,_=n.each,x=7,b=1,w=30,k=Ge,T=Fe,D=5,L=["line","bar","candlestick","scatter"];return l[Li]({type:"dataZoom.slider",init:function(t,e){this._displayables={},this._orient,this._range,this._handleEnds,this._size,this._halfHandleSize,this._location,this._dragging,this._dataShadowInfo,this.api=e},render:function(t,e,i,n){return this.$superApply(Wt,arguments),s.createOrUpdate(this,"_dispatchZoomAction",this.dataZoomModel.get("throttle"),"fixRate"),this._orient=t.get("orient"),this._halfHandleSize=g(t.get("handleSize")/2),this.dataZoomModel.get("show")===!1?void this.group[qt]():(n&&n.type===q&&n.from===this.uid||this._buildView(),void this._updateView())},remove:function(){this.$superApply(Qt,arguments),s.clear(this,"_dispatchZoomAction")},dispose:function(){this.$superApply(Q,arguments),s.clear(this,"_dispatchZoomAction")},_buildView:function(){var t=this.group;t[qt](),this._resetLocation(),this._resetInterval();var e=this._displayables.barGroup=new a.Group;this._renderBackground(),this._renderDataShadow(),this._renderHandle(),t.add(e),this._positionGroup()},_resetLocation:function(){var t=this.dataZoomModel,e=this.api,r=this._findCoordRect(),a={width:e[Pe](),height:e[Le]()},o=this._orient===k?{left:r.x,top:a[gi]-w-x,width:r.width,height:w}:{right:x,top:r.y,width:w,height:r[gi]};n.each(d.getLayoutParams(t[ti]),function(t,e){"auto"!==t&&(o[e]=t)});var s=d[Ve](o,a,t[i]);this._location={x:s.x,y:s.y},this._size=[s.width,s[gi]],this._orient===T&&this._size.reverse()},_positionGroup:function(){var t=this.group,e=this._location,i=this._orient,n=this.dataZoomModel.getFirstTargetAxisModel(),r=n&&n.get("inverse"),a=this._displayables.barGroup,o=(this._dataShadowInfo||{}).otherAxisInverse;a.attr(i!==k||r?i===k&&r?{scale:o?[-1,1]:[-1,-1]}:i!==T||r?{scale:o?[-1,-1]:[-1,1],rotation:Math.PI/2}:{scale:o?[1,-1]:[1,1],rotation:Math.PI/2}:{scale:o?[1,1]:[1,-1]});var s=t[ni]([a]);t[We][0]=e.x-s.x,t[We][1]=e.y-s.y},_getViewExtent:function(){var t=this._halfHandleSize,e=y(this._size[0],4*t),i=[t,e-t];return i},_renderBackground:function(){var t=this.dataZoomModel,e=this._size;this._displayables.barGroup.add(new c({silent:!0,shape:{x:0,y:0,width:e[0],height:e[1]},style:{fill:t.get(tt)}}))},_renderDataShadow:function(){var t=this._dataShadowInfo=this._prepareDataShadowInfo();if(t){var e=this._size,i=t[Be],n=i.getRawData(),r=i.getShadowDim?i.getShadowDim():t.otherDim,o=n[R](r),s=.3*(o[1]-o[0]);o=[o[0]-s,o[1]+s];var l=[0,e[1]],c=[0,e[0]],u=[[e[0],0],[0,0]],d=c[1]/(n.count()-1),f=0,p=Math.round(n.count()/e[0]);n.each([r],function(t,e){if(p>0&&e%p)return void(f+=d);var i=null==t||isNaN(t)||""===t?null:h(t,o,l,!0);null!=i&&u.push([f,i]),f+=d}),this._displayables.barGroup.add(new a[St]({shape:{points:u},style:{fill:this.dataZoomModel.get("dataBackgroundColor"),lineWidth:0},silent:!0,z2:-20}))}},_prepareDataShadowInfo:function(){var t=this.dataZoomModel,i=t.get("showDataShadow");if(i!==!1){var r,a=this[oi];return t.eachTargetAxis(function(o,s){var l=t.getAxisProxy(o.name,s).getTargetSeriesModels();n.each(l,function(t){if(!(r||i!==!0&&n[Ei](L,t.get("type"))<0)){var l=e(o.name),c=a[Ae](o.axis,s).axis;r={thisAxis:c,series:t,thisDim:o.name,otherDim:l,otherAxisInverse:t[A][f](c).inverse}}},this)},this),r}},_renderHandle:function(){var t=this._displayables,e=t.handles=[],i=t.handleLabels=[],n=this._displayables.barGroup,r=this._size;n.add(t.filler=new c({draggable:!0,cursor:"move",drift:m(this._onDragMove,this,"all"),ondragend:m(this._onDragEnd,this),onmouseover:m(this._showDataInfo,this,!0),onmouseout:m(this._showDataInfo,this,!1),style:{fill:this.dataZoomModel.get("fillerColor"),textPosition:"inside"}})),n.add(new c(a[wt]({silent:!0,shape:{x:0,y:0,width:r[0],height:r[1]},style:{stroke:this.dataZoomModel.get("dataBackgroundColor"),lineWidth:b,fill:"rgba(0,0,0,0)"}}))),_([0,1],function(t){n.add(e[t]=new c({style:{fill:this.dataZoomModel.get("handleColor")},cursor:"move",draggable:!0,drift:m(this._onDragMove,this,t),ondragend:m(this._onDragEnd,this),onmouseover:m(this._showDataInfo,this,!0),onmouseout:m(this._showDataInfo,this,!1)}));var r=this.dataZoomModel.textStyleModel;this.group.add(i[t]=new a.Text({silent:!0,invisible:!0,style:{x:0,y:0,text:"",textBaseline:"middle",textAlign:"center",fill:r[mt](),textFont:r[ii]()}}))},this)},_resetInterval:function(){var t=this._range=this.dataZoomModel.getPercentRange();this._handleEnds=h(t,[0,100],this._getViewExtent(),!0)},_updateInterval:function(t,e){var i=this._handleEnds,n=this._getViewExtent();p(e,i,n,"all"===t||this.dataZoomModel.get("zoomLock")?"rigid":"cross",t),this._range=v(h(i,n,[0,100],!0))},_updateView:function(){var t=this._displayables,e=this._handleEnds,i=v(e.slice()),n=this._size,r=this._halfHandleSize;_([0,1],function(i){var a=t.handles[i];a[At]({x:e[i]-r,y:-1,width:2*r,height:n[1]+2,r:1})},this),t.filler[At]({x:i[0],y:0,width:i[1]-i[0],height:this._size[1]}),this._updateDataInfo()},_updateDataInfo:function(){function t(t){var e=a.getTransform(i.handles[t],this.group),s=a.transformDirection(0===t?"right":"left",e),l=this._halfHandleSize+D,u=a[yi]([c[t]+(0===t?-l:l),this._size[1]/2],e);n[t][bt]({x:u[0],y:u[1],textBaseline:r===k?hi:s,textAlign:r===k?s:ui,text:o[t]})}var e=this.dataZoomModel,i=this._displayables,n=i.handleLabels,r=this._orient,o=["",""];if(e.get("showDetail")){var s,l;e.eachTargetAxis(function(t,i){s||(s=e.getAxisProxy(t.name,i).getDataValueWindow(),l=this[oi][Ae](t.axis,i).axis)},this),s&&(o=[this._formatLabel(s[0],l),this._formatLabel(s[1],l)])}var c=v(this._handleEnds.slice());t.call(this,0),t.call(this,1)},_formatLabel:function(t,e){var i=this.dataZoomModel,r=i.get("labelFormatter");if(n.isFunction(r))return r(t);var a=i.get("labelPrecision");return(null==a||"auto"===a)&&(a=e[Xe]()),t=null==t&&isNaN(t)?"":e.type===C||"time"===e.type?e.scale[o](Math.round(t)):t[Ye](Math.min(a,20)),n[Re](r)&&(t=r[Je]("{value}",t)),t},_showDataInfo:function(t){t=this._dragging||t;var e=this._displayables.handleLabels;e[0].attr(Ut,!t),e[1].attr(Ut,!t)},_onDragMove:function(t,e,i){this._dragging=!0;var n=this._applyBarTransform([e,i],!0);this._updateInterval(t,n[0]),this._updateView(),this.dataZoomModel.get("realtime")&&this._dispatchZoomAction()},_onDragEnd:function(){this._dragging=!1,this._showDataInfo(!1),this._dispatchZoomAction()},_dispatchZoomAction:function(){var t=this._range;this.api[De]({type:"dataZoom",from:this.uid,dataZoomId:this.dataZoomModel.id,start:t[0],end:t[1]})},_applyBarTransform:function(t,e){var i=this._displayables.barGroup[ce]();return a[yi](t,i,e)},_findCoordRect:function(){var t,e=this.getTargetInfo();if(e.cartesians[Fi])t=e.cartesians[0].model[A][r]();else{var i=this.api[Pe](),n=this.api[Le]();t={x:.2*i,y:.2*n,width:.6*i,height:.6*n}}return t}})}),e("echarts/component/dataZoom/InsideZoomModel",[ji,"./DataZoomModel"],function(t){var e=t("./DataZoomModel");return e[Li]({type:"dataZoom.inside",defaultOption:{zoomLock:!1}})}),e("echarts/component/helper/interactionMutex",[ji],function(t){function e(t){return t[i]||(t[i]={})}var i="\x00_ec_interaction_mutex",n={take:function(t,i){e(i)[t]=!0},release:function(t,i){e(i)[t]=!1},isTaken:function(t,i){return!!e(i)[t]}};return n}),e("echarts/component/helper/RoamController",[ji,fe,Wi,ft,"./interactionMutex"],function(t){function e(t){if(!t[oe]||!t[oe][ee]){var e=t[ht],i=t[ut],n=this.rect;n&&n[Rt](e,i)&&(this._x=e,this._y=i,this._dragging=!0)}}function i(t){if(this._dragging&&(u.stop(t.event),"pinch"!==t.gestureEvent)){if(h.isTaken("globalPan",this._zr))return;var e=t[ht],i=t[ut],n=e-this._x,r=i-this._y;this._x=e,this._y=i;var a=this[oe];if(a){var o=a[We];o[0]+=n,o[1]+=r,a.dirty()}u.stop(t.event),this[Ht]("pan",n,r)}}function n(t){this._dragging=!1}function r(t){u.stop(t.event);var e=t.wheelDelta>0?1.1:1/1.1;o.call(this,t,e,t[ht],t[ut])}function a(t){if(!h.isTaken("globalPan",this._zr)){u.stop(t.event);var e=t.pinchScale>1?1.1:1/1.1;o.call(this,t,e,t.pinchX,t.pinchY)}}function o(t,e,i,n){var r=this.rect;if(r&&r[Rt](i,n)){var a=this[oe];if(a){var o=a[We],s=a.scale,l=this._zoom=this._zoom||1;l*=e;var c=l/this._zoom;this._zoom=l,o[0]-=(i-o[0])*(c-1),o[1]-=(n-o[1])*(c-1),s[0]*=c,s[1]*=c,a.dirty()}this[Ht]("zoom",e,i,n)}}function s(t,o,s){this[oe]=o,this.rect=s,this._zr=t;var u=c.bind,h=u(e,this),d=u(i,this),f=u(n,this),p=u(r,this),v=u(a,this);l.call(this),this.enable=function(e){this.disable(),null==e&&(e=!0),e&&"scale"!==e&&(t.on("mousedown",h),t.on(dt,d),t.on("mouseup",f)),e&&"move"!==e&&(t.on("mousewheel",p),t.on("pinch",v))},this.disable=function(){t.off("mousedown",h),t.off(dt,d),t.off("mouseup",f),t.off("mousewheel",p),t.off("pinch",v)},this[Q]=this.disable,this.isDragging=function(){return this._dragging},this.isPinching=function(){return this._pinching}}var l=t(fe),c=t(Wi),u=t(ft),h=t("./interactionMutex");return c.mixin(s,l),s}),e("echarts/component/dataZoom/InsideZoomView",[ji,"./DataZoomView","../../util/throttle",Wi,"../helper/sliderMove","../../component/helper/RoamController"],function(t){function e(t,e,i,r){e=e.slice();var a=r.axisModels[0];if(a){var o=n(t,a,i),s=o.signal*(e[1]-e[0])*o.pixel/o.pixelLength;return c(s,e,[0,100],"rigid"),e}}function i(t,e,i,r,o,s){i=i.slice();var l=o.axisModels[0];if(l){var c=n(e,l,r),u=c.pixel-c.pixelStart,h=u/c.pixelLength*(i[1]-i[0])+i[0];return t=Math.max(t,0),i[0]=(i[0]-h)*t+h,i[1]=(i[1]-h)*t+h,a(i)}}function n(t,e,i){var n=e.axis,r=i.rect,a={};return"x"===n.dim?(a.pixel=t[0],a.pixelLength=r.width,a.pixelStart=r.x,a.signal=n.inverse?1:-1):(a.pixel=t[1],a.pixelLength=r[gi],a.pixelStart=r.y,a.signal=n.inverse?-1:1),a}function a(t){var e=[0,100];return!(t[0]<=e[1])&&(t[0]=e[1]),!(t[1]<=e[1])&&(t[1]=e[1]),!(t[0]>=e[0])&&(t[0]=e[0]),!(t[1]>=e[0])&&(t[1]=e[0]),t}var o=t("./DataZoomView"),s=t("../../util/throttle"),l=t(Wi),c=t("../helper/sliderMove"),u=t("../../component/helper/RoamController"),h=l.bind;return o[Li]({type:"dataZoom.inside",init:function(t,e){this._controllers={},this._range},render:function(t,e,i,n){this.$superApply(Wt,arguments),s.createOrUpdate(this,"_dispatchZoomAction",this.dataZoomModel.get("throttle"),"fixRate"),n&&n.type===q&&n.from===this.uid||(this._range=t.getPercentRange()),this._resetController(i)},remove:function(){this.$superApply(Qt,arguments);var t=this._controllers;l.each(t,function(t){t.off("pan").off("zoom")}),t[Fi]=0,s.clear(this,"_dispatchZoomAction")},dispose:function(){this.$superApply(Q,arguments),s.clear(this,"_dispatchZoomAction")},_resetController:function(t){var e=this._controllers,i=this.getTargetInfo();l.each(i.cartesians,function(i){var n="cartesian"+i.coordIndex,a=e[n];a||(a=e[n]=new u(t.getZr()),a.enable(),a.on("pan",h(this._onPan,this,a,i)),a.on("zoom",h(this._onZoom,this,a,i))),a.rect=i.model[A][r]().clone()},this)},_onPan:function(t,i,n,r){var a=this._range=e([n,r],this._range,t,i);a&&this._dispatchZoomAction(a)},_onZoom:function(t,e,n,r,a){var o=this.dataZoomModel;if(!o[ti].zoomLock){n=1/n;var s=this._range=i(n,[r,a],this._range,t,e,o);this._dispatchZoomAction(s)}},_dispatchZoomAction:function(t){this.api[De]({type:"dataZoom",from:this.uid,dataZoomId:this.dataZoomModel.id,start:t[0],end:t[1]})}})}),e("echarts/component/dataZoom/dataZoomProcessor",[ji,n,M],function(t){function e(t,e,i,n){var r=t.name,o=i.getAxisProxy(r,e);o.reset(i);var s=o.getDataPercentWindow(),l=o.getDataValueWindow(),c=n[Ae](t.axis,e),u=0===s[0]&&100===s[1],h=o.getBackup(),d=a[Xe](l,[0,500]),f=!(20>d&&d>=0);c.setNeedsCrossZero&&c.setNeedsCrossZero(u?!h.scale:!1),c.setMin&&c.setMin(u||f?h.min:+l[0][Ye](d)),c.setMax&&c.setMax(u||f?h.max:+l[1][Ye](d))}function i(t,e,i,n){i.getAxisProxy(t.name,e).filterData(i)}var r=t(n),a=t(M);r[G](Hi,function(t,n){t[W](q,function(t){t.eachTargetAxis(e)}),t[W](q,function(t){t.eachTargetAxis(i)})})}),e("echarts/component/dataZoom/dataZoomAction",[ji,Wi,T,n],function(t){var e=t(Wi),i=t(T),r=t(n);r[F](q,function(t,n){var r=i.createLinkedNodesFinder(e.bind(n[W],n,q),i.eachAxisDim,function(t,e){return t.get(e[ke])}),a=[];n[W]({mainType:"dataZoom",query:t},function(t,e){a.push.apply(a,r(t).nodes)}),e.each(a,function(e,i){e.setRawRange({start:t.start,end:t.end,startValue:t.startValue,endValue:t.endValue})})})}),e("echarts/component/dataZoom",[ji,"./dataZoom/typeDefaulter","./dataZoom/DataZoomModel","./dataZoom/DataZoomView","./dataZoom/SliderZoomModel","./dataZoom/SliderZoomView","./dataZoom/InsideZoomModel","./dataZoom/InsideZoomView","./dataZoom/dataZoomProcessor","./dataZoom/dataZoomAction"],function(t){t("./dataZoom/typeDefaulter"),t("./dataZoom/DataZoomModel"),t("./dataZoom/DataZoomView"),t("./dataZoom/SliderZoomModel"),t("./dataZoom/SliderZoomView"),t("./dataZoom/InsideZoomModel"),t("./dataZoom/InsideZoomView"),t("./dataZoom/dataZoomProcessor"),t("./dataZoom/dataZoomAction")}),e("echarts/component/toolbox/featureManager",[ji],function(t){var e={};return{register:function(t,i){e[t]=i},get:function(t){return e[t]}}}),e("echarts/component/toolbox/ToolboxModel",[ji,"./featureManager",Wi,n],function(t){var e=t("./featureManager"),i=t(Wi);t(n)[Z]({type:"toolbox",mergeDefaultAndTheme:function(t){this.$superApply(Ne,arguments),i.each(this[ti].feature,function(t,n){var r=e.get(n);r&&i.merge(t,r.defaultOption)})},defaultOption:{show:!0,z:6,zlevel:0,orient:"horizontal",left:"right",top:"top",backgroundColor:"transparent",borderColor:"#ccc",borderWidth:0,padding:5,itemSize:15,itemGap:8,showTitle:!0,iconStyle:{normal:{borderColor:"#666",color:"none"},emphasis:{borderColor:"#3E98C5"}}}})}),e("echarts/component/toolbox/ToolboxView",[ji,"./featureManager",Wi,S,"../../model/Model","../../data/DataDiffer","../helper/listComponent",vi,n],function(t){var e=t("./featureManager"),i=t(Wi),r=t(S),a=t("../../model/Model"),o=t("../../data/DataDiffer"),s=t("../helper/listComponent"),l=t(vi);return t(n)[E]({type:"toolbox",render:function(t,n,c){function u(i,r){var o,s=y[i],l=y[r],u=p[s],d=new a(u,t,t[oi]);if(s&&!l){var f=e.get(s);if(!f)return;m[s]=o=new f(d)}else{if(o=m[l],!o)return;o.model=d}return!s&&l?void(o[Q]&&o[Q](n,c)):d.get("show")?(h(d,o,s),d.setIconStatus=function(t,e){var i=this[ti],n=this.iconPaths;i.iconStatus=i.iconStatus||{},i.iconStatus[t]=e,n[t]&&n[t][Ht](e)},void(o[Wt]&&o[Wt](d,n,c))):void(o[Qt]&&o[Qt](n,c))}function h(e,a,o){
var s=e[ai]("iconStyle"),l=a.getIcons?a.getIcons():e.get("icon"),u=e.get("title")||{};if(typeof l===Bi){var h=l,p=u;l={},u={},l[o]=h,u[o]=p}var v=e.iconPaths={};i.each(l,function(o,l){var h=s[ai](Me)[g](),p=s[ai](Se)[g](),m=r.makePath(o,{style:h,hoverStyle:p,rectHover:!0},{x:-f/2,y:-f/2,width:f,height:f},ui);r[_t](m),t.get("showTitle")&&(m.__title=u[l],m.on(yt,function(){m[bt]({text:u[l],textPosition:p[Zt]||di,textFill:p.fill||p[Si]||"#000",textAlign:p[Et]||ui})}).on(gt,function(){m[bt]({textFill:null})})),m[Ht](e.get("iconStatus."+l)||Me),d.add(m),m.on("click",i.bind(a.onclick,a,n,c,l)),v[l]=m})}var d=this.group;if(d[qt](),t.get("show")){var f=+t.get("itemSize"),p=t.get("feature")||{},m=this._features||(this._features={}),y=[];i.each(p,function(t,e){y.push(e)}),new o(this._featureNames||[],y).add(u)[at](u)[Qt](i.curry(u,null))[v](),this._featureNames=y,s.layout(d,t,c),s.addBackground(d,t),d[qe](function(t){var e=t.__title,i=t[xt];if(i&&e){var n=l[ni](e,i.font),r=t[We][0]+d[We][0],a=t[We][1]+d[We][1]+f,o=!1;a+n[gi]>c[Le]()&&(i[Zt]="top",o=!0);var s=o?-5-n[gi]:f+8;r+n.width/2>c[Pe]()?(i[Zt]=["100%",s],i[Et]="right"):r-n.width/2<0&&(i[Zt]=[0,s],i[Et]="left")}})}},remove:function(t,e){i.each(this._features,function(i){i[Qt]&&i[Qt](t,e)}),this.group[qt]()},dispose:function(t,e){i.each(this._features,function(i){i[Q]&&i[Q](t,e)})}})}),e("echarts/component/toolbox/feature/SaveAsImage",[ji,"../featureManager"],function(t){function e(t){this.model=t}e.defaultOption={show:!0,icon:"M4.7,22.9L29.3,45.5L54.7,23.4M4.6,43.6L4.6,58L53.8,58L53.8,43.6            M29.2,45.1L29.2,0",title:"保存为图片",type:"png",name:"",excludeComponents:["toolbox"],pixelRatio:1};var i=e[qi];return i.onclick=function(t,e){var i=this.model,n=t.get("title.0.text")||"echarts",r=document[Vi]("a"),a=i.get("type",!0)||"png";r.download=n+"."+a,r[oe]="_blank",r.href=e.getConnectedDataURL({type:a,backgroundColor:i.get(tt,!0)||t.get(tt)||"#fff",excludeComponents:i.get("excludeComponents"),pixelRatio:i.get("pixelRatio")}),r.click()},t("../featureManager")[Te]("saveAsImage",e),e}),e("echarts/component/toolbox/feature/MagicType",[ji,Wi,"../../../echarts","../featureManager"],function(t){function e(t){this.model=t}var i=t(Wi);e.defaultOption={show:!0,type:[],icon:{line:"M4.1,28.9h7.1l9.3-22l7.4,38l9.7-19.7l3,12.8h14.9M4.1,58h51.4",bar:"M6.7,22.9h10V48h-10V22.9zM24.9,13h10v35h-10V13zM43.2,2h10v46h-10V2zM3.1,58h53.7",stack:"M8.2,38.4l-8.4,4.1l30.6,15.3L60,42.5l-8.1-4.1l-21.5,11L8.2,38.4z M51.9,30l-8.1,4.2l-13.4,6.9l-13.9-6.9L8.2,30l-8.4,4.2l8.4,4.2l22.2,11l21.5-11l8.1-4.2L51.9,30z M51.9,21.7l-8.1,4.2L35.7,30l-5.3,2.8L24.9,30l-8.4-4.1l-8.3-4.2l-8.4,4.2L8.2,30l8.3,4.2l13.9,6.9l13.4-6.9l8.1-4.2l8.1-4.1L51.9,21.7zM30.4,2.2L-0.2,17.5l8.4,4.1l8.3,4.2l8.4,4.2l5.5,2.7l5.3-2.7l8.1-4.2l8.1-4.2l8.1-4.1L30.4,2.2z",tiled:"M2.3,2.2h22.8V25H2.3V2.2z M35,2.2h22.8V25H35V2.2zM2.3,35h22.8v22.8H2.3V35z M35,35h22.8v22.8H35V35z"},title:{line:"切换为折线图",bar:"切换为柱状图",stack:"切换为堆叠",tiled:"切换为平铺"},option:{},seriesIndex:{}};var n=e[qi];n.getIcons=function(){var t=this.model,e=t.get("icon"),n={};return i.each(t.get("type"),function(t){e[t]&&(n[t]=e[t])}),n};var r={line:function(t,e,n,r){return"bar"===t?i.merge({id:e,type:"line",data:n.get("data"),stack:n.get("stack")},r.get("option.line")):void 0},bar:function(t,e,n,r){return"line"===t?i.merge({id:e,type:"bar",data:n.get("data"),stack:n.get("stack")},r.get("option.bar")):void 0},stack:function(t,e,i,n){return"line"===t||"bar"===t?{id:e,stack:"__ec_magicType_stack__"}:void 0},tiled:function(t,e,i,n){return"line"===t||"bar"===t?{id:e,stack:""}:void 0}},a=[["line","bar"],["stack","tiled"]];n.onclick=function(t,e,n){var o=this.model,s=o.get("seriesIndex."+n);if(r[n]){var l={series:[]},c=function(t){var e=t.subType,a=t.id,s=r[n](e,a,t,o);s&&(i[li](s,t[ti]),l[Be].push(s))};i.each(a,function(t){i[Ei](t,n)>=0&&i.each(t,function(t){o.setIconStatus(t,Me)})}),o.setIconStatus(n,Se),t[W]({mainType:"series",seriesIndex:s},c),e[De]({type:"changeMagicType",currentType:n,newOption:l})}};var o=t("../../../echarts");return o[F]({type:"changeMagicType",event:"magicTypeChanged",update:"prepareAndUpdate"},function(t,e){e[Ee](t.newOption)}),t("../featureManager")[Te]("magicType",e),e}),e("echarts/component/toolbox/feature/DataView",[ji,Wi,ft,"../featureManager","../../../echarts"],function(t){function e(t){var e={},i=[],n=[];return t.eachRawSeries(function(t){var r=t[A];if(!r||"cartesian2d"!==r.type&&"polar"!==r.type)i.push(t);else{var a=r[p]();if(a.type===C){var o=a.dim+"_"+a.index;e[o]||(e[o]={categoryAxis:a,valueAxis:r[f](a),series:[]},n.push({axisDim:a.dim,axisIndex:a.index})),e[o][Be].push(t)}else i.push(t)}}),{seriesGroupByCategoryAxis:e,other:i,meta:n}}function i(t){var e=[];return d.each(t,function(t,i){var n=t.categoryAxis,r=t.valueAxis,a=r.dim,o=[" "][Oi](d.map(t[Be],function(t){return t.name})),s=[n.model.getCategories()];d.each(t[Be],function(t){s.push(t.getRawData()[O](a,function(t){return t}))});for(var l=[o.join(g)],c=0;c<s[0][Fi];c++){for(var u=[],h=0;h<s[Fi];h++)u.push(s[h][c]);l.push(u.join(g))}e.push(l.join("\n"))}),e.join("\n\n"+m+"\n\n")}function n(t){return d.map(t,function(t){var e=t.getRawData(),i=[t.name],n=[];return e.each(e[B],function(){for(var t=arguments[Fi],r=arguments[t-1],a=e[ge](r),o=0;t-1>o;o++)n[o]=arguments[o];i.push((a?a+g:"")+n.join(g))}),i.join("\n")}).join("\n\n"+m+"\n\n")}function r(t){var r=e(t);return{value:d[Hi]([i(r.seriesGroupByCategoryAxis),n(r.other)],function(t){return t[Je](/[\n\t\s]/g,"")}).join("\n\n"+m+"\n\n"),meta:r.meta}}function a(t){return t[Je](/^\s\s*/,"")[Je](/\s\s*$/,"")}function o(t){var e=t.slice(0,t[Ei]("\n"));return e[Ei](g)>=0?!0:void 0}function s(t){for(var e=t.split(/\n+/g),i=a(e.shift()).split(y),n=[],r=d.map(i,function(t){return{name:t,data:[]}}),o=0;o<e[Fi];o++){var s=a(e[o]).split(y);n.push(s.shift());for(var l=0;l<s[Fi];l++)r[l]&&(r[l].data[o]=s[l])}return{series:r,categories:n}}function l(t){for(var e=t.split(/\n+/g),i=a(e.shift()),n=[],r=0;r<e[Fi];r++){var o,s=a(e[r]).split(y),l="",c=!1;isNaN(s[0])?(c=!0,l=s[0],s=s.slice(1),n[r]={name:l,value:[]},o=n[r].value):o=n[r]=[];for(var u=0;u<s[Fi];u++)o.push(+s[u]);1===o[Fi]&&(c?n[r].value=o[0]:n[r]=o[0])}return{name:i,data:n}}function c(t,e){var i=t.split(new RegExp("\n*"+m+"\n*","g")),n={series:[]};return d.each(i,function(t,i){if(o(t)){var r=s(t),a=e[i],c=a.axisDim+"Axis";a&&(n[c]=n[c]||[],n[c][a[ke]]={data:r.categories},n[Be]=n[Be][Oi](r[Be]))}else{var r=l(t);n[Be].push(r)}}),n}function u(t){this._dom=null,this.model=t}function h(t,e){return d.map(t,function(t,i){var n=e&&e[i];return d[Ze](n)&&!d[Qe](n)?(d[Ze](t)&&!d[Qe](t)&&(t=t.value),d[li]({value:t},n)):t})}var d=t(Wi),v=t(ft),m=new Array(60).join("-"),g="	",y=new RegExp("["+g+"]+","g");return u.defaultOption={show:!0,readOnly:!1,icon:"M17.5,17.3H33 M17.5,17.3H33 M45.4,29.5h-28 M11.5,2v56H51V14.8L38.4,2H11.5z M38.4,2.2v12.7H51 M45.4,41.7h-28",title:"数据视图",lang:["数据视图","关闭","刷新"],backgroundColor:"#fff",textColor:"#000",textareaColor:"#fff",textareaBorderColor:"#333",buttonColor:"#c23531",buttonTextColor:"#fff"},u[qi].onclick=function(t,e){function i(){n.removeChild(o),_._dom=null}var n=e[ze](),a=this.model;this._dom&&n.removeChild(this._dom);var o=document[Vi]("div");o.style.cssText="position:absolute;left:5px;top:5px;bottom:5px;right:5px;",o.style[tt]=a.get(tt)||"#fff";var s=document[Vi]("h4"),l=a.get("lang")||[];s[it]=l[0]||a.get("title"),s.style.cssText="margin: 10px 20px;",s.style.color=a.get("textColor");var u=document[Vi]("textarea");u.style.cssText="display:block;width:100%;font-size:14px;line-height:1.6rem;font-family:Monaco,Consolas,Courier new,monospace",u.readOnly=a.get("readOnly"),u.style.color=a.get("textColor"),u.style.borderColor=a.get("textareaBorderColor"),u.style[tt]=a.get("textareaColor");var h=r(t);u.value=h.value;var d=h.meta,f=document[Vi]("div");f.style.cssText="position:absolute;bottom:0;left:0;right:0;";var p="float:right;margin-right:20px;border:none;cursor:pointer;padding:2px 5px;font-size:12px;border-radius:3px",m=document[Vi]("div"),y=document[Vi]("div");p+=";background-color:"+a.get("buttonColor"),p+=";color:"+a.get("buttonTextColor");var _=this;v.addEventListener(m,"click",i),v.addEventListener(y,"click",function(){var t;try{t=c(u.value,d)}catch(n){throw i(),new Error("Data view format error "+n)}e[De]({type:"changeDataView",newOption:t}),i()}),m[it]=l[1],y[it]=l[2],y.style.cssText=p,m.style.cssText=p,f[et](y),f[et](m),v.addEventListener(u,"keydown",function(t){if(9===(t.keyCode||t.which)){var e=this.value,i=this.selectionStart,n=this.selectionEnd;this.value=e.substring(0,i)+g+e.substring(n),this.selectionStart=this.selectionEnd=i+1,v.stop(t)}}),o[et](s),o[et](u),o[et](f),u.style[gi]=n[J]-80+"px",n[et](o),this._dom=o},u[qi][Qt]=function(t,e){this._dom&&e[ze]().removeChild(this._dom)},u[qi][Q]=function(t,e){this[Qt](t,e)},t("../featureManager")[Te]("dataView",u),t("../../../echarts")[F]({type:"changeDataView",event:"dataViewChanged",update:"prepareAndUpdate"},function(t,e){var i=[];d.each(t.newOption[Be],function(t){var n=e.getSeriesByName(t.name)[0];if(n){var r=n.get("data");i.push({name:t.name,data:h(t.data,r)})}else i.push(d[Li]({type:"scatter"},t))}),e[Ee](d[li]({series:i},t.newOption))}),u}),e("echarts/component/helper/SelectController",[ji,fe,Wi,S],function(t){function e(t,e,i){p.call(this),this.type=t,this.zr=e,this.opt=v.clone(i),this.group=new m.Group,this._containerRect=null,this._track=[],this._dragging,this._cover,this._disabled=!0,this._handlers={mousedown:g(r,this),mousemove:g(a,this),mouseup:g(o,this)},y(M,function(t){this.zr.on(t,this._handlers[t])},this)}function i(t,e){var i=this.group[se](t,e);return!this._containerRect||this._containerRect[Rt](i[0],i[1])}function n(t){var e=t.event;e.preventDefault&&e.preventDefault()}function r(t){if(!(this._disabled||t[oe]&&t[oe][ee])){n(t);var e=t[ht],r=t[ut];i.call(this,e,r)&&(this._dragging=!0,this._track=[[e,r]])}}function a(t){this._dragging&&!this._disabled&&(n(t),s.call(this,t))}function o(t){this._dragging&&!this._disabled&&(n(t),s.call(this,t,!0),this._dragging=!1,this._track=[])}function s(t,e){var n=t[ht],r=t[ut];if(i.call(this,n,r)){this._track.push([n,r]);var a=l.call(this)?k[this.type].getRanges.call(this):[];c.call(this,a),this[Ht]("selected",v.clone(a)),e&&this[Ht]("selectEnd",v.clone(a))}}function l(){var t=this._track;if(!t[Fi])return!1;var e=t[t[Fi]-1],i=t[0],n=e[0]-i[0],r=e[1]-i[1],a=b(n*n+r*r,.5);return a>w}function c(t){var e=k[this.type];t&&t[Fi]?(this._cover||(this._cover=e[mi].call(this),this.group.add(this._cover)),e[at].call(this,t)):(this.group[Qt](this._cover),this._cover=null)}function u(){var t=this.group,e=t[ue];e&&e[Qt](t)}function h(){var t=this.opt;return new m.Rect({style:{stroke:t[Si],fill:t.fill,lineWidth:t[ki],opacity:t[Mi]}})}function d(){return v.map(this._track,function(t){return this.group[se](t[0],t[1])},this)}function f(){var t=d.call(this),e=t[Fi]-1;return 0>e&&(e=0),[t[0],t[e]]}var p=t(fe),v=t(Wi),m=t(S),g=v.bind,y=v.each,_=Math.min,x=Math.max,b=Math.pow,w=2,M=["mousedown",dt,"mouseup"];e[qi]={constructor:e,enable:function(t,e){this._disabled=!1,u.call(this),this._containerRect=e!==!1?e||t[ni]():null,t.add(this.group)},update:function(t){c.call(this,t&&v.clone(t))},disable:function(){this._disabled=!0,u.call(this)},dispose:function(){this.disable(),y(M,function(t){this.zr.off(t,this._handlers[t])},this)}},v.mixin(e,p);var k={line:{create:h,getRanges:function(){var t=f.call(this),e=_(t[0][0],t[1][0]),i=x(t[0][0],t[1][0]);return[[e,i]]},update:function(t){var e=t[0],i=this.opt.width;this._cover[At]({x:e[0],y:-i/2,width:e[1]-e[0],height:i})}},rect:{create:h,getRanges:function(){var t=f.call(this),e=[_(t[1][0],t[0][0]),_(t[1][1],t[0][1])],i=[x(t[1][0],t[0][0]),x(t[1][1],t[0][1])];return[[[e[0],i[0]],[e[1],i[1]]]]},update:function(t){var e=t[0];this._cover[At]({x:e[0][0],y:e[1][0],width:e[0][1]-e[0][0],height:e[1][1]-e[1][0]})}}};return e}),e("echarts/component/dataZoom/history",[ji,Wi],function(t){function e(t){var e=t[r];return e||(e=t[r]=[{}]),e}var i=t(Wi),n=i.each,r="\x00_ec_hist_store",a={push:function(t,i){var r=e(t);n(i,function(e,i){for(var n=r[Fi]-1;n>=0;n--){var a=r[n];if(a[i])break}if(0>n){var o=t.queryComponents({mainType:"dataZoom",subType:"select",id:i})[0];if(o){var s=o.getPercentRange();r[0][i]={dataZoomId:i,start:s[0],end:s[1]}}}}),r.push(i)},pop:function(t){var i=e(t),r=i[i[Fi]-1];i[Fi]>1&&i.pop();var a={};return n(r,function(t,e){for(var n=i[Fi]-1;n>=0;n--){var t=i[n][e];if(t){a[e]=t;break}}}),a},clear:function(t){t[r]=null},count:function(t){return e(t)[Fi]}};return a}),e("echarts/component/dataZoom/SelectZoomModel",[ji,"./DataZoomModel"],function(t){var e=t("./DataZoomModel");return e[Li]({type:"dataZoom.select"})}),e("echarts/component/dataZoom/SelectZoomView",[ji,"./DataZoomView"],function(t){return t("./DataZoomView")[Li]({type:"dataZoom.select"})}),e("echarts/component/dataZoomSelect",[ji,"./dataZoom/typeDefaulter","./dataZoom/DataZoomModel","./dataZoom/DataZoomView","./dataZoom/SelectZoomModel","./dataZoom/SelectZoomView","./dataZoom/dataZoomProcessor","./dataZoom/dataZoomAction"],function(t){t("./dataZoom/typeDefaulter"),t("./dataZoom/DataZoomModel"),t("./dataZoom/DataZoomView"),t("./dataZoom/SelectZoomModel"),t("./dataZoom/SelectZoomView"),t("./dataZoom/dataZoomProcessor"),t("./dataZoom/dataZoomAction")}),e("echarts/component/toolbox/feature/DataZoom",[ji,Wi,"../../../util/number","../../helper/SelectController",_i,"zrender/container/Group","../../dataZoom/history","../../helper/interactionMutex","../../dataZoomSelect","../featureManager","../../../echarts"],function(t){function e(t){this.model=t,this._controllerGroup,this._controller,this._isZoomActive}function i(t,e){var i=[{axisModel:t[u]("x").model,axisIndex:0},{axisModel:t[u]("y").model,axisIndex:0}];return i.grid=t,e[W]({mainType:"dataZoom",subType:"select"},function(t,r){n("xAxis",i[0].axisModel,t,e)&&(i[0].dataZoomModel=t),n("yAxis",i[1].axisModel,t,e)&&(i[1].dataZoomModel=t)}),i}function n(t,e,i,n){var r=i.get(t+"Index");return null!=r&&n[Ae](t,r)===e}function a(t,e){var i=e.grid,n=new d(t[0][0],t[1][0],t[0][1]-t[0][0],t[1][1]-t[1][0]);if(n[nt](i[r]())){var a=i.getCartesian(e[0][ke],e[1][ke]),o=a.pointToData([t[0][0],t[1][0]],!0),s=a.pointToData([t[0][1],t[1][1]],!0);return[g([o[0],s[0]]),g([o[1],s[1]])]}}function o(t,e,i,n){var r=e[i],a=r.dataZoomModel;return a?{dataZoomId:a.id,startValue:t[i][0],endValue:t[i][1]}:void 0}function s(t,e){t.setIconStatus("back",p.count(e)>1?Se:Me)}var l=t(Wi),c=t("../../../util/number"),h=t("../../helper/SelectController"),d=t(_i),f=t("zrender/container/Group"),p=t("../../dataZoom/history"),v=t("../../helper/interactionMutex"),m=l.each,g=c.asc;t("../../dataZoomSelect");var y="\x00_ec_\x00toolbox-dataZoom_";e.defaultOption={show:!0,icon:{zoom:"M0,13.5h26.9 M13.5,26.9V0 M32.1,13.5H58V58H13.5 V32.1",back:"M22,1.4L9.9,13.5l12.3,12.3 M10.3,13.5H54.9v44.6 H10.3v-26"},title:{zoom:"区域缩放",back:"区域缩放还原"}};var _=e[qi];_[Wt]=function(t,e,i){s(t,e)},_.onclick=function(t,e,i){var n=this._controllerGroup;this._controllerGroup||(n=this._controllerGroup=new f,e.getZr().add(n)),x[i].call(this,n,this.model,t,e)},_[Qt]=function(t,e){this._disposeController(),v.release("globalPan",e.getZr())},_[Q]=function(t,e){var i=e.getZr();v.release("globalPan",i),this._disposeController(),this._controllerGroup&&i[Qt](this._controllerGroup)};var x={zoom:function(t,e,i,n){var r=this._isZoomActive=!this._isZoomActive,a=n.getZr();v[r?"take":"release"]("globalPan",a),e.setIconStatus("zoom",r?Se:Me),r?(a.setDefaultCursorStyle("crosshair"),this._createController(t,e,i,n)):(a.setDefaultCursorStyle("default"),this._disposeController())},back:function(t,e,i,n){this._dispatchAction(p.pop(i),n)}};return _._createController=function(t,e,i,n){var r=this._controller=new h("rect",n.getZr(),{lineWidth:3,stroke:"#333",fill:"rgba(0,0,0,0.2)"});r.on("selectEnd",l.bind(this._onSelected,this,r,e,i,n)),r.enable(t,!1)},_._disposeController=function(){var t=this._controller;t&&(t.off("selected"),t[Q]())},_._onSelected=function(t,e,n,r,s){if(s[Fi]){var l=s[0];t[at]();var c={};n[W]("grid",function(t,e){var r=t[A],s=i(r,n),u=a(l,s);if(u){var h=o(u,s,0,"x"),d=o(u,s,1,"y");h&&(c[h.dataZoomId]=h),d&&(c[d.dataZoomId]=d)}},this),p.push(n,c),this._dispatchAction(c,r)}},_._dispatchAction=function(t,e){var i=[];m(t,function(t){i.push(t)}),i[Fi]&&e[De]({type:"dataZoom",from:this.uid,batch:l.clone(i,!0)})},t("../featureManager")[Te](q,e),t("../../../echarts").registerPreprocessor(function(t){function e(t,e){if(e){var r=t+"Index",a=e[r];null==a||l[Qe](a)||(a=a===!1?[]:[a]),i(t,function(e,i){if(null==a||-1!==l[Ei](a,i)){var o={type:"select",$fromToolbox:!0,id:y+t+i};o[r]=i,n.push(o)}})}}function i(e,i){var n=t[e];l[Qe](n)||(n=n?[n]:[]),m(n,i)}if(t){var n=t[q]||(t[q]=[]);l[Qe](n)||(n=[n]);var r=t.toolbox;if(r&&(l[Qe](r)&&(r=r[0]),r&&r.feature)){var a=r.feature[q];e("xAxis",a),e("yAxis",a)}}}),e}),e("echarts/component/toolbox/feature/Restore",[ji,"../../dataZoom/history","../featureManager","../../../echarts"],function(t){function e(t){this.model=t}var i=t("../../dataZoom/history");e.defaultOption={show:!0,icon:"M3.8,33.4 M47,18.9h9.8V8.7 M56.3,20.1 C52.1,9,40.5,0.6,26.8,2.1C12.6,3.7,1.6,16.2,2.1,30.6 M13,41.1H3.1v10.2 M3.7,39.9c4.2,11.1,15.8,19.5,29.5,18 c14.2-1.6,25.2-14.1,24.7-28.5",title:"还原"};var n=e[qi];return n.onclick=function(t,e,n){i.clear(t),e[De]({type:"restore",from:this.uid})},t("../featureManager")[Te](Tt,e),t("../../../echarts")[F]({type:"restore",event:"restore",update:"prepareAndUpdate"},function(t,e){e.resetOption("recreate")}),e}),e("echarts/component/toolbox",[ji,"./toolbox/ToolboxModel","./toolbox/ToolboxView","./toolbox/feature/SaveAsImage","./toolbox/feature/MagicType","./toolbox/feature/DataView","./toolbox/feature/DataZoom","./toolbox/feature/Restore"],function(t){t("./toolbox/ToolboxModel"),t("./toolbox/ToolboxView"),t("./toolbox/feature/SaveAsImage"),t("./toolbox/feature/MagicType"),t("./toolbox/feature/DataView"),t("./toolbox/feature/DataZoom"),t("./toolbox/feature/Restore")}),e("zrender/vml/core",[ji,"../core/env"],function(t){function e(){if(!o){o=!0;var t=a.styleSheets;t[Fi]<31?a.createStyleSheet().addRule(".zrvml","behavior:url(#default#VML)"):t[0].addRule(".zrvml","behavior:url(#default#VML)")}}if(!t("../core/env")[K]){var i,n="urn:schemas-microsoft-com:vml",r=window,a=r.document,o=!1;try{!a.namespaces.zrvml&&a.namespaces.add("zrvml",n),i=function(t){return a[Vi]("<zrvml:"+t+' class="zrvml">')}}catch(s){i=function(t){return a[Vi]("<"+t+' xmlns="'+n+'" class="zrvml">')}}return{doc:a,initVML:e,createNode:i}}}),e("zrender/vml/graphic",[ji,"../core/env","../core/vector",fi,"../core/PathProxy","../tool/color","../contain/text","../graphic/mixin/RectText","../graphic/Displayable","../graphic/Image","../graphic/Text","../graphic/Path","../graphic/Gradient","./core"],function(t){function e(t){t.style.cssText="position:absolute;left:0;top:0;width:1px;height:1px;",t.coordsize=V+","+V,t.coordorigin="0,0"}function n(t){return String(t)[Je](/&/g,"&amp;")[Je](/"/g,"&quot;")}function r(t,e,i){return"rgb("+[t,e,i].join(",")+")"}function a(t,e){e&&t&&e[ct]!==t&&t[et](e)}function o(t,e){e&&t&&e[ct]===t&&t.removeChild(e)}function s(t,e,i){return(parseFloat(t)||0)*G+(parseFloat(e)||0)*H+i}function l(t,e,i){var n=w.parse(e);i=+i,isNaN(i)&&(i=1),n&&(t.color=r(n[0],n[1],n[2]),t[Mi]=i*n[3])}function c(t){var e=w.parse(t);return[r(e[0],e[1],e[2]),e[3]]}function u(t,e,i){var n=e.fill;if(null!=n)if(n instanceof D){var r,a=0,o=[0,0],s=0,u=1,h=i[ni](),d=h.width,f=h[gi];if("linear"===n.type){r="gradient";var p=i[he],v=[n.x*d,n.y*f],m=[n.x2*d,n.y2*f];p&&(E(v,v,p),E(m,m,p));var g=m[0]-v[0],y=m[1]-v[1];a=180*Math.atan2(g,y)/Math.PI,0>a&&(a+=360),1e-6>a&&(a=0)}else{r="gradientradial";var v=[n.x*d,n.y*f],p=i[he],_=i.scale,x=d,b=f;o=[(v[0]-h.x)/x,(v[1]-h.y)/b],p&&E(v,v,p),x/=_[0]*V,b/=_[1]*V;var w=B(x,b);s=0/w,u=2*n.r/w-s}var M=n.colorStops.slice();M.sort(function(t,e){return t.offset-e.offset});for(var S=M[Fi],k=[],C=[],A=0;S>A;A++){var T=M[A],L=c(T.color);C.push(T.offset*u+s+" "+L[0]),(0===A||A===S-1)&&k.push(L)}if(S>=2){var P=k[0][0],z=k[1][0],I=k[0][1]*e[Mi],O=k[1][1]*e[Mi];t.type=r,t.method="none",t.focus="100%",t.angle=a,t.color=P,t.color2=z,t.colors=C.join(","),t[Mi]=O,t.opacity2=I}"radial"===r&&(t.focusposition=o.join(","))}else l(t,n,e[Mi])}function h(t,e){null!=e.lineJoin&&(t.joinstyle=e.lineJoin),null!=e.miterLimit&&(t.miterlimit=e.miterLimit*V),null!=e.lineCap&&(t.endcap=e.lineCap),null!=e.lineDash&&(t.dashstyle=e.lineDash.join(" ")),null==e[Si]||e[Si]instanceof D||l(t,e[Si],e[Mi])}function d(t,e,i,n){var r="fill"==e,s=t.getElementsByTagName(e)[0];null!=i[e]&&"none"!==i[e]&&(r||!r&&i[ki])?(t[r?"filled":"stroked"]="true",i[e]instanceof D&&o(t,s),s||(s=L.createNode(e)),r?u(s,i,n):h(s,i),a(t,s)):(t[r?"filled":"stroked"]="false",o(t,s))}function f(t,e){var i,n,r,a,o,s,l=b.M,c=b.C,u=b.L,h=b.A,d=b.Q,f=[];for(a=0;a<t[Fi];){switch(r=t[a++],n="",i=0,r){case l:n=" m ",i=1,o=t[a++],s=t[a++],W[0][0]=o,W[0][1]=s;break;case u:n=" l ",i=1,o=t[a++],s=t[a++],W[0][0]=o,W[0][1]=s;break;case d:case c:n=" c ",i=3;var p,v,m=t[a++],g=t[a++],y=t[a++],_=t[a++];r===d?(p=y,v=_,y=(y+2*m)/3,_=(_+2*g)/3,m=(o+2*m)/3,g=(s+2*g)/3):(p=t[a++],v=t[a++]),W[0][0]=m,W[0][1]=g,W[1][0]=y,W[1][1]=_,W[2][0]=p,W[2][1]=v,o=p,s=v;break;case h:var x=0,w=0,M=1,S=1,k=0;e&&(x=e[4],w=e[5],M=z(e[0]*e[0]+e[1]*e[1]),S=z(e[2]*e[2]+e[3]*e[3]),k=Math.atan2(-e[1]/S,e[0]/M));var C=t[a++],A=t[a++],T=t[a++],D=t[a++],L=t[a++]+k,I=t[a++]+L+k;a++;var B=t[a++],N=C+O(L)*T,G=A+R(L)*D,m=C+O(I)*T,g=A+R(I)*D,H=B?" wa ":" at ";f.push(H,P(((C-T)*M+x)*V-F),Z,P(((A-D)*S+w)*V-F),Z,P(((C+T)*M+x)*V-F),Z,P(((A+D)*S+w)*V-F),Z,P((N*M+x)*V-F),Z,P((G*S+w)*V-F),Z,P((m*M+x)*V-F),Z,P((g*S+w)*V-F)),o=m,s=g;break;case b.R:var q=W[0],j=W[1];q[0]=t[a++],q[1]=t[a++],j[0]=q[0]+t[a++],j[1]=q[1]+t[a++],e&&(E(q,q,e),E(j,j,e)),q[0]=P(q[0]*V-F),j[0]=P(j[0]*V-F),q[1]=P(q[1]*V-F),j[1]=P(j[1]*V-F),f.push(" m ",q[0],Z,q[1]," l ",j[0],Z,q[1]," l ",j[0],Z,j[1]," l ",q[0],Z,j[1]);break;case b.Z:f.push(" x ")}if(i>0){f.push(n);for(var U=0;i>U;U++){var X=W[U];e&&E(X,X,e),f.push(P(X[0]*V-F),Z,P(X[1]*V-F),i-1>U?Z:"")}}}return f.join("")}function p(t){return typeof t===Gi&&t.tagName&&"IMG"===t.tagName[je]()}function v(t){var e=U[t];if(!e){X>Y&&(X=0,U={});var i,n=$.style;try{n.font=t,i=n.fontFamily.split(",")[0]}catch(r){}e={style:n.fontStyle||j,variant:n.fontVariant||j,weight:n.fontWeight||j,size:0|parseFloat(n.fontSize||12),family:i||"Microsoft YaHei"},U[t]=e,X++}return e}function m(t,i,r,o){var l=this.style,c=l.text;if(c){var u,h,f=l[Et],p=v(l.textFont),m=p.style+" "+p.variant+" "+p.weight+" "+p.size+'px "'+p.family+'"',g=l[Bt];r=r||M[ni](c,m,f,g);var y=this[he];if(y&&!o&&(Q.copy(i),Q[yi](y),i=Q),o)u=i.x,h=i.y;else{var _=l[Zt],x=l.textDistance;if(_ instanceof Array)u=i.x+_[0],h=i.y+_[1],f=f||"left",g=g||"top";else{var b=M.adjustTextPositionOnRect(_,i,r,x);u=b.x,h=b.y,f=f||b[Et],g=g||b[Bt]}}var w=p.size;switch(g){case"hanging":case"top":h+=w/1.75;break;case hi:break;default:h-=w/2.25}switch(f){case"left":break;case ui:u-=r.width/2;break;case"right":u-=r.width}var S,k,C,A=L.createNode,T=this._textVmlEl;T?(C=T.firstChild,S=C.nextSibling,k=S.nextSibling):(T=A("line"),S=A("path"),k=A("textpath"),C=A("skew"),k.style["v-text-align"]="left",e(T),S.textpathok=!0,k.on=!0,T.from="0 0",T.to="1000 0.05",a(T,C),a(T,S),a(T,k),this._textVmlEl=T);var D=[u,h],z=T.style;y&&o?(E(D,D,y),C.on=!0,C.matrix=y[0][Ye](3)+Z+y[2][Ye](3)+Z+y[1][Ye](3)+Z+y[3][Ye](3)+",0,0",C.offset=(P(D[0])||0)+","+(P(D[1])||0),C.origin="0 0",z.left="0px",z.top="0px"):(C.on=!1,z.left=P(u)+"px",z.top=P(h)+"px"),k[Bi]=n(c);try{k.style.font=m}catch(I){}d(T,"fill",{fill:o?l.fill:l.textFill,opacity:l[Mi]},this),d(T,Si,{stroke:o?l[Si]:l.textStroke,opacity:l[Mi],lineDash:l.lineDash},this),T.style.zIndex=s(this[ot],this.z,this.z2),a(t,T)}}function g(t){o(t,this._textVmlEl),this._textVmlEl=null}function y(t){a(t,this._textVmlEl)}if(!t("../core/env")[K]){var _=t("../core/vector"),x=t(fi),b=t("../core/PathProxy").CMD,w=t("../tool/color"),M=t("../contain/text"),S=t("../graphic/mixin/RectText"),k=t("../graphic/Displayable"),C=t("../graphic/Image"),A=t("../graphic/Text"),T=t("../graphic/Path"),D=t("../graphic/Gradient"),L=t("./core"),P=Math.round,z=Math.sqrt,I=Math.abs,O=Math.cos,R=Math.sin,B=Math.max,E=_[yi],Z=",",N="progid:DXImageTransform.Microsoft",V=21600,F=V/2,G=1e5,H=1e3,W=[[],[],[]];T[qi].brush=function(t){var i=this.style,n=this._vmlEl;n||(n=L.createNode("shape"),e(n),this._vmlEl=n),d(n,"fill",i,this),d(n,Si,i,this);var r=this[he],o=null!=r,l=n.getElementsByTagName(Si)[0];if(l){var c=i[ki];if(o&&!i.strokeNoScale){var u=r[0]*r[3]-r[1]*r[2];c*=z(I(u))}l.weight=c+"px"}var h=this.path;this.__dirtyPath&&(h[Ot](),this[Dt](h,this.shape),this.__dirtyPath=!1),n.path=f(h.data,this[he]),n.style.zIndex=s(this[ot],this.z,this.z2),a(t,n),i.text&&this.drawRectText(t,this[ni]())},T[qi].onRemoveFromStorage=function(t){o(t,this._vmlEl),this.removeRectText(t)},T[qi].onAddToStorage=function(t){a(t,this._vmlEl),this.appendRectText(t)},C[qi].brush=function(t){var n,r,o=this.style,l=o.image;if(p(l)){var c=l.src;if(c===this._imageSrc)n=this._imageWidth,r=this._imageHeight;else{var u=l.runtimeStyle,h=u.width,d=u[gi];u.width="auto",u[gi]="auto",n=l.width,r=l[gi],u.width=h,u[gi]=d,this._imageSrc=c,this._imageWidth=n,this._imageHeight=r}l=c}else l===this._imageSrc&&(n=this._imageWidth,r=this._imageHeight);if(l){var f=o.x||0,v=o.y||0,m=o.width,g=o[gi],y=o.sWidth,_=o.sHeight,x=o.sx||0,b=o.sy||0,w=y&&_,M=this._vmlEl;M||(M=L.doc[Vi]("div"),e(M),this._vmlEl=M);var S,k=M.style,C=!1,A=1,T=1;if(this[he]&&(S=this[he],A=z(S[0]*S[0]+S[1]*S[1]),T=z(S[2]*S[2]+S[3]*S[3]),C=S[1]||S[2]),C){var D=[f,v],I=[f+m,v],O=[f,v+g],R=[f+m,v+g];E(D,D,S),E(I,I,S),E(O,O,S),E(R,R,S);var V=B(D[0],I[0],O[0],R[0]),F=B(D[1],I[1],O[1],R[1]),G=[];G.push("M11=",S[0]/A,Z,"M12=",S[2]/T,Z,"M21=",S[1]/A,Z,"M22=",S[3]/T,Z,"Dx=",P(f*A+S[4]),Z,"Dy=",P(v*T+S[5])),k[i]="0 "+P(V)+"px "+P(F)+"px 0",k[Hi]=N+".Matrix("+G.join("")+", SizingMethod=clip)"}else S&&(f=f*A+S[4],v=v*T+S[5]),k[Hi]="",k.left=P(f)+"px",k.top=P(v)+"px";var H=this._imageEl,W=this._cropEl;H||(H=L.doc[Vi]("div"),this._imageEl=H);var q=H.style;if(w){if(n&&r)q.width=P(A*n*m/y)+"px",q[gi]=P(T*r*g/_)+"px";else{var j=new Image,U=this;j.onload=function(){j.onload=null,n=j.width,r=j[gi],q.width=P(A*n*m/y)+"px",q[gi]=P(T*r*g/_)+"px",U._imageWidth=n,U._imageHeight=r,U._imageSrc=l},j.src=l}W||(W=L.doc[Vi]("div"),W.style.overflow="hidden",this._cropEl=W);var X=W.style;X.width=P((m+x*m/y)*A),X[gi]=P((g+b*g/_)*T),X[Hi]=N+".Matrix(Dx="+-x*m/y*A+",Dy="+-b*g/_*T+")",W[ct]||M[et](W),H[ct]!=W&&W[et](H)}else q.width=P(A*m)+"px",q[gi]=P(T*g)+"px",M[et](H),W&&W[ct]&&(M.removeChild(W),this._cropEl=null);var Y="",$=o[Mi];1>$&&(Y+=".Alpha(opacity="+P(100*$)+") "),Y+=N+".AlphaImageLoader(src="+l+", SizingMethod=scale)",q[Hi]=Y,M.style.zIndex=s(this[ot],this.z,this.z2),a(t,M),o.text&&this.drawRectText(t,this[ni]())}},C[qi].onRemoveFromStorage=function(t){o(t,this._vmlEl),this._vmlEl=null,this._cropEl=null,this._imageEl=null,this.removeRectText(t)},C[qi].onAddToStorage=function(t){a(t,this._vmlEl),this.appendRectText(t)};var q,j=Me,U={},X=0,Y=100,$=document[Vi]("div");M.measureText=function(t,e){var i=L.doc;q||(q=i[Vi]("div"),q.style.cssText="position:absolute;top:-20000px;left:0;                padding:0;margin:0;border:none;white-space:pre;",L.doc.body[et](q));try{q.style.font=e}catch(n){}return q[it]="",q[et](i.createTextNode(t)),{width:q.offsetWidth}};for(var Q=new x,J=[S,k,C,T,A],tt=0;tt<J[Fi];tt++){var nt=J[tt][qi];nt.drawRectText=m,nt.removeRectText=g,nt.appendRectText=y}A[qi].brush=function(t){var e=this.style;e.text&&this.drawRectText(t,{x:e.x||0,y:e.y||0,width:0,height:0},this[ni](),!0)},A[qi].onRemoveFromStorage=function(t){this.removeRectText(t)},A[qi].onAddToStorage=function(t){this.appendRectText(t)}}}),e("zrender/vml/Painter",[ji,"../core/log","./core"],function(t){function e(t){return parseInt(t,10)}function i(t,e){a.initVML(),this.root=t,this[lt]=e;var i=document[Vi]("div"),n=document[Vi]("div");i.style.cssText="display:inline-block;overflow:hidden;position:relative;width:300px;height:150px;",n.style.cssText="position:absolute;left:0;top:0;",t[et](i),this._vmlRoot=n,this._vmlViewport=i,this[rt]();var r=e[Yt],o=e[$t];e[Yt]=function(t){var i=e.get(t);r.call(e,t),i&&i.onRemoveFromStorage&&i.onRemoveFromStorage(n)},e[$t]=function(t){t.onAddToStorage&&t.onAddToStorage(n),o.call(e,t)},this._firstPaint=!0}function n(t){return function(){r('In IE8.0 VML mode painter not support method "'+t+'"')}}var r=t("../core/log"),a=t("./core");i[qi]={constructor:i,getViewportRoot:function(){return this._vmlViewport},refresh:function(){var t=this[lt][st](!0);this._paintList(t)},_paintList:function(t){for(var e=this._vmlRoot,i=0;i<t[Fi];i++){var n=t[i];n[Kt]&&!n[Ut]&&(n.beforeBrush&&n.beforeBrush(),n.brush(e),n.afterBrush&&n.afterBrush()),n[Kt]=!1}this._firstPaint&&(this._vmlViewport[et](e),this._firstPaint=!1)},resize:function(){var t=this._getWidth(),e=this._getHeight();if(this._width!=t&&this._height!=e){this._width=t,this._height=e;var i=this._vmlViewport.style;i.width=t+"px",i[gi]=e+"px"}},dispose:function(){this.root[it]="",this._vmlRoot=this._vmlViewport=this[lt]=null},getWidth:function(){return this._width},getHeight:function(){return this._height},_getWidth:function(){var t=this.root,i=t.currentStyle;return(t.clientWidth||e(i.width))-e(i.paddingLeft)-e(i.paddingRight)|0},_getHeight:function(){var t=this.root,i=t.currentStyle;return(t[J]||e(i[gi]))-e(i.paddingTop)-e(i.paddingBottom)|0}};for(var o=["getLayer","insertLayer","eachLayer","eachBuildinLayer","eachOtherLayer","getLayers","modLayer","delLayer","clearLayer","toDataURL","pathToImage"],s=0;s<o[Fi];s++){var l=o[s];i[qi][l]=n(l)}return i}),e("zrender/vml/vml",[ji,"./graphic","../zrender","./Painter"],function(t){t("./graphic"),t("../zrender").registerPainter("vml",t("./Painter"))});var Ui=t("echarts");return t("echarts/chart/line"),t("echarts/chart/bar"),t("echarts/chart/pie"),t("echarts/chart/scatter"),t("echarts/component/tooltip"),t("echarts/component/legend"),t("echarts/component/grid"),t("echarts/component/title"),t("echarts/component/markPoint"),t("echarts/component/markLine"),t("echarts/component/dataZoom"),t("echarts/component/toolbox"),t("zrender/vml/vml"),Ui});
///<jscompress sourcefile="slideout.m.js" />
!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var t;"undefined"!=typeof window?t=window:"undefined"!=typeof global?t=global:"undefined"!=typeof self&&(t=self),t.Slideout=e()}}(function(){var e,t,n;return function i(e,t,n){function o(r,a){if(!t[r]){if(!e[r]){var u=typeof require=="function"&&require;if(!a&&u)return u(r,!0);if(s)return s(r,!0);var l=new Error("Cannot find module '"+r+"'");throw l.code="MODULE_NOT_FOUND",l}var f=t[r]={exports:{}};e[r][0].call(f.exports,function(t){var n=e[r][1][t];return o(n?n:t)},f,f.exports,i,e,t,n)}return t[r].exports}var s=typeof require=="function"&&require;for(var r=0;r<n.length;r++)o(n[r]);return o}({1:[function(e,t,n){"use strict";var i=e("decouple");var o=e("emitter");var s;var r=false;var a=window.document;var u=a.documentElement;var l=window.navigator.msPointerEnabled;var f={start:l?"MSPointerDown":"touchstart",move:l?"MSPointerMove":"touchmove",end:l?"MSPointerUp":"touchend"};var c=function v(){var e=/^(Webkit|Khtml|Moz|ms|O)(?=[A-Z])/;var t=a.getElementsByTagName("script")[0].style;for(var n in t){if(e.test(n)){return"-"+n.match(e)[0].toLowerCase()+"-"}}if("WebkitOpacity"in t){return"-webkit-"}if("KhtmlOpacity"in t){return"-khtml-"}return""}();function h(e,t){for(var n in t){if(t[n]){e[n]=t[n]}}return e}function p(e,t){e.prototype=h(e.prototype||{},t.prototype)}function d(e){e=e||{};this._startOffsetX=0;this._currentOffsetX=0;this._opening=false;this._moved=false;this._opened=false;this._preventOpen=false;this._touch=e.touch===undefined?true:e.touch&&true;this.panel=e.panel;this.menu=e.menu;if(this.panel.className.search("slideout-panel")===-1){this.panel.className+=" slideout-panel"}if(this.menu.className.search("slideout-menu")===-1){this.menu.className+=" slideout-menu"}this._fx=e.fx||"ease";this._duration=parseInt(e.duration,10)||300;this._tolerance=parseInt(e.tolerance,10)||70;this._padding=this._translateTo=parseInt(e.padding,10)||256;this._orientation=e.side==="right"?-1:1;this._translateTo*=this._orientation;if(this._touch){this._initTouchEvents()}}p(d,o);d.prototype.open=function(){var e=this;this.emit("beforeopen");if(u.className.search("slideout-open")===-1){u.className+=" slideout-open"}this._setTransition();this._translateXTo(this._translateTo);this._opened=true;setTimeout(function(){e.panel.style.transition=e.panel.style["-webkit-transition"]="";e.emit("open")},this._duration+50);return this};d.prototype.close=function(){var e=this;if(!this.isOpen()&&!this._opening){return this}this.emit("beforeclose");this._setTransition();this._translateXTo(0);this._opened=false;setTimeout(function(){u.className=u.className.replace(/ slideout-open/,"");e.panel.style.transition=e.panel.style["-webkit-transition"]=e.panel.style[c+"transform"]=e.panel.style.transform="";e.emit("close")},this._duration+50);return this};d.prototype.toggle=function(){return this.isOpen()?this.close():this.open()};d.prototype.isOpen=function(){return this._opened};d.prototype._translateXTo=function(e){this._currentOffsetX=e;this.panel.style[c+"transform"]=this.panel.style.transform="translate3d("+e+"px, 0, 0)"};d.prototype._setTransition=function(){this.panel.style[c+"transition"]=this.panel.style.transition=c+"transform "+this._duration+"ms "+this._fx};d.prototype._initTouchEvents=function(){var e=this;this._onScrollFn=i(a,"scroll",function(){if(!e._moved){clearTimeout(s);r=true;s=setTimeout(function(){r=false},250)}});this._preventMove=function(t){if(e._moved){t.preventDefault()}};a.addEventListener(f.move,this._preventMove);this._resetTouchFn=function(t){if(typeof t.touches==="undefined"){return}e._moved=false;e._opening=false;e._startOffsetX=t.touches[0].pageX;e._preventOpen=!e._touch||!e.isOpen()&&e.menu.clientWidth!==0};this.panel.addEventListener(f.start,this._resetTouchFn);this._onTouchCancelFn=function(){e._moved=false;e._opening=false};this.panel.addEventListener("touchcancel",this._onTouchCancelFn);this._onTouchEndFn=function(){if(e._moved){e._opening&&Math.abs(e._currentOffsetX)>e._tolerance?e.open():e.close()}e._moved=false};this.panel.addEventListener(f.end,this._onTouchEndFn);this._onTouchMoveFn=function(t){if(r||e._preventOpen||typeof t.touches==="undefined"){return}var n=t.touches[0].clientX-e._startOffsetX;var i=e._currentOffsetX=n;if(Math.abs(i)>e._padding){return}if(Math.abs(n)>20){e._opening=true;var o=n*e._orientation;if(e._opened&&o>0||!e._opened&&o<0){return}if(o<=0){i=n+e._padding*e._orientation;e._opening=false}if(!e._moved&&u.className.search("slideout-open")===-1){u.className+=" slideout-open"}e.panel.style[c+"transform"]=e.panel.style.transform="translate3d("+i+"px, 0, 0)";e.emit("translate",i);e._moved=true}};this.panel.addEventListener(f.move,this._onTouchMoveFn)};d.prototype.enableTouch=function(){this._touch=true;return this};d.prototype.disableTouch=function(){this._touch=false;return this};d.prototype.destroy=function(){this.close();a.removeEventListener(f.move,this._preventMove);this.panel.removeEventListener(f.start,this._resetTouchFn);this.panel.removeEventListener("touchcancel",this._onTouchCancelFn);this.panel.removeEventListener(f.end,this._onTouchEndFn);this.panel.removeEventListener(f.move,this._onTouchMoveFn);a.removeEventListener("scroll",this._onScrollFn);this.open=this.close=function(){};return this};t.exports=d},{decouple:2,emitter:3}],2:[function(e,t,n){"use strict";var i=function(){return window.requestAnimationFrame||window.webkitRequestAnimationFrame||function(e){window.setTimeout(e,1e3/60)}}();function o(e,t,n){var o,s=false;function r(e){o=e;a()}function a(){if(!s){i(u);s=true}}function u(){n.call(e,o);s=false}e.addEventListener(t,r,false)}t.exports=o},{}],3:[function(e,t,n){"use strict";var i=function(e,t){if(!(e instanceof t)){throw new TypeError("Cannot call a class as a function")}};n.__esModule=true;var o=function(){function e(){i(this,e)}e.prototype.on=function t(e,n){this._eventCollection=this._eventCollection||{};this._eventCollection[e]=this._eventCollection[e]||[];this._eventCollection[e].push(n);return this};e.prototype.once=function n(e,t){var n=this;function i(){n.off(e,i);t.apply(this,arguments)}i.listener=t;this.on(e,i);return this};e.prototype.off=function o(e,t){var n=undefined;if(!this._eventCollection||!(n=this._eventCollection[e])){return this}n.forEach(function(e,i){if(e===t||e.listener===t){n.splice(i,1)}});if(n.length===0){delete this._eventCollection[e]}return this};e.prototype.emit=function s(e){var t=this;for(var n=arguments.length,i=Array(n>1?n-1:0),o=1;o<n;o++){i[o-1]=arguments[o]}var s=undefined;if(!this._eventCollection||!(s=this._eventCollection[e])){return this}s=s.slice(0);s.forEach(function(e){return e.apply(t,i)});return this};return e}();n["default"]=o;t.exports=n["default"]},{}]},{},[1])(1)});
///<jscompress sourcefile="base.js" />
+(function(window,document,$,echarts){

    var slideout = new Slideout({
        'panel': document.getElementById('panel'),
        'menu': document.getElementById('menu'),
        'side': 'left',
        'padding':120
    });

    document.querySelector('.panel-header a').addEventListener('click', function() {
        slideout.toggle();
    });

    $(".panel section").css({'min-height':window.screen.height || window.innerHeight});

    //初始化   总体概览
    $(function(){
        init('t0');
    });

    // menu切换
    //$(".s-notice").html(template("notice", json.data));
    $('.menu-section').click(function(){
        $('.menu-section').removeClass('on');
        $(this).addClass('on');
        var i=$('.menu-section').index(this);

        init('t'+i);

        slideout.close();
        return false;
    });

    function init(t){
        var option=getOption();
        init[t](option);
    }
    init.t0=function(option){//总体概况
        $('.panel-header h1').text('总体概况');
        var json={};
        $(".panel section").html(template( 't0',json) );
        var myChart = echarts.init(document.querySelector('.echart'));
        myChart.setOption( option );

        //tab 切换
        var i=10;
        $('.p-all .panel-tab a').live('click',function(){
            $(this).parent().find('a').removeClass('on');
            $(this).addClass('on');
            i+=100;
            option.series[0].data[0]=i;
            myChart.setOption( option );
            return false;
        });
    };
    init.t1=function(option) {//实时
        $('.panel-header h1').text('实时');
        var json={};
        option.legend.data=['订单量','7日平均'];
        option.series[0].name='订单量';
        option.series[1].name='7日平均';
        $(".panel section").html(template( 't1',json) );
        var myChart = echarts.init(document.querySelector('.echart'));
        myChart.setOption( option );
        //tab 切换
        var i=10;
        $('.p-real .panel-tab a').live('click',function(){
            $(this).parent().find('a').removeClass('on');
            $(this).addClass('on');
            i+=100;
            option.series[0].data[0]=i;
            myChart.setOption( option );
            return false;
        });
    }
    init.t2=function(option) {//区域
        $('.panel-header h1').text('区域');
        var json={};
        option.legend.data=['订单量'];
        option.series[0].name='订单量';
        delete option.series[1];
        $(".panel section").html(template( 't2',json) );
        var myChart = echarts.init(document.querySelector('.echart'));
        myChart.setOption( option );
        //tab 切换
        var i=10;
        $('.p-area .panel-tab-mid a').live('click',function(){
            $(this).parent().find('a').removeClass('on');
            $(this).addClass('on');
            i+=100;
            option.series[0].data[0]=i;
            myChart.setOption( option );
            return false;
        });
        $('.p-area .tab a').live('click',function(){
            $(this).parent().find('a').removeClass('on');
            $(this).addClass('on');
            i+=100;
            option.series[0].data[0]=i;
            myChart.setOption( option );
            return false;
        });
    }
    init.t3=function(option) {//客户端
        $('.panel-header h1').text('客户端');
        var json={};
        option.legend.data=['pc','移动'];
        option.series[0].name='pc';
        option.series[1].name='移动';
        $(".panel section").html(template( 't3',json) );
        var myChart = echarts.init(document.querySelector('.echart'));
        myChart.setOption( option );
        //tab 切换
        var i=10;
        $('.p-client .panel-tab a').live('click',function(){
            $(this).parent().find('a').removeClass('on');
            $(this).addClass('on');
            i+=100;
            option.series[0].data[0]=i;
            myChart.setOption( option );
            return false;
        });
    }
    init.t4=function(option) {//订单类别
        $('.panel-header h1').text('订单类别');
        var json={};

        $(".panel section").html(template( 't4',json) );
        var myChart = echarts.init(document.querySelector('.echart'));
        myChart.setOption( option );
        //tab 切换
        var i=10;
        $('.p-order .tab1 a').live('click',function(){
            $(this).parent().find('a').removeClass('on');
            $(this).addClass('on');
            i+=100;
            option.series[0].data[0]=i;
            myChart.setOption( option );
            return false;
        });
        $('.p-order .tab2 a').live('click',function(){
            $(this).parent().find('a').removeClass('on');
            $(this).addClass('on');
            i+=100;
            option.series[0].data[0]=i;
            myChart.setOption( option );
            return false;
        });
    }
    init.t5=function(option){//新老会员
        $('.panel-header h1').text('新老会员');
        var json={};
        var option=getOption();
        option.legend.data=['新会员','老会员'];
        option.series[0].name='新会员';
        option.series[1].name='老会员';

        $(".panel section").html(template( 't5',json) );
        var myChart = echarts.init(document.querySelector('.echart'));
        myChart.setOption( option );
        //tab 切换
        var i=10;
        $('.p-order .tab1 a').live('click',function(){
            $(this).parent().find('a').removeClass('on');
            $(this).addClass('on');
            i+=100;
            option.series[0].data[0]=i;
            myChart.setOption( option );
            return false;
        });
        $('.p-order .tab2 a').live('click',function(){
            $(this).parent().find('a').removeClass('on');
            $(this).addClass('on');
            i+=100;
            option.series[0].data[0]=i;
            myChart.setOption( option );
            return false;
        });

    };







    function getOption(opt) {
        var option = {
            legend: {
                data: ['订单量', '对比']
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            },
            xAxis: [
                {
                    type: 'category',
                    boundaryGap: false,
                    data: ['1/1', '1/2', '1/3', '1/4', '1/5', '1/6', '1/7']
                }
            ],
            yAxis: [
                {
                    type: 'value'
                }
            ],
            series: [
                {
                    name: '订单量',
                    type: 'line',
                    data: [10, 132, 101, 134, 90, 230, 210]
                },
                {
                    name: '对比',
                    type: 'line',
                    data: [220, 182, 191, 234, 290, 330, 310]
                }
            ]
        };
        return $.extend(option,opt);
    }
})(window,document,$,echarts);

