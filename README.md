## Description ##

Jokuwiki is a framework for integrating javascript in Dokuwiki. That is to say, it is mostly a set of rules about writing code, and a small amount of bundled code. It is intended to make your dokuwiki site:
 * faster
 * more secure
 * and allow for pure javascript based plugins

## Installation ##
Download the zip file and unzip in the plugins directory or install via the plugin manager.

## Usage ##

```html
<jw name='jwHelloWorld'
      id='greetingDiv' style='width:100px;height=40px' noscript='Javascript is disabled'
      data='{ "say" : "Hello World" }'
  ></jw>
```
The example above requires the jwHelloWorld plugin to run. This plugin will be available on the same site where you sourced this package.

The Jokuwiki opening tag has a number of attributes:
* **name** (required) e.g. `name='jwPluginName'`
* **id** (optional) e.g. `id='myHtmlElementId'`
* **data** (required) e.g.  `data='{ "formatting" : "JSON", "wellFormedJSON" : true, "pi" : 3.1415926, "myArray" : [ ] }'`

The attributes *must* be enclosed in *single* quotes. The **name** attribute should reference a Jokuwiki capable plugin and is also the class of the div element created to contain the plugin. The **id** attribute is optional and maps directly to the id of the div element. If it is omitted a unique id will be generated. The **style** attribute allows for the class CSS to be overridden if the site configuration allows for inline HTML. The **noscript** element is written inside noscript tags. If inline HTML is enabled in the config, then the noscript content is sent to the browser as is (i.e. may contain HTML markup). If the configuration does not allow for HTML, then it is filtered by htmlentities.

The data attribute must contain a valid JSON string. This should not have a propery 'id' at the root level. The id of the containing div is added to the JSON string and the contents passed to the initiator for the javascript.

Additional content may be added between the opening and closing jw tags. This will be parsed by Dokuwiki and hence may contain the usual markup.

The jwHelloWorld example at the start of the USAGE section  will be sent to the browser as:
```html
<div id='greetingDiv'
      class='jwHelloWorld'
      style='width:100px;height=40px'
      data-jw='
          {
              "jokuwiki" : "jwHelloWorld",
              "data": {
                        "id" : "greetingDiv"
                        "say" : "Hello World"
               }
            }'
 >
 <noscript>Javascript is disabled</noscript>
 </div>
```

Not exactly rocket science so far! 

## Speed enhancement ##

 - Since processing of the content (arguments to the initiator) is deferred, the javascript need not be loaded before the Jokuwiki tag is declared in the html - i.e. script tags can be moved to the bottom, and/or use the defer/async tags or be loaded via AJAX. In short, the page is not blocked loading javascript content.
 - Even without the overhead of jQuery, the amount of content which is different between individual pages is often less than 50% of the data downloaded from the server. Jokuwiki provides hooks to integrate [PJAX](https://github.com/defunkt/jquery-pjax) into templates and thereby reducing the total traffic on page transitions.
 - Actually, halving the content size isn't really a //great// performance saving - with HTTP it's all about the latency. But eliminating the need to re-fetch (even from cache), re-parse and re-compile the javascript on each page (along with parsing the CSS) does represent a big performance boost - on a bare installation of Weatherwax on my development machine this saves between 250 and 350 milliseconds per page load.

## Security Enhancement ##

Allowing inline javascript is a big security risk. Adopting a strict [Content Security Policy](https://developer.chrome.com/extensions/contentSecurityPolicy.html), rejecting inline javascript //and inline CSS// almost completely eliminates cross-site scripting vulnerabilities. Note that the versions of Dokuwiki up to, and including Weatherwax inject inline Javascript to define variables including JSINFO and SIG.

## Compatible Templates ##

Jokuwiki should be compatible with all templates, however the additional functionality jokuwiki was designed to support (much faster page loading, better security) require a template which is jokuwiki aware.

PJAX page loading and Content Security Policy support requires changes to the template - and Jokuwiki simplifies the implementation of these changes. The starterPjax template is a demonstration of PJAX and CSP capable template using Jokuwiki; the template defines the PJAX container Div and also injects a Jokuwiki widget to update the page title.
 
## Source code and installation ##


## Versions ##

  * **2013-06-24** : First version.

## ToDo ##

 * Add a built-in widget to initialize Dokuwiki variables
 * Add  an AJAX save/load interface for arbitrary JSON data - serverside and clientside
 * Add a JSON editor in the Dokuwiki editor


## Discussion ##
### Writing a compatible plugin ###
#### Javascript ####
Your plugin has to tell Jokuwiki how it is invoked, hence the script.js for your plugin must register itself, e.g.
```javascript
function jwMyPlugin_initiator(data)
{
    var el=document.getElementById(data.id);
    el.innerHTML += 'Hello World';
}

if (jokuwiki) {
    jokuwiki.register('jwMyPlugin', jwMyPlugin_initiator);
}
```

The .register method takes 3 parameters:
 * the plugin name (by convention, jokuwiki plugins start with 'jw' but this is not required)
 * a function to call. To comply with a strict Content Security Policy this must be a function - but can be an anonymous function. This has a single argument - the data object declared inside the JSON string.
 * a URL of a javascript file to load asynchronously
Since the loading of a new content via PJAX will not trigger a onload event for the window, you should not attempt to attach your own handler for this directly nor via the jQuery.ready function: in both cases the lists of actions are fired once and cleared down after executing once. When a page transition occurs, either via a full page load or via a PJAX fetch, Jokuwiki will invoke the initiators for the widgets.

Related to this, Jokuwiki implements it's own asynchronous script loader. Unlike the jQuery.script method, this ensures that each script is only loaded/incorporated once into the current page *once*.

To accommodate the asynchronous loading (and potentially out-of-sequence loading) of additional code from the server, Jokuwiki will try to initiate each widget several times. If the called method throws an exception or the initiator is not registered, Jokuwiki will put it back into the list of widgets it needs to initiate. If it does not throw an exception, or an internal timer expires, the widget will be removed from the queue.

#### PHP code ####
The Jokuwiki plugin intentionally provides no mechanism for directly populating the JSON data field. This should be implemented by your syntax.php plugin, which then writes a Jokuwiki HTML widget based on the parameters it parses.
### Include a schema ###
Although this has yet to be implemented, I would urge you to include a [JSON Schema](http://json-schema.org/|JSON schema) describing the data payload for your jwPlugin. At some point in the future I hope to add a form based editor for widgets, most likely [onde](http://exavolt.github.io/onde/). There are online tools, e.g. [[http://www.jsonschema.net/index.html]] for generating schemas from sample JSON documents.

### Plugins outside the PJAX container ###
Jokuwiki capable plugins can be placed outside the PJAX container, however these must have an explicit id declared.
