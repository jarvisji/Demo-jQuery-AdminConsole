<?php
/**
 * Requests for service those are not intent in login protection, will be placed here. This is the other way to call backend service except ajax.php.
 * - Process login, save userId, wxAccountId, cred in session, append to reuqest automatically.
 * - Create and destory session in this page.
 * - Process register.
 */
session_start();
require_once ("Config.php");
require_once (__DIR__ . "/bootstrap.php");
use \Httpful\Request;

if (isset($_GET["logout"])) {
	session_destroy();
	header("Location: ../Login.html");
} else if (isset($_GET["register"])) {
	// user register.
	$data = json_encode($_POST);
	//TODO:J implement signature generation, will resolve the security issue.
	$url = SERVICEURL . "/user";
	$response = Request::post($url, $data) -> sendsJson() -> send();
} else {
	// handle normal login case.
	$email = $_POST["email"];
	$password = $_POST["password"];

	//TODO:J implement signature generation, will resolve the security issue.
	$url = SERVICEURL . "/credential?email=" . $email . "&password=" . $password;

	// send out request.
	$response = Request::get($url) -> send();
	// save sessions.
	if ($response -> body -> success) {
		$_SESSION["userId"] = $response -> body -> data -> userId;
		$_SESSION["cred"] = $response -> body -> data -> cred;
		$_SESSION["modules"] = $response -> body -> data -> modules;
		$_SESSION["serviceInfo"] = array('endDate'=>$response -> body -> data -> serviceEndDate,
		'status'=>$response -> body -> data -> serviceStatus);
	}
}
// send response to client.
header("Content-Type:application/json;charset=utf-8");
echo json_encode($response -> body);
?>