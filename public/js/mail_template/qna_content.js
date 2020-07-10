//Q&A 폼
exports.getData = function(link, qna, answer){

    return html = '<tr>' + 
                    '<td style="padding:30px 30px 30px 30px;border-bottom:1px solid #f2eeed; background: #ffffff;">' + 
                        '<table width="100%" border="0" cellspacing="0" cellpadding="0">' + 
                            '<tr>' + 
                                '<td class="h2" style="color:#07c6b4;font-family:sans-serif;padding:0 0 15px 0;font-size:24px;line-height:28px;font-weight:bold;">Answer</td>' + 
                            '</tr>' + 
                            '<tr>' + 
                                '<td class="bodycopy" style="color:#153643;font-family:sans-serif;font-size:16px;line-height:22px;padding-bottom: 1%;"><b>Title:</b> ' + answer[0].title + '</td>' + 
                            '</tr>' + 
                            '<tr>' + 
                                '<td class="bodycopy" style="padding: 20px;border: 1px solid #ccc;border-radius: 2px;font-family:sans-serif;font-size:16px;line-height:22px;">' + answer[0].contents + '</td>' + 
                            '</tr>' + 
                            ((answer[0].filename != '') ?
                            '<tr>' + 
                                '<td class="bodycopy" style="color:#153643;font-family:sans-serif;font-size:16px;line-height:22px;padding-top: 2%;"><b>Attached file:</b> ' + 
                                '<a href="' + link + '/account/qna/answerDownload/' + answer[0].id +'" >' + answer[0].filename + '</a>' : '') + '</td>' + 
                            '</tr>' + 
                        '</table>' + 
                    '</td>' + 
                '</tr>' + 
                '<tr>' + 
                    '<td style="padding:30px 30px 30px 30px;border-bottom:1px solid #f2eeed; background: #ffffff;">' + 
                        '<table width="100%" border="0" cellspacing="0" cellpadding="0">' +
                            '<tr>' + 
                                '<td class="h2" style="color:#07c6b4;font-family:sans-serif;padding:0 0 15px 0;font-size:24px;line-height:28px;font-weight:bold;">Question' + '</td>' + 
                            '</tr>' + 
                            '<tr>' + 
                                '<td class="bodycopy" style="color:#153643;font-family:sans-serif;font-size:16px;line-height:22px; padding-bottom: 1%;"><b>Type:</b> ' +
                                ((qna[0].type == 2) ? 'Request to add New company' : '') +
                                ((qna[0].type == 3) ? 'Request to modify existing company information (' + qna[0].name_eng + ')' : '') +
                                 ((qna[0].type == 4) ? 'Etc' : '') + '</td>' + 
                            '</tr>' + 
                            '<tr>' + 
                                '<td class="bodycopy" style="color:#153643;font-family:sans-serif;font-size:16px;line-height:22px; padding-bottom: 1%;"><b>Title:</b> ' + qna[0].title + '</td>' + 
                            '</tr>' + 
                            '<tr>' + 
                                '<td class="bodycopy" style="padding: 20px;border: 1px solid #ccc;border-radius: 2px;font-family:sans-serif;font-size:16px;line-height:22px;">' + qna[0].contents + '</td>' + 
                            '</tr>' + 
                            ((qna[0].filename != '') ? 
                            '<tr>' + 
                            '<td class="bodycopy" style="color:#153643;font-family:sans-serif;font-size:16px;line-height:22px;padding-top: 2%;"><b>Attached file:</b> ' + 
                                '<a href="' + link + '/account/qna/download/' + qna[0].id +'" >' + qna[0].filename + '</a>' : '') + '</td>' + 
                            '</tr>' + 
                        '</table>' + 
                    '</td>' + 
                '</tr>';
  };