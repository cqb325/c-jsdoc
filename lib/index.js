/**
 * @author sony
 */
$(function(){
	$(".tab_bt").click(function(){
		if (!$(this).hasClass("active")) {
			$(".tab_bt").removeClass("active");
			$(this).addClass("active");
			var href = $("a", this).attr("href");
			$(".tab_cont").hide();
			$(href).show();
		}
		return false;
	}).eq(0).click();
	
	$(".item").click(function(){
		if($(this).hasClass("method")){
			$(".tab_bt a[href='#method']").click();
		}
		if($(this).hasClass("property")){
			$(".tab_bt a[href='#property']").click();
		}
		var href = $("a", this).attr("href");
	});
	
	$(".tab-label").parent().click(function(){
		if (!$(this).hasClass("active")) {
			$(".tab-label").parent().removeClass("active");
			$(this).addClass("active");
			var href = $("a",this).attr("href");
			$(".tab-panel").hide();
			$(href).show();
		}
	}).eq(0).click();
	
	
	$("#api-filter").keyup(function(){
		var key = $.trim($(this).val()).toLowerCase();
		if(key != ""){
			$(".api-list-item").show();
			$(".api-list-item a", $(".tab-panel:visible")).each(function(){
				var api = $(this).text();
				var lowapi = api.toLowerCase();
				var index = lowapi.indexOf(key);
				if(index > -1){
					var text_b = api.substring(0,index);
					var text_c = api.substr(index,key.length);
					var text_a = api.substring(index+key.length,api.length);
					$(this).html(text_b+"<b class='highlight'>"+text_c+"</b>"+text_a);
				}else{
					$(this).parent().hide();
				}
			});
		}
	});
	
//	$(".api-list-item").click(function(){
//		var href = $(this).children("a").attr("href");
//		$(".right_frame").attr("src",href);
//		return false;
//	});
});
