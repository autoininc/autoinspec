
//메일 footer
exports.getData = function(link){

    return html = '<tr>' + 
                    '<td class="footer" bgcolor="#44525f" style="padding: 20px 30px 15px 30px;">' + 
                        '<table width="100%" border="0" cellspacing="0" cellpadding="0">' + 
                            '<tr>' + 
                                '<td align="center" class="footercopy" style="font-family: sans-serif; font-size: 14px; color: #ffffff;">® Copyright ©AUTOIN Inc. All Rights Reserved<br></td>' + 
                            '</tr>' + 
                            '<tr>' + 
                                '<td align="center" style="padding: 20px 0 0 0;">' + 
                                    '<table border="0" cellspacing="0" cellpadding="0">' + 
                                        '<tr>' + 
                                            '<td width="37" style="text-align: center; padding: 0 10px 0 10px;">' +
                                                '<a href="http://www.facebook.com/autoinspec"><img src="' + link + '/img/facebook.png" width="37" height="37" alt="Facebook" border="0" style="height: auto;"></a>' + 
                                            '</td>' + 
                                            '<td width="37" style="text-align: center; padding: 0 10px 0 10px;">' + 
                                                '<a href="http://instagram.com/autoinspec"><img src="' + link + '/img/instagram.png" width="37" height="37" alt="Instagram" border="0" style="height: auto;"></a>' +
                                            '</td>' + 
                                            '<td width="37" style="text-align: center; padding: 0 10px 0 10px;">' + 
                                                '<a href="http://www.linkedin.com/company/autoininc"><img src="' + link + '/img/linkedin.png" width="37" height="37" alt="Linkedin" border="0" style="height: auto;"></a>' + 
                                            '</td>' + 
                                        '</tr>' + 
                                    '</table>' + 
                                '</td>' + 
                            '</tr>' + 
                        '</table>' + 
                    '</td>' + 
                '</tr>' + 
            '</table></td></tr></table></body></html>';
  };