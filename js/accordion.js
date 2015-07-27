/**
* Accordion Control (TODO: bitly link to soho xi docs)
*/

/* start-amd-strip-block */
(function(factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module
    define(['jquery'], factory);
  } else if (typeof exports === 'object') {
    // Node/CommonJS
    module.exports = factory(require('jquery'));
  } else {
    // Browser globals
    factory(jQuery);
  }
}(function($) {
/* end-amd-strip-block */

  $.fn.accordion = function(options) {

    'use strict';

    // Settings and Options
    var pluginName = 'accordion',
        defaults = {
          allowOnePane: false // If true, only allows one pane open at a time
        },
        settings = $.extend({}, defaults, options);

    // Plugin Constructor
    function Accordion(element) {
      this.settings = $.extend({}, settings);
      this.element = $(element);
      this.init();
    }

    // Plugin Methods
    Accordion.prototype = {

      init: function() {
        this
          .setup()
          .build()
          .initSelected()
          .handleEvents();
      },

      updated: function() {
        this.anchors.off();
        return this.init();
      },

      setup: function() {
        var allowOnePane = this.element.attr('data-allow-one-pane'),
          self = this;

        this.settings.allowOnePane = allowOnePane !== undefined ? allowOnePane === 'true' : this.settings.allowOnePane;

        this.anchors = this.element.find('.accordion-header > a');
        this.headers = this.element.find('.accordion-header').filter(function() {
          return $(this).children('.accordion-pane').length > 0;
        });

        var active = self.element.find('.is-selected');

        if (active.length === 0) {
          active = this.anchors.filter(':not(:disabled):not(:hidden)').first();
          this.setActiveAnchor(active);
        }

        return this;
      },

      initSelected: function () {
        var active = this.element.find('.is-selected'),
          icons = active.parents('.accordion-header').children('a, button').find('.icon.plus-minus');

        icons.addClass('active no-transition no-animate');

        active.addClass('is-expanded').children('.accordion-pane').css({'height': 'auto', 'display': 'block'});
        active.find('a').first().attr('aria-selected', true);
        var buttonPluses = active.children('button.plus-minus').find('.icon.plus-minus').addClass('active no-transition no-animate');

        active.parents('.accordion-header').addClass('is-expanded ')
          .css({'height': 'auto', 'display': 'block'})
          .attr('aria-expanded', 'true');

        active.parents('.accordion-pane').css({'height': 'auto', 'display': 'block'});

        setTimeout(function () {
          icons.removeClass('no-transition no-animate');
          buttonPluses.removeClass('no-transition no-animate');
        } ,1);
        return this;
      },

      build: function() {
        var self = this;
        this.element.attr({
          'aria-multiselectable': 'true'
        }).find('.accordion-pane').attr({
          'aria-multiselectable': 'false'
        });

        if (this.settings.allowOnePane) {
          this.element.attr({
            'aria-multiselectable': 'false'
          });
        }

        this.headers.attr({
          'role' : 'presentation'
        });

        this.element.find('a + .accordion-pane').parent().each(function() {
          var header = $(this),
            pane = header.children('.accordion-pane');

          pane.addClass('no-transition');
          if (header.hasClass('is-expanded')) {
            header.attr('aria-expanded', 'true');

            header.find('.icon.plus-minus').first().addClass('active');
            pane.one('animateOpenComplete', function() {
              $(this).removeClass('no-transition');
            });
            self.openHeader(header);
          } else {
            if (!self.selectedSet) {
              pane.one('animateClosedComplete', function() {
                $(this).removeClass('no-transition');
              });
              self.closeHeader(header);
            }
          }

          //Add Plus Minus Icons
          header.find('.accordion-pane').not(':first').prev('a').each(function () {
            var subhead = $(this),
              plusminus = subhead.find('.icon.plus-minus');

            if (plusminus.length === 0) {
              subhead.prepend('<span class="icon plus-minus" aria-hidden="true" focusable="false"></span>');
            } else {
              plusminus.removeClass('active');
            }
          });
        });

        return this;
      },

      handleEvents: function() {
        var self = this,
          thresholdReached = false,
          touchTimeout;

        // Touch Interaction will activate the accordion header only if touch scrolling doesn't take place
        // beyond certain distance and time thresholds.  The touchstart event is cancelled
        this.anchors.add(this.anchors.prev('.plus-minus')).on('touchstart.accordion', function(e) {
          var pos = {
            x: e.originalEvent.touches[0].pageX,
            y: e.originalEvent.touches[0].pageY
          },
            threshold = 10, // in px
            touchstartE = e;

          if (touchTimeout) {
            clearTimeout(touchTimeout);
          }

          $(this).on('touchmove.accordion', function(e) {
            var newPos = {
              x: e.originalEvent.changedTouches[0].pageX,
              y: e.originalEvent.changedTouches[0].pageY
            };

            if ((newPos.x >= pos.x + threshold) || (newPos.x <= pos.x - threshold) ||
                (newPos.y >= pos.y + threshold) || (newPos.y <= pos.y - threshold)) {
              thresholdReached = true;
            }

            $(this).on('touchend.accordion touchcancel.accordion', function(e) {
              clearTimeout(touchTimeout);
              e.preventDefault();
              e.stopPropagation();
              $(this).off('touchmove.accordion touchend.accordion touchcancel.accordion');
              if (!thresholdReached) {
                touchstartE.preventDefault();
                touchstartE.returnValue = false;
                $(e.target).click();
                return false;
              }
            });
          });

          touchTimeout = setTimeout(function() {
            if (!thresholdReached) {
              e.preventDefault();
              e.returnValue = false;
              $(this).off('touchmove.accordion');
            }
          }, 50);
        }).on('click.accordion', function(e) {
          e.preventDefault();
          return self.handleClick(e);
        }).on('keydown.accordion', function(e) {
          self.handleKeydown(e);
        }).on('focus.accordion', function(e) {
          self.handleFocus(e, $(this));
        }).on('blur.accordion', function(e) {
          self.handleBlur(e, $(this));
        });

        this.element.one('updated.accordion', function() {
          self.updated();
        });

        return this;
      },

      handleClick: function(e) {
        // To prevent the weird Safari Bug, prevent default here
        e.preventDefault();

        // Set and handle the Link.  Make sure we target the correct element (the <a> tag)
        var link = $(e.target);
        if (link.is('span, svg, use')) {
          link = link.closest('a');
        }
        if (link.is('button.plus-minus')) {
          link = link.next('a');
        }

        if (this.element.hasClass('is-disabled') || link.parent().hasClass('is-disabled')) {
          e.stopPropagation();
          return false;
        }

        this.setActiveAnchor(link);
        return this.handleSelected(link);
      },

      handleFocus: function(e, anchor) {
        if (this.element.hasClass('is-disabled')) {
          e.preventDefault();
          return false;
        }
        anchor.parent().addClass('is-focused');
      },

      handleBlur: function(e, anchor) {
        if (this.element.hasClass('is-disabled')) {
          e.preventDefault();
          return false;
        }
        anchor.parent().removeClass('is-focused');
      },

      handleKeydown: function(e) {
        if (this.element.hasClass('is-disabled')) {
          return false;
        }

        var self = this,
          key = e.which,
          anchors = this.anchors.filter(':not(:disabled):not(:hidden)'),
          selected = this.element.find('.is-selected').children('a'),
          next, prev;

        if (!selected.length) {
          selected = anchors.first();
        }

        // NOTE: Enter is handled by the anchor's default implementation
        if (key === 9) { // Tab

          if (!e.shiftKey) {
            // Go Forward
            var panel = selected.next('.accordion-pane'),
              firstItem;

            if (panel.length && panel.parent().hasClass('is-expanded')) {
              e.preventDefault();
              firstItem = panel.find(':focusable').first();
              if (firstItem[0].tagName && firstItem[0].tagName === 'A') {
                this.setActiveAnchor(firstItem);
              } else {
                firstItem.focus();
              }
              return false;
            }

            // Navigate to the next header
            next = anchors.eq(anchors.index(selected) + 1);
            if (next.length) {
              e.preventDefault();
              this.setActiveAnchor(next);
              return false;
            }

          } else {
            // Go Backward
            var index = anchors.index(selected) - 1;
            prev = anchors.eq(index);
            if (prev.length && index > -1) {
              e.preventDefault();
              this.setActiveAnchor(prev);
              return false;
            }

            var parent = selected.parentsUntil(this.element, '.accordion-header').eq(1);
            if (parent.length) {
              e.preventDefault();
              this.setActiveAnchor(parent.children('a'));
              return false;
            }

          }

          // If e.preventDefault() doesn't fire, focus may be on an element outside of the accordion.
          // If this happens, trigger a 'blur' event on the main accordion so we can communicate to other
          // plugins that focus is no longer here.
          setTimeout(function() {
            if (!$.contains(self.element[0], document.activeElement)) {
              self.element.trigger('blur');
            }
          }, 0);
        }

        if (key === 32) { // Spacebar
          this.handleSelected(selected);
          return false;
        }

        if (key === 37 || key === 38) { // Left/Up
          e.preventDefault();
          prev = anchors.eq(anchors.index(selected) - 1);
          if (!prev.length) {
            prev = anchors.last();
          }
          this.setActiveAnchor(prev);
          return false;
        }

        if (key === 39 || key === 40) { // Right/Down
          e.preventDefault();
          next = anchors.eq(anchors.index(selected) + 1);
          if (!next.length) {
            next = anchors.first();
          }
          this.setActiveAnchor(next);
        }
      },

      // NOTE: "e" is either an event or a jQuery object containing a reference to an <a>
      handleSelected: function(e) {
        var isEvent = e !== undefined && e.type !== undefined,
          target = isEvent ? $(e.target) : e,
          href = target.attr('href'),
          isAnchor = target.is('a'),
          isRealAnchor = href && (href !== '' && href !== '#'),
          isExpander = target.is('.plus-minus'),
          hasExpander = target.parent().find('.plus-minus');

        if (this.element.hasClass('is-disabled') || (target).hasClass('is-disabled')) {
          if (isEvent) {
            e.returnValue = false;
          }
          return false;
        }

        if (isAnchor && !isRealAnchor) {
          if (e.preventDefault) {
            e.preventDefault();
            e.stopImmediatePropagation();
          }

          if (hasExpander) {
            this.toggleHeader(target.parent());
          }

          return false;
        }

        if (isExpander) {
          this.toggleHeader(target.parent());
        }

        if (isRealAnchor) {
          this.element.trigger('selected', [target]);
          window.location.href = href;
        }

        return true;
      },

      setActiveAnchor: function(anchor) {
        this.headers.removeClass('child-selected');

        this.anchors.attr({
          'aria-selected': 'false'
        }).parent().removeClass('is-selected');

        anchor.attr({
          'aria-selected': 'true'
        }).parent().addClass('is-selected')

        .parentsUntil(this.element, '.accordion-header')
          .addClass('child-selected');

        anchor.focus();
      },

      toggleHeader: function(header, forceClosed) {
        if (forceClosed || header.hasClass('is-expanded')) {
          this.closeHeader(header);
        } else {
          this.openHeader(header);
        }
      },

      openHeader: function(header) {
        var self = this,
          a = header.children('a'),
          source = header.attr('data-source'),
          childPane = header.children('.accordion-pane');

        function open() {
          if (self.settings.allowOnePane) {
            self.headers.not(header).filter(function() {
              return header.parentsUntil(this.element).filter($(this)).length === 0;
            }).each(function() {
              if ($(this).hasClass('is-expanded')) {
                self.closeHeader($(this));
              }
            });
          }

          header.attr('aria-expanded', 'true').addClass('is-expanded');
          var plusminus = header.find('.icon.plus-minus');
          plusminus.addClass('active');

          header.find('.accordion-pane').not(':first').prev('a').each(function () {
            var subhead = $(this),
              plusminus = subhead.find('.icon.plus-minus').removeClass('no-transition no-animate');

            if (plusminus.length === 0) {
              subhead.prepend('<span class="icon plus-minus" aria-hidden="true" focusable="false"></span>');
            } else {
              plusminus.removeClass('active');
            }
          });

          header.children('.accordion-pane').css('display','block').one('animateOpenComplete', function() {
            // Note: Moved this here from animation classes
            this.style.height = 'auto';
            header.trigger('expanded');
          }).animateOpen();
        }

        if (source && source !== null && source !== undefined && !childPane.contents().length) {
          this.loadExternalSource(a, source, open);
        } else {
          if (!childPane.length) {
            return;
          }
          open();
        }
      },

      closeHeader: function(header) {
        if (!header.children('.accordion-pane').length) {
          return;
        }

        header.attr('aria-expanded', 'false').removeClass('is-expanded');
        header.find('.icon.plus-minus').first().removeClass('active');
        header.children('.accordion-pane').one('animateClosedComplete', function(e) {
          e.stopPropagation();
          $(this).add($(this).find('.accordion-pane')).css('display', 'none');
          header.trigger('collapsed');
        }).animateClosed();
      },

      loadExternalSource: function(target, source, callback) {
        var self = this,
          paneEl = target.next('.accordion-pane'),
          sourceType = typeof source;

        function done(markup) {
          target
            .removeClass('busy')
            .trigger('requestend');

          paneEl.append(markup);
          self.element.trigger('updated');
          if (callback && typeof callback === 'function') {
            callback();
          }
        }

        if (!paneEl.length) {
          var parentEl = this.element[0].tagName.toLowerCase();
          paneEl = $('<' + parentEl + ' class="accordion-pane"></' + parentEl + '>').appendTo(target.parent());
        }

        target
          .addClass('busy')
          .trigger('requeststart');

        if (sourceType === 'function') {
          // Call the 'source' setting as a function with the done callback.
          settings.source(done);
        } else {
          // Convert source to string, and check for existing DOM elements that match the selectors.
          var str = source.toString(),
            request,
            jqRegex = /\$\(\'/,
            idRegex = /#[A-Za-z0-9]+/;

          if (jqRegex.test(str)) {
            str = str.replace("$('", '').replace("')", ''); //jshint ignore:line
            done($(str).html());
            return;
          }

          if (idRegex.test(str)) {
            done($(str).html());
            return;
          }

          // String is a URL.  Attempt an AJAX GET.
          request = $.get(str);

          request.done(function(data) {
            done(data);
          }).fail(function() {
            done('');
          });
        }

      },

      disable: function() {
        this.element
          .addClass('is-disabled');
      },

      enable: function() {
        this.element
          .removeClass('is-disabled');
      },

      // Teardown - Remove added markup and events
      destroy: function() {
        this.anchors.parent()
          .removeClass('is-focused')
          .removeClass('is-selected')
          .removeClass('is-expanded')
          .removeAttr('aria-expanded')
          .removeAttr('role');
        this.anchors
          //.removeAttr('tabindex')
          .removeAttr('aria-selected')
          .offTouchClick('accordion')
          .off('click.accordion keydown.accordion focus.accordion blur.accordion');
        this.element
          .off('updated')
          .removeAttr('role')
          .removeAttr('aria-multiselectable');
        $.removeData(this.element[0], pluginName);
      }
    };

    // Initialize the plugin (Once)
    return this.each(function() {
      var instance = $.data(this, pluginName);
      if (instance) {
        instance.settings = $.extend({}, instance.settings, options);
      } else {
        instance = $.data(this, pluginName, new Accordion(this, settings));
      }
    });
  };

/* start-amd-strip-block */
}));
/* end-amd-strip-block */
