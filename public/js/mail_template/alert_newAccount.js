//이메일 인증 폼
exports.getData = function(last_name, first_name, email, company_id){

    return html = '<tr>' + 
                    '<td style="padding:30px 30px 30px 30px;border-bottom:1px solid #f2eeed; background: #ffffff;">' + 
                        '<table width="100%" border="0" cellspacing="0" cellpadding="0">' +  
                            '<tr>' + 
                                '<td class="bodycopy" style="color:#153643;font-family:sans-serif;font-size:16px;line-height:22px;padding-bottom: 1%;">' + last_name + ' ' + first_name + '(' + email + ')님이 신규 회원으로 가입했습니다.</td>' + 
                            '</tr>' + 
                        '</table>' + 
                    '</td>' + 
                '</tr>';
  };