//Q&A 폼
exports.getData = function(password){

    return html = '<tr>' + 
                    '<td style="padding:30px 30px 30px 30px;border-bottom:1px solid #f2eeed; background: #ffffff;">' + 
                        '<table width="100%" border="0" cellspacing="0" cellpadding="0">' +  
                            '<tr>' + 
                                '<td class="bodycopy" style="color:#153643;font-family:sans-serif;font-size:16px;line-height:22px;padding-top: 2%;"> <b>Temporary password: </b>' + 
                                password + '</td>' + 
                            '</tr>' + 
                        '</table>' + 
                    '</td>' + 
                '</tr>';
  };