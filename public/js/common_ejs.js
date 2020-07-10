//숫자 천 단위마다 콤마(,)
function comma(num){
  var len, point, str; 
    
  num = num + ""; 
  point = num.length % 3 ;
  len = num.length; 

  str = num.substring(0, point); 
  while (point < len) { 
      if (str != "") str += ","; 
      str += num.substring(point, point + 3); 
      point += 3; 
  } 
  return str;
}

//키 만듦
function makeid(length){
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

//파라미터 가져옴
function getParameterByName(name){
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
  results = regex.exec(location.search);
  return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

//html 디코더 시킴
function htmlDecode(input){
  var e = document.createElement('div');
  e.innerHTML = input;
  return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
}

//엑셀 데이터에는 탭문자나 공백키가 포함되어 있어서 제거해 줘야한다.
function removeBlankExcelData(str){

  var data = ''+str;
  if (data == undefined || data == 'undefined') { data = ""; }

  data = data.toString();

  return data.replace((/  |\r\n|\n|\r/gm),"").replace(/\s$/gi, "");
}

function transpose(a){
  // Calculate the width and height of the Array
  var w = a.length || 0;
  var h = a[0] instanceof Array ? a[0].length : 0;

  // In case it is a zero matrix, no transpose routine needed.
  if(h === 0 || w === 0) { return []; }

  /**
      * @var {Number} i Counter
      * @var {Number} j Counter
      * @var {Array} t Transposed data is stored in this array.
      */
  var i, j, t = [];

  // Loop through every item in the outer array (height)
  for(i=0; i<h; i++) {
      // Insert a new row (array)
      t[i] = [];
      // Loop through every item per item in outer array (width)
      for(j=0; j<w; j++) {
          // Save transposed data.
          t[i][j] = a[j][i];
      }
  }
  return t;
}

function replaceAll(str, searchStr, replaceStr){
  str = str.toString();
  return str.split(searchStr).join(replaceStr);
}


//환율 적용쓰
function formatMoney(symbol, price, value, decPlaces, thouSeparator, decSeparator){

  var amount = parseInt(replaceAll(price, ",", ""));  // 원화가격
  var rate = parseFloat(value);  // 환율
  var change_amount = amount / rate;  // 원화가격을 환율로 나눠 달러가격을 구함

  var n = change_amount,
  decPlaces = isNaN(decPlaces = Math.abs(decPlaces)) ? 2 : decPlaces,
  decSeparator = decSeparator == undefined ? "." : decSeparator,
  thouSeparator = thouSeparator == undefined ? "," : thouSeparator,
  sign = n < 0 ? "-" : "",
  i = parseInt(n = Math.abs(+n || 0).toFixed(decPlaces)) + "",
  j = (j = i.length) > 3 ? j % 3 : 0;
  
  return symbol + "" +sign + (j ? i.substr(0, j) + thouSeparator : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thouSeparator) + (decPlaces ? decSeparator + Math.abs(n - i).toFixed(decPlaces).slice(2) : "");
};

function formatMoney2(symbol, price, value, decPlaces, thouSeparator, decSeparator){

  var amount = parseInt(replaceAll(price, ",", ""));  // 원화가격
  var rate = parseFloat(value);  // 환율
  var change_amount = amount / rate;  // 원화가격을 환율로 나눠 달러가격을 구함

  var n = change_amount,
  decPlaces = isNaN(decPlaces = Math.abs(decPlaces)) ? 2 : decPlaces,
  decSeparator = decSeparator == undefined ? "." : decSeparator,
  thouSeparator = thouSeparator == undefined ? "," : thouSeparator,
  sign = n < 0 ? "-" : "",
  i = parseInt(n = Math.abs(+n || 0).toFixed(decPlaces)) + "",
  j = (j = i.length) > 3 ? j % 3 : 0;
  
  return sign + (j ? i.substr(0, j) + thouSeparator : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thouSeparator) + (decPlaces ? decSeparator + Math.abs(n - i).toFixed(decPlaces).slice(2) : "");
};

//hex -> rgb (색상 변환)
function hexToRGB(hex, alpha) {
  var r = parseInt(hex.slice(1, 3), 16),
      g = parseInt(hex.slice(3, 5), 16),
      b = parseInt(hex.slice(5, 7), 16);

  if (alpha) {
      return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
  } else {
      return "rgb(" + r + ", " + g + ", " + b + ")";
  }
}