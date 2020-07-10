
//메일 header
exports.getData = function(link){

    return html = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">' +
                    '<html xmlns="http://www.w3.org/1999/xhtml">' + 
                        '<head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head>' +
                            '<body yahoo bgcolor="#f6f8f1" style="margin: 0 auto; padding: 0 30%; min-width: 100%!important;">' + 
                                '<table width="100%" bgcolor="#f6f8f1" style="padding: 2% 5%;" border="0" cellpadding="0" cellspacing="0">' +
                                    '<tr>' + 
                                        '<td>' +
                                            '<table bgcolor="#44525f" class="content" align="center" cellpadding="0" cellspacing="0" border="0" style="width: 100%;">' + 
                                                '<tr>' + 
                                                    '<td bgcolor="#44525f" class="header" style="padding: 8px 0px 4px 6px;">' +
                                                        '<table width="200" align="center" border="0" cellpadding="0" cellspacing="0">' +
                                                            '<tr>' + 
                                                                '<td height="100" style="padding: 8px 20px 12px 22px;">' + 
                                                                    '<a href="http://www.autoinspec.com" target="_blank">' + 
                                                                        '<img class="fix" src="' + link + '/img/logo.png" width="175" height="65" border="0" alt="" style="height: auto;">' +
                                                                    '</a>' +
                                                                '</td>' + 
                                                            '</tr>' + 
                                                        '</table>' + 
                                                    '</td>' + 
                                                '</tr>' +
                                            '</table>' + 
                                        '</td>' + 
                                    '</tr>';
  };