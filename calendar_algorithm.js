$(document).ready(function(){
	var currentLangCode = 'zh-tw';
	//currentLangCode = "en";
	var json_data = [];
	var arr = [
		"經銷商別",
		"廠別",
		"職稱",
		"姓名",
		"起始日期",	
		"結束日期",	
		"假別",
		"事由",
		"廠長核准",
		"核准",
		"未核准原因",
		"代理人員"
	];
	var OK_words = [
		"可","可以","是","准許","准假","同意","沒問題","核准","已核准",
		"OK","okay","ok","yes","YES","agree"
	];
	var MITSUBISHI_time = {
		"day_on": 8,
		"day_off": 18,
		"lunch_time": 1.5
	};
	var CARSPA_time = {
		"day_on": 8.5,
		"day_off": 18,
		"lunch_time": 1
	};
	
	$.getJSON(
		'https://spreadsheets.google.com/feeds/list/1TDm8enoDYHh6NL7gB-DNC6NL2R1Du9-I4FFPV_nDCP4/1/public/values?alt=json-in-script&callback=?', function(json){
		var data = json.feed.entry;
		data_len = data.length;
		for(var i = 0; i < data_len; i++) {
			var entry = data[i];
			date = entry.gsx$日期.$t;
			title  = entry.gsx$假日名稱.$t;
			while (date.search("/") != -1)
				date = date.replace("/","-");
			
			var obj = new make_obj_back(title, true, date);
			json_data.push(obj);
			obj = new make_obj_holiday(title, true, date);
			json_data.push(obj);
		}
	});

	$.getJSON(
		'https://spreadsheets.google.com/feeds/list/1vJ3e1C0p0Vk6vZrcJuCjPwIPHlXgyZ4SQJD_8CfpRRE/1/public/values?alt=json-in-script&callback=?', function(json){
		var data = json.feed.entry;
		data_len = data.length;
		html = "";
		for(var i = 0; i < data_len; i++) {
			var entry = data[i];
			dealer        = entry.gsx$經銷商別.$t;
			factory       = entry.gsx$廠別.$t;
			title         = entry.gsx$職稱.$t;
			name          = entry.gsx$姓名.$t;
			start_date    = entry.gsx$起始日期.$t;
			end_date      = entry.gsx$結束日期.$t;
			type          = entry.gsx$假別.$t;
			reason        = entry.gsx$事由.$t;
			isCheckFirst  = entry.gsx$廠長核准.$t;
			isValid       = entry.gsx$核准.$t;
			cannot_reason = entry.gsx$未核准原因.$t;
			substitute    = entry.gsx$代理人員.$t;

			var isAgree = false;
			var OK_words_len = OK_words.length;
			for(var j = 0; j < OK_words_len; j++){
				if (isValid == OK_words[j]){
					isAgree = true;
					break;
				}
			}

			if (!isAgree) continue;	// if not valid application, ignore it

			var dateS = start_date.split(" ");
			var dateE = end_date.split(" ");
			var time = "00:00:00";
			var isSaturday = false;

			start_date = generateDate(dateS);
			end_date = generateDate(dateE);
			isSaturday = isContainSaturday(start_date, end_date);

			temp = type.search("\\(");
			if (temp != -1)
				type = type.substring(0, temp);

			var flag = true;
			if (type == "事假" && isSaturday) 
				flag = false;
			var obj = new make_obj(
				"\r\n" + dealer + " " + type + "\r\n" + factory + " " + title + " " + name + "\r\n代理人員：" + substitute,
				start_date,
				end_date,
				flag
			);
			json_data.push(obj);
		}
	}).done(function(){
		$('#calendar').fullCalendar({
			header: {
				left: 'prev,next today',
				center: 'title',
				right: 'month, agendaWeek, agendaDay'
			},
			lang: currentLangCode,
			buttonIcons: true, // show the prev/next text
			editable: true,
			//eventLimit: true, // allow "more" link when too many events
		  events: json_data,
		});

		$('#my-today-button').click(function(){
		  $('#calendar').fullCalendar('today');
		});
	}).fail(function(){
		console.log("fail");
	});
});

