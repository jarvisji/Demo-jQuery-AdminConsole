<?php

/**
 * Accept values: "DEV".
 * In "DEV" mode, some extra information such as:
 * 1. Ajax.php will append original request in response data.
 * 
 * Comment or change value to others will disable "DEV" mode.
 */
define("ENVMODE", "$grunt_replace_envmode");

/**
 * Url of freecoder service.
 */
define("SERVICEURL", "$grunt_replace_serviceUrl");

/**
 * freecoderService should define the same APPNAME and APPTOKEN.
 */
define("APPNAME", 'freecoderConsole');
define("APPTOKEN", "d4080700631f41bf9e5e01f7f4b4f039");

?>