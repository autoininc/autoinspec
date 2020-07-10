
//환율 적용쓰
exports.getData = function(link, qna, answer){

    return html = '<tr>' + 
                    '<td class="innerpadding borderbottom" style="padding:30px 30px 30px 30px;border-bottom:1px solid #f2eeed;">' + 
                        '<table width="100%" border="0" cellspacing="0" cellpadding="0">' + 
                            '<tr>' + 
                                '<td class="h2" style="color:#153643;font-family:sans-serif;padding:0 0 15px 0;font-size:24px;line-height:28px;font-weight:bold;">Answer</td>' + 
                            '</tr>' + 
                            '<tr>' + 
                                '<td class="bodycopy" style="color:#153643;font-family:sans-serif;font-size:16px;line-height:22px;">Title : ' + answer[0].title + '</td>' + 
                            '</tr>' + 
                            '<tr>' + 
                                '<td class="bodycopy" style="color:#153643;font-family:sans-serif;font-size:16px;line-height:22px;">Contents : ' + answer[0].contents + ((answer[0].filename != '') ? '</td>' + 
                            '</tr>' + 
                            '<tr>' + 
                                '<td class="bodycopy" style="color:#153643;font-family:sans-serif;font-size:16px;line-height:22px;">Attached file : ' + 
                                '<a href="' + link + '/account/qna/answerDownload/' + answer[0].id +'" >' + answer[0].filename + '</a>' : '') + '</td>' + 
                            '</tr>' + 
                        '</table>' + 
                    '</td>' + 
                '</tr>' + 
                '<tr>' + 
                    '<td class="innerpadding borderbottom" style="padding:30px 30px 30px 30px;border-bottom:1px solid #f2eeed;">' + 
                        '<table width="100%" border="0" cellspacing="0" cellpadding="0">' +
                            '<tr>' + 
                                '<td class="h2" style="color:#153643;font-family:sans-serif;padding:0 0 15px 0;font-size:24px;line-height:28px;font-weight:bold;">Question' + '</td>' + 
                            '</tr>' + 
                            '<tr>' + 
                                '<td class="bodycopy" style="color:#153643;font-family:sans-serif;font-size:16px;line-height:22px;">Type : ' +
                                ((qna[0].type == 2) ? 'Request to add New company' : '') +
                                ((qna[0].type == 3) ? 'Request to modify existing company information (' + qna[0].name_eng + ')' : '') +
                                 ((qna[0].type == 4) ? 'Etc' : '') + '</td>' + 
                            '</tr>' + 
                            '<tr>' + 
                                '<td class="bodycopy" style="color:#153643;font-family:sans-serif;font-size:16px;line-height:22px;">Title : ' + qna[0].title + '</td>' + 
                            '</tr>' + 
                            '<tr>' + 
                                '<td class="bodycopy" style="color:#153643;font-family:sans-serif;font-size:16px;line-height:22px;">Contents : ' + qna[0].contents + ((qna[0].filename != '') ? '</td>' + 
                            '</tr>' + 
                            '<tr>' + 
                                '<td class="bodycopy" style="color:#153643;font-family:sans-serif;font-size:16px;line-height:22px;">Attached file : ' + 
                                '<a href="' + link + '/account/qna/download/' + qna[0].id +'" >' + qna[0].filename + '</a>' : '') + '</td>' + 
                            '</tr>' + 
                        '</table>' + 
                    '</td>' + 
                '</tr>';
  };