function make_obj(title, start, end, isvalid) {
	this.title  = title;
	this.start  = start;
	this.end    = end;
	if (!isValid)
		this.className = "invalid";
}

function make_obj_back(title, isallDay, start) {
	this.title = title;
	this.allDay = isallDay;
	this.start = start;
	this.rendering = 'background';
	this.color = "#ff9f89";
}

function make_obj_holiday(title, isallDay, start) {
	this.title = title;
	this.allDay = isallDay;
	this.start = start;
	this.color = "rgba(252, 251, 178, 0.82)";
	this.textColor = "#000";
	this.className
}

function generateDate(origin_date){
	var ret = "";
	if (origin_date[1] == "下午"){
		var temp = origin_date[2].split(":");
		var hour = parseInt(temp[0]) + 12;
		origin_date[2] = hour + ":" + temp[1];
	}
	else{
		var temp = origin_date[2].split(":");
		var hour = temp[0];
		if (temp[0] < 10)
			hour = "0" + temp[0];
		origin_date[2] = hour + ":" + temp[1];
	}
	
	while (origin_date[0].search("/") != -1)
		origin_date[0] = origin_date[0].replace("/","-");
	var temp = origin_date[0].split("-");
	if (parseInt(temp[1]) < 10)
		temp[1] = "0" + temp[1];
	if (parseInt(temp[2]) < 10)
		temp[2] = "0" + temp[2];
	origin_date[0] = temp[0] + "-" + temp[1] + "-" + temp[2];
	ret = origin_date[0] + "T" + origin_date[2];	// get the time format of ISO8601
	return ret;
}

function isContainSaturday(start_date, end_date) {
	if (moment(start_date).format("dddd") == "Saturday" || moment(end_date).format("dddd") == "Saturday")
		return true
	else if (start_date == end_date){
		return false;
	}
	else{
		var temp = "";
		var date_start = start_date.split("T");
		var date_end = end_date.split("T");
		var dateS = date_start[0];
		var dateE = date_end[0];

		temp = dateS.split("-");
		var s_year  = parseInt(temp[0], 10);
		var s_month = parseInt(temp[1], 10);
		var s_day   = parseInt(temp[2], 10);

		temp = dateE.split("-");
		var e_month = parseInt(temp[1], 10);
		var e_day   = parseInt(temp[2], 10);

		if (s_month == e_month){ // if the the same month
			s_day++;
			while (s_day < e_day){
				var the_date = "";	
				if (s_month < 10)
					s_month = "0" + s_month;
				if (s_day < 10)
					s_day = "0" + s_day;
				the_date = temp[0] + "-" + s_month + "-" + s_day;
				the_date += "T" + date_start[1];
				if (moment(the_date).format("dddd") == "Saturday")
					return true;
				s_day++;
			}
		}
		else{
			var month_day = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
			if (s_year % 400 == 0 || (s_year % 4 == 0 && !(s_year % 100 == 0))) // 閏年判斷
    		month_day[1] = 29;
    	var month_tail = month_day[s_month - 1];
    	while ((month_tail - s_day) >= 1){ // 7-14 9:00 ~ 7-15 15:00
        var the_date = "";	
        if (s_month < 10)
        	s_month = "0" + s_month;
        if (s_day < 10)
        	s_day = "0" + s_day;
        the_date = temp[0] + "-" + s_month + "-" + s_day;
        the_date += "T" + date_start[1];
        if (moment(the_date).format("dddd") == "Saturday")
        	return true;
        s_day++;
      }

      var i = 1;
      while ((e_day - i) >= 1){
      	start_day = i;
        var the_date = "";	
        if (e_month < 10)
        	e_month = "0" + e_month;
        if (start_day < 10)
        	start_day = "0" + start_day;
        the_date = temp[0] + "-" + e_month + "-" + start_day;
        the_date += "T" + date_start[1];
        if (moment(the_date).format("dddd") == "Saturday")
        	return true;
        i++;
      }
		}
		return false;
	}
}