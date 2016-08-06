/**
 * Jokuwiki - a tool for managing javascript widgets
 *
 * Jokuwiki is intended to provide a framework (initially for Dokuwiki) to 
 * 1) isolate widgets from having to deal with dependencies (widget declared before dependencies available)
 * 2) handle a strict Content Security Policy (i.e. no inline scripts)
 * 3) non-standard content loading techniques (e.g. pjax)
 *
 * For simplicity the PJax page initializaton plugin is appended below
 */
var jokuwiki=
{
        widgets: [],            /* contains a list of [widgetname]=initFunction */
        failcount: 0,           /* limits frequent re-running after failures */
        urls: [],               /* maintains a list of script URLs loaded or about to be loaded */
        iters: 0,               /* track number of times worklist has been scanned */
        pjaxloads: 0,           /* count of times jokuwiki has been initialised */
        attempts: 10,           /* maximum number of attempts at runQueue per init invocation */
        maxPjax: 200,           /* max number of consecutive pjax loads before a full page load */
        pjaxContainer: 'pjax_content',  /* element ID used for pjax container (optional -see disablePjax below) */
/**
 * init should be called when the page is loaded or content injected
 */
        init: function () {
                jokuwiki.iters=0;
                jokuwiki.failcount=0;
                jokuwiki.pjaxloads++;
                jokuwiki.attempts=10;
                jokuwiki.runQueue();
        },
/**
 * private method
 *
 * scans the DOM for widgets to invoke
 * automatically reschedules itself for stuff which throws an exception
 */
        runQueue: function () {     
                if (jQuery.pjax && jokuwiki.pjaxloads>jokuwiki.maxPjax) {
                    jokuwiki.disablePjax();
                }
                jokuwiki.iters++;
                console.log(jokuwiki.iters + "(" + jokuwiki.pjaxloads + ") jokuwiki.runQueue iteration");
                var els=jQuery("[data-jw]");
                var success=false;
                for(var i=0; i<els.length; i++) {
                        success=false;
                        try {
                            payload=jQuery.parseJSON(els[i].getAttribute('data-jw'));
                            jokuwiki.widgets[payload.jokuwiki](payload.data);
                            success=true;
                        } catch(e) {
                            jokuwiki.failcount++;
                            console.log(jokuwiki.iters + "(" + jokuwiki.pjaxloads + ") Error processing " + els[i].getAttribute('data-jw'));
                        }
                        console.log(jokuwiki.iters + "(" + jokuwiki.pjaxloads + ") still here - success = " + success);
                        if (success) {
                            /* our work here is done - remove from the list */
                            console.log(jokuwiki.iters + "(" + jokuwiki.pjaxloads + ') removing' + els[i].id + ' from jokuwiki queue');
                            els[i].removeAttribute('data-jw');
                        }
                }
                if (jQuery("[data-jw]").length && --jokuwiki.attempts) {
                        /* try to process the failed ones later */
                    console.log(jokuwiki.iters + "(" + jokuwiki.pjaxloads + ") scheduling for another go");
                    setTimeout(jokuwiki.runQueue, 200 + Math.min(jokuwiki.iters*100,1000));
                }
        },
/**
 * public method for creating mappings between widgetnames and initfunctions
 * @param string widgetname - the 'name' attribute of the widget
 * @param function handler - the function to call (with the data from the parsed json) to invoke
 * @param string url - optional url to load (will only be loaded once)
 */
        register: function (widgetname, handler, url) {  
            if (url) {
                jokuwiki.loadScript(url);
            }
            jokuwiki.widgets[widgetname]=handler;
        },
/**
 * public method for deleting mappings between widgetnames and initfunctions
 * @param string widgetname - the 'name' attribute of the widget
 *
 * Not really sure why this is here.
 * Note that this does not remove any scripts which have been added
 */
        unregister: function (name) {               /* removes mapping between names and initFunctions */
            delete jokuwiki.widgets[name];
        },
/**
 * public method for loading a script asynchnronously
 * @param string url
 *
 * There are some issues with jQuery's getScript, notably
 * it doesn't intrinsically prevent the same script being 
 * injected multiple times
 */
        loadScript: function (url) {
                if (!jokuwiki.urls[url]) {          
                        jokuwiki.urls[url]=1;
                        jQuery(document).ready(function () {
                                var script = document.createElement("script");
                                script.type = "text/javascript";
                                script.src = url;
                                document.body.appendChild(script);
                        });
                }

        },
/**
 * public method to allow full page loads/break pjax loading
 *
 */
        disablePjax: function () {             /* do a full page load occasionally to clean up leaks */
            try {
                console.log(jokuwiki.iters + "(" + jokuwiki.pjaxloads + ') next page should be full reload');
                document.getElementById(jokuwiki.pjaxContainer).id='DoNotReload';
            } catch (e) { console.log('....or not');}
        }
};

// --------- initialize the jokuwiki -------

/* for full page load */
jQuery(document).ready(jokuwiki.init);
/* for pjax load */
jQuery(document).on('pjax:success', jokuwiki.init);

/* -------- register handler to update title ---- */
/* NB has no dependencies therefore run in its own try....catch */
/* - if it doesn't work the first time then it aint gonna work! */
jokuwiki.register('pjaxTitle', function(jw) {
    try {
        document.title=jw.title;
    } catch (e) {
    }
});

/* ------------ add a widget -------- */
jokuwiki.register('slideshow',function (jw) {
           var i = new fadeSlideShow(jw);
}, 'res/fader.js');

/* ------ consol.log hack ---------- */
if (!window.console) console = {log: function() {}};

