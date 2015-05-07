/*
 *  Golbal variables for application configurations.
 */

/*
 * Set debug = true in developer environment, will output logs in browser console.
 */
debug = Boolean($grunt_replace_debug); // The exp is ready for grunt replace.
error = console.error;

/*
 * demo后台服务的URL，当前用在公众号页面，向用户显示完整的服务链接。
 */
SERVICEURL = "$grunt_replace_serviceUrl";

PHPPATH = "../php/";
