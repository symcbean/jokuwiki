<?php
/**
 * jokuwiki syntax plugin
 * markup example:
 * ex1:
 * <jw name="jwHelloWorld">{ "helloTo" : "World" }</jw>
 *
 * ex2:
 * <jw name='jwHelloWorld'
 *     style='width:100px;height=40px'
 *     noscript='Javascript is disabled'>
 *      { "helloTo" : "World" }
 * </jw>
 *--
 * ex1 translates to
 * <div id='jw-jwHelloWorld-1'
 *      class='jwHelloWold'
 *      data-jw='{ "jokuwiki" : "jwHelloWold", "id" : "jw-jwHelloWorld-1", "data" : { "helloTo" : "World" }}'>
 * </div>
 *
 * ex2 translates to
 * <div id='jw-jwHelloWorld-2'
 *      class='jwHelloWold'
 *      style='width:100px;height=40px'
 *      data-jw='{ "jokuwiki" : "jwHelloWold", "id" : "jw-jwHelloWorld-2", "data" : { "helloTo" : "World" }}'>
 *    <noscript>Javascript is disabled</noscript>
 * </div>
 */

file_put_contents('/tmp/jokuwiki_loaded', 'yes');

if(!defined('DOKU_INC')) die();
 
if(!defined('DOKU_PLUGIN')) define('DOKU_PLUGIN',DOKU_INC.'lib/plugins/');
require_once DOKU_PLUGIN.'syntax.php';

/**
 * All DokuWiki plugins to extend the parser/rendering mechanism
 * need to inherit from this class
 */
class syntax_plugin_jokuwiki extends DokuWiki_Syntax_Plugin {

    function getInfo(){
        return array(
            'author' => 'SyMcBean',
            'email'  => 'colin.mckinnon@ntlworld.com',
            'date'   => '2013-06-17',
            'name'   => 'JokuWiki',
            'desc'   => 'Framework for Javascript tools',
            'url'    => 'http://www.dokuwiki.org/plugin:jokuwiki',
        );
    }

    function getType(){
        return 'substitution';
    }
    function getPType(){
        return 'block';
    }

/**
 * must be injected before jwPlugins which do something
 */
    function getSort() {
        return 901;
    }
    function connectTo($mode) {
            file_put_contents('/tmp/jokuwiki_0','started');
            // $p='<jw\b?[^>]*>.*?</jw>'; // fail
            // $p='<jw\b[^>]*>.*?<\/jw>'; // fail
            // $p='<jw .*\?>(?=.*?</jw>'; // fail <?php
            $p='<jw.*?>(?=.*?</jw>'; // <?php
            $this->Lexer->addSpecialPattern($p,$mode,'plugin_jokuwiki');
            file_put_contents('/tmp/jokuwiki_a', 'running '. $p);
    }

    function handle($match, $state, $pos, &$handler) {
        list($attributes, $data)=explode('>', substr($match,2,4),2);
        $attrs=$this->parse_attributes($attributes);
        $attrs['data-jw']=$this->cleanupData($data);
        file_put_contents('/tmp/jokuwiki_b', var_export($attrs, true));
        return $attrs;
    }
    function parse_attributes($attrs)
    {
          $name='';
          $style='';
          $id='';
          $noscript='';
          if (preg_match_all('/(\w*)="(.*?)"/us',$attrs, $matches, PREG_SET_ORDER)) {
                foreach($matches as $key=>$val) {
                    switch ($key) {
                        case 'name':
                        case 'style':
                        case 'id':
                        case 'noscript':
                                $$key=trim(str_replace('"', '', $val));
                                break;
                        default:
                                break;
                    }
                }
          }
          return array($name, $id, $style, $noscript);
    }
    function render($mode, &$renderer, $attrs) {
        global $jokuwiki_ids;
    // $data is what the function handle return'ed.
        if($mode == 'xhtml'){
            if (!$attrs['id']) {
                $jokuwiki_ids++;
                $attrs['id']="jw-" . $attrs['name'] . "-" . $jokuwiki_ids;
            }
            $noscript=$attrs['noscript'];
            unset($attrs['noscript']);
            $append="<div ";
            foreach ($attrs as $k=>$val) {
                $append.=' ' . $k . "='" . $val . "'";
            }
            $append.=">";
            if (trim($noscript)) $append.="<noscript>$noscript</noscript>\n";
            $append.="</div>\n";
            $renderer->doc.=$append;
            return true;
        }
        return false;
    }
    
   }
/* EOF */
