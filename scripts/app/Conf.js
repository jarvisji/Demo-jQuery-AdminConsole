/*
 *  Golbal variables for application configurations.
 */

/*
 * Set debug = true in developer environment, will output logs in browser console.
 */
debug = Boolean($grunt_replace_debug); // The exp is ready for grunt replace.
error = console.error;

mwsIndexUrl = "mobiwebsite/Index.html?site={wxAccountId}";
/*
 * freecoderConsole v0.2 部署在单独的目录中，为完成menu中的页面跳转，需要设置正确的context path。
 */
v2ContextPath = "/console2";

/*
 * demo后台服务的URL，当前用在公众号页面，向用户显示完整的服务链接。
 */
SERVICEURL = "$grunt_replace_serviceUrl";

/**
 * 本地服务器的用户上传目录
 * 本配置不能起作用，因为百度编辑器只在php文件里面起作用imageUp。php
 */
USER_UPLOADPATH_LOCAL = "/data/wlc-user-upload";
