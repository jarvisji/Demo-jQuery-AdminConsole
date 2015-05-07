define(["app/common/AjaxHelper", "jquery.loadTemplate"], function(ajaxHelper) {
	var emotionImageList = {
		'01.gif' : '/微笑',
		'02.gif' : '/撇嘴',
		'03.gif' : '/色',
		'04.gif' : '/发呆',
		'05.gif' : '/得意',
		'06.gif' : '/流泪',
		'07.gif' : '/害羞',
		'08.gif' : '/闭嘴',
		'09.gif' : '/睡',
		'10.gif' : '/大哭',
		'11.gif' : '/尴尬',
		'12.gif' : '/发怒',
		'13.gif' : '/调皮',
		'14.gif' : '/呲牙',
		'15.gif' : '/惊讶',
		'16.gif' : '/难过',
		'17.gif' : '/酷',
		'18.gif' : '/冷汗',
		'19.gif' : '/抓狂',
		'20.gif' : '/吐',
		'21.gif' : '/偷笑',
		'22.gif' : '/可爱',
		'23.gif' : '/白眼',
		'24.gif' : '/傲慢',
		'25.gif' : '/饥饿',
		'26.gif' : '/困',
		'27.gif' : '/惊恐',
		'28.gif' : '/流汗',
		'29.gif' : '/憨笑',
		'30.gif' : '/大兵',
		'31.gif' : '/奋斗',
		'32.gif' : '/咒骂',
		'33.gif' : '/疑问',
		'34.gif' : '/嘘',
		'35.gif' : '/晕',
		'36.gif' : '/折磨',
		'37.gif' : '/衰',
		'38.gif' : '/骷髅',
		'39.gif' : '/敲打',
		'40.gif' : '/再见',
		'41.gif' : '/擦汗',
		'42.gif' : '/抠鼻',
		'43.gif' : '/鼓掌',
		'44.gif' : '/糗大了',
		'45.gif' : '/坏笑',
		'46.gif' : '/左哼哼',
		'47.gif' : '/右哼哼',
		'48.gif' : '/哈欠',
		'49.gif' : '/鄙视',
		'50.gif' : '/委屈',
		'51.gif' : '/快哭了',
		'52.gif' : '/阴险',
		'53.gif' : '/亲亲',
		'54.gif' : '/吓',
		'55.gif' : '/可怜',
		'56.gif' : '/菜刀',
		'57.gif' : '/西瓜',
		'58.gif' : '/啤酒',
		'59.gif' : '/篮球',
		'60.gif' : '/篮球',
		'61.gif' : '/咖啡',
		'62.gif' : '/饭',
		'63.gif' : '/猪头',
		'64.gif' : '/玫瑰',
		'65.gif' : '/凋谢',
		'66.gif' : '/示爱',
		'67.gif' : '/爱心',
		'68.gif' : '/心碎',
		'69.gif' : '/蛋糕',
		'70.gif' : '/闪电',
		'71.gif' : '/炸弹',
		'72.gif' : '/刀',
		'73.gif' : '/足球',
		'74.gif' : '/瓢虫',
		'75.gif' : '/便便',
		'76.gif' : '/月亮',
		'77.gif' : '/太阳',
		'78.gif' : '/礼物',
		'79.gif' : '/拥抱',
		'80.gif' : '/强',
		'81.gif' : '/弱',
		'82.gif' : '/握手',
		'83.gif' : '/胜利',
		'84.gif' : '/抱拳',
		'85.gif' : '/勾引',
		'86.gif' : '/拳头',
		'87.gif' : '/差劲',
		'88.gif' : '/爱你',
		'89.gif' : '/NO',
		'90.gif' : '/OK',
		'91.gif' : '/爱情',
		'92.gif' : '/飞吻',
		'93.gif' : '/跳跳',
		'94.gif' : '/发抖',
		'95.gif' : '/怄火',
		'96.gif' : '/转圈',
		'97.gif' : '/磕头',
		'98.gif' : '/回头',
		'99.gif' : '/跳绳',
		'100.gif' : '/挥手',
		'101.gif' : '/激动',
		'102.gif' : '/街舞',
		'103.gif' : '/献吻',
		'104.gif' : '/左太极',
		'105.gif' : '/右太极'
	};

	function htmlToText(content) {
		content = "<div id=\"edit\">" + content + "</div>";
		content = content.replace(/<.p?>/gim, '');
		content = content.replace(/<br.>/gim, '');
		var value = $(content).clone();
		$(value).find("img").each(function() {
			var src = $(this).attr("src");
			var url = src.split("weixin");
			var name = url[1].split("/");
			$(this).after(emotionImageList[name[1]]);
			$(this).remove();
		});
		return value;
	}
	
	/*
	 * get  emotionImageList length
	 */
	function getEmotionImageListLength(){
		var lengthNumber=1;
		for(var i in  emotionImageList ){
			lengthNumber++
		}
		return lengthNumber;
	}
	

	function textToHtml(text) {
		var documentURL = self.document.URL || self.location.href;
		var weburl = documentURL.split('/');
		var ExpressionUrl = documentURL.replace(weburl[weburl.length - 1], "");
		var imgurl = ExpressionUrl + "umeditor/dialogs/emotion/images/weixin/";
		var textArray = text.split('');
		for (var i = 0; i < textArray.length; i++) {
			if (textArray[i] == "/") {
				for (var j = 1; j <getEmotionImageListLength(); j++) {
					if (j < 10) {
						j = "0" + j;
					}

					if (emotionImageList[j + ".gif"] ==getWordString(textArray,i,1)) {
						text = text.replace(getWordString(textArray,i,1), imgHtml(imgurl + j + ".gif"));
					} else if (emotionImageList[j + ".gif"] == getWordString(textArray,i,2)) {
						text = text.replace(getWordString(textArray,i,2), imgHtml(imgurl + j + ".gif"));
					} else if (emotionImageList[j + ".gif"] ==getWordString(textArray,i,3)) {
						text = text.replace(getWordString(textArray,i,3), imgHtml(imgurl + j + ".gif"));
					}
				}
			}
		}
		return text;
	}

   function getWord(textArray,i){
   	   return textArray[i];
   }
   
   /*
    * get string  
    * String array,start position, length
    * return String 
    */
   function getWordString(textArray,startPosition,len){
   	   var words="";
   	   for(var i=0;i<=len;i++){
   	   	   words=words+getWord(textArray,startPosition+i); 
   	   }
   	  return words;
   }


	function imgHtml(url) {
		return '<img src="' + url + '" />';
	}

	return {
		"htmlToText" : htmlToText,
		"textToHtml" : textToHtml
	}

});
