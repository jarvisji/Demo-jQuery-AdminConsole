<?php
// Redirect pages.
session_start();

if (isset($_GET["wxAccountId"])) {
	$_SESSION["wxAccountId"] = $_GET["wxAccountId"];
}

header("Location: ../WxAccountIndex.html");
?>