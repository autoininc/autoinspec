//새로운 질문이 등록되었을 때 알림 메일용 Q&A 폼
exports.getData = function(link, email, type, companyId, title, contents){

    return html = '<tr>' +  
                    '<td style="padding:30px 30px 30px 30px;border-bottom:1px solid #f2eeed; background: #ffffff;">' + 
                        '<table width="100%" border="0" cellspacing="0" cellpadding="0">' +
                            '<tr>' + 
                                '<td class="h2" style="color:#07c6b4;font-family:sans-serif;padding:0 0 15px 0;font-size:24px;line-height:28px;font-weight:bold;">Question' + '</td>' + 
                            '</tr>' + 
                            '</tr>' + 
                                '<td class="bodycopy" style="color:#153643;font-family:sans-serif;font-size:16px;line-height:22px; padding-bottom: 1%;"><b>Email:</b> ' + email + '</td>' + 
                            '</tr>' + 
                            '<tr>' + 
                                '<td class="bodycopy" style="color:#153643;font-family:sans-serif;font-size:16px;line-height:22px; padding-bottom: 1%;"><b>Type:</b> ' +
                                ((type == 2) ? 'Request to add New company' : '') +
                                ((type == 3) ? 'Request to modify existing company information (' + companyId + ')' : '') +
                                ((type == 4) ? 'Etc' : '') + '</td>' + 
                            '</tr>' + 
                                '<td class="bodycopy" style="color:#153643;font-family:sans-serif;font-size:16px;line-height:22px; padding-bottom: 1%;"><b>Title:</b> ' + title + '</td>' + 
                            '</tr>' + 
                            '<tr>' + 
                                '<td class="bodycopy" style="padding: 20px;border: 1px solid #ccc;border-radius: 2px;font-family:sans-serif;font-size:16px;line-height:22px;">' + contents + '</td>' + 
                            '</tr>' + 
                        '</table>' + 
                    '</td>' + 
                '</tr>';
  };